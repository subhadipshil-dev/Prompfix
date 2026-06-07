import { useState, useEffect } from "react";

const PROVIDERS = [
  {
    id: "openai", name: "OpenAI", icon: "⬡", color: "#10A37F",
    desc: "GPT-4o, o1, o3 series",
    keyPlaceholder: "sk-proj-...",
    models: [
      { id: "gpt-4o",            name: "GPT-4o",         tag: "Flagship",   desc: "Most capable multimodal model" },
      { id: "gpt-4o-mini",       name: "GPT-4o mini",    tag: "Fast",       desc: "Affordable & intelligent" },
      { id: "o3-mini",           name: "o3-mini",         tag: "Reasoning",  desc: "Latest fast reasoning model" },
      { id: "o1",                name: "o1",              tag: "Reasoning",  desc: "Deep analysis, complex tasks" },
      { id: "o1-mini",           name: "o1-mini",         tag: "Reasoning",  desc: "Compact reasoning model" },
      { id: "gpt-4-turbo",       name: "GPT-4 Turbo",    tag: "Powerful",   desc: "128K context, high performance" },
      { id: "gpt-3.5-turbo",     name: "GPT-3.5 Turbo",  tag: "Legacy",     desc: "Fast & cost-effective classic" },
    ],
  },
  {
    id: "anthropic", name: "Anthropic", icon: "◆", color: "#D4734A",
    desc: "Claude 3.5, 4 & beyond",
    keyPlaceholder: "sk-ant-api03-...",
    models: [
      { id: "claude-opus-4-6",     name: "Claude Opus 4.6",     tag: "Most Powerful", desc: "Frontier intelligence for complex tasks" },
      { id: "claude-sonnet-4-6",   name: "Claude Sonnet 4.6",   tag: "Balanced",      desc: "Smart & efficient for everyday use" },
      { id: "claude-haiku-4-5",    name: "Claude Haiku 4.5",    tag: "Fast",          desc: "Compact, responsive & affordable" },
      { id: "claude-3-5-sonnet",   name: "Claude 3.5 Sonnet",   tag: "Popular",       desc: "Excellent for coding & analysis" },
      { id: "claude-3-5-haiku",    name: "Claude 3.5 Haiku",    tag: "Efficient",     desc: "Best balance of speed & smarts" },
      { id: "claude-3-opus",       name: "Claude 3 Opus",       tag: "Deep",          desc: "Thoughtful, nuanced responses" },
    ],
  },
  {
    id: "google", name: "Google", icon: "◉", color: "#4285F4",
    desc: "Gemini 1.5, 2.0 & 2.5",
    keyPlaceholder: "AIzaSy...",
    models: [
      { id: "gemini-2.5-pro",        name: "Gemini 2.5 Pro",     tag: "Latest",   desc: "Frontier model with thinking mode" },
      { id: "gemini-2.0-flash",      name: "Gemini 2.0 Flash",   tag: "Fast",     desc: "Speed + multimodal capability" },
      { id: "gemini-1.5-pro",        name: "Gemini 1.5 Pro",     tag: "Context",  desc: "Massive 2M token context window" },
      { id: "gemini-1.5-flash",      name: "Gemini 1.5 Flash",   tag: "Efficient", desc: "Fast & cost-effective" },
      { id: "gemini-1.5-flash-8b",   name: "Gemini 1.5 Flash 8B",tag: "Lite",    desc: "Ultra-lightweight for simple tasks" },
    ],
  },
  {
    id: "mistral", name: "Mistral AI", icon: "◈", color: "#FF7000",
    desc: "Open & commercial models",
    keyPlaceholder: "Enter API key...",
    models: [
      { id: "mistral-large-latest",    name: "Mistral Large",    tag: "Flagship",  desc: "Top-tier reasoning & multilingual" },
      { id: "mistral-medium-latest",   name: "Mistral Medium",   tag: "Balanced",  desc: "Strong performance at lower cost" },
      { id: "mistral-small-latest",    name: "Mistral Small",    tag: "Fast",      desc: "Low-latency, cost-optimized" },
      { id: "codestral-latest",        name: "Codestral",        tag: "Code",      desc: "Specialized for code generation" },
      { id: "mixtral-8x22b-instruct",  name: "Mixtral 8x22B",   tag: "MoE",       desc: "Mixture-of-experts powerhouse" },
    ],
  },
  {
    id: "groq", name: "Groq", icon: "▷", color: "#F55036",
    desc: "Ultra-fast LPU inference",
    keyPlaceholder: "gsk_...",
    models: [
      { id: "llama-3.3-70b-versatile",  name: "Llama 3.3 70B",   tag: "Fast",       desc: "Meta's flagship at blazing speed" },
      { id: "llama-3.1-8b-instant",     name: "Llama 3.1 8B",    tag: "Ultra-fast", desc: "Near-instant responses" },
      { id: "mixtral-8x7b-32768",       name: "Mixtral 8x7B",    tag: "MoE",        desc: "32K context at high speed" },
      { id: "gemma2-9b-it",             name: "Gemma 2 9B",      tag: "Open",       desc: "Google's open model on Groq" },
      { id: "qwen-qwq-32b",             name: "QwQ 32B",         tag: "Reasoning",  desc: "Advanced reasoning, Qwen series" },
    ],
  },
  {
    id: "cohere", name: "Cohere", icon: "❋", color: "#39B58A",
    desc: "Enterprise RAG & generation",
    keyPlaceholder: "Enter API key...",
    models: [
      { id: "command-r-plus-08-2024", name: "Command R+ (Aug '24)", tag: "Advanced",  desc: "Best for complex RAG pipelines" },
      { id: "command-r-08-2024",      name: "Command R (Aug '24)",  tag: "Efficient", desc: "Balanced RAG & generation" },
      { id: "command-light",          name: "Command Light",        tag: "Fast",      desc: "Lightweight for quick tasks" },
    ],
  },
];

const REFINEMENT_STYLES = [
  { id: "concise",      name: "Concise & Direct",       icon: "⚡", desc: "Strips fluff, keeps only essential instructions" },
  { id: "balanced",     name: "Balanced",               icon: "⚖",  desc: "Improves clarity while maintaining original tone" },
  { id: "professional", name: "Highly Professional",    icon: "◆", desc: "Formal tone, structured format, extremely detailed" },
  { id: "creative",     name: "Creative & Exploratory", icon: "✦", desc: "Expands ideas, suggests alternatives, opens possibilities" },
];

const STYLE_NAMES = { concise: "Concise & Direct", balanced: "Balanced", professional: "Highly Professional", creative: "Creative & Exploratory" };

const STEP_META = [
  { n: 1, label: "Profile",        sub: "Your name & details" },
  { n: 2, label: "API Connection", sub: "Connect your AI provider" },
  { n: 3, label: "Default Model",  sub: "Choose your go-to model" },
  { n: 4, label: "Preferences",    sub: "Style & history" },
  { n: 5, label: "All Set",        sub: "You're ready to go" },
];

export default function PrompfixSetup() {
  const [step, setStep]           = useState(1);
  const [visible, setVisible]     = useState(true);
  const [direction, setDirection] = useState("fwd");

  const [profile,     setProfile]     = useState({ name: "", social: "" });
  const [apiConn,     setApiConn]     = useState({ provider: "", key: "", showKey: false });
  const [modelChoice, setModelChoice] = useState("");
  const [prefs,       setPrefs]       = useState({ style: "balanced", saveHistory: true });
  const [errors,      setErrors]      = useState({});

  // Reset model when provider changes
  useEffect(() => { setModelChoice(""); }, [apiConn.provider]);

  const selectedProvider = PROVIDERS.find(p => p.id === apiConn.provider);

  const navigate = (to, dir = "fwd") => {
    setDirection(dir);
    setVisible(false);
    setTimeout(() => { setStep(to); setVisible(true); }, 220);
  };

  const validate = () => {
    const e = {};
    if (step === 1 && !profile.name.trim())    e.name     = "Display name is required";
    if (step === 2 && !apiConn.provider)       e.provider = "Please select a provider";
    if (step === 2 && !apiConn.key.trim())     e.key      = "API key is required";
    if (step === 3 && !modelChoice)            e.model    = "Please select a model";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const onContinue = () => { if (validate()) navigate(step + 1); };
  const onBack     = () => navigate(step - 1, "bwd");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%}

        :root{
          --bg:       #0B0B0E;
          --surface:  #141418;
          --card:     #1C1C22;
          --border:   #26262E;
          --border2:  #303040;
          --accent:   #7C3AED;
          --accent2:  #9B5CF6;
          --txt1:     #F0F0F4;
          --txt2:     #A0A0B0;
          --txt3:     #5C5C70;
          --green:    #10B981;
          --red:      #EF4444;
          --radius:   10px;
        }

        .pf{display:flex;height:100vh;background:var(--bg);color:var(--txt1);font-family:'DM Sans',sans-serif;overflow:hidden}

        /* ── Sidebar ── */
        .pf-sb{
          width:210px;min-width:210px;background:var(--surface);
          border-right:1px solid var(--border);
          display:flex;flex-direction:column;padding:0;
        }
        .pf-sb-logo{
          display:flex;align-items:center;gap:10px;
          padding:24px 18px 22px;border-bottom:1px solid var(--border);
        }
        .pf-sb-logomark{
          width:34px;height:34px;background:var(--accent);
          border-radius:9px;display:flex;align-items:center;
          justify-content:center;font-size:17px;flex-shrink:0;
        }
        .pf-sb-appname{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--txt1);line-height:1.1}
        .pf-sb-appsub{font-size:11px;color:var(--txt3)}

        .pf-sb-steps{padding:20px 12px;flex:1}
        .pf-step{
          display:flex;align-items:flex-start;gap:10px;
          padding:8px 8px;border-radius:8px;margin-bottom:1px;
          transition:background .15s;
        }
        .pf-step.active{background:rgba(124,58,237,.13)}
        .pf-step.future{opacity:.4}
        .pf-step.done{opacity:.65}

        .pf-stepnum{
          width:22px;height:22px;border-radius:50%;
          border:1.5px solid var(--border2);
          display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:600;color:var(--txt3);
          flex-shrink:0;margin-top:1px;transition:all .2s;
        }
        .pf-step.active .pf-stepnum{background:var(--accent);border-color:var(--accent);color:#fff}
        .pf-step.done  .pf-stepnum{background:var(--green);border-color:var(--green);color:#fff;font-size:10px}

        .pf-steplabel{font-size:13px;font-weight:500;color:var(--txt2)}
        .pf-stepsub{font-size:11px;color:var(--txt3);margin-top:1px}
        .pf-step.active .pf-steplabel{color:#D9C8FF}

        .pf-sb-foot{
          padding:14px 18px;border-top:1px solid var(--border);
          font-size:11px;color:var(--txt3);
          display:flex;align-items:center;gap:6px;
        }

        /* ── Main ── */
        .pf-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
        .pf-scroll{flex:1;overflow-y:auto;padding:56px 72px 32px;max-width:740px}
        .pf-scroll::-webkit-scrollbar{width:5px}
        .pf-scroll::-webkit-scrollbar-track{background:transparent}
        .pf-scroll::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}

        .pf-anim{transition:opacity .22s ease, transform .22s ease}
        .pf-anim.hidden{opacity:0}
        .pf-anim.hidden.fwd{transform:translateX(18px)}
        .pf-anim.hidden.bwd{transform:translateX(-18px)}

        /* ── Typography ── */
        .pf-h1{font-family:'Syne',sans-serif;font-size:26px;font-weight:700;color:var(--txt1);margin-bottom:6px}
        .pf-sub{font-size:13px;color:var(--txt3);margin-bottom:36px;display:flex;align-items:center;gap:6px}

        /* ── Form ── */
        .pf-field{margin-bottom:22px}
        .pf-label{
          display:block;font-size:10.5px;font-weight:600;
          letter-spacing:.065em;text-transform:uppercase;
          color:var(--txt3);margin-bottom:8px;
        }
        .pf-input{
          width:100%;padding:11px 14px;
          background:var(--card);
          border:1px solid var(--border);
          border-radius:var(--radius);
          color:var(--txt1);font-size:14px;
          font-family:'DM Sans',sans-serif;
          outline:none;transition:border-color .15s,box-shadow .15s;
        }
        .pf-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,58,237,.18)}
        .pf-input.err{border-color:var(--red)}
        .pf-input::placeholder{color:var(--txt3)}
        .pf-err{font-size:12px;color:var(--red);margin-top:5px}

        /* ── Provider grid ── */
        .pf-pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:4px}
        .pf-pcard{
          padding:14px;background:var(--card);
          border:1.5px solid var(--border);border-radius:var(--radius);
          cursor:pointer;transition:all .15s;position:relative;overflow:hidden;
          user-select:none;
        }
        .pf-pcard:hover{border-color:var(--border2);background:#202028}
        .pf-pcard.sel{border-color:var(--accent);background:rgba(124,58,237,.09)}
        .pf-pcard-icon{font-size:20px;display:block;margin-bottom:8px;line-height:1}
        .pf-pcard-name{font-size:12.5px;font-weight:600;color:var(--txt1);margin-bottom:2px}
        .pf-pcard-desc{font-size:10.5px;color:var(--txt3);line-height:1.35}
        .pf-pcheck{
          position:absolute;top:7px;right:7px;
          width:15px;height:15px;background:var(--accent);
          border-radius:50%;display:flex;align-items:center;
          justify-content:center;font-size:9px;color:#fff;
        }

        /* ── Key input ── */
        .pf-keyrow{position:relative}
        .pf-keytoggle{
          position:absolute;right:9px;top:50%;transform:translateY(-50%);
          background:var(--border);border:none;border-radius:5px;
          color:var(--txt3);font-size:11.5px;font-family:'DM Sans',sans-serif;
          padding:4px 9px;cursor:pointer;transition:background .15s;
        }
        .pf-keytoggle:hover{background:var(--border2);color:var(--txt1)}
        .pf-keyhint{font-size:11px;color:var(--txt3);margin-top:6px;display:flex;gap:5px;align-items:center}

        /* ── Model grid ── */
        .pf-mgrid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
        .pf-mcard{
          padding:13px 15px;background:var(--card);
          border:1.5px solid var(--border);border-radius:var(--radius);
          cursor:pointer;transition:all .15s;
          display:flex;align-items:flex-start;gap:11px;
          user-select:none;
        }
        .pf-mcard:hover{border-color:var(--border2);background:#202028}
        .pf-mcard.sel{border-color:var(--accent);background:rgba(124,58,237,.09)}
        .pf-mradio{
          width:16px;height:16px;border-radius:50%;
          border:1.5px solid var(--border2);
          flex-shrink:0;margin-top:3px;
          display:flex;align-items:center;justify-content:center;
          transition:all .15s;
        }
        .pf-mcard.sel .pf-mradio{border-color:var(--accent);background:var(--accent)}
        .pf-mradio-dot{width:6px;height:6px;background:#fff;border-radius:50%}
        .pf-mtag{
          font-size:9.5px;font-weight:600;padding:2px 6px;
          border-radius:4px;background:var(--border);color:var(--txt3);
          display:inline-block;margin-bottom:4px;
        }
        .pf-mcard.sel .pf-mtag{background:rgba(124,58,237,.22);color:#B09EF5}
        .pf-mname{font-size:12.5px;font-weight:600;color:var(--txt1);margin-bottom:2px}
        .pf-mdesc{font-size:11px;color:var(--txt3);line-height:1.4}

        .pf-noprovider{
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          padding:52px;color:var(--txt3);font-size:14px;gap:8px;text-align:center;
          background:var(--card);border:1px dashed var(--border2);border-radius:var(--radius);
        }

        /* ── Style cards ── */
        .pf-scard{
          display:flex;align-items:center;gap:14px;
          padding:13px 16px;background:var(--card);
          border:1.5px solid var(--border);border-radius:var(--radius);
          cursor:pointer;transition:all .15s;margin-bottom:8px;
          user-select:none;
        }
        .pf-scard:hover{border-color:var(--border2);background:#202028}
        .pf-scard.sel{border-color:var(--accent);background:rgba(124,58,237,.09)}
        .pf-sicon{
          width:38px;height:38px;background:var(--border);border-radius:9px;
          display:flex;align-items:center;justify-content:center;
          font-size:17px;flex-shrink:0;transition:background .15s;
        }
        .pf-scard.sel .pf-sicon{background:rgba(124,58,237,.22)}
        .pf-sname{font-size:13.5px;font-weight:500;color:var(--txt1)}
        .pf-sdesc{font-size:11.5px;color:var(--txt3);margin-top:2px}
        .pf-sticker{
          margin-left:auto;width:18px;height:18px;background:var(--accent);
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-size:9px;color:#fff;flex-shrink:0;
        }

        /* ── Toggle ── */
        .pf-trow{
          display:flex;align-items:center;justify-content:space-between;
          padding:15px 17px;background:var(--card);
          border:1.5px solid var(--border);border-radius:var(--radius);
          margin-top:14px;
        }
        .pf-tlabel{font-size:13.5px;font-weight:500;color:var(--txt1)}
        .pf-tdesc{font-size:11.5px;color:var(--txt3);margin-top:2px}
        .pf-toggle{
          width:40px;height:22px;border-radius:11px;
          background:var(--border2);cursor:pointer;
          position:relative;transition:background .2s;
          border:none;flex-shrink:0;
        }
        .pf-toggle.on{background:var(--accent)}
        .pf-togthumb{
          position:absolute;top:3px;left:3px;
          width:16px;height:16px;background:#fff;
          border-radius:50%;transition:transform .2s;
        }
        .pf-toggle.on .pf-togthumb{transform:translateX(18px)}

        /* ── Nav bar ── */
        .pf-nav{
          display:flex;justify-content:space-between;align-items:center;
          padding:20px 72px;border-top:1px solid var(--border);
          background:var(--surface);
        }
        .pf-btn{
          display:inline-flex;align-items:center;gap:7px;
          padding:10px 22px;border-radius:9px;
          font-size:13.5px;font-weight:500;
          font-family:'DM Sans',sans-serif;
          cursor:pointer;transition:all .15s;border:none;
        }
        .pf-btn-ghost{background:transparent;color:var(--txt2);border:1px solid var(--border)}
        .pf-btn-ghost:hover{background:var(--card);color:var(--txt1)}
        .pf-btn-prime{background:var(--accent);color:#fff}
        .pf-btn-prime:hover{background:#6D28D9}
        .pf-btn-prime:active{transform:scale(.98)}
        .pf-btn-lg{font-size:15px;padding:13px 36px;border-radius:10px}

        /* ── Success ── */
        .pf-success{
          display:flex;flex-direction:column;align-items:center;
          justify-content:flex-start;text-align:center;padding-top:24px;
        }
        .pf-success-ring{
          width:76px;height:76px;border-radius:50%;
          border:2px solid rgba(124,58,237,.35);
          background:rgba(124,58,237,.12);
          display:flex;align-items:center;justify-content:center;
          font-size:30px;margin-bottom:28px;
        }
        .pf-success-title{
          font-family:'Syne',sans-serif;font-size:30px;
          font-weight:700;color:var(--txt1);margin-bottom:10px;
        }
        .pf-success-sub{
          font-size:14px;color:var(--txt3);
          line-height:1.7;margin-bottom:32px;max-width:340px;
        }
        .pf-summary{
          background:var(--card);border:1px solid var(--border);
          border-radius:12px;padding:18px 22px;
          width:100%;max-width:390px;text-align:left;margin-bottom:32px;
        }
        .pf-srow{
          display:flex;justify-content:space-between;align-items:center;
          padding:8px 0;font-size:13px;
          border-bottom:1px solid var(--border);
        }
        .pf-srow:last-child{border-bottom:none}
        .pf-sk{color:var(--txt3)}
        .pf-sv{color:var(--txt1);font-weight:500;display:flex;align-items:center;gap:6px}
        .pf-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
        .pf-badge{
          font-size:10px;font-weight:600;padding:2px 7px;
          border-radius:5px;background:rgba(16,185,129,.15);
          color:#34D399;
        }
      `}</style>

      <div className="pf">
        {/* ── Sidebar ── */}
        <aside className="pf-sb">
          <div className="pf-sb-logo">
            <div className="pf-sb-logomark">✦</div>
            <div>
              <div className="pf-sb-appname">Prompfix</div>
              <div className="pf-sb-appsub">Prompt Refiner</div>
            </div>
          </div>

          <nav className="pf-sb-steps">
            {STEP_META.map(s => (
              <div key={s.n} className={`pf-step ${step === s.n ? "active" : step > s.n ? "done" : "future"}`}>
                <div className="pf-stepnum">{step > s.n ? "✓" : s.n}</div>
                <div>
                  <div className="pf-steplabel">{s.label}</div>
                  <div className="pf-stepsub">{s.sub}</div>
                </div>
              </div>
            ))}
          </nav>

          <div className="pf-sb-foot">
            <span>🔒</span>
            <span>Keys stored locally only</span>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="pf-main">
          <div className="pf-scroll">
            <div className={`pf-anim ${visible ? "" : `hidden ${direction}`}`}>

              {step === 1 && (
                <>
                  <h1 className="pf-h1">Create your profile</h1>
                  <p className="pf-sub">This helps personalize your prompt refinement experience.</p>
                  <div className="pf-field">
                    <label className="pf-label">Display Name</label>
                    <input
                      className={`pf-input${errors.name ? " err" : ""}`}
                      placeholder="Alex Rivera"
                      value={profile.name}
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    />
                    {errors.name && <div className="pf-err">{errors.name}</div>}
                  </div>
                  <div className="pf-field">
                    <label className="pf-label">Role or Social <span style={{ color: "var(--txt3)", textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                    <input
                      className="pf-input"
                      placeholder="https://x.com/yourhandle"
                      value={profile.social}
                      onChange={e => setProfile(p => ({ ...p, social: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h1 className="pf-h1">Connect your AI</h1>
                  <p className="pf-sub">Your API key is stored securely on your device and never shared.</p>
                  <div className="pf-field">
                    <label className="pf-label">Provider</label>
                    <div className="pf-pgrid">
                      {PROVIDERS.map(p => (
                        <div
                          key={p.id}
                          className={`pf-pcard${apiConn.provider === p.id ? " sel" : ""}`}
                          onClick={() => setApiConn(a => ({ ...a, provider: p.id }))}
                        >
                          {apiConn.provider === p.id && <div className="pf-pcheck">✓</div>}
                          <span className="pf-pcard-icon" style={{ color: p.color }}>{p.icon}</span>
                          <div className="pf-pcard-name">{p.name}</div>
                          <div className="pf-pcard-desc">{p.desc}</div>
                        </div>
                      ))}
                    </div>
                    {errors.provider && <div className="pf-err">{errors.provider}</div>}
                  </div>
                  <div className="pf-field">
                    <label className="pf-label">API Key</label>
                    <div className="pf-keyrow">
                      <input
                        className={`pf-input${errors.key ? " err" : ""}`}
                        type={apiConn.showKey ? "text" : "password"}
                        placeholder={PROVIDERS.find(p => p.id === apiConn.provider)?.keyPlaceholder ?? "Select a provider above first…"}
                        value={apiConn.key}
                        onChange={e => setApiConn(a => ({ ...a, key: e.target.value }))}
                        style={{ paddingRight: 58 }}
                      />
                      <button
                        className="pf-keytoggle"
                        onClick={() => setApiConn(a => ({ ...a, showKey: !a.showKey }))}
                      >
                        {apiConn.showKey ? "Hide" : "Show"}
                      </button>
                    </div>
                    {errors.key && <div className="pf-err">{errors.key}</div>}
                    <div className="pf-keyhint">🔒 Never shared · Stored in chrome.storage.local</div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h1 className="pf-h1">Choose your default model</h1>
                  {selectedProvider
                    ? <p className="pf-sub">
                        <span className="pf-dot" style={{ background: selectedProvider.color }} />
                        {selectedProvider.name} · {selectedProvider.models.length} models available · change anytime in settings
                      </p>
                    : <p className="pf-sub">You can change this later in settings.</p>
                  }
                  {!selectedProvider
                    ? <div className="pf-noprovider">
                        <span style={{ fontSize: 36, opacity: .4 }}>◉</span>
                        <span>No provider selected</span>
                        <span style={{ fontSize: 12, opacity: .7 }}>Go back and select an AI provider first</span>
                      </div>
                    : <>
                        <div className="pf-mgrid">
                          {selectedProvider.models.map(m => (
                            <div
                              key={m.id}
                              className={`pf-mcard${modelChoice === m.id ? " sel" : ""}`}
                              onClick={() => setModelChoice(m.id)}
                            >
                              <div className="pf-mradio">
                                {modelChoice === m.id && <div className="pf-mradio-dot" />}
                              </div>
                              <div>
                                <div className="pf-mtag">{m.tag}</div>
                                <div className="pf-mname">{m.name}</div>
                                <div className="pf-mdesc">{m.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {errors.model && <div className="pf-err" style={{ marginTop: 12 }}>{errors.model}</div>}
                      </>
                  }
                </>
              )}

              {step === 4 && (
                <>
                  <h1 className="pf-h1">Refinement preferences</h1>
                  <p className="pf-sub">Set your default style and history settings.</p>
                  <label className="pf-label">Default Style</label>
                  {REFINEMENT_STYLES.map(s => (
                    <div
                      key={s.id}
                      className={`pf-scard${prefs.style === s.id ? " sel" : ""}`}
                      onClick={() => setPrefs(p => ({ ...p, style: s.id }))}
                    >
                      <div className="pf-sicon">{s.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div className="pf-sname">{s.name}</div>
                        <div className="pf-sdesc">{s.desc}</div>
                      </div>
                      {prefs.style === s.id && <div className="pf-sticker">✓</div>}
                    </div>
                  ))}
                  <div className="pf-trow">
                    <div>
                      <div className="pf-tlabel">Save Prompt History</div>
                      <div className="pf-tdesc">Keep a local history of your refined prompts (last 20)</div>
                    </div>
                    <button
                      className={`pf-toggle${prefs.saveHistory ? " on" : ""}`}
                      onClick={() => setPrefs(p => ({ ...p, saveHistory: !p.saveHistory }))}
                    >
                      <div className="pf-togthumb" />
                    </button>
                  </div>
                </>
              )}

              {step === 5 && (
                <div className="pf-success">
                  <div className="pf-success-ring">✓</div>
                  <h1 className="pf-success-title">You're all set.</h1>
                  <p className="pf-success-sub">
                    Prompfix is ready to refine your prompts across the web.
                    Click any AI input field to get started.
                  </p>
                  <div className="pf-summary">
                    <div className="pf-srow">
                      <span className="pf-sk">Name</span>
                      <span className="pf-sv">{profile.name || "—"}</span>
                    </div>
                    <div className="pf-srow">
                      <span className="pf-sk">Provider</span>
                      <span className="pf-sv">
                        <span className="pf-dot" style={{ background: selectedProvider?.color }} />
                        {selectedProvider?.name ?? "—"}
                      </span>
                    </div>
                    <div className="pf-srow">
                      <span className="pf-sk">Model</span>
                      <span className="pf-sv">
                        {selectedProvider?.models.find(m => m.id === modelChoice)?.name ?? "—"}
                      </span>
                    </div>
                    <div className="pf-srow">
                      <span className="pf-sk">Style</span>
                      <span className="pf-sv">{STYLE_NAMES[prefs.style]}</span>
                    </div>
                    <div className="pf-srow">
                      <span className="pf-sk">Prompt History</span>
                      <span className="pf-sv">
                        <span className={`pf-badge`} style={prefs.saveHistory ? {} : { background: "rgba(100,100,120,.15)", color: "var(--txt3)" }}>
                          {prefs.saveHistory ? "Enabled" : "Disabled"}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button className="pf-btn pf-btn-prime pf-btn-lg">
                    Launch Prompfix →
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* ── Bottom nav ── */}
          <div className="pf-nav">
            <div>
              {step > 1 && step < 5 && (
                <button className="pf-btn pf-btn-ghost" onClick={onBack}>← Back</button>
              )}
            </div>
            {step < 5 && (
              <button className="pf-btn pf-btn-prime" onClick={onContinue}>
                {step === 4 ? "Finish" : "Continue"} →
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
