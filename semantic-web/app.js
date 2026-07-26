import { DataFactory, Parser, Store } from "https://esm.sh/n3@2.1.1";
import { assessFit } from "./fit-engine.js";
import { buildLlmUserPrompt, isGroundedLlmText, llmSystemPrompt } from "./llm-prompt.js";

const { namedNode } = DataFactory;

const NS = {
  me: "https://ragavsathish.github.io/#me",
  onto: "https://ragavsathish.github.io/ontology#",
  schema: "https://schema.org/",
  skos: "http://www.w3.org/2004/02/skos/core#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#"
};

const modelId = "SmolLM2-1.7B-Instruct-q4f16_1-MLC";
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
  const result = assessFit(question, rdfFacts);
  renderAssessment(result, "Drafting grounded assessment...");

  if (!engine) {
    renderAssessment(result);
    return;
  }

  try {
    const llmText = await summarizeWithLlm(question, result);
    if (!isGroundedLlmText(llmText, result)) {
      renderAssessment(result, "", "The local LLM draft was rejected because it did not preserve the RDF-grounded facts exactly.");
      return;
    }
    renderAssessment(result, llmText);
  } catch {
    renderAssessment(result);
  }
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

  return { byShort, roles: collectRoles(resources) };
}

function collectRoles(resources) {
  return [...resources]
    .map((resource) => {
      const endDate = literal(resource, p.endDate);
      if (!endDate) return null;
      const organization = store.getQuads(namedNode(resource), namedNode(p.atOrganization), null, null)
        .find((item) => item.object.termType === "NamedNode")?.object.value;

      return {
        id: shorten(resource),
        label: labelFor(resource),
        startDate: literal(resource, p.startDate),
        endDate,
        organization: organization ? {
          id: shorten(organization),
          label: labelFor(organization)
        } : null
      };
    })
    .filter(Boolean);
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
  const completion = await engine.chat.completions.create({
    messages: [
      {
        role: "system",
        content: llmSystemPrompt
      },
      {
        role: "user",
        content: buildLlmUserPrompt(question, result)
      }
    ],
    temperature: 0.2
  });

  return completion.choices?.[0]?.message?.content || "";
}

function renderAssessment(result, llmText = "", llmNotice = "") {
  if (result.kind === "fact") {
    renderFactAnswer(result, llmText, llmNotice);
    return;
  }

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
        ${llmNotice ? section("Local LLM guard", `<p>${escapeHtml(llmNotice)}</p>`, true) : ""}
        ${section("Grounded evidence", list(result.evidence))}
        ${section("Gaps", list(result.gaps))}
        ${section("Positioning", `<p>${escapeHtml(result.positioning)}</p>`)}
        ${section("Related fits", list(result.related))}
        ${section("Source", `<p class="source">All evidence comes from <code>rdf/ragavsathish-ontology.ttl</code>. The LLM, when loaded, only rewrites RDF-derived results.</p>`, true)}
      </div>
    </article>
  `;
}

function renderFactAnswer(result, llmText = "", llmNotice = "") {
  answer.innerHTML = `
    <article class="answer-card">
      <header class="answer-header">
        <div>
          <h2>${escapeHtml(result.target)}</h2>
          <div class="score">Score: ${result.score}/100</div>
        </div>
        <span class="fit strong">RDF fact</span>
      </header>
      <div class="answer-body">
        ${llmText ? section("Local LLM answer", `<div class="llm-answer">${escapeHtml(llmText)}</div>`, true) : ""}
        ${llmNotice ? section("Local LLM guard", `<p>${escapeHtml(llmNotice)}</p>`, true) : ""}
        ${section("Answer", `<p>${escapeHtml(result.answer)}</p>`, true)}
        ${section("Grounded evidence", list(result.evidence))}
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
