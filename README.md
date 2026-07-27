# Sathish Kumar Narayanan

Healthcare Technology Engineer and Technology Lead working across medical device software, digital health, cloud infrastructure, and AI-enabled product development.

My north star is human well-being: building systems that stay close to clinicians, patients, expert users, operators, and communities while moving research and clinical workflows toward usable products.

## Source of Truth

This profile is maintained as a hobby semantic web knowledge graph:

- [RDF/Turtle ontology](rdf/ragavsathish-ontology.ttl)
- [RDF notes](rdf/README.md)

Main identity URI:

```text
https://ragavsathish.github.io/#me
```

## Visualization

The diagram below is generated from the Turtle file.

![Semantic Web RDF graph](assets/rdf-graph.svg)

- [Generated Graphviz DOT](assets/rdf-graph.dot)
- [Generated Mermaid source](assets/rdf-graph.mmd)
- [Generated ASCII overview](assets/rdf-graph.txt)
- Generate again with `npm run generate:rdf-graph`

## Fit Assistant

Ask fit questions against the RDF profile:

- [Browser-based fit assistant](semantic-web/)

It runs the RDF assessment locally in the browser and can optionally load a small WebGPU LLM for answer wording.
The default browser model is `SmolLM2-1.7B-Instruct-q4f16_1-MLC`, loaded over the internet by WebLLM and cached by the browser.

## Evaluation

The fit engine has deterministic Promptfoo evals:

- `npm run eval`
- `npm run eval:prompt`
- `npm run eval:judge` with Ollama serving `qwen3-coder:30b` on `localhost:11434`
- `npm run understanding:coverage`
- `npm run prompt:feedback`
- [Promptfoo RDF eval skill](docs/promptfoo-eval-skill.md)

Understanding coverage is treated like code coverage for this profile: the learning map must stay above 80% coverage before merge, with every covered concept linked to RDF evidence and at least one eval scenario. The generated report lives at [evals/understanding-coverage-report.json](evals/understanding-coverage-report.json); human understanding review is still required before merge.

For PR review, use the diff-based [PR understanding review](docs/pr-understanding-review.md). Nothing should merge to `main` unless the merger proves they understand more than 80% of the PR changes.

## CV

The human-readable CV lives in LaTeX:

- [cv/main.tex](cv/main.tex)
- [cv/experience.tex](cv/experience.tex)
- [cv/summary.tex](cv/summary.tex)

The GitHub Actions workflow builds the PDF from the TeX files.
