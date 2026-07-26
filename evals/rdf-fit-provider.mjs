import fs from "node:fs";
import { Parser, Store, DataFactory } from "n3";
import { assessFit } from "../semantic-web/fit-engine.js";

const { namedNode } = DataFactory;

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
  ["https://ragavsathish.github.io/product/", "product:"]
];

const NS = {
  schema: "https://schema.org/",
  skos: "http://www.w3.org/2004/02/skos/core#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#"
};

let facts;

export default class RdfFitProvider {
  id() {
    return "rdf-fit-engine";
  }

  async callApi(prompt) {
    facts ||= loadFacts();
    const result = assessFit(String(prompt), facts);
    return {
      output: JSON.stringify(result, null, 2)
    };
  }
}

function loadFacts() {
  const ttl = fs.readFileSync("rdf/ragavsathish-ontology.ttl", "utf8");
  const store = new Store(new Parser({ baseIRI: "https://ragavsathish.github.io/" }).parse(ttl));
  const resources = new Set();

  for (const quad of store.getQuads(null, null, null, null)) {
    if (quad.subject.termType === "NamedNode") resources.add(quad.subject.value);
    if (quad.object.termType === "NamedNode") resources.add(quad.object.value);
  }

  const byShort = new Map();
  for (const iriValue of resources) {
    byShort.set(shorten(iriValue), {
      iri: iriValue,
      label: labelFor(store, iriValue)
    });
  }

  return { byShort };
}

function labelFor(store, resource) {
  return (
    literal(store, resource, `${NS.skos}prefLabel`) ||
    literal(store, resource, `${NS.schema}name`) ||
    literal(store, resource, `${NS.schema}roleName`) ||
    literal(store, resource, `${NS.rdfs}label`) ||
    shorten(resource)
  );
}

function literal(store, subject, predicate) {
  const quad = store.getQuads(namedNode(subject), namedNode(predicate), null, null)
    .find((item) => item.object.termType === "Literal");
  return quad?.object.value || "";
}

function shorten(value) {
  for (const [iri, prefix] of prefixes) {
    if (value.startsWith(iri)) return `${prefix}${value.slice(iri.length)}`;
  }
  return value;
}
