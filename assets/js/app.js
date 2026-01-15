
/* Hustle Her Social Suite
   - No backend
   - Saves to localStorage
   - Hash routing for GitHub Pages
*/

const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

const STORE_KEY = "hhss_v1";

const defaultState = () => ({
  posts: [],
  tasks: [],
  contacts: [],
  goals: [],
  notesVault: "",
  quickNotes: "",
  metrics: { revenue: 0, clicks: 0, deals: 0, leads: 0 },
  stripeLinks: { starter: "", boss: "", ceo: "" }
});

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  }catch(e){
    console.warn("state load failed", e);
    return defaultState();
  }
}

function saveState(){
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function uid(){
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function toast(msg){
  const t = $("#toast");
  if(!t) return;
  t.textContent = msg;
  t.classList.add("is-on");
  window.clearTimeout(toast._tm);
  toast._tm = window.setTimeout(()=> t.classList.remove("is-on"), 1400);
}

function fmtMoney(n){
  const v = Number(n||0);
  return "$" + v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function todayISO(){
  const d = new Date();
  const tzOff = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOff*60*1000);
  return local.toISOString().slice(0,10);
}

function inNextDays(isoDate, days){
  if(!isoDate) return false;
  const now = new Date();
  const d = new Date(isoDate + "T00:00:00");
  const diff = (d - now) / (1000*60*60*24);
  return diff >= -0.01 && diff <= days + 0.01;
}

let state = loadState();

/* ---------------- Routing ---------------- */
const routes = {
  "/": "home",
  "pricing": "pricing",
  "app": "app"
};

function setActiveNav(routeKey){
  $$(".navlink").forEach(a=>{
    const r = a.dataset.route;
    a.classList.toggle("navlink--active", r === routeKey);
  });
}

function showView(viewName){
  $$(".view").forEach(v => v.classList.remove("view--active"));
  const el = $("#view-" + viewName);
  if(el) el.classList.add("view--active");
}

function router(){
  const hash = location.hash || "#/";
  const key = hash.replace(/^#\//, "").trim();
  const view = routes[key] || routes["/"];
  showView(view);
  setActiveNav(key || "/");
  if(view === "app"){
    initAppIfNeeded();
    renderAll();
  }
  // Year in footer
  const y = $("#year");
  if(y) y.textContent = new Date().getFullYear();
}

window.addEventListener("hashchange", router);

/* ---------------- Pricing Stripe placeholders ---------------- */
function wireStripeButtons(){
  $$("[data-stripe]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const plan = btn.dataset.stripe;
      const url = state.stripeLinks?.[plan];
      if(url){
        window.open(url, "_blank");
      }else{
        toast("Add your Stripe link in app.js (stripeLinks).");
      }
    });
  });
}

/* ---------------- App Tabs ---------------- */
let appInit = false;

function initAppIfNeeded(){
  if(appInit) return;
  appInit = true;

  // Side nav tabs
  $$(".sidelink").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      $$(".sidelink").forEach(b=>b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const tab = btn.dataset.tab;
      activateTab(tab);
    });
  });

  $("#btnSeed")?.addEventListener("click", seedSample);
  $("#btnQuickAdd")?.addEventListener("click", quickAdd);
  $("#quickNotes")?.addEventListener("input", (e)=>{
    state.quickNotes = e.target.value;
    saveState();
  });
  $("#notesVault")?.addEventListener("input", (e)=>{
    state.notesVault = e.target.value;
    saveState();
  });

  // Posts
  $("#postForm")?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const post = {
      id: uid(),
      date: $("#postDate").value || todayISO(),
      platform: $("#postPlatform").value,
      type: $("#postType").value,
      title: $("#postTitle").value.trim(),
      hook: $("#postHook").value.trim()
    };
    state.posts.unshift(post);
    saveState();
    e.target.reset();
    $("#postDate").value = todayISO();
    toast("Post added ✨");
    renderPosts();
    renderOverview();
  });

  $("#clearPosts")?.addEventListener("click", ()=>{
    if(!confirm("Clear all scheduled posts?")) return;
    state.posts = [];
    saveState();
    toast("Posts cleared");
    renderPosts();
    renderOverview();
  });

  // Tasks
  $("#taskForm")?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const t = {
      id: uid(),
      text: $("#taskText").value.trim(),
      priority: $("#taskPriority").value,
      due: $("#taskDue").value || "",
      done: false
    };
    state.tasks.unshift(t);
    saveState();
    e.target.reset();
    toast("Task added ☕");
    renderTasks();
    renderOverview();
  });

  $("#clearTasks")?.addEventListener("click", ()=>{
    if(!confirm("Clear all tasks?")) return;
    state.tasks = [];
    saveState();
    toast("Tasks cleared");
    renderTasks();
    renderOverview();
  });

  // Contacts
  $("#contactForm")?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const c = {
      id: uid(),
      name: $("#contactName").value.trim(),
      tag: $("#contactTag").value,
      handle: $("#contactHandle").value.trim(),
      notes: $("#contactNotes").value.trim()
    };
    state.contacts.unshift(c);
    saveState();
    e.target.reset();
    toast("Contact saved 💎");
    renderContacts();
    renderOverview();
  });

  $("#clearContacts")?.addEventListener("click", ()=>{
    if(!confirm("Clear all contacts?")) return;
    state.contacts = [];
    saveState();
    toast("Contacts cleared");
    renderContacts();
    renderOverview();
  });

  // Goals
  $("#goalForm")?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const g = {
      id: uid(),
      title: $("#goalTitle").value.trim(),
      target: Number($("#goalTarget").value || 0),
      progress: Number($("#goalProgress").value || 0)
    };
    state.goals.unshift(g);
    saveState();
    e.target.reset();
    toast("Goal added 🎯");
    renderGoals();
    renderOverview();
  });

  $("#clearGoals")?.addEventListener("click", ()=>{
    if(!confirm("Clear all goals?")) return;
    state.goals = [];
    saveState();
    toast("Goals cleared");
    renderGoals();
    renderOverview();
  });

  // Metrics
  $("#metricsForm")?.addEventListener("submit", (e)=>{
    e.preventDefault();
    state.metrics = {
      revenue: Number($("#mRevenue").value || 0),
      clicks: Number($("#mClicks").value || 0),
      deals: Number($("#mDeals").value || 0),
      leads: Number($("#mLeads").value || 0),
    };
    saveState();
    toast("Metrics saved 👑");
    renderMetrics();
    renderOverview();
  });

  $("#resetMetrics")?.addEventListener("click", ()=>{
    state.metrics = { revenue:0, clicks:0, deals:0, leads:0 };
    saveState();
    toast("Metrics reset");
    renderMetrics();
    renderOverview();
  });

  // Export / Import
  $("#btnExport")?.addEventListener("click", exportJSON);
  $("#importFile")?.addEventListener("change", importJSON);

  // Set default dates
  $("#postDate") && ($("#postDate").value = todayISO());

  // mini stats on landing (fake but cute)
  $("#miniPlanned") && ($("#miniPlanned").textContent = Math.max(2, state.posts.length || 3));
  $("#miniTasks") && ($("#miniTasks").textContent = Math.max(5, state.tasks.length || 7));

  wireStripeButtons();
}

function activateTab(tab){
  $$(".tab").forEach(t => t.classList.remove("is-active"));
  const el = $(`.tab[data-tab="${tab}"]`);
  if(el) el.classList.add("is-active");

  const titleMap = {
    overview: ["Overview", "Your marketing day, styled in gold."],
    calendar: ["Content Calendar", "Schedule posts by platform and date."],
    todos: ["CEO To‑Dos", "Checklist your way to consistent content."],
    contacts: ["Contacts Hub", "Brands, clients, collabs — all in one place."],
    goals: ["Goals", "Track the numbers that move your business."],
    notes: ["Notes + Hooks", "Save scripts, captions, offers, ideas."],
    metrics: ["Money & Metrics", "Lite tracking for revenue and deals."],
    export: ["Export / Backup", "Download or import your data."]
  };
  const [t, s] = titleMap[tab] || ["Dashboard", "Boss mode."];
  $("#panelTitle").textContent = t;
  $("#panelSubtitle").textContent = s;
}

/* ---------------- Renderers ---------------- */
function renderAll(){
  $("#todayChip").textContent = new Date().toLocaleDateString(undefined, { weekday:"long", month:"short", day:"numeric" });
  $("#quickNotes").value = state.quickNotes || "";
  $("#notesVault").value = state.notesVault || "";
  renderPosts();
  renderTasks();
  renderContacts();
  renderGoals();
  renderMetrics();
  renderOverview();
}

function renderOverview(){
  const posts = state.posts || [];
  const tasks = state.tasks || [];
  const contacts = state.contacts || [];
  const revenue = state.metrics?.revenue || 0;

  $("#statPosts").textContent = String(posts.length);
  $("#statTasks").textContent = String(tasks.filter(t=>!t.done).length);
  $("#statContacts").textContent = String(contacts.length);
  $("#statRevenue").textContent = fmtMoney(revenue);

  // Affirmations rotation
  const affirmations = [
    "Your brand is a luxury experience — post like it.",
    "Consistency is the flex. Show up anyway.",
    "Create in peace. Collect in profit.",
    "You’re not behind. You’re building momentum.",
    "Elegant execution beats perfect planning."
  ];
  const pick = affirmations[(new Date().getDate() + posts.length) % affirmations.length];
  $("#affirmation").textContent = pick;

  // Upcoming posts (next 7 days)
  const upcoming = posts
    .slice()
    .sort((a,b)=> (a.date||"").localeCompare(b.date||""))
    .filter(p => inNextDays(p.date, 7))
    .slice(0,6);

  const ul = $("#upcomingList");
  ul.innerHTML = "";
  if(!upcoming.length){
    ul.innerHTML = `<div class="muted">No posts scheduled for the next 7 days. Add one in “Content Calendar”.</div>`;
  }else{
    upcoming.forEach(p=>{
      const item = document.createElement("div");
      item.className="item";
      item.innerHTML = `
        <div class="item__main">
          <div class="item__title">${escapeHtml(p.title)}</div>
          <div class="item__meta">${escapeHtml(p.date)} • <span class="tag tag--${escapeClass(p.platform)}">${escapeHtml(p.platform)}</span> • ${escapeHtml(p.type)}</div>
        </div>
      `;
      ul.appendChild(item);
    });
  }

  // Open tasks
  const openTasks = tasks.filter(t=>!t.done).slice(0,6);
  const tl = $("#taskList");
  tl.innerHTML = "";
  if(!openTasks.length){
    tl.innerHTML = `<div class="muted">No open tasks. Add one in “CEO To‑Dos”.</div>`;
  }else{
    openTasks.forEach(t=>{
      const pri = priorityClass(t.priority);
      const item = document.createElement("div");
      item.className="item";
      item.innerHTML = `
        <div class="item__main">
          <div class="item__title">${escapeHtml(t.text)}</div>
          <div class="item__meta">${t.due ? ("Due " + escapeHtml(t.due) + " • ") : ""}<span class="priority ${pri}">${escapeHtml(t.priority)}</span></div>
        </div>
      `;
      tl.appendChild(item);
    });
  }

  // Landing mini stats update
  $("#miniPlanned") && ($("#miniPlanned").textContent = String(Math.max(2, posts.length || 3)));
  $("#miniTasks") && ($("#miniTasks").textContent = String(Math.max(5, tasks.length || 7)));
}

function renderPosts(){
  $("#postsCount").textContent = String(state.posts.length);
  $("#postsTable").innerHTML = "";

  const head = document.createElement("div");
  head.className="tr th";
  head.innerHTML = `
    <div class="cell">Date</div>
    <div class="cell">Platform</div>
    <div class="cell">Type</div>
    <div class="cell">Title</div>
    <div class="cell"></div>
  `;
  $("#postsTable").appendChild(head);

  if(!state.posts.length){
    const empty = document.createElement("div");
    empty.className="muted";
    empty.style.padding="10px 2px";
    empty.textContent="No posts yet. Add your first post above.";
    $("#postsTable").appendChild(empty);
    return;
  }

  state.posts
    .slice()
    .sort((a,b)=> (a.date||"").localeCompare(b.date||""))
    .forEach(p=>{
      const row = document.createElement("div");
      row.className="tr";
      row.innerHTML = `
        <div class="cell">${escapeHtml(p.date || "")}</div>
        <div class="cell"><span class="tag tag--${escapeClass(p.platform)}">${escapeHtml(p.platform)}</span></div>
        <div class="cell">${escapeHtml(p.type || "")}</div>
        <div class="cell">
          <div style="font-weight:900">${escapeHtml(p.title || "")}</div>
          <div style="color:rgba(255,255,255,.65);font-size:12px">${escapeHtml(p.hook || "")}</div>
        </div>
        <div class="cell"><button class="iconBtn" title="Delete">×</button></div>
      `;
      row.querySelector("button").addEventListener("click", ()=>{
        state.posts = state.posts.filter(x=>x.id!==p.id);
        saveState();
        toast("Post removed");
        renderPosts();
        renderOverview();
      });
      $("#postsTable").appendChild(row);
    });
}

function renderTasks(){
  $("#tasksCount").textContent = String(state.tasks.length);
  const panel = $("#tasksPanel");
  panel.innerHTML = "";

  if(!state.tasks.length){
    panel.innerHTML = `<div class="muted">No tasks yet. Add your first CEO task on the left.</div>`;
    return;
  }

  state.tasks.forEach(t=>{
    const pri = priorityClass(t.priority);
    const item = document.createElement("div");
    item.className="item";
    item.innerHTML = `
      <div class="item__main">
        <div class="item__title">${escapeHtml(t.text)}</div>
        <div class="item__meta">${t.due ? ("Due " + escapeHtml(t.due) + " • ") : ""}<span class="priority ${pri}">${escapeHtml(t.priority)}</span></div>
      </div>
      <div class="item__right">
        <span class="check ${t.done ? "is-on":""}" title="Toggle done">✓</span>
        <button class="iconBtn" title="Delete">×</button>
      </div>
    `;
    item.querySelector(".check").addEventListener("click", ()=>{
      t.done = !t.done;
      saveState();
      toast(t.done ? "Task done 👑" : "Task reopened");
      renderTasks();
      renderOverview();
    });
    item.querySelector("button").addEventListener("click", ()=>{
      state.tasks = state.tasks.filter(x=>x.id!==t.id);
      saveState();
      toast("Task removed");
      renderTasks();
      renderOverview();
    });

    panel.appendChild(item);
  });
}

function renderContacts(){
  $("#contactsCount").textContent = String(state.contacts.length);
  const panel = $("#contactsPanel");
  panel.innerHTML = "";

  if(!state.contacts.length){
    panel.innerHTML = `<div class="muted">No contacts yet. Add a brand, client, or collab lead.</div>`;
    return;
  }

  state.contacts.forEach(c=>{
    const item = document.createElement("div");
    item.className="item";
    item.innerHTML = `
      <div class="item__main">
        <div class="item__title">${escapeHtml(c.name)}</div>
        <div class="item__meta">
          <span class="tag">${escapeHtml(c.tag)}</span>
          ${c.handle ? (" • " + escapeHtml(c.handle)) : ""}
        </div>
        ${c.notes ? `<div class="item__meta">${escapeHtml(c.notes)}</div>` : ""}
      </div>
      <div class="item__right">
        <button class="iconBtn" title="Delete">×</button>
      </div>
    `;
    item.querySelector("button").addEventListener("click", ()=>{
      state.contacts = state.contacts.filter(x=>x.id!==c.id);
      saveState();
      toast("Contact removed");
      renderContacts();
      renderOverview();
    });
    panel.appendChild(item);
  });
}

function renderGoals(){
  $("#goalsCount").textContent = String(state.goals.length);
  const panel = $("#goalsPanel");
  panel.innerHTML = "";

  if(!state.goals.length){
    panel.innerHTML = `<div class="muted">No goals yet. Add one on the left.</div>`;
    return;
  }

  state.goals.forEach(g=>{
    const pct = g.target ? Math.min(100, Math.round((g.progress/g.target)*100)) : 0;
    const item = document.createElement("div");
    item.className="item";
    item.innerHTML = `
      <div class="item__main">
        <div class="item__title">${escapeHtml(g.title)}</div>
        <div class="item__meta">${g.progress}/${g.target} (${pct}%)</div>
        <div style="height:10px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10);overflow:hidden;margin-top:6px">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg, rgba(255,79,163,.65), rgba(216,176,75,.55))"></div>
        </div>
      </div>
      <div class="item__right">
        <button class="iconBtn" title="Edit">✎</button>
        <button class="iconBtn" title="Delete">×</button>
      </div>
    `;
    const [editBtn, delBtn] = item.querySelectorAll("button");
    editBtn.addEventListener("click", ()=>{
      const newProgress = prompt("Update progress number:", String(g.progress));
      if(newProgress === null) return;
      const v = Number(newProgress);
      if(Number.isNaN(v)) return toast("Enter a number");
      g.progress = v;
      saveState();
      toast("Goal updated");
      renderGoals();
      renderOverview();
    });
    delBtn.addEventListener("click", ()=>{
      state.goals = state.goals.filter(x=>x.id!==g.id);
      saveState();
      toast("Goal removed");
      renderGoals();
      renderOverview();
    });

    panel.appendChild(item);
  });
}

function renderMetrics(){
  const m = state.metrics || { revenue:0, clicks:0, deals:0, leads:0 };
  $("#mRevenue").value = String(m.revenue ?? 0);
  $("#mClicks").value = String(m.clicks ?? 0);
  $("#mDeals").value = String(m.deals ?? 0);
  $("#mLeads").value = String(m.leads ?? 0);

  $("#snapRevenue").textContent = fmtMoney(m.revenue);
  $("#snapClicks").textContent = String(m.clicks);
  $("#snapDeals").textContent = String(m.deals);
  $("#snapLeads").textContent = String(m.leads);
}

/* ---------------- Utilities ---------------- */
function priorityClass(p){
  if(String(p).startsWith("Gold")) return "p-gold";
  if(String(p).startsWith("Pink")) return "p-pink";
  return "p-black";
}
function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
function escapeClass(s){
  return String(s ?? "").replace(/[^a-zA-Z0-9_-]/g, "");
}

/* ---------------- Actions ---------------- */
function seedSample(){
  state = defaultState();
  const baseDate = new Date();
  const d1 = new Date(baseDate.getTime()); d1.setDate(d1.getDate()+1);
  const d2 = new Date(baseDate.getTime()); d2.setDate(d2.getDate()+3);
  const d3 = new Date(baseDate.getTime()); d3.setDate(d3.getDate()+6);

  const iso = (d)=> new Date(d.getTime() - d.getTimezoneOffset()*60*1000).toISOString().slice(0,10);

  state.posts = [
    { id: uid(), date: iso(d1), platform:"Instagram", type:"Reel / Short", title:"3 mistakes killing your sales", hook:"Stop scrolling if you're a business owner..." },
    { id: uid(), date: iso(d2), platform:"TikTok", type:"Behind-the-scenes", title:"Pack orders with me", hook:"Come with me while I ship today’s orders" },
    { id: uid(), date: iso(d3), platform:"Pinterest", type:"Pin", title:"Offer graphic set (3 pins)", hook:"Save this to post later" },
  ];
  state.tasks = [
    { id: uid(), text:"Film 2 reels (hook + demo)", priority:"Gold (High)", due: iso(d1), done:false },
    { id: uid(), text:"Batch captions for 5 posts", priority:"Pink (Medium)", due: iso(d2), done:false },
    { id: uid(), text:"DM 5 collab leads", priority:"Gold (High)", due: iso(d2), done:false },
    { id: uid(), text:"Create 3 Pinterest graphics", priority:"Pink (Medium)", due: iso(d3), done:false },
    { id: uid(), text:"Update link-in-bio offer", priority:"Black (Low)", due: "", done:false },
  ];
  state.contacts = [
    { id: uid(), name:"Lush Boutique PR", tag:"Brand Deal", handle:"@lushboutique", notes:"Interested in 2 reels + 3 pins package" },
    { id: uid(), name:"Glow Lash Studio", tag:"Client", handle:"hello@glowlash.co", notes:"Needs weekly content calendar + captions" },
  ];
  state.goals = [
    { id: uid(), title:"+500 followers this month", target:500, progress:140 },
    { id: uid(), title:"$2,000 revenue from social (MTD)", target:2000, progress:520 },
  ];
  state.metrics = { revenue: 520, clicks: 184, deals: 1, leads: 9 };
  state.quickNotes = "Hook idea: “If I started over with 0 followers, I’d do THIS…”\nOffer: limited-time bundle (pins + reels + captions)\nCTA: comment “BOSS” for the link.";
  state.notesVault = "Hooks\n- Stop scrolling if you sell ___\n- 3 signs you're underpricing\n\nScripts\n- Behind-the-scenes: pack orders + voiceover\n\nOffers\n- Starter bundle: 7-day content plan + templates";
  saveState();
  toast("Sample loaded ✨");
  renderAll();
}

function quickAdd(){
  const choice = prompt("Quick Add:\n1) Post\n2) Task\n3) Contact\n\nType 1, 2, or 3");
  if(!choice) return;
  if(choice.trim() === "1"){
    activateTab("calendar");
    const d = $("#postDate");
    d && (d.value = todayISO());
    $("#postTitle")?.focus();
    toast("Add your post ✨");
  }else if(choice.trim() === "2"){
    activateTab("todos");
    $("#taskText")?.focus();
    toast("Add your task ☕");
  }else if(choice.trim() === "3"){
    activateTab("contacts");
    $("#contactName")?.focus();
    toast("Add your contact 💎");
  }else{
    toast("Choose 1, 2, or 3");
  }
}

function exportJSON(){
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hustle-her-social-suite-backup.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("Backup downloaded");
}

function importJSON(e){
  const file = e.target.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(String(reader.result || "{}"));
      state = { ...defaultState(), ...parsed };
      saveState();
      toast("Backup imported ✨");
      renderAll();
    }catch(err){
      console.error(err);
      alert("Import failed: not valid JSON.");
    }finally{
      e.target.value = "";
    }
  };
  reader.readAsText(file);
}

/* ---------------- Start ---------------- */
router();
// Default to overview tab when entering app
window.addEventListener("hashchange", ()=>{
  const h = location.hash || "#/";
  if(h.startsWith("#/app")){
    activateTab("overview");
    $$(".sidelink").forEach(b=>b.classList.remove("is-active"));
    $$(".sidelink")[0]?.classList.add("is-active");
  }
});
