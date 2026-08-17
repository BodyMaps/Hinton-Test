"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type AnyRow = Record<string, string | number | null>;
type PhaseRow = {
  model: string;
  family: string;
  input: string;
  accuracy: number;
  macroRecall: number;
  macroBA: number;
  recall: Record<string, number | null>;
  oneVsRestBA: Record<string, number | null>;
  unparseable: number;
};
type AdviseRow = {
  model:string; n:number; followUp:number; noImaging:number; notApplicable:number;
  insufficient:number; unparseable:number;
  perFamily:Record<string,{followUp:number;noImaging:number;other:number;n:number}>;
};
type Data = {
  dataset: Record<string, number | string[]>;
  models: { name: string; family: string; organization: string }[];
  assess: { organVisibility: AnyRow[]; organPerModel: AnyRow[]; phase: PhaseRow[] };
  read: { cohort: AnyRow; breadth: AnyRow[]; breadthOverall: AnyRow[]; domain: AnyRow[]; consistency: AnyRow[]; depth: AnyRow[]; noImage: AnyRow[] };
  compare: { overall: AnyRow[]; perFinding: AnyRow[]; noImage: AnyRow[] };
  predict: AnyRow[];
  predictPanels: { id:string; group:string; title:string; input:string; cohort:string; baseline:number; rows:AnyRow[] }[];
  conclude: AnyRow[];
  advise: AdviseRow[];
  integrated: AnyRow[];
};

const COLORS = ["#0072B2", "#009E73", "#E69F00", "#D55E00", "#7A6BB7", "#56B4E9"];
const MODEL_COLORS: Record<string,string> = {
  // Exact family ramps from world_model_benchmark/figures/radar_core.py.
  "GPT-5.5":"#0A2342", "Qwen3.5-27B":"#15568F", "Qwen3.5-9B":"#2A8AC9",
  "Claude Opus 4.8":"#00A0B0", "InternVL3.5-8B":"#5FC9C2", "Qwen3-VL-8B":"#A3D9CE",
  "DeepSeek-Janus-Pro-7B":"#4D6BFE",
  "Janus-Pro-7B":"#4D6BFE",
  "Hulu-Med-32B":"#B01A5B", "Lingshu-I-8B":"#CC2E73", "HealthGPT-Pro-8B":"#DE4C89",
  "GMAI-VL":"#E9709F", "MedGemma-27B":"#F193B6", "MedGemma-1.5-4B":"#F7B4CC",
  "HuatuoGPT-Vision-7B":"#F7B4CC", "MedVision-V0-7B":"#F7B4CC", "Med-Flamingo-9B":"#F7B4CC",
  "OmniCT-7B native":"#14512F", "M3D-RAD":"#22794A", "RadFM":"#37A66C", "CTInstruct-8B":"#66C795",
  "Merlin":"#43196E", "Pillar-0":"#6E3FA8", "MedSigLIP-448":"#9A72CE",
};
function modelColor(model: string) { return MODEL_COLORS[model] || "#66737F"; }
const OPERATIONS = [
  { name: "Assess", question: "Is the examination usable?", note: "coverage + acquisition", color: "green" },
  { name: "Read", question: "What is present, and where?", note: "179 findings", color: "red" },
  { name: "Compare", question: "What changed?", note: "paired examinations", color: "blue" },
  { name: "Predict", question: "What comes next?", note: "hidden successor", color: "orange" },
  { name: "Conclude", question: "What do the findings mean?", note: "clinical impression", color: "purple" },
  { name: "Advise", question: "What should happen next?", note: "guideline action", color: "teal" },
];
const TASK_LABELS = ["Assess", "Read", "Compare", "Predict", "Conclude", "Advise", "Integrated"];
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const assetPath = (path: string) => `${BASE_PATH}${path}`;

function useData() {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    fetch(assetPath("/data/benchmark.json")).then((r) => r.json()).then(setData);
  }, []);
  return data;
}

function Loading() {
  return <main className="loading"><div className="pulse"/><p>Assembling verified benchmark results…</p></main>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow"><span/> {children}</div>;
}

function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="page-intro"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{children}</p></section>;
}

function Metric({ value, label, detail }: { value: string; label: string; detail?: string }) {
  return <div className="metric"><strong>{value}</strong><span>{label}</span>{detail && <small>{detail}</small>}</div>;
}

function pct(value: number | null | undefined, digits = 1) {
  return value == null ? "—" : `${(value * 100).toFixed(digits)}%`;
}

function num(value: unknown) { return typeof value === "number" ? value : Number(value || 0); }

const MODEL_LOGOS:Record<string,string> = {
  "GPT-5.5":"/images/logos/openai.png",
  "Claude Opus 4.8":"/images/logos/claude.png",
  "Qwen3.5-27B":"/images/logos/qwen.png",
  "Qwen3.5-9B":"/images/logos/qwen.png",
  "Qwen3-VL-8B":"/images/logos/qwen.png",
  "InternVL3.5-8B":"/images/logos/internvl.png",
  "DeepSeek-Janus-Pro-7B":"/images/logos/deepseek.png",
  "Janus-Pro-7B":"/images/logos/deepseek.png",
  "Hulu-Med-32B":"/images/logos/hulumed.png",
  "Lingshu-I-8B":"/images/logos/lingshu.png",
  "HealthGPT-Pro-8B":"/images/logos/zhejiang.png",
  "GMAI-VL":"/images/logos/shanghai-ai-lab.png",
  "HuatuoGPT-Vision-7B":"/images/logos/cuhk.png",
  "MedGemma-27B":"/images/logos/google.png",
  "MedGemma-1.5-4B":"/images/logos/google.png",
  "Med-Flamingo-9B":"/images/logos/med-flamingo.png",
  "MedVision-V0-7B":"/images/logos/medvision.svg",
  "OmniCT-7B native":"/images/logos/alibaba.png",
  "OmniCT-7B":"/images/logos/alibaba.png",
  "M3D-RAD":"/images/logos/zhejiang.png",
  "RadFM":"/images/logos/sjtu.png",
  "CTInstruct-8B":"/images/logos/shanghai-ai-lab.png",
  "Merlin":"/images/logos/stanford.png",
  "Pillar-0":"/images/logos/berkeley.png",
  "MedSigLIP-448":"/images/logos/google.png",
  "MedSigLIP":"/images/logos/google.png",
};

function ModelName({ name, className="" }: { name:string; className?:string }) {
  const logo=MODEL_LOGOS[name];
  // Direct static assets avoid a hosting-specific image optimizer route for these tiny marks.
  // eslint-disable-next-line @next/next/no-img-element
  return <span className={`model-name-with-logo ${className}`}>{logo?<img src={assetPath(logo)} alt="" aria-hidden="true"/>:<i>{name.slice(0,2).toUpperCase()}</i>}<span>{name}</span></span>;
}

function FamilyBadge({ family }: { family: string }) {
  const cls = family.toLowerCase().includes("encoder") ? "encoder" : family.toLowerCase().includes("volume") ? "volume" : family.toLowerCase().includes("medical") ? "medical" : "general";
  return <span className={`family-badge ${cls}`}>{family}</span>;
}

function BarList({ rows, metric, max = 1, lower = false, baseline }: { rows: AnyRow[]; metric: string; max?: number; lower?: boolean; baseline?: number }) {
  return <div className="bar-list">
    {rows.map((row, index) => {
      const value = num(row[metric]);
      return <div className="bar-row" key={`${row.model}-${index}`} style={{"--model-color":modelColor(String(row.model))} as React.CSSProperties}>
        <span className="rank">{String(index + 1).padStart(2, "0")}</span>
        <ModelName name={String(row.model)} className="bar-label"/>
        <div className="bar-track">
          {baseline != null && <i className="baseline" style={{ left: `${Math.min(100, baseline / max * 100)}%` }} />}
          <i className={lower ? "lower" : ""} style={{ width: `${Math.min(100, value / max * 100)}%` }} />
        </div>
        <strong>{value.toFixed(3)}</strong>
      </div>;
    })}
  </div>;
}

function SectionHead({ index, title, copy }: { index?: string; title: string; copy?: string }) {
  return <div className="section-head">{index && <span>{index}</span>}<div><h2>{title}</h2>{copy && <p>{copy}</p>}</div></div>;
}

export function HomeView() {
  return <main>
    <section className="hero">
      <div className="hero-copy">
        <Eyebrow>Patient world model benchmark</Eyebrow>
        <h1>Can a model keep one patient <em>in mind?</em></h1>
        <p>RADWORLD follows radiological reasoning from a CT examination to the next clinical action. Six connected operations reveal where vision-language models stop describing and start losing the patient state.</p>
        <div className="hero-actions"><Link className="button primary" href="/tasks">Explore results <b>↗</b></Link><Link className="button ghost" href="/dataset">View the dataset</Link></div>
      </div>
      <div className="hero-system" aria-label="Six-operation patient state diagram">
        <div className="patient-core"><span>latent</span><strong>patient<br/>state</strong><small>s<sub>t</sub></small></div>
        {OPERATIONS.map((op, index) => <div key={op.name} className={`orbit-node node-${index} ${op.color}`}><b>{index + 1}</b><span>{op.name}</span></div>)}
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
      </div>
      <div className="hero-strip">
        <span>23 models</span><span>22,866 CT–report pairs</span><span>179 findings</span><span>19 organ systems</span>
      </div>
    </section>

    <section className="operation-section">
      <SectionHead index="01" title="Six operations. One state." copy="Each operation asks a different question about the same patient. Strong answers should be correct—and agree with one another." />
      <div className="operation-grid">
        {OPERATIONS.map((op, i) => <Link href={`/tasks?operation=${op.name.toLowerCase()}`} className={`operation-card ${op.color}`} key={op.name}>
          <div className="op-top"><span>0{i + 1}</span><b>↗</b></div><h3>{op.name}</h3><p>{op.question}</p><small>{op.note}</small>
        </Link>)}
      </div>
    </section>

    <section className="finding-band">
      <div><Eyebrow>What the benchmark reveals</Eyebrow><h2>Anatomy is visible.<br/>The patient state is not.</h2></div>
      <div className="finding-copy"><p>Models can recognize gross anatomy, yet lose findings as the prompt changes, fail to recover change from paired examinations, and miss new findings on hidden follow-up.</p><Link href="/models">Compare all 22 models →</Link></div>
      <div className="finding-metrics">
        <Metric value="91.6%" label="best organ visibility" />
        <Metric value="66.5%" label="best Read breadth" />
        <Metric value="39.7%" label="best detect + locate" />
        <Metric value="3 / 40" label="best strict integrated chains" />
      </div>
    </section>

    <section className="preview-section">
      <SectionHead index="02" title="Explore beyond the paper" copy="Filter thousands of finding–model results, inspect operation-specific failure modes, and compare model families without flattening incompatible metrics into one score." />
      <div className="preview-grid">
        <Link href="/explorer" className="preview-card heat-preview"><span>Finding explorer</span><h3>179 × 23</h3><p>Search any finding. Select models. Inspect body-system structure.</p><div className="mini-heat">{Array.from({length: 72},(_,i)=><i key={i} style={{opacity: .15 + ((i*17)%75)/100}}/> )}</div></Link>
        <Link href="/models" className="preview-card rank-preview"><span>Dynamic leaderboard</span><h3>23 models</h3><p>Rank by the operation and metric that matters.</p><div className="mini-ranks"><i/><i/><i/><i/><i/></div></Link>
        <Link href="/tasks" className="preview-card chain-preview"><span>Operation laboratory</span><h3>6 + 1 views</h3><p>From Assess through integrated patient-state coherence.</p><div className="mini-chain">{OPERATIONS.map((o,i)=><i key={o.name}>{i+1}</i>)}</div></Link>
      </div>
    </section>
  </main>;
}

export function DatasetView() {
  const data = useData();
  const [futureRevealed, setFutureRevealed] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState("Thoracic");
  if (!data) return <Loading/>;
  const d = data.dataset;
  const findingMeta=Array.from(new Map(data.read.breadth.map(row=>[String(row.findingId),row])).values());
  const systems=Array.from(new Set(findingMeta.map(row=>String(row.organ)))).map(name=>{
    const findings=findingMeta.filter(row=>row.organ===name).map(row=>String(row.finding));
    return {name,findings,count:findings.length};
  }).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  const activeSystem=systems.find(item=>item.name===selectedSystem)||systems[0];
  const maxSystem=Math.max(...systems.map(item=>item.count));
  const systemPalette=["#0A2342","#15568F","#2A8AC9","#00A0B0","#5FC9C2","#14512F","#22794A","#37A66C","#B01A5B","#CC2E73","#DE4C89","#E9709F","#E69F00","#D55E00","#7A6BB7","#9A72CE","#66737F","#8DA399","#B6A48A"];
  const systemColor=(name:string)=>systemPalette[Math.max(0,systems.findIndex(item=>item.name===name))%systemPalette.length];
  return <main className="content-page dataset-page">
    <PageIntro eyebrow="Dataset atlas" title="A CT dataset organized around patient state.">RADWORLD connects examinations to what is visible, what is reported, what changed, what happened next, and what action was recommended.</PageIntro>
    <section className="stat-grid">
      <Metric value={num(d.ctReportPairs).toLocaleString()} label="CT–report pairs" />
      <Metric value={num(d.patients).toLocaleString()} label="patients" />
      <Metric value={String(d.findings)} label="reportable findings" />
      <Metric value={String(d.organSystems)} label="organ systems" />
    </section>
    <section className="dataset-overview-figure">
      <header><span>a</span><div><h2>Dataset composition</h2><p>Clinical scale, longitudinal depth, and body-wide finding coverage.</p></div></header>
      <div className="dataset-overview-grid">
        <article className="cohort-scale"><Eyebrow>Clinical scale</Eyebrow>{[
          ["CT–report pairs",num(d.ctReportPairs),num(d.ctReportPairs),"all examinations"],
          ["Patients",num(d.patients),num(d.ctReportPairs),"unique patients"],
          ["RECIST scans",num(d.recistScans),num(d.ctReportPairs),"oncology response context"],
          ["Patients with ≥2 CTs",num(d.patientsTwoPlus),num(d.patients),"longitudinal patients"],
          ["Patients with ≥3 CTs",num(d.patientsThreePlus),num(d.patients),"deeper trajectories"],
        ].map(([label,value,denominator,note],index)=><div className="cohort-scale-row" key={String(label)}><span>{label}</span><strong>{Number(value).toLocaleString()}</strong><i><em style={{width:`${Number(value)/Number(denominator)*100}%`,background:["#0A2342","#15568F","#B01A5B","#009E73","#5FC9C2"][index]}}/></i><small>{note}</small></div>)}</article>
        <article className="inventory-map"><div className="inventory-map-head"><div><Eyebrow>Finding inventory</Eyebrow><h3><strong>179</strong> findings across <strong>19</strong> systems</h3></div><div className="country-pair"><span><i>CH</i>Switzerland</span><span><i>TR</i>Turkey</span></div></div><div className="finding-pixels" aria-label="179 findings colored by organ system">{findingMeta.map(row=><button key={String(row.findingId)} style={{background:systemColor(String(row.organ))}} className={row.organ===activeSystem.name?"active":""} onClick={()=>setSelectedSystem(String(row.organ))}><span>{row.finding}<br/>{row.organ}</span></button>)}</div><div className="inventory-key">{systems.map(item=><button key={item.name} onClick={()=>setSelectedSystem(item.name)} className={item.name===activeSystem.name?"active":""}><i style={{background:systemColor(item.name)}}/><span>{item.name}</span><b>{item.count}</b></button>)}</div></article>
      </div>
      <footer><p><strong>One linked record.</strong> Each CT is paired with its report; dates, comparisons, interventions, impressions, and recommendations connect records through time.</p><Link href="/explorer">Open the 179-finding explorer →</Link></footer>
    </section>
    <section className="dataset-story">
      <div className="timeline-card">
        <Eyebrow>Longitudinal structure</Eyebrow><h2>One patient, multiple observations.</h2>
        <p className="trajectory-intro">A real de-identified benchmark trajectory. The model sees the prior and current examinations, then forecasts ascites on the hidden 91-day follow-up.</p>
        <div className="scan-timeline real-exams">
          <figure className="scan prior"><div className="scan-image"><Image unoptimized width={384} height={384} src={assetPath("/images/trajectory/prior_scroll.webp")} alt="Automatically scrolling axial slices from the prior CT examination"/></div><figcaption><span>t−1</span><b>Prior CT</b><small>778 days before current · auto-scroll</small></figcaption></figure>
          <i><small>778 d</small></i>
          <figure className="scan current"><div className="scan-image"><Image unoptimized width={384} height={384} src={assetPath("/images/trajectory/current_scroll.webp")} alt="Automatically scrolling axial slices from the current CT examination"/></div><figcaption><span>t</span><b>Current CT</b><small>forecast origin · auto-scroll</small></figcaption></figure>
          <i><small>91 d</small></i>
          <figure className={`scan future ${futureRevealed ? "revealed" : ""}`}><div className="scan-image"><Image unoptimized width={384} height={384} src={assetPath("/images/trajectory/hidden_scroll.webp")} alt={futureRevealed ? "Automatically scrolling axial slices from the hidden follow-up CT examination" : "Hidden follow-up CT examination"}/><button type="button" aria-pressed={futureRevealed} onClick={()=>setFutureRevealed(value=>!value)}>{futureRevealed ? "Hide target" : "Reveal real CT"}</button></div><figcaption><span>t+Δ</span><b>Hidden CT</b><small>{futureRevealed ? "actual follow-up · auto-scroll" : "forecast target"}</small></figcaption></figure>
        </div>
        <div className="trajectory-note"><span>Episode FF000009</span><span>Soft-tissue window</span><span>Same patient · three examinations</span></div>
        <div className="cohort-bars"><div><span>≥ 2 examinations</span><b>{num(d.patientsTwoPlus).toLocaleString()} patients</b><i style={{width:"100%"}}/></div><div><span>≥ 3 examinations</span><b>{num(d.patientsThreePlus).toLocaleString()} patients</b><i style={{width:`${num(d.patientsThreePlus)/num(d.patientsTwoPlus)*100}%`}}/></div></div>
      </div>
      <aside className="recist-card oncology-card">
        <Eyebrow>Oncology subcohort</Eyebrow>
        <div className="oncology-heading"><span className="big-number">{num(d.recistScans).toLocaleString()}</span><h3>RECIST-labelled<br/>examinations</h3></div>
        <p>Structured response labels connect serial CT examinations to changes in cancer burden.</p>
        <div className="recist-share">
          <div><span>Share of all CT–report pairs</span><b>{(num(d.recistScans)/num(d.ctReportPairs)*100).toFixed(1)}%</b></div>
          <i><em style={{width:`${num(d.recistScans)/num(d.ctReportPairs)*100}%`}}/></i>
          <small>{num(d.recistScans).toLocaleString()} of {num(d.ctReportPairs).toLocaleString()} examinations</small>
        </div>
        <div className="oncology-fields" aria-label="RECIST-linked information">
          <div><span>01</span><p><b>Target lesions</b><small>identified on CT</small></p></div>
          <div><span>02</span><p><b>Tumor burden</b><small>tracked over time</small></p></div>
          <div><span>03</span><p><b>Response category</b><small>linked to follow-up</small></p></div>
        </div>
      </aside>
    </section>
    <section className="organ-section dataset-organ-section"><SectionHead index="19" title="Open the body-wide finding inventory" copy="Select a clinical system to see how the 179 reportable findings are distributed. Counts are computed from the released Read inventory."/><div className="dataset-atlas"><div className="system-list">{systems.map(item=><button key={item.name} className={item.name===activeSystem.name?"active":""} onClick={()=>setSelectedSystem(item.name)}><span>{item.name}</span><i><em style={{width:`${item.count/maxSystem*100}%`}}/></i><b>{item.count}</b></button>)}</div><article className="system-focus"><header><div><Eyebrow>Selected system</Eyebrow><h3>{activeSystem.name}</h3></div><strong>{activeSystem.count}<small>findings</small></strong></header><div className="finding-chips">{activeSystem.findings.map((finding,index)=><button key={finding}><i>{String(index+1).padStart(2,"0")}</i><span>{finding}</span></button>)}</div><div className="system-foot"><span>report-derived state vocabulary</span><span>oncologic + non-oncologic</span><Link href="/explorer">Explore model performance →</Link></div></article></div></section>
    <section className="data-layers"><div className="layer-intro"><Eyebrow>From image to action</Eyebrow><h2>Four linked layers make six operations possible.</h2></div><div className="layer-flow"><article><span>01</span><b>Visual evidence</b><p>CT volume, coverage, and acquisition phase</p></article><i>→</i><article><span>02</span><b>Patient state</b><p>179 findings, locations, and report descriptions</p></article><i>→</i><article><span>03</span><b>Temporal dynamics</b><p>Prior state, change, interval, and hidden successor</p></article><i>→</i><article><span>04</span><b>Clinical action</b><p>Impressions, treatment context, and imaging advice</p></article></div></section>
    <section className="principles"><div><b>≥20</b><span>report-positive examinations for every retained finding</span></div><div><b>179</b><span>finding labels linked to richer longitudinal context</span></div><div><b>6</b><span>operations derived from the same patient-state structure</span></div></section>
  </main>;
}

type MetricKey = "read" | "phase" | "organ" | "compare" | "predict" | "conclude" | "integrated";

export function ModelsView() {
  const data = useData();
  const [metric, setMetric] = useState<MetricKey>("read");
  const [family, setFamily] = useState("All families");
  const [query, setQuery] = useState("");
  const [selectedModel,setSelectedModel]=useState<string|null>(null);
  if (!data) return <Loading/>;
  const scores = new Map<string, number>();
  const lower = metric === "predict";
  const sources: Record<MetricKey, [AnyRow[], string]> = {
    read: [data.read.breadthOverall, "macroBA"], phase: [data.assess.phase.map(row=>({model:row.model,macroRecall:row.macroRecall})), "macroRecall"], organ: [data.assess.organVisibility, "macroBA"], compare: [data.compare.overall, "macroBA"], predict: [data.predict, "brier"], conclude: [data.conclude, "observations"], integrated: [data.integrated.filter(r=>r.condition==="independent"), "strict"],
  };
  const [source, key] = sources[metric];
  source.forEach(row => scores.set(String(row.model), num(row[key])));
  const families = ["All families", ...Array.from(new Set(data.models.map(m=>m.family)))];
  const models = data.models.filter(m => (family === "All families" || m.family === family) && m.name.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>{
    const av=scores.get(a.name), bv=scores.get(b.name); if(av==null)return 1;if(bv==null)return -1;return lower?av-bv:bv-av;
  });
  const profile=selectedModel?data.models.find(item=>item.name===selectedModel):null;
  const compareProfile=selectedModel?data.compare.overall.find(r=>r.model===selectedModel):null;
  const profileMetrics=selectedModel?[
    {operation:"Assess",endpoint:"Organ visibility",value:data.assess.organVisibility.find(r=>r.model===selectedModel)?.macroBA,format:"score",detail:"macro balanced accuracy"},
    {operation:"Assess",endpoint:"Contrast phase",value:data.assess.phase.find(r=>r.model===selectedModel)?.macroRecall,format:"score",detail:"macro recall"},
    {operation:"Read",endpoint:"Finding breadth",value:data.read.breadthOverall.find(r=>r.model===selectedModel)?.macroBA,format:"score",detail:(()=>{const row=data.read.breadthOverall.find(r=>r.model===selectedModel);return row?`${Number(row.items).toLocaleString()} items · 179-finding macro BA`:"179-finding macro BA";})()},
    {operation:"Compare",endpoint:"Temporal change",value:compareProfile?.macroBA,format:"score",detail:compareProfile?.accuracy==null?"macro balanced accuracy":`accuracy ${num(compareProfile.accuracy).toFixed(3)} · macro F1 ${num(compareProfile.macroF1).toFixed(3)} · ${num(compareProfile.n).toLocaleString()} transitions`},
    {operation:"Predict",endpoint:"Hidden successor",value:data.predict.find(r=>r.model===selectedModel)?.brier,format:"brier",detail:"multiclass Brier · lower is better"},
    {operation:"Conclude",endpoint:"+ finding descriptions",value:data.conclude.find(r=>r.model===selectedModel)?.observations,format:"score",detail:"impression accuracy"},
    {operation:"Advise",endpoint:"Follow-up intent",value:(()=>{const r=data.advise.find(item=>item.model===selectedModel);return r?r.followUp/r.n:null})(),format:"percent",detail:"recommendation-positive recall"},
    {operation:"Integrated",endpoint:"Strict chain success",value:data.integrated.find(r=>r.model===selectedModel&&r.condition==="independent")?.strict,format:"percent",detail:"correct and coherent"},
  ]:[];
  return <main className="content-page">
    <PageIntro eyebrow="Model leaderboard" title="Rank models by the capability you care about.">There is no composite RADWORLD score: the operations use different cohorts and metrics. Choose one validated endpoint, then compare model families on equal footing.</PageIntro>
    <section className="leader-controls">
      <div><label htmlFor="metric">Endpoint</label><select id="metric" value={metric} onChange={e=>setMetric(e.target.value as MetricKey)}><option value="read">Read breadth · macro BA ↑</option><option value="phase">Assess phase · macro recall ↑</option><option value="organ">Assess visibility · macro BA ↑</option><option value="compare">Compare · macro BA ↑</option><option value="predict">Predict · Brier ↓</option><option value="conclude">Conclude + observations · accuracy ↑</option><option value="integrated">Integrated strict success ↑</option></select></div>
      <div><label htmlFor="family">Model family</label><select id="family" value={family} onChange={e=>setFamily(e.target.value)}>{families.map(f=><option key={f}>{f}</option>)}</select></div>
      <div className="search-control"><label htmlFor="model-search">Search</label><input id="model-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Model name…"/></div>
    </section>
    <section className="leaderboard">
      <div className="table-head"><span>Rank</span><span>Model</span><span>Family</span><span>Organization</span><span>{lower ? "Brier ↓" : "Score ↑"}</span></div>
      {models.map((model,index)=>{const score=scores.get(model.name);const color={"--model-color":modelColor(model.name)} as React.CSSProperties;return <button type="button" className="table-row" key={model.name} onClick={()=>setSelectedModel(model.name)} aria-label={`Open detailed results for ${model.name}`}><span className="rank-num">{score == null ? "—" : index+1}</span><span className="model-cell" style={color}><ModelName name={model.name}/></span><span><FamilyBadge family={model.family}/></span><span className="org-name">{model.organization}</span><span className="score-cell" style={color}>{score == null ? <small>not evaluated</small> : <><b>{score.toFixed(3)}</b><i><em style={{width:`${Math.min(100,score/(lower?1.25:1)*100)}%`}}/></i></>}</span></button>})}
    </section>
    <div className="metric-note">Only models evaluated on the selected protocol are ranked. An empty cell is not treated as failure.</div>
    <section className="leader-submit"><div><Eyebrow>Community evaluation</Eyebrow><h2>Do you have a model to add?</h2><p>Run the released protocol, publish the required outputs, and send one structured submission for verification.</p></div><Link href="/submit">Submit your model →</Link></section>
    {profile&&<aside className="detail-drawer model-detail-drawer"><button className="close" onClick={()=>setSelectedModel(null)} aria-label="Close model details">×</button><Eyebrow>Cross-operation profile</Eyebrow><h2><ModelName name={profile.name}/></h2><p>{profile.organization} · {profile.family}</p><div className="model-profile-grid">{profileMetrics.map((item,index)=>{const available=item.value!=null&&Number.isFinite(num(item.value));const value=num(item.value);const label=!available?"—":item.format==="percent"?pct(value):value.toFixed(3);const width=!available?0:Math.min(100,(item.format==="brier"?value/1.25:value)*100);return <article key={`${item.operation}-${index}`}><header><span>{item.operation}</span><small>{item.endpoint}</small></header><strong>{label}</strong><i><em style={{width:`${width}%`,background:item.format==="brier"?"#D55E00":modelColor(profile.name)}}/></i><p>{available?item.detail:"Not evaluated on this protocol"}</p></article>})}</div><div className="model-profile-note"><b>No composite score</b><p>Operations use different cohorts and metrics. This profile preserves each validated endpoint instead of averaging unlike quantities.</p></div><Link className="model-submit-link" href="/submit">Submit another model →</Link></aside>}
  </main>;
}

function Tabs({ items, active, setActive }: { items: string[]; active: string; setActive: (value:string)=>void }) {
  return <div className="tabs" role="tablist">{items.map(item=><button role="tab" aria-selected={active===item} onClick={()=>setActive(item)} key={item}>{item}</button>)}</div>;
}

type OperationCase = {
  id:string;
  title:string;
  caseId:string;
  image:string;
  images?:{src:string;label:string}[];
  alt:string;
  input:string;
  question:string;
  reference:string;
  note:string;
  findings?:string[];
};

function OperationExamples({ cases }: { cases:OperationCase[] }) {
  const [index,setIndex]=useState(0);
  const item=cases[index];
  return <section className="operation-example" aria-label="Representative benchmark examples">
    <div className="operation-example-head"><div><Eyebrow>Representative benchmark case</Eyebrow><h3>See the input, question, and expected answer.</h3></div><div className="case-tabs" role="tablist">{cases.map((entry,i)=><button key={entry.id} role="tab" aria-selected={i===index} onClick={()=>setIndex(i)}>{entry.title}</button>)}</div></div>
    <div className="operation-example-body"><figure className={`${item.images?"multi-exam ":""}${item.findings?"finding-evidence":""}`}>{item.findings?<div className="finding-evidence-preview"><div className="finding-evidence-ct"><Image unoptimized src={assetPath(item.image)} alt={item.alt} width={512} height={512}/><span>Same examination · visual context</span></div><div className="finding-evidence-sheet"><small>Radiologist finding descriptions</small><ul>{item.findings.map(finding=><li key={finding}>{finding}</li>)}</ul></div></div>:<div className="operation-example-frames">{(item.images||[{src:item.image,label:"Axial auto-scroll"}]).map(frame=><div className="operation-example-frame" key={frame.src}><Image unoptimized src={assetPath(frame.src)} alt={item.alt} width={512} height={512}/><span>{frame.label}</span></div>)}</div>}<figcaption>{item.caseId} · current examination</figcaption></figure><div className="operation-example-copy"><div><span>Input</span><p>{item.input}</p></div><div><span>Question</span><p>{item.question}</p></div><div className="operation-reference"><span>Reference answer</span><strong>{item.reference}</strong></div><p className="operation-example-note">{item.note}</p></div></div>
  </section>;
}

const ASSESS_EXAMPLES:OperationCase[] = [
  {id:"assess-liver",title:"Anatomy visibility",caseId:"CV_00008325",image:"/images/examples/assess_anatomy_liver_yes_scroll.webp",alt:"Automatically scrolling axial CT slices containing the liver",input:"The rendered CT evidence from one examination.",question:"Is the liver present in the images? Answer yes or no.",reference:"yes",note:"This tests whether the examination contains enough anatomy to evaluate the named organ."},
  {id:"assess-phase",title:"Contrast phase",caseId:"CV_00013701",image:"/images/examples/assess_phase_arterial_scroll.webp",alt:"Automatically scrolling arterial-phase axial CT slices",input:"The rendered CT evidence from one examination.",question:"Which contrast phase is shown: noncontrast, arterial, or portal venous?",reference:"arterial",note:"This tests whether the model recognizes how the examination was acquired, not what disease is present."},
];

const READ_EXAMPLES:OperationCase[] = [
  {id:"read-bilateral",title:"Bilateral nodules",caseId:"CV_00013810",image:"/images/examples/read_nodule_rll_18mm_scroll.webp",alt:"Automatically scrolling lung-window CT slices with pulmonary lesions",input:"The images from the current examination and the target pulmonary nodule or mass.",question:"Is the finding visible? If present, choose right, left, bilateral, or not determinable.",reference:"DETECTED=YES; LOCATION=bilateral",note:"The report describes bilateral nodules, with the largest 18 mm lesion in the right lower lobe."},
  {id:"read-left",title:"Left lung nodule",caseId:"CV_00003065",image:"/images/examples/read_nodule_lul_23mm_scroll.webp",alt:"Automatically scrolling lung-window CT slices with a left upper lobe nodule",input:"The images from the current examination and the same named target.",question:"Is the finding visible? If present, choose right, left, bilateral, or not determinable.",reference:"DETECTED=YES; LOCATION=left",note:"The report describes a 23 × 16 mm nodule in the left upper lobe."},
];

const PREDICT_EXAMPLES:OperationCase[] = [
  {id:"predict-current",title:"Current CT only",caseId:"FF000009",image:"/images/examples/predict_noaction_current_scroll.webp",alt:"Automatically scrolling current CT slices for an ascites trajectory",input:"The current CT and a 91-day forecast interval. The successor CT is hidden.",question:"What will the state of ascites be on the hidden follow-up: stable, increased, decreased, resolved, or new?",reference:"increased",note:"This is the least informed no-action setting: the model must forecast from the current examination alone."},
  {id:"predict-pair",title:"Prior + current CT",caseId:"FF000009",image:"/images/examples/predict_noaction_current_scroll.webp",images:[{src:"/images/examples/predict_noaction_prior_scroll.webp",label:"Prior CT · 778 days earlier"},{src:"/images/examples/predict_noaction_current_scroll.webp",label:"Current CT · forecast origin"}],alt:"Automatically scrolling prior and current CT slices for an ascites trajectory",input:"The prior and current CTs, their 778-day interval, and a hidden successor 91 days later.",question:"What will the state of ascites be on the hidden follow-up: stable, increased, decreased, resolved, or new?",reference:"increased",note:"The model must infer the observed trajectory from the two examinations before forecasting its continuation."},
  {id:"predict-change",title:"CTs + observed change",caseId:"FF000009",image:"/images/examples/predict_noaction_current_scroll.webp",images:[{src:"/images/examples/predict_noaction_prior_scroll.webp",label:"Prior CT · 778 days earlier"},{src:"/images/examples/predict_noaction_current_scroll.webp",label:"Current CT · forecast origin"}],alt:"Automatically scrolling prior and current CT slices for an ascites trajectory",input:"The same CT pair plus the report-derived statement that ascites was new on the current CT.",question:"Given that observed change, what will ascites do on the hidden CT 91 days later?",reference:"increased",note:"This setting supplies the prior-to-current state in words, so the model need not recover that change from the images alone."},
  {id:"predict-surgery",title:"Major surgery",caseId:"SX000011",image:"/images/examples/predict_action_left_nephrectomy_scroll.webp",alt:"Automatically scrolling preoperative CT slices for a left nephrectomy case",input:"The current preoperative CT, an 83-day forecast interval, and a recorded total left nephrectomy.",question:"Will the left kidney still be anatomically present on the hidden follow-up CT?",reference:"no",note:"This action-conditioned case tests a deterministic consequence of surgery rather than patient-specific disease response."},
  {id:"predict-systemic",title:"Systemic therapy",caseId:"NSS0001 · CV_00003757",image:"/images/examples/predict_action_systemic_chemotherapy_scroll.webp",alt:"Automatically scrolling current CT slices from a systemic-therapy event",input:"The current CT and recorded interval chemotherapy for recurrent metastatic colorectal cancer.",question:"Will the hidden follow-up meet the benchmark definition of objective treatment response?",reference:"no",note:"The follow-up report records progressive disease. This tests patient-specific response, not whether treatment occurred."},
  {id:"predict-local",title:"Local therapy",caseId:"NSL0001 · CV_00023096",image:"/images/examples/predict_action_local_tace_scroll.webp",alt:"Automatically scrolling current CT slices from a transarterial chemoembolization event",input:"The current CT and recorded transarterial chemoembolization of a treated hepatic lesion.",question:"Will the treated target remain visible on the hidden follow-up CT?",reference:"yes",note:"The follow-up report describes enhancement near the treated segment VII lesion and recommends continued follow-up."},
];

const CONCLUDE_EXAMPLES:OperationCase[] = [
  {id:"conclude-supported",title:"Supported impression",caseId:"CV_00007943",image:"/images/examples/conclude_decompensated_cirrhosis_supported_scroll.webp",alt:"Automatically scrolling CT from a supported decompensated cirrhosis case",findings:["Splenomegaly is present.","Ascites is present.","Esophageal or gastric varices are present."],input:"Target-withheld radiologist finding descriptions from the current examination.",question:"Do these findings support the clinical impression ‘decompensated cirrhosis’?",reference:"SUPPORTED",note:"The descriptions form a coherent evidence pattern for the impression; the target diagnosis is not stated in the input."},
  {id:"conclude-control",title:"Hard control",caseId:"CV_00013141",image:"/images/examples/conclude_decompensated_cirrhosis_not_supported_scroll.webp",alt:"Automatically scrolling CT from a hard-control cirrhosis case",findings:["Splenomegaly is present."],input:"A related radiologist finding description that does not name the candidate impression.",question:"Does this finding support the clinical impression ‘decompensated cirrhosis’?",reference:"NOT SUPPORTED",note:"Splenomegaly alone is nonspecific. The task tests clinical synthesis rather than association with one related clue."},
];

const ADVISE_EXAMPLES:OperationCase[] = [
  {id:"advise-cyst",title:"Pancreatic cyst",caseId:"advm_42144c39e550fdc7",image:"/images/examples/advise_pancreatic_cyst_mri_followup_scroll.webp",alt:"Automatically scrolling CT showing a pancreatic cyst",input:"Portal-venous CT, a 73-year-old man, cyst features, and the 2017 ACR pancreatic-cyst guideline.",question:"Does the guideline apply, and what is the next imaging action?",reference:"MRI/MRCP in 6–12 months",note:"The reference finding is multiple pancreatic cysts up to 10 mm, consistent with side-branch IPMN."},
  {id:"advise-nodule",title:"Guideline exclusion",caseId:"advm_24a9b67d3f9a63b8",image:"/images/examples/advise_nodule_known_cancer_scroll.webp",alt:"Automatically scrolling lung-window CT showing a pulmonary nodule",input:"A new 5 mm subsolid lung nodule, known pancreatic carcinoma, and the 2017 Fleischner guideline.",question:"Does the named guideline apply, and what action follows from it?",reference:"GUIDELINE NOT APPLICABLE",note:"The supplied incidental-nodule guideline excludes patients with a known primary cancer carrying metastatic risk."},
];

const ASSESS_ORGANS = ["lung","heart","esophagus","thyroid","aorta","liver","gallbladder","kidney","pancreas","spleen","adrenal","stomach","duodenum","colon","small_bowel","bladder","prostate"];
const ASSESS_LABELS:Record<string,string> = {gallbladder:"gall bladder",small_bowel:"small bowel",non_contrast:"noncontrast",portal_venous:"portal venous"};
const ASSESS_GROUPS = [
  {label:"thorax and neck",start:0,end:3},
  {label:"vascular",start:4,end:4},
  {label:"hepatobiliary",start:5,end:6},
  {label:"solid abdomen",start:7,end:10},
  {label:"gastrointestinal",start:11,end:14},
  {label:"pelvis",start:15,end:16},
  {label:"contrast phase",start:18,end:21},
];

function AssessPanel({ data }: { data: Data }) {
  const organModels=Array.from(new Set(data.assess.organPerModel.map(row=>String(row.model))));
  const organSummary=[...data.assess.organVisibility].sort((a,b)=>num(b.macroBA)-num(a.macroBA));
  const organDetailSummary=organSummary.filter(row=>organModels.includes(String(row.model)));
  const phaseRows=[...data.assess.phase].sort((a,b)=>num(b.macroBA)-num(a.macroBA));
  const available=phaseRows.map(row=>String(row.model));
  const [model,setModel]=useState(available.includes("Hulu-Med-32B")?"Hulu-Med-32B":available[0]);
  const [compareModel,setCompareModel]=useState(available.includes("GPT-5.5")?"GPT-5.5":available[1]);
  const [organ,setOrgan]=useState("adrenal");
  const [hoverModel,setHoverModel]=useState<string|null>(null);
  const organRow=(name:string,key:string)=>data.assess.organPerModel.find(row=>row.model===name&&row.organ===key);
  const organAvg=(name:string)=>{const value=organSummary.find(row=>row.model===name)?.macroBA;return value==null?null:num(value);};
  const phaseRow=(name:string)=>phaseRows.find(row=>row.model===name);
  const phaseBA=(name:string,key:string)=>num((phaseRow(name)?.oneVsRestBA as Record<string,number|null>|undefined)?.[key]);
  const phaseAvg=(name:string)=>num(phaseRow(name)?.macroBA);
  const axes=[...ASSESS_ORGANS,"organ average","phase average","non_contrast","arterial","portal_venous"];
  const axisLabelLines=(axis:string)=>{const label=ASSESS_LABELS[axis]||axis;return ["gall bladder","small bowel","portal venous","organ average","phase average"].includes(label)?label.split(" "):[label];};
  const values=(name:string)=>axes.map(key=>{if(key==="organ average")return organAvg(name);if(key==="phase average")return phaseAvg(name);if(["non_contrast","arterial","portal_venous"].includes(key))return phaseBA(name,key);const value=organRow(name,key)?.ba;return value==null?null:num(value);});
  const fmt=(value:number|null)=>value==null?"—":value.toFixed(3);
  const pointXY=(value:number,index:number,radius=142)=>{const angle=-Math.PI/2+index*2*Math.PI/axes.length;const scaled=28+Math.max(0,Math.min(1,(value-.5)/.5))*(radius-28);return [270+Math.cos(angle)*scaled,190+Math.sin(angle)*scaled] as const;};
  const point=(value:number,index:number,radius=142)=>pointXY(value,index,radius).join(",");
  const tracePoints=(name:string)=>values(name).map((value,index)=>value==null?null:{index,value,point:point(value,index)}).filter(Boolean) as {index:number,value:number,point:string}[];
  const hasCompleteOrganProfile=(name:string)=>ASSESS_ORGANS.every(key=>organRow(name,key)?.ba!=null);
  const selectedValues=values(model);
  const inspectedModel=hoverModel||model;
  const inspectedValues=values(inspectedModel);
  const traceModels=available.filter(name=>name!==model&&name!==compareModel);
  const polar=(index:number,radius:number)=>{const angle=-Math.PI/2+index*2*Math.PI/axes.length;return [270+Math.cos(angle)*radius,190+Math.sin(angle)*radius] as const;};
  const arc=(start:number,end:number,radius=164)=>{const pad=.035;const a=-Math.PI/2+(start-pad)*2*Math.PI/axes.length;const b=-Math.PI/2+(end+pad)*2*Math.PI/axes.length;const x1=270+Math.cos(a)*radius,y1=190+Math.sin(a)*radius,x2=270+Math.cos(b)*radius,y2=190+Math.sin(b)*radius;return `M ${x1} ${y1} A ${radius} ${radius} 0 ${b-a>Math.PI?1:0} 1 ${x2} ${y2}`;};
  const segmentDistance=(x:number,y:number,a:readonly[number,number],b:readonly[number,number])=>{const dx=b[0]-a[0],dy=b[1]-a[1];const length=dx*dx+dy*dy;const t=length?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/length)):0;return Math.hypot(x-(a[0]+t*dx),y-(a[1]+t*dy));};
  const selectNearestCurve=(event:React.MouseEvent<SVGSVGElement>)=>{const rect=event.currentTarget.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width*600,y=-42+(event.clientY-rect.top)/rect.height*500;const nearest=available.map(name=>{const pts=tracePoints(name).map(item=>({index:item.index,xy:pointXY(item.value,item.index)}));let distance=Infinity;for(let index=0;index<pts.length-1;index++){if(pts[index+1].index===pts[index].index+1)distance=Math.min(distance,segmentDistance(x,y,pts[index].xy,pts[index+1].xy));}if(hasCompleteOrganProfile(name)&&pts.length===axes.length)distance=Math.min(distance,segmentDistance(x,y,pts[pts.length-1].xy,pts[0].xy));return {name,distance};}).sort((a,b)=>a.distance-b.distance)[0];if(nearest&&nearest.distance<12)setModel(nearest.name);};
  const heat=(value:number)=>value>=.5?`rgba(0,160,176,${.12+Math.min(1,(value-.5)/.5)*.88})`:`rgba(255,87,34,${.12+Math.min(1,(.5-value)/.3)*.88})`;
  const planeRows=available.map(name=>({model:name,organ:organAvg(name),phase:phaseAvg(name)})).filter(row=>row.organ!=null) as {model:string,organ:number,phase:number}[];
  const px=(value:number)=>55+(value-.48)/.47*390, py=(value:number)=>300-(value-.48)/.5*250;
  return <div className="task-panel assess-paper">
    <div className="panel-copy"><div><span className="task-number">01</span><h2>Assess</h2><p>What anatomy is visible, and under what contrast condition was the CT acquired?</p></div><span className="cohort-chip">paper figure · interactive reconstruction</span></div>
    <OperationExamples cases={ASSESS_EXAMPLES}/>
    <div className="assess-controls"><label>Focus model<select value={model} onChange={event=>setModel(event.target.value)}>{available.map(name=><option key={name}>{name}</option>)}</select></label><label>Comparison trace<select value={compareModel} onChange={event=>setCompareModel(event.target.value)}>{available.filter(name=>name!==model).map(name=><option key={name}>{name}</option>)}</select></label><div><ModelName name={model}/><i style={{borderColor:modelColor(compareModel)}}/><ModelName name={compareModel}/></div></div>
    <article className="assess-card assess-radar-card"><div className="atlas-title"><span>a</span><div><h4>Assess across anatomy and acquisition phase</h4><p>The paper figure, rebuilt as an interactive radar. Hover a point or select a model to inspect its profile.</p></div></div><div className="assess-radar-layout paper-like">
<svg viewBox="0 -42 600 500" role="img" aria-label={`Assess profiles with ${model} in focus`} onClick={selectNearestCurve}>
<polygon points={[18,19,20,21].map(i=>polar(i,158).join(",")).concat("270,190").join(" ")} className="assess-phase-wash"/>{[.5,.6,.7,.8,.9,1].map(t=><polygon key={t} points={axes.map((_,i)=>point(t,i)).join(" ")} className="radar-ring"/>)}
{axes.map((axis,i)=>{const angle=-Math.PI/2+i*2*Math.PI/axes.length;const summary=axis.includes("average");const radius=summary?188:158;const x=270+Math.cos(angle)*radius,y=190+Math.sin(angle)*radius;const lines=axisLabelLines(axis);return <g key={axis}><line x1="270" y1="190" x2={polar(i,142)[0]} y2={polar(i,142)[1]} className="radar-spoke"/><text x={x} y={y} dominantBaseline="middle" textAnchor={Math.cos(angle)>.2?"start":Math.cos(angle)<-.2?"end":"middle"} className={summary?"assess-axis summary":"assess-axis"}>{lines.map((line,lineIndex)=><tspan key={line} x={x} dy={lines.length===1?0:lineIndex===0?"-.5em":"1.15em"}>{line}</tspan>)}</text></g>})}
{ASSESS_GROUPS.map(group=>{const mid=(group.start+group.end)/2;const labelRadius=["contrast phase","solid abdomen"].includes(group.label)?238:218;const [lx,ly]=polar(mid,labelRadius);const rawRotation=mid*360/axes.length;const labelRotation=rawRotation>90&&rawRotation<270?rawRotation+180:rawRotation;return <g key={group.label}><path d={arc(group.start,group.end,192)} className="assess-group-arc"/><text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${labelRotation} ${lx} ${ly})`} className="assess-group-label">{group.label}</text></g>})}
{traceModels.map(name=>{const pts=tracePoints(name),complete=pts.length===axes.length;const Shape=complete?"polygon":"polyline";return <g key={name} className="assess-clickable-trace" role="button" tabIndex={0} aria-label={`Select ${name}`} onKeyDown={event=>{if(event.key==="Enter"||event.key===" ")setModel(name);}}><Shape points={pts.map(item=>item.point).join(" ")} fill="none" stroke={modelColor(name)} strokeWidth="1.35" strokeOpacity={hoverModel===name?".95":".48"}/><Shape data-model={name} className="assess-trace-hit" points={pts.map(item=>item.point).join(" ")} onClick={()=>setModel(name)} onMouseEnter={()=>setHoverModel(name)} onMouseLeave={()=>setHoverModel(null)}><title>{name}: organ {fmt(organAvg(name))}, phase {phaseAvg(name).toFixed(3)}</title></Shape></g>})}
{(()=>{const pts=tracePoints(compareModel),complete=pts.length===axes.length;const Shape=complete?"polygon":"polyline";return <g className="assess-clickable-trace" role="button" tabIndex={0} aria-label={`Select ${compareModel}`} onKeyDown={event=>{if(event.key==="Enter"||event.key===" ")setModel(compareModel);}}><Shape points={pts.map(item=>item.point).join(" ")} fill="none" stroke={modelColor(compareModel)} strokeWidth="2.1" strokeOpacity=".92"/><Shape data-model={compareModel} className="assess-trace-hit" points={pts.map(item=>item.point).join(" ")} onClick={()=>setModel(compareModel)} onMouseEnter={()=>setHoverModel(compareModel)} onMouseLeave={()=>setHoverModel(null)}><title>{compareModel}: organ {fmt(organAvg(compareModel))}, phase {phaseAvg(compareModel).toFixed(3)}</title></Shape></g>;})()}
{(()=>{const pts=tracePoints(model),complete=pts.length===axes.length;const Shape=complete?"polygon":"polyline";return <g className="assess-clickable-trace selected" role="button" tabIndex={0} aria-label={`${model}, selected`} onMouseEnter={()=>setHoverModel(model)} onMouseLeave={()=>setHoverModel(null)}><Shape points={pts.map(item=>item.point).join(" ")} fill={complete?modelColor(model):"none"} fillOpacity=".055" stroke={modelColor(model)} strokeWidth="3.2"/><Shape className="assess-trace-hit" points={pts.map(item=>item.point).join(" ")}><title>{model}: organ {fmt(organAvg(model))}, phase {phaseAvg(model).toFixed(3)}</title></Shape></g>;})()}
{selectedValues.map((value,i)=>{if(value==null)return null;const [x,y]=point(value,i).split(",").map(Number);return <circle key={axes[i]} cx={x} cy={y} r="3" fill="#fff" stroke={modelColor(model)} strokeWidth="2"><title>{ASSESS_LABELS[axes[i]]||axes[i]}: {value.toFixed(3)}</title></circle>})}</svg>
<aside className="assess-paper-key"><div className="assess-key-summary"><span>organ visibility</span><strong>{fmt(organAvg(model))}</strong><span>contrast phase</span><strong>{phaseAvg(model).toFixed(3)}</strong></div>{["General-purpose VLM","Medical slice / video VLM","Native-volume CT VLM","Frozen CT encoder"].map(family=><div className="assess-key-family" key={family}><h5>{family.replace(" slice / video", " 2D + video") + "s"}</h5>{available.filter(name=>data.models.find(item=>item.name===name)?.family===family).map(name=><button key={name} className={name===model?"active":name===compareModel?"compare":""} onClick={()=>setModel(name)}><i style={{background:modelColor(name)}}/><ModelName name={name}/><b>{fmt(organAvg(name))} / {phaseAvg(name).toFixed(3)}</b></button>)}</div>)}<div className="assess-key-note">organ / phase average · — not evaluated</div></aside>
<div className="assess-selected-profile"><header><i style={{background:modelColor(inspectedModel)}}/><strong><ModelName name={inspectedModel}/></strong><span>{hoverModel?"hovered curve":"selected curve"}</span></header><div>{axes.map((axis,index)=><button key={axis} className={ASSESS_ORGANS.includes(axis)&&axis===organ?"active":""} onClick={()=>{if(ASSESS_ORGANS.includes(axis)&&inspectedValues[index]!=null)setOrgan(axis);}} disabled={inspectedValues[index]==null}><span>{ASSESS_LABELS[axis]||axis}</span><b>{fmt(inspectedValues[index])}</b></button>)}</div></div>
</div></article>
    <div className="assess-two-up"><article className="assess-card"><div className="atlas-title"><span>b</span><div><h4>Organ visibility map</h4><p>Click any cell to focus the model and organ. Gray denotes a metric that is not estimable.</p></div></div><div className="assess-heat-scroll"><div className="assess-heat" style={{gridTemplateColumns:`170px repeat(${ASSESS_ORGANS.length}, 24px)`}}><span/>{ASSESS_ORGANS.map(key=><b key={key}>{(ASSESS_LABELS[key]||key).replace(" ","\n")}</b>)}{organDetailSummary.map(summary=><div key={String(summary.model)} style={{display:"contents"}}><button className={summary.model===model?"active":""} onClick={()=>setModel(String(summary.model))}><ModelName name={String(summary.model)}/><small>{num(summary.macroBA).toFixed(3)}</small></button>{ASSESS_ORGANS.map(key=>{const row=organRow(String(summary.model),key),value=row?.ba==null?null:num(row.ba);return <button key={`${summary.model}-${key}`} className={key===organ&&summary.model===model?"cell selected":"cell"} style={{background:value==null?"#E7EAE8":heat(value)}} onClick={()=>{setModel(String(summary.model));setOrgan(key);}}><span>{summary.model}<br/>{ASSESS_LABELS[key]||key}: {value==null?"not estimable":value.toFixed(3)}</span></button>})}</div>)}</div></div></article><article className="assess-card"><div className="atlas-title"><span>c</span><div><h4>Task-average model plane</h4><p>Models appear here only when both final organ-visibility and phase averages are available.</p></div></div><svg viewBox="0 0 500 360" role="img" aria-label="Organ visibility versus phase identification"><rect x="55" y="50" width="390" height="250" fill="#F7F9FA"/>{[.5,.6,.7,.8,.9].map(t=><g key={t}><line x1={px(t)} x2={px(t)} y1="50" y2="300" className="atlas-gridline"/><text x={px(t)} y="321" className="axis-label">{t.toFixed(1)}</text></g>)}{[.5,.6,.7,.8,.9].map(t=><g key={t}><line x1="55" x2="445" y1={py(t)} y2={py(t)} className="atlas-gridline"/><text x="44" y={py(t)+3} className="axis-label end">{t.toFixed(1)}</text></g>)}{planeRows.map(row=>{const active=row.model===model;return <g key={row.model} className="gap-model" onClick={()=>setModel(row.model)}><circle cx={px(row.organ)} cy={py(row.phase)} r={active?9:6.5} fill={modelColor(row.model)} fillOpacity={active ? .42 : .16} stroke={modelColor(row.model)} strokeWidth={active?3:2}><title>{row.model}: organ {row.organ.toFixed(3)}, phase {row.phase.toFixed(3)}</title></circle>{active&&<text x={px(row.organ)+10} y={py(row.phase)-8} className="selected-model-label">{row.model}</text>}</g>})}<text x="250" y="348" className="axis-title">organ visibility macro balanced accuracy</text><text x="14" y="185" className="axis-title" transform="rotate(-90 14 185)">phase one-vs-rest macro BA</text></svg></article></div>
    <article className="assess-card"><div className="atlas-title"><span>d</span><div><h4>Contrast-phase fingerprints across all completed conditions</h4><p>Each row shows one-vs-rest balanced accuracy for noncontrast, arterial, and portal-venous CT; 0.500 is chance.</p></div></div><div className="phase-matrix"><header><span>model</span><b>noncontrast</b><b>arterial</b><b>portal venous</b><strong>average</strong></header>{phaseRows.map(row=>{const phase=row.oneVsRestBA as Record<string,number|null>;return <div key={String(row.model)} className={row.model===model?"active":""}><span><ModelName name={String(row.model)}/></span>{["non_contrast","arterial","portal_venous"].map(key=><i key={key} style={{background:heat(num(phase[key]))}}><em>{num(phase[key]).toFixed(3)}</em></i>)}<strong>{num(row.macroBA).toFixed(3)}</strong></div>})}</div></article>
    <div className="assess-footer"><p><strong>Interpretation.</strong> Gross anatomy is usually visible to the leading models, while contrast phase separates them more sharply. All completed conditions are shown together; a dash denotes an endpoint that has not been evaluated.</p></div>
  </div>;
}

function ReadFindingAtlas({ data }: { data: Data }) {
  const breadth=data.read.breadth;
  const overall=[...data.read.breadthOverall].sort((a,b)=>num(b.macroBA)-num(a.macroBA));
  const [model,setModel]=useState("GPT-5.5");
  const [findingId,setFindingId]=useState("lymphadenopathy");
  const rows=breadth.filter(row=>row.model===model);
  const selected=rows.find(row=>row.findingId===findingId)||rows[0];
  const selectedAcross=breadth.filter(row=>row.findingId===selected?.findingId).sort((a,b)=>num(b.ba)-num(a.ba));
  const color=modelColor(model);
  const macro=overall.find(row=>row.model===model);
  const findingMeta=Array.from(new Map(breadth.map(row=>[String(row.findingId),row])).values());
  const findingOrder=[...findingMeta].sort((a,b)=>num(b.positive)-num(a.positive)||String(a.finding).localeCompare(String(b.finding)));
  const modelOrder=overall.map(row=>String(row.model));
  const byCell=new Map(breadth.map(row=>[`${row.model}::${row.findingId}`,row]));
  const bestWorst=findingOrder.map(finding=>{
    const values=modelOrder.map(name=>byCell.get(`${name}::${finding.findingId}`)).filter(Boolean) as AnyRow[];
    return {id:String(finding.findingId),best:Math.max(...values.map(row=>num(row.ba))),worst:Math.min(...values.map(row=>num(row.ba))),selected:num(byCell.get(`${model}::${finding.findingId}`)?.ba)};
  });
  const curveIndex=Math.max(0,bestWorst.findIndex(row=>row.id===findingId));
  const curveDatum=bestWorst[curveIndex];
  const curveFinding=findingOrder[curveIndex];
  const curveX=45+curveIndex*830/(bestWorst.length-1);
  const calloutX=Math.min(620,Math.max(55,curveX+12));
  const domain=data.read.domain;
  const domainModels=Array.from(new Set(domain.map(row=>String(row.model)))).filter(name=>overall.some(row=>row.model===name));
  const domainModel=domainModels.includes(model)?model:(domainModels[0]||model);
  const domainMacro=(name:string,region:string,stage:"base"|"probe"="probe")=>domain.find(row=>row.model===name&&row.group==="__domain_macro__"&&row.domain===region&&(row.family!=="encoder"||Boolean(row.supervised)===(stage==="probe")));
  const domainGroup=(name:string,group:string)=>domain.find(row=>row.model===name&&row.group===group&&(row.family!=="encoder"||Boolean(row.supervised)));
  const gapPoint=(name:string,stage:"base"|"probe"="probe")=>{const chestRow=domainMacro(name,"chest",stage);const abdomenRow=domainMacro(name,"abdomen",stage);if(!chestRow||!abdomenRow)return null;const chest=num(chestRow.macroBA);const abdomen=num(abdomenRow.macroBA);const nc=num(chestRow.nFindings);const na=num(abdomenRow.nFindings);return {model:name,family:String(chestRow.family),stage,overall:(nc*chest+na*abdomen)/(nc+na),gap:chest-abdomen};};
  const gapRows=domainModels.map(name=>gapPoint(name)).filter(Boolean) as {model:string,family:string,stage:string,overall:number,gap:number}[];
  const encoderTracks=["Merlin","Pillar-0"].map(name=>({model:name,base:gapPoint(name,"base"),probe:gapPoint(name,"probe")})).filter(track=>track.base&&track.probe) as {model:string,base:{overall:number,gap:number},probe:{overall:number,gap:number}}[];
  const gapX=(value:number)=>55+(value-.45)/.25*405;
  const gapY=(value:number)=>330-(value+.04)/.09*300;
  const radarGroups=["Thoracic vascular","Cardiac / coronary","Devices / postop","Esoph. / chest wall","Pleura / air","Lung / airways","chest average","abdomen average","Hepatobiliary","Gastrointestinal","Pancreas","Spleen / adrenal","Devices","Vascular","Peritoneal / retro.","GU / pelvis","Musculoskeletal"];
  const radarValues=radarGroups.map(group=>{
    if(group==="chest average")return num(domainMacro(domainModel,"chest")?.macroBA);
    if(group==="abdomen average")return num(domainMacro(domainModel,"abdomen")?.macroBA);
    return num(domainGroup(domainModel,group)?.macroBA);
  });
  const radarPoint=(value:number,index:number,radius=112)=>{const angle=-Math.PI/2+index*2*Math.PI/radarGroups.length;const scaled=30+Math.max(0,Math.min(1,(value-.4)/.45))*(radius-30);return `${250+Math.cos(angle)*scaled},${188+Math.sin(angle)*scaled}`;};
  const heatCell=(value:number)=>value>=.5?`rgba(0,194,39,${.08+Math.min(1,(value-.5)/.35)*.92})`:`rgba(255,87,34,${.08+Math.min(1,(.5-value)/.35)*.92})`;
  return <section className="read-atlas">
    <div className="read-atlas-head"><div><Eyebrow>Original frozen Read cohort · interactive</Eyebrow><h3>What is present across 179 findings?</h3><p>Full-cohort endpoints use the original 14,832 finding–examination items; API endpoints retain their original audited subset. The later minimum-support expansion is preserved separately for future analysis. Click any mark to inspect it.</p></div><label>Focus model<select value={model} onChange={event=>setModel(event.target.value)}>{overall.map(row=><option key={String(row.model)}>{row.model}</option>)}</select></label></div>
    <div className="read-panel-stack">
      <article className="atlas-card"><div className="atlas-title"><span>a</span><div><h4>Model × finding performance map</h4><p>Green is above chance; orange is below chance. Findings run from most to fewest report-positive cases.</p></div></div><div className="heatmap-scroll"><div className="read-heatmap" style={{gridTemplateColumns:`150px repeat(${findingOrder.length}, 5px)`}}>{modelOrder.map(name=><div className="heat-row" style={{display:"contents"}} key={name}><button className={name===model?"heat-label active":"heat-label"} onClick={()=>setModel(name)}><ModelName name={name}/><b>{num(overall.find(row=>row.model===name)?.macroBA).toFixed(3)}</b></button>{findingOrder.map(finding=>{const cell=byCell.get(`${name}::${finding.findingId}`);return <button key={`${name}-${finding.findingId}`} className="heat-cell" style={{background:cell?heatCell(num(cell.ba)):"#ECEFED"}} onClick={()=>{setModel(name);setFindingId(String(finding.findingId));}}><span>{finding.finding}<br/>{name}<br/>BA {cell?num(cell.ba).toFixed(3):"not scored"}</span></button>})}</div>)}</div></div><div className="heat-legend"><span><i className="below"/>below chance</span><span><i className="chance"/>chance</span><span><i className="above"/>above chance</span><b>179 findings →</b></div></article>
      <article className="atlas-card"><div className="atlas-title"><span>b</span><div><h4>Best, worst, and selected-model score by finding</h4><p>Click a finding to pin its name and performance. The dark trace is the selected model.</p></div></div><svg viewBox="0 0 900 300" role="img" aria-label="Per-finding best and worst model performance"><line x1="45" x2="875" y1="160" y2="160" className="chance-line"/>{[0,.25,.5,.75,1].map(t=><g key={t}><line x1="45" x2="875" y1={285-t*250} y2={285-t*250} className="atlas-gridline"/><text x="34" y={289-t*250} className="axis-label end">{t.toFixed(2)}</text></g>)}<polyline points={bestWorst.map((r,i)=>`${45+i*830/(bestWorst.length-1)},${285-r.best*250}`).join(" ")} className="best-line"/><polyline points={bestWorst.map((r,i)=>`${45+i*830/(bestWorst.length-1)},${285-r.worst*250}`).join(" ")} className="worst-line"/><polyline points={bestWorst.map((r,i)=>`${45+i*830/(bestWorst.length-1)},${285-r.selected*250}`).join(" ")} fill="none" stroke={color} strokeWidth="2"/>{bestWorst.map((r,i)=><rect key={r.id} x={42.5+i*830/(bestWorst.length-1)} y="35" width="5" height="250" fill="transparent" className="curve-hit" onClick={()=>setFindingId(r.id)}><title>{findingOrder[i].finding}: best {r.best.toFixed(3)}, {model} {r.selected.toFixed(3)}, worst {r.worst.toFixed(3)}</title></rect>)}<g className="curve-selection"><line x1={curveX} x2={curveX} y1="35" y2="285"/><circle cx={curveX} cy={285-curveDatum.best*250} r="4" className="best-marker"/><circle cx={curveX} cy={285-curveDatum.selected*250} r="4" fill={color}/><circle cx={curveX} cy={285-curveDatum.worst*250} r="4" className="worst-marker"/><rect x={calloutX} y="103" width="245" height="65" rx="2"/><text x={calloutX+11} y="120" className="selection-title">{curveFinding.finding}</text><text x={calloutX+11} y="137" className="selection-detail">Best {curveDatum.best.toFixed(3)} · {model} {curveDatum.selected.toFixed(3)}</text><text x={calloutX+11} y="153" className="selection-detail">Worst {curveDatum.worst.toFixed(3)} · {num(curveFinding.positive)} positive exams</text></g><text x="65" y="48" className="best-label">best model per finding</text><text x="65" y="66" fill={color} className="curve-label">{model}</text><text x="65" y="84" className="worst-label">worst model per finding</text><text x="460" y="298" className="axis-title">findings ordered by support (most → fewest)</text></svg></article>
      <article className="atlas-card"><div className="atlas-title"><span>c</span><div><h4>Sensitivity and specificity</h4><p>Paired markers reveal whether each model tends to over-call findings or miss them.</p></div></div><div className="paired-metrics">{overall.filter(row=>row.sensitivity!=null&&row.specificity!=null).map(row=><button key={String(row.model)} className={row.model===model?"paired-row active":"paired-row"} onClick={()=>setModel(String(row.model))}><b><ModelName name={String(row.model)}/></b><span><i style={{left:`${num(row.sensitivity)*100}%`}}/><em style={{left:`${num(row.specificity)*100}%`}}/></span><small>{num(row.macroBA).toFixed(3)}</small></button>)}</div><div className="paired-legend"><span className="sens">● sensitivity</span><span className="spec">■ specificity</span><b>macro balanced accuracy</b></div></article>
      <div className="read-two-up"><article className="atlas-card"><div className="atlas-title"><span>d</span><div><h4>Chest–abdomen transfer</h4><p>Circles are VLMs; triangles are frozen encoders. Curves animate the gain from a frozen readout to a patient-disjoint probe.</p></div></div><svg viewBox="0 0 500 400" role="img" aria-label="Chest versus abdomen performance with animated encoder improvements"><defs><filter id="markerGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="55" y="30" width="405" height="150" fill="#F2F3F7"/><rect x="55" y="180" width="405" height="150" fill="#F7F7F7"/>{[.45,.5,.55,.6,.65,.7].map(t=><g key={`gx${t}`}><line x1={gapX(t)} x2={gapX(t)} y1="30" y2="330" className={t===.5?"chance-line":"atlas-gridline"}/><text x={gapX(t)} y="349" className="axis-label">{t.toFixed(2)}</text></g>)}{[-.04,-.02,0,.02,.04].map(t=><g key={`gy${t}`}><line x1="55" x2="460" y1={gapY(t)} y2={gapY(t)} className={t===0?"gap-zero":"atlas-gridline"}/><text x="45" y={gapY(t)+3} className="axis-label end">{t.toFixed(2)}</text></g>)}{encoderTracks.map((track,trackIndex)=>{const x0=gapX(track.base.overall),y0=gapY(track.base.gap),x1=gapX(track.probe.overall),y1=gapY(track.probe.gap);const cx=(x0+x1)/2-(track.model==="Pillar-0"?30:0),cy=(y0+y1)/2+(track.model==="Merlin"?18:0);const path=`M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`;return <g key={`${track.model}-track`}><path d={path} className="encoder-path"/><polygon points={`${x0},${y0-8} ${x0-7},${y0+6} ${x0+7},${y0+6}`} className="encoder-base"><title>{track.model} frozen readout: overall {track.base.overall.toFixed(3)}, gap {track.base.gap.toFixed(3)}</title></polygon><g className="moving-encoder"><polygon points="0,-7 -6,5 6,5"/><animateMotion begin={`${trackIndex * 1.2}s`} dur="4.8s" repeatCount="indefinite" path={path} keyTimes="0;0.15;0.78;1" keyPoints="0;0;1;1" calcMode="linear"/><animate begin={`${trackIndex * 1.2}s`} attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.82;1" dur="4.8s" repeatCount="indefinite"/></g></g>})}{gapRows.map(row=>{const x=gapX(row.overall),y=gapY(row.gap),active=row.model===model;return <g key={row.model} className="gap-model" onClick={()=>setModel(row.model)}>{row.family==="encoder"?<polygon points={`${x},${y-10} ${x-9},${y+8} ${x+9},${y+8}`} fill={modelColor(row.model)} fillOpacity={active ? .5 : .28} stroke={modelColor(row.model)} strokeWidth={active?3:2.2} filter={active?"url(#markerGlow)":undefined}/>:<circle cx={x} cy={y} r={active?9:7} fill={modelColor(row.model)} fillOpacity={active ? .3 : .14} stroke={modelColor(row.model)} strokeWidth={active?3:2}/>}<title>{row.model}{row.family==="encoder"?" with probe":""}: overall {row.overall.toFixed(3)}, chest−abdomen {row.gap.toFixed(3)}</title>{active&&<text x={x+11} y={y-9} className="selected-model-label">{row.model}{row.family==="encoder"?" + probe":""}</text>}</g>})}<text x="258" y="380" className="axis-title">overall macro balanced accuracy across 170 findings</text><text x="14" y="190" className="axis-title" transform="rotate(-90 14 190)">Δ macro balanced accuracy (chest − abdomen)</text><text x="405" y="68" className="region-label">chest</text><text x="370" y="312" className="region-label dark">abdomen</text></svg><div className="gap-legend"><span><i className="vlm-marker"/>VLM</span><span><i className="encoder-base-marker"/>frozen encoder</span><span><i className="encoder-marker"/>+ patient-disjoint probe</span><span><i className="motion-marker"/>animated improvement</span></div></article>
      <article className="atlas-card"><div className="atlas-title"><span>e</span><div><h4>Clinical-category profile</h4><p>The selected model’s strengths and gaps across chest and abdomen finding families.</p></div></div><svg viewBox="0 0 500 390" role="img" aria-label={`Clinical category radar for ${domainModel}`}>{[.45,.55,.65,.75,.85].map(t=><polygon key={t} points={radarGroups.map((_,i)=>radarPoint(t,i)).join(" ")} className="radar-ring"/>)}{radarGroups.map((group,i)=>{const angle=-Math.PI/2+i*2*Math.PI/radarGroups.length;return <g key={group}><line x1="250" y1="188" x2={250+Math.cos(angle)*112} y2={188+Math.sin(angle)*112} className="radar-spoke"/><text x={250+Math.cos(angle)*142} y={192+Math.sin(angle)*142} textAnchor={Math.cos(angle)>.2?"start":Math.cos(angle) < -.2?"end":"middle"} className="radar-label">{group}</text></g>})}<polygon points={radarValues.map((v,i)=>radarPoint(v,i)).join(" ")} fill={modelColor(domainModel)} fillOpacity=".14" stroke={modelColor(domainModel)} strokeWidth="2.5"/>{radarValues.map((v,i)=>{const [x,y]=radarPoint(v,i).split(",").map(Number);return <circle key={i} cx={x} cy={y} r="3" fill={modelColor(domainModel)}><title>{radarGroups[i]}: {v.toFixed(3)}</title></circle>})}<text x="250" y="191" textAnchor="middle" className="radar-model">{domainModel}</text></svg></article></div>
      <aside className="finding-focus"><div><Eyebrow>Selected finding</Eyebrow><h4>{selected?.finding}</h4><p>{selected?.organ} · {num(selected?.positive)||num(selected?.n)/2} report-positive examinations</p></div><div className="focus-score" style={{"--model-color":color} as React.CSSProperties}><strong>{num(selected?.ba).toFixed(3)}</strong><span>{model} · macro BA {num(macro?.macroBA).toFixed(3)}</span></div><div className="focus-ranking">{selectedAcross.slice(0,8).map((row,index)=><div key={String(row.model)}><span>{index+1}</span><b><ModelName name={String(row.model)}/></b><i><em style={{width:`${num(row.ba)*100}%`,background:modelColor(String(row.model))}}/></i><strong>{num(row.ba).toFixed(3)}</strong></div>)}</div><Link href="/explorer">Open full 179-finding explorer →</Link></aside>
    </div>
  </section>;
}

function ReadPanel({ data }: { data: Data }) {
  const [mode,setMode]=useState("Breadth");
  const [model,setModel]=useState("GPT-5.5");
  const consistencyModels=Array.from(new Set(data.read.consistency.map(r=>String(r.model))));
  const overall=data.read.consistency.find(r=>r.model===model&&r.target==="overall");
  return <div className="task-panel"><div className="panel-copy"><div><span className="task-number">02</span><h2>Read</h2><p>What findings are present, where are they, and do they survive a change in wording?</p></div><Tabs items={["Breadth","Prompt stability","Localization"]} active={mode} setActive={setMode}/></div><OperationExamples cases={READ_EXAMPLES}/>
    {mode==="Breadth"&&<><div className="result-layout read-headline"><div className="chart-card"><h3>179-finding macro balanced accuracy</h3><BarList rows={[...data.read.breadthOverall].sort((a,b)=>num(b.macroBA)-num(a.macroBA))} metric="macroBA" max={.75}/></div><aside className="insight"><Eyebrow>Finding vocabulary</Eyebrow><h3>No model exceeds 0.67.</h3><p>Performance varies by morphology and organ system. The interactive figure below opens every finding-level result.</p></aside></div><ReadFindingAtlas data={data}/><ReadNoImageAudit rows={data.read.noImage}/></>}
    {mode==="Prompt stability"&&<div className="result-layout"><div className="chart-card"><div className="chart-toolbar"><h3>Same evidence, three questions</h3><select value={model} onChange={e=>setModel(e.target.value)}>{consistencyModels.map(m=><option key={m}>{m}</option>)}</select></div>{overall&&<><div className="stacked-big"><i className="agree" style={{width:`${num(overall.agree)*100}%`}}><span>{pct(num(overall.agree))} agree</span></i><i className="conflict" style={{width:`${num(overall.conflict)*100}%`}}><span>{pct(num(overall.conflict))} conflict</span></i><i className="incomplete" style={{width:`${num(overall.incomplete)*100}%`}}><span>{pct(num(overall.incomplete))} incomplete</span></i></div><div className="consistency-grid">{data.read.consistency.filter(r=>r.model===model&&r.target!=="overall").map(r=><div key={String(r.target)}><b>{String(r.target).replaceAll("_"," ")}</b><span>{pct(num(r.agree))} stable</span><i><em style={{width:`${num(r.agree)*100}%`}}/></i></div>)}</div></>}</div><aside className="insight"><Eyebrow>Prompt dependence</Eyebrow><h3>A correct binary answer may disappear in a report-like prompt.</h3><p>Agreement, direct contradiction, and omission are separated rather than collapsed into one score.</p></aside></div>}
    {mode==="Localization"&&<div className="result-layout"><div className="chart-card localization"><h3>Detection → location → joint success</h3>{[...data.read.depth].sort((a,b)=>num(b.joint)-num(a.joint)).map(r=><div className="local-row" key={String(r.model)}><strong><ModelName name={String(r.model)}/></strong><div><i className="detect" style={{width:`${num(r.detection)*100}%`}}/><i className="locate" style={{width:`${num(r.conditionalLocation)*100}%`}}/><i className="joint" style={{width:`${num(r.joint)*100}%`}}/></div><span>{pct(num(r.joint))}</span></div>)}</div><aside className="insight"><Eyebrow>Depth gap</Eyebrow><h3>Naming is not placing.</h3><p>The best detection sensitivity is 87.7%, but the best joint detection-and-location result is 39.7%.</p></aside></div>}
  </div>;
}

function ReadNoImageAudit({ rows }: { rows: AnyRow[] }) {
  const [selected,setSelected]=useState(String(rows[0]?.model||""));
  const active=rows.find(row=>String(row.model)===selected)||rows[0];
  return <section className="evidence-audit read-no-image-audit">
    <header><div><Eyebrow>Visual-evidence audit</Eyebrow><h3>Remove the CT: every model falls to 0.500.</h3></div><p>Each unique finding question was repeated 10 times. Repeats measure response stability—not additional examinations.</p></header>
    <div className="audit-workspace"><div className="audit-rows">{rows.map(row=>{const name=String(row.model),activeRow=name===selected;return <button type="button" aria-pressed={activeRow} className={activeRow?"active":""} onClick={()=>setSelected(name)} key={name} style={{"--model-color":modelColor(name)} as React.CSSProperties}><ModelName name={name}/><span className="audit-comparison"><i className="no-image" style={{width:`${num(row.noImageMacroBA)*100}%`}}/><i className="with-image" style={{width:`${num(row.imageMacroBA)*100}%`}}/></span><b>{num(row.noImageMacroBA).toFixed(3)}</b><strong>{num(row.imageMacroBA).toFixed(3)}</strong></button>})}<div className="audit-legend"><span><i className="no-image"/>finding name only</span><span><i className="with-image"/>with CT</span><em>macro balanced accuracy</em></div></div>
      <aside>{active&&<><small>Selected model</small><ModelName name={String(active.model)}/><dl><div><dt>Stable prompts</dt><dd>{active.fullyStable}/{active.findings}</dd></div><div><dt>Always “present”</dt><dd>{active.alwaysPresent}/{active.findings}</dd></div><div><dt>Image gain</dt><dd>+{(num(active.imageGain)*100).toFixed(1)} pp</dd></div><div><dt>Calls</dt><dd>{Number(active.calls).toLocaleString()}</dd></div></dl><p>All 179 questions were deterministic across ten repeats. Without an examination, the output becomes a fixed disease prior.</p></>}</aside>
    </div>
  </section>;
}

const COMPARE_FINDINGS = [
  ["ascites", "Ascites"],
  ["pulmonary_nodule_or_mass", "Lung nodule / mass"],
  ["pleural_effusion", "Pleural effusion"],
  ["lymphadenopathy", "Lymph nodes"],
  ["postoperative_fluid_collection", "Post-op collection"],
] as const;

const COMPARE_STATES = [
  ["stable", "present → present", "no meaningful change"],
  ["increased", "present → more", "larger or more extensive"],
  ["decreased", "present → less", "smaller or less extensive"],
  ["resolved", "present → absent", "no longer visible"],
  ["new", "absent → present", "appears on current CT"],
] as const;

const COMPARE_EXAMPLES = [
  {
    id: "ascites",
    title: "Ascites increased",
    target: "Ascites",
    interval: "13 days",
    image: "/images/compare/ascites-increased.png",
    priorImage: "/images/compare/compare_ascites_prior_scroll.webp",
    currentImage: "/images/compare/compare_ascites_current_scroll.webp",
    reference: "increased",
    reverse: "decreased",
    explanation: "Fluid is present on both examinations, but is more extensive on the current CT.",
  },
  {
    id: "nodule",
    title: "New lung nodule",
    target: "Pulmonary nodule or mass",
    interval: "58 days",
    image: "/images/compare/nodule-new.png",
    priorImage: "/images/compare/compare_nodule_prior_scroll.webp",
    currentImage: "/images/compare/compare_nodule_current_scroll.webp",
    reference: "new",
    reverse: "resolved",
    explanation: "The target is absent on the prior CT and present on the current CT.",
  },
] as const;

function CompareMarker({ model, x, y, selected = false }: { model: string; x: number; y: number; selected?: boolean }) {
  const color=modelColor(model), sw=selected?3:2, fill=model==="Merlin"||model==="Pillar-0"?"white":color;
  if (model==="HealthGPT-Pro-8B") return <polygon points={`${x},${y-7} ${x-7},${y+6} ${x+7},${y+6}`} fill={fill} stroke={color} strokeWidth={sw}/>;
  if (model==="GPT-5.5") return <g stroke={color} strokeWidth={sw+1}><line x1={x-7} x2={x+7} y1={y} y2={y}/><line x1={x} x2={x} y1={y-7} y2={y+7}/></g>;
  if (model==="Hulu-Med-32B") return <g stroke={color} strokeWidth={sw+1}><line x1={x-6} x2={x+6} y1={y-6} y2={y+6}/><line x1={x+6} x2={x-6} y1={y-6} y2={y+6}/></g>;
  if (model==="Claude Opus 4.8") return <polygon points={`${x},${y-7} ${x+7},${y} ${x},${y+7} ${x-7},${y}`} fill={fill} stroke={color} strokeWidth={sw}/>;
  if (model==="Qwen3.5-27B"||model==="Pillar-0") return <rect x={x-6} y={y-6} width="12" height="12" fill={fill} stroke={color} strokeWidth={sw}/>;
  return <circle cx={x} cy={y} r="6" fill={fill} stroke={color} strokeWidth={sw}/>;
}

function ComparePanel({ data }: { data: Data }) {
  const rows=[...data.compare.overall].sort((a,b)=>num(b.macroBA)-num(a.macroBA));
  const [selectedModel,setSelectedModel]=useState("HealthGPT-Pro-8B");
  const [exampleIndex,setExampleIndex]=useState(0);
  const [reversed,setReversed]=useState(false);
  const example=COMPARE_EXAMPLES[exampleIndex];
  const modelOrder=[...rows.filter(r=>!String(r.family).includes("encoder")),...rows.filter(r=>String(r.family).includes("encoder"))];
  const generativeCount=modelOrder.filter(r=>!String(r.family).includes("encoder")).length;
  const byFinding=new Map(data.compare.perFinding.map(r=>[`${r.model}::${r.finding}`,num(r.macroBA)]));
  const radarPoint=(value:number,index:number) => {
    const angle=-Math.PI/2+index*2*Math.PI/COMPARE_FINDINGS.length;
    const radius=Math.max(0,Math.min(.5,value))/.5*104;
    return [170+Math.cos(angle)*radius,160+Math.sin(angle)*radius] as const;
  };
  const scoreX=(value:number)=>150+(value-.15)/.27*282;
  const deltaX=(value:number)=>55+(value+.23)/.24*350;
  const plotY=(index:number)=>45+index*31+(index>=generativeCount?18:0);
  return <div className="task-panel compare-panel">
    <div className="panel-copy"><div><span className="task-number">03</span><h2>Compare</h2><p>What changed between the prior and current examination?</p></div><span className="cohort-chip">main: 1,231 transitions · Janus: 551 · 16 findings</span></div>

    <section className="compare-explainer" aria-label="How the Compare operation works">
      <div className="compare-explainer-copy"><Eyebrow>How to read the task</Eyebrow><h3>Two examinations in. One change state out.</h3><p>The model sees the target finding, the prior CT, the current CT, and the time between them. It must choose exactly one of five change states.</p><div className="compare-state-key">{COMPARE_STATES.map(([state,path,note])=><div key={state} className={state===(reversed?example.reverse:example.reference)?"active":""}><b>{state}</b><span>{path}</span><small>{note}</small></div>)}</div></div>
      <div className="compare-case">
        <div className="case-tabs" role="tablist">{COMPARE_EXAMPLES.map((item,index)=><button role="tab" aria-selected={index===exampleIndex} onClick={()=>{setExampleIndex(index);setReversed(false)}} key={item.id}>{item.title}</button>)}</div>
        <div className="compare-pair" aria-label={`${example.target}: prior and current CT separated by ${example.interval}`}>
          <div className="compare-half auto-scroll" style={{backgroundImage:`url(${assetPath(reversed?example.currentImage:example.priorImage)})`}}><span>{reversed?"CURRENT":"PRIOR"} CT · AUTO</span></div>
          <div className="compare-arrow"><small>{example.interval}</small><b>→</b><button type="button" onClick={()=>setReversed(value=>!value)} aria-pressed={reversed}>⇄ swap</button></div>
          <div className="compare-half auto-scroll" style={{backgroundImage:`url(${assetPath(reversed?example.priorImage:example.currentImage)})`}}><span>{reversed?"PRIOR":"CURRENT"} CT · AUTO</span></div>
        </div>
        <div className="case-answer"><div><span>Question</span><p>How has <strong>{example.target.toLowerCase()}</strong> changed?</p></div><div><span>Reference answer</span><strong className="answer-pill">{reversed?example.reverse:example.reference}</strong></div><p>{reversed?`Swapping image order reverses the directional label to ${example.reverse}.`:example.explanation}</p></div>
      </div>
    </section>

    <section className="compare-paper-figure">
      <div className="compare-figure-head"><div><Eyebrow>Paper-aligned result</Eyebrow><h3>Finding profile, overall performance, and baseline gap</h3></div><div className="compare-model-picker" aria-label="Select a Compare model">{modelOrder.map(r=><button key={String(r.model)} className={r.model===selectedModel?"active":""} style={{"--model-color":modelColor(String(r.model))} as React.CSSProperties} onClick={()=>setSelectedModel(String(r.model))}><ModelName name={String(r.model)}/></button>)}</div></div>
      <div className="compare-three-up">
        <article className="compare-result-card"><header><span>a</span><div><h4>Finding profile</h4><p>Per-finding macro BA</p></div></header><svg viewBox="0 0 340 330" role="img" aria-label="Compare performance across five selected findings">{[.1,.2,.3,.4,.5].map(t=><polygon key={t} points={COMPARE_FINDINGS.map((_,i)=>radarPoint(t,i).join(",")).join(" ")} className="compare-radar-ring"/>)}{COMPARE_FINDINGS.map(([,label],i)=>{const [x,y]=radarPoint(.5,i);return <g key={label}><line x1="170" y1="160" x2={x} y2={y} className="compare-radar-spoke"/><text x={170+(x-170)*1.22} y={164+(y-160)*1.22} textAnchor={x>180?"start":x<160?"end":"middle"} className="compare-radar-label">{label}</text></g>})}{modelOrder.map(r=>{const name=String(r.model),points=COMPARE_FINDINGS.map(([id],i)=>radarPoint(byFinding.get(`${name}::${id}`)||0,i).join(",")).join(" "),selected=name===selectedModel;return <polygon key={name} points={points} fill={modelColor(name)} fillOpacity={selected?.13:.012} stroke={modelColor(name)} strokeWidth={selected?3:1.25} strokeOpacity={selected?1:.24} strokeDasharray={String(r.family).includes("encoder")?"7 5":undefined} onClick={()=>setSelectedModel(name)} className="compare-radar-trace"><title>{name}</title></polygon>})}<text x="170" y="164" textAnchor="middle" className="compare-radar-center">{selectedModel}</text></svg></article>
        <article className="compare-result-card compare-dotplot"><header><span>b</span><div><h4>Overall performance</h4><p>Five change states · patient 95% CI</p></div></header><svg viewBox="0 0 470 385" role="img" aria-label="Overall Compare macro balanced accuracy">{[.2,.3,.4].map(t=><g key={t}><line x1={scoreX(t)} x2={scoreX(t)} y1="24" y2="342" className={t===.4?"compare-baseline-line":"compare-gridline"}/><text x={scoreX(t)} y="369" className="compare-axis-label">{t.toFixed(1)}</text></g>)}<line x1="20" x2="450" y1={plotY(generativeCount)-17} y2={plotY(generativeCount)-17} className="compare-family-divider"/>{modelOrder.map((r,i)=>{const name=String(r.model),y=plotY(i),selected=name===selectedModel,secondary=String(r.family).includes("secondary"),label=secondary?"DeepSeek Janus · n=551*":String(r.family).includes("encoder")?`${name} · OOF`:name;return <g key={name} className="compare-model-row" onClick={()=>setSelectedModel(name)}><text x="140" y={y+4} textAnchor="end" fill={modelColor(name)} className={selected?"selected":""}>{label}</text><line x1={scoreX(num(r.low))} x2={scoreX(num(r.high))} y1={y} y2={y} stroke={modelColor(name)} strokeWidth={selected?3:2}/><line x1={scoreX(num(r.low))} x2={scoreX(num(r.low))} y1={y-5} y2={y+5} stroke={modelColor(name)}/><line x1={scoreX(num(r.high))} x2={scoreX(num(r.high))} y1={y-5} y2={y+5} stroke={modelColor(name)}/><CompareMarker model={name} x={scoreX(num(r.macroBA))} y={y} selected={selected}/><text x="445" y={y+4} textAnchor="end" className="compare-score-label">{num(r.macroBA).toFixed(3)}</text></g>})}<text x="293" y="384" textAnchor="middle" className="compare-axis-title">macro balanced accuracy</text></svg></article>
        <article className="compare-result-card compare-dotplot"><header><span>c</span><div><h4>Baseline comparison</h4><p>Difference from previous-state rule</p></div></header><svg viewBox="0 0 430 385" role="img" aria-label="Compare improvement over the previous-state baseline">{[-.2,-.1,0].map(t=><g key={t}><line x1={deltaX(t)} x2={deltaX(t)} y1="24" y2="342" className={t===0?"compare-zero-line":"compare-gridline"}/><text x={deltaX(t)} y="369" className="compare-axis-label">{t.toFixed(1)}</text></g>)}<line x1="20" x2="415" y1={plotY(generativeCount)-17} y2={plotY(generativeCount)-17} className="compare-family-divider"/>{modelOrder.map((r,i)=>{const name=String(r.model),y=plotY(i),selected=name===selectedModel,low=r.deltaLow==null?num(r.low)-num(r.baseline):num(r.deltaLow),high=r.deltaHigh==null?num(r.high)-num(r.baseline):num(r.deltaHigh);return <g key={name} className="compare-model-row" onClick={()=>setSelectedModel(name)}><line x1={deltaX(low)} x2={deltaX(high)} y1={y} y2={y} stroke={modelColor(name)} strokeWidth={selected?3:2}/><line x1={deltaX(low)} x2={deltaX(low)} y1={y-5} y2={y+5} stroke={modelColor(name)}/><line x1={deltaX(high)} x2={deltaX(high)} y1={y-5} y2={y+5} stroke={modelColor(name)}/><CompareMarker model={name} x={deltaX(num(r.delta))} y={y} selected={selected}/></g>})}<text x="220" y="384" textAnchor="middle" className="compare-axis-title">Δ macro BA · higher is better</text></svg></article>
      </div>
      <div className="compare-baseline-explainer"><div><Eyebrow>Why 0.400 is a hard baseline</Eyebrow><h3>The rule never opens the current CT.</h3></div><div className="baseline-flow"><span><small>Prior state</small><b>finding present</b></span><i>→</i><span><small>Rule answers</small><b>stable</b></span><em>or</em><span><small>Prior state</small><b>finding absent</b></span><i>→</i><span><small>Rule answers</small><b>new</b></span></div><p>Every model sees both examinations, yet every confidence interval remains below this prior-only rule. Janus-Pro-7B (*) uses a separate 551-transition, 415-patient cohort. It predicts stable in 536 cases: macro BA 0.2003 is indistinguishable from always stable (0.2000) and below the previous-state rule (0.4000).</p></div>
    </section>
    <CompareNoImageAudit rows={data.compare.noImage}/>
  </div>;
}

function CompareNoImageAudit({ rows }: { rows: AnyRow[] }) {
  const [selected,setSelected]=useState("Hulu-Med-32B");
  const active=rows.find(row=>String(row.model)===selected)||rows[0];
  const conditions=[
    ["questionOnly","Question only","#B7BEC3"],
    ["priorStateOnly","Prior state only","#E69F00"],
    ["withImages","Prior + current CT","#0072B2"],
  ] as const;
  return <section className="evidence-audit compare-no-image-audit">
    <header><div><Eyebrow>Visual-evidence audit</Eyebrow><h3>Prior-state language can outperform opening both CTs.</h3></div><p>The same 1,231 transitions are tested with no evidence, prior state only, and the original image pair.</p></header>
    <div className="compare-audit-grid"><div className="compare-audit-chart"><div className="compare-audit-axis"><span>0.0</span><span>0.2</span><span>0.4</span><span>0.5</span></div>{rows.map(row=>{const name=String(row.model),activeRow=name===selected;return <button type="button" aria-pressed={activeRow} className={activeRow?"active":""} onClick={()=>setSelected(name)} key={name}><ModelName name={name}/><span>{conditions.map(([key,label,color])=><i key={key} style={{left:`${num(row[key])*200}%`,background:color}}><em>{label}: {num(row[key]).toFixed(3)}</em></i>)}</span></button>})}<div className="compare-audit-key">{conditions.map(([,label,color])=><span key={label}><i style={{background:color}}/>{label}</span>)}</div></div>
      <aside style={{"--model-color":modelColor(String(active?.model))} as React.CSSProperties}>{active&&<><small>Selected model</small><ModelName name={String(active.model)}/><dl>{conditions.map(([key,label])=><div key={key}><dt>{label}</dt><dd>{num(active[key]).toFixed(3)}</dd></div>)}</dl><p>{num(active.priorStateOnly)>=.4?"The prior-state-only response reaches the 0.400 previous-state rule.":"Even the prior state does not recover the 0.400 rule."}</p></>}</aside>
    </div>
  </section>;
}

function PredictPanel({ data }: { data: Data }) {
  const panels=data.predictPanels||[];
  return <div className="task-panel predict-panel"><div className="panel-copy"><div><span className="task-number">04</span><h2>Predict</h2><p>What state will the finding have on a hidden follow-up examination?</p></div><span className="cohort-chip">multiclass Brier · lower is better</span></div><OperationExamples cases={PREDICT_EXAMPLES}/><section className="predict-protocols"><div className="predict-protocol-intro"><Eyebrow>Six experimental settings</Eyebrow><h3>Separate what the model knows about the patient from what it knows about an intervention.</h3><p>The first three settings add longitudinal evidence without a recorded action. The next three supply a treatment and ask about its hidden consequence. Each row uses its own validated cohort and population-rate baseline.</p></div><div className="predict-panel-grid">{panels.map((panel,index)=><article className="predict-result-card" key={panel.id}><header><span>{String.fromCharCode(97+index)}</span><div><small>{panel.group}</small><h4>{panel.title}</h4><p>{panel.input}</p></div></header><div className="predict-cohort">{panel.cohort}</div><PredictMiniChart rows={panel.rows} baseline={num(panel.baseline)}/></article>)}</div><div className="predict-takeaway"><div><Eyebrow>What changes across settings</Eyebrow><h3>More history does not repair forecasting. Only deterministic surgery is predictable.</h3></div><p>No model beats the population prior in the three no-action settings. Surgery can reveal what anatomy will be removed, but systemic and local therapy do not yield reliable patient-specific response forecasts.</p></div></section></div>;
}

function PredictMiniChart({ rows, baseline }: { rows:AnyRow[]; baseline:number }) {
  const sorted=[...rows].sort((a,b)=>num(a.brier)-num(b.brier));
  const [selected,setSelected]=useState(String(sorted[0]?.model||""));
  const selectedRow=sorted.find(row=>String(row.model)===selected)||sorted[0];
  const selectedScore=num(selectedRow?.brier);
  const gap=selectedScore-baseline;
  const largest=Math.max(baseline,...sorted.map(row=>num(row.brier)));
  const max=Math.max(.14,Math.ceil(largest*10)/10);
  const baselinePosition=`${Math.min(100,baseline/max*100)}%`;
  return <div className="predict-mini-chart"><div className="predict-chart-rows">{sorted.map(row=>{const name=String(row.model),value=num(row.brier),active=name===selected;return <button type="button" aria-pressed={active} onClick={()=>setSelected(name)} className={`predict-model-row${active?" active":""}`} key={name} style={{"--model-color":modelColor(name)} as React.CSSProperties}><ModelName name={name}/><span className="predict-track"><i style={{width:`${Math.max(2,value/max*100)}%`}}/><em style={{left:baselinePosition}} aria-label={`Population-prior baseline ${baseline.toFixed(3)}`}/></span><b>{value.toFixed(3)}</b></button>})}</div><aside className="predict-selection" style={{"--model-color":modelColor(selected)} as React.CSSProperties}><small>Selected model</small><ModelName name={selected}/><dl><div><dt>Brier score</dt><dd>{selectedScore.toFixed(3)}</dd></div><div><dt>Population prior</dt><dd>{baseline.toFixed(3)}</dd></div><div><dt>Difference</dt><dd className={gap<0?"better":"worse"}>{gap>0?"+":""}{gap.toFixed(3)}</dd></div></dl><p>{gap<0?"Lower than the population prior.":"Higher than the population prior."}</p></aside></div>;
}

function ConcludePanel({ data }: { data: Data }) {
  const [selected,setSelected]=useState("GPT-5.5");
  const rows=[...data.conclude].sort((a,b)=>num(b.observations)-num(a.observations));
  const active=rows.find(row=>String(row.model)===selected)||rows[0];
  const x=(value:number)=>Math.max(0,Math.min(100,(value-.45)/.30*100));
  const ctDelta=num(active.delta),noImageDelta=num(active.noImageDelta);
  const ctImproves=rows.filter(row=>num(row.delta)>0).length;
  const noImageImproves=rows.filter(row=>num(row.noImageDelta)>0).length;
  return <div className="task-panel conclude-panel"><div className="panel-copy"><div><span className="task-number">05</span><h2>Conclude</h2><p>What clinical impression follows from the finding descriptions?</p></div><span className="cohort-chip">200 examinations · 10 balanced impressions</span></div><OperationExamples cases={CONCLUDE_EXAMPLES}/>
    <section className="conclude-results">
      <header className="conclude-results-head"><div><Eyebrow>Four matched input conditions</Eyebrow><h3>Separate impression synthesis from image use.</h3></div><p>Every model answers the same balanced impression questions. The no-image control supplies either the question alone or the question plus target-withheld radiologist findings; the imaging experiment supplies CT alone or CT plus those findings.</p></header>
      <div className="conclude-summary"><div><strong>{noImageImproves}/{rows.length}</strong><span>improve from findings without CT</span></div><div><strong>{ctImproves}/{rows.length}</strong><span>improve when findings accompany CT</span></div><p><b>Open</b> base input <i/> <b>Filled</b> + radiologist findings</p></div>
      <div className="conclude-workspace">
        <div className="conclude-slope-card">
          <div className="conclude-axis" aria-hidden="true">{[.45,.50,.55,.60,.65,.70,.75].map(value=><span key={value} style={{left:`${x(value)}%`}}>{value.toFixed(2)}</span>)}</div>
          <div className="conclude-rows">{rows.map(row=>{const name=String(row.model),question=num(row.questionOnly),findings=num(row.findingsOnly),ct=num(row.images),ctFindings=num(row.observations),isActive=name===selected;return <button type="button" key={name} aria-pressed={isActive} onClick={()=>setSelected(name)} className={`conclude-row${isActive?" active":""}`} style={{"--model-color":modelColor(name)} as React.CSSProperties}><ModelName name={name}/><span className="conclude-lanes">{[.45,.50,.55,.60,.65,.70,.75].map(value=><i className="grid" key={value} style={{left:`${x(value)}%`}}/>)}<span className="conclude-lane no-image"><small>NO IMAGE</small><i className="connector" style={{left:`${Math.min(x(question),x(findings))}%`,width:`${Math.abs(x(findings)-x(question))}%`}}/><i className="base-dot" style={{left:`${x(question)}%`}}/><i className="added-dot" style={{left:`${x(findings)}%`}}/></span><span className="conclude-lane with-ct"><small>WITH CT</small><i className="connector" style={{left:`${Math.min(x(ct),x(ctFindings))}%`,width:`${Math.abs(x(ctFindings)-x(ct))}%`}}/><i className="base-dot" style={{left:`${x(ct)}%`}}/><i className="added-dot" style={{left:`${x(ctFindings)}%`}}/></span></span><span className="conclude-row-values"><b>{pct(findings,1)}</b><strong>{pct(ctFindings,1)}</strong></span></button>})}</div>
          <p className="conclude-axis-title">accuracy · higher is better</p>
        </div>
        <aside className="conclude-selection" style={{"--model-color":modelColor(String(active.model))} as React.CSSProperties}>
          <div className="conclude-selection-model"><small>Selected model</small><ModelName name={String(active.model)}/></div>
          <div className="conclude-score-grid"><div><span>Question only</span><strong>{pct(num(active.questionOnly),1)}</strong></div><div><span>Findings only</span><strong>{pct(num(active.findingsOnly),1)}</strong><small className={noImageDelta>0?"gain":"loss"}>{noImageDelta>0?"+":""}{(noImageDelta*100).toFixed(1)} pp</small></div><div><span>CT only</span><strong>{pct(num(active.images),1)}</strong></div><div><span>CT + findings</span><strong>{pct(num(active.observations),1)}</strong><small className={ctDelta>0?"gain":"loss"}>{ctDelta>0?"+":""}{(ctDelta*100).toFixed(1)} pp</small></div></div>
          <p>{num(active.noImageUnparseable)>0?`${active.noImageUnparseable} no-image response was unparseable and counted incorrect. `:""}Differences are descriptive accuracy changes on the matched cohort.</p>
        </aside>
      </div>
      <div className="conclude-evidence-flow"><div><span>1</span><small>Control</small><b>Question ± findings</b></div><i>→</i><div><span>2</span><small>Imaging experiment</small><b>CT ± findings</b></div><i>→</i><div className="target"><span>3</span><small>Output</small><b>Clinical impression</b></div><p>Findings help five models without images, but only GPT-5.5 and Claude Opus 4.8 improve when the same evidence is added to CT.</p></div>
    </section>
  </div>;
}

function AdvisePanel({ data }: { data: Data }) {
  const [selected,setSelected]=useState("Lingshu-I-8B");
  const rows=[...data.advise].sort((a,b)=>b.followUp/a.n-a.followUp/b.n);
  const active=rows.find(row=>row.model===selected)||rows[0];
  const other=active.n-active.followUp-active.noImaging;
  const familyOrder=[
    ["incidental_pulmonary_nodule","Pulmonary nodule"],
    ["incidental_pancreatic_cyst","Pancreatic cyst"],
    ["incidental_renal_mass","Renal mass / cyst"],
    ["incidental_liver_lesion","Liver lesion"],
  ];
  const completeRows=rows.filter(row=>row.unparseable===0);
  const completeRates=completeRows.map(row=>row.followUp/row.n);
  const low=Math.min(...completeRates),high=Math.max(...completeRates);
  const donut=`conic-gradient(#0072B2 0 ${active.followUp/active.n*100}%, #6BAF92 ${active.followUp/active.n*100}% ${(active.followUp+active.noImaging)/active.n*100}%, #B8BEB9 ${(active.followUp+active.noImaging)/active.n*100}% 100%)`;
  return <div className="task-panel advise-panel"><div className="panel-copy"><div><span className="task-number">06</span><h2>Advise</h2><p>What imaging follow-up should be recommended under a named guideline?</p></div><span className="cohort-chip">80 cases · 4 guideline families</span></div><OperationExamples cases={ADVISE_EXAMPLES}/>
    <section className="advise-results">
      <header className="advise-results-head"><div><Eyebrow>Recommendation policy</Eyebrow><h3>The same cases produce very different follow-up decisions.</h3></div><p>Each model receives the CT, available clinical context, and a named guideline. This view summarizes what action the model returns; recommendation frequency alone is not a measure of clinical correctness.</p></header>
      <div className="advise-headline"><div><span>Follow-up range</span><strong>{pct(low,1)}–{pct(high,1)}</strong><small>among models with 80 resolved structured actions</small></div><p><i className="follow"/> Follow-up imaging <i className="none"/> No additional imaging <i className="other"/> Other / incomplete</p></div>
      <div className="advise-workspace">
        <div className="advise-policy-card">
          <div className="advise-scale"><span>0</span><span>20</span><span>40</span><span>60</span><span>80 cases</span></div>
          <div className="advise-model-rows">{rows.map(row=>{const remainder=row.n-row.followUp-row.noImaging,activeRow=row.model===selected;return <button type="button" aria-pressed={activeRow} onClick={()=>setSelected(row.model)} className={`advise-model-row${activeRow?" active":""}`} key={row.model} style={{"--model-color":modelColor(row.model)} as React.CSSProperties}><ModelName name={row.model}/><span className="advise-stack"><i className="follow" style={{width:`${row.followUp/row.n*100}%`}}/><i className="none" style={{width:`${row.noImaging/row.n*100}%`}}/><i className="other" style={{width:`${remainder/row.n*100}%`}}/></span><strong>{pct(row.followUp/row.n,1)}</strong></button>})}</div>
        </div>
        <aside className="advise-selection" style={{"--model-color":modelColor(active.model)} as React.CSSProperties}>
          <div><small>Selected model</small><ModelName name={active.model}/></div>
          <div className="advise-donut" style={{background:donut}}><span><strong>{active.n}</strong><small>decisions</small></span></div>
          <dl><div><dt>Follow-up</dt><dd>{active.followUp}</dd></div><div><dt>No imaging</dt><dd>{active.noImaging}</dd></div><div><dt>Other / incomplete</dt><dd>{other}</dd></div></dl>
        </aside>
      </div>
      <div className="advise-family-section"><div className="advise-family-head"><div><Eyebrow>Guideline profile</Eyebrow><h3>Where does the selected model recommend imaging?</h3></div><ModelName name={active.model}/></div><div className="advise-family-grid">{familyOrder.map(([id,label])=>{const item=active.perFamily[id],rate=item?item.followUp/item.n:0;return <article key={id}><header><span>{label}</span><b>{item?.followUp||0}/{item?.n||20}</b></header><div><i style={{width:`${rate*100}%`}}/></div><strong>{pct(rate,0)}</strong><small>recommend follow-up</small></article>})}</div></div>
      <div className="advise-decision-flow"><span><small>Patient evidence</small><b>CT + clinical context</b></span><i>+</i><span><small>Decision rule</small><b>Named guideline</b></span><i>→</i><span className="target"><small>Model output</small><b>Imaging action</b></span><p>The benchmark asks for a concrete action, not only the name of a guideline.</p></div>
    </section>
  </div>;
}

function IntegratedPanel({ data }: { data: Data }) {
  const conditions=[
    {id:"independent",label:"Independent",note:"Each operation receives only its standard input."},
    {id:"model_carried",label:"Model-carried",note:"The model's earlier answers are supplied to later operations."},
    {id:"reference_state",label:"Reference-state",note:"Report-derived earlier states are supplied to later operations."},
  ];
  const [selectedModel,setSelectedModel]=useState("GPT-5.5");
  const [selectedCondition,setSelectedCondition]=useState("independent");
  const modelOrder=["GPT-5.5","Claude Opus 4.8","Hulu-Med-32B","Lingshu-I-8B","HealthGPT-Pro-8B"];
  const rowMap=new Map(data.integrated.map(row=>[`${row.model}::${row.condition}`,row]));
  const selected=rowMap.get(`${selectedModel}::${selectedCondition}`)||data.integrated[0];
  const selectedMeta=conditions.find(item=>item.id===selectedCondition)||conditions[0];
  const prior=.75,brier=num(selected.brier),brierGap=brier-prior;
  const bestIndependent=Math.max(...data.integrated.filter(row=>row.condition==="independent").map(row=>num(row.strict)));
  const bestOverall=Math.max(...data.integrated.map(row=>num(row.strict)));
  return <div className="task-panel integrated-panel"><div className="panel-copy"><div><span className="task-number">+1</span><h2>Integrated patient state</h2><p>Can one model give six answers that are both correct and mutually coherent?</p></div><span className="cohort-chip">40 longitudinal episodes · 5 models</span></div>
    <section className="integrated-results">
      <header className="integrated-results-head"><div><Eyebrow>One patient · one target finding</Eyebrow><h3>Six operations should produce one consistent patient state.</h3></div><p>The target finding is fixed across Assess, Read, Compare, Predict, Conclude, and Advise. A coherent chain contains no contradiction. Strict success additionally requires Assess through Predict to be correct.</p></header>
      <div className="integrated-operation-chain">{OPERATIONS.map((operation,index)=><div key={operation.name}><span>{index+1}</span><b>{operation.name}</b><small>{operation.question}</small></div>)}</div>
      <div className="integrated-headline"><div><span>Best independent strict success</span><strong>{Math.round(bestIndependent*40)}/40</strong></div><div><span>Best strict success with supplied state</span><strong>{Math.round(bestOverall*40)}/40</strong></div><p><i className="coherent"/> coherent chain <i className="strict"/> correct through Predict + coherent</p></div>
      <div className="integrated-workspace">
        <div className="integrated-matrix-card">
          <div className="integrated-matrix-head"><span>Model</span>{conditions.map(condition=><div key={condition.id}><b>{condition.label}</b><small>{condition.id==="independent"?"standard inputs":condition.id==="model_carried"?"carry model answers":"supply reference state"}</small></div>)}</div>
          <div className="integrated-matrix">{modelOrder.map(model=><div className="integrated-matrix-row" key={model}><ModelName name={model}/>{conditions.map(condition=>{const item=rowMap.get(`${model}::${condition.id}`),coherent=num(item?.coherent),strict=num(item?.strict),active=model===selectedModel&&condition.id===selectedCondition;return <button type="button" aria-pressed={active} onClick={()=>{setSelectedModel(model);setSelectedCondition(condition.id)}} className={active?"active":""} key={condition.id} style={{"--model-color":modelColor(model)} as React.CSSProperties}><span><i className="coherent" style={{width:`${coherent*100}%`}}/><i className="strict" style={{width:`${strict*100}%`}}/></span><b>{Math.round(coherent*40)} <small>coherent</small></b><em>{Math.round(strict*40)} strict</em></button>})}</div>)}</div>
        </div>
        <aside className="integrated-selection" style={{"--model-color":modelColor(selectedModel)} as React.CSSProperties}>
          <div className="integrated-selection-title"><small>Selected chain</small><ModelName name={selectedModel}/><b>{selectedMeta.label}</b></div>
          <div className="integrated-selection-metrics"><div><span>Coherent</span><strong>{Math.round(num(selected.coherent)*40)}<small>/40</small></strong><i><b style={{width:`${num(selected.coherent)*100}%`}}/></i></div><div><span>Strict success</span><strong>{Math.round(num(selected.strict)*40)}<small>/40</small></strong><i><b style={{width:`${num(selected.strict)*100}%`}}/></i></div></div>
          <div className="integrated-brier"><span>Predict Brier <small>lower is better</small></span><div><strong>{brier.toFixed(3)}</strong><i>vs</i><b>{prior.toFixed(3)} prior</b></div><p className={brierGap<=0?"better":"worse"}>{brierGap>0?"+":""}{brierGap.toFixed(3)} from population prior</p></div>
          <p>{selectedMeta.note}</p>
        </aside>
      </div>
      <div className="integrated-condition-notes">{conditions.map((condition,index)=><button type="button" className={condition.id===selectedCondition?"active":""} onClick={()=>setSelectedCondition(condition.id)} key={condition.id}><span>{index+1}</span><div><b>{condition.label}</b><p>{condition.note}</p></div></button>)}</div>
      <div className="integrated-takeaway"><Eyebrow>Central result</Eyebrow><h3>Passing earlier answers forward can make the chain agree without making the patient state correct.</h3><p>Model-carried context often raises coherence sharply, but strict success remains rare. Even a supplied reference state does not produce reliable hidden-future prediction.</p></div>
    </section>
  </div>;
}

export function TasksView() {
  const data=useData();
  const [active,setActive]=useState("Assess");
  useEffect(()=>{
    const initial=new URLSearchParams(window.location.search).get("operation");
    const match=TASK_LABELS.find(label=>label.toLowerCase()===initial);
    if(match)window.setTimeout(()=>setActive(match),0);
  },[]);
  if(!data)return <Loading/>;
  return <main className="content-page task-page"><PageIntro eyebrow="Operation laboratory" title="Follow the patient state from image to action.">Every panel uses its own validated cohort and metric. Select an operation to inspect the result structure, model ranking, and central failure mode.</PageIntro><div className="task-nav">{TASK_LABELS.map((l,i)=><button className={active===l?"active":""} onClick={()=>setActive(l)} key={l}><span>{i<6?`0${i+1}`:"+1"}</span>{l}</button>)}</div>{active==="Assess"&&<AssessPanel data={data}/>} {active==="Read"&&<ReadPanel data={data}/>} {active==="Compare"&&<ComparePanel data={data}/>} {active==="Predict"&&<PredictPanel data={data}/>} {active==="Conclude"&&<ConcludePanel data={data}/>} {active==="Advise"&&<AdvisePanel data={data}/>} {active==="Integrated"&&<IntegratedPanel data={data}/>}</main>;
}

function RadarCanvas({ values, labels, color=COLORS[0] }: { values:number[]; labels:string[]; color?:string }) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const canvas=ref.current;if(!canvas)return;const dpr=window.devicePixelRatio||1;const w=canvas.clientWidth,h=canvas.clientHeight;canvas.width=w*dpr;canvas.height=h*dpr;const c=canvas.getContext("2d");if(!c)return;c.scale(dpr,dpr);c.clearRect(0,0,w,h);const cx=w/2,cy=h/2,r=Math.min(w,h)*.32,n=labels.length;const point=(i:number,v:number)=>[cx+Math.sin(i/n*Math.PI*2)*r*v,cy-Math.cos(i/n*Math.PI*2)*r*v] as [number,number];c.font="11px Arial";c.textAlign="center";c.textBaseline="middle";for(let ring=1;ring<=4;ring++){c.beginPath();for(let i=0;i<n;i++){const [x,y]=point(i,ring/4);if(i)c.lineTo(x,y);else c.moveTo(x,y)}c.closePath();c.strokeStyle="#d8ddd9";c.stroke()}for(let i=0;i<n;i++){const [x,y]=point(i,1);c.beginPath();c.moveTo(cx,cy);c.lineTo(x,y);c.strokeStyle="#e1e4e2";c.stroke();const [lx,ly]=point(i,1.22);c.fillStyle="#606861";c.fillText(labels[i],lx,ly)}c.beginPath();values.forEach((v,i)=>{const [x,y]=point(i,Math.max(0,Math.min(1,v)));if(i)c.lineTo(x,y);else c.moveTo(x,y)});c.closePath();c.fillStyle=`${color}33`;c.fill();c.strokeStyle=color;c.lineWidth=2;c.stroke();values.forEach((v,i)=>{const [x,y]=point(i,v);c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fillStyle=color;c.fill()})},[values,labels,color]);
  return <canvas className="radar" ref={ref} aria-label="Organ-system performance radar"/>;
}

export function ExplorerView() {
  const data=useData();
  const [model,setModel]=useState("GPT-5.5");
  const [organ,setOrgan]=useState("All systems");
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState<string|null>(null);
  if(!data)return <Loading/>;
  const models=Array.from(new Set(data.read.breadth.map(r=>String(r.model))));
  const organs=["All systems",...Array.from(new Set(data.read.breadth.map(r=>String(r.organ)))).sort()];
  const rows=data.read.breadth.filter(r=>r.model===model&&(organ==="All systems"||r.organ===organ)&&String(r.finding).toLowerCase().includes(query.toLowerCase())).sort((a,b)=>num(b.ba)-num(a.ba));
  const allModelRows=data.read.breadth.filter(r=>r.model===model);
  const organMap=new Map<string,number[]>();allModelRows.forEach(r=>{const key=String(r.organ);organMap.set(key,[...(organMap.get(key)||[]),num(r.ba)])});
  const radarLabels=Array.from(organMap).sort((a,b)=>b[1].length-a[1].length).slice(0,8).map(x=>x[0].replace("Systemic / chronic","Systemic"));
  const radarValues=radarLabels.map(label=>{const key=label==="Systemic"?"Systemic / chronic":label;const vals=organMap.get(key)||[];return vals.reduce((a,b)=>a+b,0)/vals.length});
  const detail=selected?data.read.breadth.filter(r=>r.findingId===selected).sort((a,b)=>num(b.ba)-num(a.ba)):[];
  return <main className="content-page explorer-page"><PageIntro eyebrow="Finding explorer" title="Open the 179-finding result matrix.">Counts show all report-positive examinations in RADWORLD, not the smaller balanced evaluation sample. Choose a model, search for a finding, and open its cross-model ranking.</PageIntro><section className="explorer-controls"><div><label>Model</label><select value={model} onChange={e=>setModel(e.target.value)}>{models.map(m=><option key={m}>{m}</option>)}</select></div><div><label>Organ system</label><select value={organ} onChange={e=>setOrgan(e.target.value)}>{organs.map(o=><option key={o}>{o}</option>)}</select></div><div><label>Find a finding</label><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. pleural effusion"/></div></section><section className="explorer-layout"><div className="profile-card"><div><Eyebrow>Body-system profile</Eyebrow><h2><ModelName name={model}/></h2><p>Mean balanced accuracy within the largest finding groups.</p></div><RadarCanvas labels={radarLabels} values={radarValues} color={modelColor(model)}/></div><div className="matrix-card"><div className="matrix-head"><h2>{rows.length} of 179 findings</h2><span>task balanced accuracy</span></div><div className="finding-table">{rows.map(r=><button key={String(r.findingId)} onClick={()=>setSelected(String(r.findingId))}><span><b>{r.finding}</b><small>{r.organ} · {num(r.datasetPositive).toLocaleString()} report-positive exams in RADWORLD</small></span><i><em style={{width:`${num(r.ba)*100}%`,background:num(r.ba)>=.6?"#009E73":num(r.ba)<.5?"#D55E00":"#E69F00"}}/></i><strong>{num(r.ba).toFixed(3)}</strong></button>)}</div></div></section>{selected&&<div className="detail-drawer"><button className="close" onClick={()=>setSelected(null)}>×</button><Eyebrow>Cross-model detail</Eyebrow><h2>{detail[0]?.finding}</h2><p>{detail[0]?.organ} · {num(detail[0]?.datasetPositive).toLocaleString()} report-positive examinations in the full RADWORLD dataset</p><div className="detail-ranking">{detail.map((r,i)=><div key={`${r.model}-${i}`} style={{"--model-color":modelColor(String(r.model))} as React.CSSProperties}><span>{i+1}</span><b><ModelName name={String(r.model)}/></b><i><em style={{width:`${num(r.ba)*100}%`}}/></i><strong>{num(r.ba).toFixed(3)}</strong></div>)}</div></div>}</main>;
}

const SUBMIT_OPERATIONS = ["Assess", "Read", "Compare", "Predict", "Conclude", "Advise", "Integrated"];
const SUBMIT_INTERFACES = ["Single image / slice", "Ordered multi-slice CT", "Native 3D CT volume", "Paired examinations", "Images + clinical text"];

export function SubmitView() {
  const [operations,setOperations]=useState<string[]>([]);
  const [interfaces,setInterfaces]=useState<string[]>([]);
  const [copied,setCopied]=useState(false);
  const [error,setError]=useState("");
  const [form,setForm]=useState({model:"",release:"",organization:"",contact:"",family:"General-purpose VLM",modelUrl:"",resultsUrl:"",paperUrl:"",notes:""});
  const update=(key:keyof typeof form,value:string)=>setForm(current=>({...current,[key]:value}));
  const toggle=(value:string,list:string[],setList:(next:string[])=>void)=>setList(list.includes(value)?list.filter(item=>item!==value):[...list,value]);
  const manifest=JSON.stringify({benchmark:"RADWORLD",model:form.model||"MODEL_NAME",release:form.release||"MODEL_RELEASE",organization:form.organization||"ORGANIZATION",family:form.family,input_interfaces:interfaces,operations,model_url:form.modelUrl||null,results_url:form.resultsUrl||null,paper_url:form.paperUrl||null,contact:form.contact||null,notes:form.notes||null},null,2);
  const issueBody=()=>[
    "## RADWORLD model submission",
    "",
    `- **Model:** ${form.model}`,
    `- **Exact release / checkpoint:** ${form.release}`,
    `- **Organization:** ${form.organization}`,
    `- **Model family:** ${form.family}`,
    `- **Public contact:** ${form.contact}`,
    `- **Model or code URL:** ${form.modelUrl}`,
    `- **Result artifacts:** ${form.resultsUrl}`,
    `- **Paper / technical report:** ${form.paperUrl||"Not provided"}`,
    `- **Supported interfaces:** ${interfaces.join(", ")}`,
    `- **Submitted operations:** ${operations.join(", ")}`,
    "",
    "### Notes",
    form.notes||"None.",
    "",
    "### Attestation",
    "I confirm that these results use the released RADWORLD cohorts, prompts, parsers, and metrics without test-label tuning, case substitution, or silent fallback. I understand that results are added only after artifact verification.",
    "",
    "```json",
    manifest,
    "```",
  ].join("\n");
  const validate=()=>{if(!form.model||!form.release||!form.organization||!form.contact||!form.modelUrl||!form.resultsUrl){setError("Complete all required identity and artifact fields.");return false;}if(!interfaces.length||!operations.length){setError("Select at least one input interface and one operation.");return false;}setError("");return true;};
  const submit=(event:React.FormEvent)=>{event.preventDefault();if(!validate())return;const url=`https://github.com/MrGiovanni/Hinton-Test/issues/new?title=${encodeURIComponent(`[Model submission] ${form.model} ${form.release}`)}&body=${encodeURIComponent(issueBody())}`;window.open(url,"_blank","noopener,noreferrer");};
  const copy=async()=>{if(!validate())return;await navigator.clipboard.writeText(manifest);setCopied(true);window.setTimeout(()=>setCopied(false),1800);};
  return <main className="content-page submit-page">
    <PageIntro eyebrow="Community evaluation" title="Submit your model to RADWORLD.">Use the released protocol, preserve each model&apos;s official interface, and provide complete artifacts. Submissions are verified before they appear in the leaderboard.</PageIntro>
    <section className="submit-steps"><article><span>01</span><b>Run</b><p>Use the frozen cohorts, prompts, and operation-specific parsers.</p></article><i>→</i><article><span>02</span><b>Publish</b><p>Provide predictions, references, metrics, and provenance in a stable repository.</p></article><i>→</i><article><span>03</span><b>Verify</b><p>We audit coverage, identity, parsing, and scores before listing the result.</p></article></section>
    <section className="submit-layout">
      <form className="submit-form" onSubmit={submit}>
        <header><div><Eyebrow>Submission form</Eyebrow><h2>Model and result identity</h2></div><span>* required</span></header>
        <div className="submit-fields">
          <label><span>Model name *</span><input required value={form.model} onChange={e=>update("model",e.target.value)} placeholder="e.g. Example-VLM-12B"/></label>
          <label><span>Exact release / checkpoint *</span><input required value={form.release} onChange={e=>update("release",e.target.value)} placeholder="version, date, or commit SHA"/></label>
          <label><span>Organization *</span><input required value={form.organization} onChange={e=>update("organization",e.target.value)} placeholder="Company, university, or laboratory"/></label>
          <label><span>Public contact *</span><input required value={form.contact} onChange={e=>update("contact",e.target.value)} placeholder="Email, GitHub handle, or ORCID"/></label>
          <label><span>Model family *</span><select value={form.family} onChange={e=>update("family",e.target.value)}><option>General-purpose VLM</option><option>Medical slice / video VLM</option><option>Native-volume CT VLM</option><option>Frozen CT encoder</option><option>Other</option></select></label>
          <label><span>Model or code URL *</span><input type="url" required value={form.modelUrl} onChange={e=>update("modelUrl",e.target.value)} placeholder="https://…"/></label>
          <label className="wide"><span>Public result-artifact URL *</span><input type="url" required value={form.resultsUrl} onChange={e=>update("resultsUrl",e.target.value)} placeholder="Predictions, references, metrics, and run metadata"/><small>Do not submit patient images, protected health information, credentials, or private storage links.</small></label>
          <label className="wide"><span>Paper or technical report</span><input type="url" value={form.paperUrl} onChange={e=>update("paperUrl",e.target.value)} placeholder="https://…"/></label>
        </div>
        <fieldset><legend>Supported input interface *</legend><div className="submit-checks">{SUBMIT_INTERFACES.map(item=><label key={item}><input type="checkbox" checked={interfaces.includes(item)} onChange={()=>toggle(item,interfaces,setInterfaces)}/><span>{item}</span></label>)}</div></fieldset>
        <fieldset><legend>Completed RADWORLD operations *</legend><div className="submit-checks operations">{SUBMIT_OPERATIONS.map(item=><label key={item}><input type="checkbox" checked={operations.includes(item)} onChange={()=>toggle(item,operations,setOperations)}/><span>{item}</span></label>)}</div></fieldset>
        <label className="submit-notes"><span>Implementation notes</span><textarea rows={5} value={form.notes} onChange={e=>update("notes",e.target.value)} placeholder="Inference settings, interface limitations, or operation-specific details reviewers should know."/></label>
        <label className="submit-attest"><input required type="checkbox"/><span>I confirm that the submitted results use the released RADWORLD cohorts and evaluation rules without test-label tuning, substituted cases, or unreported fallback.</span></label>
        {error&&<p className="submit-error" role="alert">{error}</p>}
        <div className="submit-actions"><button type="submit">Create GitHub submission ↗</button><button type="button" className="secondary" onClick={copy}>{copied?"Copied ✓":"Copy manifest JSON"}</button></div>
        <p className="submit-public-note">The primary button opens a prefilled public GitHub issue. Review the text and remove any information you do not want published before submitting.</p>
      </form>
      <aside className="submit-aside"><div><Eyebrow>Generated manifest</Eyebrow><h2>One auditable record.</h2><p>The preview updates as you complete the form. Copy it into your result folder or include it in the submission issue.</p><pre>{manifest}</pre></div><div className="submit-policy"><h3>Minimum artifact package</h3><ul><li>One row per evaluated case or decision</li><li>Model output beside the reference answer</li><li>Parse status and missing-output accounting</li><li>Operation-level and per-finding metrics</li><li>Exact model release and inference settings</li></ul><Link href="/about#downloads">Download benchmark resources →</Link></div></aside>
    </section>
  </main>;
}

export function ResourcesView() {
  return <main className="content-page"><PageIntro eyebrow="Methods & resources" title="A benchmark designed to be inspected, not just ranked.">RADWORLD keeps model outputs, references, operation-specific metrics, and figure sources separate so every result can be traced to its protocol.</PageIntro><section id="methods" className="resource-grid"><div className="resource-card featured"><span>01</span><h2>Protocol map</h2><p>Assess → Read → Compare → Predict → Conclude → Advise. Each operation exposes a different part of a patient world model without pretending the metrics are interchangeable.</p></div><div className="resource-card"><span>02</span><h2>Fair comparisons</h2><p>Patient-disjoint cohorts, frozen model releases, shared prompts, explicit interface eligibility, and operation-specific baselines.</p></div><div className="resource-card"><span>03</span><h2>Reader validation</h2><p>Independent radiologist studies test whether report-derived targets remain recognizable under the rendered inputs given to models.</p></div></section><section id="downloads" className="downloads"><SectionHead index="↓" title="Download and reproduce" copy="The interactive site is generated from the same verified result files used by the manuscript."/><div className="download-list"><a href={assetPath("/data/benchmark.json")} download><span>Web data bundle</span><small>All interactive result tables · JSON</small><b>↓</b></a><a href="https://github.com/MrGiovanni/Hinton-Test"><span>Website repository</span><small>Interactive source, assets, and deployment workflow</small><b>↗</b></a><a href="https://github.com/MrGiovanni/TMI-2026-Med-Reasoning/tree/main/docs/results/standalone_operation_outputs_v1"><span>Per-operation outputs</span><small>Model outputs vs. references and score artifacts</small><b>↗</b></a></div></section><section className="citation-card"><Eyebrow>Citation</Eyebrow><h2>RADWORLD</h2><p>Do vision–language models have a world model of the patient?</p><code>{`@article{radworld2026,\n  title={RADWORLD: Do Vision--Language Models Have a World Model of the Patient?},\n  year={2026}\n}`}</code></section></main>;
}
