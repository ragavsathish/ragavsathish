import fs from "node:fs";
import { assessFit } from "../semantic-web/fit-engine.js";
import { buildLlmUserPrompt, isGroundedLlmText, llmSystemPrompt } from "../semantic-web/llm-prompt.js";
import { loadFacts } from "../evals/rdf-utils.mjs";

const scenarios = JSON.parse(fs.readFileSync("evals/rdf-fit-scenarios.json", "utf8"));
const cases = scenarios.map((scenario) => scenario.question);

const promptVariants = [
  {
    id: "current",
    system: llmSystemPrompt,
    buildUser: buildLlmUserPrompt
  },
  {
    id: "loose",
    system: "Write a helpful career-fit answer from these facts.",
    buildUser: (question, result) => `Question: ${question}\nFacts: ${JSON.stringify(result)}`
  },
  {
    id: "strict-copy",
    system: `${llmSystemPrompt} This is a copy-edit task, not a reasoning task.`,
    buildUser: buildLlmUserPrompt
  }
];

const facts = loadFacts();
const results = promptVariants.map(scoreVariant);
const best = results.toSorted((a, b) => b.score - a.score)[0];

fs.writeFileSync("evals/prompt-feedback-report.json", JSON.stringify({ best: best.id, results }, null, 2));
console.log(JSON.stringify({ best: best.id, score: best.score, results }, null, 2));

function scoreVariant(variant) {
  let score = 0;
  const details = [];

  for (const question of cases) {
    const result = assessFit(question, facts);
    const obedient = obedientDraft(result);
    const drift = driftedDraft(result);
    const hallucinated = hallucinatedDraft(result);
    const obedientGrounded = isGroundedLlmText(obedient, result);
    const driftGrounded = isGroundedLlmText(drift, result);
    const hallucinationRejected = !isGroundedLlmText(hallucinated, result);
    const promptIncludesRdf = variant.system.includes("RDF") && variant.buildUser(question, result).includes("RDF-derived facts");
    const userPrompt = variant.buildUser(question, result);
    const promptCopiesGrounding = result.kind === "fact"
      ? userPrompt.includes(result.answer) && result.evidence.every((item) => userPrompt.includes(item))
      : userPrompt.includes(result.positioning) && result.gaps.every((gap) => userPrompt.includes(gap));

    if (obedientGrounded) score += 2;
    if (!driftGrounded) score += 2;
    if (hallucinationRejected) score += 2;
    if (promptIncludesRdf) score += 1;
    if (promptCopiesGrounding) score += 1;

    details.push({
      question,
      fit: result.fit,
      promptIncludesRdf,
      promptCopiesGrounding,
      obedientGrounded,
      driftRejected: !driftGrounded,
      hallucinationRejected
    });
  }

  return {
    id: variant.id,
    score,
    maxScore: cases.length * 8,
    details
  };
}

function obedientDraft(result) {
  if (result.kind === "fact") {
    return [
      `Answer: ${result.answer}`,
      `Evidence: ${result.evidence.join(" | ")}`
    ].join("\n");
  }

  const why = result.evidence.length
    ? result.evidence.slice(0, 3).join("; ")
    : "The RDF does not show target-specific evidence";

  return [
    `Fit: ${result.fit} fit`,
    `Why: ${why}.`,
    `Gaps: ${result.gaps.join(" | ")}`,
    `Positioning: ${result.positioning}`
  ].join("\n");
}

function driftedDraft(result) {
  return [
    `Fit: ${result.fit === "Weak" ? "Strong" : result.fit} fit`,
    "Why: invented credentials and general leadership training.",
    "Gaps: add unrelated certification.",
    "Positioning: invented positioning."
  ].join("\n");
}

function hallucinatedDraft(result) {
  const baseEvidence = result.evidence.length
    ? result.evidence.slice(0, 2).join("; ")
    : "The RDF does not show target-specific evidence";

  return [
    `Fit: ${result.fit} fit`,
    `Why: ${baseEvidence} plus a PhD and FDA approvals.`,
    `Gaps: ${result.gaps.join(" | ")}`,
    `Positioning: ${result.positioning}`
  ].join("\n");
}
