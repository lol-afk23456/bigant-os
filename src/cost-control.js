import {AppError, requireOwner, uid} from './store.js';

const monthFormat = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Rome', year:'numeric', month:'2-digit'});
export function createCostControl({store:s, clock=()=>new Date()}) {
  s.db.exec(`CREATE TABLE IF NOT EXISTS os_budget_reconciliations (
    id TEXT PRIMARY KEY, month TEXT NOT NULL, version INTEGER NOT NULL,
    external_cents INTEGER NOT NULL CHECK(external_cents>=2000),
    confirmed_by TEXT NOT NULL REFERENCES os_users(id), confirmed_at TEXT NOT NULL,
    UNIQUE(month,version)
  );
  CREATE TRIGGER IF NOT EXISTS os_budget_reconciliations_no_update BEFORE UPDATE ON os_budget_reconciliations BEGIN SELECT RAISE(ABORT,'Verifica budget immutabile'); END;
  CREATE TRIGGER IF NOT EXISTS os_budget_reconciliations_no_delete BEFORE DELETE ON os_budget_reconciliations BEGIN SELECT RAISE(ABORT,'Verifica budget immutabile'); END;`);
  const month=()=>monthFormat.format(clock());
  function owner(user) {
    requireOwner(user);
    const current=s.one("SELECT * FROM os_users WHERE id=? AND role='owner' AND active=1 AND must_change_password=0",user.id);
    if (!current || user.id==='os-orchestrator') throw new AppError('Verifica del budget riservata a un socio autorizzato.',403);
    if (user.session_id && !s.one('SELECT 1 FROM os_sessions WHERE id=? AND user_id=? AND expires_at>?',user.session_id,user.id,clock().getTime())) throw new AppError('Sessione scaduta. Accedi di nuovo.',401);
    return current;
  }
  function snapshot() {
    const currentMonth=month(), row=s.one('SELECT * FROM os_budget_reconciliations WHERE month=? ORDER BY version DESC LIMIT 1',currentMonth);
    const valid=!!row && row.confirmed_by!=='os-orchestrator' && !!s.one("SELECT 1 FROM os_users WHERE id=? AND role='owner' AND active=1 AND must_change_password=0",row.confirmed_by);
    const amounts=s.one("SELECT COALESCE(SUM(CASE WHEN month=? THEN cents ELSE 0 END),0) current_cents,COALESCE(SUM(CASE WHEN month<>? AND status='reserved' THEN cents ELSE 0 END),0) previous_cents FROM os_costs WHERE status IN('reserved','charged')",currentMonth,currentMonth);
    const configuredCap=Number(s.getSetting('budget_cents')), capCents=Number.isSafeInteger(configuredCap)&&configuredCap>0?Math.min(5000,configuredCap):0;
    const stopCents=Math.floor(capCents*80/100), usedCents=amounts.current_cents+amounts.previous_cents;
    const totalCents=valid?row.external_cents+usedCents:null;
    const reason=!valid?'Verifica i consumi e gli impegni esterni del mese prima di autorizzare spese.':totalCents>=stopCents?'Soglia di stop raggiunta: nuove operazioni a pagamento bloccate.':null;
    const confirmedName=row?s.one('SELECT name FROM os_users WHERE id=?',row.confirmed_by)?.name:null;
    return {month:currentMonth,version:row?.version||0,verified:valid,externalCents:row?.external_cents??null,osCents:amounts.current_cents,previousReservedCents:amounts.previous_cents,totalCents,capCents,stopCents,confirmedName:confirmedName||null,
      availableCents:valid?Math.max(0,stopCents-totalCents-1):0,blocked:!!reason,reason,confirmedBy:row?.confirmed_by||null,confirmedAt:row?.confirmed_at||null};
  }
  function state(user) {owner(user);return snapshot();}
  function confirm(user,b={}) {
    const actor=owner(user);
    if (b.confirmed!==true || !Number.isSafeInteger(b.externalCents) || b.externalCents<2000 || b.externalCents>100_000_000) throw new AppError('Conferma tutti i costi esterni del mese, includendo almeno 20 € Railway. Usa centesimi interi.');
    return s.transaction(()=>{
      const before=snapshot();
      if(b.month!==before.month || b.version!==before.version) throw new AppError('Mese o verifica del budget cambiati. Ricarica prima di confermare.',409);
      const id=uid();
      s.run('INSERT INTO os_budget_reconciliations VALUES(?,?,?,?,?,?)',id,before.month,before.version+1,b.externalCents,actor.id,clock().toISOString());
      s.audit(actor,null,'Consumi esterni del mese verificati',id,{month:before.month,version:before.version+1,externalCents:b.externalCents},'admin');
      return snapshot();
    });
  }
  // Must be called inside the same SQLite transaction that inserts the reservation.
  function assertCanReserve(cents) {
    if(!Number.isSafeInteger(cents)||cents<0) throw new AppError('Costo non valido.');
    if(cents===0)return;
    const current=snapshot();
    if(!current.verified)throw new AppError(current.reason,409);
    if(current.totalCents+cents>=current.stopCents)throw new AppError('Soglia di stop del budget: questa operazione raggiungerebbe l’80% del tetto mensile. Nessuna chiamata a pagamento avviata.',409);
  }
  function assertReserved(id) {
    const reservation=s.one("SELECT * FROM os_costs WHERE id=? AND status='reserved'",id),current=snapshot();
    if(!reservation || reservation.month!==current.month)throw new AppError('Prenotazione scaduta o non disponibile. Verifica il budget del mese.',409);
    if(!current.verified)throw new AppError(current.reason,409);
    if(current.totalCents>=current.stopCents)throw new AppError('Soglia di stop raggiunta prima della chiamata. Nessuna spesa avviata.',409);
  }
  return {month,state,snapshot,confirm,assertCanReserve,assertReserved};
}
