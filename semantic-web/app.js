import { DataFactory, Parser, Store } from "https://esm.sh/n3@2.1.1";

const { namedNode } = DataFactory;

const NS = {
  me: "https://ragavsathish.github.io/#me",
  onto: "https://ragavsathish.github.io/ontology#",
  schema: "https://schema.org/",
  skos: "http://www.w3.org/2004/02/skos/core#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#"
};

const modelId = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
let store;
let engine;
let rdfFacts;

const rdfStatus = document.querySelector("#rdfStatus");
const gpuStatus = document.querySelector("#gpuStatus");
const llmStatus = document.querySelector("#llmStatus");
const loadLlm = document.querySelector("#loadLlm");
const answer = document.querySelector("#answer");
const form = document.querySelector("#questionForm");
const input = document.querySelector("#question");

const p = {
  hasPurpose: iri("onto", "hasPurpose"),
  guidedBy: iri("onto", "guidedBy"),
  practices: iri("onto", "practices"),
  developsThrough: iri("onto", "developsThrough"),
  seeksToReduce: iri("onto", "seeksToReduce"),
  workedOn: iri("onto", "workedOn"),
  hasCareerRole: iri("onto", "hasCareerRole"),
  atOrganization: iri("onto", "atOrganization"),
  builtWith: iri("onto", "builtWith"),
  inDomain: iri("onto", "inDomain"),
  translates: iri("onto", "translates"),
  accelerates: iri("onto", "accelerates"),
  requires: iri("onto", "requires"),
  contributesTo: iri("onto", "contributesTo"),
  expresses: iri("onto", "expresses"),
  name: iri("schema", "name"),
  roleName: iri("schema", "roleName"),
  startDate: iri("schema", "startDate"),
  endDate: iri("schema", "endDate"),
  prefLabel: iri("skos", "prefLabel"),
  label: iri("rdfs", "label")
};

const fitProfiles = [
  {
    id: "medtech-founder",
    label: "MedTech founder / biodesign program",
    keywords: ["medtech", "medical device", "founder", "biodesign", "clinical innovation", "startup", "fellow"],
    positives: [
      ["domain:MedicalDeviceSoftware", 18],
      ["domain:RegulatedHealthcare", 14],
      ["domain:ClinicalValidation", 12],
      ["domain:PostMarketSurveillance", 9],
      ["project:MEGMapsPlatform", 16],
      ["project:HallaHealth", 14],
      ["role:MeginSeniorSoftwareDeveloperArchitect", 16],
      ["role:ScopeImpactTechnologyLead", 13],
      ["practice:ProductDiscovery", 9],
      [":ResearchToProductTranslation", 12],
      [":HumanInTheLoopValidation", 10],
      ["value:SystemsEmpathy", 8]
    ],
    gaps: [
      "Make commercial ownership and founder-level accountability explicit.",
      "Add concrete clinical discovery stories, not only platform achievements."
    ],
    positioning: "Research-to-product healthcare technologist with regulated medical software, digital health, and clinical workflow exposure."
  },
  {
    id: "health-ai-product",
    label: "Health AI product / technology lead",
    keywords: ["health ai", "ai health", "digital health", "product lead", "technology lead", "healthcare ai", "self-care"],
    positives: [
      ["domain:AIEnabledHealthcare", 18],
      ["domain:DigitalHealth", 16],
      ["domain:ClimateHealth", 9],
      ["project:HallaHealth", 18],
      ["role:ScopeImpactTechnologyLead", 18],
      ["practice:ProductDiscovery", 10],
      ["value:HumanWellBeing", 8],
      ["value:SystemsEmpathy", 8],
      ["skill:AWS", 6]
    ],
    gaps: [
      "Show measurable product outcomes and adoption signals.",
      "Separate AI product judgment from infrastructure delivery."
    ],
    positioning: "Digital health technical lead who can connect AI-enabled product direction with privacy-aware architecture and healthcare purpose."
  },
  {
    id: "cloud-platform",
    label: "Cloud platform / regulated infrastructure architect",
    keywords: ["cloud", "platform", "infrastructure", "devops", "kubernetes", "aws", "terraform", "architect", "gitops"],
    positives: [
      ["skill:AWS", 16],
      ["skill:Terraform", 15],
      ["skill:Kubernetes", 14],
      ["skill:Docker", 10],
      ["skill:GitLab", 9],
      ["skill:ArgoCD", 9],
      ["skill:OpenShift", 9],
      ["project:SignantCloudMigration", 15],
      ["project:MEGMapsPlatform", 12],
      ["role:SignantSeniorSoftwareDesigner", 12],
      ["role:MeginSeniorSoftwareDeveloperArchitect", 12]
    ],
    gaps: [
      "For pure platform roles, reduce philosophical framing and lead with scale, reliability, and delivery metrics."
    ],
    positioning: "Strong regulated cloud/platform architect with hybrid, edge, GitOps, and infrastructure-as-code experience."
  },
  {
    id: "research-neuro",
    label: "Bioinformatics / computational neuroscience research software",
    keywords: ["research", "bioinformatics", "neuroscience", "computational neuroscience", "matlab", "retina", "academic"],
    positives: [
      ["domain:Bioinformatics", 16],
      ["domain:ComputationalNeuroscience", 16],
      ["project:AlaLaurilaDataAcquisition", 14],
      ["project:RetinalCircuitAnalysis", 14],
      ["role:AaltoGraduateResearcher", 13],
      ["skill:MATLAB", 8],
      ["skill:HDF5", 8],
      ["practice:ScientificResearch", 8]
    ],
    gaps: [
      "If applying to research-heavy roles, publications and methods depth should be more visible."
    ],
    positioning: "Software engineer with real bioinformatics and neuroscience research tooling experience."
  },
  {
    id: "pure-clinical",
    label: "Pure clinical / licensed care delivery",
    keywords: ["doctor", "physician", "nurse", "clinical role", "pure clinical", "care delivery", "medical practitioner"],
    positives: [
      ["domain:ClinicalValidation", 6],
      ["practice:ClinicalObservation", 6],
      ["domain:MedicalDeviceSoftware", 5]
    ],
    penalty: 45,
    gaps: [
      "The RDF does not show a clinical license or direct care-delivery role.",
      "Best positioned as a healthcare technologist, not as a clinician."
    ],
    positioning: "Partial fit only where clinical teams need a technical partner for regulated software and workflow translation."
  },
  {
    id: "brand-design",
    label: "Frontend brand / visual design specialist",
    keywords: ["brand design", "visual design", "ui designer", "graphic design", "marketing site", "frontend brand"],
    positives: [
      ["skill:React", 8],
      ["skill:MaterialUI", 6],
      ["project:SeppoSinglePageApplication", 6]
    ],
    penalty: 35,
    gaps: [
      "The RDF evidence is stronger in healthcare platforms and infrastructure than visual identity ownership.",
      "Use frontend work as supporting evidence, not the central pitch."
    ],
    positioning: "Better fit for product engineering than pure brand or visual design."
  }
];

init();

async function init() {
  gpuStatus.textContent = "gpu" in navigator ? "Available" : "Unavailable";
  loadLlm.disabled = !("gpu" in navigator);

  try {
    const response = await fetch("../rdf/ragavsathish-ontology.ttl");
    const ttl = await response.text();
    const parser = new Parser({ baseIRI: "https://ragavsathish.github.io/" });
    store = new Store(parser.parse(ttl));
    rdfFacts = collectFacts();
    rdfStatus.textContent = `${store.size} triples`;
  } catch (error) {
    rdfStatus.textContent = "Failed";
    renderError("Could not load RDF. Open this page through a local server or GitHub Pages, not directly from file://.");
  }
}

loadLlm.addEventListener("click", async () => {
  loadLlm.disabled = true;
  llmStatus.textContent = "Loading";

  try {
    const webllm = await import("https://esm.run/@mlc-ai/web-llm");
    engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: (progress) => {
        const percent = Math.round((progress.progress || 0) * 100);
        llmStatus.textContent = percent ? `${percent}%` : "Loading";
      }
    });
    llmStatus.textContent = "Ready";
  } catch (error) {
    llmStatus.textContent = "Unavailable";
    loadLlm.disabled = false;
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!rdfFacts) return;
  await assess(input.value.trim());
});

document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", async () => {
    input.value = button.dataset.question;
    if (rdfFacts) await assess(input.value);
  });
});

async function assess(question) {
  const result = assessFit(question);
  renderAssessment(result, "Drafting grounded assessment...");

  if (!engine) {
    renderAssessment(result);
    return;
  }

  try {
    const llmText = await summarizeWithLlm(question, result);
    renderAssessment(result, llmText);
  } catch {
    renderAssessment(result);
  }
}

function assessFit(question) {
  const normalized = question.toLowerCase();
  const matched = fitProfiles
    .map((profile) => ({
      ...profile,
      keywordHits: profile.keywords.filter((keyword) => normalized.includes(keyword))
    }))
    .filter((profile) => profile.keywordHits.length > 0);

  const profiles = matched.length ? matched : fitProfiles.slice(0, 4);
  const scored = profiles.map(scoreProfile).sort((a, b) => b.score - a.score);
  const top = scored[0];
  const fit = top.score >= 72 ? "Strong" : top.score >= 42 ? "Partial" : "Weak";

  return {
    question,
    fit,
    score: top.score,
    target: top.label,
    evidence: top.evidence.slice(0, 8),
    gaps: top.gaps,
    positioning: top.positioning,
    related: scored.slice(1, 4).map((item) => `${item.label}: ${item.score}/100`)
  };
}

function scoreProfile(profile) {
  const evidence = [];
  let score = profile.keywordHits.length ? 16 : 8;

  for (const [id, weight] of profile.positives) {
    const fact = rdfFacts.byShort.get(id);
    if (!fact) continue;
    score += weight;
    evidence.push(`${fact.label} (${id})`);
  }

  score -= profile.penalty || 0;
  return {
    ...profile,
    score: Math.max(0, Math.min(100, score)),
    evidence
  };
}

function collectFacts() {
  const byShort = new Map();
  const resources = new Set();

  for (const quad of store.getQuads(null, null, null, null)) {
    if (quad.subject.termType === "NamedNode") resources.add(quad.subject.value);
    if (quad.object.termType === "NamedNode") resources.add(quad.object.value);
  }

  for (const iriValue of resources) {
    byShort.set(shorten(iriValue), {
      iri: iriValue,
      label: labelFor(iriValue),
      comment: literal(iriValue, iri("rdfs", "comment"))
    });
  }

  return { byShort };
}

function labelFor(resource) {
  return (
    literal(resource, p.prefLabel) ||
    literal(resource, p.name) ||
    literal(resource, p.roleName) ||
    literal(resource, p.label) ||
    shorten(resource)
  );
}

function literal(subject, predicate) {
  const quad = store.getQuads(namedNode(subject), namedNode(predicate), null, null)
    .find((item) => item.object.termType === "Literal");
  return quad?.object.value || "";
}

function iri(prefix, name) {
  return `${NS[prefix]}${name}`;
}

function shorten(value) {
  return value
    .replace("https://ragavsathish.github.io/ontology#", ":")
    .replace("https://ragavsathish.github.io/#", "me:")
    .replace("https://ragavsathish.github.io/org/", "org:")
    .replace("https://ragavsathish.github.io/project/", "project:")
    .replace("https://ragavsathish.github.io/role/", "role:")
    .replace("https://ragavsathish.github.io/value/", "value:")
    .replace("https://ragavsathish.github.io/practice/", "practice:")
    .replace("https://ragavsathish.github.io/skill/", "skill:")
    .replace("https://ragavsathish.github.io/domain/", "domain:")
    .replace("https://ragavsathish.github.io/product/", "product:");
}

async function summarizeWithLlm(question, result) {
  const facts = [
    `Fit: ${result.fit} (${result.score}/100)`,
    `Target: ${result.target}`,
    `Evidence: ${result.evidence.join("; ")}`,
    `Gaps: ${result.gaps.join("; ")}`,
    `Positioning: ${result.positioning}`
  ].join("\n");

  const completion = await engine.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You write concise career-fit assessments. Use only the provided RDF-derived facts. Say when evidence is missing. Do not invent roles, companies, dates, or credentials."
      },
      {
        role: "user",
        content: `Question: ${question}\n\nRDF-derived facts:\n${facts}\n\nWrite a short answer with Fit, Why, Gaps, and Positioning.`
      }
    ],
    temperature: 0.2
  });

  return completion.choices?.[0]?.message?.content || "";
}

function renderAssessment(result, llmText = "") {
  const fitClass = result.fit.toLowerCase();
  answer.innerHTML = `
    <article class="answer-card">
      <header class="answer-header">
        <div>
          <h2>${escapeHtml(result.target)}</h2>
          <div class="score">Score: ${result.score}/100</div>
        </div>
        <span class="fit ${fitClass}">${escapeHtml(result.fit)} fit</span>
      </header>
      <div class="answer-body">
        ${llmText ? section("Local LLM answer", `<div class="llm-answer">${escapeHtml(llmText)}</div>`, true) : ""}
        ${section("Grounded evidence", list(result.evidence))}
        ${section("Gaps", list(result.gaps))}
        ${section("Positioning", `<p>${escapeHtml(result.positioning)}</p>`)}
        ${section("Related fits", list(result.related))}
        ${section("Source", `<p class="source">All evidence comes from <code>rdf/ragavsathish-ontology.ttl</code>. The LLM, when loaded, only rewrites RDF-derived results.</p>`, true)}
      </div>
    </article>
  `;
}

function section(title, body, full = false) {
  return `<section class="section ${full ? "full" : ""}"><h3>${escapeHtml(title)}</h3>${body}</section>`;
}

function list(items) {
  if (!items.length) return "<p>No grounded RDF evidence found.</p>";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderError(message) {
  answer.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
