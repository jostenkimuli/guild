# NCDC Curriculum Reference

Uganda's National Curriculum Development Centre (NCDC) runs six curriculum
designs, one per level — not one design applied everywhere. This maps all
six from NCDC's own published material (`ncdc.go.ug`), so schema work for
TheGuild is grounded in what actually exists rather than one document
generalised too far. Compiled September 2026.

## At a glance

| Level | Grades | Organising principle | Assessment | In TheGuild |
| --- | --- | --- | --- | --- |
| Pre-primary (ECCE) | Nursery | Outcomes/competence-based, key learning areas | Continuous only, no exams | Documented |
| Lower Primary | P1–P3 | Thematic — 12 themes → 36 sub-themes (1/week) | Diagnostic checklist, no tests | **Built** — Theme 1 of 12 |
| Upper Primary | P4 (transition) – P7 | Subject-based, 10 subjects | Standard, per subject | Documented |
| Lower Secondary (O-Level) | S1–S4 | Competency-based, 21 learning areas | Formative 20% / Summative 80% | Documented |
| Upper Secondary (A-Level) | S5–S6 | Competency-based, 29 subjects (3 principal + 1 subsidiary + General Paper) | Weighted Assessment Objectives (AO1, AO2…) | Documented |
| BTVET | Not grade-locked | Competence-based, modular | Phased with employment intervals | Documented |

"Built" = migrated, seeded and RLS-tested in TheGuild today. "Documented" =
researched here, no schema yet.

## 1. Pre-primary (ECCE)

Organised around the **Learning Framework for Early Childhood** — outcomes
and competence-based, not goal/aim/objective-based: it "focuses on results
rather than on goals, aims and objectives; it greatly emphasises observable
and measurable skills, competences and values." Translated into Kiswahili
and 16 Ugandan local languages.

**Current framework — 5 key learning areas:** acceptable social
interactions, exploration & knowledge acquisition, self-care for proper
growth, mathematical concept development, language proficiency. A revision
underway expands this to 7, adding "expressing and appreciating myself and
my culture" and "digital integration."

> **Fixed rule — no examinations.** The Framework "strictly condemns
> examinations that are given to young children" — continuous,
> observation-based assessment only. Stricter than Lower Primary's "no
> separate tests," which still allows structured checklists.

**Schema implication:** a flat set of key learning areas, no grade/term/week
subdivision — closer to a tag list than to Lower Primary's theme tree.
Doesn't need period-allocation or timetable machinery.

Sources: [Learning Framework for Early Childhood](https://ncdc.go.ug/wp-content/uploads/2024/02/ECD_FRamework.pdf) · [Pre-Primary Curriculum](https://www.ncdc.go.ug/curriculum-type/pre-primary-curriculum)

## 2. Lower Primary (P1–P3) — built

The only **thematic** level in the whole system, and the only one currently
in TheGuild's database. "Learners at this level cannot be expected to
understand the boundaries between different subjects" — so content is
organised as **12 themes → 36 sub-themes** (one sub-theme = one teaching
week), with five strands (Mathematics, Literacy, English, Creative
Performing Arts, Life Skills & Values) woven through every sub-theme rather
than taught separately. Religious Education and Physical Education keep
their own weekly schedule outside the theme structure. Term 1 opens with an
orientation week before the themed weeks begin.

**Weekly period allocation — 40 periods, fixed:**

| Strand / lesson | Periods |
| --- | ---: |
| News | 3 |
| … + Local language | 2 |
| Mathematics | 5 |
| Literacy I | 5 |
| Literacy II (follows Literacy I) | 5 |
| English | 5 |
| Music | 3 |
| … + Art & Craft | 2 |
| Physical Education | 5 |
| Religious Education | 3 |
| Free Activity (double lesson) | 2 |
| **Total** | **40** |

> **Fixed rule — assessment.** No separate assessment tests or
> examinations — teachers keep a cumulative per-learner checklist during
> normal lessons. Purpose is diagnostic and remedial, not grading.

**Schema implication:** exactly the shape built —
`national_themes → national_subthemes → national_competences`, a
`national_period_allocations` table carrying the rules above (block/follows
constraints included), and a separate `national_area_units` table for
RE/PE's independent schedule. Themes 2–12 have their sub-theme structure
loaded but not yet their competences.

Source: [The National Primary School Curriculum for Uganda — Primary 1](https://ncdc.go.ug/wp-content/uploads/2024/02/P1-Curriculum.pdf) (NCDC, reprinted 2016)

## 3. Upper Primary (P4 transition, P5–P7)

The pivot level: **P4 switches** Lower Primary's thematic design to a
subject-based one. "Children are required to change from the theme-based to
subject-based learning and begin learning in English"; the local language
is phased out over the year, used only for the hardest concepts by P4's
end. P5–P7 then consolidates: subject-based, activity-based, preparing
learners for post-primary.

**P4–P7 weekly periods — 40 total, a different subject mix from P1–P3:**

| Subject | Periods |
| --- | ---: |
| English | 6 |
| Mathematics | 6 |
| Integrated Science | 6 |
| Social Studies | 5 |
| Art & Technology | 4 |
| Religious Education | 3 |
| Local Language | 3 |
| Physical Education | 3 |
| CAPE (Music, Dance & Drama) | 2 |
| Library Reading | 2 |
| **Total** | **40** |

> **Worth knowing.** NCDC publishes P5–P7 as **two separate documents per
> grade**: "Set One" (English, Science, Local Language, Maths, Social
> Studies, RE) and "Set Two" (Creative Arts & PE). A publishing quirk, not a
> structural rule — doesn't need its own schema field.

**Schema implication:** same total (40 periods) as Lower Primary but an
unrelated subject list — confirms the period-allocation table must live
per-curriculum, never assumed shared across levels, which the current
design already does correctly.

Sources: [P4 English Syllabus](https://ncdc.go.ug/wp-content/uploads/2024/02/P4_ENGLISH_SYLLABUS-1.pdf) · [P5 Curriculum](https://ncdc.go.ug/wp-content/uploads/2024/02/P.-5-Curriculum-1.pdf) · [Abridged Curricula from NCDC — Primary (UNEB)](https://uneb.ac.ug/abridged-curricula-from-ncdc-primary/)

## 4. Lower Secondary / O-Level (S1–S4)

Competency-based since 2020 — **21 learning areas** replaced 43 old
subjects. Schools offer 11 compulsory subjects + 1 elective at S1–S2,
narrowing to 8–9 at S3–S4. Every topic follows the same shape: a
**competency statement → learning outcomes → suggested activities →
assessment activities** — what a learner can *do*, not what content was
covered. "Strand" is confirmed real NCDC vocabulary here (used in the Local
Languages Learning Framework, e.g. "Strand: Occupational").

**5 generic skills**, embedded across every subject: critical thinking &
problem-solving; cooperation & self-directed learning; creativity &
innovation; mathematical computation & ICT proficiency; communication.

**9 values**, from Uganda's National Ethics Policy: respect for humanity,
honesty, justice, hard work, integrity, creativity, social responsibility,
national harmony, patriotism.

Cross-cutting issues (climate change, human rights, peace education, and
others) are woven into subjects rather than taught separately.

> **Fixed rule — assessment split.** Formative **20%** + summative **80%**,
> assessed through oral, written, performance and practical demonstration —
> not exam-only.

**Schema implication:** a genuinely different table shape from Lower
Primary — `subject → strand → competency`, plus two cross-subject tag sets
(generic skills, values/cross-cutting issues) that apply *across* subjects
rather than inside one theme.

Sources: [Brief on the Lower Secondary Curriculum](https://ugandamediacentreblog.wordpress.com/2020/02/12/brief-on-the-lower-secondary-curriculum/) · [Readiness for the New Lower Secondary Curriculum](https://ncdc.go.ug/wp-content/uploads/2025/07/Readiness-for-the-New-Lower-Secondary-School-Curriculum.pdf) · [Local Languages Learning Framework](https://ncdc.go.ug/wp-content/uploads/2024/02/Local_Language_Framework_compressed.pdf)

## 5. Upper Secondary / A-Level (S5–S6)

All **29 subjects retained**; competency-based approach launched February
2025. Each student combines **3 principal subjects + 1 subsidiary + the
compulsory General Paper**. Carries forward O-Level's inquiry- and
project-based methods. Grading is moving from A/B/C/D/E/O/F to A/B/C/D/E.

Assessment runs on numbered, weighted **Assessment Objectives** — confirmed
directly from NCDC's Chemistry Assessment Guidelines (quoted, not
invented):

- **AO1** — Foundations of atomic structure, bonding and periodicity of
  elements: "Applying knowledge of atomic and molecular structures to
  interpret periodic trends and chemical reactivity."
- **AO2** — Structure, reactivity and applications of organic molecules:
  "Explore, predict, and apply the structure, reactivity, and
  transformation pathways of organic compounds…"

**Schema implication:** the `assessment_objectives(code, description,
weight_percentage)` shape only earns its place at this level — the one
level where NCDC's own documents number and weight objectives explicitly.
Building it for Lower Primary would have been invented structure; here it's
a direct match.

Sources: [A-Level Curriculum (NCDC)](https://ncdc.go.ug/book-category/a-level-curriculum/) · [Chemistry Assessment Guidelines](https://ncdc.go.ug/wp-content/uploads/2026/07/Chemistry-Assessment-Guidelines-01.04.Web_File.pdf)

## 6. BTVET

Business, Technical & Vocational Education and Training — the outlier of
the six. Competence-based and **modular**: learners "undertake a specific
course/programme in phases with intervals of employment," under the
"Skilling Uganda" policy and the BTVET Act 2008.

> **Worth knowing.** No grade/term/week tree at all — courses are phased
> against employment, not a school calendar. Fitting BTVET into
> `grades → terms → units` the way the other five levels work would force a
> shape that doesn't hold here.

Sources: [BTVET Curriculum (NCDC)](https://www.ncdc.go.ug/curriculum-type/btvet-curriculum) · [TVET Policy 2019](https://www.education.go.ug/wp-content/uploads/2020/05/FINAL-TVET-POLICY_IMPLEMENTATION-STANDARDS_IMPLEMENTATION-GUIDELINES_19TH_MAY_2020.pdf)

## Synthesis: what this means for the schema

Two shapes, not one right answer — because the six levels were never
solving the same problem for NCDC either.

- **Thematic — built, Lower Primary only.**
  `theme → sub-theme → competence`, plus a fixed weekly period allocation
  with block/follows rules and a separate RE/PE schedule. Matches P1–P3
  exactly; matches nowhere else in the system.
- **Subject-based — needed for four more levels.**
  `subject → strand → competency`, with real per-level variation: Upper
  Primary has no AOs or skills framework at all; O-Level adds generic
  skills + values + a 20/80 assessment split; A-Level adds numbered,
  weighted AOs.
- **BTVET — its own shape.** Modular, employment-phased, not grade-locked.
  Needs its own model later; forcing it into either tree above would
  misrepresent it.
- **Next, concretely.** Finish loading Lower Primary (Themes 2–12's
  competences) before starting a second reference layer — the
  subject-based shape is real and needed, but for a level nothing has been
  built against yet.

## Sources

- [The National Primary School Curriculum for Uganda — Primary 1](https://ncdc.go.ug/wp-content/uploads/2024/02/P1-Curriculum.pdf) (NCDC, reprinted 2016)
- [Learning Framework for Early Childhood Development](https://ncdc.go.ug/wp-content/uploads/2024/02/ECD_FRamework.pdf)
- [Pre-Primary Curriculum](https://www.ncdc.go.ug/curriculum-type/pre-primary-curriculum) — NCDC
- [P4 English Syllabus](https://ncdc.go.ug/wp-content/uploads/2024/02/P4_ENGLISH_SYLLABUS-1.pdf)
- [Primary 5 Curriculum](https://ncdc.go.ug/wp-content/uploads/2024/02/P.-5-Curriculum-1.pdf)
- [Primary Seven Curriculum](https://ncdc.go.ug/wp-content/uploads/2024/02/P7_Final_Set_two_Sept_2011_book_1-1.pdf)
- [Abridged Curricula from NCDC — Primary](https://uneb.ac.ug/abridged-curricula-from-ncdc-primary/) (UNEB)
- [Brief on the Lower Secondary Curriculum](https://ugandamediacentreblog.wordpress.com/2020/02/12/brief-on-the-lower-secondary-curriculum/) — Uganda Media Centre
- [Readiness for the New Lower Secondary School Curriculum](https://ncdc.go.ug/wp-content/uploads/2025/07/Readiness-for-the-New-Lower-Secondary-School-Curriculum.pdf)
- [Local Languages Learning Framework](https://ncdc.go.ug/wp-content/uploads/2024/02/Local_Language_Framework_compressed.pdf)
- [A-Level Curriculum](https://ncdc.go.ug/book-category/a-level-curriculum/) — NCDC book listing
- [Chemistry Assessment Guidelines](https://ncdc.go.ug/wp-content/uploads/2026/07/Chemistry-Assessment-Guidelines-01.04.Web_File.pdf) (A-Level)
- [BTVET Curriculum](https://www.ncdc.go.ug/curriculum-type/btvet-curriculum) — NCDC
- [TVET Policy 2019 — Implementation Standards & Guidelines](https://www.education.go.ug/wp-content/uploads/2020/05/FINAL-TVET-POLICY_IMPLEMENTATION-STANDARDS_IMPLEMENTATION-GUIDELINES_19TH_MAY_2020.pdf)
- [ncdc.go.ug](https://ncdc.go.ug/) — site navigation and curriculum-type taxonomy

---

Compiled for TheGuild's Sprint 2 curriculum work. Read before touching
schema for a second level.
