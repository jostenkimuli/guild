// Mock-data layer for the /playground/school-dashboard UI preview.
//
// A deterministic "Sunrise Primary School · Term 1 & Term 2 · 2026" snapshot of
// national-curriculum implementation metrics. The framing copy (country, issuer,
// certification body, CA contribution %, AoI scale, portal, statutory deadline)
// is derived from the ecosystem's ACTIVE subscription via `standardFramework`,
// so the same dashboard re-frames itself when the school follows a different
// subscribed standard. Numeric fields are TermPairs { t1, t2 } so the preview
// can show month/termly deltas — swap for real metric tables when wired up.

export type TermId = "t1" | "t2";

export interface TermPair<T = number> {
  t1: T;
  t2: T;
}

// ---------------------------------------------------------------
// Standard frameworks — the reference-dependent copy
// ---------------------------------------------------------------

export interface MockStandardFramework {
  country: string;
  issuer: string;
  certification_body: string;
  /** Share of final certification made up by continuous assessment, e.g. 20. */
  ca_contribution_pct: number;
  /** Human scale label for the AoI/competency scoring, e.g. "1–3". */
  aoi_scale: string;
  portal_name: string;
  statutory_deadline: string;
  /** Learners per textbook the school is targeting, e.g. 3. */
  textbook_target: number;
  /** Annual CPD hours target per teacher, e.g. 60. */
  cpd_target_hours: number;
}

export const standardFrameworks: Record<string, MockStandardFramework> = {
  "NCDC-UPE-PRI": {
    country: "Uganda",
    issuer: "National Curriculum Development Centre (NCDC)",
    certification_body: "UNEB",
    ca_contribution_pct: 20,
    aoi_scale: "1–3",
    portal_name: "UNEB Portal",
    statutory_deadline: "Term 3 · 30 July 2026",
    textbook_target: 3,
    cpd_target_hours: 60,
  },
  "KNEC-KISW-CBC": {
    country: "Kenya",
    issuer: "Kenya National Examinations Council (KNEC)",
    certification_body: "KNEC",
    ca_contribution_pct: 20,
    aoi_scale: "1–4",
    portal_name: "KNEC Portal",
    statutory_deadline: "Term 3 · 30 September 2026",
    textbook_target: 1,
    cpd_target_hours: 80,
  },
  "KFZ-MECH-2020": {
    country: "Germany",
    issuer: "Bundesinstitut für Berufsbildung (BIBB)",
    certification_body: "IHK / Chamber",
    ca_contribution_pct: 0,
    aoi_scale: "—",
    portal_name: "IHK Portal",
    statutory_deadline: "Annually · 31 December 2026",
    textbook_target: 1,
    cpd_target_hours: 40,
  },
  "NCAD-TRANS-01": {
    country: "Ireland",
    issuer: "National Apprenticeship Office",
    certification_body: "QQI",
    ca_contribution_pct: 0,
    aoi_scale: "—",
    portal_name: "QQI Portal",
    statutory_deadline: "Annually · 30 November 2026",
    textbook_target: 1,
    cpd_target_hours: 50,
  },
};

export function standardFramework(code: string): MockStandardFramework {
  return (
    standardFrameworks[code] ?? {
      country: "—",
      issuer: "Registered standard",
      certification_body: "Certifying body",
      ca_contribution_pct: 0,
      aoi_scale: "—",
      portal_name: "Certification portal",
      statutory_deadline: "To be confirmed",
      textbook_target: 1,
      cpd_target_hours: 60,
    }
  );
}

// ---------------------------------------------------------------
// Context
// ---------------------------------------------------------------

export interface MockDashboardContext {
  ecosystem_id: string;
  school_name: string;
  slug: string;
  term_year: number;
  terms: { id: TermId; label: string }[];
  /** The ecosystem's ACTIVE subscribed standards — framing follows them. */
  followed_standard_codes: string[];
  stats: {
    students: number;
    teachers: number;
    classes: number;
  };
}

export const mockDashboardContext: MockDashboardContext = {
  ecosystem_id: "eco-sunrise",
  school_name: "Sunrise Primary School",
  slug: "sunrise",
  term_year: 2026,
  terms: [
    { id: "t1", label: "Term 1" },
    { id: "t2", label: "Term 2" },
  ],
  followed_standard_codes: ["NCDC-UPE-PRI", "KNEC-KISW-CBC"],
  stats: {
    students: 842,
    teachers: 46,
    classes: 32,
  },
};

// ---------------------------------------------------------------
// A. Formative & continuous assessment
// ---------------------------------------------------------------

export interface MockAoIRow {
  subject: string;
  tasks: number;
  submitted: TermPair;
  /** Weighted accuracy of scores on the standard's AoI scale (%). */
  scoring_accuracy: TermPair;
  timely: TermPair;
}

export const mockAoI: MockAoIRow[] = [
  { subject: "Literacy in English", tasks: 24, submitted: { t1: 78, t2: 91 }, scoring_accuracy: { t1: 82, t2: 88 }, timely: { t1: 74, t2: 85 } },
  { subject: "Mathematics & Numeracy", tasks: 24, submitted: { t1: 81, t2: 93 }, scoring_accuracy: { t1: 86, t2: 90 }, timely: { t1: 76, t2: 87 } },
  { subject: "Science & Technology", tasks: 18, submitted: { t1: 72, t2: 84 }, scoring_accuracy: { t1: 79, t2: 84 }, timely: { t1: 68, t2: 80 } },
  { subject: "Social Studies & Religious Education", tasks: 18, submitted: { t1: 84, t2: 92 }, scoring_accuracy: { t1: 88, t2: 90 }, timely: { t1: 80, t2: 86 } },
  { subject: "Creative Arts & PE", tasks: 12, submitted: { t1: 62, t2: 73 }, scoring_accuracy: { t1: 76, t2: 80 }, timely: { t1: 58, t2: 70 } },
];

export interface MockGenericSkill {
  id: string;
  label: string;
  achieved: TermPair;
  target: number;
}

export const mockGenericSkills: MockGenericSkill[] = [
  { id: "critical", label: "Critical thinking & problem-solving", achieved: { t1: 58, t2: 67 }, target: 80 },
  { id: "creativity", label: "Creativity & innovation", achieved: { t1: 51, t2: 60 }, target: 75 },
  { id: "communication", label: "Communication & collaboration", achieved: { t1: 66, t2: 74 }, target: 85 },
  { id: "ict", label: "ICT proficiency & mathematical computation", achieved: { t1: 47, t2: 58 }, target: 70 },
];

export interface MockProjectWork {
  group_projects: TermPair;
  individual_projects: TermPair;
  /** Share of scored projects on the scale (1 basic → 3 advanced). */
  rubric_bins: { scale: 1 | 2 | 3; share: TermPair }[];
}

export const mockProjectWork: MockProjectWork = {
  group_projects: { t1: 34, t2: 41 },
  individual_projects: { t1: 48, t2: 56 },
  rubric_bins: [
    { scale: 1, share: { t1: 22, t2: 17 } },
    { scale: 2, share: { t1: 46, t2: 49 } },
    { scale: 3, share: { t1: 32, t2: 34 } },
  ],
};

export interface MockUnebReadiness {
  completeness: TermPair;
  error_free: TermPair;
}

export const mockUnebReadiness: MockUnebReadiness = {
  completeness: { t1: 64, t2: 81 },
  error_free: { t1: 58, t2: 74 },
};

// ---------------------------------------------------------------
// B. Pedagogy & classroom delivery
// ---------------------------------------------------------------

export interface MockDeliveryRow {
  subject: string;
  /** Minutes per instructional session. */
  lecture_min: TermPair;
  engagement_min: TermPair;
  coverage_pct: TermPair;
  sequence_compliant: boolean;
}

export const mockDelivery: MockDeliveryRow[] = [
  { subject: "Literacy in English", lecture_min: { t1: 24, t2: 22 }, engagement_min: { t1: 16, t2: 18 }, coverage_pct: { t1: 62, t2: 78 }, sequence_compliant: true },
  { subject: "Mathematics & Numeracy", lecture_min: { t1: 22, t2: 20 }, engagement_min: { t1: 18, t2: 20 }, coverage_pct: { t1: 70, t2: 85 }, sequence_compliant: true },
  { subject: "Science & Technology", lecture_min: { t1: 26, t2: 23 }, engagement_min: { t1: 14, t2: 17 }, coverage_pct: { t1: 55, t2: 72 }, sequence_compliant: true },
  { subject: "Social Studies & Religious Education", lecture_min: { t1: 24, t2: 21 }, engagement_min: { t1: 16, t2: 19 }, coverage_pct: { t1: 66, t2: 79 }, sequence_compliant: true },
  { subject: "Creative Arts & PE", lecture_min: { t1: 20, t2: 16 }, engagement_min: { t1: 20, t2: 24 }, coverage_pct: { t1: 60, t2: 76 }, sequence_compliant: false },
];

export const mockLifeSkillsIntegration: TermPair = { t1: 48, t2: 63 };
export const mockCoCurricularUtilization: TermPair = { t1: 52, t2: 68 };

// ---------------------------------------------------------------
// C. Teacher capacity
// ---------------------------------------------------------------

export interface MockCpdRow {
  name: string;
  hours: TermPair;
}

export const mockCpd: MockCpdRow[] = [
  { name: "Grace Adeyemi", hours: { t1: 18, t2: 41 } },
  { name: "Daniel Mensah", hours: { t1: 12, t2: 38 } },
  { name: "Kofi Boateng", hours: { t1: 22, t2: 45 } },
  { name: "Ama Serwaa", hours: { t1: 8, t2: 29 } },
  { name: "Kwabena Darko", hours: { t1: 10, t2: 33 } },
];

export interface MockCpdMode {
  mode: string;
  hours: TermPair;
}

export const mockCpdModes: MockCpdMode[] = [
  { mode: "NCDC / certification retooling", hours: { t1: 90, t2: 160 } },
  { mode: "Peer-to-peer lesson observation", hours: { t1: 60, t2: 120 } },
  { mode: "Subject-cluster workshops", hours: { t1: 40, t2: 95 } },
];

export const mockAssessmentLiteracy: TermPair = { t1: 71, t2: 82 };

export const mockDigitalAdoption: { ict_lessons_pct: TermPair; digital_marksheets_pct: TermPair } = {
  ict_lessons_pct: { t1: 40, t2: 58 },
  digital_marksheets_pct: { t1: 55, t2: 70 },
};

// ---------------------------------------------------------------
// D. Resources & infrastructure
// ---------------------------------------------------------------

export interface MockTextbookRow {
  subject: string;
  /** Learners per copy — LOWER is better; target from the framework. */
  learners_per_book: TermPair;
}

export const mockTextbookRatios: MockTextbookRow[] = [
  { subject: "Literacy in English", learners_per_book: { t1: 4.2, t2: 3.6 } },
  { subject: "Mathematics & Numeracy", learners_per_book: { t1: 3.8, t2: 3.4 } },
  { subject: "Science & Technology", learners_per_book: { t1: 5.1, t2: 4.2 } },
  { subject: "Social Studies & Religious Education", learners_per_book: { t1: 4.6, t2: 4.0 } },
];

export interface MockInfrastructureRow {
  name: string;
  available: boolean;
  functional_pct: TermPair;
}

export const mockInfrastructure: MockInfrastructureRow[] = [
  { name: "Science laboratories", available: true, functional_pct: { t1: 70, t2: 85 } },
  { name: "ICT laboratory", available: true, functional_pct: { t1: 60, t2: 78 } },
  { name: "Agricultural plots", available: true, functional_pct: { t1: 82, t2: 90 } },
  { name: "Vocational workshop", available: false, functional_pct: { t1: 40, t2: 55 } },
];

export const mockLocalMaterials: TermPair = { t1: 206, t2: 250 };

// ---------------------------------------------------------------
// E. Inclusive education
// ---------------------------------------------------------------

export const mockSen: { identified: number; adapted_plans: TermPair; coverage_pct: TermPair } = {
  identified: 64,
  adapted_plans: { t1: 41, t2: 58 },
  coverage_pct: { t1: 64, t2: 90 },
};

export const mockRemediation: { level1_count: number; sessions: number; improved_pct: TermPair } = {
  level1_count: 132,
  sessions: 18,
  improved_pct: { t1: 44, t2: 62 },
};

export interface MockGenderRow {
  domain: string;
  female: TermPair;
  male: TermPair;
}

export const mockGenderTrends: MockGenderRow[] = [
  { domain: "STEM competency", female: { t1: 36, t2: 49 }, male: { t1: 41, t2: 54 } },
  { domain: "ICT proficiency", female: { t1: 46, t2: 58 }, male: { t1: 52, t2: 63 } },
];

// ---------------------------------------------------------------
// Summary pillars
// ---------------------------------------------------------------

export type PillarStatus = "on_track" | "attention" | "at_risk";

export function statusFor(value: number): PillarStatus {
  if (value >= 80) return "on_track";
  if (value >= 65) return "attention";
  return "at_risk";
}

export interface MockPillarItem {
  label: string;
  value: TermPair;
}

export interface MockPillar {
  id: string;
  label: string;
  description: string;
  readiness: TermPair;
  items: MockPillarItem[];
}

export const mockPillars: MockPillar[] = [
  {
    id: "academic",
    label: "Academic & continuous assessment",
    description: "AoI scoring, project-work rubrics, and certification-portal readiness.",
    readiness: { t1: 62, t2: 78 },
    items: [
      { label: "AoI submission rate", value: { t1: 76, t2: 89 } },
      { label: "Scoring accuracy on scale", value: { t1: 82, t2: 88 } },
      { label: "Portal readiness", value: { t1: 64, t2: 81 } },
    ],
  },
  {
    id: "teacher",
    label: "Teacher & classroom",
    description: "CPD hours, facilitation vs lecture time, and moderation audits.",
    readiness: { t1: 58, t2: 76 },
    items: [
      { label: "CPD hours vs annual target", value: { t1: 47, t2: 63 } },
      { label: "Learner-engaged time share", value: { t1: 38, t2: 48 } },
      { label: "Assessment moderation audit", value: { t1: 71, t2: 82 } },
    ],
  },
  {
    id: "diversity",
    label: "Resources & diversity",
    description: "Textbook ratios, practical infrastructure, and SEN adaptation.",
    readiness: { t1: 51, t2: 58 },
    items: [
      { label: "Textbook ratio vs target", value: { t1: 42, t2: 55 } },
      { label: "Labs & ICT functionality", value: { t1: 66, t2: 74 } },
      { label: "SEN adaptation coverage", value: { t1: 64, t2: 90 } },
    ],
  },
];

export function overallReadiness(pillars: MockPillar[], term: TermId): number {
  const sum = pillars.reduce((total, pillar) => total + pillar.readiness[term], 0);
  return Math.round(sum / pillars.length);
}