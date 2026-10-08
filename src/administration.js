import { createHash } from 'node:crypto';
import { AppError, integer, text, uid } from './store.js';

const LIMIT = 1_000_000_000_000;
const DAY = 86400000;
function required(value, label, max=240) { const v=text(value,max); if(!v) throw new AppError(`${label} obbligatorio.`); return v; }
function date(value) {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new AppError('Data richiesta nel formato YYYY-MM-DD.');
  const d=new Date(value+'T00:00:00Z');
  if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value) throw new AppError('Data non valida.');
  return value;
}
function month(value) { if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(value||'')) throw new AppError('Mese non valido.'); return value; }
function endMonth(value) { const [y,m]=month(value).split('-').map(Number); return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10); }
function addDays(value,days) { return new Date(new Date(value+'T00:00:00Z').getTime()+days*DAY).toISOString().slice(0,10); }
function addMonths(value,count) { const [y,m,d]=date(value).split('-').map(Number),max=new Date(Date.UTC(y,m-1+count+1,0)).getUTCDate(); return new Date(Date.UTC(y,m-1+count,Math.min(d,max))).toISOString().slice(0,10); }
function cents(value, signed=false) { return integer(value,signed?-LIMIT:1,LIMIT); }
function sum(rows,key) { const value=rows.reduce((total,row)=>total+Number(typeof key==='function'?key(row):row[key]),0); if(!Number.isSafeInteger(value)||Math.abs(value)>LIMIT*1000) throw new AppError('Totale monetario fuori intervallo.'); return value; }
function canonical(value) { if(Array.isArray(value)) return value.map(canonical); if(value&&typeof value==='object') return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])); return value; }
const signedAmount=row=>(row.direction===(row.kind==='income'?'in':'out')?1:-1)*row.amount_cents;
function hourlyCost(minutes,rate) { integer(minutes,0,1000000); integer(rate,0,LIMIT); const cost=(BigInt(minutes)*BigInt(rate)+30n)/60n; if(cost>BigInt(Number.MAX_SAFE_INTEGER)) throw new AppError('Costo ore fuori intervallo.'); return Number(cost); }
const RULES = [
  ['invoice_overdue','Credito scaduto o canone non incassato','implemented'],
  ['partial_payment','Incasso parziale oltre scadenza','implemented'],
  ['payment_mismatch','Incasso diverso dall’importo dovuto (non ancora scaduto)','implemented'],
  ['missing_document','Movimento privo di documento','implemented'],
  ['possible_duplicate','Possibile doppio movimento su documento/data/importo','implemented'],
  ['entity_mismatch','Ditta incoerente con conto o documento','implemented'],
  ['missing_category','Categoria mancante','implemented'],
  ['subscription_increase','Costo abbonamento sopra importo concordato','implemented'],
  ['subscription_duplicate','Abbonamenti attivi con stesso fornitore e servizio','implemented'],
  ['subscription_missing','Rinnovo atteso senza movimento registrato','implemented'],
  ['obligation_overdue','Compenso o scadenza non saldato','implemented'],
  ['owner_overdraw','Prelievi oltre accordo o conto sotto zero','implemented'],
  ['reconciliation_difference','Quadratura conto/mese non riuscita','implemented'],
  ['contract_expiring','Contratto prossimo alla scadenza','implemented'],
  ['tracker_mismatch','Confronto Prima Nota/Tracker reali','not_connected'],
  ['unusual_expense','Spesa statisticamente insolita rispetto allo storico','not_implemented'],
  ['tax_threshold','Soglie e accantonamenti fiscali','awaiting_accountant'],
  ['unrecorded_payment','Pagamento reale assente da ogni fonte interna','needs_external_statement']
].map(([id,label,status])=>({id,label,status}));

export function createAdministrationModule({store:s,clock=()=>new Date()}) {
  const today=()=>date(new Date(clock()).toISOString().slice(0,10));
  const stamp=()=>new Date(clock()).toISOString();
  function owner(user) { if(!user||user.role!=='owner'||user.active===0||user.active===false) throw new AppError('Amministrazione riservata ai soci BigAnt.',403); }
  const get=(table,id,label)=>{ const r=s.one(`SELECT * FROM os_fin_${table} WHERE id=?`,required(id,label)); if(!r) throw new AppError(`${label} non trovato.`,404); return r; };
  s.db.exec(`
    CREATE TABLE IF NOT EXISTS os_fin_entities(id TEXT PRIMARY KEY,name TEXT NOT NULL,tax_rules_confirmed INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS os_fin_accounts(id TEXT PRIMARY KEY,entity_id TEXT NOT NULL REFERENCES os_fin_entities(id),name TEXT NOT NULL,opening_cents INTEGER NOT NULL CHECK(typeof(opening_cents)='integer'),opening_date TEXT NOT NULL,currency TEXT NOT NULL DEFAULT 'EUR');
    CREATE TABLE IF NOT EXISTS os_fin_counterparties(id TEXT PRIMARY KEY,kind TEXT NOT NULL CHECK(kind IN('client','supplier','collaborator','owner')),name TEXT NOT NULL,client_id TEXT REFERENCES os_clients(id),document_ref TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS os_fin_contracts(id TEXT PRIMARY KEY,entity_id TEXT NOT NULL REFERENCES os_fin_entities(id),counterparty_id TEXT NOT NULL REFERENCES os_fin_counterparties(id),client_id TEXT REFERENCES os_clients(id),service TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents>0),start_date TEXT NOT NULL,end_date TEXT NOT NULL,notice_days INTEGER NOT NULL DEFAULT 30,document_ref TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'active');
    CREATE TABLE IF NOT EXISTS os_fin_invoices(id TEXT PRIMARY KEY,entity_id TEXT NOT NULL REFERENCES os_fin_entities(id),counterparty_id TEXT NOT NULL REFERENCES os_fin_counterparties(id),client_id TEXT REFERENCES os_clients(id),contract_id TEXT REFERENCES os_fin_contracts(id),number TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents>0),issue_date TEXT NOT NULL,due_date TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',source TEXT NOT NULL DEFAULT 'Registrazione DEMO',UNIQUE(entity_id,number));
    CREATE TABLE IF NOT EXISTS os_fin_obligations(id TEXT PRIMARY KEY,entity_id TEXT NOT NULL REFERENCES os_fin_entities(id),counterparty_id TEXT REFERENCES os_fin_counterparties(id),client_id TEXT REFERENCES os_clients(id),kind TEXT NOT NULL CHECK(kind IN('collaborator','owner_agreement','tax_reserve','hosting','domain','other')),title TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents>0),due_date TEXT NOT NULL,document_ref TEXT NOT NULL DEFAULT '',minutes INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS os_fin_subscriptions(id TEXT PRIMARY KEY,entity_id TEXT NOT NULL REFERENCES os_fin_entities(id),counterparty_id TEXT NOT NULL REFERENCES os_fin_counterparties(id),name TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents>0),next_due TEXT NOT NULL,interval_months INTEGER NOT NULL CHECK(interval_months IN(1,12)),active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS os_fin_movements(id TEXT PRIMARY KEY,entity_id TEXT NOT NULL REFERENCES os_fin_entities(id),account_id TEXT NOT NULL REFERENCES os_fin_accounts(id),counterparty_id TEXT REFERENCES os_fin_counterparties(id),client_id TEXT REFERENCES os_clients(id),invoice_id TEXT REFERENCES os_fin_invoices(id),obligation_id TEXT REFERENCES os_fin_obligations(id),subscription_id TEXT REFERENCES os_fin_subscriptions(id),date TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents>0),direction TEXT NOT NULL CHECK(direction IN('in','out')),kind TEXT NOT NULL CHECK(kind IN('income','expense','withdrawal','transfer')),category TEXT NOT NULL,method TEXT NOT NULL CHECK(method IN('bank','cash','card')),document_ref TEXT NOT NULL DEFAULT '',source_ref TEXT NOT NULL,note TEXT NOT NULL DEFAULT '',transfer_id TEXT,created_at TEXT NOT NULL,UNIQUE(entity_id,source_ref));
    CREATE TABLE IF NOT EXISTS os_fin_reconciliations(id TEXT PRIMARY KEY,entity_id TEXT NOT NULL REFERENCES os_fin_entities(id),account_id TEXT NOT NULL REFERENCES os_fin_accounts(id),month TEXT NOT NULL,calculated_cents INTEGER NOT NULL,actual_cents INTEGER NOT NULL,difference_cents INTEGER NOT NULL,note TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN('in_review','closed')),approved_by TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS os_fin_anomalies(id TEXT PRIMARY KEY,rule TEXT NOT NULL,source_id TEXT NOT NULL,entity_id TEXT REFERENCES os_fin_entities(id),client_id TEXT REFERENCES os_clients(id),title TEXT NOT NULL,amount_cents INTEGER NOT NULL,priority TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',assignee TEXT NOT NULL DEFAULT '',resolution_note TEXT NOT NULL DEFAULT '',detected INTEGER NOT NULL DEFAULT 1,first_seen TEXT NOT NULL,last_seen TEXT NOT NULL,UNIQUE(rule,source_id));
    CREATE TABLE IF NOT EXISTS os_fin_requests(key TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,response TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS os_fin_reversals(id TEXT PRIMARY KEY,group_id TEXT NOT NULL,original_id TEXT UNIQUE NOT NULL REFERENCES os_fin_movements(id),reversal_id TEXT UNIQUE NOT NULL REFERENCES os_fin_movements(id),reason TEXT NOT NULL,document_ref TEXT NOT NULL,approved_by TEXT NOT NULL,new_period_ack INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS os_fin_hourly_rates(id TEXT PRIMARY KEY,entity_id TEXT NOT NULL REFERENCES os_fin_entities(id),client_id TEXT NOT NULL REFERENCES os_clients(id),user_id TEXT NOT NULL REFERENCES os_users(id),counterparty_id TEXT NOT NULL REFERENCES os_fin_counterparties(id),service TEXT NOT NULL,hourly_cents INTEGER NOT NULL CHECK(typeof(hourly_cents)='integer' AND hourly_cents>=0),cost_treatment TEXT NOT NULL CHECK(cost_treatment IN('internal_time','expense_backed')),effective_from TEXT NOT NULL,confirmed_by TEXT NOT NULL,note TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS os_fin_work_allocations(id TEXT PRIMARY KEY,task_id TEXT UNIQUE NOT NULL REFERENCES os_tasks(id),rate_id TEXT NOT NULL REFERENCES os_fin_hourly_rates(id),work_date TEXT NOT NULL,confirmed_by TEXT NOT NULL,note TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS os_fin_movements_account_date ON os_fin_movements(account_id,date);
    CREATE INDEX IF NOT EXISTS os_fin_invoices_entity_due ON os_fin_invoices(entity_id,due_date);
    CREATE TRIGGER IF NOT EXISTS os_fin_movements_immutable_update BEFORE UPDATE ON os_fin_movements BEGIN SELECT RAISE(ABORT,'La prima nota è immutabile; rettifiche da validare separatamente'); END;
    CREATE TRIGGER IF NOT EXISTS os_fin_movements_immutable_delete BEFORE DELETE ON os_fin_movements BEGIN SELECT RAISE(ABORT,'La prima nota non consente cancellazioni'); END;
  `);
  function client(id) { if(!id) return null; if(!s.one('SELECT id FROM os_clients WHERE id=?',id)) throw new AppError('Cliente non trovato.',404); return id; }
  function balance(account,asOf=today()) { return account.opening_cents+sum(s.query('SELECT direction,amount_cents FROM os_fin_movements WHERE account_id=? AND date<=?',account.id,asOf),r=>r.direction==='in'?r.amount_cents:-r.amount_cents); }
  function paid(column,id,asOf=today()) { if(!['invoice_id','obligation_id','subscription_id'].includes(column)) throw new Error('Campo non ammesso'); const direction=column==='invoice_id'?'in':'out'; return s.one(`SELECT COALESCE(SUM(CASE WHEN direction=? THEN amount_cents ELSE -amount_cents END),0) AS value FROM os_fin_movements WHERE ${column}=? AND date<=?`,direction,id,asOf).value; }
  function sameEntity(record,entity) { if(record.entity_id!==entity) throw new AppError('La ditta non coincide con conto, contratto o documento.',409); }
  function ensureOpen(account,day) {
    if(day<account.opening_date) throw new AppError('Movimento precedente al saldo iniziale.');
    const closed=s.one("SELECT month FROM os_fin_reconciliations WHERE account_id=? AND status='closed' ORDER BY month DESC LIMIT 1",account.id);
    if(closed&&day<=endMonth(closed.month)) throw new AppError('Periodo riconciliato: registrazione retroattiva bloccata.',409);
  }
  function insertMovement(body,allowTransfer=false) {
    const entity=get('entities',body.entityId,'Ditta'),account=get('accounts',body.accountId,'Conto'); sameEntity(account,entity.id);
    const day=date(body.date),amount=cents(body.amountCents),direction=body.direction,kind=body.kind||(direction==='in'?'income':'expense');
    if(!['in','out'].includes(direction)||!['income','expense','withdrawal','transfer'].includes(kind)) throw new AppError('Tipo di movimento non valido.');
    if(kind==='transfer'&&!allowTransfer) throw new AppError('Usare la registrazione atomica dei trasferimenti.');
    if((kind==='income'&&direction!=='in')||(['expense','withdrawal'].includes(kind)&&direction!=='out')) throw new AppError('Verso e tipo del movimento non coerenti.');
    if(day>today()) throw new AppError('La prima nota registra movimenti avvenuti; usare lo scadenziario per date future.');
    ensureOpen(account,day);
    const party=body.counterpartyId?get('counterparties',body.counterpartyId,'Controparte'):null;
    let clientId=client(body.clientId||party?.client_id),invoiceId=null,obligationId=null,subscriptionId=null;
    if(party?.client_id&&clientId!==party.client_id) throw new AppError('Cliente non coerente con la controparte.',409);
    if([body.invoiceId,body.obligationId,body.subscriptionId].filter(Boolean).length>1) throw new AppError('Un movimento può essere collegato a un solo documento, compenso o abbonamento.');
    if(body.invoiceId) {
      const invoice=get('invoices',body.invoiceId,'Fattura'); sameEntity(invoice,entity.id);
      if(direction!=='in'||kind!=='income'||party?.id!==invoice.counterparty_id) throw new AppError('Incasso e controparte non coerenti con la fattura.',409);
      if(clientId&&invoice.client_id&&clientId!==invoice.client_id) throw new AppError('Cliente non coerente con fattura.',409);
      if(day<invoice.issue_date) throw new AppError('Incasso precedente alla data della bozza: registrare prima un anticipo separato.');
      if(paid('invoice_id',invoice.id)+amount>invoice.amount_cents) throw new AppError('Importo superiore al residuo della fattura.',409);
      invoiceId=invoice.id; clientId=invoice.client_id;
    }
    if(body.obligationId) {
      const obligation=get('obligations',body.obligationId,'Scadenza'); sameEntity(obligation,entity.id);
      if(direction!=='out'||(obligation.counterparty_id&&party?.id!==obligation.counterparty_id)) throw new AppError('Pagamento non coerente con la scadenza.',409);
      if(obligation.kind==='owner_agreement'&&kind!=='withdrawal') throw new AppError('I prelievi dei soci devono essere distinti dai costi.');
      if(obligation.kind!=='owner_agreement'&&kind!=='expense') throw new AppError('La scadenza richiede un movimento di uscita ordinario.');
      if(obligation.kind!=='owner_agreement'&&paid('obligation_id',obligation.id)+amount>obligation.amount_cents) throw new AppError('Pagamento superiore al residuo della scadenza.',409);
      if(clientId&&obligation.client_id&&clientId!==obligation.client_id) throw new AppError('Cliente non coerente con la scadenza.',409);
      obligationId=obligation.id; if(obligation.client_id) clientId=obligation.client_id;
    }
    if(body.subscriptionId) { const sub=get('subscriptions',body.subscriptionId,'Abbonamento'); sameEntity(sub,entity.id); if(direction!=='out'||kind!=='expense'||party?.id!==sub.counterparty_id) throw new AppError('Pagamento non coerente con abbonamento.',409); subscriptionId=sub.id; }
    if(kind==='withdrawal'&&party?.kind!=='owner') throw new AppError('Un prelievo richiede un titolare come controparte.');
    const source=required(body.sourceRef,'Riferimento univoco',160);
    if(s.one('SELECT id FROM os_fin_movements WHERE entity_id=? AND source_ref=?',entity.id,source)) throw new AppError('Riferimento già registrato, anche su un altro conto.',409);
    const id=uid(),method=body.method||'bank'; if(!['bank','cash','card'].includes(method)) throw new AppError('Metodo non valido.');
    s.run('INSERT INTO os_fin_movements VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',id,entity.id,account.id,party?.id||null,clientId,invoiceId,obligationId,subscriptionId,day,amount,direction,kind,required(body.category,'Categoria',100),method,text(body.documentRef,240),source,text(body.note,2000),body.transferId||null,stamp());
    return get('movements',id,'Movimento');
  }
  function mutate(user,path,body,fn) {
    owner(user); const key=required(body.idempotencyKey,'Chiave di idempotenza',160);
    const hash=createHash('sha256').update(JSON.stringify(canonical({path,body,userId:user.id}))).digest('hex');
    return s.transaction(()=>{
      const previous=s.one('SELECT * FROM os_fin_requests WHERE key=?',key);
      if(previous) { if(previous.fingerprint!==hash) throw new AppError('Chiave già utilizzata per una richiesta diversa.',409); return {...JSON.parse(previous.response),replayed:true}; }
      const result=fn(); s.audit(user,null,'administration'+path,result?.id||'',{demo:true},'admin');
      s.run('INSERT INTO os_fin_requests VALUES(?,?,?,?)',key,hash,JSON.stringify(result),stamp()); return result;
    });
  }
  function reversal(body,user) {
    const original=get('movements',body.movementId,'Movimento'); sameEntity(original,required(body.entityId,'Ditta'));
    if(s.one('SELECT id FROM os_fin_reversals WHERE reversal_id=?',original.id)) throw new AppError('Non si storna uno storno: registrare una nuova operazione motivata.',409);
    const day=date(body.date),reason=required(body.reason,'Motivo storno',2000),document=required(body.documentRef,'Documento di rettifica',240),source=required(body.sourceRef,'Riferimento storno',160);
    if(day>today()||day<original.date) throw new AppError('Lo storno deve avere data non futura e non precedente al movimento originale.');
    const originals=original.kind==='transfer'?s.query('SELECT * FROM os_fin_movements WHERE transfer_id=?',original.transfer_id):[original];
    if(original.kind==='transfer'&&(originals.length!==2||originals[0].amount_cents!==originals[1].amount_cents||originals[0].direction===originals[1].direction)) throw new AppError('Trasferimento originale incompleto: verifica manuale richiesta.',409);
    const group=uid(),created=[];
    for(const item of originals) {
      sameEntity(item,body.entityId);
      if(s.one('SELECT id FROM os_fin_reversals WHERE original_id=?',item.id)) throw new AppError('Il movimento risulta già stornato.',409);
      const account=get('accounts',item.account_id,'Conto'); sameEntity(account,body.entityId); ensureOpen(account,day);
      const originalClosed=s.one("SELECT id FROM os_fin_reconciliations WHERE account_id=? AND status='closed' AND month>=?",account.id,item.date.slice(0,7));
      if(originalClosed&&body.allowClosedPeriodAdjustment!==true) throw new AppError('Originale in periodo chiuso: confermare esplicitamente la rettifica nel nuovo periodo aperto.',409);
      const sourceRef=source+':'+item.id;
      if(s.one('SELECT id FROM os_fin_movements WHERE entity_id=? AND source_ref=?',item.entity_id,sourceRef)) throw new AppError('Riferimento storno già registrato.',409);
      const id=uid();
      s.run('INSERT INTO os_fin_movements VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',id,item.entity_id,item.account_id,item.counterparty_id,item.client_id,item.invoice_id,item.obligation_id,item.subscription_id,day,item.amount_cents,item.direction==='in'?'out':'in',item.kind,item.category,item.method,document,sourceRef,'STORNO: '+reason,item.kind==='transfer'?group:null,stamp());
      s.run('INSERT INTO os_fin_reversals VALUES(?,?,?,?,?,?,?,?,?)',uid(),group,item.id,id,reason,document,user.id,originalClosed?1:0,stamp());
      created.push({original_id:item.id,reversal:get('movements',id,'Storno')});
    }
    return {id:group,reversals:created};
  }
  function marginState(monthValue,movements,invoices,asOf) {
    const rates=s.query('SELECT * FROM os_fin_hourly_rates'),allocations=s.query('SELECT * FROM os_fin_work_allocations'),tasks=s.query('SELECT * FROM os_tasks');
    return s.query('SELECT id,name FROM os_clients').map(c=>{
      const clientRows=movements.filter(m=>m.client_id===c.id),income=sum(clientRows.filter(m=>m.kind==='income'),signedAmount),direct=sum(clientRows.filter(m=>m.kind==='expense'),signedAmount);
      const entries=allocations.map(a=>({allocation:a,rate:rates.find(r=>r.id===a.rate_id),task:tasks.find(t=>t.id===a.task_id)})).filter(x=>x.rate?.client_id===c.id&&x.allocation.work_date.startsWith(monthValue));
      const missingTasks=tasks.filter(t=>t.client_id===c.id&&!allocations.some(a=>a.task_id===t.id)&&(t.created_at.startsWith(monthValue)||t.due?.startsWith(monthValue)));
      const byEntity=s.query('SELECT id FROM os_fin_entities').map(e=>{
        const rows=clientRows.filter(m=>m.entity_id===e.id),work=entries.filter(x=>x.rate.entity_id===e.id),issues=[];
        const expenseParties=new Set(work.filter(x=>x.rate.cost_treatment==='expense_backed').map(x=>x.rate.counterparty_id));
        const laborPayments=sum(rows.filter(m=>m.kind==='expense'&&expenseParties.has(m.counterparty_id)),signedAmount);
        let estimatedLabor=0,actualLabor=0,internalLabor=0;
        for(const {task,rate,allocation} of work) {
          if(!task||task.client_id!==rate.client_id||task.assignee!==rate.user_id||task.service!==rate.service) {issues.push('Assegnazione lavoro non più coerente: '+allocation.task_id);continue;}
          estimatedLabor+=hourlyCost(task.estimate_minutes,rate.hourly_cents);
          if(allocation.work_date<=asOf) {
            const actual=hourlyCost(task.actual_minutes,rate.hourly_cents); actualLabor+=actual;
            if(rate.cost_treatment==='internal_time') {internalLabor+=actual;if(sum(rows.filter(m=>m.kind==='expense'&&m.counterparty_id===rate.counterparty_id),signedAmount)>0)issues.push('Ore interne e compenso a movimento sovrapposti: '+rate.user_id);}
            if(task.status==='done'&&task.actual_minutes===0)issues.push('Ore effettive mancanti per lavoro concluso: '+task.id);
          }
        }
        integer(estimatedLabor,0,Number.MAX_SAFE_INTEGER);integer(actualLabor,0,Number.MAX_SAFE_INTEGER);integer(internalLabor,0,Number.MAX_SAFE_INTEGER);
        const revenue=sum(invoices.filter(i=>i.client_id===c.id&&i.entity_id===e.id&&i.issue_date.startsWith(monthValue)),'amount_cents'),received=sum(rows.filter(m=>m.kind==='income'),signedAmount),expense=sum(rows.filter(m=>m.kind==='expense'),signedAmount);
        const complete=work.length>0&&missingTasks.length===0&&issues.length===0;
        return {entity_id:e.id,planned_revenue_cents:revenue,received_cents:received,direct_costs_cents:expense,recorded_labor_payments_cents:laborPayments,estimated_labor_cents:estimatedLabor,actual_hours_cost_cents:actualLabor,additional_internal_hours_cents:internalLabor,estimated_margin_cents:complete?revenue-(expense-laborPayments)-estimatedLabor:null,realized_margin_cents:complete?received-expense-internalLabor:null,status:complete?'calculated_from_recorded_data':'incomplete',issues,work_count:work.length};
      });
      const relevant=byEntity.filter(e=>e.work_count>0||e.received_cents!==0||e.direct_costs_cents!==0||e.planned_revenue_cents!==0);
      const complete=relevant.length>0&&relevant.every(e=>e.status==='calculated_from_recorded_data')&&missingTasks.length===0;
      return {client_id:c.id,name:c.name,income_cents:income,direct_costs_cents:direct,cash_contribution_cents:income-direct,full_margin_cents:null,estimated_margin_cents:complete?sum(byEntity,e=>e.estimated_margin_cents??0):null,realized_margin_cents:complete?sum(byEntity,e=>e.realized_margin_cents??0):null,by_entity:byEntity,missing_task_ids:missingTasks.map(t=>t.id),note:'Stima: bozze del mese meno costi registrati non di lavoro e ore previste. Consuntivo gestionale: incassi meno spese registrate e ore interne effettive; i compensi a movimento non si contano due volte. Non è utile fiscale o margine completo di competenza; costi comuni non ripartiti.'};
    });
  }
  function financials(asOf) {
    const accounts=s.query('SELECT * FROM os_fin_accounts WHERE opening_date<=?',asOf).map(a=>({...a,balance_cents:balance(a,asOf)}));
    const invoices=s.query('SELECT * FROM os_fin_invoices WHERE issue_date<=?',asOf).map(i=>({...i,paid_cents:paid('invoice_id',i.id,asOf),remaining_cents:i.amount_cents-paid('invoice_id',i.id,asOf)}));
    const obligations=s.query('SELECT * FROM os_fin_obligations').map(o=>({...o,paid_cents:paid('obligation_id',o.id,asOf),remaining_cents:Math.max(0,o.amount_cents-paid('obligation_id',o.id,asOf))}));
    return {accounts,invoices,obligations};
  }
  // Un contratto attivo genera: fattura da emettere del mese (bozza), canoni attesi nei mesi successivi
  // e scadenze (preavviso di rinnovo, fine). L'importo del contratto è inteso come canone mensile.
  function contractPlan(c,asOf,{months=3}={}) {
    const invoices=s.query('SELECT * FROM os_fin_invoices WHERE contract_id=?',c.id),firstOfMonth=v=>v.slice(0,7)+'-01',expected=[];
    for(let i=0,m=firstOfMonth(asOf);i<=months;i++,m=addMonths(m,1)) {
      if(endMonth(m.slice(0,7))<c.start_date||m>c.end_date) continue;
      const invoice=invoices.find(x=>x.issue_date.slice(0,7)===m.slice(0,7));
      expected.push({month:m.slice(0,7),amount_cents:c.amount_cents,invoice_id:invoice?.id||null,status:invoice?'fatturato':i===0?'da_emettere':'atteso'});
    }
    const notice=addDays(c.end_date,-c.notice_days);
    return {contract_id:c.id,client_id:c.client_id,service:c.service,monthly_cents:c.amount_cents,expected,
      deadlines:[{kind:'preavviso_rinnovo',date:notice,title:`Decidere il rinnovo entro il ${notice}`},{kind:'fine_contratto',date:c.end_date,title:'Fine del contratto'}],
      assumption:'Importo del contratto inteso come canone mensile; termini di pagamento a 30 giorni [DA VERIFICARE nel contratto standard].'};
  }
  function contractInvoice(user,contractId,asOf) {
    const c=get('contracts',contractId,'Contratto'); if(c.status!=='active') throw new AppError('Contratto non attivo.',409);
    const plan=contractPlan(c,asOf),current=plan.expected.find(x=>x.month===asOf.slice(0,7));
    if(!current) throw new AppError('Il contratto non copre il mese indicato.',409);
    if(current.invoice_id) return {plan,invoice:get('invoices',current.invoice_id,'Fattura'),created:false};
    const issue=asOf.slice(0,7)+'-01'<c.start_date?c.start_date:asOf.slice(0,7)+'-01',number=`CAN-${asOf.slice(0,7).replace('-','')}-${c.id.slice(0,8)}`,id=uid();
    s.run('INSERT INTO os_fin_invoices VALUES(?,?,?,?,?,?,?,?,?,?,?)',id,c.entity_id,c.counterparty_id,c.client_id,c.id,number,c.amount_cents,issue,addDays(issue,30),'draft','Fattura da emettere generata dal contratto: emissione e invio SDI solo dopo l’ok di un socio');
    return {plan:contractPlan(c,asOf),invoice:get('invoices',id,'Fattura'),created:true};
  }
  function analyze(user,{asOf=today()}={}) {
    owner(user); date(asOf); if(asOf>today()) throw new AppError('Analisi futura non ammessa.');
    return s.transaction(()=>{
      const {accounts,invoices,obligations}=financials(asOf),found=[];
      const add=(rule,record,title,amount,priority='medium',suffix='')=>found.push({rule,source_id:record.id+suffix,entity_id:record.entity_id||null,client_id:record.client_id||null,title,amount_cents:Math.abs(amount),priority});
      for(const i of invoices) if(i.due_date<asOf&&i.remaining_cents>0) { add('invoice_overdue',i,'Documento DEMO scaduto con residuo da incassare',i.remaining_cents,'high'); if(i.paid_cents>0) add('partial_payment',i,'Incasso parziale oltre la scadenza',i.remaining_cents); }
      for(const i of invoices) if(i.paid_cents>0&&i.paid_cents!==i.amount_cents&&!(i.due_date<asOf&&i.remaining_cents>0)) add('payment_mismatch',i,i.paid_cents>i.amount_cents?'Incasso superiore all’importo dovuto':'Incasso diverso dall’importo dovuto',Math.abs(i.amount_cents-i.paid_cents),'medium');
      const allMovements=s.query('SELECT * FROM os_fin_movements WHERE date<=?',asOf),reversals=s.query('SELECT r.* FROM os_fin_reversals r JOIN os_fin_movements m ON m.id=r.reversal_id WHERE m.date<=?',asOf),cancelled=new Set(reversals.flatMap(r=>[r.original_id,r.reversal_id])),movements=allMovements.filter(m=>!cancelled.has(m.id)),duplicates=new Map();
      for(const m of movements) {
        if(m.kind!=='transfer'&&!m.document_ref&&!m.invoice_id) add('missing_document',m,'Movimento senza fattura o ricevuta collegata',m.amount_cents);
        if(!m.category) add('missing_category',m,'Categoria mancante',m.amount_cents);
        const account=accounts.find(a=>a.id===m.account_id),invoice=invoices.find(i=>i.id===m.invoice_id);
        if(account?.entity_id!==m.entity_id||(invoice&&invoice.entity_id!==m.entity_id)) add('entity_mismatch',m,'Ditta incoerente con conto o fattura',m.amount_cents,'critical');
        if(m.kind!=='transfer'&&m.document_ref) { const key=[m.entity_id,m.date,m.direction,m.amount_cents,m.counterparty_id,m.document_ref].join('|'); const prior=duplicates.get(key); if(prior) add('possible_duplicate',m,'Possibile doppio movimento: verificare documento e conto',m.amount_cents,'high'); else duplicates.set(key,m.id); }
      }
      for(const o of obligations) { if(o.due_date<asOf&&o.remaining_cents>0) add('obligation_overdue',o,'Scadenza o compenso non saldato',o.remaining_cents,'high'); if(o.kind==='owner_agreement'&&o.paid_cents>o.amount_cents) add('owner_overdraw',o,'Prelievi oltre accordo registrato',o.paid_cents-o.amount_cents,'high'); }
      for(const account of accounts) if(account.balance_cents<0) add('owner_overdraw',account,'Saldo contabile del conto sotto zero',-account.balance_cents,'critical');
      const subscriptions=s.query('SELECT * FROM os_fin_subscriptions WHERE active=1'),subKeys=new Set();
      for(const sub of subscriptions) {
        const key=[sub.entity_id,sub.counterparty_id,sub.name.trim().toLowerCase()].join('|'); if(subKeys.has(key)) add('subscription_duplicate',sub,'Possibile abbonamento duplicato',sub.amount_cents); subKeys.add(key);
        const payments=movements.filter(m=>m.subscription_id===sub.id);
        for(const p of payments) if(p.amount_cents>sub.amount_cents) add('subscription_increase',p,'Pagamento abbonamento sopra il canone concordato',p.amount_cents-sub.amount_cents);
        let due=sub.next_due,count=0; while(due<asOf&&count++<1200) { const start=addMonths(due,-sub.interval_months); if(!payments.some(p=>p.date>start&&p.date<=due)) add('subscription_missing',sub,`Rinnovo ${due}: nessun pagamento registrato`,sub.amount_cents,'medium',':'+due); due=addMonths(due,sub.interval_months); }
      }
      for(const r of s.query('SELECT r.* FROM os_fin_reconciliations r WHERE NOT EXISTS(SELECT 1 FROM os_fin_reconciliations n WHERE n.account_id=r.account_id AND n.month=r.month AND n.rowid>r.rowid)')) if(r.difference_cents) add('reconciliation_difference',r,'Saldo reale diverso dal saldo registrato',r.difference_cents,'high');
      for(const c of s.query("SELECT * FROM os_fin_contracts WHERE status='active'")) if(c.end_date<=addDays(asOf,c.notice_days)) add('contract_expiring',c,'Contratto scaduto o vicino al termine di preavviso',c.amount_cents);
      s.run('UPDATE os_fin_anomalies SET detected=0');
      for(const a of found) s.run(`INSERT INTO os_fin_anomalies(id,rule,source_id,entity_id,client_id,title,amount_cents,priority,first_seen,last_seen) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(rule,source_id) DO UPDATE SET title=excluded.title,amount_cents=excluded.amount_cents,priority=excluded.priority,detected=1,last_seen=excluded.last_seen`,uid(),a.rule,a.source_id,a.entity_id,a.client_id,a.title,a.amount_cents,a.priority,stamp(),stamp());
      s.audit(user,null,'administration.analysis','',{asOf,detected:found.length,deterministic:true,cost_cents:0},'admin');
      return {asOf,detected:found.length,costCents:0,simulated:false,demo:true,rules:RULES,anomalies:s.query('SELECT * FROM os_fin_anomalies ORDER BY first_seen DESC')};
    });
  }
  function state(clientId,user,{asOf=today()}={}) {
    owner(user); date(asOf); if(asOf>today()) throw new AppError('Stato futuro non ammesso.');
    const f=financials(asOf),movements=s.query('SELECT * FROM os_fin_movements WHERE date<=? ORDER BY date DESC,created_at DESC',asOf);
    const thisMonth=asOf.slice(0,7),monthly=movements.filter(m=>m.date.startsWith(thisMonth));
    const entities=s.query('SELECT * FROM os_fin_entities').map(e=>({...e,balance_cents:sum(f.accounts.filter(a=>a.entity_id===e.id),'balance_cents'),income_month_cents:sum(monthly.filter(m=>m.entity_id===e.id&&m.kind==='income'),signedAmount),expenses_month_cents:sum(monthly.filter(m=>m.entity_id===e.id&&m.kind==='expense'),signedAmount),withdrawals_month_cents:sum(monthly.filter(m=>m.entity_id===e.id&&m.kind==='withdrawal'),signedAmount),income_year_cents:sum(movements.filter(m=>m.entity_id===e.id&&m.kind==='income'&&m.date.startsWith(asOf.slice(0,4))),signedAmount),tax:{status:'awaiting_accountant',threshold_cents:null,provision_cents:null}}));
    const arrears=f.invoices.filter(i=>i.due_date<asOf&&i.remaining_cents>0);
    const subscriptions=s.query('SELECT * FROM os_fin_subscriptions'),contracts=s.query('SELECT * FROM os_fin_contracts');
    const projections=[30,60,90].map(days=>{
      const until=addDays(asOf,days),income=sum(f.invoices.filter(i=>i.due_date>asOf&&i.due_date<=until),'remaining_cents'),obligations=sum(f.obligations.filter(o=>o.kind!=='tax_reserve'&&o.due_date>asOf&&o.due_date<=until),'remaining_cents');
      let recurring=0; for(const sub of subscriptions.filter(sub=>sub.active)) { let due=sub.next_due,count=0; while(due<=until&&count++<1200) { if(due>asOf) { const previous=addMonths(due,-sub.interval_months),prepaid=sum(movements.filter(m=>m.subscription_id===sub.id&&m.date>previous&&m.date<=due),signedAmount); recurring+=Math.max(0,sub.amount_cents-prepaid); } due=addMonths(due,sub.interval_months); } }
      const balanceCents=sum(f.accounts,'balance_cents'); return {days,until,balance_cents:balanceCents,expected_income_cents:income,expected_expense_cents:obligations+recurring,projected_cents:balanceCents+income-obligations-recurring,overdue_excluded_cents:sum(arrears,'remaining_cents'),assumption:'Scadenze registrate, non previsione AI; arretrati esclusi. Abbonamenti separati dalle altre scadenze. Accantonamenti fiscali da confermare.'};
    });
    const anomalies=s.query('SELECT * FROM os_fin_anomalies ORDER BY CASE priority WHEN \'critical\' THEN 0 WHEN \'high\' THEN 1 ELSE 2 END,last_seen DESC');
    const tasks=s.query("SELECT * FROM os_tasks WHERE status NOT IN('done','completed')"),approvals=s.query("SELECT id,title,status FROM os_approvals WHERE status='pending'");
    const summary={balance_cents:sum(f.accounts,'balance_cents'),income_month_cents:sum(monthly.filter(m=>m.kind==='income'),signedAmount),expenses_month_cents:sum(monthly.filter(m=>m.kind==='expense'),signedAmount),withdrawals_month_cents:sum(monthly.filter(m=>m.kind==='withdrawal'),signedAmount),arrears_cents:sum(arrears,'remaining_cents'),draft_invoice_cents:sum(f.invoices.filter(i=>i.status==='draft'),'amount_cents'),open_anomalies:anomalies.filter(a=>a.status!=='resolved').length,unreconciled:true};
    const questions=[
      {id:'cash',question:'Quanta cassa abbiamo?',valueCents:summary.balance_cents,note:'Saldi contabili; controllare le quadrature per conto.'},
      {id:'receivables',question:'Quanto dobbiamo incassare?',valueCents:sum(f.invoices,'remaining_cents'),overdueCents:summary.arrears_cents},
      {id:'risks',question:'Quali clienti o consegne sono a rischio?',items:tasks.filter(t=>t.due&&t.due.slice(0,10)<asOf).map(t=>({id:t.id,clientId:t.client_id,title:t.title,reason:'Scadenza superata'}))},
      {id:'contracts',question:'Quali contratti scadono?',items:contracts.filter(c=>c.status==='active'&&c.end_date<=addDays(asOf,90))},
      {id:'capacity',question:'Chi è sovraccarico?',status:'capacity_not_configured',estimatedMinutes:sum(tasks,'estimate_minutes'),note:'Ore disponibili da confermare: sovraccarico non calcolato.'},
      {id:'decisions',question:'Quali decisioni dobbiamo prendere?',items:[...anomalies.filter(a=>a.status!=='resolved').slice(0,3).map(a=>({id:a.id,title:a.title,kind:'financial_anomaly'})),...approvals.slice(0,3).map(a=>({...a,kind:'approval'}))]}
    ];
    const margins=marginState(thisMonth,monthly,f.invoices,asOf);
    const contractPlans=contracts.filter(c=>c.status==='active'&&c.end_date>=asOf).map(c=>contractPlan(c,asOf));
    const horizon=addDays(asOf,90),deadlineList=[
      ...f.invoices.filter(i=>i.remaining_cents>0&&i.due_date<=horizon).map(i=>({kind:'incasso',date:i.due_date,title:`Incasso ${i.number}`,amount_cents:i.remaining_cents,client_id:i.client_id,overdue:i.due_date<asOf})),
      ...f.obligations.filter(o=>o.remaining_cents>0&&o.due_date<=horizon).map(o=>({kind:'pagamento',date:o.due_date,title:o.title,amount_cents:o.remaining_cents,client_id:o.client_id,overdue:o.due_date<asOf})),
      ...subscriptions.filter(x=>x.active&&x.next_due<=horizon).map(x=>({kind:'abbonamento',date:x.next_due,title:x.name,amount_cents:x.amount_cents,client_id:null,overdue:x.next_due<asOf})),
      ...contractPlans.flatMap(p=>p.deadlines.filter(d=>d.date<=horizon).map(d=>({kind:d.kind,date:d.date,title:d.title,amount_cents:null,client_id:p.client_id,overdue:d.date<asOf}))),
      ...contractPlans.flatMap(p=>p.expected.filter(x=>x.status!=='fatturato').map(x=>({kind:'canone_atteso',date:x.month+'-01',title:`Canone ${p.service} ${x.month}${x.status==='da_emettere'?' · fattura da emettere':''}`,amount_cents:x.amount_cents,client_id:p.client_id,overdue:false})))
    ].sort((a,b)=>a.date.localeCompare(b.date));
    return {demo:true,asOf,summary,entities,...f,contractPlans,deadlines:deadlineList,counterparties:s.query('SELECT * FROM os_fin_counterparties'),contracts,movements,subscriptions,arrears,projections,margins,hourlyRates:s.query('SELECT * FROM os_fin_hourly_rates'),workAllocations:s.query('SELECT * FROM os_fin_work_allocations'),reversals:s.query('SELECT * FROM os_fin_reversals'),anomalies,reconciliations:s.query('SELECT * FROM os_fin_reconciliations ORDER BY month DESC,created_at DESC'),questions,rules:RULES,external:{sheets:'not_connected',bank:'not_connected',sdi:'disabled'},currency:'EUR',note:'Solo dati DEMO. Prima nota gestionale; nessuna consulenza o dichiarazione fiscale.'};
  }
  async function handle({method,path,body={},user,clientId}) {
    owner(user);
    if(method==='GET'&&(path==='/'||path==='/state'||path==='')) return {data:state(clientId,user)};
    if(method==='POST'&&path==='/analyze') return {data:analyze(user,{asOf:body.asOf||today()})};
    if(['/send','/pay','/sdi','/connect'].includes(path)) throw new AppError('Servizio non collegato: operazione esterna disabilitata nella demo.',409);
    if(method==='PATCH'&&/^\/anomalies\/[^/]+$/.test(path)) {
      const data=mutate(user,path,body,()=>{
        const a=get('anomalies',path.split('/')[2],'Anomalia'),status=body.status;
        if(!['open','in_review','resolved'].includes(status)) throw new AppError('Stato anomalia non valido.');
        const note=text(body.resolutionNote,2000); if(status==='resolved'&&!note) throw new AppError('Serve una nota per risolvere l’anomalia.');
        const assignee=text(body.assignee||user.id,160); if(!s.one("SELECT id FROM os_users WHERE id=? AND role='owner' AND active=1",assignee)) throw new AppError('Il responsabile amministrativo deve essere un socio attivo.');
        s.run('UPDATE os_fin_anomalies SET status=?,assignee=?,resolution_note=? WHERE id=?',status,assignee,note,a.id); return get('anomalies',a.id,'Anomalia');
      }); return {data};
    }
    const plan=path.match(/^\/contracts\/([^/]+)\/invoice$/);
    if(method==='POST'&&plan) return {data:mutate(user,path,body,()=>contractInvoice(user,plan[1],body.asOf?date(body.asOf):today())),status:201};
    if(method!=='POST'||!['/accounts','/counterparties','/contracts','/invoices','/obligations','/subscriptions','/movements','/transfers','/reconciliations','/reversals','/corrections','/hourly-rates','/work-allocations'].includes(path)) return null;
    const data=mutate(user,path,body,()=>{
      if(path==='/movements') return insertMovement(body);
      if(path==='/reversals'||path==='/corrections') {
        const original=get('movements',body.movementId,'Movimento');
        if(path==='/corrections'&&original.kind==='transfer') throw new AppError('Stornare il trasferimento completo e registrare un nuovo trasferimento.',409);
        const result=reversal(body,user);
        if(path==='/corrections') {
          const replacement=body.replacement; if(!replacement||typeof replacement!=='object'||Array.isArray(replacement)) throw new AppError('Indicare il movimento corretto.');
          if(replacement.entityId&&replacement.entityId!==body.entityId) throw new AppError('La rettifica non può cambiare ditta.',409);
          if(replacement.date&&replacement.date!==body.date) throw new AppError('La rettifica deve usare la data del nuovo periodo indicato.');
          result.replacement=insertMovement({entityId:body.entityId,accountId:original.account_id,counterpartyId:original.counterparty_id,clientId:original.client_id,invoiceId:original.invoice_id,obligationId:original.obligation_id,subscriptionId:original.subscription_id,direction:original.direction,kind:original.kind,category:original.category,method:original.method,...replacement,entityId:body.entityId,date:body.date,sourceRef:body.sourceRef+':replacement',documentRef:body.documentRef,note:body.reason});
        }
        return result;
      }
      if(path==='/transfers') {
        if(body.fromAccountId===body.toAccountId) throw new AppError('Scegliere due conti diversi.');
        const from=get('accounts',body.fromAccountId,'Conto origine'),to=get('accounts',body.toAccountId,'Conto destinazione');
        if(from.entity_id!==to.entity_id) throw new AppError('I trasferimenti tra ditte richiedono una causale contabile validata; non disponibili nella demo.',409);
        const id=uid(),common={entityId:from.entity_id,date:body.date,amountCents:body.amountCents,category:'Trasferimento interno',method:body.method||'bank',kind:'transfer',transferId:id,documentRef:text(body.documentRef),note:text(body.note)};
        return {id,movements:[insertMovement({...common,accountId:from.id,direction:'out',sourceRef:required(body.sourceRef,'Riferimento')+':out'},true),insertMovement({...common,accountId:to.id,direction:'in',sourceRef:body.sourceRef+':in'},true)]};
      }
      const id=uid();
      if(path==='/counterparties') {
        if(!['client','supplier','collaborator','owner'].includes(body.kind)) throw new AppError('Tipo controparte non valido.');
        s.run('INSERT INTO os_fin_counterparties VALUES(?,?,?,?,?)',id,body.kind,required(body.name,'Nome'),client(body.clientId),text(body.documentRef)); return get('counterparties',id,'Controparte');
      }
      const entity=get('entities',body.entityId,'Ditta');
      if(path==='/hourly-rates') {
        const clientId=client(required(body.clientId,'Cliente')),person=s.one("SELECT * FROM os_users WHERE id=? AND role IN('owner','collaborator') AND active=1",required(body.userId,'Persona')),party=get('counterparties',body.counterpartyId,'Controparte');
        if(!person) throw new AppError('Persona operativa non trovata.',404);
        if(!['collaborator','owner'].includes(party.kind)) throw new AppError('La tariffa richiede una controparte collaboratore o titolare.');
        if(body.confirmed!==true) throw new AppError('La tariffa deve essere confermata esplicitamente dal socio.');
        if(!['internal_time','expense_backed'].includes(body.costTreatment)) throw new AppError('Indicare se il costo ore è aggiuntivo o già rappresentato da compensi a movimento.');
        s.run('INSERT INTO os_fin_hourly_rates VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',id,entity.id,clientId,person.id,party.id,required(body.service,'Servizio',100),integer(body.hourlyCents,0,LIMIT),body.costTreatment,date(body.effectiveFrom),user.id,required(body.note,'Motivo e origine tariffa',2000),stamp()); return get('hourly_rates',id,'Tariffa');
      }
      if(path==='/work-allocations') {
        const task=s.one('SELECT * FROM os_tasks WHERE id=?',required(body.taskId,'Lavoro')),rate=get('hourly_rates',body.rateId,'Tariffa');sameEntity(rate,entity.id);
        if(!task) throw new AppError('Lavoro non trovato.',404);
        if(task.client_id!==rate.client_id||task.assignee!==rate.user_id||task.service!==rate.service) throw new AppError('Tariffa non coerente con cliente, persona e servizio del lavoro.',409);
        const workDate=date(body.workDate);if(workDate<rate.effective_from) throw new AppError('La tariffa non era valida alla data del lavoro.');
        if(s.one('SELECT id FROM os_fin_work_allocations WHERE task_id=?',task.id)) throw new AppError('Il lavoro è già attribuito a una ditta; non si conteggia due volte.',409);
        s.run('INSERT INTO os_fin_work_allocations VALUES(?,?,?,?,?,?,?)',id,task.id,rate.id,workDate,user.id,required(body.note,'Nota attribuzione ore',2000),stamp());return get('work_allocations',id,'Attribuzione');
      }
      if(path==='/accounts') { const opening=date(body.openingDate); if(opening>today()) throw new AppError('Saldo iniziale futuro non ammesso.'); s.run('INSERT INTO os_fin_accounts VALUES(?,?,?,?,?,?)',id,entity.id,required(body.name,'Nome conto'),integer(body.openingCents,-LIMIT,LIMIT),opening,'EUR'); return get('accounts',id,'Conto'); }
      if(path==='/reconciliations') {
        const account=get('accounts',body.accountId,'Conto'); sameEntity(account,entity.id); const m=month(body.month),end=endMonth(m);
        if(end>=today()) throw new AppError('La quadratura mensile richiede un mese terminato.'); if(end<account.opening_date) throw new AppError('Mese precedente al saldo iniziale.');
        if(s.one("SELECT id FROM os_fin_reconciliations WHERE account_id=? AND month>=? AND status='closed'",account.id,m)) throw new AppError('Il periodo risulta già chiuso.',409);
        const calculated=balance(account,end),actual=integer(body.actualCents,-LIMIT,LIMIT),difference=actual-calculated,note=required(body.note,'Nota quadratura',2000);
        if(body.close&&difference!==0) throw new AppError('Impossibile chiudere: la differenza deve essere zero.',409);
        s.run('INSERT INTO os_fin_reconciliations VALUES(?,?,?,?,?,?,?,?,?,?,?)',id,entity.id,account.id,m,calculated,actual,difference,note,body.close?'closed':'in_review',user.id,stamp()); return get('reconciliations',id,'Quadratura');
      }
      const party=body.counterpartyId?get('counterparties',body.counterpartyId,'Controparte'):null,clientId=client(body.clientId||party?.client_id);
      if(party?.client_id&&clientId!==party.client_id) throw new AppError('Cliente non coerente con la controparte.',409);
      if(path==='/contracts') {
        if(party?.kind!=='client') throw new AppError('Un contratto richiede una controparte cliente.'); const start=date(body.startDate),end=date(body.endDate); if(end<start) throw new AppError('Fine contratto precedente all’inizio.');
        s.run('INSERT INTO os_fin_contracts VALUES(?,?,?,?,?,?,?,?,?,?,?)',id,entity.id,party.id,clientId,required(body.service,'Servizio'),cents(body.amountCents),start,end,integer(body.noticeDays??30,0,365),text(body.documentRef),'active'); return get('contracts',id,'Contratto');
      }
      if(path==='/invoices') {
        if(party?.kind!=='client') throw new AppError('Una bozza fattura richiede una controparte cliente.');
        const issue=date(body.issueDate),due=date(body.dueDate),number=required(body.number,'Numero bozza'); if(due<issue) throw new AppError('Scadenza precedente al documento.'); if(issue>today()) throw new AppError('Data documento futura non ammessa.');
        if(body.contractId) { const c=get('contracts',body.contractId,'Contratto'); sameEntity(c,entity.id); if(c.counterparty_id!==party.id||c.client_id!==clientId) throw new AppError('Contratto non coerente con cliente.',409); }
        if(s.one('SELECT id FROM os_fin_invoices WHERE entity_id=? AND number=?',entity.id,number)) throw new AppError('Numero bozza già presente per questa ditta.',409);
        s.run('INSERT INTO os_fin_invoices VALUES(?,?,?,?,?,?,?,?,?,?,?)',id,entity.id,party.id,clientId,body.contractId||null,number,cents(body.amountCents),issue,due,'draft','Registrazione DEMO'); return get('invoices',id,'Fattura');
      }
      if(path==='/obligations') {
        if(!['collaborator','owner_agreement','tax_reserve','hosting','domain','other'].includes(body.kind)) throw new AppError('Tipo scadenza non valido.');
        if(body.kind==='collaborator'&&party?.kind!=='collaborator') throw new AppError('Serve un collaboratore.'); if(body.kind==='owner_agreement'&&party?.kind!=='owner') throw new AppError('Serve un titolare.');
        if(body.kind==='tax_reserve') throw new AppError('Regole fiscali e accantonamenti da confermare con il commercialista.',409);
        s.run('INSERT INTO os_fin_obligations VALUES(?,?,?,?,?,?,?,?,?,?)',id,entity.id,party?.id||null,clientId,body.kind,required(body.title,'Titolo'),cents(body.amountCents),date(body.dueDate),text(body.documentRef),integer(body.minutes??0,0,1000000)); return get('obligations',id,'Scadenza');
      }
      if(path==='/subscriptions') {
        if(party?.kind!=='supplier') throw new AppError('Serve un fornitore.'); const interval=body.intervalMonths??1; if(![1,12].includes(interval)) throw new AppError('Periodicità non supportata.');
        s.run('INSERT INTO os_fin_subscriptions VALUES(?,?,?,?,?,?,?,?)',id,entity.id,party.id,required(body.name,'Nome abbonamento'),cents(body.amountCents),date(body.nextDue),interval,1); return get('subscriptions',id,'Abbonamento');
      }
      return null;
    }); return {data,status:201};
  }
  function seed() {
    s.transaction(()=>{
      for(const e of [['demo-entity-a','Ditta Creativa A DEMO'],['demo-entity-b','Ditta Video B DEMO']]) s.run('INSERT OR IGNORE INTO os_fin_entities(id,name) VALUES(?,?)',...e);
      const day=today(),start=day.slice(0,4)+'-01-01';
      for(const a of [['demo-bank-a','demo-entity-a','Banca A DEMO',120000],['demo-cash-a','demo-entity-a','Cassa A DEMO',10000],['demo-bank-b','demo-entity-b','Banca B DEMO',180000]]) s.run('INSERT OR IGNORE INTO os_fin_accounts VALUES(?,?,?,?,?,?)',...a,start,'EUR');
      for(const p of [['demo-party-client','client','Bottega Aurora DEMO','demo-bottega'],['demo-party-supplier','supplier','Strumenti Alfa DEMO',null],['demo-party-team','collaborator','Collaboratore Delta DEMO',null],['demo-party-owner','owner','Titolare Gamma DEMO',null]]) s.run('INSERT OR IGNORE INTO os_fin_counterparties VALUES(?,?,?,?,?)',...p,'');
      s.run('INSERT OR IGNORE INTO os_fin_contracts VALUES(?,?,?,?,?,?,?,?,?,?,?)','demo-fin-contract','demo-entity-a','demo-party-client','demo-bottega','social',35000,start,addDays(day,20),30,'Contratto DEMO','active');
      s.run('INSERT OR IGNORE INTO os_fin_invoices VALUES(?,?,?,?,?,?,?,?,?,?,?)','demo-fin-invoice','demo-entity-a','demo-party-client','demo-bottega','demo-fin-contract','DEMO-001',35000,addDays(day,-15),addDays(day,-5),'draft','Fixture DEMO');
      s.run('INSERT OR IGNORE INTO os_fin_obligations VALUES(?,?,?,?,?,?,?,?,?,?)','demo-fin-compensation','demo-entity-b','demo-party-team','demo-bottega','collaborator','Compenso montaggio DEMO',18000,addDays(day,-2),'',180);
      s.run('INSERT OR IGNORE INTO os_fin_obligations VALUES(?,?,?,?,?,?,?,?,?,?)','demo-fin-withdrawal','demo-entity-b','demo-party-owner',null,'owner_agreement','Accordo prelievo DEMO',25000,addDays(day,10),'Accordo DEMO',0);
      s.run('INSERT OR IGNORE INTO os_fin_subscriptions VALUES(?,?,?,?,?,?,?,?)','demo-fin-subscription','demo-entity-a','demo-party-supplier','Archivio creativo DEMO',1900,addDays(day,10),1,1);
      const seedOwner=s.one("SELECT * FROM os_users WHERE role='owner' AND active=1 LIMIT 1"); if(seedOwner&&!s.one('SELECT id FROM os_fin_movements WHERE source_ref=?','demo-payment-001')) insertMovement({entityId:'demo-entity-a',accountId:'demo-bank-a',counterpartyId:'demo-party-client',invoiceId:'demo-fin-invoice',date:day,amountCents:10000,direction:'in',category:'Canone social',method:'bank',sourceRef:'demo-payment-001',documentRef:'Bozza DEMO-001'});
      if(seedOwner&&!s.one('SELECT id FROM os_fin_anomalies LIMIT 1')) analyze(seedOwner);
    });
  }
  return {seed,state,handle,analyze,rules:RULES};
}
