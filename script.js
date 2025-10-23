// === Simple localStorage helpers ===
const K = {
  PROFILE:'sb_profile',
  TXNS:'sb_txns',
  TODOS:'sb_todos',
  BUDGETS:'sb_budgets',
  HIDE_BAL:'sb_hide_bal'
};
const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
const money = n => '$' + n.toFixed(2);

function load(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; }catch{ return def; } }
function save(key,val){ localStorage.setItem(key, JSON.stringify(val)); }

// === Seed data on first run ===
(function seed(){
  if(!localStorage.getItem(K.TXNS)){
    save(K.TXNS, [
      {id:1, kind:'expense', category:'Transport', amount:2, date:'2025-10-05', note:'Uber'},
      {id:2, kind:'expense', category:'Groceries', amount:4.75, date:'2025-10-01', note:'Walmart'},
      {id:3, kind:'expense', category:'Other', amount:10, date:'2025-10-02', note:'Apple Support'}
    ]);
  }
  if(!localStorage.getItem(K.BUDGETS)){
    save(K.BUDGETS, {Food:200, Transport:60, Health:30, Groceries:250, Housing:600, Utilities:120});
  }
  if(!localStorage.getItem(K.TODOS)){
    save(K.TODOS, [
      {id:1, text:"Log today's purchase", done:false},
      {id:2, text:"Set weekly food budget", done:false}
    ]);
  }
  if(!localStorage.getItem(K.PROFILE)){
    save(K.PROFILE, {name:'Guest', email:'', phone:'', occ:'Student'});
  }
})();

// === Navigation ===
function switchTo(id){
  $$(".screen").forEach(s=>s.classList.toggle("active", s.id===id));
  $$("#nav button").forEach(b=>b.classList.toggle("active", b.dataset.target===id));
  $("#headerTitle").textContent = id[0].toUpperCase()+id.slice(1);
  if(id==='home') renderHome();
  if(id==='profile') renderProfile();
  if(id==='expenses') renderExpenses();
  if(id==='budget') renderBudget();
  if(id==='todo') renderTodos();
}
$("#nav").addEventListener("click",e=>{
  const btn=e.target.closest("button[data-target]");
  if(btn) switchTo(btn.dataset.target);
});

// === Profile ===
function renderProfile(){
  const p=load(K.PROFILE,{});
  $("#profileForm").name.value=p.name;
  $("#profileForm").email.value=p.email;
  $("#profileForm").phone.value=p.phone;
  $("#profileForm").occ.value=p.occ;
  $("#profileNameHeading").textContent=p.name||'Guest';
  $("#profileMini").textContent=(p.name||'Guest').split(" ")[0];
}
$("#profileForm").addEventListener("submit",e=>{
  e.preventDefault();
  const p={
    name:e.target.name.value.trim()||'Guest',
    email:e.target.email.value.trim(),
    phone:e.target.phone.value.trim(),
    occ:e.target.occ.value.trim()||'Student'
  };
  save(K.PROFILE,p);
  renderProfile();
  alert("Profile saved!");
});

// === Home ===
function computeBalance(){
  const txns=load(K.TXNS,[]);
  return txns.reduce((sum,t)=>sum+(t.kind==='income'?t.amount:-t.amount),0);
}
function renderHome(){
  const balHidden=load(K.HIDE_BAL,false);
  $("#balance").textContent=balHidden?"$•••••":money(computeBalance());
}
$("#toggleHide").addEventListener("click",()=>{
  const cur=load(K.HIDE_BAL,false);
  save(K.HIDE_BAL,!cur);
  renderHome();
});
$("#addMoneyBtn").addEventListener("click",()=>{
  const txns=load(K.TXNS,[]);
  txns.push({id:Date.now(), kind:'income', category:'Other', amount:10, date:new Date().toISOString().slice(0,10), note:'Manual add'});
  save(K.TXNS,txns);
  renderHome();
  alert("Added $10 income.");
});

// === Activity (add transaction) ===
$("#txnForm").addEventListener("submit",e=>{
  e.preventDefault();
  const txns=load(K.TXNS,[]);
  const t={
    id:Date.now(),
    kind:e.target.kind.value,
    category:$("#categorySel").value,
    amount:parseFloat($("#amountInp").value),
    date:$("#dateInp").value,
    note:$("#noteInp").value
  };
  txns.push(t);
  save(K.TXNS,txns);
  alert("Transaction added!");
});

// === Expenses ===
function renderExpenses(){
  const txns=load(K.TXNS,[]).filter(t=>t.kind==='expense');
  const list=$("#expList");
  list.innerHTML='';
  let total=0;
  txns.forEach(t=>{
    total+=t.amount;
    list.insertAdjacentHTML('beforeend',`
      <li>
        <div>${t.note||t.category}<div class="muted">${t.date}</div></div>
        <div class="money negative">-${money(t.amount)}</div>
      </li>
    `);
  });
  $("#expTotal").textContent=money(total);
  $("#expItems").textContent=txns.length;
}

// === Budget ===
function sumByCategory(){
  const out={};
  load(K.TXNS,[]).forEach(t=>{
    if(t.kind!=='expense')return;
    out[t.category]=(out[t.category]||0)+t.amount;
  });
  return out;
}
function renderBudget(){
  const budgets=load(K.BUDGETS,{});
  const spent=sumByCategory();
  const list=$("#budgetList");
  list.innerHTML='';
  let total=0;
  for(const cat in budgets){
    const b=budgets[cat];
    const s=spent[cat]||0; total+=s;
    const diff=(b-s).toFixed(2);
    list.insertAdjacentHTML('beforeend',`
      <li>
        <div>${cat}<div class="muted">Spent: ${money(s)}</div></div>
        <div>${diff<0?'<span class="money negative">Over '+money(Math.abs(diff))+'</span>':'<span class="money positive">Left '+money(diff)+'</span>'}</div>
      </li>
    `);
  }
  $("#budgetTotal").textContent=money(total);
}

// === To-Do ===
function renderTodos(){
  const todos=load(K.TODOS,[]);
  const list=$("#todoList"); list.innerHTML='';
  todos.forEach(t=>{
    list.insertAdjacentHTML('beforeend',`
      <li>
        <label><input type="checkbox" data-id="${t.id}" ${t.done?'checked':''}> ${t.text}</label>
        <button class="btn small del" data-id="${t.id}">Delete</button>
      </li>
    `);
  });
}
$("#todoAdd").addEventListener("click",()=>{
  const txt=$("#todoText").value.trim(); if(!txt)return;
  const todos=load(K.TODOS,[]);
  todos.push({id:Date.now(), text:txt, done:false});
  save(K.TODOS,todos);
  $("#todoText").value='';
  renderTodos();
});
$("#todoList").addEventListener("click",e=>{
  if(e.target.classList.contains("del")){
    const id=+e.target.dataset.id;
    save(K.TODOS,load(K.TODOS,[]).filter(t=>t.id!==id));
    renderTodos();
  }
});
$("#todoList").addEventListener("change",e=>{
  if(e.target.type==="checkbox"){
    const id=+e.target.dataset.id;
    const todos=load(K.TODOS,[]);
    const t=todos.find(x=>x.id===id);
    if(t) t.done=e.target.checked;
    save(K.TODOS,todos);
    renderTodos();
  }
});

// === Init ===
renderHome();
renderProfile();
renderTodos();
renderExpenses();
renderBudget();