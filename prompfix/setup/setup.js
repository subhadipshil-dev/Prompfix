// Prompfix New Onboarding Setup (fixed to be fully working)
// Based on uiideas/prompfix_onboarding_setup.html + jsxideas/prompfix-setup.jsx
// All changes in /home/subhadip/Documents/GitHub/Prompfix/prompfix

const PROVIDERS = [
  { id:"openai",    name:"OpenAI",    icon:"⬡", color:"#10A37F", desc:"GPT-4o, o1, o3 series",      kp:"sk-proj-...",
    models:[
      {id:"gpt-4o",          name:"GPT-4o",          tag:"Flagship",      desc:"Most capable multimodal"},
      {id:"gpt-4o-mini",     name:"GPT-4o mini",      tag:"Fast",          desc:"Affordable & intelligent"},
      {id:"o3-mini",         name:"o3-mini",           tag:"Reasoning",     desc:"Latest fast reasoning"},
      {id:"o1",              name:"o1",               tag:"Reasoning",     desc:"Deep analysis & complex tasks"},
      {id:"o1-mini",         name:"o1-mini",           tag:"Reasoning",     desc:"Compact reasoning model"},
      {id:"gpt-4-turbo",     name:"GPT-4 Turbo",      tag:"Powerful",      desc:"128K context, high performance"},
      {id:"gpt-3.5-turbo",   name:"GPT-3.5 Turbo",    tag:"Legacy",        desc:"Fast & cost-effective classic"},
    ]},
  { id:"anthropic", name:"Anthropic", icon:"◆", color:"#D4734A", desc:"Claude 3.5, 4 & beyond",     kp:"sk-ant-api03-...",
    models:[
      {id:"claude-opus-4-6",   name:"Claude Opus 4.6",   tag:"Most Powerful", desc:"Frontier for complex tasks"},
      {id:"claude-sonnet-4-6", name:"Claude Sonnet 4.6", tag:"Balanced",      desc:"Smart & efficient everyday"},
      {id:"claude-haiku-4-5",  name:"Claude Haiku 4.5",  tag:"Fast",          desc:"Compact & responsive"},
      {id:"claude-3-5-sonnet", name:"Claude 3.5 Sonnet", tag:"Popular",       desc:"Excellent coding & analysis"},
      {id:"claude-3-5-haiku",  name:"Claude 3.5 Haiku",  tag:"Efficient",     desc:"Best speed-smarts balance"},
      {id:"claude-3-opus",     name:"Claude 3 Opus",     tag:"Deep",          desc:"Thoughtful, nuanced responses"},
    ]},
  { id:"google",    name:"Google",    icon:"◉", color:"#4285F4", desc:"Gemini 1.5, 2.0 & 2.5",     kp:"AIzaSy...",
    models:[
      {id:"gemini-2.5-pro",      name:"Gemini 2.5 Pro",     tag:"Latest",    desc:"Frontier model with thinking"},
      {id:"gemini-2.0-flash",    name:"Gemini 2.0 Flash",   tag:"Fast",      desc:"Speed + multimodal capability"},
      {id:"gemini-1.5-pro",      name:"Gemini 1.5 Pro",     tag:"Context",   desc:"Massive 2M token context"},
      {id:"gemini-1.5-flash",    name:"Gemini 1.5 Flash",   tag:"Efficient", desc:"Fast & cost-effective"},
      {id:"gemini-1.5-flash-8b", name:"Gemini 1.5 Flash 8B",tag:"Lite",      desc:"Ultra-lightweight tasks"},
    ]},
  { id:"mistral",   name:"Mistral AI",icon:"◈", color:"#FF7000", desc:"Open & commercial models",   kp:"Enter API key...",
    models:[
      {id:"mistral-large-latest",  name:"Mistral Large",   tag:"Flagship", desc:"Top-tier reasoning & multilingual"},
      {id:"mistral-medium-latest", name:"Mistral Medium",  tag:"Balanced", desc:"Strong at lower cost"},
      {id:"mistral-small-latest",  name:"Mistral Small",   tag:"Fast",     desc:"Low-latency, cost-optimized"},
      {id:"codestral-latest",      name:"Codestral",       tag:"Code",     desc:"Specialized code generation"},
      {id:"mixtral-8x22b",         name:"Mixtral 8x22B",   tag:"MoE",      desc:"Mixture-of-experts powerhouse"},
    ]},
  { id:"groq",      name:"Groq",      icon:"▷", color:"#F55036", desc:"Ultra-fast LPU inference",   kp:"gsk_...",
    models:[
      {id:"llama-3.3-70b",  name:"Llama 3.3 70B", tag:"Fast",       desc:"Meta's flagship at blazing speed"},
      {id:"llama-3.1-8b",   name:"Llama 3.1 8B",  tag:"Ultra-fast", desc:"Near-instant responses"},
      {id:"mixtral-8x7b",   name:"Mixtral 8x7B",  tag:"MoE",        desc:"32K context at high speed"},
      {id:"gemma2-9b",      name:"Gemma 2 9B",    tag:"Open",       desc:"Google's open model on Groq"},
      {id:"qwq-32b",        name:"QwQ 32B",       tag:"Reasoning",  desc:"Advanced reasoning model"},
    ]},
  { id:"cohere",    name:"Cohere",    icon:"❋", color:"#39B58A", desc:"Enterprise RAG & generation",kp:"Enter API key...",
    models:[
      {id:"command-r-plus", name:"Command R+ (Aug '24)", tag:"Advanced",  desc:"Best for complex RAG pipelines"},
      {id:"command-r",      name:"Command R (Aug '24)",  tag:"Efficient", desc:"Balanced RAG & generation"},
      {id:"command-light",  name:"Command Light",        tag:"Fast",      desc:"Lightweight quick tasks"},
    ]},
];

const STYLES = [
  {id:"concise",      name:"Concise & Direct",       icon:"⚡", desc:"Strips fluff, keeps only essential instructions"},
  {id:"balanced",     name:"Balanced",               icon:"⚖",  desc:"Improves clarity while maintaining original tone"},
  {id:"professional", name:"Highly Professional",    icon:"◆", desc:"Formal tone, structured format, extremely detailed"},
  {id:"creative",     name:"Creative & Exploratory", icon:"✦", desc:"Expands ideas, suggests alternatives, opens possibilities"},
];

const STEP_META = [
  {n:1,label:"Profile",       sub:"Your name & details"},
  {n:2,label:"API Connection",sub:"Connect your AI provider"},
  {n:3,label:"Default Model", sub:"Choose your go-to model"},
  {n:4,label:"Preferences",   sub:"Style & history"},
  {n:5,label:"All Set",       sub:"You're ready to go"},
];

let step = 1;
let form = { name:"", social:"", provider:"", key:"", showKey:false, model:"", style:"balanced", history:true };

function esc(s) { return (s||"").replace(/"/g,"&quot;"); }

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = "block"; }
}

function clearErrs() {
  document.querySelectorAll('.errmsg').forEach(e => { e.style.display='none'; e.textContent=''; });
}

function setStep(n, dir = "fwd") {
  const pane = document.getElementById("pane");
  pane.className = "pane hidden " + dir;
  setTimeout(() => {
    step = n;
    render();
    pane.className = "pane";
  }, 220);
}

function goNext() {
  clearErrs();

  // Defensive: sync latest values from DOM in case inline handlers had issues
  const nameInput = document.getElementById('iName');
  if (nameInput) form.name = nameInput.value;

  const keyInput = document.getElementById('iKey');
  if (keyInput) form.key = keyInput.value;

  if (step === 1) {
    if (!form.name.trim()) {
      showErr("errName", "Display name is required");
      return;
    }
  }
  if (step === 2) {
    if (!form.provider) {
      showErr("errProv", "Please select a provider");
      return;
    }
    if (!form.key.trim()) {
      showErr("errKey", "API key is required");
      return;
    }
  }
  if (step === 3) {
    if (!form.model) {
      showErr("errModel", "Please select a model");
      return;
    }
  }

  if (step < 5) {
    setStep(step + 1, "fwd");
  } else {
    finishSetup();
  }
}

function goBack() {
  if (step > 1) setStep(step - 1, "bwd");
}

function renderSteps() {
  const cont = document.getElementById("steps");
  if (!cont) return;
  cont.innerHTML = STEP_META.map(s => {
    const cls = step === s.n ? "active" : step > s.n ? "done" : "future";
    const num = step > s.n ? "✓" : s.n;
    return `<div class="si ${cls}">
      <div class="snum">${num}</div>
      <div><div class="slabel">${s.label}</div><div class="ssub">${s.sub}</div></div>
    </div>`;
  }).join("");
}

function attachPaneListeners() {
  const pane = document.getElementById("pane");
  if (!pane) return;

  // Name input (step 1)
  const nameInput = pane.querySelector('#iName');
  if (nameInput) {
    nameInput.oninput = () => {
      form.name = nameInput.value;
      clearErrs();
    };
    // Also allow Enter to proceed
    nameInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        goNext();
      }
    };
  }

  // Key input + toggle (step 2)
  const keyInput = pane.querySelector('#iKey');
  if (keyInput) {
    keyInput.oninput = () => {
      form.key = keyInput.value;
      clearErrs();
    };
    keyInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        goNext();
      }
    };
  }

  const keyTog = pane.querySelector('.ktog');
  if (keyTog) {
    keyTog.onclick = () => {
      form.showKey = !form.showKey;
      render(); // re-render to update type
    };
  }

  // Provider cards (step 2)
  pane.querySelectorAll('.pc').forEach(card => {
    card.onclick = () => {
      const id = card.getAttribute('data-prov-id') || card.onclick.toString().match(/'([^']+)'/)?.[1];
      // Better: we will set data attributes in the HTML template below
      if (card.dataset && card.dataset.prov) {
        selProv(card.dataset.prov);
      }
    };
  });

  // Model cards (step 3)
  pane.querySelectorAll('.mc').forEach(card => {
    card.onclick = () => {
      if (card.dataset && card.dataset.model) selModel(card.dataset.model);
    };
  });

  // Style cards (step 4)
  pane.querySelectorAll('.sc').forEach(card => {
    card.onclick = () => {
      if (card.dataset && card.dataset.style) selStyle(card.dataset.style);
    };
  });

  // History toggle (step 4)
  const histTog = pane.querySelector('.tog');
  if (histTog) {
    histTog.onclick = toggleHist;
  }
}

function renderPane() {
  const prov = PROVIDERS.find(p => p.id === form.provider);
  const pane = document.getElementById("pane");
  const back = document.getElementById("backBtn");
  const next = document.getElementById("nextBtn");

  if (back) {
    back.style.display = (step > 1 && step < 5) ? "" : "none";
    back.onclick = goBack;
  }
  if (next) {
    next.style.display = step < 5 ? "" : "none";
    next.textContent = step === 4 ? "Finish →" : "Continue →";
    next.onclick = goNext;
  }

  let html = '';

  if (step === 1) {
    html = `
      <h1>Create your profile</h1>
      <p class="sub">Personalizes your prompt refinement experience.</p>
      <div class="fld">
        <label class="lbl">Display Name</label>
        <input type="text" id="iName" placeholder="Alex Rivera" value="${esc(form.name)}">
        <div class="errmsg" id="errName" style="display:none"></div>
      </div>
      <div class="fld">
        <label class="lbl">Role or Social <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--txt3)">(optional)</span></label>
        <input type="text" id="iSocial" placeholder="https://x.com/yourhandle" value="${esc(form.social)}" oninput="form.social=this.value">
      </div>`;
  }

  else if (step === 2) {
    const pcards = PROVIDERS.map(p => `
      <div class="pc${form.provider===p.id ? " sel" : ""}" data-prov="${p.id}">
        ${form.provider===p.id ? '<div class="pchk">✓</div>' : ''}
        <span class="picon" style="color:${p.color}">${p.icon}</span>
        <div class="pname">${p.name}</div>
        <div class="pdesc">${p.desc}</div>
      </div>`).join("");

    html = `
      <h1>Connect your AI</h1>
      <p class="sub">API key stored securely on your device, never shared.</p>
      <div class="fld">
        <label class="lbl">Provider</label>
        <div class="pgrid">${pcards}</div>
        <div class="errmsg" id="errProv" style="display:none"></div>
      </div>
      <div class="fld">
        <label class="lbl">API Key</label>
        <div class="krow">
          <input id="iKey" type="${form.showKey ? "text" : "password"}" placeholder="${prov ? prov.kp : "Select a provider above…"}" value="${esc(form.key)}" style="padding-right:55px">
          <button class="ktog" type="button">${form.showKey ? "Hide" : "Show"}</button>
        </div>
        <div class="errmsg" id="errKey" style="display:none"></div>
        <div class="khint">🔒 Never shared · Stored in chrome.storage.local</div>
      </div>`;
  }

  else if (step === 3) {
    if (!prov) {
      html = `
        <h1>Choose your default model</h1>
        <p class="sub">You can change this later in settings.</p>
        <div class="noprov">
          <span style="font-size:34px;opacity:.35">◉</span>
          <span>No provider selected</span>
          <span style="font-size:11px;opacity:.6">Go back and select an AI provider first</span>
        </div>`;
    } else {
      const mcards = prov.models.map(m => `
        <div class="mc${form.model===m.id ? " sel" : ""}" data-model="${m.id}">
          <div class="mradio">${form.model===m.id ? '<div class="mrdot"></div>' : ''}</div>
          <div>
            <div class="mtag">${m.tag}</div>
            <div class="mname">${m.name}</div>
            <div class="mdesc">${m.desc}</div>
          </div>
        </div>`).join("");
      html = `
        <h1>Choose your default model</h1>
        <p class="sub"><span class="dot" style="background:${prov.color};width:7px;height:7px;border-radius:50%;display:inline-block"></span> ${prov.name} · ${prov.models.length} models available</p>
        <div class="mgrid">${mcards}</div>
        <div class="errmsg" id="errModel" style="display:none;margin-top:10px"></div>`;
    }
  }

  else if (step === 4) {
    const scards = STYLES.map(s => `
      <div class="sc${form.style===s.id ? " sel" : ""}" data-style="${s.id}">
        <div class="sico">${s.icon}</div>
        <div style="flex:1"><div class="sname">${s.name}</div><div class="sdesc">${s.desc}</div></div>
        ${form.style===s.id ? '<div class="stk">✓</div>' : ''}
      </div>`).join("");
    html = `
      <h1>Refinement preferences</h1>
      <p class="sub">Set your default style and history settings.</p>
      <label class="lbl">Default Style</label>
      ${scards}
      <div class="trow">
        <div><div class="tlbl">Save Prompt History</div><div class="tdesc">Keep local history of refined prompts (last 20)</div></div>
        <button class="tog${form.history ? " on" : ""}" type="button"><div class="tthumb"></div></button>
      </div>`;
  }

  else if (step === 5) {
    const model = prov?.models.find(m => m.id === form.model);
    const styleNames = {concise:"Concise & Direct",balanced:"Balanced",professional:"Highly Professional",creative:"Creative & Exploratory"};
    html = `
      <div class="success">
        <div class="sring">✓</div>
        <div class="stitle">You're all set.</div>
        <div class="ssub2">Prompfix is ready to refine your prompts across the web.</div>
        <div class="summary">
          <div class="srow"><span class="sk">Name</span><span class="sv">${esc(form.name)||"—"}</span></div>
          <div class="srow"><span class="sk">Provider</span><span class="sv"><span class="dot" style="background:${prov?.color||"#666"}"></span>${prov?.name||"—"}</span></div>
          <div class="srow"><span class="sk">Model</span><span class="sv">${model?.name||"—"}</span></div>
          <div class="srow"><span class="sk">Style</span><span class="sv">${styleNames[form.style]}</span></div>
          <div class="srow"><span class="sk">History</span><span class="sv"><span class="bdg" style="${form.history?"":"background:rgba(100,100,120,.15);color:var(--txt3)"}">${form.history?"Enabled":"Disabled"}</span></span></div>
        </div>
        <button class="btn btnp" style="font-size:14px;padding:12px 32px;border-radius:9px" id="launchBtn">Launch Prompfix →</button>
      </div>`;
  }

  pane.innerHTML = html;

  // Re-attach dynamic listeners after innerHTML (this fixes stuck issues with name and other fields)
  attachPaneListeners();

  // Special case for launch button on last step
  if (step === 5) {
    const launch = document.getElementById('launchBtn');
    if (launch) launch.onclick = finishSetup;
  }
}

function render() {
  renderSteps();
  renderPane();
}

function selProv(id) {
  if (form.provider !== id) { form.model = ""; }
  form.provider = id;
  render();
}
function selModel(id) { form.model = id; render(); }
function selStyle(id) { form.style = id; render(); }
function toggleKey() { form.showKey = !form.showKey; render(); }
function toggleHist() { form.history = !form.history; render(); }

// === Real extension save logic ===

function mapProviderToApiProvider(id) {
  const map = { openai: "OpenAI", anthropic: "Claude", google: "Gemini", mistral: "Mistral", groq: "Groq", cohere: "Cohere" };
  return map[id] || id;
}

function mapStyleToDefaultMode(styleId) {
  const map = { concise: "Shorter", balanced: "Balanced", professional: "Professional", creative: "Advanced" };
  return map[styleId] || "Balanced";
}

async function finishSetup() {
  const prov = PROVIDERS.find(p => p.id === form.provider);
  const apiProvider = mapProviderToApiProvider(form.provider);
  const defaultMode = mapStyleToDefaultMode(form.style);

  const dataToSave = {
    setupComplete: true,
    firstName: form.name.trim() || "Developer",
    socialLink: form.social.trim() || "",
    apiProvider: apiProvider,
    defaultMode: defaultMode,
    saveHistory: !!form.history,
    promptHistory: []
  };

  try {
    const stored = await chrome.storage.local.get(["apiKeys"]);
    const apiKeys = stored.apiKeys || {};
    if (form.key && form.key.trim()) {
      apiKeys[apiProvider] = form.key.trim();
    }
    dataToSave.apiKeys = apiKeys;

    if (form.model) {
      dataToSave.selectedModel = form.model;
      if (apiProvider === "Gemini") dataToSave.geminiModel = form.model;
    }

    await chrome.storage.local.set(dataToSave);

    const btn = document.getElementById("launchBtn");
    if (btn) {
      btn.textContent = "Done! Launching…";
      btn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    }

    setTimeout(() => {
      window.close();
    }, 850);
  } catch (err) {
    console.error("Setup save failed", err);
    alert("Failed to save your settings. Please try again or check extension permissions.");
  }
}

function loadExisting() {
  if (typeof chrome === "undefined" || !chrome.storage) {
    // Demo mode
    render();
    return;
  }
  chrome.storage.local.get(
    ["firstName", "socialLink", "apiProvider", "apiKeys", "defaultMode", "saveHistory", "selectedModel", "geminiModel"],
    (stored) => {
      if (stored.firstName) form.name = stored.firstName;
      if (stored.socialLink) form.social = stored.socialLink;

      if (stored.apiProvider) {
        const rev = { OpenAI: "openai", Claude: "anthropic", Gemini: "google" };
        form.provider = rev[stored.apiProvider] || stored.apiProvider.toLowerCase();
      }

      if (stored.apiKeys && form.provider) {
        const k = stored.apiKeys[stored.apiProvider];
        if (k) form.key = k;
      }

      if (stored.defaultMode) {
        const rev = { Shorter: "concise", Balanced: "balanced", Professional: "professional", Advanced: "creative" };
        form.style = rev[stored.defaultMode] || "balanced";
      }

      if (typeof stored.saveHistory === "boolean") form.history = stored.saveHistory;
      if (stored.selectedModel) form.model = stored.selectedModel;
      if (stored.geminiModel && form.provider === "google") form.model = stored.geminiModel;

      render();
    }
  );
}

function initStaticButtons() {
  const next = document.getElementById("nextBtn");
  if (next) next.onclick = goNext;

  const back = document.getElementById("backBtn");
  if (back) back.onclick = goBack;
}

function init() {
  initStaticButtons();
  render();
  loadExisting();

  // Keyboard support
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const nextBtn = document.getElementById("nextBtn");
      if (nextBtn && nextBtn.style.display !== "none") {
        e.preventDefault();
        goNext();
      }
    }
    if (e.key === "Escape") {
      const backBtn = document.getElementById("backBtn");
      if (backBtn && backBtn.style.display !== "none") {
        e.preventDefault();
        goBack();
      }
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}