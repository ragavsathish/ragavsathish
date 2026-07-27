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

const webGpuModelId = "SmolLM2-1.7B-Instruct-q4f16_1-MLC";
const transformersModelId = "onnx-community/SmolLM2-135M-Instruct-ONNX-MHA";
let store;
let engine;
let rdfFacts;

const rdfStatus = document.querySelector("#rdfStatus");
const gpuStatus = document.querySelector("#gpuStatus");
const wasmStatus = document.querySelector("#wasmStatus");
const llmStatus = document.querySelector("#llmStatus");
const llmDetail = document.querySelector("#llmDetail");
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
  wasmStatus.textContent = "WebAssembly" in window ? "Available" : "Unavailable";
  loadLlm.disabled = !("gpu" in navigator) && !("WebAssembly" in window);

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
  llmDetail.textContent = "Trying WebGPU WebLLM first.";

  try {
    engine = await loadWebGpuEngine();
    llmStatus.textContent = "Ready";
    llmDetail.textContent = `Using WebGPU model ${webGpuModelId}.`;
    return;
  } catch (error) {
    const webGpuError = formatError(error);
    llmDetail.textContent = `WebLLM WebGPU failed: ${webGpuError}. Trying Transformers.js WebGPU.`;
  }

  try {
    engine = await loadTransformersEngine("webgpu");
    llmStatus.textContent = "Ready";
    llmDetail.textContent += ` Loaded Transformers.js WebGPU model ${transformersModelId}.`;
    return;
  } catch (error) {
    llmDetail.textContent += ` Transformers.js WebGPU failed: ${formatError(error)}. Trying WASM CPU.`;
  }

  try {
    engine = await loadTransformersEngine("wasm");
    llmStatus.textContent = "Ready";
    llmDetail.textContent += ` Loaded Transformers.js WASM model ${transformersModelId}.`;
  } catch (error) {
    llmStatus.textContent = "Unavailable";
    llmDetail.textContent += ` Transformers.js WASM failed: ${formatError(error)}.`;
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
  renderAssessment(result, {
    llmText: "Drafting grounded assessment...",
    llmState: "drafting"
  });

  if (!engine) {
    renderAssessment(result);
    return;
  }

  try {
    const llmText = await summarizeWithLlm(question, result);
    if (!isGroundedLlmText(llmText, result)) {
      renderAssessment(result, {
        llmNotice: "The browser-local LLM draft was rejected because it did not preserve the RDF-grounded facts exactly.",
        llmState: "rejected"
      });
      return;
    }
    renderAssessment(result, {
      llmText,
      llmState: "accepted"
    });
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
    .replace("https://ragavsathish.github.io/product/", "product:")
    .replace("https://ragavsathish.github.io/resource/", "resource:");
}

async function summarizeWithLlm(question, result) {
  return engine.summarize(question, result);
}

async function loadWebGpuEngine() {
  const webllm = await import("https://esm.run/@mlc-ai/web-llm");
  const webGpuEngine = await webllm.CreateMLCEngine(webGpuModelId, {
    initProgressCallback: (progress) => {
      const percent = Math.round((progress.progress || 0) * 100);
      llmStatus.textContent = percent ? `WebGPU ${percent}%` : "Loading WebGPU";
    }
  });

  return {
    modelId: webGpuModelId,
    runtime: "WebGPU + WebAssembly",
    backend: "WebLLM",
    network: "model fetch only",
    async summarize(question, result) {
      const completion = await webGpuEngine.chat.completions.create({
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
  };
}

async function loadTransformersEngine(device) {
  const transformers = await import("https://esm.run/@huggingface/transformers");
  const isWebGpu = device === "webgpu";
  const generator = await transformers.pipeline("text-generation", transformersModelId, {
    device,
    dtype: "q4",
    progress_callback: (progress) => {
      const loaded = progress?.loaded || 0;
      const total = progress?.total || 0;
      const label = isWebGpu ? "Transformers WebGPU" : "WASM";
      if (loaded && total) {
        llmStatus.textContent = `${label} ${Math.round((loaded / total) * 100)}%`;
      } else {
        llmStatus.textContent = `Loading ${label}`;
      }
    }
  });

  return {
    modelId: transformersModelId,
    runtime: isWebGpu ? "WebGPU via Transformers.js" : "WebAssembly CPU",
    backend: "Transformers.js",
    network: "model fetch only",
    async summarize(question, result) {
      const prompt = `${llmSystemPrompt}\n\n${buildLlmUserPrompt(question, result)}`;
      const output = await generator(prompt, {
        max_new_tokens: 160,
        do_sample: false,
        return_full_text: false
      });
      return extractGeneratedText(output);
    }
  };
}

function extractGeneratedText(output) {
  const first = Array.isArray(output) ? output[0] : output;
  return first?.generated_text || first?.[0]?.generated_text || "";
}

function formatError(error) {
  const name = error?.name ? `${error.name}: ` : "";
  return `${name}${error?.message || String(error)}`.replace(/\s+/g, " ").trim();
}

function llmRuntime() {
  return {
    modelId: engine?.modelId || "Not loaded",
    runtime: engine?.runtime || "Browser",
    backend: engine?.backend || "Browser-local",
    network: engine?.network || "model fetch only"
  };
}

function renderAssessment(result, llmRender = {}) {
  if (result.kind === "fact") {
    renderFactAnswer(result, llmRender);
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
        ${renderLlmSection(llmRender)}
        ${section("Grounded evidence", list(result.evidence))}
        ${section("Gaps", list(result.gaps))}
        ${section("Positioning", `<p>${escapeHtml(result.positioning)}</p>`)}
        ${section("Related fits", list(result.related))}
        ${section("Source", `<p class="source">All evidence comes from <code>rdf/ragavsathish-ontology.ttl</code>. Browser LLM rendering is accepted only after the grounding guard preserves RDF-derived facts.</p>`, true)}
      </div>
    </article>
  `;
}

function renderFactAnswer(result, llmRender = {}) {
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
        ${renderLlmSection(llmRender)}
        ${section("Answer", `<p>${escapeHtml(result.answer)}</p>`, true)}
        ${section("Grounded evidence", list(result.evidence))}
        ${section("Source", `<p class="source">All evidence comes from <code>rdf/ragavsathish-ontology.ttl</code>. Browser LLM rendering is accepted only after the grounding guard preserves RDF-derived facts.</p>`, true)}
      </div>
    </article>
  `;
}

function renderLlmSection({ llmText = "", llmNotice = "", llmState = "" } = {}) {
  if (!llmText && !llmNotice) return "";

  const statusByState = {
    drafting: "Drafting in browser",
    accepted: "Guard passed",
    rejected: "Guard rejected"
  };
  const status = statusByState[llmState] || "Browser-local";
  const runtime = llmRuntime();
  const body = `
    <div class="llm-runtime">
      <span>${escapeHtml(status)}</span>
      <span>Backend: ${escapeHtml(runtime.backend)}</span>
      <span>Model: ${escapeHtml(runtime.modelId)}</span>
      <span>Runtime: ${escapeHtml(runtime.runtime)}</span>
      <span>Network: ${escapeHtml(runtime.network)}</span>
    </div>
    ${llmText ? `<div class="llm-answer">${escapeHtml(llmText)}</div>` : ""}
    ${llmNotice ? `<p class="llm-notice">${escapeHtml(llmNotice)}</p>` : ""}
  `;

  return section("Browser-local LLM rendering", body, true);
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
