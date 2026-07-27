# PR Understanding Review

This document is generated from the PR diff against `origin/main`.

Merge rule: nothing should be merged to `main` unless the merger proves they understand more than 80% of the PR changes. For this 12-question review, that means at least 10 correct answers, plus a short written explanation of the changed system.

## Diff Shape

Compared with `origin/main`, this PR changes 35 files and adds the semantic web profile stack:

- RDF source of truth: `rdf/ragavsathish-ontology.ttl`, `rdf/README.md`
- Generated RDF views: `assets/rdf-graph.svg`, `assets/rdf-graph.dot`, `assets/rdf-graph.mmd`, `assets/rdf-graph.txt`
- Human-readable profile: `README.md`, `cv/*.tex`
- Browser fit assistant: `semantic-web/*`
- Deterministic and LLM evals: `evals/*`, `docs/promptfoo-eval-skill.md`
- Build/test tooling: `package.json`, `package-lock.json`, `playwright.config.mjs`, `tests/*`, `scripts/*`

## What Changed

1. The profile facts moved into RDF/Turtle as the source of truth.
2. The README became a thin entry point that links to RDF, generated visualizations, CV, the fit assistant, and eval commands.
3. The CV timeline was corrected from the LinkedIn screenshot: MEGIN ends October 2025 and Scope Impact starts November 2025.
4. A browser-based semantic web fit assistant was added under `semantic-web/`.
5. The assistant evaluates fit deterministically from RDF evidence and gaps before any LLM wording is allowed.
6. Browser LLM support was added as optional wording: WebLLM WebGPU first, Transformers.js WebGPU fallback, Transformers.js WASM CPU fallback.
7. LLM output is guarded: unsupported facts such as PhD/FDA approval claims are rejected.
8. Promptfoo evals were added for deterministic fit, prompt behavior, and optional local LLM judge scoring.
9. Scenario data was centralized in `evals/rdf-fit-scenarios.json`.
10. Prompt feedback loop tooling compares prompt variants and prefers the RDF-grounded prompt.
11. RDF graph generation creates SVG, DOT, Mermaid, and ASCII views from the Turtle file.
12. Understanding coverage was added as a merge gate: mapped understanding areas must link to RDF evidence and eval scenarios, and current coverage is 100%.

## Why It Changed

The purpose of the PR is to make profile claims inspectable, queryable, and testable. RDF is the fact layer, generated assets are views, the browser assistant is an interface, and Promptfoo/Playwright are validation layers.

The important design choice is that LLMs do not become the source of truth. They can phrase answers, but deterministic RDF logic decides evidence, gaps, and whether an answer is grounded.

## Validation Map

- `npm run generate:rdf-graph`: proves generated graph artifacts come from RDF.
- `npm run check:app`: checks browser assistant JavaScript and required files.
- `npm run understanding:coverage`: checks understanding areas against RDF evidence and eval scenarios.
- `npm run prompt:feedback`: checks prompt variants against scenario behavior.
- `npm run eval`: runs deterministic Promptfoo fit evals.
- `npm run eval:prompt`: runs prompt behavior evals.
- `npm run eval:judge`: optionally runs local LLM judge evals through Ollama.
- `npm run test:e2e`: runs Playwright browser tests, including LLM fallback behavior with deterministic stubs.
- `RUN_REAL_LLM=1 npm run test:e2e:real`: opt-in real browser LLM test.

## Understanding Ladder

Answer these in a PR comment before merging. Passing requires at least 10 of 12 correct.

### History

1. What problem was this PR solving for the profile: duplicated human-readable facts, unverifiable LLM answers, weak visualization, incorrect timeline, or all of these?
2. What user-provided history changed the profile timeline, and what are the corrected MEGIN and Scope Impact dates?

### Specification

3. Which specs/formats does the source-of-truth layer use, and what role do RDF, RDFS-style vocabulary, Turtle, Schema.org, FOAF, and SKOS play here?
4. Which browser/runtime standards or libraries are relied on for local LLM execution, and why are WebGPU, WebAssembly/WASM, WebLLM, and Transformers.js separate concerns?

### Architecture

5. Why is the project split into RDF facts, generated graph assets, browser assistant modules, eval providers, Promptfoo configs, Playwright tests, and README/CV surfaces?
6. Why is RDF deterministic assessment kept authoritative while browser/local LLMs are only allowed to rewrite or judge under guardrails?

### Data Structures

7. Why is the profile represented as triples/quads instead of prose-only README text, and what does that make easier to query or validate?
8. Why is `evals/rdf-fit-scenarios.json` a scenario catalog instead of repeating scenarios directly across Promptfoo YAML, prompt feedback, and tests?

### Algorithms

9. How does the fit engine turn a user question into a strong/weak/answered result using RDF evidence, gaps, date facts, and unsupported-claim handling?
10. How does the browser LLM loading path choose between WebLLM WebGPU, Transformers.js WebGPU, and Transformers.js WASM CPU fallback?

### Trade-offs

11. Why keep generated SVG/DOT/Mermaid/ASCII graph files in the repo instead of requiring every reader to regenerate them locally?
12. What does `npm run understanding:coverage` prove, what does it not prove, and why does the merger still need to explain more than 80% of the PR changes before merging to `main`?

## Passing Evidence

The merger should leave a PR comment with:

- Score: `__/12`
- One paragraph explaining the architecture in their own words.
- Any misunderstood area and the follow-up they used to close the gap.
- Confirmation that the final score is strictly above 80%.
