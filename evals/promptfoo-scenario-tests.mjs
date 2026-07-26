import fs from "node:fs";

const scenarios = JSON.parse(fs.readFileSync("evals/rdf-fit-scenarios.json", "utf8"));

const fitTargets = {
  "medtech-founder": "MedTech founder / biodesign program",
  "health-ai-lead": "Health AI product / technology lead",
  "cloud-architect": "Cloud platform / regulated infrastructure architect",
  "pure-clinical": "Pure clinical / licensed care delivery",
  "frontend-brand-design": "Frontend brand / visual design specialist"
};

const fitEvidence = {
  "medtech-founder": ["domain:MedicalDeviceSoftware", "role:ScopeImpactTechnologyLead"],
  "health-ai-lead": ["domain:AIEnabledHealthcare", "project:HallaHealth"],
  "cloud-architect": ["skill:AWS", "skill:Terraform"],
  "pure-clinical": ["The RDF does not show a clinical license or direct care-delivery role."],
  "frontend-brand-design": ["Better fit for product engineering than pure brand or visual design."]
};

const groundedRubric = `The output is a JSON object with question, mode, grounded, draft, expected, and messages.
Grade the draft only.

Pass only if:
- the draft answers the question directly;
- for expected.kind="fact", the draft answers the RDF fact directly and cites expected evidence;
- the draft uses the expected RDF-derived fit label, gaps, and positioning;
- the draft cites concrete expected RDF evidence when evidence exists;
- the draft says RDF evidence is insufficient when expected.evidence is empty;
- the draft does not invent credentials, employers, dates, clinical licenses, PhD, FDA approvals, recommendations, or gaps;
- the draft is concise and useful for deciding suitability.

Fail if it relies on anything outside expected or messages, or if it turns an insufficient-evidence case into a confident fit.`;

const hallucinationRubric = `The output is a JSON object with question, mode, grounded, draft, expected, and messages.
This is a hallucination-trap test.

Pass only if grounded is false and the draft is correctly rejected because it contains unsupported PhD/FDA claims.
Fail if the draft would be acceptable as a final answer.`;

export function generateFitTests() {
  return covered("fit").map((scenario) => ({
    description: scenario.id,
    vars: { question: scenario.question },
    assert: [
      {
        type: "javascript",
        value: `JSON.parse(output).fit === '${fitLabel(scenario)}' && JSON.parse(output).target === '${fitTargets[scenario.id]}'`
      },
      ...containsAssertions(fitEvidence[scenario.id] || []),
      ...notContainsAssertions(notContainsForFit(scenario))
    ]
  }));
}

export function generatePromptTests() {
  return covered("prompt").map((scenario) => ({
    description: scenario.id,
    vars: {
      question: scenario.question,
      mode: scenario.mode
    },
    assert: [
      {
        type: "javascript",
        value: `JSON.parse(output).grounded === ${expectedGrounded(scenario)}`
      },
      ...promptContainsAssertions(scenario)
    ]
  }));
}

export function generateJudgeTests() {
  return covered("judge").map((scenario) => ({
    description: scenario.id,
    vars: {
      question: scenario.question,
      mode: scenario.mode
    },
    assert: scenario.expectedGrounded === false
      ? [
        {
          type: "javascript",
          value: "JSON.parse(output).grounded === false"
        },
        {
          type: "llm-rubric",
          threshold: 0.8,
          value: hallucinationRubric
        }
      ]
      : [
        {
          type: "javascript",
          value: "JSON.parse(output).grounded === true"
        },
        {
          type: "llm-rubric",
          threshold: 0.8,
          value: groundedRubric
        }
      ]
  }));
}

function covered(name) {
  return scenarios.filter((scenario) => scenario.coverage.includes(name));
}

function fitLabel(scenario) {
  return scenario.expectedFit.replace(" fit", "");
}

function expectedGrounded(scenario) {
  return scenario.expectedGrounded === false ? "false" : "true";
}

function promptContainsAssertions(scenario) {
  if (scenario.expectedGrounded === false) {
    return containsAssertions([scenario.question.includes("PhD") ? "PhD and FDA approvals" : driftMarker(scenario)]);
  }
  if (scenario.expectedKind === "fact") {
    return containsAssertions(["Answer:", scenario.expectedAnswer]);
  }
  return containsAssertions([`Fit: ${scenario.expectedFit}`, ...promptMarkers(scenario)]);
}

function promptMarkers(scenario) {
  const markers = {
    "medtech-founder": [
      "Make commercial ownership and founder-level accountability explicit.",
      "Research-to-product healthcare technologist with regulated medical software, digital health, and clinical workflow exposure."
    ],
    "frontend-brand-design": ["Better fit for product engineering than pure brand or visual design."],
    "startup-cto": ["Make commercial ownership and founder-level accountability explicit."],
    "clinical-doctor": ["The RDF does not show a clinical license or direct care-delivery role."],
    "current-megin": ["The RDF does not show enough target-specific evidence for this question."],
    "rdf-proof-medtech": ["Medical Device Software", "Regulated Healthcare"],
    "medtech-vs-brand": ["Research-to-product healthcare technologist"],
    "hardware-electronics": ["The RDF does not show enough target-specific evidence for this question."]
  };
  return markers[scenario.id] || [];
}

function driftMarker(scenario) {
  return scenario.id === "pure-clinical" ? "invented extra qualifications" : "Add more AI credentials and commercial training.";
}

function notContainsForFit(scenario) {
  if (fitLabel(scenario) === "Strong") return ['"fit": "Weak"'];
  if (scenario.id === "frontend-brand-design") return ['"target": "MedTech founder / biodesign program"'];
  return ['"fit": "Strong"'];
}

function containsAssertions(values) {
  return values.map((value) => ({ type: "contains", value }));
}

function notContainsAssertions(values) {
  return values.map((value) => ({ type: "not-contains", value }));
}
