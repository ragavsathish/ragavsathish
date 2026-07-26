# Promptfoo RDF Eval Skill

Use this workflow when changing the semantic web fit assistant, RDF prompt, or eval scenarios.

## Goal

Keep `rdf/ragavsathish-ontology.ttl` as the source of truth. The deterministic fit engine decides fit, evidence, gaps, and positioning from RDF-derived facts. LLMs may judge or rewrite wording only after those facts are fixed.

## Eval Layers

1. Deterministic fit evals: `npm run eval`
   - Checks role/domain fit behavior from RDF evidence.
   - Use this for scoring changes in `semantic-web/fit-engine.js`.

2. Prompt grounding evals: `npm run eval:prompt`
   - Checks that the shared LLM prompt preserves exact fit labels, gaps, and positioning.
   - Checks hallucination traps such as unsupported PhD or FDA approval claims.

3. Feedback loop: `npm run prompt:feedback`
   - Compares prompt variants across the scenario set.
   - Scores RDF inclusion, exact grounding copy, obedient output, drift rejection, and hallucination rejection.

4. Local LLM judge: `npm run eval:judge`
   - Default grader: `ollama:chat:qwen3-coder:30b`.
   - Requires Ollama running locally on `localhost:11434`.
   - Judges answer quality after deterministic gates: directness, usefulness, RDF faithfulness, insufficient-evidence behavior, and hallucination rejection.

5. Full dry run: `npm run dry`
   - Runs graph generation, syntax checks, feedback, deterministic Promptfoo evals, browser tests, and `git diff --check`.
   - Does not run the LLM judge, so normal validation stays fast and local-runtime independent.

## Adding Scenarios

Add a scenario when it protects one of these behaviors:

- Strong fit where RDF has clear evidence.
- Weak fit where RDF evidence is missing or off-target.
- Ambiguous wording that should not borrow unrelated evidence.
- Date-sensitive questions that must not invent current status.
- Hallucination traps that ask for unsupported credentials, approvals, employers, or recommendations.
- Comparison prompts that should still stay grounded in a single RDF-derived result.

Track the scenario first in `evals/rdf-fit-scenarios.json`. It is the human-readable catalog for reviewed questions, expected behavior, coverage layers, and intent.

Promptfoo tests are generated from the catalog by `evals/promptfoo-scenario-tests.mjs`. Keep the YAML configs thin; they should only point at the generated test set.

Then update assertion coverage where needed:

- `evals/promptfoo-scenario-tests.mjs` for exact deterministic Promptfoo assertions.
- `tests/semantic-web.spec.mjs` for browser-visible regressions.

Add judge coverage in the scenario catalog only for representative cases. Keep that suite small because local judge runs are slower than deterministic evals.

## Rubric Rules

LLM judge rubrics should require:

- exact RDF-derived fit label, gaps, and positioning;
- concrete RDF evidence when evidence exists;
- explicit insufficient-evidence wording when no target-specific RDF evidence exists;
- no invented credentials, employers, dates, clinical licenses, PhD, FDA approvals, recommendations, or gaps;
- concise wording that helps decide suitability.

Do not let an LLM judge override deterministic RDF facts. If the judge dislikes a truthful answer, improve wording or rubric clarity; do not change RDF-derived facts to satisfy the judge.

## Local Judge Override

Use another Promptfoo grader when needed:

```sh
JUDGE_PROVIDER='ollama:chat:alibayram/medgemma:27b' npm run eval:judge
JUDGE_PROVIDER='openai:chat:qwen/qwen2.5-coder-32b' JUDGE_API_BASE_URL='http://localhost:1234/v1' JUDGE_API_KEY='lm-studio' npm run eval:judge
```

Current observed local judge behavior:

- `ollama:chat:qwen3-coder:30b`: passed 5/5, fastest good default.
- `openai:chat:qwen/qwen2.5-coder-32b` via LM Studio: passed 5/5, slower.
- `ollama:chat:alibayram/medgemma:27b`: passed 5/5, much slower.
- `ollama:chat:mistral-nemo:12b`: missed one case.
- `ollama:chat:devstral:24b`: missed one case.
- `openai:chat:qwen/qwen3-vl-8b` via LM Studio: poor text-judge fit for this rubric.
