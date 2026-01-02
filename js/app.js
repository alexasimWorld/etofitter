// Crew Platform - app.js

const STORAGE_KEY = "crew_platform_v1";

// 5 statuses (as requested) with distinct colors
const STATUSES = [
    { key: "studying", label: "Studying", color: "rgba(120,180,255,.30)" },
    { key: "evaluation", label: "Evaluation", color: "rgba(120,255,220,.22)" },
    { key: "preparation", label: "Preparation", color: "rgba(255,210,120,.22)" },
    { key: "assignment", label: "Assignment", color: "rgba(255,120,180,.22)" },
    { key: "proceed", label: "Proceed", color: "rgba(160,120,255,.22)" },
];

const TABS = [
    { key: "personal", label: "Personal details" },
    { key: "docs", label: "Documents Control" },
    { key: "sea", label: "Sea experience" },
    { key: "training", label: "Training Progress" },
    { key: "future", label: "Future employment" },
    { key: "status", label: "Status" },
];

let state = loadState();
let selectedType = null;
let selectedCrewId = null;
let activeTabKey = "personal";
let activeCourseTarget = null;
let activeCrewId = null;
let activeTrainingId = null;


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

const tabsBarEl = document.getElementById("tabsBar");
const tabBodyEl = document.getElementById("tabBody");

const crewEditorEl = document.getElementById("crewEditor");
const editorFormEl = document.getElementById("editorForm");
const editorTitleEl = document.getElementById("editorTitle");

const addCrewBtn = document.getElementById("addCrewBtn");
const editCrewBtn = document.getElementById("editCrewBtn");
const deleteCrewBtn = document.getElementById("deleteCrewBtn");

const closeEditorBtn = document.getElementById("closeEditorBtn");
const cancelCrewBtn = document.getElementById("cancelCrewBtn");
const saveCrewBtn = document.getElementById("saveCrewBtn");

const coursePopup = document.getElementById("coursePopup");
const courseGrid = document.getElementById("courseGrid");
const closeCoursePopupBtn = document.getElementById("closeCoursePopup");


let editingCrewId = null;

document.addEventListener("DOMContentLoaded", () => {
    renderTypeList();
    wireEvents();
    renderList();
    showListView();
});

closeCoursePopupBtn?.addEventListener("click", () => {
    coursePopup.classList.add("hidden");
});



function wireEvents() {
    // ---------------------------
    // Search & navigation
    // ---------------------------
    searchInputEl?.addEventListener("input", () => renderList());

    backBtn?.addEventListener("click", () => {
        selectedCrewId = null;
        showListView();
    });

    addCrewBtn && (addCrewBtn.onclick = () => openEditor());
    editCrewBtn && (editCrewBtn.onclick = () => openEditor(selectedCrewId));
    deleteCrewBtn && (deleteCrewBtn.onclick = deleteCrew);

    closeEditorBtn && (closeEditorBtn.onclick = closeEditor);
    cancelCrewBtn && (cancelCrewBtn.onclick = closeEditor);

    // ---------------------------
    // Export / Import JSON
    // ---------------------------
    const exportBtn = document.getElementById("exportJsonBtn");
    const importBtn = document.getElementById("importJsonBtn");
    const jsonFileInput = document.getElementById("jsonFileInput");

    // Export
    exportBtn && exportBtn.addEventListener("click", saveToJsonFile);

    // Import (OPEN FILE DIALOG ONCE)
    importBtn && importBtn.addEventListener("click", () => {
        jsonFileInput.value = "";   // allow re-import of same file
        jsonFileInput.click();
    });

    // Handle selected file
    jsonFileInput && jsonFileInput.addEventListener("change", () => {
        const file = jsonFileInput.files?.[0];
        jsonFileInput.value = "";   // critical reset
        if (file) loadFromJsonFile(file);
    });

    // ---------------------------
    // Save crew (Add / Edit)
    // ---------------------------
    if (saveCrewBtn) {
        saveCrewBtn.onclick = () => {
            const data = {};
            editorFormEl
                .querySelectorAll("input,select")
                .forEach(el => data[el.name] = el.value);

            if (editingCrewId) {
                updateCrew(editingCrewId, c => ({ ...c, ...data }));
            } else {
                state.crew.push(ensureCrewSchema({
                    id: cryptoId(),
                    status: "studying",
                    statusComment: "",
                    documents: [],
                    seaExperience: [],
                    training: [],
                    future: defaultFuture(),
                    photoDataUrl: "",
                    ...data
                }));
                saveState();
            }

            renderTypeList();
            renderList();
            closeEditor();

            if (editingCrewId) {
                selectedCrewId = editingCrewId;
                renderProfile(selectedCrewId);
                showProfileView();
            }
        };
    }
}




// ----- State -----
function loadState() {
    let stored = { crew: [] };

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) stored = JSON.parse(raw);
    } catch { }

    const seed = [
        ...(window.ETO_CREW || []),
        ...(window.FITTERS_CREW || [])
    ].map(c => ({
        ...c,
        Handler: c.Handler ?? c.handler ?? ""
    }));

    const byId = new Map();

    // Stored crew first
    (stored.crew || []).forEach(c => byId.set(c.id, c));

    // Add missing seed crew
    seed.forEach(c => {
        if (!byId.has(c.id)) byId.set(c.id, c);
    });

    return {
        crew: [...byId.values()].map(ensureCrewSchema)
    };
}



function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error(e);
        alert("Storage limit reached. Please export your JSON and clear old documents or reduce file sizes.");
    }
}


function ensureCrewSchema(c) {
    const base = {
        ...c,
        Handler: c.Handler ?? c.handler ?? "",
        status: normalizeStatusKey(c.status) || "studying",
        statusComment: c.statusComment || "",
        personal: c.personal || defaultPersonal(c),
        documents: Array.isArray(c.documents) ? c.documents : [],
        seaExperience: Array.isArray(c.seaExperience) ? c.seaExperience : [],
        training: Array.isArray(c.training) ? c.training : [],
        future: c.future || defaultFuture(),
        photoDataUrl: c.photoDataUrl || "",
    };
    return base;
}

function normalizeStatusKey(s) {
    if (!s) return "";
    // support old seed "status1..5"
    const old = String(s);
    if (old === "status1") return "studying";
    if (old === "status2") return "evaluation";
    if (old === "status3") return "preparation";
    if (old === "status4") return "assignment";
    if (old === "status5") return "proceed";
    // already new
    const k = old.toLowerCase();
    if (STATUSES.some(x => x.key === k)) return k;
    return "";
}

function defaultPersonal(c) {
    return {
        // Core
        firstName: "", lastName: "",
        dateOfBirth: "", placeOfBirth: "",
        age: "", // optional override; otherwise derived
        nationality: c.nationality || "",
        gender: "", maritalStatus: "",
        // Home
        addressLine1: "", addressLine2: "", city: "", stateRegion: "", postalCode: "", country: "",
        phoneHome: "", phoneMobile: c.phone || "", emailPersonal: c.email || "",
        // Family / NOK
        spouseName: "", spousePhone: "",
        childrenCount: "",
        nextOfKinName: "", nextOfKinRelation: "", nextOfKinPhone: "", nextOfKinEmail: "",
        // IDs / Health / Notes
        passportNo: "", seamanBookNo: "",
        medicalNotes: "",
        allergies: "",
        tshirtSize: "", shoeSize: "",
        languages: "",
        religion: "",
        emergencyAddress: "",
        remarks: "",
    };
}

function defaultFuture() {
    return {
        availabilityDate: "",
        preferredPosition: "",
        preferredVesselType: "",
        preferredTradingArea: "",
        preferredRotation: "",
        salaryExpectation: "",
        limitations: "",
        notes: "",
    };
}

function updateCrew(id, updater) {
    const idx = state.crew.findIndex(c => c.id === id);
    if (idx < 0) return;
    state.crew[idx] = ensureCrewSchema(updater(state.crew[idx]));
    saveState();
}

// ----- Views -----
function showListView() {
    listViewEl.classList.remove("hidden");
    profileViewEl.classList.add("hidden");

    addCrewBtn.classList.remove("hidden");
    editCrewBtn.classList.add("hidden");
    deleteCrewBtn.classList.add("hidden");

    const count = getFilteredCrew().length;
    viewTitleEl.textContent = selectedType || "All Crew";
    viewSubtitleEl.textContent = `${count} crew member${count === 1 ? "" : "s"} available`;
}

function showProfileView() {
    listViewEl.classList.add("hidden");
    profileViewEl.classList.remove("hidden");

    addCrewBtn.classList.add("hidden");
    editCrewBtn.classList.remove("hidden");
    deleteCrewBtn.classList.remove("hidden");
}

// ----- Rendering -----
function renderTypeList() {
    const types = ["ETO", "FITTERS"];
    typeListEl.innerHTML = "";

    for (const t of types) {
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
            [...typeListEl.querySelectorAll(".typeBtn")].forEach(x => x.classList.remove("active"));
            btn.classList.add("active");
            renderList();
            showListView();
        });

        typeListEl.appendChild(btn);
    }
}

function renderList() {
    const crew = getFilteredCrew();
    crewGridEl.innerHTML = "";

    viewTitleEl.textContent = selectedType || "All Crew";
    viewSubtitleEl.textContent = `Select a crew member to open the full profile`;

    for (const c0 of crew) {
        const c = ensureCrewSchema(c0);
        const card = document.createElement("div");
        card.className = "crewCard";

        const status = STATUSES.find(s => s.key === (c.status || "studying")) || STATUSES[0];

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
            activeTabKey = "personal";
            renderProfile(c.id);
            showProfileView();
        });

        crewGridEl.appendChild(card);
    }
}

function renderProfile(crewId) {
    const c = state.crew.find(x => x.id === crewId);
    if (!c) return;

    const crew = ensureCrewSchema(c);
    const status = STATUSES.find(s => s.key === (crew.status || "studying")) || STATUSES[0];

    profileNameEl.textContent = crew.name;
    profileRoleEl.textContent = `${crew.type} • ${crew.rank}`;

    
    // Tabs
    renderTabs(crewId);

    viewTitleEl.textContent = crew.name;
    viewSubtitleEl.textContent = `Full crew card • ${status.label}`;
}

function renderTabs(crewId) {
    const crew = state.crew.find(x => x.id === crewId);
    if (!crew) return;

    tabsBarEl.innerHTML = "";
    for (const t of TABS) {
        const b = document.createElement("button");
        b.className = "tabBtn" + (t.key === activeTabKey ? " active" : "");
        b.textContent = t.label;
        b.addEventListener("click", () => {
            activeTabKey = t.key;
            renderTabs(crewId);
        });
        tabsBarEl.appendChild(b);
    }

    // body
    tabBodyEl.innerHTML = "";
    if (activeTabKey === "personal") return renderTabPersonal(crewId);
    if (activeTabKey === "docs") return renderTabDocuments(crewId);
    if (activeTabKey === "sea") return renderTabSea(crewId);
    if (activeTabKey === "training") return renderTabTraining(crewId);
    if (activeTabKey === "future") return renderTabFuture(crewId);
    if (activeTabKey === "status") return renderTabStatus(crewId);
}

// =====================
// TAB 1: Personal details (30+ fields)
// =====================
function renderTabPersonal(crewId) {
    const c = ensureCrewSchema(state.crew.find(x => x.id === crewId));
    const p = c.personal;

    const identity = document.createElement("div");
    identity.className = "panel";
    identity.style.marginBottom = "14px";

    identity.innerHTML = `
  <div class="panelTitle">Identity</div>

  <div class="photoRow">
    <div class="avatarWrap">
      <img id="profilePhoto" class="avatar" alt="Crew photo" />
      <div class="avatarGlow"></div>
    </div>

    <div class="photoActions">
      <label class="btn small">
        Upload Photo
        <input id="photoInput" type="file" accept="image/*" hidden />
      </label>
      <button id="removePhotoBtn" class="btn small ghost">Remove</button>
      <div class="muted tiny">JPG/PNG/WebP</div>
    </div>
  </div>

  <div class="kvGrid" id="profileDetails"></div>
`;

    tabBodyEl.appendChild(identity);

    // Populate identity info
    const crew = ensureCrewSchema(c);

    const profilePhotoEl = identity.querySelector("#profilePhoto");
    const profileDetailsEl = identity.querySelector("#profileDetails");

    profilePhotoEl.src = crew.photoDataUrl || avatarPlaceholderDataUrl(crew.name);

    const details = [
        ["Type", crew.type],
        ["Rank", crew.rank],
        ["Nationality", crew.nationality || crew.personal?.nationality || "-"],
        ["Handler", crew.Handler || "-"],
        ["Email", crew.email || crew.personal?.emailPersonal || "-"],
        ["Phone", crew.phone || crew.personal?.phoneMobile || "-"],
    ];

    profileDetailsEl.innerHTML = "";
    for (const [k, v] of details) {
        const el = document.createElement("div");
        el.className = "kv";
        el.innerHTML = `<div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(v)}</div>`;
        profileDetailsEl.appendChild(el);
    }
    const photoInputEl = identity.querySelector("#photoInput");
    const removePhotoBtn = identity.querySelector("#removePhotoBtn");

    photoInputEl.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const dataUrl = await fileToDataUrl(file);
        updateCrew(crewId, c => ({ ...c, photoDataUrl: dataUrl }));
        renderTabs(crewId); // refresh tab
        e.target.value = "";
    });

    removePhotoBtn.addEventListener("click", () => {
        updateCrew(crewId, c => ({ ...c, photoDataUrl: "" }));
        renderTabs(crewId);
    });


    const fields = [
        ["First name", "firstName"], ["Last name", "lastName"],
        ["Date of birth", "dateOfBirth", "date"], ["Place of birth", "placeOfBirth"],
        ["Nationality", "nationality"], ["Gender", "gender"],
        ["Marital status", "maritalStatus"], ["Children count", "childrenCount", "number"],
        ["Address line 1", "addressLine1"], ["Address line 2", "addressLine2"],
        ["City", "city"], ["State/Region", "stateRegion"],
        ["Postal code", "postalCode"], ["Country", "country"],
        ["Home phone", "phoneHome"], ["Mobile phone", "phoneMobile"],
        ["Personal email", "emailPersonal"], ["Passport No", "passportNo"],
        ["Seaman book No", "seamanBookNo"], ["Spouse name", "spouseName"],
        ["Spouse phone", "spousePhone"], ["Next of kin name", "nextOfKinName"],
        ["NOK relation", "nextOfKinRelation"], ["NOK phone", "nextOfKinPhone"],
        ["NOK email", "nextOfKinEmail"], ["Languages", "languages"],
        ["Religion", "religion"], ["T-shirt size", "tshirtSize"],
        ["Shoe size", "shoeSize"], ["Allergies", "allergies"],
    ];

    const wrap = document.createElement("div");
    wrap.innerHTML = `
    <div class="muted tiny" style="margin-bottom:12px">
      Tip: Click in a field, edit, and it saves automatically (stored locally in this browser).
    </div>
    <div class="formGrid" id="personalGrid"></div>
    <div style="height:12px"></div>
    <div class="field">
      <label>Medical notes</label>
      <textarea id="p_medicalNotes" placeholder="Optional..."></textarea>
    </div>
    <div style="height:12px"></div>
    <div class="field">
      <label>Emergency address</label>
      <textarea id="p_emergencyAddress" placeholder="Optional..."></textarea>
    </div>
    <div style="height:12px"></div>
    <div class="field">
      <label>Remarks</label>
      <textarea id="p_remarks" placeholder="Optional..."></textarea>
    </div>
  `;
    tabBodyEl.appendChild(wrap);

    const grid = wrap.querySelector("#personalGrid");
    for (const [label, key, type = "text"] of fields) {
        const el = document.createElement("div");
        el.className = "field";
        el.innerHTML = `
      <label>${escapeHtml(label)}</label>
      <input data-k="${escapeAttr(key)}" type="${escapeAttr(type)}" value="${escapeAttr(p[key] || "")}" />
    `;
        grid.appendChild(el);
    }

    wrap.querySelector("#p_medicalNotes").value = p.medicalNotes || "";
    wrap.querySelector("#p_emergencyAddress").value = p.emergencyAddress || "";
    wrap.querySelector("#p_remarks").value = p.remarks || "";

    // save-on-input (debounced)
    const debouncedSave = debounce((k, v) => {
        updateCrew(crewId, cc => ({
            ...cc,
            personal: { ...(cc.personal || {}), [k]: v }
        }));
    }, 250);

    wrap.querySelectorAll("input[data-k]").forEach(inp => {
        inp.addEventListener("input", () => {
            const k = inp.getAttribute("data-k");
            debouncedSave(k, inp.value);
        });
    });

    ["medicalNotes", "emergencyAddress", "remarks"].forEach(k => {
        const id = k === "medicalNotes" ? "#p_medicalNotes" : (k === "emergencyAddress" ? "#p_emergencyAddress" : "#p_remarks");
        const ta = wrap.querySelector(id);
        ta.addEventListener("input", () => debouncedSave(k, ta.value));
    });
}

// =====================
// TAB 2: Documents Control (100+ docs, upload any file, dblclick view, remove, description)
// =====================
function renderTabDocuments(crewId) {
    const c = ensureCrewSchema(state.crew.find(x => x.id === crewId));

    const header = document.createElement("div");
    header.innerHTML = `
    <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; justify-content:space-between">
      <div>
        <div style="font-weight:900">Documents</div>
        <div class="muted tiny">Upload any file type. Double-click a row to open.</div>
      </div>
      <label class="btn">
        Upload Documents
        <input id="docsUpload" type="file" multiple hidden />
      </label>
    </div>
    <div style="height:12px"></div>
    <div class="muted tiny">Total documents: <b>${c.documents.length}</b></div>
    <div style="height:12px"></div>
    <div id="docsList"></div>
  `;
    tabBodyEl.appendChild(header);

    const list = header.querySelector("#docsList");
    renderDocsList(list, crewId);

    header.querySelector("#docsUpload").addEventListener("change", async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const payloads = [];
        for (const f of files) {
            payloads.push({
                id: cryptoId(),
                name: f.name,
                size: f.size,
                type: f.type || "application/octet-stream",
                addedAt: new Date().toISOString(),
                description: "",
                dataUrl: await fileToDataUrl(f),
            });
        }

        updateCrew(crewId, cc => ({ ...cc, documents: [...(cc.documents || []), ...payloads] }));
        renderTabs(crewId);
        e.target.value = "";
    });
}

function renderDocsList(container, crewId) {
    const c = ensureCrewSchema(state.crew.find(x => x.id === crewId));
    const docs = (c.documents || []).slice().sort((a, b) => (b.addedAt || "").localeCompare(a.addedAt || ""));

    container.innerHTML = "";

    if (!docs.length) {
        container.innerHTML = `<div class="muted">No documents yet.</div>`;
        return;
    }

    for (const d of docs) {
        const row = document.createElement("div");
        row.className = "tableRow";
        row.style.gridTemplateColumns = "2fr 1fr 2fr";

        row.innerHTML = `
      <div style="min-width:0">
        <div style="font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${escapeHtml(d.name)}">
          ${escapeHtml(d.name)}
        </div>
        <div class="muted tiny">${formatBytes(d.size)} • ${new Date(d.addedAt).toLocaleString()}</div>
      </div>

      <div class="field" style="margin:0">
        <label>Description</label>
        <input data-doc-desc="${escapeAttr(d.id)}" value="${escapeAttr(d.description || "")}" placeholder="short text..." />
      </div>

      <div class="rowActions">
        <button class="btn small" data-doc-open="${escapeAttr(d.id)}">Open</button>
        <button class="btn small ghost" data-doc-download="${escapeAttr(d.id)}">Download</button>
        <button class="btn small ghost" data-doc-del="${escapeAttr(d.id)}">Remove</button>
      </div>
    `;

        // double click opens
        row.addEventListener("dblclick", () => openDataUrl(d.dataUrl));

        row.querySelector("[data-doc-open]")?.addEventListener("click", () => openDataUrl(d.dataUrl));

        row.querySelector("[data-doc-download]")?.addEventListener("click", () => {
            const a = document.createElement("a");
            a.href = d.dataUrl;
            a.download = d.name || "file";
            a.click();
        });

        row.querySelector("[data-doc-del]")?.addEventListener("click", () => {
            if (!confirm("Remove this document?")) return;
            updateCrew(crewId, cc => ({ ...cc, documents: (cc.documents || []).filter(x => x.id !== d.id) }));
            renderTabs(crewId);
        });

        row.querySelector("[data-doc-desc]")?.addEventListener("input", (ev) => {
            const v = ev.currentTarget.value;
            updateCrew(crewId, cc => ({
                ...cc,
                documents: (cc.documents || []).map(x => x.id === d.id ? { ...x, description: v } : x)
            }));
        });

        container.appendChild(row);
    }
}

// =====================
// TAB 3: Sea experience (from-to + duration months auto, vessel, manager, manning, comments)
// =====================
function renderTabSea(crewId) {
    const c = ensureCrewSchema(state.crew.find(x => x.id === crewId));
    const wrap = document.createElement("div");

    wrap.innerHTML = `
    <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center">
      <div>
        <div style="font-weight:900">Sea experience</div>
        <div class="muted tiny">Contract duration is calculated automatically when you set From / To.</div>
      </div>
      <button id="seaAdd" class="btn">+ Add line</button>
    </div>
    <div style="height:12px"></div>
    <div id="seaList"></div>
  `;

    tabBodyEl.appendChild(wrap);

    const list = wrap.querySelector("#seaList");
    renderSeaList(list, crewId);

    wrap.querySelector("#seaAdd").addEventListener("click", () => {
        const line = {
            id: cryptoId(),
            from: "",
            to: "",
            months: 0,
            vesselName: "",
            managerName: "",
            manningOffice: "",
            comments: "",
        };
        updateCrew(crewId, cc => ({ ...cc, seaExperience: [...(cc.seaExperience || []), line] }));
        renderTabs(crewId);
    });
}

function renderSeaList(container, crewId) {
    const c = ensureCrewSchema(state.crew.find(x => x.id === crewId));
    const items = (c.seaExperience || []).slice();

    container.innerHTML = "";
    if (!items.length) {
        container.innerHTML = `<div class="muted">No sea experience lines yet.</div>`;
        return;
    }

    for (const it of items) {
        const row = document.createElement("div");
        row.className = "tableRow";
        row.style.gridTemplateColumns = "110px 110px 80px 1.5fr 1.5fr 1.5fr 2fr auto";
        row.style.alignItems = "center";


        row.innerHTML = `
<input
  type="date"
  data-sea-from="..."
  title="From"
/>


<input
  type="date"
  data-sea-to="..."
  title="To"
/>


<input
  type="text"
  disabled
  data-sea-months
  value="${(Number(it.months) || 0).toFixed(2)}"
  title="Months"
/>



<div class="rowActions">
  <button class="btn small ghost" data-sea-del>Remove</button>
</div>



<input
  data-sea-vessel="..."
  placeholder="Vessel"
  title="Vessel name"
/>


<input
  data-sea-manager="..."
  placeholder="Manager"
  title="Manager name"
/>


<input
  data-sea-manning="..."
  placeholder="Manning"
  title="Manning office"
/>


<input
  data-sea-comments="..."
  placeholder="Comments"
  title="Comments"
/>

    `;

        const fromEl = row.querySelector("[data-sea-from]");
        const toEl = row.querySelector("[data-sea-to]");

        const write = (patch) => {
            updateCrew(crewId, cc => ({
                ...cc,
                seaExperience: (cc.seaExperience || []).map(x => x.id === it.id ? { ...x, ...patch } : x)
            }));
        };

        fromEl.value = it.from || "";
        toEl.value = it.to || "";
        row.querySelector("[data-sea-months]").value = (Number(it.months) || 0).toFixed(2);


        row.querySelector("[data-sea-vessel]").value = it.vesselName || "";
        row.querySelector("[data-sea-manager]").value = it.managerName || "";
        row.querySelector("[data-sea-manning]").value = it.manningOffice || "";
        row.querySelector("[data-sea-comments]").value = it.comments || "";


        function updateMonths() {
            const from = fromEl.value;
            const to = toEl.value;
            const months = calcMonths(from, to);
            write({ from, to, months });

            // update months field ONLY
            const monthsInput = row.querySelector("[data-sea-months]");
            if (monthsInput) monthsInput.value = (Number(months) || 0).toFixed(2);

        }


        fromEl.addEventListener("change", updateMonths);
        toEl.addEventListener("change", updateMonths);

        row.querySelector("[data-sea-vessel]")?.addEventListener("input", e => write({ vesselName: e.currentTarget.value }));
        row.querySelector("[data-sea-manager]")?.addEventListener("input", e => write({ managerName: e.currentTarget.value }));
        row.querySelector("[data-sea-manning]")?.addEventListener("input", e => write({ manningOffice: e.currentTarget.value }));
        row.querySelector("[data-sea-comments]")?.addEventListener("input", e => write({ comments: e.currentTarget.value }));

        row.querySelector("[data-sea-del]").addEventListener("click", () => {

            if (!confirm("Remove this sea experience line?")) return;
            updateCrew(crewId, cc => ({ ...cc, seaExperience: (cc.seaExperience || []).filter(x => x.id !== it.id) }));
            renderTabs(crewId);
        });

        container.appendChild(row);
    }
}

// =====================
// TAB 4: Training Progress (add/edit/remove)
// =====================
function renderTabTraining(crewId) {
    const c = ensureCrewSchema(state.crew.find(x => x.id === crewId));
    const wrap = document.createElement("div");

    wrap.innerHTML = `
    <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center">
      <div>
        <div style="font-weight:900">Training Progress (Required as per rank specific)</div>
        <div class="muted tiny">Track enrolled, ongoing and completed courses.</div>
      </div>
      <button id="trAdd" class="btn">+ Add course</button>
    </div>
    <div style="height:12px"></div>
    <div id="trList"></div>
  `;

    tabBodyEl.appendChild(wrap);
    const list = wrap.querySelector("#trList");
    renderTrainingList(list, crewId);

    wrap.querySelector("#trAdd").addEventListener("click", () => {
        const line = {
            id: cryptoId(),
            courseId: "",
            status: "Enrolled",
            dateStarted: "",
            dateCompleted: "",
            responsible: "",
        };
        updateCrew(crewId, cc => ({ ...cc, training: [...(cc.training || []), line] }));
        renderTabs(crewId);
    });
}

function renderTrainingList(container, crewId) {
    const c = ensureCrewSchema(state.crew.find(x => x.id === crewId));
    const items = (c.training || []).slice();

    container.innerHTML = "";
    if (!items.length) {
        container.innerHTML = `<div class="muted">No training records yet.</div>`;
        return;
    }

    for (const it of items) {
        const row = document.createElement("div");
        row.className = "tableRow";
        row.style.gridTemplateColumns =
            "2.5fr 1fr 110px 110px 1.5fr auto";
        row.style.alignItems = "center";


        row.innerHTML = `
<div class="courseSelect" data-course-select>
  <div class="courseLabel">Course</div>
  <div class="courseValue">
    <span data-course-text>— Select training course (Only shows available courses per rank)—</span>
    <span class="courseArrow">▸</span>
  </div>
</div>




<select data-tr-status title="Status">
  <option value="Enrolled">Enrolled</option>
  <option value="Ongoing">Ongoing</option>
  <option value="Completed">Completed</option>
</select>



<input
  type="date"
  data-tr-start="..."
  title="Start date"
/>


<input
  type="date"
  data-tr-end="..."
  title="End date"
/>


<input
  data-tr-resp="..."
  placeholder="Responsible"
  title="Responsible person"
/>


      <div class="rowActions">
        <button class="btn small ghost" data-tr-del="${escapeAttr(it.id)}">Remove</button>
      </div>
    `;

        const write = (patch) => {
            updateCrew(crewId, cc => ({
                ...cc,
                training: (cc.training || []).map(x => x.id === it.id ? { ...x, ...patch } : x)
            }));
        };

        // restore saved values
        row.querySelector("[data-tr-status]").value = it.status || "Enrolled";
        row.querySelector("[data-tr-start]").value = it.dateStarted || "";
        row.querySelector("[data-tr-end]").value = it.dateCompleted || "";
        row.querySelector("[data-tr-resp]").value = it.responsible || "";



        const courseSelectEl = row.querySelector("[data-course-select]");
        const courseTextEl = row.querySelector("[data-course-text]");

        // initial value
        if (it.courseId) {
            const found = window.TRAINING_COURSES.find(c => c.id === it.courseId);
            if (found) courseTextEl.textContent = found.label;
        }


        courseSelectEl.addEventListener("click", () => {
            openCoursePopup(courseSelectEl, c.type, crewId, it.id);
        });



        row.querySelector("[data-tr-status]")?.addEventListener("change", e => write({ status: e.currentTarget.value }));
        row.querySelector("[data-tr-start]")?.addEventListener("change", e => write({ dateStarted: e.currentTarget.value }));
        row.querySelector("[data-tr-end]")?.addEventListener("change", e => write({ dateCompleted: e.currentTarget.value }));
        row.querySelector("[data-tr-resp]")?.addEventListener("input", e => write({ responsible: e.currentTarget.value }));

        row.querySelector("[data-tr-del]")?.addEventListener("click", () => {
            if (!confirm("Remove this training record?")) return;
            updateCrew(crewId, cc => ({ ...cc, training: (cc.training || []).filter(x => x.id !== it.id) }));
            renderTabs(crewId);
        });

        container.appendChild(row);
    }
}

// =====================
// TAB 5: Future employment (plans)
// =====================
function renderTabFuture(crewId) {
    const c = ensureCrewSchema(state.crew.find(x => x.id === crewId));
    const f = c.future;

    const wrap = document.createElement("div");
    wrap.innerHTML = `
    <div style="font-weight:900">Future employment</div>
    <div class="muted tiny" style="margin-bottom:12px">
      Use this tab for availability, preferences, constraints, and planning notes.
    </div>

    <div class="formGrid">
      <div class="field">
        <label>Availability date</label>
        <input type="date" id="f_availabilityDate" value="${escapeAttr(f.availabilityDate || "")}" />
      </div>
      <div class="field">
        <label>Preferred position</label>
        <input id="f_preferredPosition" value="${escapeAttr(f.preferredPosition || "")}" placeholder="e.g., ETO / Senior Fitter..." />
      </div>
      <div class="field">
        <label>Preferred vessel type</label>
        <input id="f_preferredVesselType" value="${escapeAttr(f.preferredVesselType || "")}" placeholder="e.g., Tanker / Bulk / Container..." />
      </div>
      <div class="field">
        <label>Preferred trading area</label>
        <input id="f_preferredTradingArea" value="${escapeAttr(f.preferredTradingArea || "")}" placeholder="e.g., Worldwide / Med / Asia..." />
      </div>
      <div class="field">
        <label>Preferred rotation</label>
        <input id="f_preferredRotation" value="${escapeAttr(f.preferredRotation || "")}" placeholder="e.g., 2/2, 3/3..." />
      </div>
      <div class="field">
        <label>Salary expectation</label>
        <input id="f_salaryExpectation" value="${escapeAttr(f.salaryExpectation || "")}" placeholder="Optional..." />
      </div>
      <div class="field">
        <label>Limitations / constraints</label>
        <textarea id="f_limitations" placeholder="Medical, travel limitations, visa, etc."></textarea>
      </div>
      <div class="field">
        <label>Notes</label>
        <textarea id="f_notes" placeholder="Planning notes..."></textarea>
      </div>
    </div>
  `;
    tabBodyEl.appendChild(wrap);

    wrap.querySelector("#f_limitations").value = f.limitations || "";
    wrap.querySelector("#f_notes").value = f.notes || "";

    const save = debounce(() => {
        updateCrew(crewId, cc => ({
            ...cc,
            future: {
                ...(cc.future || {}),
                availabilityDate: wrap.querySelector("#f_availabilityDate").value,
                preferredPosition: wrap.querySelector("#f_preferredPosition").value,
                preferredVesselType: wrap.querySelector("#f_preferredVesselType").value,
                preferredTradingArea: wrap.querySelector("#f_preferredTradingArea").value,
                preferredRotation: wrap.querySelector("#f_preferredRotation").value,
                salaryExpectation: wrap.querySelector("#f_salaryExpectation").value,
                limitations: wrap.querySelector("#f_limitations").value,
                notes: wrap.querySelector("#f_notes").value,
            }
        }));
    }, 250);

    wrap.querySelectorAll("input,textarea").forEach(el => el.addEventListener("input", save));
}

// =====================
// TAB 6: Status (5 buttons + comment)
// =====================
function renderTabStatus(crewId) {
    const c = ensureCrewSchema(state.crew.find(x => x.id === crewId));
    const current = STATUSES.find(s => s.key === c.status) || STATUSES[0];

    const wrap = document.createElement("div");
    wrap.innerHTML = `
    <div style="font-weight:900">Status</div>
    <div class="muted tiny">Select one status and add a comment for context.</div>

    <div class="statusGrid" id="statusGrid"></div>

    <div style="height:12px"></div>

    <div class="field">
      <label>Status comment (${escapeHtml(current.label)})</label>
      <textarea id="statusComment" placeholder="Optional..."></textarea>
      <div class="help">Example: “Waiting for medical renewal”, “Ready for assignment after 10/01”, etc.</div>
    </div>
  `;
    tabBodyEl.appendChild(wrap);

    const grid = wrap.querySelector("#statusGrid");
    for (const s of STATUSES) {
        const b = document.createElement("button");
        b.className = "statusBtn" + (s.key === c.status ? " active" : "");
        b.style.background = `linear-gradient(135deg, ${s.color}, rgba(0,0,0,.18))`;
        b.textContent = s.label;
        b.addEventListener("click", () => {
            updateCrew(crewId, cc => ({ ...cc, status: s.key }));
            // refresh profile header subtitle etc.
            renderProfile(crewId);
            // keep status tab active
            activeTabKey = "status";
            renderTabs(crewId);
        });
        grid.appendChild(b);
    }

    const ta = wrap.querySelector("#statusComment");
    ta.value = c.statusComment || "";
    ta.addEventListener("input", debounce(() => {
        updateCrew(crewId, cc => ({ ...cc, statusComment: ta.value }));
        // optional: keep profile subtitle fresh
        renderProfile(crewId);
        activeTabKey = "status";
        renderTabs(crewId);
    }, 350));
}

// ----- Filtering (we’ll expand later; for now keep base search) -----
function getFilteredCrew() {
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

// ----- Add/Edit modal -----
function openEditor(id = null) {
    editingCrewId = id;
    crewEditorEl.classList.remove("hidden");

    const crew = id ? state.crew.find(c => c.id === id) : {};
    editorTitleEl.textContent = id ? "Edit Crew" : "Add Crew";

    editorFormEl.innerHTML = `
    ${input("Name", "name", crew?.name)}
    ${input("Type", "type", crew?.type, "select", ["ETO", "FITTERS"])}
    ${input("Rank", "rank", crew?.rank)}
    ${input("Nationality", "nationality", crew?.nationality)}
    ${input("Cabin", "cabin", crew?.cabin)}
    ${input("Email", "email", crew?.email)}
    ${input("Phone", "phone", crew?.phone)}
    ${input("Handler", "Handler", crew?.Handler)}
  `;
}

function closeEditor() {
    crewEditorEl.classList.add("hidden");
    editingCrewId = null;
}

function input(label, name, value = "", type = "text", options = []) {
    if (type === "select") {
        return `
      <div class="field">
        <label>${label}</label>
        <select name="${escapeAttr(name)}">
          ${options.map(o => `<option ${o === value ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}
        </select>
      </div>`;
    }
    return `
    <div class="field">
      <label>${label}</label>
      <input name="${escapeAttr(name)}" value="${escapeAttr(value || "")}">
    </div>`;
}


function deleteCrew() {
    if (!selectedCrewId) return;
    if (!confirm("Delete this crew member?")) return;

    state.crew = state.crew.filter(c => c.id !== selectedCrewId);
    saveState();
    selectedCrewId = null;
    renderTypeList();
    renderList();
    showListView();
}

// ----- Helpers -----
function initials(name) {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "?";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
}

function escapeHtml(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
function escapeAttr(s) {
    return escapeHtml(s).replaceAll("`", "&#096;");
}

function formatBytes(bytes) {
    const b = Number(bytes || 0);
    if (!b) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0, n = b;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function cryptoId() {
    return (crypto?.randomUUID?.() || (Date.now() + "-" + Math.random())).toString();
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}

function openDataUrl(dataUrl) {
    try {
        // Try new tab first
        const win = window.open("", "_blank");
        if (!win) {
            // Fallback: same tab
            window.location.href = dataUrl;
            return;
        }

        // Write minimal HTML wrapper
        win.document.open();
        win.document.write(`
            <!doctype html>
            <html>
            <head>
              <title>Document Viewer</title>
              <meta charset="utf-8"/>
              <style>
                html,body{margin:0;height:100%;background:#000}
                iframe,img,embed{
                  width:100%;
                  height:100%;
                  border:none;
                  object-fit:contain;
                }
              </style>
            </head>
            <body>
              <embed src="${dataUrl}" />
            </body>
            </html>
        `);
        win.document.close();
    } catch (e) {
        alert("Unable to open file. Please allow popups.");
    }
}


// months difference between two YYYY-MM-DD strings (inclusive-ish, simple and stable)
function calcMonths(fromStr, toStr) {
    if (!fromStr || !toStr) return 0;

    const from = new Date(fromStr);
    const to = new Date(toStr);
    if (isNaN(from) || isNaN(to) || to < from) return 0;

    const days = (to - from) / (1000 * 60 * 60 * 24) + 1;
    const months = days / 30.4375; // average month length
    return Math.round(months * 100) / 100; // 2 decimals

}


function debounce(fn, ms) {
    let t = null;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

// Placeholder avatar
function avatarPlaceholderDataUrl(name) {
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


function saveToJsonFile() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `crew_platform_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}



function loadFromJsonFile(file) {
    const reader = new FileReader();

    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);

            if (!data || !Array.isArray(data.crew)) {
                alert("Invalid crew JSON file.");
                return;
            }

            state = {
                crew: data.crew.map(ensureCrewSchema)
            };

            saveState();

            selectedType = null;
            selectedCrewId = null;
            activeTabKey = "personal";

            renderTypeList();
            renderList();
            showListView();

            viewSubtitleEl.textContent = "Crew data loaded successfully";
        } catch (err) {
            console.error(err);
            alert("Failed to load JSON file.");
        }
    };

    reader.readAsText(file);
}



const jsonFileInput = document.createElement("input");
jsonFileInput.type = "file";
jsonFileInput.accept = ".json";
jsonFileInput.hidden = true;

jsonFileInput.addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (file) loadFromJsonFile(file);
    jsonFileInput.value = "";
});

document.body.appendChild(jsonFileInput);



function openCoursePopup(anchorEl, crewType, crewId, trainingId) {
    if (!anchorEl) return;

    activeCourseTarget = anchorEl;
    activeCrewId = crewId;
    activeTrainingId = trainingId;

    if (!Array.isArray(window.TRAINING_COURSES)) {
        console.warn("TRAINING_COURSES not loaded");
        return;
    }

    const searchInput = document.getElementById("courseSearchInput");
    searchInput.value = "";


    function renderCourses(filterText = "") {
        courseGrid.innerHTML = "";

        const q = filterText.trim().toLowerCase();

        const courses = window.TRAINING_COURSES
            .map(c => {
                const isRelevant =
                    crewType === "ETO"
                        ? /hv|plc|automation|electrical/i.test(c.id)
                        : true;

                return { ...c, isRelevant };
            })
            .filter(c =>
                !q ||
                c.label.toLowerCase().includes(q) ||
                c.id.toLowerCase().includes(q)
            )
            .sort((a, b) => {
                if (a.isRelevant !== b.isRelevant) {
                    return a.isRelevant ? -1 : 1;
                }
                return a.label.localeCompare(b.label);
            });

        let dividerAdded = false;

        for (const c of courses) {
            if (!c.isRelevant && !dividerAdded) {
                const div = document.createElement("div");
                div.className = "courseDivider";
                div.textContent = "Other courses";
                courseGrid.appendChild(div);
                dividerAdded = true;
            }

            const tile = document.createElement("div");
            tile.className = "courseTile" + (c.isRelevant ? "" : " disabled");
            tile.textContent = c.label;

            if (c.isRelevant) {
                tile.addEventListener("click", () => {
                    updateCrew(activeCrewId, cc => ({
                        ...cc,
                        training: (cc.training || []).map(t =>
                            t.id === activeTrainingId
                                ? { ...t, courseId: c.id }
                                : t
                        )
                    }));

                    const labelEl = activeCourseTarget.querySelector("[data-course-text]");
                    if (labelEl) labelEl.textContent = c.label;

                    coursePopup.classList.add("hidden");
                    document.body.style.overflow = "";
                    renderTabs(activeCrewId);
                });
            }

            courseGrid.appendChild(tile);
        }
    }

    searchInput.addEventListener("input", () => {
        renderCourses(searchInput.value);
    });


    renderCourses();


    courseGrid.innerHTML = "";

    const courses = window.TRAINING_COURSES.map(c => {
        const isRelevant =
            crewType === "ETO"
                ? /hv|plc|automation|electrical/i.test(c.id)
                : true;

        return { ...c, isRelevant };
    });

    // Sort: relevant first, then alphabetical
    courses.sort((a, b) => {
        if (a.isRelevant !== b.isRelevant) {
            return a.isRelevant ? -1 : 1;
        }
        return a.label.localeCompare(b.label);
    });

    let insertedDivider = false;

    for (const c of courses) {
        if (!c.isRelevant && !insertedDivider) {
            const divider = document.createElement("div");
            divider.className = "courseDivider";
            divider.textContent = "Other available courses";
            courseGrid.appendChild(divider);
            insertedDivider = true;
        }

        for (const c of courses) {
            const tile = document.createElement("div");
            tile.className = "courseTile" + (c.isRelevant ? "" : " disabled");
            tile.textContent = c.label;

            if (c.isRelevant) {
                tile.addEventListener("click", () => {
                    updateCrew(activeCrewId, cc => ({
                        ...cc,
                        training: (cc.training || []).map(t =>
                            t.id === activeTrainingId
                                ? { ...t, courseId: c.id }
                                : t
                        )
                    }));

                    const labelEl = activeCourseTarget.querySelector("[data-course-text]");
                    if (labelEl) labelEl.textContent = c.label;

                    coursePopup.classList.add("hidden");
                    document.body.style.overflow = "";
                    renderTabs(activeCrewId);
                });
            }

            courseGrid.appendChild(tile);
        }

    }
    // Open modal
    coursePopup.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}
