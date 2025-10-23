// Shared localStorage helper functions for all pages
const K = {
  PROFILE:'sb_profile',
  TXNS:'sb_txns',
  TODOS:'sb_todos',
  BUDGETS:'sb_budgets'
};
function load(k,def){ try{ return JSON.parse(localStorage.getItem(k)) ?? def; }catch{ return def; } }
function save(k,v){ localStorage.setItem(k, JSON.stringify(v)); }

function computeBalance(){
  const txns = load(K.TXNS,[]);
  return txns.reduce((sum,t)=>sum+(t.kind==='income'?t.amount:-t.amount),0);
}
function renderHome(){
  const bal = computeBalance();
  document.getElementById("balance").textContent = "$"+bal.toFixed(2);
}