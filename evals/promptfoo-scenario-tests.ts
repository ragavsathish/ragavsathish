import { readFileSync } from "node:fs";

type Coverage = "feedback" | "fit" | "prompt" | "judge" | "browser";
type Mode = "obedient" | "drift" | "hallucination-trap";
type Assertion = {
  type: "javascript" | "contains" | "not-contains" | "llm-rubric";
  value: string;
  threshold?: number;
};
type PromptfooTest = {
  description: string;
  vars: {
    question: string;
    mode?: Mode;
  };
  assert: Assertion[];
};
type Scenario = {
  id: string;
  question: string;
  mode: Mode;
  category: string;
  coverage: Coverage[];
  expectedFit?: string;
  expectedGrounded?: boolean;
  expectedKind?: "fact";
  expectedAnswer?: string;
  purpose: string;
};

const scenarios = JSON.parse(readFileSync("evals/rdf-fit-scenarios.json", "utf8")) as Scenario[];

const fitTargets: Record<string, string> = {
  "medtech-founder": "MedTech founder / biodesign program",
  "health-ai-lead": "Health AI product / technology lead",
  "halla-mission-fit": "Health AI product / technology lead",
  "halla-on-device-rag": "Health AI product / technology lead",
  "cloud-architect": "Cloud platform / regulated infrastructure architect",
  "domain-driven-architecture": "Domain-driven architecture / C4 modeling",
  "pure-clinical": "Pure clinical / licensed care delivery",
  "frontend-brand-design": "Frontend brand / visual design specialist"
};

const fitEvidence: Record<string, string[]> = {
  "medtech-founder": ["domain:MedicalDeviceSoftware", "role:ScopeImpactTechnologyLead"],
  "health-ai-lead": ["domain:AIEnabledHealthcare", "project:HallaHealth"],
  "halla-mission-fit": [":LifeSavingHealthcareAccess", ":CommunitySelfCare", ":HealthDataDiversity", ":SecureHealthWallet"],
  "halla-on-device-rag": [":HealthChatbotGuardrails", ":OnDeviceRetrieval", "skill:ToolCalling", "skill:SQLite"],
  "cloud-architect": ["skill:AWS", "skill:Terraform"],
  "domain-driven-architecture": ["domain:SoftwareArchitecture", "domain:DomainDrivenDesign", "project:DomainDrivenArchitectureLearning", "skill:C4Model", "resource:UpskillingYourTeamInDDD", "resource:EffectiveTestAutomationForDevelopers"],
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

export function generateFitTests(): PromptfooTest[] {
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

export function generatePromptTests(): PromptfooTest[] {
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

export function generateJudgeTests(): PromptfooTest[] {
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

function covered(name: Coverage): Scenario[] {
  return scenarios.filter((scenario) => scenario.coverage.includes(name));
}

function fitLabel(scenario: Scenario): string {
  if (!scenario.expectedFit) throw new Error(`${scenario.id} is missing expectedFit`);
  return scenario.expectedFit.replace(" fit", "");
}

function expectedGrounded(scenario: Scenario): "true" | "false" {
  return scenario.expectedGrounded === false ? "false" : "true";
}

function promptContainsAssertions(scenario: Scenario): Assertion[] {
  if (scenario.expectedGrounded === false) {
    return containsAssertions([scenario.question.includes("PhD") ? "PhD and FDA approvals" : driftMarker(scenario)]);
  }
  if (scenario.expectedKind === "fact") {
    if (!scenario.expectedAnswer) throw new Error(`${scenario.id} is missing expectedAnswer`);
    return containsAssertions(["Answer:", scenario.expectedAnswer]);
  }
  if (!scenario.expectedFit) throw new Error(`${scenario.id} is missing expectedFit`);
  return containsAssertions([`Fit: ${scenario.expectedFit}`, ...promptMarkers(scenario)]);
}

function promptMarkers(scenario: Scenario): string[] {
  const markers: Record<string, string[]> = {
    "medtech-founder": [
      "Make commercial ownership and founder-level accountability explicit.",
      "Research-to-product healthcare technologist with regulated medical software, digital health, and clinical workflow exposure."
    ],
    "frontend-brand-design": ["Better fit for product engineering than pure brand or visual design."],
    "startup-cto": ["Make commercial ownership and founder-level accountability explicit."],
    "clinical-doctor": ["The RDF does not show a clinical license or direct care-delivery role."],
    "current-megin": ["The RDF does not show enough target-specific evidence for this question."],
    "rdf-proof-medtech": ["Medical Device Software", "Regulated Healthcare"],
    "halla-mission-fit": ["Life-saving Healthcare Access", "Health Data Diversity"],
    "halla-on-device-rag": ["Health Chatbot Guardrails", "On-device Retrieval"],
    "domain-driven-architecture": ["Keep DDD and C4 framed as active learning", "Healthcare software architect learning to communicate domain boundaries", "Upskilling your Team in DDD", "Effective Test Automation for Developers"],
    "medtech-vs-brand": ["Research-to-product healthcare technologist"],
    "hardware-electronics": ["The RDF does not show enough target-specific evidence for this question."]
  };
  return markers[scenario.id] || [];
}

function driftMarker(scenario: Scenario): string {
  return scenario.id === "pure-clinical" ? "invented extra qualifications" : "Add more AI credentials and commercial training.";
}

function notContainsForFit(scenario: Scenario): string[] {
  if (fitLabel(scenario) === "Strong") return ['"fit": "Weak"'];
  if (scenario.id === "frontend-brand-design") return ['"target": "MedTech founder / biodesign program"'];
  return ['"fit": "Strong"'];
}

function containsAssertions(values: string[]): Assertion[] {
  return values.map((value) => ({ type: "contains", value }));
}

function notContainsAssertions(values: string[]): Assertion[] {
  return values.map((value) => ({ type: "not-contains", value }));
}
