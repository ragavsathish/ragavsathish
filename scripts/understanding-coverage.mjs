import fs from "node:fs";
import { Parser, Store } from "n3";

const config = JSON.parse(fs.readFileSync("evals/understanding-coverage.json", "utf8"));
const scenarios = JSON.parse(fs.readFileSync("evals/rdf-fit-scenarios.json", "utf8"));
const ttl = fs.readFileSync("rdf/ragavsathish-ontology.ttl", "utf8");
const store = new Store(new Parser({ baseIRI: "https://ragavsathish.github.io/" }).parse(ttl));

const scenarioIds = new Set(scenarios.map((scenario) => scenario.id));
const rdfIds = collectRdfIds();
const conceptResults = config.concepts.map(scoreConcept);
const covered = conceptResults.filter((item) => item.covered).length;
const total = conceptResults.length;
const score = total ? covered / total : 0;
const threshold = Number(config.threshold);

const report = {
  threshold,
  score,
  covered,
  total,
  passed: score > threshold,
  concepts: conceptResults
};

fs.writeFileSync("evals/understanding-coverage-report.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  passed: report.passed,
  score: `${Math.round(score * 1000) / 10}%`,
  threshold: `${threshold * 100}%`,
  covered,
  total,
  uncovered: conceptResults.filter((item) => !item.covered).map((item) => item.id)
}, null, 2));

if (!report.passed) {
  process.exitCode = 1;
}

function scoreConcept(concept) {
  const missingEvidence = (concept.evidence || []).filter((id) => !rdfIds.has(id));
  const missingScenarios = (concept.scenarios || []).filter((id) => !scenarioIds.has(id));
  return {
    id: concept.id,
    label: concept.label,
    covered: missingEvidence.length === 0 && missingScenarios.length === 0,
    evidenceCount: concept.evidence?.length || 0,
    scenarioCount: concept.scenarios?.length || 0,
    missingEvidence,
    missingScenarios
  };
}

function collectRdfIds() {
  const ids = new Set();
  for (const quad of store.getQuads(null, null, null, null)) {
    if (quad.subject.termType === "NamedNode") ids.add(shorten(quad.subject.value));
    if (quad.object.termType === "NamedNode") ids.add(shorten(quad.object.value));
  }
  return ids;
}

function shorten(value) {
  const prefixes = [
    ["https://ragavsathish.github.io/ontology#", ":"],
    ["https://ragavsathish.github.io/#", "me:"],
    ["https://ragavsathish.github.io/org/", "org:"],
    ["https://ragavsathish.github.io/project/", "project:"],
    ["https://ragavsathish.github.io/role/", "role:"],
    ["https://ragavsathish.github.io/value/", "value:"],
    ["https://ragavsathish.github.io/practice/", "practice:"],
    ["https://ragavsathish.github.io/skill/", "skill:"],
    ["https://ragavsathish.github.io/domain/", "domain:"],
    ["https://ragavsathish.github.io/product/", "product:"],
    ["https://ragavsathish.github.io/resource/", "resource:"]
  ];

  for (const [iri, prefix] of prefixes) {
    if (value.startsWith(iri)) return `${prefix}${value.slice(iri.length)}`;
  }
  return value;
}
