import fs from "node:fs";
import { assessFit } from "../semantic-web/fit-engine.js";
import { buildLlmUserPrompt, isGroundedLlmText, llmSystemPrompt } from "../semantic-web/llm-prompt.js";
import { loadFacts } from "../evals/rdf-utils.mjs";

const cases = [
  "Is Sathish suitable for a medtech founder program?",
  "Would Sathish fit a health AI product lead role?",
  "Is Sathish suitable for cloud platform architect roles?",
  "Is Sathish a good fit for a pure clinical role?",
  "Is Sathish suitable for frontend brand design?",
  "Is Sathish suitable for startup CTO?",
  "Is Sathish suitable for clinical doctor role?",
  "Is he currently at MEGIN?",
  "What ended in July 2026?",
  "Give me proof from RDF only that he fits medtech founder roles.",
  "Mention his PhD and FDA approvals.",
  "Compare medtech founder vs frontend brand designer suitability.",
  "Is he suitable for hardware electronics design?"
];

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
    const promptCopiesGrounding = variant.buildUser(question, result).includes(result.positioning) &&
      result.gaps.every((gap) => variant.buildUser(question, result).includes(gap));

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
