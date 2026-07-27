export const fitProfiles = [
  {
    id: "medtech-founder",
    label: "MedTech founder / biodesign program",
    keywords: ["medtech", "medical device", "founder", "biodesign", "clinical innovation", "startup", "fellow"],
    positives: [
      ["domain:MedicalDeviceSoftware", 18],
      ["domain:RegulatedHealthcare", 14],
      ["domain:ClinicalValidation", 12],
      ["domain:PostMarketSurveillance", 9],
      ["project:MEGMapsPlatform", 16],
      ["project:HallaHealth", 14],
      ["role:MeginSeniorSoftwareDeveloperArchitect", 16],
      ["role:ScopeImpactTechnologyLead", 13],
      ["practice:ProductDiscovery", 9],
      [":ResearchToProductTranslation", 12],
      [":HumanInTheLoopValidation", 10],
      ["value:SystemsEmpathy", 8]
    ],
    gaps: [
      "Make commercial ownership and founder-level accountability explicit.",
      "Add concrete clinical discovery stories, not only platform achievements."
    ],
    positioning: "Research-to-product healthcare technologist with regulated medical software, digital health, and clinical workflow exposure."
  },
  {
    id: "health-ai-product",
    label: "Health AI product / technology lead",
    keywords: ["health ai", "ai health", "digital health", "product lead", "technology lead", "healthcare ai", "self-care", "halla", "mission", "community", "home-based care", "health data", "voice ai", "guardrails", "sqlite", "rag"],
    positives: [
      ["domain:AIEnabledHealthcare", 18],
      ["domain:DigitalHealth", 16],
      ["domain:ClimateHealth", 9],
      ["domain:AccessibleHealthcare", 10],
      ["project:HallaHealth", 18],
      ["role:ScopeImpactTechnologyLead", 18],
      [":LifeSavingHealthcareAccess", 12],
      [":CommunitySelfCare", 10],
      [":HomeBasedCareTasks", 9],
      [":SecureHealthWallet", 8],
      [":HealthDataDiversity", 10],
      [":ClimateHealthRiskManagement", 8],
      [":HealthChatbotGuardrails", 10],
      [":OnDeviceRetrieval", 10],
      ["skill:GoogleVertexAI", 8],
      ["skill:VoiceAI", 6],
      ["skill:Promptfoo", 6],
      ["skill:ToolCalling", 7],
      ["skill:SQLite", 7],
      ["skill:OnDeviceRAG", 8],
      ["practice:ProductDiscovery", 10],
      ["value:HumanWellBeing", 8],
      ["value:SystemsEmpathy", 8],
      ["skill:AWS", 6]
    ],
    gaps: [
      "Show measurable product outcomes and adoption signals.",
      "Separate AI product judgment from infrastructure delivery."
    ],
    positioning: "Digital health technical lead who can connect AI-enabled self-care, guardrailed chatbot evaluation, offline-first retrieval, and healthcare access mission."
  },
  {
    id: "domain-driven-architecture",
    label: "Domain-driven architecture / C4 modeling",
    keywords: ["domain driven design", "ddd", "c4", "c4 model", "software architecture", "architecture modeling", "architecture visualisation", "architecture visualization", "structurizr", "microservices", "bounded context", "event storming", "team upskilling", "domain discovery", "test automation", "unit testing", "event driven microservices", "exploratory testing"],
    positives: [
      ["domain:SoftwareArchitecture", 14],
      ["domain:DomainDrivenDesign", 14],
      ["project:DomainDrivenArchitectureLearning", 16],
      ["skill:C4Model", 12],
      ["skill:Structurizr", 8],
      ["resource:C4ModelMisconceptionsMisusesMistakes", 10],
      ["resource:UpskillingYourTeamInDDD", 10],
      ["skill:EventStorming", 8],
      ["skill:CollaborativeDomainDiscovery", 8],
      ["skill:TeamUpskilling", 6],
      ["resource:EffectiveTestAutomationForDevelopers", 10],
      ["skill:TestAutomation", 8],
      ["skill:UnitTesting", 6],
      ["skill:ExploratoryTesting", 5],
      ["skill:EventDrivenMicroservices", 8],
      ["role:MeginSeniorSoftwareDeveloperArchitect", 12],
      ["project:MEGMapsPlatform", 8],
      ["skill:Kubernetes", 4]
    ],
    gaps: [
      "Keep DDD and C4 framed as active learning unless tied to shipped architecture case studies.",
      "Add concrete bounded-context, event-storming, test-strategy, or architecture-decision examples from real projects."
    ],
    positioning: "Healthcare software architect learning to communicate domain boundaries, team discovery practices, system structure, and testability with DDD/C4-style models."
  },
  {
    id: "cloud-platform",
    label: "Cloud platform / regulated infrastructure architect",
    keywords: ["cloud", "platform", "infrastructure", "devops", "kubernetes", "k3s", "edge kubernetes", "rancher", "aws", "terraform", "architect", "gitops"],
    positives: [
      ["skill:AWS", 16],
      ["skill:Terraform", 15],
      ["skill:Kubernetes", 14],
      ["skill:K3s", 8],
      ["project:LightweightKubernetesLearning", 8],
      ["resource:K3sInternalsCrazyThings", 8],
      ["skill:Docker", 10],
      ["skill:GitLab", 9],
      ["skill:ArgoCD", 9],
      ["skill:OpenShift", 9],
      ["project:SignantCloudMigration", 15],
      ["project:MEGMapsPlatform", 12],
      ["role:SignantSeniorSoftwareDesigner", 12],
      ["role:MeginSeniorSoftwareDeveloperArchitect", 12]
    ],
    gaps: [
      "For pure platform roles, reduce philosophical framing and lead with scale, reliability, and delivery metrics.",
      "Keep K3s internals framed as active learning unless tied to shipped edge Kubernetes delivery."
    ],
    positioning: "Strong regulated cloud/platform architect with hybrid, edge, GitOps, infrastructure-as-code, and active lightweight Kubernetes learning."
  },
  {
    id: "research-neuro",
    label: "Bioinformatics / computational neuroscience research software",
    keywords: ["research", "bioinformatics", "neuroscience", "computational neuroscience", "matlab", "retina", "academic"],
    positives: [
      ["domain:Bioinformatics", 16],
      ["domain:ComputationalNeuroscience", 16],
      ["project:AlaLaurilaDataAcquisition", 14],
      ["project:RetinalCircuitAnalysis", 14],
      ["role:AaltoGraduateResearcher", 13],
      ["skill:MATLAB", 8],
      ["skill:HDF5", 8],
      ["practice:ScientificResearch", 8]
    ],
    gaps: [
      "If applying to research-heavy roles, publications and methods depth should be more visible."
    ],
    positioning: "Software engineer with real bioinformatics and neuroscience research tooling experience."
  },
  {
    id: "pure-clinical",
    label: "Pure clinical / licensed care delivery",
    keywords: ["doctor", "physician", "nurse", "clinical role", "pure clinical", "care delivery", "medical practitioner"],
    positives: [
      ["domain:ClinicalValidation", 6],
      ["practice:ClinicalObservation", 6],
      ["domain:MedicalDeviceSoftware", 5]
    ],
    penalty: 45,
    gaps: [
      "The RDF does not show a clinical license or direct care-delivery role.",
      "Best positioned as a healthcare technologist, not as a clinician."
    ],
    positioning: "Partial fit only where clinical teams need a technical partner for regulated software and workflow translation."
  },
  {
    id: "brand-design",
    label: "Frontend brand / visual design specialist",
    keywords: ["brand design", "visual design", "ui designer", "graphic design", "marketing site", "frontend brand"],
    positives: [
      ["skill:React", 8],
      ["skill:MaterialUI", 6],
      ["project:SeppoSinglePageApplication", 6]
    ],
    penalty: 35,
    gaps: [
      "The RDF evidence is stronger in healthcare platforms and infrastructure than visual identity ownership.",
      "Use frontend work as supporting evidence, not the central pitch."
    ],
    positioning: "Better fit for product engineering than pure brand or visual design."
  }
];

export function assessFit(question, rdfFacts) {
  const normalized = question.toLowerCase();
  const dateFact = answerDateFact(normalized, rdfFacts);
  if (dateFact) return { question, ...dateFact };

  const matched = fitProfiles
    .map((profile) => ({
      ...profile,
      keywordHits: profile.keywords.filter((keyword) => normalized.includes(keyword))
    }))
    .filter((profile) => profile.keywordHits.length > 0);

  const profiles = matched.length ? matched : [unknownTargetProfile(question)];
  const scored = profiles.map((profile) => scoreProfile(profile, rdfFacts)).sort((a, b) => b.score - a.score);
  const top = scored[0];
  const fit = top.score >= 72 ? "Strong" : top.score >= 42 ? "Partial" : "Weak";

  return {
    question,
    fit,
    score: top.score,
    target: top.label,
    evidence: top.evidence.slice(0, 20),
    gaps: top.gaps,
    positioning: top.positioning,
    related: scored.slice(1, 4).map((item) => `${item.label}: ${item.score}/100`)
  };
}

function answerDateFact(normalized, rdfFacts) {
  const month = normalized.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/);
  if (!month || !/\b(end|ended|ends|ending)\b/.test(normalized)) return null;

  const monthNumber = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12"
  }[month[1]];
  const targetDate = `${month[2]}-${monthNumber}`;
  const matches = (rdfFacts.roles || []).filter((role) => role.endDate === targetDate);
  if (!matches.length) return null;
  const monthLabel = `${month[1][0].toUpperCase()}${month[1].slice(1)}`;

  const evidence = matches.map((role) => {
    const org = role.organization ? ` at ${role.organization.label} (${role.organization.id})` : "";
    return `${role.label} (${role.id}) ended ${role.endDate}${org}`;
  });
  const first = matches[0];
  const org = first.organization ? ` at ${first.organization.label}` : "";

  return {
    kind: "fact",
    fit: "Answered",
    score: 100,
    target: "RDF date fact",
    answer: `${first.label}${org} ended in ${monthLabel} ${month[2]}.`,
    evidence,
    gaps: ["This is a date fact from RDF, not a suitability assessment."],
    positioning: "Use RDF date facts for timeline questions; use fit scoring for suitability questions.",
    related: matches.slice(1).map((role) => `${role.label}: ended ${role.endDate}`)
  };
}

function scoreProfile(profile, rdfFacts) {
  const evidence = [];
  let score = profile.keywordHits.length ? 16 : 8;

  for (const [id, weight] of profile.positives) {
    const fact = rdfFacts.byShort.get(id);
    if (!fact) continue;
    score += weight;
    evidence.push(`${fact.label} (${id})`);
  }

  score -= profile.penalty || 0;
  return {
    ...profile,
    score: Math.max(0, Math.min(100, score)),
    evidence
  };
}

function unknownTargetProfile(question) {
  return {
    id: "unknown-target",
    label: "Unclear target / insufficient RDF match",
    keywordHits: [],
    positives: [],
    gaps: [
      "The RDF does not show enough target-specific evidence for this question.",
      "Ask about a concrete role or domain so the answer can stay grounded in RDF evidence."
    ],
    positioning: "Insufficient RDF match; strongest grounded evidence is in regulated healthcare software, digital health, cloud platforms, and research software.",
    question
  };
}
