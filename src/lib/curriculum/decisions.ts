// The choices the national curriculum leaves to the school. Shared by the
// decisions form (client) and the server action that validates and saves them.

export type DecisionKey =
  | "language_of_instruction"
  | "religious_education"
  | "competence_recording"
  | "parent_reports";

export type DecisionOption = { value: string; label: string };

export type DecisionDefinition = {
  key: DecisionKey;
  title: string;
  question: string;
  /** Which national rules to quote above the choice. */
  ruleGroup?: "language" | "assessment";
  /** Fixed rule text when there is no matching rule row. */
  ruleText?: string;
  options: DecisionOption[];
  detail?: {
    /** The option value that needs the extra detail. */
    whenValue: string;
    label: string;
    placeholder: string;
  };
};

export const DECISIONS: DecisionDefinition[] = [
  {
    key: "language_of_instruction",
    title: "Language of instruction",
    question: "Which language will your teachers teach in?",
    ruleGroup: "language",
    options: [
      { value: "local", label: "A local language" },
      {
        value: "english",
        label: "English (only if no local language predominates)",
      },
    ],
    detail: {
      whenValue: "local",
      label: "Which local language?",
      placeholder: "e.g. Luganda",
    },
  },
  {
    key: "religious_education",
    title: "Religious Education offered",
    question: "Which religious education will you offer?",
    ruleText:
      "Religious Education gets 3 periods a week and is kept separate from the themes. Christian (CRE) and Islamic (IRE) programmes are both provided by the curriculum.",
    options: [
      { value: "cre", label: "Christian Religious Education" },
      { value: "ire", label: "Islamic Religious Education" },
      { value: "both", label: "Both, by learners' faith" },
    ],
  },
  {
    key: "competence_recording",
    title: "How competences are recorded",
    question: "How will teachers record what each learner can do?",
    ruleGroup: "assessment",
    options: [
      {
        value: "checklist_and_chart",
        label: "Learner check-list and a class progress chart (national approach)",
      },
      { value: "checklist_only", label: "Learner check-list only" },
    ],
  },
  {
    key: "parent_reports",
    title: "Reports to parents",
    question: "How often will parents receive a report?",
    ruleText:
      "The curriculum asks for regular reports to learners and parents. It does not fix how often.",
    options: [
      { value: "monthly", label: "Every month" },
      { value: "termly", label: "Every term" },
      { value: "twice_termly", label: "Twice a term" },
    ],
  },
];

export const DECISION_KEYS = DECISIONS.map((d) => d.key);

export function findDecision(key: string): DecisionDefinition | undefined {
  return DECISIONS.find((d) => d.key === key);
}

/** Returns an error message, or null when the choice is valid. */
export function validateDecision(
  key: string,
  value: string,
  detail: string,
): string | null {
  const def = findDecision(key);
  if (!def) return "Unknown decision.";
  if (!def.options.some((o) => o.value === value)) return "Choose one of the options.";
  if (def.detail && value === def.detail.whenValue) {
    if (detail.trim().length < 2) return `${def.detail.label} is required.`;
    if (detail.length > 80) return "Keep the language name under 80 characters.";
  }
  return null;
}

export function optionLabel(def: DecisionDefinition, value: string): string {
  return def.options.find((o) => o.value === value)?.label ?? value;
}
