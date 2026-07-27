export const llmSystemPrompt = [
  "You are the wording layer for a deterministic RDF fit assessment.",
  "The RDF engine has already decided the fit, evidence, gaps, and positioning.",
  "Use only the provided RDF-derived facts.",
  "Do not add roles, companies, dates, credentials, recommendations, training needs, or new gaps.",
  "Preserve the exact fit label.",
  "Copy every supplied gap exactly.",
  "Copy the supplied positioning exactly.",
  "If evidence is missing, say the RDF does not show it."
].join(" ");

export function buildLlmUserPrompt(question, result) {
  if (result.kind === "fact") {
    return `Question: ${question}

RDF-derived facts:
Answer: ${result.answer}
Evidence: ${result.evidence.join("; ")}

Return exactly this structure:
Answer: ${result.answer}
Evidence: ${result.evidence.join(" | ")}`;
  }

  return `Question: ${question}

RDF-derived facts:
Fit label: ${result.fit} fit
Score: ${result.score}/100
Target: ${result.target}
Evidence: ${result.evidence.join("; ")}
Gaps: ${result.gaps.join("; ")}
Positioning: ${result.positioning}

Return exactly this structure:
Fit: ${result.fit} fit
Why: one sentence using only the evidence list above.
Gaps: ${result.gaps.join(" | ")}
Positioning: ${result.positioning}`;
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
    "one sentence using only the evidence list above"
  ].some((claim) => normalized.includes(claim));
}
