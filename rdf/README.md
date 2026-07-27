# RDF / Semantic Web

Canonical source of truth:

- `ragavsathish-ontology.ttl`

Suggested public URL after publishing to GitHub Pages:

```text
https://ragavsathish.github.io/rdf/ragavsathish-ontology.ttl
```

Suggested HTML link tag:

```html
<link rel="alternate" type="text/turtle" href="/rdf/ragavsathish-ontology.ttl">
```

Main identity URI:

```text
https://ragavsathish.github.io/#me
```

The ontology contains both:

- RDFS vocabulary: classes and properties such as `:Purpose`, `:Value`, `:Practice`, `:CareerRole`, `:Project`, `:hasPurpose`, `:guidedBy`, and `:workedOn`.
- Knowledge graph instances: Sathish, human well-being, dance, meditation, medtech product translation, MEGIN, Scope Impact, Halla Health, Signant Health, Aalto research, projects, technologies, and career roles.

Generated visualization artifacts:

- `../assets/rdf-graph.svg`
- `../assets/rdf-graph.dot`
- `../assets/rdf-graph.mmd`

Regenerate them from Turtle with:

```text
npm run generate:rdf-graph
```

The generator parses Turtle with `n3`, builds DOT with `ts-graphviz`, and renders SVG with Graphviz via `@hpcc-js/wasm`.
