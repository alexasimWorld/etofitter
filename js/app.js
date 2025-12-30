// Crew Platform - single file app.js
// Data: demo seed. Replace with your real data source later.


let state = loadState();
let selectedType = null;

let selectedCrewId = null;


const STORAGE_KEY = "crew_platform_v1";

// 5 statuses with distinct “futuristic” colors
const STATUSES = [
  { key: "status1", label: "STATUS 1", color: "rgba(120,180,255,.30)" },
  { key: "status2", label: "STATUS 2", color: "rgba(120,255,220,.22)" },
  { key: "status3", label: "STATUS 3", color: "rgba(255,210,120,.22)" },
  { key: "status4", label: "STATUS 4", color: "rgba(255,120,180,.22)" },
  { key: "status5", label: "STATUS 5", color: "rgba(160,120,255,.22)" },
];



function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return {
    crew: [
      ...(window.ETO_CREW || []),
      ...(window.FITTERS_CREW || [])
    ].map(c => ({
      ...c,
      Handler: c.Handler ?? c.handler ?? ""
    }))
  };
}



// ----- DOM -----
const typeListEl = document.getElementById("typeList");
const crewGridEl = document.getElementById("crewGrid");
const searchInputEl = document.getElementById("searchInput");

const viewTitleEl = document.getElementById("viewTitle");
const viewSubtitleEl = document.getElementById("viewSubtitle");

const listViewEl = document.getElementById("listView");
const profileViewEl = document.getElementById("profileView");

const backBtn = document.getElementById("backBtn");
const profileNameEl = document.getElementById("profileName");
const profileRoleEl = document.getElementById("profileRole");
const profilePhotoEl = document.getElementById("profilePhoto");
const profileDetailsEl = document.getElementById("profileDetails");

const statusBarEl = document.getElementById("statusBar");
const photoInputEl = document.getElementById("photoInput");
const removePhotoBtn = document.getElementById("removePhotoBtn");

const attachInputEl = document.getElementById("attachInput");
const attachmentsListEl = document.getElementById("attachmentsList");

// ----- Init -----
renderTypeList();

wireEvents();

function wireEvents(){
  searchInputEl.addEventListener("input", () => renderList());

  backBtn.addEventListener("click", () => {
    selectedCrewId = null;
    showListView();
  });

  photoInputEl.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCrewId) return;

    const dataUrl = await fileToDataUrl(file);
    updateCrew(selectedCrewId, c => ({ ...c, photoDataUrl: dataUrl }));
    renderProfile(selectedCrewId);
    e.target.value = "";
  });

  removePhotoBtn.addEventListener("click", () => {
    if (!selectedCrewId) return;
    updateCrew(selectedCrewId, c => ({ ...c, photoDataUrl: "" }));
    renderProfile(selectedCrewId);
  });

  attachInputEl.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !selectedCrewId) return;

    const payloads = [];
    for (const f of files) {
      payloads.push({
        id: cryptoId(),
        name: f.name,
        size: f.size,
        type: f.type || "application/octet-stream",
        addedAt: new Date().toISOString(),
        dataUrl: await fileToDataUrl(f),
      });
    }

    updateCrew(selectedCrewId, c => ({ ...c, attachments: [...(c.attachments || []), ...payloads] }));
    renderProfile(selectedCrewId);
    e.target.value = "";
  });
}

// ----- Views -----
function showListView(){
  listViewEl.classList.remove("hidden");
  profileViewEl.classList.add("hidden");

  addCrewBtn.classList.remove("hidden");
  editCrewBtn.classList.add("hidden");
  deleteCrewBtn.classList.add("hidden");

  const count = getFilteredCrew().length;
  viewTitleEl.textContent = selectedType || "All Crew";
  viewSubtitleEl.textContent = `${count} crew member${count === 1 ? "" : "s"} available`;
}


function showProfileView(){
  listViewEl.classList.add("hidden");
  profileViewEl.classList.remove("hidden");

  addCrewBtn.classList.add("hidden");
  editCrewBtn.classList.remove("hidden");
  deleteCrewBtn.classList.remove("hidden");
}


// ----- Rendering -----
function renderTypeList(){
  const types = ["ETO", "FITTERS"]; // fixed as per requirement
  typeListEl.innerHTML = "";

  for (const t of types){
    const count = state.crew.filter(c => c.type === t).length;

    const btn = document.createElement("button");
    btn.className = "typeBtn" + (t === selectedType ? " active" : "");
    btn.innerHTML = `
      <div class="typeLeft">
        <span class="typeDot"></span>
        <span class="typeName">${escapeHtml(t)}</span>
      </div>
      <span class="typeCount">${count}</span>
    `;

    btn.addEventListener("click", () => {
      selectedType = t;
      selectedCrewId = null;
      // active styling
      [...typeListEl.querySelectorAll(".typeBtn")].forEach(x => x.classList.remove("active"));
      btn.classList.add("active");

      renderList();
        showListView(); // ✅ explicit navigation
    });

    typeListEl.appendChild(btn);
  }
}

function renderList(){
  const crew = getFilteredCrew();
  crewGridEl.innerHTML = "";

  viewTitleEl.textContent = selectedType;
  viewSubtitleEl.textContent = `Select a crew member to open the full profile`;

  for (const c of crew){
    const card = document.createElement("div");
    card.className = "crewCard";

    const status = STATUSES.find(s => s.key === (c.status || "status1")) || STATUSES[0];
    const photoHtml = c.photoDataUrl
      ? `<img src="${c.photoDataUrl}" alt="photo" />`
      : `<div class="thumbFallback">${initials(c.name)}</div>`;

    card.innerHTML = `
      <div class="crewRow">
        <div class="thumb">${photoHtml}</div>
        <div style="min-width:0">
          <div class="cardName">${escapeHtml(c.name)}</div>
          <div class="cardMeta">${escapeHtml(c.rank)} • Handler ${escapeHtml(c.Handler || "-")}</div>
          <div class="cardStatusPill">
            <span class="pillDot" style="background:${status.color}"></span>
            <span>${escapeHtml(status.label)}</span>
          </div>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      selectedCrewId = c.id;
      renderProfile(c.id);
      showProfileView();
    });

    crewGridEl.appendChild(card);
  }

  // ✅ NO navigation here
}



function renderProfile(crewId){
  const c = state.crew.find(x => x.id === crewId);
  if (!c) return;

  const status = STATUSES.find(s => s.key === (c.status || "status1")) || STATUSES[0];

  profileNameEl.textContent = c.name;
  profileRoleEl.textContent = `${c.type} • ${c.rank}`;

  profilePhotoEl.src = c.photoDataUrl || avatarPlaceholderDataUrl(c.name);

  profileDetailsEl.innerHTML = "";
  const details = [
    ["Type", c.type],
    ["Rank", c.rank],
    ["Nationality", c.nationality || "-"],
    ["Handler", c.Handler || "-"],
    ["Email", c.email || "-"],
    ["Phone", c.phone || "-"],
  ];
  for (const [k,v] of details){
    const el = document.createElement("div");
    el.className = "kv";
    el.innerHTML = `<div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(v)}</div>`;
    profileDetailsEl.appendChild(el);
  }

  // Status bar
  statusBarEl.innerHTML = "";
  for (const s of STATUSES){
    const b = document.createElement("button");
    b.className = "statusBtn" + (s.key === (c.status || "status1") ? " active" : "");
    b.style.background = `linear-gradient(135deg, ${s.color}, rgba(0,0,0,.18))`;

    b.textContent = s.label;

b.addEventListener("click", () => {
  updateCrew(crewId, cc => ({ ...cc, status: s.key }));
  renderProfile(crewId);
  // ✅ stay in profile view
});


    statusBarEl.appendChild(b);
  }

  // Attachments list
  attachmentsListEl.innerHTML = "";
  const attachments = c.attachments || [];
  if (!attachments.length){
    attachmentsListEl.innerHTML = `<div class="muted">No attachments yet.</div>`;
  } else {
    for (const f of attachments.slice().sort((a,b) => (b.addedAt||"").localeCompare(a.addedAt||""))){
      const row = document.createElement("div");
      row.className = "fileItem";

      row.innerHTML = `
        <div class="fileLeft">
          <div class="fileIcon"></div>
          <div class="fileMeta">
            <div class="fileName" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</div>
            <div class="fileSub">${formatBytes(f.size)} • ${new Date(f.addedAt).toLocaleString()}</div>
          </div>
        </div>
        <div style="display:flex; gap:10px; align-items:center">
          <a class="btn small" href="${f.dataUrl}" download="${escapeAttr(f.name)}">Download</a>
          <button class="btn small ghost" data-del="${escapeAttr(f.id)}">Remove</button>
        </div>
      `;

      row.querySelector("[data-del]")?.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-del");
        updateCrew(crewId, cc => ({ ...cc, attachments: (cc.attachments||[]).filter(x => x.id !== id) }));
        renderProfile(crewId);
      });

      attachmentsListEl.appendChild(row);
    }
  }

  viewTitleEl.textContent = c.name;
  viewSubtitleEl.textContent = `Full crew card • ${status.label}`;
}

// ----- Filtering -----
function getFilteredCrew(){
  const q = (searchInputEl.value || "").trim().toLowerCase();
  return state.crew
.filter(c => !selectedType || c.type === selectedType)

    .filter(c => {
      if (!q) return true;
      return (
        (c.name || "").toLowerCase().includes(q) ||
        (c.rank || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.Handler || "").toLowerCase().includes(q)
      );
    });
}


function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateCrew(id, updater){
  const idx = state.crew.findIndex(c => c.id === id);
  if (idx < 0) return;
  state.crew[idx] = updater(state.crew[idx]);
  saveState();
}

// ----- Helpers -----
function initials(name){
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "?";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeAttr(s){
  return escapeHtml(s).replaceAll("`","&#096;");
}

function formatBytes(bytes){
  const b = Number(bytes || 0);
  if (!b) return "0 B";
  const units = ["B","KB","MB","GB","TB"];
  let i = 0, n = b;
  while (n >= 1024 && i < units.length-1){ n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function cryptoId(){
  // short id; good enough for local storage usage
  return (crypto?.randomUUID?.() || (Date.now() + "-" + Math.random())).toString();
}

function fileToDataUrl(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// A tiny placeholder avatar (SVG data URL) using initials
function avatarPlaceholderDataUrl(name){
  const text = initials(name);
  const svg =
`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgba(120,180,255,0.45)"/>
      <stop offset="1" stop-color="rgba(140,110,255,0.35)"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="44" ry="44" fill="url(#g)"/>
  <circle cx="90" cy="80" r="90" fill="rgba(255,255,255,0.10)"/>
  <text x="50%" y="56%" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial" font-size="86" font-weight="900" fill="rgba(255,255,255,0.88)">${text}</text>
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// Start on list view
renderList();
showListView();


const crewEditorEl = document.getElementById("crewEditor");
const editorFormEl = document.getElementById("editorForm");
const editorTitleEl = document.getElementById("editorTitle");

const addCrewBtn = document.getElementById("addCrewBtn");
const editCrewBtn = document.getElementById("editCrewBtn");
const deleteCrewBtn = document.getElementById("deleteCrewBtn");

const closeEditorBtn = document.getElementById("closeEditorBtn");
const cancelCrewBtn = document.getElementById("cancelCrewBtn");
const saveCrewBtn = document.getElementById("saveCrewBtn");

let editingCrewId = null;

addCrewBtn.onclick = () => openEditor();
editCrewBtn.onclick = () => openEditor(selectedCrewId);
deleteCrewBtn.onclick = deleteCrew;



closeEditorBtn.onclick = cancelCrewBtn.onclick = closeEditor;

function openEditor(id = null){
  editingCrewId = id;
  crewEditorEl.classList.remove("hidden");

  const crew = id ? state.crew.find(c => c.id === id) : {};
  editorTitleEl.textContent = id ? "Edit Crew" : "Add Crew";

  editorFormEl.innerHTML = `
    ${input("Name","name",crew.name)}
    ${input("Type","type",crew.type,"select",["ETO","FITTERS"])}
    ${input("Rank","rank",crew.rank)}
    ${input("Nationality","nationality",crew.nationality)}
    ${input("Cabin","cabin",crew.cabin)}
    ${input("Email","email",crew.email)}
    ${input("Phone","phone",crew.phone)}
  `;
}

function closeEditor(){
  crewEditorEl.classList.add("hidden");
  editingCrewId = null;
}

function input(label,name,value="",type="text",options=[]){
  if(type==="select"){
    return `
      <div class="field">
        <label>${label}</label>
        <select name="${name}">
          ${options.map(o=>`<option ${o===value?"selected":""}>${o}</option>`).join("")}
        </select>
      </div>`;
  }
  return `
    <div class="field">
      <label>${label}</label>
      <input name="${name}" value="${value||""}">
    </div>`;
}

saveCrewBtn.onclick = () => {
  const data = {};
  editorFormEl.querySelectorAll("input,select")
    .forEach(el => data[el.name] = el.value);

  if(editingCrewId){
    updateCrew(editingCrewId, c => ({ ...c, ...data }));
  } else {
    state.crew.push({
      id: cryptoId(),
      status: "status1",
      attachments: [],
      photoDataUrl: "",
      ...data
    });
    saveState();
  }

  renderTypeList();
  renderList();
  closeEditor();
};

function deleteCrew(){
  if(!selectedCrewId) return;
  if(!confirm("Delete this crew member?")) return;

  state.crew = state.crew.filter(c => c.id !== selectedCrewId);
  saveState();
  selectedCrewId = null;
  renderTypeList();
crewGridEl.innerHTML = "";
viewTitleEl.textContent = "All Crew";
viewSubtitleEl.textContent = "Select a type from the left";
showListView();

}



