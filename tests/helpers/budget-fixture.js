// Invented attestation for offline provider tests. Never used by application startup.
import {createCostControl} from '../../src/cost-control.js';
export function confirmFixtureBudget(store,{clock=()=>new Date(),owner=store.one("SELECT * FROM os_users WHERE role='owner' AND active=1 AND must_change_password=0 AND id<>'os-orchestrator' LIMIT 1"),externalCents=2000}={}) {
  const control=createCostControl({store,clock});
  control.confirm(owner,{...control.state(owner),externalCents,confirmed:true});
  return control;
}
