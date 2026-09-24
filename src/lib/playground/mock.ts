// Mock-data layer for the /playground UI preview.
//
// Every entity here is structurally typed against the Supabase row/join
// shapes the real app queries (see src/lib/supabase/database.types.ts),
// so a preview component can render mock data and later be wired to real
// server queries without UI changes. IDs are deterministic but arbitrary.

import type { Enums, Tables } from "@/lib/supabase/database.types";
import {
  AIMS_OF_PRIMARY_EDUCATION,
  NATIONAL_AIMS,
} from "@/lib/playground/thematic-curriculum";

// ---------------------------------------------------------------
// Ecosystem + spaces
// ---------------------------------------------------------------

export type MockEcosystem = Pick<
  Tables<"ecosystems">,
  | "id"
  | "name"
  | "slug"
  | "type"
  | "vision"
  | "mission"
  | "description"
  | "calendar_year"
  | "theme_primary"
  | "theme_supporting"
  | "theme_accent"
  | "badge_url"
  | "is_private"
>;

export interface MockSpace extends Tables<"spaces"> {
  ecosystems: { name: string; type: string } | null;
}

// ---------------------------------------------------------------
// Members (space_memberships joined with profiles)
// ---------------------------------------------------------------

export type MockSpaceRole = Enums<"user_space_role">;

export interface MockMember {
  id: string;
  display_name: string;
  email: string | null;
  role: MockSpaceRole;
  joined_at: string;
}

export interface MockStudentProgress {
  member: MockMember;
  topic_id: string;
  topic_name: string;
  progress_pct: number | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

// ---------------------------------------------------------------
// Curriculum tree (curricula → goals, grades → terms → units → topics)
// ---------------------------------------------------------------

export interface MockCurriculumGoal {
  id: string;
  description: string;
}

export interface MockLearningObjective {
  id: string;
  sequence: number;
  description: string;
}

export interface MockContentBlock {
  id: string;
  title: string;
  description: string;
}

export interface MockTeachingGuidance {
  id: string;
  guidance: string;
}

export interface MockLessonActivity {
  id: string;
  sequence: number;
  title: string;
  description: string;
}

export interface MockLessonAssessment {
  id: string;
  sequence: number;
  type: Enums<"assessment_type">;
  title: string;
  description: string;
  due_date: string | null;
}

export interface MockLessonResource {
  id: string;
  title: string;
  type: Enums<"resource_type">;
  url: string;
}

export interface MockLessonSession {
  scheduled_start: string;
  scheduled_end: string;
  medium: Enums<"session_medium_type">;
  location_room: string | null;
  meeting_url: string | null;
  session_status: string;
}

export interface MockLesson {
  id: string;
  topic_id: string;
  title: string;
  delivery_type: Enums<"lesson_delivery_type">;
  estimated_duration_minutes: number | null;
  is_published: boolean | null;
  video_url: string | null;
  created_at: string;
  published_at: string | null;
  activities: MockLessonActivity[];
  assessments: MockLessonAssessment[];
  resources: MockLessonResource[];
  session?: MockLessonSession;
}

export interface MockTopic {
  id: string;
  name: string;
  description: string | null;
  duration_weeks: number | null;
  sequence_order: number;
  subject_name: string | null;
  linked_goal_id: string | null;
  learning_objectives: MockLearningObjective[];
  content: MockContentBlock[];
  teaching_guidance: MockTeachingGuidance[];
  lessons: MockLesson[];
}

export interface MockUnit {
  id: string;
  name: string;
  topics: MockTopic[];
}

export interface MockTerm {
  id: string;
  name: string;
  units: MockUnit[];
}

export interface MockGrade {
  id: string;
  name: string;
  terms: MockTerm[];
}

export interface MockCurriculumTree {
  id: string;
  name: string;
  year: number;
  is_published: boolean | null;
  published_at: string | null;
  curriculum_goals: MockCurriculumGoal[];
  grades: MockGrade[];
}

export interface MockSyllabus {
  id: string;
  curriculum_id: string;
  curricula: { name: string; year: number } | null;
  grading_policy:
    | { pass_mark?: number; grade_breakdown: { label: string; weight_pct: number }[] }
    | null;
  required_materials: string | null;
  office_hours: string | null;
  classroom_expectations: string | null;
  instructor_notes: string | null;
  created_at: string;
}

export interface MockCurriculumEvaluation {
  id: string;
  curriculum_id: string;
  period: string;
  achievement_rate: number;
}

export interface MockPendingEdit {
  id: string;
  space_id: string;
  created_at: string;
  edited_by: string;
  edited_by_name: string;
  status: string;
  changes: Record<string, unknown>;
}

export interface MockInvitationCode {
  id: string;
  space_id: string;
  code: string;
  role: Enums<"user_space_role">;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  grade_id: string | null;
}

export interface MockProject {
  id: string;
  unit_id: string;
  title: string;
  description: string;
}

// ---------------------------------------------------------------
// Data
// ---------------------------------------------------------------

export const mockEcosystem: MockEcosystem = {
  id: "eco-sunrise",
  name: "Sunrise Primary School",
  slug: "sunrise",
  type: "primary_school",
  vision:
    "Learning meaningful enough to matter outside the classroom.",
  mission:
    "We pair a rigorous curriculum with real community challenges so every learner leaves with something the world can use.",
  description:
    "An urban primary school running challenge-based, cross-curricular learning programmes.",
  calendar_year: 2026,
  theme_primary: "#0d9488",
  theme_supporting: "warm_slate",
  theme_accent: "#c4682d",
  badge_url: null,
  is_private: false,
};

export const mockSpaces: MockSpace[] = [
  {
    id: "sp-maths",
    name: "Primary Mathematics",
    slug: "primary-mathematics",
    description: "Number sense, geometry and data to the end of Year 6.",
    type: "department",
    ecosystem_id: mockEcosystem.id,
    is_private: false,
    created_at: "2025-09-01T08:00:00.000Z",
    created_by: "usr-eco-admin",
    ecosystems: {
      name: mockEcosystem.name,
      type: mockEcosystem.type,
    },
  },
  {
    id: "sp-science",
    name: "Science & Discovery",
    slug: "science-discovery",
    description: "Inquiry-based science units with hands-on investigations.",
    type: "innovation_hub",
    ecosystem_id: mockEcosystem.id,
    is_private: false,
    created_at: "2025-09-01T08:00:00.000Z",
    created_by: "usr-eco-admin",
    ecosystems: {
      name: mockEcosystem.name,
      type: mockEcosystem.type,
    },
  },
];

export const mockMembers: MockMember[] = [
  { id: "usr-daniel", display_name: "Daniel Mensah", email: "daniel@sunrise.dev", role: "admin", joined_at: "2025-09-02T09:12:00.000Z" },
  { id: "usr-grace", display_name: "Grace Adeyemi", email: "grace@sunrise.dev", role: "teacher", joined_at: "2025-09-02T09:15:00.000Z" },
  { id: "usr-kofi", display_name: "Kofi Boateng", email: "kofi@sunrise.dev", role: "mentor", joined_at: "2025-09-03T10:00:00.000Z" },
  { id: "usr-nana", display_name: "Nana Yaa Brefo", email: "nana@north-star.dev", role: "collaborator", joined_at: "2025-09-04T11:20:00.000Z" },
  { id: "usr-ama", display_name: "Ama Serwaa", email: null, role: "learner", joined_at: "2025-09-10T08:30:00.000Z" },
  { id: "usr-kwabena", display_name: "Kwabena Darko", email: null, role: "learner", joined_at: "2025-09-10T08:31:00.000Z" },
  { id: "usr-efua", display_name: "Efua Quansah", email: null, role: "learner", joined_at: "2025-09-10T08:32:00.000Z" },
  { id: "usr-kojo", display_name: "Kojo Asante", email: null, role: "learner", joined_at: "2025-09-11T09:00:00.000Z" },
  { id: "usr-akosua", display_name: "Akosua Frimpong", email: null, role: "learner", joined_at: "2025-09-11T09:02:00.000Z" },
];

export const mockStudentProgress: MockStudentProgress[] = [
  { member: mockMembers[4], topic_id: "t-fdp", topic_name: "Fractions, Decimals & Percentages", progress_pct: 80, status: "in_progress", started_at: "2026-02-02T08:00:00.000Z", completed_at: null },
  { member: mockMembers[5], topic_id: "t-fdp", topic_name: "Fractions, Decimals & Percentages", progress_pct: 100, status: "completed", started_at: "2026-02-02T08:00:00.000Z", completed_at: "2026-02-18T10:00:00.000Z" },
  { member: mockMembers[6], topic_id: "t-rational", topic_name: "Adding & Subtracting Rational Numbers", progress_pct: 45, status: "in_progress", started_at: "2026-02-09T08:00:00.000Z", completed_at: null },
  { member: mockMembers[7], topic_id: "t-ratio", topic_name: "Ratios in Real Life", progress_pct: 0, status: "not_started", started_at: null, completed_at: null },
  { member: mockMembers[8], topic_id: "t-fdp", topic_name: "Fractions, Decimals & Percentages", progress_pct: 60, status: "in_progress", started_at: "2026-02-04T08:00:00.000Z", completed_at: null },
];

export const mockCurricula: MockCurriculumTree[] = [
  {
    id: "cur-g6",
    name: "Mathematics — Grade 6",
    year: 2026,
    is_published: true,
    published_at: "2026-01-15T12:00:00.000Z",
    curriculum_goals: [
      { id: "cg-1", description: "Fluently operate with fractions and decimals in real-world contexts." },
      { id: "cg-2", description: "Apply ratio and proportion to solve multi-step problems." },
      { id: "cg-3", description: "Reason about geometric properties and measurement to model situations." },
    ],
    grades: [
      {
        id: "gr-6",
        name: "Grade 6",
        terms: [
          {
            id: "term1",
            name: "Term 1 — Number & Algebra",
            units: [
              {
                id: "unit-frac",
                name: "Fractions & Decimals",
                topics: [
                  {
                    id: "t-fdp",
                    name: "Fractions, Decimals & Percentages",
                    description: "Making sense of the connections between fractions, decimals and percentages.",
                    duration_weeks: 3,
                    sequence_order: 1,
                    subject_name: "Mathematics",
                    linked_goal_id: "cg-1",
                    learning_objectives: [
                      { id: "lo-1", sequence: 1, description: "Convert between fractions, decimals and percentages." },
                      { id: "lo-2", sequence: 2, description: "Order and compare rational numbers on a number line." },
                      { id: "lo-3", sequence: 3, description: "Interpret real-world quantities using flexible representations." },
                    ],
                    content: [
                      {
                        id: "ct-1",
                        title: "Fraction ↔ decimal ↔ percentage",
                        description:
                          "A worked reference chart showing common equivalences (1/4, 1/2, 3/4) across the three representations, with the underlying operations each conversion performs.",
                      },
                      {
                        id: "ct-2",
                        title: "Ordering rational numbers",
                        description:
                          "A worked number-line exercise comparing mixed numbers, decimals and percentages, including strategies for finding a common frame.",
                      },
                    ],
                    teaching_guidance: [
                      {
                        id: "tg-1",
                        guidance:
                          "Anchor conversions in money, measurements and cooked recipes before using abstract procedures; watch for learners who need the equivalence table as a scaffold.",
                      },
                    ],
                    lessons: [
                      {
                        id: "ls-fdp-1",
                        topic_id: "t-fdp",
                        title: "Fractions to Decimals",
                        delivery_type: "self_paced",
                        estimated_duration_minutes: 45,
                        is_published: true,
                        video_url: "https://example.com/media/fractions-to-decimals.mp4",
                        created_at: "2026-01-20T09:00:00.000Z",
                        published_at: "2026-02-01T09:00:00.000Z",
                        activities: [
                          { id: "act-1", sequence: 1, title: "Fraction wall warm-up", description: "Drag-and-drop halves, quarters and tenths onto a fraction wall." },
                          { id: "act-2", sequence: 2, title: "Conversion drills", description: "Ten timed conversions between simple fractions and decimals with instant feedback." },
                        ],
                        assessments: [
                          {
                            id: "as-1",
                            sequence: 1,
                            type: "quiz",
                            title: "Quick check: fraction ↔ decimal",
                            description: "Eight multiple-choice conversion questions, auto-marked.",
                            due_date: "2026-02-05T23:59:00.000Z",
                          },
                        ],
                        resources: [
                          { id: "res-1", title: "Fraction wall manipulative", type: "link", url: "https://example.com/fraction-wall" },
                          { id: "res-2", title: "Equivalence chart (PDF)", type: "document", url: "https://example.com/equivalence.pdf" },
                        ],
                      },
                      {
                        id: "ls-fdp-2",
                        topic_id: "t-fdp",
                        title: "From Percentages to Everyday Quantity",
                        delivery_type: "scheduled",
                        estimated_duration_minutes: 55,
                        is_published: true,
                        video_url: null,
                        created_at: "2026-01-21T09:00:00.000Z",
                        published_at: "2026-02-01T09:00:00.000Z",
                        activities: [
                          { id: "act-3", sequence: 1, title: "Sale tags in the wild", description: "Learners collect prices from flyers and convert discounts into fractions." },
                          { id: "act-4", sequence: 2, title: "Class market stall", description: "Small groups price items, budget and explain percentages to their buyers." },
                        ],
                        assessments: [
                          {
                            id: "as-2",
                            sequence: 1,
                            type: "exercise",
                            title: "Percent of a quantity workout",
                            description: "Six scaffolded problems from 1% to 25% of a whole.",
                            due_date: "2026-02-12T23:59:00.000Z",
                          },
                        ],
                        resources: [
                          { id: "res-3", title: "Budget planning sheet", type: "document", url: "https://example.com/budget-sheet.docx" },
                          { id: "res-4", title: "Market pricing walkthrough", type: "video", url: "https://example.com/market-video.mp4" },
                        ],
                        session: {
                          scheduled_start: "2026-02-07T10:30:00.000Z",
                          scheduled_end: "2026-02-07T11:25:00.000Z",
                          medium: "online",
                          location_room: null,
                          meeting_url: "https://meet.example.com/sunrise-maths",
                          session_status: "scheduled",
                        },
                      },
                      {
                        id: "ls-fdp-3",
                        topic_id: "t-fdp",
                        title: "Mixed Operations Review",
                        delivery_type: "self_paced",
                        estimated_duration_minutes: 60,
                        is_published: false,
                        video_url: null,
                        created_at: "2026-02-10T09:00:00.000Z",
                        published_at: null,
                        activities: [
                          { id: "act-5", sequence: 1, title: "Mixed-operations stations", description: "Four stations combining ordering, converting and estimating." },
                        ],
                        assessments: [
                          {
                            id: "as-3",
                            sequence: 1,
                            type: "test",
                            title: "End-of-topic assessment (draft)",
                            description: "Twelve short-answer items covering the full topic.",
                            due_date: null,
                          },
                        ],
                        resources: [
                          { id: "res-5", title: "Review answer key", type: "document", url: "https://example.com/answer-key.pdf" },
                        ],
                      },
                    ],
                  },
                  {
                    id: "t-rational",
                    name: "Adding & Subtracting Rational Numbers",
                    description: "Efficient written and mental strategies for rational addition and subtraction.",
                    duration_weeks: 2,
                    sequence_order: 2,
                    subject_name: "Mathematics",
                    linked_goal_id: "cg-1",
                    learning_objectives: [
                      { id: "lo-4", sequence: 1, description: "Add and subtract fractions with unlike denominators." },
                      { id: "lo-5", sequence: 2, description: "Estimate to check the reasonableness of answers." },
                    ],
                    content: [
                      {
                        id: "ct-3",
                        title: "Common denominators as common frames",
                        description:
                          "A worked exploration of why unlike denominators need reshaping before adding, using tray-of-tiles visuals.",
                      },
                    ],
                    teaching_guidance: [
                      {
                        id: "tg-2",
                        guidance:
                          "Keep estimation first: learners should predict the ballpark answer before computing so careless sign errors are caught.",
                      },
                    ],
                    lessons: [
                      {
                        id: "ls-rat-1",
                        topic_id: "t-rational",
                        title: "Adding Unlike Fractions",
                        delivery_type: "self_paced",
                        estimated_duration_minutes: 50,
                        is_published: true,
                        video_url: null,
                        created_at: "2026-01-22T09:00:00.000Z",
                        published_at: "2026-02-01T09:00:00.000Z",
                        activities: [
                          { id: "act-6", sequence: 1, title: "Tile-map the sum", description: "Model 1/4 + 1/3 with tiles before computing." },
                          { id: "act-7", sequence: 2, title: "Written strategy practice", description: "Five unlike-denominator additions with estimation checks." },
                        ],
                        assessments: [
                          {
                            id: "as-4",
                            sequence: 1,
                            type: "exercise",
                            title: "Addition strategies set",
                            description: "Five problems mixing tiles, bar models and written methods.",
                            due_date: "2026-02-19T23:59:00.000Z",
                          },
                        ],
                        resources: [
                          { id: "res-6", title: "Tile manipulative template", type: "document", url: "https://example.com/tiles.pdf" },
                          { id: "res-7", title: "Estimating sums overview", type: "text", url: "https://example.com/estimate" },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: "unit-ratio",
                name: "Ratios & Proportions",
                topics: [
                  {
                    id: "t-ratio",
                    name: "Ratios in Real Life",
                    description: "Using ratios to compare quantities and scale them up and down.",
                    duration_weeks: 2,
                    sequence_order: 1,
                    subject_name: "Mathematics",
                    linked_goal_id: "cg-2",
                    learning_objectives: [
                      { id: "lo-6", sequence: 1, description: "Express a comparison as a ratio in multiple equivalent forms." },
                      { id: "lo-7", sequence: 2, description: "Use ratio reasoning to double or triple a recipe quantity." },
                    ],
                    content: [
                      {
                        id: "ct-4",
                        title: "The mixing-ratio problem",
                        description: "A worked juice-concentrate problem that converts a 1:4 ratio into per-pitcher commissions.",
                      },
                    ],
                    teaching_guidance: [
                      {
                        id: "tg-3",
                        guidance: "Introduce ratios through mixing recipes the learners cook with, before moving to abstract proportion tables.",
                      },
                    ],
                    lessons: [
                      {
                        id: "ls-ratio-1",
                        topic_id: "t-ratio",
                        title: "Reading Ratios on Packaging",
                        delivery_type: "self_paced",
                        estimated_duration_minutes: 40,
                        is_published: true,
                        video_url: null,
                        created_at: "2026-01-25T09:00:00.000Z",
                        published_at: "2026-02-01T09:00:00.000Z",
                        activities: [
                          { id: "act-8", sequence: 1, title: "Label detective", description: "Find and decode at least 3 packaged ratios at home." },
                          { id: "act-9", sequence: 2, title: "Build a ratio table", description: "Fill proportion tables for 1:4, 2:3 and 3:5 mixes." },
                        ],
                        assessments: [
                          {
                            id: "as-5",
                            sequence: 1,
                            type: "project",
                            title: "Design a juice label",
                            description: "Create a label that states the mix as a ratio and a simplified equivalent.",
                            due_date: "2026-02-26T23:59:00.000Z",
                          },
                        ],
                        resources: [
                          { id: "res-8", title: "Ratio table template", type: "document", url: "https://example.com/ratios.pdf" },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "term2",
            name: "Term 2 — Geometry & Measurement",
            units: [
              {
                id: "unit-geo",
                name: "Geometry",
                topics: [
                  {
                    id: "t-angles",
                    name: "Angles and Shapes",
                    description: "Finding, describing and constructing angles and angle sums.",
                    duration_weeks: 3,
                    sequence_order: 1,
                    subject_name: "Mathematics",
                    linked_goal_id: "cg-3",
                    learning_objectives: [
                      { id: "lo-8", sequence: 1, description: "Classify angles and estimate their size to the nearest 10°." },
                      { id: "lo-9", sequence: 2, description: "Deduce interior angle sums for polygons." },
                    ],
                    content: [
                      {
                        id: "ct-5",
                        title: "Angles around the classroom",
                        description: "A photo walk identifying acute, right, obtuse and reflex angles in the school building.",
                      },
                    ],
                    teaching_guidance: [
                      {
                        id: "tg-4",
                        guidance: "Use the reflex-angle corners of door frames and corridors before protractor work.",
                      },
                    ],
                    lessons: [
                      {
                        id: "ls-geo-1",
                        topic_id: "t-angles",
                        title: "Estimating Angles Around Us",
                        delivery_type: "scheduled",
                        estimated_duration_minutes: 45,
                        is_published: false,
                        video_url: null,
                        created_at: "2026-02-12T09:00:00.000Z",
                        published_at: null,
                        activities: [
                          { id: "act-10", sequence: 1, title: "Photo scavenger hunt", description: "Capture 10 angles and sort them by family." },
                        ],
                        assessments: [
                          {
                            id: "as-6",
                            sequence: 1,
                            type: "exercise",
                            title: "Angle estimation set",
                            description: "Estimate-and-measure pairs for ten classroom angles.",
                            due_date: null,
                          },
                        ],
                        resources: [
                          { id: "res-9", title: "Protractor practice sheet", type: "document", url: "https://example.com/protractor.pdf" },
                        ],
                      },
                    ],
                  },
                  {
                    id: "t-perimeter",
                    name: "Perimeter, Area & Volume",
                    description: "Measuring flat and solid shapes, and choosing appropriate units.",
                    duration_weeks: 3,
                    sequence_order: 2,
                    subject_name: "Mathematics",
                    linked_goal_id: "cg-3",
                    learning_objectives: [
                      { id: "lo-10", sequence: 1, description: "Select the right unit and formula for lengths, areas and volumes." },
                      { id: "lo-11", sequence: 2, description: "Compute volume of cuboids built from unit cubes." },
                    ],
                    content: [],
                    teaching_guidance: [],
                    lessons: [],
                  },
                ],
              },
              {
                id: "unit-data",
                name: "Data",
                topics: [
                  {
                    id: "t-stats",
                    name: "Statistics & Probability",
                    description: "Reading data critically and reasoning about chance.",
                    duration_weeks: 2,
                    sequence_order: 1,
                    subject_name: "Mathematics",
                    linked_goal_id: "cg-3",
                    learning_objectives: [
                      { id: "lo-12", sequence: 1, description: "Interpret charts and spot misleading representations." },
                      { id: "lo-13", sequence: 2, description: "Describe the likelihood of everyday events in fractions." },
                    ],
                    content: [],
                    teaching_guidance: [],
                    lessons: [],
                  },
                ],
              },
            ],
},
          ],
        },
      ],
    },
  {
    id: "cur-g5",
    name: "Mathematics — Grade 5",
    year: 2026,
    is_published: false,
    published_at: null,
    curriculum_goals: [
      { id: "cg-g5-1", description: "Solidify place value and whole-number operations to 1 000 000." },
    ],
    grades: [
      {
        id: "gr-5",
        name: "Grade 5",
        terms: [
          {
            id: "term-g5-1",
            name: "Term 1",
            units: [
              {
                id: "unit-g5-place",
                name: "Whole Numbers",
                topics: [
                  {
                    id: "t-g5-place",
                    name: "Place Value",
                    description: "Reading, writing and rounding large numbers.",
                    duration_weeks: 2,
                    sequence_order: 1,
                    subject_name: "Mathematics",
                    linked_goal_id: "cg-g5-1",
                    learning_objectives: [
                      { id: "lo-g5-1", sequence: 1, description: "Partition numbers up to 1 000 000." },
                      { id: "lo-g5-2", sequence: 2, description: "Round to specified place values." },
                    ],
                    content: [],
                    teaching_guidance: [],
                    lessons: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const mockSyllabi: MockSyllabus[] = [
  {
    id: "sy-1",
    curriculum_id: "cur-g6",
    curricula: { name: "Mathematics — Grade 6", year: 2026 },
    grading_policy: {
      pass_mark: 50,
      grade_breakdown: [
        { label: "Tests & quizzes", weight_pct: 50 },
        { label: "Projects", weight_pct: 25 },
        { label: "Homework & participation", weight_pct: 25 },
      ],
    },
    required_materials: "Textbook chapters 1–3\nDrawing compass and protractor\nA4 exercise book",
    office_hours: "Tuesdays & Thursdays, 3:00–4:00 PM",
    classroom_expectations:
      "Bring materials to every lesson. Show your working in pencils. Ask a peer before your teacher on drills.",
    instructor_notes: "Learners on the bridge track get a lighter homework load in Week 1 while equivalence gaps close.",
    created_at: "2026-01-18T13:00:00.000Z",
  },
];

export const mockCurriculumEvaluations: MockCurriculumEvaluation[] = [
  { id: "ev-1", curriculum_id: "cur-g6", period: "2025 Term 3", achievement_rate: 58 },
  { id: "ev-2", curriculum_id: "cur-g6", period: "2026 Term 1", achievement_rate: 42 },
];

export const mockPendingEdits: MockPendingEdit[] = [
  {
    id: "pe-1",
    space_id: "sp-maths",
    created_at: "2026-02-14T15:30:00.000Z",
    edited_by: "usr-grace",
    edited_by_name: "Grace Adeyemi",
    status: "pending",
    changes: {
      description:
        "Add a weekly 'Maths Marketplace' slot where learners price and trade classroom goods.",
    },
  },
];

export const mockInvitationCode: MockInvitationCode = {
  id: "ic-1",
  space_id: "sp-maths",
  code: "MATHLAB",
  role: "learner",
  max_uses: 25,
  used_count: 18,
  expires_at: null,
  grade_id: "gr-6",
};

export const mockProjects: MockProject[] = [
  {
    id: "pr-1",
    unit_id: "unit-frac",
    title: "The Fraction Cookbook",
    description:
      "Scale a real family recipe up from 4 servings to 50, converting every quantity to fractions and decimals.",
  },
];

// ---------------------------------------------------------------
// Convenience selectors
// ---------------------------------------------------------------

export function getMathsSpace(): MockSpace {
  return mockSpaces[0];
}

export function getPublishedCurriculum(): MockCurriculumTree {
  return mockCurricula[0];
}

export function getDraftCurriculum(): MockCurriculumTree {
  return mockCurricula[1];
}

export function getAllTopics(tree: MockCurriculumTree): MockTopic[] {
  return tree.grades.flatMap((grade) =>
    grade.terms.flatMap((term) =>
      term.units.flatMap((unit) => unit.topics),
    ),
  );
}

export function getTopicById(topicId: string): MockTopic | undefined {
  return getAllTopics(mockCurricula[0]).find((topic) => topic.id === topicId);
}

export function getAllLessons(tree: MockCurriculumTree): MockLesson[] {
  return getAllTopics(tree).flatMap((topic) => topic.lessons);
}

export function getSpaceById(spaceId: string): MockSpace | undefined {
  return mockSpaces.find((space) => space.id === spaceId);
}

// ---------------------------------------------------------------
// Cycle 1 — National curriculum reference standard
//
// These tables are not in the schema yet; the shapes match the
// cycle-1 design (curriculum_templates → template_subjects /
// template_levels → curriculum_syllabi → curriculum_outcomes →
// outcome_indicators) so the preview can later be wired to real
// server queries without UI changes. Content mirrors a mock
// Uganda Primary One Mathematics syllabus.
// ---------------------------------------------------------------

export type MockTemplateStatus = "draft" | "published" | "archived";

export type MockCompetenceType = "knowledge" | "skill" | "attitude" | "value";

/**
 * The four universal components of a curriculum document — the fixed
 * skeleton both structure types (subject-based and thematic) render from.
 * Mirrors "curriculum anatomy" in the cycle-1 design and, later, the
 * `curriculum_templates` → `curriculum_template_sections` schema.
 */
export type MockCurriculumComponentId =
  | "intent"
  | "content"
  | "learning_teaching"
  | "assessment";

export interface MockNationalTemplate {
  id: string;
  name: string;
  code: string;
  country: string;
  year: number;
  version: string;
  status: MockTemplateStatus;
  national_aims: string[] | null;
  aims_of_primary_education: string[] | null;
  values_text: string | null;
  generic_skills: string[] | null;
  cross_cutting_issues: string[] | null;
  pedagogy_text: string | null;
  assessment_requirements: {
    continuous_assessment: string;
    examinations: string;
    promotion_rules: string;
  } | null;
  time_allocation: { subject: string; weekly_minutes: number }[] | null;
  approved_materials: string[] | null;
  published_at: string | null;
  created_by: string;
}

export interface MockTemplateSubject {
  id: string;
  template_id: string;
  name: string;
  code: string;
  sequence: number;
}

export interface MockTemplateLevel {
  id: string;
  template_id: string;
  name: string;
  sequence: number;
}

export interface MockNationalSyllabus {
  id: string;
  template_id: string;
  subject_id: string;
  level_id: string;
  code: string;
  title: string;
  time_allocation: string | null;
  assessment_requirements: string | null;
  pedagogy_notes: string | null;
  approved_materials: string[] | null;
  teaching_strategies: string[] | null;
  typical_activities: string[] | null;
  assessment_plan: MockSyllabusAssessment[] | null;
}

/** A scope-and-sequence row: a topic taught within one national syllabus. */
export interface MockSyllabusTopic {
  id: string;
  syllabus_id: string;
  code: string;
  title: string;
  description: string | null;
  duration_weeks: number | null;
  sequence: number;
}

export type MockSyllabusAssessmentType =
  | "continuous_assessment"
  | "examination"
  | "project"
  | "portfolio"
  | "observation";

export interface MockSyllabusAssessment {
  id: string;
  syllabus_id: string;
  type: MockSyllabusAssessmentType;
  title: string;
  weight_pct: number | null;
  when: string | null;
  description: string;
}

export interface MockOutcomeIndicator {
  id: string;
  sequence: number;
  description: string;
}

export interface MockCurriculumOutcome {
  id: string;
  syllabus_id: string;
  code: string;
  description: string;
  competence_type: MockCompetenceType;
  sequence: number;
  indicators: MockOutcomeIndicator[];
}

export interface MockSyllabusView extends MockNationalSyllabus {
  subject: MockTemplateSubject | null;
  level: MockTemplateLevel | null;
  outcomes: MockCurriculumOutcome[];
}

export const mockNationalTemplates: MockNationalTemplate[] = [
  {
    id: "nat-upe",
    name: "Uganda Primary Curriculum",
    code: "NCDC-UPE-PRI",
    country: "Uganda",
    year: 2026,
    version: "2.0",
    status: "published",
    national_aims: NATIONAL_AIMS,
    aims_of_primary_education: AIMS_OF_PRIMARY_EDUCATION,
    values_text:
      "The curriculum is anchored on national values: love and respect, integrity and honesty, hard work, unity and patriotism, tolerance, self-discipline, spirituality, and caring for the family and community.",
    generic_skills: [
      "Critical thinking",
      "Creativity and innovation",
      "Communication",
      "Collaboration and teamwork",
      "Problem solving",
      "Self-management",
      "Digital literacy",
    ],
    cross_cutting_issues: [
      "Gender equality",
      "Environment and climate change",
      "Inclusive education and disability",
      "ICT integration",
      "Adolescence education",
      "Human rights and values",
      "Life skills",
    ],
    pedagogy_text:
      "Learner-centred methods are recommended: activity-based learning, play and exploration in Lower Primary, group work, discussion, demonstration, use of locally available materials, and continuous questioning that links content to the learner's environment.",
    assessment_requirements: {
      continuous_assessment:
        "School-based continuous assessment across every term counts 30% of the final mark.",
      examinations:
        "Termly school examinations are administered in Terms 1, 2 and 3.",
      promotion_rules:
        "Promotion to the next class requires a pass of at least 40% in the core subjects (English, Mathematics, Science and Social Studies).",
    },
    time_allocation: [
      { subject: "English", weekly_minutes: 200 },
      { subject: "Mathematics", weekly_minutes: 200 },
      { subject: "Local Language", weekly_minutes: 150 },
      { subject: "Science", weekly_minutes: 120 },
      { subject: "Social Studies", weekly_minutes: 120 },
      { subject: "Religious Education", weekly_minutes: 90 },
      { subject: "Creative Arts", weekly_minutes: 90 },
      { subject: "Physical Education", weekly_minutes: 120 },
    ],
    approved_materials: [
      "NCDC Primary Mathematics Pupil's Book P1",
      "NCDC activity packs",
      "Counters, number charts and number lines",
      "Local counting materials (bottle tops, seeds, sticks)",
      "NCDC teacher's guides",
    ],
    published_at: "2026-02-10T08:00:00.000Z",
    created_by: "usr-super",
  },
  {
    id: "nat-use",
    name: "Uganda Secondary Curriculum",
    code: "NCDC-UCE-SEC",
    country: "Uganda",
    year: 2026,
    version: "0.9",
    status: "draft",
    national_aims: NATIONAL_AIMS,
    aims_of_primary_education: null,
    values_text:
      "Values continue from the primary cycle with a stronger emphasis on critical citizenship and vocational readiness.",
    generic_skills: [
      "Critical thinking",
      "Creativity and innovation",
      "Communication",
      "Collaboration and teamwork",
      "Problem solving",
      "Digital literacy",
    ],
    cross_cutting_issues: [
      "Gender equality",
      "Entrepreneurship education",
      "ICT integration",
      "Career guidance",
    ],
    pedagogy_text:
      "Inquiry- and project-based learning, with subject integration and opportunities for self-directed study.",
    assessment_requirements: {
      continuous_assessment:
        "Continuous assessment counts 20% of the final grade.",
      examinations: "National examinations are set by UNEB at the end of the cycle.",
      promotion_rules:
        "Learners sit school-based examinations at the end of each term.",
    },
    time_allocation: [
      { subject: "Mathematics", weekly_minutes: 240 },
      { subject: "English", weekly_minutes: 240 },
      { subject: "Science", weekly_minutes: 240 },
      { subject: "Humanities", weekly_minutes: 200 },
    ],
    approved_materials: ["NCDC secondary learner's books", "UNEB past papers"],
    published_at: null,
    created_by: "usr-super",
  },
  {
    id: "nat-upe-2020",
    name: "Uganda Primary Curriculum (v1)",
    code: "NCDC-UPE-PRI-2020",
    country: "Uganda",
    year: 2020,
    version: "1.0",
    status: "archived",
    national_aims: null,
    aims_of_primary_education: null,
    values_text: "Superseded by the 2026 competence-based revision.",
    generic_skills: ["Critical thinking", "Problem solving", "Communication"],
    cross_cutting_issues: ["Gender equality", "Environment", "Life skills"],
    pedagogy_text: "Teacher-centred thematic instruction.",
    assessment_requirements: {
      continuous_assessment: "Termly tests only.",
      examinations: "Annual end-of-year examinations.",
      promotion_rules: "Pass mark 50% across core subjects.",
    },
    time_allocation: [{ subject: "Mathematics", weekly_minutes: 160 }],
    approved_materials: ["NCDC Primary Mathematics Pupil's Book (2020 edition)"],
    published_at: "2020-03-01T08:00:00.000Z",
    created_by: "usr-super",
  },
];

export const mockTemplateSubjects: MockTemplateSubject[] = [
  { id: "ts-math", template_id: "nat-upe", name: "Mathematics", code: "MATH", sequence: 1 },
  { id: "ts-eng", template_id: "nat-upe", name: "English", code: "ENG", sequence: 2 },
  { id: "ts-sci", template_id: "nat-upe", name: "Science", code: "SCI", sequence: 3 },
  { id: "ts-sst", template_id: "nat-upe", name: "Social Studies", code: "SST", sequence: 4 },
  { id: "ts-re", template_id: "nat-upe", name: "Religious Education", code: "RE", sequence: 5 },
  { id: "ts-ll", template_id: "nat-upe", name: "Local Language", code: "LL", sequence: 6 },
  { id: "ts-art", template_id: "nat-upe", name: "Creative Arts", code: "ART", sequence: 7 },
  { id: "ts-pe", template_id: "nat-upe", name: "Physical Education", code: "PE", sequence: 8 },
];

export const mockTemplateLevels: MockTemplateLevel[] = Array.from(
  { length: 7 },
  (_, index) => ({
    id: `tl-p${index + 1}`,
    template_id: "nat-upe",
    name: `Primary ${index + 1}`,
    sequence: index + 1,
  }),
);

export const mockNationalSyllabi: MockNationalSyllabus[] = [
  {
    id: "syb-p1-math",
    template_id: "nat-upe",
    subject_id: "ts-math",
    level_id: "tl-p1",
    code: "UPE-P1-MATH",
    title: "Primary One Mathematics",
    time_allocation: "3 periods × 40 minutes per week (120 minutes)",
    assessment_requirements:
      "Continuous assessment plus a termly written test; oral and practical observation recorded per topic.",
    pedagogy_notes:
      "Concrete materials first, then pictorial, then abstract; play-based counting games; pair work; link every concept to the learner's home environment.",
    approved_materials: [
      "NCDC Primary One Mathematics Pupil's Book",
      "Counters, number charts and number lines",
      "Local materials: bottle tops, seeds and sticks",
    ],
    teaching_strategies: [
      "Concrete → pictorial → abstract progression for every concept",
      "Play-based counting games and number rhymes",
      "Pair work and small-group sorting activities",
      "Link every concept to the learner's home and community",
    ],
    typical_activities: [
      "Counting bottle tops, seeds and sticks into sets",
      "Class 'number walk' collecting objects in the school compound",
      "Sorting stations by size, shape and colour",
      "Oral number games with instant peer feedback",
      "Daily calendar and time routines",
      "Pattern making with beads, leaves and stones",
    ],
    assessment_plan: [
      {
        id: "ap-p1m-1",
        syllabus_id: "syb-p1-math",
        type: "observation",
        title: "Oral & practical observation",
        weight_pct: null,
        when: "Recorded per topic across the term",
        description:
          "The teacher notes each learner's counting, sorting and describing competences during normal class activity.",
      },
      {
        id: "ap-p1m-2",
        syllabus_id: "syb-p1-math",
        type: "continuous_assessment",
        title: "Skills check-lists",
        weight_pct: 40,
        when: "Weekly",
        description:
          "On-syllabus check-lists tracking the measurable indicators for each outcome (e.g. bundle sticks into tens).",
      },
      {
        id: "ap-p1m-3",
        syllabus_id: "syb-p1-math",
        type: "examination",
        title: "Termly written test",
        weight_pct: 60,
        when: "End of Terms 1, 2 and 3",
        description:
          "A short written test covering the term's outcomes, set from the syllabus indicators.",
      },
    ],
  },
  {
    id: "syb-p1-eng",
    template_id: "nat-upe",
    subject_id: "ts-eng",
    level_id: "tl-p1",
    code: "UPE-P1-ENG",
    title: "Primary One English",
    time_allocation: "5 periods × 40 minutes per week (200 minutes)",
    assessment_requirements:
      "Oral assessment recorded each term with a simple written end-of-term test.",
    pedagogy_notes:
      "Listening and speaking first, then reading and writing; storytelling, songs and rhymes reinforce vocabulary.",
    approved_materials: [
      "NCDC Primary One English Pupil's Book",
      "Alphabet charts and picture cards",
    ],
    teaching_strategies: [
      "Listening and speaking before reading and writing",
      "Storytelling, songs, rhymes and games to fix vocabulary",
      "Total physical response for commands and instructions",
    ],
    typical_activities: [
      "Rhyme and song corners",
      "Picture talk then two-sentence retelling",
      "Alphabet tracing and letter hunts",
      "Acting out short dialogues",
    ],
    assessment_plan: [
      {
        id: "ap-p1e-1",
        syllabus_id: "syb-p1-eng",
        type: "observation",
        title: "Oral observation",
        weight_pct: null,
        when: "Recorded each term",
        description:
          "Learner chats and retellings assessed against the listening/speaking outcomes.",
      },
      {
        id: "ap-p1e-2",
        syllabus_id: "syb-p1-eng",
        type: "examination",
        title: "Simple written end-of-term test",
        weight_pct: 100,
        when: "End of each term",
        description:
          "Sight words, letter recognition and one short sentence of writing.",
      },
    ],
  },
  {
    id: "syb-p7-math",
    template_id: "nat-upe",
    subject_id: "ts-math",
    level_id: "tl-p7",
    code: "UPE-P7-MATH",
    title: "Primary Seven Mathematics",
    time_allocation: "6 periods × 40 minutes per week (240 minutes)",
    assessment_requirements:
      "Practice on UNEB-style items plus two mock examinations in Term 3.",
    pedagogy_notes:
      "Structured problem solving, worked examples then independent practice, regular diagnostic tests.",
    approved_materials: [
      "NCDC Primary Seven Mathematics Pupil's Book",
      "UNEB revision papers",
    ],
    teaching_strategies: [
      "Worked example → guided practice → independent practice",
      "UNEB-style item practice",
      "Diagnostic test → targeted remedial cycle",
    ],
    typical_activities: [
      "Timed UNEB-style drills",
      "Error-analysis sessions on diagnostic tests",
      "Data-collection mini-projects (surveys, charts)",
    ],
    assessment_plan: [
      {
        id: "ap-p7m-1",
        syllabus_id: "syb-p7-math",
        type: "examination",
        title: "Mock examinations",
        weight_pct: null,
        when: "Two mocks in Term 3",
        description:
          "Full-length UNEB-style papers, marked against the syllabus indicators.",
      },
      {
        id: "ap-p7m-2",
        syllabus_id: "syb-p7-math",
        type: "continuous_assessment",
        title: "Diagnostic tests",
        weight_pct: null,
        when: "After each topic",
        description:
          "Short diagnostics that drive targeted remedial work before the next topic.",
      },
    ],
  },
];

// Scope and sequence — the topic rows taught within each national syllabus.

export const mockSyllabusTopics: MockSyllabusTopic[] = [
  {
    id: "syt-p1m-1",
    syllabus_id: "syb-p1-math",
    code: "P1MATH-T01",
    title: "Counting and writing numbers",
    description:
      "Counting, reading and writing whole numbers up to 100; grouping into tens and ones.",
    duration_weeks: 8,
    sequence: 1,
  },
  {
    id: "syt-p1m-2",
    syllabus_id: "syb-p1-math",
    code: "P1MATH-T02",
    title: "Addition and subtraction",
    description: "Adding and subtracting whole numbers within 100 using concrete materials.",
    duration_weeks: 8,
    sequence: 2,
  },
  {
    id: "syt-p1m-3",
    syllabus_id: "syb-p1-math",
    code: "P1MATH-T03",
    title: "Shapes and objects around us",
    description: "Naming and describing 2-D shapes and 3-D objects in the environment.",
    duration_weeks: 4,
    sequence: 3,
  },
  {
    id: "syt-p1m-4",
    syllabus_id: "syb-p1-math",
    code: "P1MATH-T04",
    title: "Sorting, comparing and classifying",
    description: "Grouping and ordering objects by size, shape and colour.",
    duration_weeks: 4,
    sequence: 4,
  },
  {
    id: "syt-p1m-5",
    syllabus_id: "syb-p1-math",
    code: "P1MATH-T05",
    title: "Time, days and the calendar",
    description: "Telling o'clock times, ordering the days of the week and using a simple calendar.",
    duration_weeks: 4,
    sequence: 5,
  },
  {
    id: "syt-p1m-6",
    syllabus_id: "syb-p1-math",
    code: "P1MATH-T06",
    title: "Money and simple patterns",
    description: "Recognising coins and notes in common use and extending simple repeating patterns.",
    duration_weeks: 4,
    sequence: 6,
  },
  {
    id: "syt-p1e-1",
    syllabus_id: "syb-p1-eng",
    code: "P1ENG-T01",
    title: "Listening and responding",
    description: "Following simple instructions and retelling short stories.",
    duration_weeks: 6,
    sequence: 1,
  },
  {
    id: "syt-p1e-2",
    syllabus_id: "syb-p1-eng",
    code: "P1ENG-T02",
    title: "Alphabet and sight words",
    description: "Reading and writing letters of the alphabet and the first sight words.",
    duration_weeks: 8,
    sequence: 2,
  },
  {
    id: "syt-p1e-3",
    syllabus_id: "syb-p1-eng",
    code: "P1ENG-T03",
    title: "Speaking and communication",
    description: "Communicating ideas in short spoken sentences with polite forms.",
    duration_weeks: 6,
    sequence: 3,
  },
  {
    id: "syt-p7m-1",
    syllabus_id: "syb-p7-math",
    code: "P7MATH-T01",
    title: "Whole numbers and decimals",
    description: "Applying whole-number and decimal operations to real-life problems.",
    duration_weeks: 10,
    sequence: 1,
  },
  {
    id: "syt-p7m-2",
    syllabus_id: "syb-p7-math",
    code: "P7MATH-T02",
    title: "Data, tables and graphs",
    description: "Reading, interpreting and constructing bar charts and pictographs.",
    duration_weeks: 6,
    sequence: 2,
  },
];

export const mockCurriculumOutcomes: MockCurriculumOutcome[] = [
  {
    id: "no-p1m-1",
    syllabus_id: "syb-p1-math",
    code: "P1MATH01",
    description: "Count, read and write whole numbers up to 100.",
    competence_type: "knowledge",
    sequence: 1,
    indicators: [
      {
        id: "ni-p1m-1-1",
        sequence: 1,
        description: "Count objects up to 20 accurately, one by one.",
      },
      {
        id: "ni-p1m-1-2",
        sequence: 2,
        description: "Read and write numerals from 1 to 100.",
      },
      {
        id: "ni-p1m-1-3",
        sequence: 3,
        description: "Match a collection of objects to its correct numeral.",
      },
    ],
  },
  {
    id: "no-p1m-2",
    syllabus_id: "syb-p1-math",
    code: "P1MATH02",
    description: "Group objects into tens and ones using concrete materials.",
    competence_type: "skill",
    sequence: 2,
    indicators: [
      {
        id: "ni-p1m-2-1",
        sequence: 1,
        description: "Bundle sticks into groups of ten from collections up to 100.",
      },
      {
        id: "ni-p1m-2-2",
        sequence: 2,
        description: "State the number of tens and ones a number has.",
      },
    ],
  },
  {
    id: "no-p1m-3",
    syllabus_id: "syb-p1-math",
    code: "P1MATH03",
    description: "Add and subtract whole numbers within 100.",
    competence_type: "skill",
    sequence: 3,
    indicators: [
      {
        id: "ni-p1m-3-1",
        sequence: 1,
        description: "Add two one-digit numbers with a sum of at most 20.",
      },
      {
        id: "ni-p1m-3-2",
        sequence: 2,
        description: "Subtract using counters and a number line.",
      },
      {
        id: "ni-p1m-3-3",
        sequence: 3,
        description: "Solve simple oral word problems within 20.",
      },
    ],
  },
  {
    id: "no-p1m-4",
    syllabus_id: "syb-p1-math",
    code: "P1MATH04",
    description: "Identify and describe common 2-D shapes and 3-D objects.",
    competence_type: "knowledge",
    sequence: 4,
    indicators: [
      {
        id: "ni-p1m-4-1",
        sequence: 1,
        description: "Name triangles, squares, rectangles and circles.",
      },
      {
        id: "ni-p1m-4-2",
        sequence: 2,
        description: "Identify spheres, cubes and cylinders in the environment.",
      },
    ],
  },
  {
    id: "no-p1m-5",
    syllabus_id: "syb-p1-math",
    code: "P1MATH05",
    description: "Sort, compare and classify objects by size, shape and colour.",
    competence_type: "skill",
    sequence: 5,
    indicators: [
      {
        id: "ni-p1m-5-1",
        sequence: 1,
        description: "Sort objects into groups by a single attribute.",
      },
      {
        id: "ni-p1m-5-2",
        sequence: 2,
        description: "Compare and order up to three objects by length.",
      },
    ],
  },
  {
    id: "no-p1m-6",
    syllabus_id: "syb-p1-math",
    code: "P1MATH06",
    description: "Tell time, name days of the week and use a simple calendar.",
    competence_type: "skill",
    sequence: 6,
    indicators: [
      {
        id: "ni-p1m-6-1",
        sequence: 1,
        description: "Recite the days of the week in order.",
      },
      {
        id: "ni-p1m-6-2",
        sequence: 2,
        description: "Read o'clock times on an analogue clock.",
      },
    ],
  },
  {
    id: "no-p1m-7",
    syllabus_id: "syb-p1-math",
    code: "P1MATH07",
    description: "Recognise coins and describe simple repeating patterns.",
    competence_type: "knowledge",
    sequence: 7,
    indicators: [
      {
        id: "ni-p1m-7-1",
        sequence: 1,
        description: "Name the coins and notes in common use.",
      },
      {
        id: "ni-p1m-7-2",
        sequence: 2,
        description: "Extend a simple colour or shape pattern by two terms.",
      },
    ],
  },
  {
    id: "no-p1m-8",
    syllabus_id: "syb-p1-math",
    code: "P1MATH08",
    description: "Demonstrate confidence and persistence when working with numbers.",
    competence_type: "attitude",
    sequence: 8,
    indicators: [
      {
        id: "ni-p1m-8-1",
        sequence: 1,
        description: "Attempt a task again after an error without giving up.",
      },
      {
        id: "ni-p1m-8-2",
        sequence: 2,
        description: "Explain how numbers are used at home and in the community.",
      },
    ],
  },
  {
    id: "no-p1e-1",
    syllabus_id: "syb-p1-eng",
    code: "P1ENG01",
    description: "Listen, respond and follow simple instructions and stories.",
    competence_type: "skill",
    sequence: 1,
    indicators: [
      {
        id: "ni-p1e-1-1",
        sequence: 1,
        description: "Follow a two-step spoken instruction.",
      },
      {
        id: "ni-p1e-1-2",
        sequence: 2,
        description: "Retell a short story in three sentences.",
      },
    ],
  },
  {
    id: "no-p1e-2",
    syllabus_id: "syb-p1-eng",
    code: "P1ENG02",
    description: "Read and write letters of the alphabet and common sight words.",
    competence_type: "knowledge",
    sequence: 2,
    indicators: [
      {
        id: "ni-p1e-2-1",
        sequence: 1,
        description: "Say the alphabet from A to Z.",
      },
      {
        id: "ni-p1e-2-2",
        sequence: 2,
        description: "Read and write the first 60 sight words.",
      },
    ],
  },
  {
    id: "no-p1e-3",
    syllabus_id: "syb-p1-eng",
    code: "P1ENG03",
    description: "Communicate ideas in short spoken sentences.",
    competence_type: "skill",
    sequence: 3,
    indicators: [
      {
        id: "ni-p1e-3-1",
        sequence: 1,
        description: "Greet and respond using polite forms.",
      },
      {
        id: "ni-p1e-3-2",
        sequence: 2,
        description: "Describe a picture in two or three sentences.",
      },
    ],
  },
  {
    id: "no-p7m-1",
    syllabus_id: "syb-p7-math",
    code: "P7MATH01",
    description: "Apply whole-number and decimal operations to real-life problems.",
    competence_type: "skill",
    sequence: 1,
    indicators: [
      {
        id: "ni-p7m-1-1",
        sequence: 1,
        description: "Add, subtract, multiply and divide decimals to two places.",
      },
      {
        id: "ni-p7m-1-2",
        sequence: 2,
        description: "Interpret the result of a calculation in a word problem.",
      },
    ],
  },
  {
    id: "no-p7m-2",
    syllabus_id: "syb-p7-math",
    code: "P7MATH02",
    description: "Use and interpret data presented in tables, graphs and charts.",
    competence_type: "skill",
    sequence: 2,
    indicators: [
      {
        id: "ni-p7m-2-1",
        sequence: 1,
        description: "Read values from a bar chart and pictograph.",
      },
      {
        id: "ni-p7m-2-2",
        sequence: 2,
        description: "Construct a bar chart from a short table of results.",
      },
    ],
  },
];

// Convenience selectors for the cycle-1 preview.

export function getTemplateById(
  templateId: string,
): MockNationalTemplate | undefined {
  return mockNationalTemplates.find((template) => template.id === templateId);
}

export function getSubjectsForTemplate(
  templateId: string,
): MockTemplateSubject[] {
  return mockTemplateSubjects
    .filter((subject) => subject.template_id === templateId)
    .sort((a, b) => a.sequence - b.sequence);
}

export function getLevelsForTemplate(templateId: string): MockTemplateLevel[] {
  return mockTemplateLevels
    .filter((level) => level.template_id === templateId)
    .sort((a, b) => a.sequence - b.sequence);
}

export function getOutcomesForSyllabus(
  syllabusId: string,
): MockCurriculumOutcome[] {
  return mockCurriculumOutcomes
    .filter((outcome) => outcome.syllabus_id === syllabusId)
    .sort((a, b) => a.sequence - b.sequence);
}

export function getTopicsForSyllabus(
  syllabusId: string,
): MockSyllabusTopic[] {
  return mockSyllabusTopics
    .filter((topic) => topic.syllabus_id === syllabusId)
    .sort((a, b) => a.sequence - b.sequence);
}

export function getSyllabusViewById(
  syllabusId: string,
): MockSyllabusView | undefined {
  const syllabus = mockNationalSyllabi.find((row) => row.id === syllabusId);
  if (!syllabus) return undefined;
  return {
    ...syllabus,
    subject:
      mockTemplateSubjects.find(
        (subject) => subject.id === syllabus.subject_id,
      ) ?? null,
    level:
      mockTemplateLevels.find((level) => level.id === syllabus.level_id) ?? null,
    outcomes: getOutcomesForSyllabus(syllabus.id),
  };
}

export function getSyllabiForTemplate(templateId: string): MockSyllabusView[] {
  return mockNationalSyllabi
    .filter((syllabus) => syllabus.template_id === templateId)
    .map((syllabus) => getSyllabusViewById(syllabus.id))
    .filter((view): view is MockSyllabusView => view !== undefined);
}

// ----------------------------------------------------------------
// Draft factory — national template (document onboarding)
// ----------------------------------------------------------------
//
// Seeds a brand-new MockNationalTemplate for the "New template" flow.
// All four anatomy components are empty (null) so the document lands as
// status "draft" with a 0/4 coverage gauge and "awaiting transcription"
// empty states in every tab — the identity + source metadata describing
// the PDF the transcription pipeline (Phase C extraction) will later fill.
// `id` is derived from the code so the catalog/detail selectors pick it up.

export function createNationalTemplateDraft(input: {
  name: string;
  code: string;
  country?: string;
  issuer?: string;
  year: number;
  levels: string[];
}): MockNationalTemplate {
  const id = `nat-${input.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return {
    id,
    name: input.name,
    code: input.code.toUpperCase(),
    country: input.country ?? "Uganda",
    year: input.year,
    version: "1.0",
    status: "draft",
    national_aims: null,
    aims_of_primary_education: null,
    values_text: null,
    generic_skills: null,
    cross_cutting_issues: null,
    pedagogy_text: null,
    assessment_requirements: null,
    time_allocation: null,
    approved_materials: [],
    published_at: null,
    created_by: "Super admin",
  };
}