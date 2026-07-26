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
    keywords: ["health ai", "ai health", "digital health", "product lead", "technology lead", "healthcare ai", "self-care"],
    positives: [
      ["domain:AIEnabledHealthcare", 18],
      ["domain:DigitalHealth", 16],
      ["domain:ClimateHealth", 9],
      ["project:HallaHealth", 18],
      ["role:ScopeImpactTechnologyLead", 18],
      ["practice:ProductDiscovery", 10],
      ["value:HumanWellBeing", 8],
      ["value:SystemsEmpathy", 8],
      ["skill:AWS", 6]
    ],
    gaps: [
      "Show measurable product outcomes and adoption signals.",
      "Separate AI product judgment from infrastructure delivery."
    ],
    positioning: "Digital health technical lead who can connect AI-enabled product direction with privacy-aware architecture and healthcare purpose."
  },
  {
    id: "cloud-platform",
    label: "Cloud platform / regulated infrastructure architect",
    keywords: ["cloud", "platform", "infrastructure", "devops", "kubernetes", "aws", "terraform", "architect", "gitops"],
    positives: [
      ["skill:AWS", 16],
      ["skill:Terraform", 15],
      ["skill:Kubernetes", 14],
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
      "For pure platform roles, reduce philosophical framing and lead with scale, reliability, and delivery metrics."
    ],
    positioning: "Strong regulated cloud/platform architect with hybrid, edge, GitOps, and infrastructure-as-code experience."
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
  const matched = fitProfiles
    .map((profile) => ({
      ...profile,
      keywordHits: profile.keywords.filter((keyword) => normalized.includes(keyword))
    }))
    .filter((profile) => profile.keywordHits.length > 0);

  const profiles = matched.length ? matched : fitProfiles.slice(0, 4);
  const scored = profiles.map((profile) => scoreProfile(profile, rdfFacts)).sort((a, b) => b.score - a.score);
  const top = scored[0];
  const fit = top.score >= 72 ? "Strong" : top.score >= 42 ? "Partial" : "Weak";

  return {
    question,
    fit,
    score: top.score,
    target: top.label,
    evidence: top.evidence.slice(0, 8),
    gaps: top.gaps,
    positioning: top.positioning,
    related: scored.slice(1, 4).map((item) => `${item.label}: ${item.score}/100`)
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
