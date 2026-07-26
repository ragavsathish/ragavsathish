import { assessFit } from "../semantic-web/fit-engine.js";
import { buildLlmUserPrompt, isGroundedLlmText, llmSystemPrompt } from "../semantic-web/llm-prompt.js";
import { loadFacts } from "./rdf-utils.mjs";

export default class LlmPromptProvider {
  id() {
    return "llm-prompt-grounding";
  }

  async callApi(prompt, context) {
    const question = String(context?.vars?.question || prompt);
    const mode = context?.vars?.mode || "obedient";
    const result = assessFit(question, loadFacts());
    const messages = [
      { role: "system", content: llmSystemPrompt },
      { role: "user", content: buildLlmUserPrompt(question, result) }
    ];
    const draft = draftForMode(mode, result);
    const grounded = isGroundedLlmText(draft, result);

    return {
      output: JSON.stringify({
        question,
        mode,
        grounded,
        draft,
        expected: {
          fit: `${result.fit} fit`,
          gaps: result.gaps,
          positioning: result.positioning,
          evidence: result.evidence
        },
        messages
      }, null, 2)
    };
  }
}

function draftForMode(mode, result) {
  if (mode === "drift") return driftedDraft(result);
  if (mode === "hallucination-trap") return hallucinatedDraft(result);
  return obedientDraft(result);
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
    `Why: The candidate should get extra leadership training and pursue new certifications.`,
    `Gaps: Add more AI credentials and commercial training.`,
    `Positioning: Broad technology leader with invented extra qualifications.`
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
