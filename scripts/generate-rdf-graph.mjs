import fs from "node:fs";
import path from "node:path";
import { Parser } from "n3";
import { digraph, toDot } from "ts-graphviz";
import { Graphviz } from "@hpcc-js/wasm/graphviz";

const root = process.cwd();
const ttlPath = path.join(root, "rdf", "ragavsathish-ontology.ttl");
const assetsDir = path.join(root, "assets");
const dotPath = path.join(assetsDir, "rdf-graph.dot");
const mmdPath = path.join(assetsDir, "rdf-graph.mmd");
const svgPath = path.join(assetsDir, "rdf-graph.svg");

const ttl = fs.readFileSync(ttlPath, "utf8");
const quads = new Parser({ format: "text/turtle" }).parse(ttl);

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
  ["https://schema.org/", "schema:"],
  ["http://www.w3.org/1999/02/22-rdf-syntax-ns#", "rdf:"],
  ["http://www.w3.org/2000/01/rdf-schema#", "rdfs:"],
  ["http://www.w3.org/2002/07/owl#", "owl:"],
  ["http://www.w3.org/2004/02/skos/core#", "skos:"],
  ["http://purl.org/dc/terms/", "dcterms:"]
];

const rdfType = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const labelPredicates = new Set([
  "https://schema.org/name",
  "https://schema.org/roleName",
  "http://www.w3.org/2004/02/skos/core#prefLabel",
  "http://www.w3.org/2000/01/rdf-schema#label",
  "http://purl.org/dc/terms/title"
]);

const focusPredicates = new Set([
  rdfType,
  "http://purl.org/dc/terms/creator",
  "https://schema.org/mainEntity",
  "https://schema.org/about",
  "http://www.w3.org/2000/01/rdf-schema#seeAlso",
  "https://ragavsathish.github.io/ontology#hasPurpose",
  "https://ragavsathish.github.io/ontology#guidedBy",
  "https://ragavsathish.github.io/ontology#practices",
  "https://ragavsathish.github.io/ontology#developsThrough",
  "https://ragavsathish.github.io/ontology#seeksToReduce",
  "https://ragavsathish.github.io/ontology#workedOn",
  "https://ragavsathish.github.io/ontology#hasCareerRole",
  "https://ragavsathish.github.io/ontology#atOrganization",
  "https://ragavsathish.github.io/ontology#builtWith",
  "https://ragavsathish.github.io/ontology#inDomain",
  "https://ragavsathish.github.io/ontology#translates",
  "https://ragavsathish.github.io/ontology#accelerates",
  "https://ragavsathish.github.io/ontology#requires",
  "https://ragavsathish.github.io/ontology#contributesTo",
  "https://ragavsathish.github.io/ontology#expresses"
]);

const kindByType = new Map([
  ["https://ragavsathish.github.io/ontology#Purpose", "Purpose"],
  ["https://ragavsathish.github.io/ontology#Value", "Value"],
  ["https://ragavsathish.github.io/ontology#Practice", "Practice"],
  ["https://ragavsathish.github.io/ontology#CareerRole", "Role"],
  ["https://ragavsathish.github.io/ontology#Project", "Project"],
  ["https://ragavsathish.github.io/ontology#Technology", "Technology"],
  ["https://ragavsathish.github.io/ontology#Domain", "Domain"],
  ["https://ragavsathish.github.io/ontology#Product", "Product"],
  ["https://schema.org/Organization", "Organization"],
  ["https://schema.org/CollegeOrUniversity", "Organization"],
  ["https://schema.org/Person", "Person"],
  ["http://xmlns.com/foaf/0.1/Person", "Person"],
  ["http://www.w3.org/2002/07/owl#Ontology", "Ontology"],
  ["http://www.w3.org/2000/01/rdf-schema#Class", "Vocabulary"],
  ["http://www.w3.org/1999/02/22-rdf-syntax-ns#Property", "Vocabulary"]
]);

const colorByKind = {
  Ontology: "#4c1d95",
  Person: "#0f766e",
  Purpose: "#166534",
  Value: "#15803d",
  Practice: "#047857",
  Role: "#1d4ed8",
  Organization: "#0369a1",
  Project: "#7c2d12",
  Product: "#92400e",
  Domain: "#334155",
  Technology: "#4338ca",
  Vocabulary: "#6b7280",
  Resource: "#374151"
};

function shorten(value) {
  for (const [iri, prefix] of prefixes) {
    if (value.startsWith(iri)) return `${prefix}${value.slice(iri.length)}`;
  }
  if (value.startsWith("https://ragavsathish.github.io/")) {
    return value.replace("https://ragavsathish.github.io/", "");
  }
  return value.replace(/^https?:\/\//, "");
}

function localName(value) {
  const short = shorten(value);
  return short.includes(":") ? short.split(":").at(-1) : short.split("/").at(-1);
}

function mermaidText(value) {
  return String(value).replaceAll('"', "'").replaceAll("\n", " ");
}

const labels = new Map();
const types = new Map();

for (const q of quads) {
  if (labelPredicates.has(q.predicate.value) && q.object.termType === "Literal") {
    labels.set(q.subject.value, q.object.value);
  }
  if (q.predicate.value === rdfType && q.object.termType === "NamedNode") {
    if (!types.has(q.subject.value)) types.set(q.subject.value, []);
    types.get(q.subject.value).push(q.object.value);
  }
}

function nodeKind(iri) {
  const typeList = types.get(iri) || [];
  for (const type of typeList) {
    if (kindByType.has(type)) return kindByType.get(type);
  }
  if (iri.includes("/role/")) return "Role";
  if (iri.includes("/project/")) return "Project";
  if (iri.includes("/org/")) return "Organization";
  if (iri.includes("/value/")) return "Value";
  if (iri.includes("/practice/")) return "Practice";
  if (iri.includes("/domain/")) return "Domain";
  if (iri.includes("/skill/")) return "Technology";
  return "Resource";
}

function nodeLabel(iri) {
  const label = labels.get(iri) || localName(iri);
  return `${nodeKind(iri)}\\n${label}\\n${shorten(iri)}`;
}

const selectedEdges = [];
const selectedNodes = new Set();

for (const q of quads) {
  if (q.subject.termType !== "NamedNode" || q.object.termType !== "NamedNode") continue;
  if (!focusPredicates.has(q.predicate.value)) continue;
  selectedEdges.push({
    from: q.subject.value,
    to: q.object.value,
    predicate: q.predicate.value
  });
  selectedNodes.add(q.subject.value);
  selectedNodes.add(q.object.value);
}

const nodes = [...selectedNodes].sort((a, b) => shorten(a).localeCompare(shorten(b)));
const nodeIds = new Map(nodes.map((iri, index) => [iri, `n${index}`]));

function makeMermaid() {
  const lines = [
    "graph TD",
    "    %% Generated from rdf/ragavsathish-ontology.ttl. Do not edit by hand."
  ];

  for (const iri of nodes) {
    lines.push(`    ${nodeIds.get(iri)}["${mermaidText(nodeLabel(iri)).replaceAll("\\n", "<br/>")}"]`);
  }

  for (const edge of selectedEdges) {
    lines.push(`    ${nodeIds.get(edge.from)} -->|"${shorten(edge.predicate)}"| ${nodeIds.get(edge.to)}`);
  }

  return `${lines.join("\n")}\n`;
}

function makeDot() {
  const graph = digraph("RagavSathishRdfGraph", (g) => {
    g.set("rankdir", "LR");
    g.set("splines", "curved");
    g.set("overlap", "false");
    g.set("bgcolor", "white");
    g.node({ shape: "box", style: "rounded,filled", fontname: "Helvetica", fontsize: 10 });
    g.edge({ color: "#94a3b8", fontname: "Helvetica", fontsize: 8, arrowsize: 0.7 });

    for (const iri of nodes) {
      const kind = nodeKind(iri);
      g.node(nodeIds.get(iri), {
        label: nodeLabel(iri),
        fillcolor: "#ffffff",
        color: colorByKind[kind] || "#374151",
        penwidth: 1.5,
        fontcolor: "#0f172a"
      });
    }

    for (const edge of selectedEdges) {
      g.edge([nodeIds.get(edge.from), nodeIds.get(edge.to)], {
        label: shorten(edge.predicate),
        color: "#94a3b8",
        fontcolor: "#475569"
      });
    }
  });

  return toDot(graph);
}

fs.mkdirSync(assetsDir, { recursive: true });

const dot = makeDot();
const graphviz = await Graphviz.load();
const svg = graphviz.dot(dot);

fs.writeFileSync(mmdPath, makeMermaid());
fs.writeFileSync(dotPath, dot);
fs.writeFileSync(svgPath, svg);

console.log(`Wrote ${path.relative(root, mmdPath)}`);
console.log(`Wrote ${path.relative(root, dotPath)}`);
console.log(`Wrote ${path.relative(root, svgPath)}`);
console.log(`Nodes ${nodes.length}, edges ${selectedEdges.length}`);
