// Mock-data layer for the Thematic Curriculum (P1–P3) arm of the
// cycle-1 super-admin preview.
//
// The Uganda lower-primary cycle publishes ONE thematic curriculum
// document per level — Primary 1 (2006, reprinted 2016), Primary 2 and
// Primary 3 (May 2008, ISBN 978-9970-117-05-5) — each with its own 12
// themes → 36 sub-themes (one per teaching week), its own learning
// outcomes, and even its own weekly allocation (P1 = 40 periods with
// "News"; P3 = 50 periods with "Oral Literature", Library, and heavier
// Mathematics/English). The Thematic tab therefore maintains a catalog
// of documents keyed by (level, edition) + workflow status, mirroring the
// National Templates tab.
//
// P1 Themes 1–3 are transcribed faithfully from the source (fidelity
// "mirrored"); the remaining themes are real titles only (fidelity
// "outline"). P3 is included with its real header, framework and 12 real
// theme titles (outline). P2 is a draft placeholder awaiting the source
// document. The exact row/column shapes here are intended to fall out
// of the future `curriculum_templates` (structure = thematic) →
// `template_themes` → sub-theme/strand children schema.

export type MockThematicStrandId =
  | "mathematics"
  | "literacy"
  | "english"
  | "creative_performing_arts"
  | "life_skills"
  | "values";

export type MockThematicFidelity = "mirrored" | "outline";

export interface MockThematicStrandBlock {
  strand: MockThematicStrandId;
  /** Sub-column within a strand, e.g. "Listening and speaking" under Literacy. */
  heading: string | null;
  items: string[];
}

export interface MockThematicSubTheme {
  id: string;
  code: string;
  title: string;
  /** The SUB-THEME / CONTENT column. */
  content: string[];
  blocks: MockThematicStrandBlock[];
}

export interface MockThematicGuidelineGroup {
  strand: string;
  items: string[];
}

export interface MockThematicTheme {
  id: string;
  code: string;
  title: string;
  term: number | null;
  weeks: string | null;
  learning_outcome: string | null;
  sub_themes: MockThematicSubTheme[];
  assessment_guidelines: MockThematicGuidelineGroup[];
  fidelity: MockThematicFidelity;
  note?: string;
}

export interface MockThematicLearningArea {
  id: string;
  title: string;
  code: string;
  outcome: string | null;
  organisation: string;
  notes: string[];
  fidelity: MockThematicFidelity;
}

export interface MockThematicPeriodAllocation {
  strand: string;
  periods: number;
  note?: string;
}

export interface MockThematicCurriculum {
  id: string;
  name: string;
  code: string;
  /** Primary level this document governs, e.g. "P1". */
  level: string;
  version: string;
  country: string;
  issuer: string;
  year_note: string;
  edition?: string | null;
  isbn: string | null;
  status: "published" | "draft" | "archived";
  cycles: { code: string; name: string; description: string }[];
  document_note: string;
  national_aims: string[];
  aims_of_primary_education: string[];
  approach: string[];
  medium_of_instruction: string | null;
  period_allocation: MockThematicPeriodAllocation[];
  timetable_notes: string[];
  learning_resources: string[];
  assessment_approach: string[];
  themes: MockThematicTheme[];
  learning_areas: MockThematicLearningArea[];
}

// ---------------------------------------------------------------
// Theme 1: Our School
// ---------------------------------------------------------------

const THEME_1_SUB_THEMES: MockThematicSubTheme[] = [
  {
    id: "p1-theme1-1.1",
    code: "1.1",
    title: "People in our School (Titles and Names)",
    content: [
      "Titles, e.g.: Sir, Madam, teacher, nurse, Mrs, Miss, Mr.",
      "Names, e.g.: Masika, Silvia, Wambi, Daudi",
    ],
    blocks: [
      {
        strand: "mathematics",
        heading: null,
        items: ["Sorting", "Comparing", "Matching", "Counting 1–5 using objects, e.g. stones, pictures"],
      },
      {
        strand: "literacy",
        heading: "Listening and speaking",
        items: [
          "Naming",
          "Identifying",
          "Describing, e.g. pictures of people",
          "Listening to stories",
          "Reciting rhymes about school",
          "Giving and responding to commands",
          "Role-playing: welcoming, greeting and bidding farewell in different situations",
        ],
      },
      {
        strand: "literacy",
        heading: "Pre-reading",
        items: ["Reciting rhymes", "Comparing pictures", "Drawing", "Recognising name tags", "Matching"],
      },
      {
        strand: "literacy",
        heading: "Pre-writing",
        items: ["Drawing", "Scribbling", "Tracing", "Matching", "Completing missing parts", "Making patterns"],
      },
      {
        strand: "english",
        heading: "Vocabulary",
        items: [
          "Greetings: \"Good morning\"",
          "Naming people by title, i.e. Sir, teacher, Mr., Madam (as used in the school)",
          "Reciting rhymes",
          "Referring to people by name and sex, e.g. Wambi, boy, girl",
        ],
      },
      {
        strand: "english",
        heading: "Using structures",
        items: [
          "\"What's your name?\"",
          "\"My name is …\"",
          "\"I am a … (girl/boy)\"",
          "\"What is his/her name?\"",
          "\"His/her name is …\"",
          "\"He / She is …\"",
        ],
      },
      {
        strand: "creative_performing_arts",
        heading: null,
        items: ["Singing / signing songs related to the people in the school", "Singing and dancing", "Modelling", "Drawing"],
      },
      {
        strand: "life_skills",
        heading: null,
        items: [
          "Effective communication",
          "Creative thinking",
          "Problem-solving",
          "Critical thinking",
          "Decision-making",
          "Self-esteem",
          "Mobility, orientation and rehabilitation (SNE)",
        ],
      },
      {
        strand: "values",
        heading: null,
        items: ["Respect", "Identity", "Cooperation", "Appreciation", "Friendliness"],
      },
    ],
  },
  {
    id: "p1-theme1-1.2",
    code: "1.2",
    title: "Things in our School",
    content: ["Buildings", "Classroom objects", "Play objects", "Sign-post"],
    blocks: [
      {
        strand: "mathematics",
        heading: null,
        items: ["Sorting, e.g. objects by shape, size and colour", "Counting 1–5"],
      },
      {
        strand: "literacy",
        heading: "Listening and speaking",
        items: ["Naming, e.g. objects and pictures", "Identifying", "Describing, e.g. objects and pictures", "Role-playing"],
      },
      {
        strand: "literacy",
        heading: "Vocabulary",
        items: [
          "Naming things in the school, e.g. chair, duster, table, desk, bench, chalkboard, window, door, book, pencil, gate, flag",
          "Singing simple songs about things in our school",
          "Reciting simple rhymes",
        ],
      },
      {
        strand: "literacy",
        heading: "Pre-reading",
        items: ["Matching picture to picture", "Matching picture to objects correctly"],
      },
      {
        strand: "literacy",
        heading: "Pre-writing",
        items: ["Drawing", "Scribbling", "Colouring", "Pasting", "Modelling", "Making patterns"],
      },
      {
        strand: "english",
        heading: "Using structures",
        items: ["\"What's this?\"", "\"This is a …\"", "\"What's that?\"", "\"It's a …\"", "\"Show me a …\""],
      },
      {
        strand: "creative_performing_arts",
        heading: null,
        items: ["Singing simple traditional songs", "Modelling objects", "Drawing", "Making play items"],
      },
      {
        strand: "life_skills",
        heading: null,
        items: [
          "Friendship formation",
          "Mobility, orientation and rehabilitation (SNE)",
          "Interpersonal relationships",
          "Sharing",
        ],
      },
      {
        strand: "values",
        heading: null,
        items: ["Responsibility", "Care"],
      },
    ],
  },
  {
    id: "p1-theme1-1.3",
    code: "1.3",
    title: "Activities in our School",
    content: [
      "Sweeping",
      "Gardening",
      "Reading",
      "Writing",
      "Playing",
      "Praying",
      "Cleaning",
      "Caring",
      "Teaching",
      "Learning",
    ],
    blocks: [
      {
        strand: "mathematics",
        heading: null,
        items: [
          "Sorting into sets",
          "Counting 1–5",
          "Matching",
          "Sequencing",
          "Adding \"1 more\", e.g. Ø + Ø, ØØ + Ø",
          "Playing number games",
        ],
      },
      {
        strand: "literacy",
        heading: "Listening and speaking",
        items: [
          "Naming, e.g. activities performed at school",
          "Describing",
          "Talking about activities in our school",
          "Asking and answering questions",
          "Role-playing: calls and commands, e.g. go, come, take, stop",
          "Saying tongue twisters",
        ],
      },
      {
        strand: "literacy",
        heading: "Pre-reading",
        items: ["Reciting rhymes", "Comparing", "Matching"],
      },
      {
        strand: "literacy",
        heading: "Pre-writing",
        items: ["Tracing", "Making patterns", "Drawing", "Tearing and pasting", "Colouring / shading"],
      },
      {
        strand: "english",
        heading: "Vocabulary",
        items: ["Naming activities in our school, e.g. sweep, garden, read, write, play, pray, clean, learn"],
      },
      {
        strand: "english",
        heading: "Structures",
        items: [
          "\"What are you doing?\"",
          "\"I am …\"",
          "\"We are …\"",
          "\"What is she/he doing?\"",
          "\"She/he is …\"",
        ],
      },
      {
        strand: "creative_performing_arts",
        heading: null,
        items: [
          "Singing National Anthem",
          "Telling / signing stories",
          "Role-playing",
          "Acting short plays",
          "Singing lullabies",
          "Drawing",
          "Tracing",
          "Colouring",
          "Folding and tearing papers",
        ],
      },
      {
        strand: "life_skills",
        heading: null,
        items: [
          "Self-awareness",
          "Decision-making",
          "Friendship formation",
          "Non-violent conflict resolution",
          "Self-esteem",
          "Coping with stress",
          "Effective communication",
          "Assertiveness",
          "Mobility, orientation and rehabilitation (SNE)",
        ],
      },
      {
        strand: "values",
        heading: null,
        items: ["Patience", "Co-operation", "Unity", "Endurance", "Sharing"],
      },
    ],
  },
];

// ---------------------------------------------------------------
// Theme 2: Our Home
// ---------------------------------------------------------------

const THEME_2_SUB_THEMES: MockThematicSubTheme[] = [
  {
    id: "p1-theme2-2.1",
    code: "2.1",
    title: "People in our Home (Nuclear Family)",
    content: ["Father", "Mother", "Children"],
    blocks: [
      {
        strand: "mathematics",
        heading: null,
        items: [
          "Forming sets",
          "Comparing, e.g. bigger than, smaller than, wider than",
          "Counting things 1-10",
          "Playing number games",
          "Adding orally up to 5 using concrete objects",
          "Measuring height using non-standard units",
          "Recognising and writing number symbols 1-5",
        ],
      },
      {
        strand: "literacy",
        heading: "Listening and speaking",
        items: [
          "Listening to stories about people at home",
          "Naming",
          "Grouping",
          "Talking about",
          "Telling / re-telling / signing stories",
          "Reciting rhymes and prayers",
        ],
      },
      {
        strand: "literacy",
        heading: "Pre-reading and reading",
        items: ["Recognising, e.g. shapes, objects", "Matching", "Sequencing pictures according to size", "Joining puzzles"],
      },
      {
        strand: "literacy",
        heading: "Pre-writing and writing / brailling",
        items: [
          "Writing patterns",
          "Scribbling",
          "Joining dots using lines",
          "Tracing different shapes",
          "Shading",
          "Drawing and copying",
        ],
      },
      {
        strand: "english",
        heading: "Vocabulary",
        items: ["Naming people in our home, e.g. mother, father, baby, sister, brother, girl, boy, woman, man, child"],
      },
      {
        strand: "english",
        heading: "Using structures",
        items: [
          "\"This is my …\"",
          "\"Show me a …\"",
          "\"This is a …\"",
          "\"Point to the …\"",
          "\"I am pointing to the …\"",
        ],
      },
      {
        strand: "creative_performing_arts",
        heading: null,
        items: [
          "Singing / signing",
          "Listening",
          "Acting",
          "Making simple percussion instruments, e.g. shakers, clappers",
          "Modelling",
          "Making colours using locally available materials",
          "Drawing / brailing",
          "Tearing and pasting",
          "Colouring",
          "Shading",
          "Threading",
        ],
      },
      {
        strand: "life_skills",
        heading: null,
        items: [
          "Self-awareness",
          "Self-esteem",
          "Decision-making",
          "Interpersonal relationships",
          "Mobility, orientation and rehabilitation (SNE)",
        ],
      },
      {
        strand: "values",
        heading: null,
        items: ["Identity", "Respect", "Togetherness", "Loyalty"],
      },
    ],
  },
  {
    id: "p1-theme2-2.2",
    code: "2.2",
    title: "Roles / Responsibilities of Different Family Members",
    content: [
      "Cooking",
      "Cleaning",
      "Milking",
      "Washing",
      "Pounding",
      "Grinding",
      "Digging",
      "Peeling",
      "Slashing",
      "Sweeping",
      "Mopping",
      "Breast-feeding",
    ],
    blocks: [
      {
        strand: "mathematics",
        heading: null,
        items: [
          "Sorting different objects according to kind",
          "Forming sets",
          "Counting 1-10",
          "Playing number games",
          "Matching number symbols to pictures 1-5",
          "Filling in missing numbers up to 5, e.g. 1, 2, _, 4, 5",
          "Adding orally up to 5 using concrete objects",
          "Measuring time: morning, afternoon, evening, night",
          "Telling time of the day using natural indicators, e.g. sun, trees, shadows",
          "Measuring shadows according to length relating to time of the day",
        ],
      },
      {
        strand: "literacy",
        heading: "Listening and speaking",
        items: [
          "Identifying",
          "Saying riddles",
          "Naming different activities, e.g. cooking, cleaning, milking, washing",
          "Telling / re-telling / signing stories",
          "Reciting rhymes, tongue twisters",
          "Imitating family roles",
          "Role playing greetings at different times, e.g. morning, afternoon, evening",
        ],
      },
      {
        strand: "literacy",
        heading: "Pre-reading and reading",
        items: ["Describing", "Recognising pictures", "Matching", "Fitting jigsaws", "Drawing straight lines"],
      },
      {
        strand: "literacy",
        heading: "Pre-writing and writing",
        items: ["Scribbling", "Shading", "Writing patterns", "Colouring / painting", "Drawing and copying"],
      },
      {
        strand: "english",
        heading: "Vocabulary",
        items: [
          "Naming roles and responsibilities of different family members, e.g. cook, clean, wash, dig, teach, milk, sweep",
        ],
      },
      {
        strand: "english",
        heading: "Using structures",
        items: ["\"What are you doing?\"", "\"I am …ing\"", "\"What is she/he doing?\"", "\"She/He is …ing\""],
      },
      {
        strand: "creative_performing_arts",
        heading: null,
        items: [
          "Singing / signing",
          "Listening",
          "Decorating",
          "Modelling using local available materials",
          "Drawing",
          "Colouring",
          "Painting",
          "Tearing and pasting",
        ],
      },
      {
        strand: "life_skills",
        heading: null,
        items: [
          "Creative thinking",
          "Critical thinking",
          "Assertiveness",
          "Effective communication",
          "Friendship formation",
          "Interpersonal relationships",
          "Coping with emotions",
          "Self esteem",
          "Mobility, orientation and rehabilitation (SNE)",
        ],
      },
      {
        strand: "values",
        heading: null,
        items: ["Responsibility", "Co-operation", "Endurance", "Unity", "Acceptance", "Appreciation", "Respect", "Patience"],
      },
    ],
  },
  {
    id: "p1-theme2-2.3",
    code: "2.3",
    title: "Things Found in our Home and their Uses",
    content: ["Objects found in our home", "Rooms in the house", "Animals", "Birds", "Plants"],
    blocks: [
      {
        strand: "mathematics",
        heading: null,
        items: [
          "Sorting, e.g. common objects in the home",
          "Drawing shapes: circle, square",
          "Writing number symbols 1-5",
          "Matching number symbols 1-5 to pictures or objects",
          "Adding objects within the range of 5",
          "Recognising that 2 + 3 = 3 + 2 practically using concrete objects, e.g. 2 pencils put together with 3 pencils is the same as 3 pencils put together with 2 pencils (orally)",
        ],
      },
      {
        strand: "literacy",
        heading: "Listening and speaking",
        items: [
          "Saying proverbs / tongue twisters",
          "Imitating animal and bird sounds, e.g. cat, cow",
          "Naming different things found in our home and their uses",
          "Talking about things found in a home",
          "Reciting rhymes and prayers",
          "Telling / re-telling / signing stories about things in our home",
        ],
      },
      {
        strand: "literacy",
        heading: "Vocabulary",
        items: [
          "Naming things found in our home and their uses, e.g. cow, goat, hen, duck, banana plant, mango tree, bird, egg, milk, bed, spoon, fork, plate, cup, red, blue etc.",
        ],
      },
      {
        strand: "literacy",
        heading: "Pre-reading and reading",
        items: [
          "Recognising, e.g. missing parts in pictures and shapes",
          "Matching",
          "Sequencing different objects by size",
          "Fitting jigsaws puzzles",
          "Reading simple words related to animals in the home",
        ],
      },
      {
        strand: "literacy",
        heading: "Pre-writing and writing",
        items: ["Tracing", "Scribbling", "Drawing", "Shading", "Copying", "Writing patterns"],
      },
      {
        strand: "english",
        heading: "Using structures",
        items: ["\"Show me a …\"", "\"This is a …\"", "\"What is this/that?\"", "\"This/that is a …\""],
      },
      {
        strand: "creative_performing_arts",
        heading: null,
        items: [
          "Singing / signing",
          "Role-playing",
          "Movement",
          "Listening",
          "Making play things using local available materials",
          "Drawing",
          "Painting",
          "Cutting and pasting",
        ],
      },
      {
        strand: "life_skills",
        heading: null,
        items: [
          "Interpersonal relationships",
          "Negotiation",
          "Decision-making",
          "Self-awareness",
          "Critical thinking",
          "Creative thinking",
          "Problem solving",
          "Self-esteem",
          "Mobility, orientation and rehabilitation (SNE)",
        ],
      },
      {
        strand: "values",
        heading: null,
        items: ["Sharing", "Responsibility", "Care", "Honesty", "Friendship", "Patience", "Cooperation", "Unity"],
      },
    ],
  },
];

// ---------------------------------------------------------------
// Theme 3: Our Community
// ---------------------------------------------------------------

const THEME_3_SUB_THEMES: MockThematicSubTheme[] = [
  {
    id: "p1-theme3-3.1",
    code: "3.1",
    title: "People in our Community",
    content: ["Doctor", "Teacher", "Nurse", "Shopkeeper", "Carpenter", "Driver", "Policeman", "Barber", "Religious leaders", "LC leaders"],
    blocks: [
      {
        strand: "mathematics",
        heading: null,
        items: [
          "Sorting",
          "Sequencing",
          "Matching",
          "Forming different sets",
          "Counting (1-20)",
          "Writing number symbols 1-9",
          "Filling in missing numbers, e.g. 3, 4, 5, _, 7, 8",
        ],
      },
      {
        strand: "literacy",
        heading: "Listening and speaking",
        items: [
          "Naming people by title, name and gender",
          "Identifying",
          "Listening to folk tales",
          "Telling / re-telling / signing stories",
          "Reciting rhymes",
          "Describing people according to size, height, behaviour, position, title and occupation",
          "Describing pictures of people",
        ],
      },
      {
        strand: "literacy",
        heading: "Pre-reading and reading",
        items: [
          "Matching pictures",
          "Reading pictures",
          "Recognising and reacting to appropriate imperatives (4 commands, e.g. come in, stand up)",
          "Identifying 3 vowel letters within context of known words",
        ],
      },
      {
        strand: "literacy",
        heading: "Pre-writing and writing",
        items: ["Joining dots to form pictures", "Modelling letters", "Tracing", "Copying simple words"],
      },
      {
        strand: "english",
        heading: "Vocabulary",
        items: [
          "Naming people in our community, e.g. boy, girl, man, woman, doctor, nurse, teacher, shopkeeper",
        ],
      },
      {
        strand: "english",
        heading: "Using structures",
        items: [
          "\"Show me …\"",
          "\"This/that is a …\"",
          "\"Who is he / she …?\"",
          "\"He / She is …\"",
          "\"Point to …\"",
          "\"I am pointing to …\"",
        ],
      },
      {
        strand: "creative_performing_arts",
        heading: null,
        items: [
          "Playing situational games related to roles",
          "Imitating",
          "Reciting",
          "Role-playing",
          "Singing / signing",
          "Movement",
          "Drawing",
          "Colouring",
          "Shading",
          "Modelling",
          "Sorting",
        ],
      },
      {
        strand: "life_skills",
        heading: null,
        items: [
          "Effective communication",
          "Self-awareness",
          "Creative thinking",
          "Interpersonal relationships",
          "Problem-solving",
          "Friendship formation",
          "Critical thinking",
          "Mobility, orientation and rehabilitation (SNE)",
        ],
      },
      {
        strand: "values",
        heading: null,
        items: ["Acceptance", "Togetherness", "Respect", "Cooperation", "Unity", "Friendliness", "Identity", "Sympathy", "Responsibility"],
      },
    ],
  },
  {
    id: "p1-theme3-3.2",
    code: "3.2",
    title: "Activities in our Community",
    content: [
      "Fishing",
      "Keeping cattle",
      "Farming",
      "Trading",
      "Building",
      "Washing",
      "Mining",
      "Cultural activities, like (circumcision, marriage)",
    ],
    blocks: [
      {
        strand: "mathematics",
        heading: null,
        items: [
          "Forming sets",
          "Counting (11-20)",
          "Matching",
          "Measuring capacity of containers",
          "Adding numbers orally with sum less than 20",
          "Telling time: days of the week",
          "Recognising the symbols \"+\" and \"=\"",
          "Adding numbers whose sum is less than 10",
        ],
      },
      {
        strand: "literacy",
        heading: "Listening and speaking",
        items: [
          "Naming at least 10 activities",
          "Identifying",
          "Saying tongue-twisters",
          "Telling / signing stories",
          "Fitting jigsaw puzzles",
          "Naming different tools used in different activities, e.g. fishing net",
        ],
      },
      {
        strand: "literacy",
        heading: "Pre-reading and reading",
        items: [
          "Matching",
          "Telling days of the week",
          "Reading and reacting to appropriate imperatives (4 more commands, e.g. go out, sit down)",
        ],
      },
      {
        strand: "literacy",
        heading: "Pre-writing and writing",
        items: ["Scribbling", "Tracing", "Copying", "Writing patterns and letters", "Identifying more vowel letters within context of known words"],
      },
      {
        strand: "english",
        heading: "Vocabulary (verbs)",
        items: ["Naming activities in our community, e.g. fish, plant, harvest, sell, dry, weed"],
      },
      {
        strand: "english",
        heading: "Structures",
        items: [
          "\"What are you doing?\"",
          "\"I am ….\"",
          "\"We are …\"",
          "\"What is he/she doing?\"",
          "\"He/she is …\"",
        ],
      },
      {
        strand: "creative_performing_arts",
        heading: null,
        items: [
          "Singing / signing",
          "Reciting",
          "Role-playing",
          "Telling / re-telling / signing stories",
          "Making movements",
          "Drawing and colouring",
          "Shading",
          "Cutting and pasting",
        ],
      },
      {
        strand: "life_skills",
        heading: null,
        items: [
          "Effective communication",
          "Self-awareness",
          "Decision-making",
          "Friendship formation",
          "Leadership skills",
          "Interpersonal relationships",
          "Creative thinking",
          "Self-esteem",
          "Critical thinking",
          "Mobility, orientation and rehabilitation (SNE)",
        ],
      },
      {
        strand: "values",
        heading: null,
        items: ["Friendliness", "Endurance", "Unity", "Happiness", "Joy", "Cultural identity"],
      },
    ],
  },
  {
    id: "p1-theme3-3.3",
    code: "3.3",
    title: "Important Places in our Community",
    content: ["School", "Hospital", "Post office", "Radio station", "Market", "Places of worship", "Bank", "Police station", "Recreation Centre"],
    blocks: [
      {
        strand: "mathematics",
        heading: null,
        items: [
          "Sorting",
          "Matching",
          "Sequencing",
          "Identifying empty sets and the symbol for \"zero\"",
          "Counting 1-20",
          "Writing number symbols (0-9)",
          "Adding numbers whose sum is less than 5 using a number line",
          "Describing places according to distance using pictographs",
        ],
      },
      {
        strand: "literacy",
        heading: "Listening and speaking",
        items: [
          "Listening to jingles",
          "Identifying",
          "Telling / re-telling / signing stories",
          "Naming different important places in our community",
          "Role-playing situations using polite expressions in informal settings, e.g. market, shop, hospital",
          "Talking about important places, e.g. what is done here and the appearance",
        ],
      },
      {
        strand: "literacy",
        heading: "Vocabulary",
        items: [
          "Naming important places in our community, e.g. post office, hospital, church, mosque, bank, police station, market, shop, home, clinic, well",
        ],
      },
      {
        strand: "literacy",
        heading: "Pre-reading and reading",
        items: [
          "Reciting rhymes",
          "Saying tongue-twisters",
          "Reading pictures",
          "Fitting jigsaws",
          "Matching pictures to words",
          "Reading days of the week",
          "Recognising 4 more words",
          "Recognising simple verbs in present tense",
        ],
      },
      {
        strand: "literacy",
        heading: "Pre-writing and writing",
        items: ["Drawing", "Colouring", "Writing patterns and letters", "Copying simple words", "Tracing"],
      },
      {
        strand: "english",
        heading: "Using structures",
        items: [
          "\"Show me a … (hospital)\"",
          "\"This/that is a …\"",
          "\"What is this/that?\"",
          "\"This/that is …\"",
          "\"What can you see?\"",
          "\"I/We can see a …\"",
          "\"Point to the …\"",
          "\"I am pointing to the …\"",
          "\"Can you see a …?\"",
          "\"Yes, I/We can …\"",
          "\"No, I/We can't …\"",
        ],
      },
      {
        strand: "creative_performing_arts",
        heading: null,
        items: ["Singing / signing", "Miming", "Dancing creatively", "Reciting rhymes", "Modelling", "Drawing", "Colouring", "Shading"],
      },
      {
        strand: "life_skills",
        heading: null,
        items: [
          "Effective communication",
          "Interpersonal relationships",
          "Friendship formation",
          "Non-violent conflict resolution",
          "Mobility, orientation and rehabilitation (SNE)",
          "Decision-making",
          "Critical thinking",
          "Creative thinking",
        ],
      },
      {
        strand: "values",
        heading: null,
        items: ["Care", "Appreciation", "Share", "Loyalty", "Responsibility", "Identity", "Respect", "Cooperation"],
      },
    ],
  },
];

// ---------------------------------------------------------------
// Themes 4–12 (real titles; outline only in this preview)
// ---------------------------------------------------------------

function outlineTheme(
  idPrefix: string,
  code: string,
  title: string,
  note = "Outline only — sub-themes, strand competences and assessment guidelines to be transcribed in the next pass.",
): MockThematicTheme {
  return {
    id: `${idPrefix}-${code}`,
    code,
    title,
    term: null,
    weeks: null,
    learning_outcome: null,
    sub_themes: [],
    assessment_guidelines: [],
    fidelity: "outline",
    note,
  };
}

const THEMES_4_TO_12: MockThematicTheme[] = [
  outlineTheme("p1", "theme4", "The Human Body and Health"),
  outlineTheme("p1", "theme5", "Weather"),
  outlineTheme("p1", "theme6", "Accidents and Safety"),
  outlineTheme("p1", "theme7", "Living Together"),
  outlineTheme("p1", "theme8", "Food and Nutrition"),
  outlineTheme("p1", "theme9", "Our Transport"),
  outlineTheme("p1", "theme10", "Things We Make"),
  outlineTheme("p1", "theme11", "Our Environment"),
  outlineTheme("p1", "theme12", "Peace and Security"),
];

// ---------------------------------------------------------------
// Shared Section A framework (printed, nearly identical, in every
// P1–P3 thematic document)
// ---------------------------------------------------------------

export const NATIONAL_AIMS = [
  "To promote understanding and appreciation of the value of national unity, patriotism and cultural heritage, with due consideration to international relations and beneficial interdependence.",
  "To inculcate moral, ethical and spiritual values in the individual and to develop self-discipline, integrity, tolerance and human fellowship.",
  "To inculcate into Ugandans a sense of service, duty and leadership for participation in civic, social and national affairs through group activities in educational institutions and the community.",
  "To promote scientific, technical and cultural knowledge, skills and attitudes needed to enhance individual and national development.",
  "To eradicate illiteracy and equip the individual with basic skills and knowledge to exploit the environment for self-development as well as national development; for better health, nutrition and family life, and the capacity for continued learning.",
  "To equip the learners with the ability to contribute to the building of an integrated, self-sustaining and independent national economy.",
];

export const AIMS_OF_PRIMARY_EDUCATION = [
  "To enable individuals to acquire functional, permanent and developmental literacy, numeracy and communication skills in English, Kiswahili and, at least, one Uganda Language.",
  "To develop and maintain sound mental and physical health among learners.",
  "To instil the values of living and working cooperatively with other people and caring for others in the community.",
  "To develop and cherish the cultural, moral and spiritual values of life and appreciate the richness that lies in our varied and diverse cultures and values.",
  "To promote understanding and appreciation for the protection and utilisation of the natural environment, using scientific and technological knowledge and skills.",
  "To develop an understanding of one's rights and civic responsibilities and duties for the purpose of positive and responsible participation in civic matters.",
  "To develop a sense of patriotism, nationalism and national unity in diversity.",
  "To develop pre-requisites for continuing education.",
  "To acquire a variety of practical skills for enabling one to make a living in a multi-skilled manner.",
  "To develop an appreciation for the dignity of work and for making a living by one's honest effort.",
  "To equip the child with the knowledge, skills and values of responsible parenthood.",
  "To develop skills in management of time and finance and respect for private and public property.",
  "To develop the ability to use the problem-solving approach in various life situations.",
  "To develop discipline and good manners.",
];

// ---------------------------------------------------------------
// Curriculum document — Primary 1
// ---------------------------------------------------------------

export const mockThematicP1: MockThematicCurriculum = {
  id: "thematic-p1",
  name: "The National Primary School Curriculum for Uganda — Primary 1",
  code: "NCDC-P1-THEMATIC",
  level: "P1",
  version: "1.0",
  country: "Uganda",
  issuer:
    "Ministry of Education, Science, Technology and Sports — National Curriculum Development Centre (NCDC)",
  year_note: "2006 edition, reprinted 2016",
  isbn: "ISBN 978-9970-00-158-3",
  status: "published",
  cycles: [
    {
      code: "Cycle 1",
      name: "Basic skills (P1–P3)",
      description:
        "Thematic curriculum. 12 themes → 36 sub-themes (one per teaching week), taught in the learner's first or familiar language.",
    },
    {
      code: "Cycle 2",
      name: "The transition year (P4)",
      description:
        "Single year changing from theme-based to subject-based, and from local language to English — reorganising content rather than introducing new content.",
    },
    {
      code: "Cycle 3",
      name: "Subject-based (P5–P7)",
      description:
        "Subjects taught and assessed in English. This P1–P3 document's arm is thematic; the subject-syllabus shape lives on the subject-based template.",
    },
  ],
  document_note:
    "The whole P1 national curriculum lives in this single document: 12 themes split into 36 sub-themes (one per teaching week) arranged as a matrix with the learning areas as vertical strands (Mathematics, Literacy, English, Creative Performing Arts, Life Skills & Values), plus CRE, IRE and PE as standalone learning areas that keep the 1999 framework. Each theme closes with its own measurable \"Assessment Guidelines\" table.",
  national_aims: NATIONAL_AIMS,
  aims_of_primary_education: AIMS_OF_PRIMARY_EDUCATION,
  approach: [
    "Thematic: the 12 P1 themes are sub-divided into 36 sub-themes, each providing the basis for one week's teaching and learning.",
    "Content is arranged in a matrix — themes run horizontally while the crucial learning areas run vertically as strands, showing how competences develop as the learner moves from one theme to another.",
    "Literacy and mathematics are prioritised (in response to the curriculum review), with other learning areas introduced through the themes for a carefully graded build-up of competences.",
    "Life skills are presented as a vertical strand so the teacher can relate specific life skills to each theme and sub-theme — not as separate period-based learning areas.",
    "PE and RE are outside the thematic strand and keep the 1999 Volume II framework; RE is attitude- and value-based, organised under 12 content areas to correspond with the 12-theme timetable.",
    "Each day may begin with 30 minutes of News or Story Time, where children bring fresh experiences into the classroom and explore their own local culture and language.",
    "Two Free Activity lessons per week (in a single hour) reinforce the learner-centred approach — often play-based, with teachers free to structure them appropriately.",
  ],
  medium_of_instruction:
    "All P1–P3 learning materials are provided in the child's own or a familiar language; written tests (except English-language-competence assessment) are also in the local language. English is used only where no predominant local or area language exists.",
  period_allocation: [
    { strand: "News", periods: 5 },
    { strand: "Mathematics", periods: 5 },
    { strand: "Literacy I", periods: 5 },
    { strand: "Literacy II", periods: 5 },
    { strand: "English", periods: 5 },
    { strand: "Creative Performing Arts — Music", periods: 3 },
    { strand: "Creative Performing Arts — Art and Crafts", periods: 2 },
    { strand: "Physical Education", periods: 5 },
    { strand: "Religious Education", periods: 3 },
    { strand: "Free Activity", periods: 2 },
  ],
  timetable_notes: [
    "Literacy I and Literacy II lessons should follow one another.",
    "Music and Art & Crafts come under Creative Performing Arts (CPA): 3 periods of Music and 2 of Art & Craft.",
    "The News lesson may generally be the first period of the day; schools should provide 3 News periods and 2 local language periods per week.",
    "The Free Activity lesson should be a double lesson.",
    "Some CPA activities can still be used during free activity periods.",
  ],
  learning_resources: [
    "Flash cards and word/sentence cards",
    "Wall charts",
    "Work cards",
    "Simple readers — both fiction and non-fiction",
    "The children's own written work",
    "Brailed materials (and sign language) for learners with special needs",
    "Locally available counting materials — bottle tops, seeds, sticks",
    "Number charts and number lines",
  ],
  assessment_approach: [
    "Assessment is built into the Thematic Curriculum; the competences to be assessed are shown in the \"Assessment Guidelines\" table at the end of each theme.",
    "Learners are assessed during the normal course of teaching — the teacher should not set separate \"assessment\" tests or examinations.",
    "Teachers keep records for each learner showing competences achieved; assessment is cumulative (a competence missed in one theme may be recorded when achieved later).",
    "Evidence comes from observing learners, listening to them, looking at their exercise books and class work, and marking handwriting.",
    "Keep it simple: check-lists with an easy method of recording that works even in large classes.",
    "Progress charts are displayed where learners (and parents) can see them, alongside learner work with positive comments and regular reports.",
    "The primary purpose is diagnostic and remedial — provide remedial work for learners who lag and more challenging work for high achievers. \"Assessment without remedial support is of little value.\"",
  ],
  themes: [
    {
      id: "p1-theme1",
      code: "Theme 1",
      title: "Our School",
      term: null,
      weeks: null,
      learning_outcome:
        "The learner is able to know, communicate with, and relate to other people harmoniously; show creativity by producing and manipulating learning and play materials available in his/her immediate environment.",
      sub_themes: THEME_1_SUB_THEMES,
      assessment_guidelines: [
        {
          strand: "Mathematics",
          items: [
            "Sort objects or pictures of people by shape and size",
            "Count to 5",
            "Match picture to picture with the same number of items up to 5",
            "Add \"1 more\", e.g. Ø + Ø, ØØ + Ø",
          ],
        },
        {
          strand: "Literacy",
          items: [
            "Listen to others attentively",
            "Tell his/her news appropriately",
            "Tell his/her names logically",
            "Trace and shade with some accuracy",
            "Sit in a proper posture when writing",
            "Hold a pencil appropriately when writing",
            "Use appropriate language in welcoming, greeting and bidding farewell",
          ],
        },
        {
          strand: "Creative Performing Arts",
          items: [
            "Draw shapes and colour them",
            "Model at least one meaningful item",
            "Sing the first two lines of the National Anthem",
            "Play at least one percussion instrument",
            "Sing a song and move to the rhythm",
          ],
        },
        {
          strand: "English",
          items: [
            "Greet one another",
            "Name 5 items in the classroom and pronounce them correctly",
            "Respond to 5 commands appropriately",
            "Introduce oneself and others",
          ],
        },
      ],
      fidelity: "mirrored",
    },
    {
      id: "p1-theme2",
      code: "Theme 2",
      title: "Our Home",
      term: null,
      weeks: null,
      learning_outcome:
        "The learner is able to know and relate to people, identify things in the home, appreciate and participate in home activities.",
      sub_themes: THEME_2_SUB_THEMES,
      assessment_guidelines: [
        {
          strand: "Mathematics",
          items: [
            "Count 1-10",
            "Write and match number symbols 1-5 with pictures / objects",
            "Sort objects by shape",
            "Measure height using non-standard units",
            "Add up to 5 using concrete materials / adding objects within the range 5",
            "Tell different times of day",
          ],
        },
        {
          strand: "Literacy",
          items: [
            "Naming things found in the home and their uses",
            "Describe shapes and objects",
            "Tell a simple story",
            "Trace with accuracy",
            "Draw 2 animals and copy their names",
            "Copy a simple pattern accurately",
            "State at least 2 riddles / proverbs correctly",
          ],
        },
        {
          strand: "Creative Performing Arts",
          items: ["Draw and colour", "Model one item", "Sing a song correctly"],
        },
        {
          strand: "English",
          items: [
            "Identify 4 close members of the family by their names and titles",
            "Name 6 things in the home",
            "Introduce self by name",
            "Use the learnt words and structures correctly",
          ],
        },
      ],
      fidelity: "mirrored",
    },
    {
      id: "p1-theme3",
      code: "Theme 3",
      title: "Our Community",
      term: null,
      weeks: null,
      learning_outcome:
        "The learner is able to know, communicate and relate with other people harmoniously, and identify important places in the community.",
      sub_themes: THEME_3_SUB_THEMES,
      assessment_guidelines: [
        {
          strand: "Mathematics",
          items: [
            "Sort by size and colour",
            "Count 1-20",
            "Match and write number symbols 0 - 9",
            "Add orally using concrete materials to sum less than 20",
            "Comparing capacity of containers using liquids",
            "Draw circles",
            "Interpreting the pictographs",
          ],
        },
        {
          strand: "Literacy",
          items: [
            "Recite rhymes",
            "Retell short stories with confidence",
            "Assemble jigsaws of 2-3 pieces",
            "Tell differences of pictures / objects by shape or colour",
            "Recognise up to 10 words related to family and community",
            "Copy a simple pattern accurately",
            "Recite tongue twisters accurately",
            "Telling days of the week",
          ],
        },
        {
          strand: "Creative Performing Arts",
          items: ["Draw and colour", "Sing songs correctly", "Trace accurately", "Move according to rhythm"],
        },
        {
          strand: "English",
          items: ["Play situational games using words and structures learnt", "Match pictures on flash cards to the chart"],
        },
      ],
      fidelity: "mirrored",
    },
    ...THEMES_4_TO_12,
  ],
  learning_areas: [
    {
      id: "la-cre",
      title: "Christian Religious Education",
      code: "CRE",
      outcome:
        "The learner is able to discover, understand and appreciate God's creation and care for it.",
      organisation:
        "One annual theme — \"Discovering God's Gift to Me\" — with week-based content (e.g. Weeks 2–4, Term 1), arranged as sub-theme → content → competences → life skills → values, with scripture references.",
      notes: [
        "Attitude- and value-based rather than competency-driven; kept outside the thematic strand in response to stakeholder views.",
        "Scope and sequence organised under content areas that correspond to the 12-theme timetable.",
        "Assessment via simple check-lists, e.g. \"Tell his/her name\", \"Tell uses of parts of the body\", \"Demonstrate some ways of personal hygiene\".",
      ],
      fidelity: "outline",
    },
    {
      id: "la-ire",
      title: "Islamic Religious Education",
      code: "IRE",
      outcome:
        "The learner is able to appreciate, and practise the principles and teachings of Islam in order to have total submission to the will and laws of God.",
      organisation:
        "Twelve content-area themes organised by term and week (e.g. Theme 1: Reading from the Quran, Weeks 2–4 Term 1; Theme 11: Fiqh (Practice), Weeks 7–9; Theme 12: Moral and Spiritual Teaching, Weeks 10–12), each with content → competences → life skills → values and its own Assessment Guidelines.",
      notes: [
        "Theme 1 — Reading from the Quran: the Islamic greeting (Salaam) and reciting Surat Al-Fatiha.",
        "Theme 11 — Fiqh (Practice): physical purity, types of water and Tayammum (dry ablution).",
        "Theme 12 — Moral and Spiritual Teaching: cleanliness of the body, clothes and places, plus the History of Islam (Muhammad's trip to Syria).",
      ],
      fidelity: "outline",
    },
    {
      id: "la-pe",
      title: "Physical Education (PE)",
      code: "PE",
      outcome:
        "The learner is able to carry out all actions involving physical movement and play; enjoy and perform different games for lower primary and rhythmical movement; appreciate, endure and control emotions during traditional games and dances; exhibit self-discipline; value fitness and the sensible use of available space; and enjoy healthy competition, teamwork and cooperation.",
      organisation:
        "Five periods per week (statutory). A term-by-term programme that opens with a Week 1 Orientation activity and keeps the framework of the 1999 Volume II curriculum.",
      notes: [
        "Orientation Week (Term 1, Week 1): engaging in play with the teacher, groups and pairs; moving safely in and out of the classroom; introducing special PE play areas and resources; and dressing appropriately for PE.",
        "Emphasis on movement, play, rhythm, emotional control, discipline, fitness, and on preserving traditional games and dances.",
      ],
      fidelity: "outline",
    },
  ],
};

// ---------------------------------------------------------------
// Curriculum document — Primary 2 (placeholder draft)
// ---------------------------------------------------------------

export const mockThematicP2: MockThematicCurriculum = {
  id: "thematic-p2",
  name: "The National Primary School Curriculum for Uganda — Primary 2",
  code: "NCDC-P2-THEMATIC",
  level: "P2",
  version: "0.1",
  country: "Uganda",
  issuer:
    "Ministry of Education and Sports — National Curriculum Development Centre (NCDC)",
  year_note: "Source document not yet uploaded",
  isbn: "TBD",
  status: "draft",
  cycles: [
    {
      code: "Cycle 1",
      name: "Basic skills (P1–P3)",
      description:
        "Thematic curriculum. 12 themes → 36 sub-themes (one per teaching week), taught in the learner's first or familiar language.",
    },
    {
      code: "Cycle 2",
      name: "The transition year (P4)",
      description:
        "Single year changing from theme-based to subject-based, and from local language to English — reorganising content rather than introducing new content.",
    },
    {
      code: "Cycle 3",
      name: "Subject-based (P5–P7)",
      description:
        "Subjects taught and assessed in English. This P1–P3 document's arm is thematic; the subject-syllabus shape lives on the subject-based template.",
    },
  ],
  document_note:
    "Each level of the Uganda lower-primary cycle is published as its own thematic curriculum document. The Primary 2 document has not been transcribed into this preview yet — its row exists so the catalog can track the per-level publishing cycle (draft → piloted → published → archived).",
  national_aims: NATIONAL_AIMS,
  aims_of_primary_education: AIMS_OF_PRIMARY_EDUCATION,
  approach: [],
  medium_of_instruction:
    "All P1–P3 learning materials are provided in the child's own or a familiar language.",
  period_allocation: [],
  timetable_notes: [],
  learning_resources: [],
  assessment_approach: [],
  themes: [],
  learning_areas: [],
};

// ---------------------------------------------------------------
// Curriculum document — Primary 3 (May 2008)
// ---------------------------------------------------------------

const P3_THEMES: MockThematicTheme[] = [
  outlineTheme(
    "p3",
    "theme1",
    "Our Sub-county / Division",
    "Outline only — real title from the Primary 3 document; sub-themes, strand competences and Assessment Guidelines not yet transcribed.",
  ),
  outlineTheme(
    "p3",
    "theme2",
    "Livelihood in Our Sub-county / Division",
    "Outline only — real title from the Primary 3 document; sub-themes, strand competences and Assessment Guidelines not yet transcribed.",
  ),
  outlineTheme(
    "p3",
    "theme3",
    "Our Environment in Our Sub-county / Division",
    "Outline only — real title from the Primary 3 document; sub-themes, strand competences and Assessment Guidelines not yet transcribed.",
  ),
  outlineTheme(
    "p3",
    "theme4",
    "Environment and Weather in Our Sub-county / Division",
    "Outline only — real title from the Primary 3 document; sub-themes, strand competences and Assessment Guidelines not yet transcribed.",
  ),
  outlineTheme(
    "p3",
    "theme5",
    "Living Things: Animals in Our Sub-county / Division",
    "Outline only — real title from the Primary 3 document; sub-themes, strand competences and Assessment Guidelines not yet transcribed.",
  ),
  outlineTheme(
    "p3",
    "theme6",
    "Living Things: Plants in Our Sub-county / Division",
    "Outline only — real title from the Primary 3 document; sub-themes, strand competences and Assessment Guidelines not yet transcribed.",
  ),
  outlineTheme(
    "p3",
    "theme7",
    "Managing Resources in Our Sub-county / Division",
    "Outline only — real title from the Primary 3 document; sub-themes, strand competences and Assessment Guidelines not yet transcribed.",
  ),
  outlineTheme(
    "p3",
    "theme8",
    "Keeping Peace in Our Sub-county / Division",
    "Outline only — real title from the Primary 3 document; sub-themes, strand competences and Assessment Guidelines not yet transcribed.",
  ),
  outlineTheme(
    "p3",
    "theme9",
    "Culture and Gender in Our Sub-county / Division",
    "Outline only — real title from the Primary 3 document; sub-themes, strand competences and Assessment Guidelines not yet transcribed.",
  ),
  outlineTheme(
    "p3",
    "theme10",
    "Our Health in Our Sub-county / Division",
    "Outline only — real title from the Primary 3 document; sub-themes, strand competences and Assessment Guidelines not yet transcribed.",
  ),
  outlineTheme(
    "p3",
    "theme11",
    "Basic Technology in Our Sub-county / Division",
    "Outline only — real title from the Primary 3 document; sub-themes, strand competences and Assessment Guidelines not yet transcribed.",
  ),
  outlineTheme(
    "p3",
    "theme12",
    "Energy Resources in Our Sub-county / Division",
    "Outline only — real title from the Primary 3 document; sub-themes, strand competences and Assessment Guidelines not yet transcribed.",
  ),
];

export const mockThematicP3: MockThematicCurriculum = {
  id: "thematic-p3",
  name: "The National Primary School Curriculum for Uganda — Primary 3",
  code: "NCDC-P3-THEMATIC",
  level: "P3",
  version: "1.0",
  country: "Uganda",
  issuer:
    "Ministry of Education and Sports — National Curriculum Development Centre (NCDC)",
  year_note: "May 2008 edition",
  isbn: "ISBN 978-9970-117-05-5",
  status: "published",
  cycles: [
    {
      code: "Cycle 1",
      name: "Basic skills (P1–P3)",
      description:
        "Thematic curriculum. 12 themes → 36 sub-themes (one per teaching week), taught in the learner's first or familiar language.",
    },
    {
      code: "Cycle 2",
      name: "The transition year (P4)",
      description:
        "Single year changing from theme-based to subject-based, and from local language to English — reorganising content rather than introducing new content.",
    },
    {
      code: "Cycle 3",
      name: "Subject-based (P5–P7)",
      description:
        "Subjects taught and assessed in English. This P1–P3 document's arm is thematic; the subject-syllabus shape lives on the subject-based template.",
    },
  ],
  document_note:
    "The Primary 3 Thematic Curriculum (May 2008) is the third of the per-level lower-primary documents. It follows the same competence-based thematic organisation as Primary 1 — 12 themes sub-divided into 36 sub-themes (one per teaching week) in the theme × learning-area matrix — but with its own themes, learning outcomes and a heavier weekly allocation (50 periods incl. Oral Literature, Library, and 9 Mathematics / 10 English periods). PE and RE (CRE/IRE) stay outside the thematic strand and keep the 1999 Volume II framework, with RE organised under 12 content areas to match the 12-theme timetable.",
  national_aims: NATIONAL_AIMS,
  aims_of_primary_education: AIMS_OF_PRIMARY_EDUCATION,
  approach: [
    "Thematic: the 12 P3 themes are sub-divided into 36 sub-themes, each providing the basis for one week's teaching and learning — the three-year cycle yields a full 36-week year of graded competences.",
    "Content is arranged in a matrix — themes run horizontally while the crucial learning areas run vertically as strands (Mathematics, Oral Literature, Literacy I & II, English, Creative Performing Arts, Life Skills & Values).",
    "Themes progress the child outward from the family to the sub-county/division, covering livelihood, the environment, living things, resources, peace, culture and gender, health, technology and energy.",
    "Life skills are presented as a vertical strand so the teacher can relate specific life skills to each theme and sub-theme — not as separate period-based learning areas.",
    "PE and RE are outside the thematic strand and keep the 1999 Volume II framework; RE is attitude- and value-based, organised under 12 content areas to correspond with the 12-theme timetable.",
    "In Oral Literature lessons children explore their own local culture and the structure and potential of their own language.",
  ],
  medium_of_instruction:
    "All P1–P3 learning materials are provided in the child's own or a familiar language; written tests (except English-language-competence assessment) are also in the local language. English is used only where no predominant local or area language exists.",
  period_allocation: [
    { strand: "Oral Literature", periods: 4 },
    { strand: "Mathematics", periods: 9 },
    { strand: "Literacy I", periods: 6 },
    { strand: "Literacy II", periods: 6 },
    { strand: "English", periods: 10 },
    { strand: "Creative Performing Arts — Music", periods: 3 },
    { strand: "Creative Performing Arts — Art and Crafts", periods: 2 },
    { strand: "Physical Education", periods: 5 },
    { strand: "Religious Education", periods: 3 },
    { strand: "Library", periods: 2 },
  ],
  timetable_notes: [
    "Literacy I and Literacy II lessons should follow one another.",
    "Music and Art & Crafts come under Creative Performing Arts (CPA): 3 periods of Music and 2 of Art & Craft.",
    "Oral Literature has 4 periods per week.",
  ],
  learning_resources: [
    "Teacher Resource Books produced by the NCDC panels with District Language Boards",
    "Flash cards and word/sentence cards",
    "Wall charts and work cards",
    "Simple readers — both fiction and non-fiction",
    "The children's own written work",
    "Brailed materials (and sign language) for learners with special needs",
    "Number charts, number lines and locally available counting materials",
  ],
  assessment_approach: [
    "Assessment is part and parcel of the teaching and learning process in the Thematic Curriculum; all competences, whether oral, written or practical, are assessed.",
    "Assessment is intended to find out whether the child is genuinely learning and what action needs to be taken to support the child.",
    "The Thematic Curriculum emphasises 'continuous assessment' — further methodology is given in the Teacher's Guide.",
  ],
  themes: P3_THEMES,
  learning_areas: [
    {
      id: "la-cre",
      title: "Christian Religious Education",
      code: "CRE",
      outcome: null,
      organisation:
        "Kept outside the thematic strand with the 1999 Volume II framework; scope and sequence organised under 12 content areas to correspond with the 12-theme teaching timetable.",
      notes: [
        "Attitude- and value-based rather than competency-driven.",
        "Content areas offer opportunities for linking RE values to the themes.",
      ],
      fidelity: "outline",
    },
    {
      id: "la-ire",
      title: "Islamic Religious Education",
      code: "IRE",
      outcome: null,
      organisation:
        "Organised under its own 12 content areas by term and week (e.g. Theme 4: History of Islam — sub-theme 'The First Revelation'), with content → competences → life skills → values.",
      notes: [
        "Content areas correspond to the 12-theme teaching timetable.",
        "To be transcribed from the source in the next pass.",
      ],
      fidelity: "outline",
    },
    {
      id: "la-pe",
      title: "Physical Education (PE)",
      code: "PE",
      outcome: null,
      organisation:
        "Five periods per week (statutory), keeping the framework of the 1999 Volume II curriculum.",
      notes: [
        "Emphasis on movement, play, rhythm, emotional control, discipline, fitness, and the preservation of traditional games and dances.",
      ],
      fidelity: "outline",
    },
  ],
};

// ---------------------------------------------------------------
// Catalog — one thematic curriculum document per level × edition
// ---------------------------------------------------------------

export let mockThematicCurricula: MockThematicCurriculum[] = [
  mockThematicP1,
  mockThematicP2,
  mockThematicP3,
];

// ---------------------------------------------------------------
// Convenience selectors
// ---------------------------------------------------------------

export function getThematicCurricula(): MockThematicCurriculum[] {
  return mockThematicCurricula;
}

/**
 * Overridable catalog — the playground mock/DB toggle swaps this module
 * array in bulk so `getThematicCurricula`, `getThematicCurriculumById`,
 * `getThematicCurriculum` and every downstream consumer read the active
 * source without local edits.
 */
export function setMockThematicCurricula(
  next: MockThematicCurriculum[],
): void {
  mockThematicCurricula = next;
}

export function getThematicCurriculumById(
  id: string | null | undefined,
): MockThematicCurriculum | undefined {
  return mockThematicCurricula.find((curriculum) => curriculum.id === id);
}

/** Default to the first published thematic document (Primary 1). */
export function getThematicCurriculum(): MockThematicCurriculum {
  return (
    mockThematicCurricula.find((curriculum) => curriculum.status === "published") ??
    mockThematicCurricula[0]
  );
}

export function getThemeById(
  themeId: string,
  curriculum: MockThematicCurriculum,
): MockThematicTheme | undefined {
  return curriculum.themes.find((theme) => theme.id === themeId);
}

export function getThematicStats(curriculum: MockThematicCurriculum) {
  return {
    themes: curriculum.themes.length,
    subThemes: curriculum.themes.reduce(
      (sum, theme) => sum + theme.sub_themes.length,
      0,
    ),
    guidelineItems: curriculum.themes
      .flatMap((theme) => theme.assessment_guidelines)
      .reduce((sum, group) => sum + group.items.length, 0),
    learningAreas: curriculum.learning_areas.length,
    totalPeriods: curriculum.period_allocation.reduce(
      (sum, row) => sum + row.periods,
      0,
    ),
  };
}

// ---------------------------------------------------------------
// Manual entry — anatomy capture shape (document onboarding, step 2)
// ---------------------------------------------------------------
//
// UI-only capture for the "Manual entry" onboarding option. Mirrors the
// four universal anatomy components exactly the way the THEMATIC preview
// tabs render them (Intent · Content · Learning & Teaching · Assessment),
// so `applyThematicManualEntry` can hydrate a created draft with no
// reshaping. Theme content keeps full matrix fidelity — sub-themes with
// per-strand competence blocks across all six strands.

export interface ThematicManualCycleRow {
  code: string;
  name: string;
  description: string;
}

export interface ThematicManualStrandBlock {
  strand: MockThematicStrandId;
  heading: string | null;
  items: string[];
}

export interface ThematicManualSubTheme {
  title: string;
  content: string[];
  blocks: ThematicManualStrandBlock[];
}

export interface ThematicManualAssessmentGroup {
  strand: string;
  items: string[];
}

export interface ThematicManualTheme {
  code: string;
  title: string;
  learning_outcome: string;
  sub_themes: ThematicManualSubTheme[];
  assessment_guidelines: ThematicManualAssessmentGroup[];
}

export interface ThematicManualLearningArea {
  title: string;
  code: string;
  outcome: string;
  organisation: string;
  notes: string[];
}

export interface ThematicManualPeriodRow {
  strand: string;
  periods: number;
  note?: string;
}

export interface ThematicManualEntry {
  intent: {
    cycles: ThematicManualCycleRow[];
    national_aims: string[];
    aims_of_primary_education: string[];
  };
  content: {
    themes: ThematicManualTheme[];
    learning_areas: ThematicManualLearningArea[];
  };
  learning_teaching: {
    approach: string[];
    medium_of_instruction: string;
    learning_resources: string[];
    period_allocation: ThematicManualPeriodRow[];
    timetable_notes: string[];
  };
  assessment: {
    assessment_approach: string[];
  };
}

export function createEmptyThematicManualEntry(): ThematicManualEntry {
  return {
    intent: { cycles: [], national_aims: [], aims_of_primary_education: [] },
    content: { themes: [], learning_areas: [] },
    learning_teaching: {
      approach: [],
      medium_of_instruction: "",
      learning_resources: [],
      period_allocation: [],
      timetable_notes: [],
    },
    assessment: { assessment_approach: [] },
  };
}

// ---------------------------------------------------------------
// Manual entry → draft hydration
// ---------------------------------------------------------------
//
// Maps a captured `ThematicManualEntry` onto a fresh draft document
// (from the onboarding wizard) so the preview's four tabs and the
// coverage gauge reflect what the super admin typed. Themes that carry
// entered sub-themes land as `mirrored`; title-only themes land as
// `outline` so the preview's mirrored-only filters behave consistently.

export function applyThematicManualEntry(
  base: MockThematicCurriculum,
  entry: ThematicManualEntry,
): MockThematicCurriculum {
  const themes: MockThematicTheme[] = entry.content.themes
    .filter((theme) => theme.title.trim().length > 0)
    .map((theme, themeIndex) => {
      const seq = String(themeIndex + 1);
      const subThemes: MockThematicSubTheme[] = theme.sub_themes
        .filter((subTheme) => subTheme.title.trim().length > 0)
        .map((subTheme, subIndex) => ({
          id: `${base.id}-theme${seq}-${subIndex + 1}`,
          code: subIndex === 0 ? `${seq}.1` : `${seq}.${subIndex + 1}`,
          title: subTheme.title,
          content: subTheme.content.filter(Boolean),
          blocks: subTheme.blocks
            .map((block) => ({
              strand: block.strand,
              heading: block.heading?.trim() ? block.heading : null,
              items: block.items.filter(Boolean),
            }))
            .filter((block) => block.items.length > 0),
        }));
      const hasSubThemes = subThemes.length > 0;
      return {
        id: `${base.id}-theme${seq}`,
        code: theme.code.trim() || `theme${seq}`,
        title: theme.title,
        term: null,
        weeks: null,
        learning_outcome: theme.learning_outcome.trim() ? theme.learning_outcome : null,
        sub_themes: subThemes,
        assessment_guidelines: theme.assessment_guidelines
          .map((group) => ({
            strand: group.strand,
            items: group.items.filter(Boolean),
          }))
          .filter((group) => group.items.length > 0),
        fidelity: hasSubThemes ? "mirrored" : "outline",
        note: hasSubThemes
          ? undefined
          : "Manually captured outline — sub-themes not yet entered.",
      };
    });

  const learningAreas: MockThematicLearningArea[] = entry.content.learning_areas
    .filter((area) => area.title.trim().length > 0 || area.code.trim().length > 0)
    .map((area, index) => ({
      id: `${base.id}-la-${index + 1}`,
      title: area.title.trim() || "Untitled learning area",
      code: area.code.trim() || `LA${index + 1}`,
      outcome: area.outcome.trim() ? area.outcome : null,
      organisation: area.organisation,
      notes: area.notes.filter(Boolean),
      fidelity: "outline",
    }));

  return {
    ...base,
    cycles: entry.intent.cycles.filter((cycle) => cycle.name.trim().length > 0),
    national_aims: entry.intent.national_aims.filter(Boolean),
    aims_of_primary_education: entry.intent.aims_of_primary_education.filter(Boolean),
    approach: entry.learning_teaching.approach.filter(Boolean),
    medium_of_instruction:
      entry.learning_teaching.medium_of_instruction.trim() || null,
    learning_resources: entry.learning_teaching.learning_resources.filter(Boolean),
    period_allocation: entry.learning_teaching.period_allocation
      .filter((row) => row.strand.trim().length > 0)
      .map((row) => ({
        strand: row.strand,
        periods: Number.isFinite(row.periods) ? row.periods : 0,
        note: row.note?.trim() ? row.note : undefined,
      })),
    timetable_notes: entry.learning_teaching.timetable_notes.filter(Boolean),
    assessment_approach: entry.assessment.assessment_approach.filter(Boolean),
    themes,
    learning_areas: learningAreas,
  };
}

// ---------------------------------------------------------------
// Draft editing — inverse mappers (read a draft back into the editor)
// ---------------------------------------------------------------

/** Inverse of `applyThematicManualEntry` — seeds the editor from a document. */
export function toThematicManualEntry(
  curriculum: MockThematicCurriculum,
): ThematicManualEntry {
  return {
    intent: {
      cycles: curriculum.cycles.map((cycle) => ({ ...cycle })),
      national_aims: [...curriculum.national_aims],
      aims_of_primary_education: [...curriculum.aims_of_primary_education],
    },
    content: {
      themes: curriculum.themes.map((theme) => ({
        code: theme.code,
        title: theme.title,
        learning_outcome: theme.learning_outcome ?? "",
        sub_themes: theme.sub_themes.map((subTheme) => ({
          title: subTheme.title,
          content: [...subTheme.content],
          blocks: subTheme.blocks.map((block) => ({
            strand: block.strand,
            heading: block.heading,
            items: [...block.items],
          })),
        })),
        assessment_guidelines: theme.assessment_guidelines.map((group) => ({
          strand: group.strand,
          items: [...group.items],
        })),
      })),
      learning_areas: curriculum.learning_areas.map((area) => ({
        title: area.title,
        code: area.code,
        outcome: area.outcome ?? "",
        organisation: area.organisation,
        notes: [...area.notes],
      })),
    },
    learning_teaching: {
      approach: [...curriculum.approach],
      medium_of_instruction: curriculum.medium_of_instruction ?? "",
      learning_resources: [...(curriculum.learning_resources ?? [])],
      period_allocation: curriculum.period_allocation.map((row) => ({
        strand: row.strand,
        periods: row.periods,
        note: row.note,
      })),
      timetable_notes: [...curriculum.timetable_notes],
    },
    assessment: {
      assessment_approach: [...curriculum.assessment_approach],
    },
  };
}

/** Identity fields editable for a draft document (keeps `id` stable). */
export interface ThematicDraftIdentity {
  officialTitle: string;
  code: string;
  edition: string;
  year: number;
  isbn: string;
  level: string;
}

export function toThematicDraftIdentity(
  curriculum: MockThematicCurriculum,
): ThematicDraftIdentity {
  const yearMatch = /(19|20)\d{2}/.exec(curriculum.year_note);
  return {
    officialTitle: curriculum.name,
    code: curriculum.code,
    edition: curriculum.edition ?? "",
    year: yearMatch ? Number.parseInt(yearMatch[0], 10) : new Date().getFullYear(),
    isbn: curriculum.isbn ?? "",
    level: curriculum.level,
  };
}

export function applyThematicDraftIdentity(
  base: MockThematicCurriculum,
  identity: ThematicDraftIdentity,
): MockThematicCurriculum {
  return {
    ...base,
    name: identity.officialTitle.trim() || base.name,
    code: identity.code.trim() || base.code,
    level: identity.level || base.level,
    edition: identity.edition.trim() || null,
    year_note: `${identity.year} edition`,
    isbn: identity.isbn.trim() || null,
  };
}

/** Compact per-tab capture summary used by the onboarding review step. */
export function summarizeThematicManualEntry(entry: ThematicManualEntry): {
  intent: string;
  content: string;
  learningTeaching: string;
  assessment: string;
} {
  const themes = entry.content.themes.filter((theme) => theme.title.trim().length > 0);
  const themeOutcomes = themes.filter(
    (theme) => theme.learning_outcome.trim().length > 0,
  ).length;
  const subThemes = themes.reduce(
    (sum, theme) =>
      sum + theme.sub_themes.filter((subTheme) => subTheme.title.trim().length > 0).length,
    0,
  );
  const guidelineSets = themes.reduce(
    (sum, theme) =>
      sum +
      theme.assessment_guidelines.filter((group) => group.items.some(Boolean)).length,
    0,
  );
  const periods = entry.learning_teaching.period_allocation.reduce(
    (sum, row) => sum + (Number.isFinite(row.periods) ? row.periods : 0),
    0,
  );

  return {
    intent: [
      `${entry.intent.cycles.filter((cycle) => cycle.name.trim().length > 0).length} cycles`,
      `${entry.intent.national_aims.filter(Boolean).length} national aims`,
      `${entry.intent.aims_of_primary_education.filter(Boolean).length} primary aims`,
      `${themeOutcomes} theme outcomes`,
    ].join(" · "),
    content: [
      `${themes.length} themes`,
      `${subThemes} sub-themes`,
      `${entry.content.learning_areas.filter((area) => area.title.trim().length > 0 || area.code.trim().length > 0).length} learning areas`,
    ].join(" · "),
    learningTeaching: [
      `${entry.learning_teaching.approach.filter(Boolean).length} approach points`,
      `${entry.learning_teaching.learning_resources.filter(Boolean).length} resources`,
      `${periods} periods/wk`,
      `${entry.learning_teaching.timetable_notes.filter(Boolean).length} timetable notes`,
    ].join(" · "),
    assessment: [
      `${entry.assessment.assessment_approach.filter(Boolean).length} approach points`,
      `${guidelineSets} guideline sets`,
    ].join(" · "),
  };
}

// ---------------------------------------------------------------
// Draft factory — thematic curriculum (document onboarding)
// ---------------------------------------------------------------
//
// Seeds a brand-new MockThematicCurriculum for the "New curriculum" flow.
// All four anatomy components are empty so the document lands as status
// "draft" with a 0/4 coverage gauge and "awaiting transcription" empty
// states in every tab. Level letter is folded into the id so the catalog /
// detail selectors pick the document up (`getThematicCurriculumById`,
// `getThematicCurricula`, and the coverage helpers all read the array).

export function createThematicCurriculumDraft(input: {
  level: string;
  name: string;
  edition?: string;
  year?: number;
  note?: string;
}): MockThematicCurriculum {
  const levelKey = input.level;
  const id = `thematic-${levelKey.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const edition = input.edition ?? "2007";
  const year = input.year ?? Number.parseInt(edition, 10);

  return {
    id,
    name: input.name,
    code: `NCDC-${levelKey.toUpperCase()}-THEMATIC`,
    level: levelKey.toUpperCase(),
    version: "0.1",
    country: "Uganda",
    issuer:
      "Ministry of Education and Sports — National Curriculum Development Centre (NCDC)",
    year_note: `${year} edition`,
    edition: input.edition ?? null,
    isbn: null,
    status: "draft",
    document_note:
      input.note ??
      "New curriculum document by super admin — PDF not yet transcribed. The four anatomy components are empty and await transcription from the source document.",
    cycles: [],
    national_aims: [],
    aims_of_primary_education: [],
    approach: [],
    medium_of_instruction: null,
    period_allocation: [],
    timetable_notes: [],
    learning_resources: [],
    assessment_approach: [],
    themes: [],
    learning_areas: [],
  };
}

