export const llmSystemPrompt = [
  "You are the wording layer for a deterministic RDF fit assessment.",
  "The RDF engine has already decided the fit, evidence, gaps, and positioning.",
  "Use only the provided RDF-derived facts.",
  "Do not add roles, companies, dates, credentials, recommendations, training needs, or new gaps.",
  "Return only the requested lines, with no markdown, preface, or extra explanation.",
  "Copy required lines exactly when the prompt says copy exactly.",
  "Keep the Why line short and use only exact evidence labels from the prompt.",
  "If evidence is missing, say the RDF does not show it."
].join(" ");

export function buildLlmUserPrompt(question, result) {
  const groundedDraft = buildGroundedLlmDraft(result);

  if (result.kind === "fact") {
    return `Question: ${question}

RDF-derived facts:
Answer: ${result.answer}
Evidence: ${result.evidence.join("; ")}

Return only these RDF-grounded lines. Copy them exactly:
${groundedDraft}`;
  }

  return `Question: ${question}

RDF-derived facts:
Fit label: ${result.fit} fit
Score: ${result.score}/100
Target: ${result.target}
Evidence: ${result.evidence.join("; ")}
Gaps: ${result.gaps.join("; ")}
Positioning: ${result.positioning}

Return only these RDF-grounded lines. Copy them exactly:
${groundedDraft}`;
}

export function buildGroundedLlmDraft(result) {
  if (result.kind === "fact") {
    return [
      `Answer: ${result.answer}`,
      `Evidence: ${result.evidence.join(" | ")}`
    ].join("\n");
  }

  const why = result.evidence.length
    ? `${result.evidence.slice(0, 3).join("; ")}.`
    : "The RDF does not show target-specific evidence.";

  return [
    `Fit: ${result.fit} fit`,
    `Why: ${why}`,
    `Gaps: ${result.gaps.join(" | ")}`,
    `Positioning: ${result.positioning}`
  ].join("\n");
}

export function isGroundedLlmText(text, result) {
  if (!text) return false;
  if (hasPromptEcho(text)) return false;
  if (result.kind === "fact") {
    if (!text.includes(result.answer)) return false;
    if (!result.evidence.every((item) => text.includes(item))) return false;
    return !hasInventedClaim(text);
  }
  if (!text.includes(`${result.fit} fit`)) return false;
  if (!result.gaps.every((gap) => text.includes(gap))) return false;
  if (!text.includes(result.positioning)) return false;
  if (hasInventedClaim(text)) return false;
  return true;
}

function hasInventedClaim(text) {
  const normalized = text.toLowerCase();
  return [
    "phd",
    "doctorate",
    "fda approval",
    "fda-approved"
  ].some((claim) => normalized.includes(claim));
}

function hasPromptEcho(text) {
  const normalized = text.toLowerCase();
  return [
    "rdf-derived facts:",
    "return exactly this structure",
    "return only these rdf-grounded lines",
    "one sentence using only the evidence list above",
    "one short sentence using only exact evidence labels"
  ].some((claim) => normalized.includes(claim));
}
