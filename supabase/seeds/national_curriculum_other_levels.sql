-- ============================================================
-- National curriculum reference data: the four NCDC levels other than
-- Lower Primary (which is fully loaded in national_curriculum_p1*.sql).
--
-- Scope, deliberately: a STRUCTURAL SKELETON per level, not a full
-- competency tree. See docs/NCDC_CURRICULUM_REFERENCE.md for the research
-- behind these choices. Each level here gets:
--   - the national_curricula row itself
--   - its subjects/learning areas (national_strands)
--   - its weekly period allocation, ONLY where NCDC publishes a fixed
--     periods-per-week grid (Upper Primary). O-Level and A-Level are
--     subject-selection curricula, not a fixed daily timetable, and no
--     verified per-subject period counts were found -- that table is left
--     empty for them rather than guessed.
--   - the national aims of education (reused verbatim from the P1 seed:
--     these are Uganda's system-wide aims, not P1-specific -- legitimate
--     to repeat per curriculum since the schema scopes aims per level)
--   - the "fixed rule" callouts documented in NCDC_CURRICULUM_REFERENCE.md
--
-- Deliberately NOT included: curriculum_nodes (theme/sub_theme/competence)
-- trees, assessment guidelines, or area units. Lower Primary is the only
-- level that is genuinely thematic; the other four are subject-based (or,
-- for Pre-primary, a flat list) and a full competency-by-competency tree
-- for any of them needs the real per-subject syllabus documents, not the
-- secondary sources this file draws on. Use the /admin/curricula UI to
-- extend any of these levels once that source material is available.
--
-- Sourcing for the subject lists below:
--   - Upper Primary: NCDC's published P4/P5/P7 curriculum documents,
--     already cited in NCDC_CURRICULUM_REFERENCE.md -- periods are the
--     verified published grid.
--   - O-Level's 21 learning areas and A-Level's 29 subjects: NOT read from
--     one single canonical enumeration (the official "Curriculum
--     Framework" PDF did not extract to readable text in this
--     environment). Cross-referenced instead from NCDC's own book
--     catalogue (ncdc.go.ug/book-category/...) against independent
--     education-press reporting, keeping only names that both sources
--     agreed on, and only kept because the resulting count matched NCDC's
--     own published totals (21 and 29) exactly. Treat these two lists as
--     a good-faith structural placeholder to be corrected against the
--     primary document, not a verbatim transcription the way P1's themes
--     are.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Pre-primary (ECCE) -- flat key learning areas, no grade/term tree
-- ------------------------------------------------------------
do $$
declare
  c uuid;
begin
  if exists (select 1 from public.national_curricula where slug = 'uganda-pre-primary') then
    raise notice 'national curriculum uganda-pre-primary already loaded; skipping';
    return;
  end if;

  insert into public.national_curricula (
    slug, title, authority, cycle_label, class_level, ecosystem_type, edition,
    source_url, orientation_terms
  )
  values (
    'uganda-pre-primary',
    'Learning Framework for Early Childhood Development',
    'National Curriculum Development Centre (NCDC), Ministry of Education, Science, Technology and Sports',
    'Pre-primary (ECCE)',
    'Nursery',
    'nursery_school',
    '2005 framework (revision to 7 key learning areas underway)',
    'https://ncdc.go.ug/wp-content/uploads/2024/02/ECD_FRamework.pdf',
    array[]::smallint[]
  )
  returning id into c;

  insert into public.national_strands (national_curriculum_id, key, name, is_thematic, sort_order)
  values
    (c, 'social_interactions', 'Relating with Others in an Acceptable Way', false, 1),
    (c, 'exploration_environment', 'Interacting, Exploring, Knowing and Using My Environment', false, 2),
    (c, 'self_care', 'Taking Care of Myself for Proper Growth and Development', false, 3),
    (c, 'mathematical_concepts', 'Developing and Using Mathematical Concepts', false, 4),
    (c, 'language_proficiency', 'Language Proficiency', false, 5);

  insert into public.national_aims (national_curriculum_id, kind, position, description)
  select c, 'national', x.ord::smallint, x.txt
  from unnest(array[
    'To promote understanding and appreciation of the value of national unity, patriotism and cultural heritage, with due consideration to international relations and beneficial interdependence.',
    'To inculcate moral, ethical and spiritual values in the individual and to develop self-discipline, integrity, tolerance and human fellowship.',
    'To inculcate into Ugandans a sense of service, duty and leadership for participation in civic, social and national affairs through group activities in educational institutions and the community.',
    'To promote scientific, technical and cultural knowledge, skills and attitudes needed to enhance individual and national development.',
    'To eradicate illiteracy and equip the individual with basic skills and knowledge to exploit the environment for self-development as well as national development; for better health, nutrition and family life, and the capacity for continued learning.',
    'To equip the learners with the ability to contribute to the building of an integrated, self-sustaining and independent national economy.'
  ]) with ordinality as x(txt, ord);

  insert into public.national_rules (
    national_curriculum_id, rule_group, description, requirement_level, sort_order
  )
  values
    (c, 'assessment',
      'No examinations. The Learning Framework strictly condemns examinations given to young children -- assessment is continuous and observation-based only.',
      'mandatory', 1);
end $$;

-- ------------------------------------------------------------
-- 2. Upper Primary (P4 transition, P5-P7) -- subject-based, 40 periods/week
-- ------------------------------------------------------------
do $$
declare
  c uuid;
begin
  if exists (select 1 from public.national_curricula where slug = 'uganda-upper-primary') then
    raise notice 'national curriculum uganda-upper-primary already loaded; skipping';
    return;
  end if;

  insert into public.national_curricula (
    slug, title, authority, cycle_label, class_level, ecosystem_type, edition,
    source_url, orientation_terms
  )
  values (
    'uganda-upper-primary',
    'The National Primary School Curriculum for Uganda -- Upper Primary (P4-P7)',
    'National Curriculum Development Centre (NCDC), Ministry of Education, Science, Technology and Sports',
    'Upper Primary (P4-P7): Subject-based',
    'P4-P7',
    'primary_school',
    'Multiple reprints, 2011-2024',
    'https://ncdc.go.ug/wp-content/uploads/2024/02/P4_ENGLISH_SYLLABUS-1.pdf',
    array[]::smallint[]
  )
  returning id into c;

  insert into public.national_strands (national_curriculum_id, key, name, is_thematic, sort_order)
  values
    (c, 'english', 'English', false, 1),
    (c, 'mathematics', 'Mathematics', false, 2),
    (c, 'integrated_science', 'Integrated Science', false, 3),
    (c, 'social_studies', 'Social Studies', false, 4),
    (c, 'art_technology', 'Art and Technology', false, 5),
    (c, 'religious_education', 'Religious Education', false, 6),
    (c, 'local_language', 'Local Language', false, 7),
    (c, 'physical_education', 'Physical Education', false, 8),
    (c, 'cape', 'CAPE (Music, Dance and Drama)', false, 9),
    (c, 'library_reading', 'Library Reading', false, 10);

  insert into public.national_aims (national_curriculum_id, kind, position, description)
  select c, 'national', x.ord::smallint, x.txt
  from unnest(array[
    'To promote understanding and appreciation of the value of national unity, patriotism and cultural heritage, with due consideration to international relations and beneficial interdependence.',
    'To inculcate moral, ethical and spiritual values in the individual and to develop self-discipline, integrity, tolerance and human fellowship.',
    'To inculcate into Ugandans a sense of service, duty and leadership for participation in civic, social and national affairs through group activities in educational institutions and the community.',
    'To promote scientific, technical and cultural knowledge, skills and attitudes needed to enhance individual and national development.',
    'To eradicate illiteracy and equip the individual with basic skills and knowledge to exploit the environment for self-development as well as national development; for better health, nutrition and family life, and the capacity for continued learning.',
    'To equip the learners with the ability to contribute to the building of an integrated, self-sustaining and independent national economy.'
  ]) with ordinality as x(txt, ord);

  insert into public.national_period_allocations (
    national_curriculum_id, key, label, group_label, periods, block_size, follows_key, note, sort_order
  )
  values
    (c, 'english', 'English', null, 6, 1, null, null, 1),
    (c, 'mathematics', 'Mathematics', null, 6, 1, null, null, 2),
    (c, 'integrated_science', 'Integrated Science', null, 6, 1, null, null, 3),
    (c, 'social_studies', 'Social Studies', null, 5, 1, null, null, 4),
    (c, 'art_technology', 'Art and Technology', null, 4, 1, null, null, 5),
    (c, 'religious_education', 'Religious Education', null, 3, 1, null, 'Christian or Islamic Religious Education.', 6),
    (c, 'local_language', 'Local Language', null, 3, 1, null, null, 7),
    (c, 'physical_education', 'Physical Education', null, 3, 1, null, null, 8),
    (c, 'cape', 'CAPE (Music, Dance and Drama)', null, 2, 1, null, null, 9),
    (c, 'library_reading', 'Library Reading', null, 2, 1, null, null, 10);

  insert into public.national_rules (
    national_curriculum_id, rule_group, description, requirement_level, sort_order
  )
  values
    (c, 'language',
      'From P4, English becomes the language of instruction. The local language is phased out over the year, used only for the hardest concepts by P4''s end.',
      'mandatory', 1),
    (c, 'teaching',
      'NCDC publishes P5-P7 as two documents per grade: "Set One" (English, Science, Local Language, Mathematics, Social Studies, Religious Education) and "Set Two" (Creative Arts and Physical Education). A publishing detail, not a scheduling rule.',
      'flexible', 1);
end $$;

-- ------------------------------------------------------------
-- 3. Lower Secondary / O-Level (S1-S4) -- competency-based, 21 learning areas
-- ------------------------------------------------------------
do $$
declare
  c uuid;
begin
  if exists (select 1 from public.national_curricula where slug = 'uganda-o-level') then
    raise notice 'national curriculum uganda-o-level already loaded; skipping';
    return;
  end if;

  insert into public.national_curricula (
    slug, title, authority, cycle_label, class_level, ecosystem_type, edition,
    source_url, orientation_terms
  )
  values (
    'uganda-o-level',
    'Lower Secondary Curriculum (Competency-Based), Uganda',
    'National Curriculum Development Centre (NCDC), Ministry of Education, Science, Technology and Sports',
    'Lower Secondary (O-Level): Competency-based',
    'S1-S4',
    'secondary_school',
    '2020 rollout, 2025 revision',
    'https://ncdc.go.ug/book-category/o-level-curriculum-revised-competency-based/',
    array[]::smallint[]
  )
  returning id into c;

  insert into public.national_strands (national_curriculum_id, key, name, is_thematic, sort_order)
  values
    (c, 'english', 'English', false, 1),
    (c, 'mathematics', 'Mathematics', false, 2),
    (c, 'history_political_education', 'History and Political Education', false, 3),
    (c, 'geography', 'Geography', false, 4),
    (c, 'physics', 'Physics', false, 5),
    (c, 'biology', 'Biology', false, 6),
    (c, 'chemistry', 'Chemistry', false, 7),
    (c, 'general_science', 'General Science', false, 8),
    (c, 'religious_education', 'Religious Education', false, 9),
    (c, 'entrepreneurship', 'Entrepreneurship', false, 10),
    (c, 'physical_education', 'Physical Education', false, 11),
    (c, 'kiswahili', 'Kiswahili', false, 12),
    (c, 'local_languages', 'Local Languages', false, 13),
    (c, 'foreign_languages', 'Foreign Languages (French, German, Latin, Arabic, Chinese)', false, 14),
    (c, 'literature_english', 'Literature in English', false, 15),
    (c, 'art_design', 'Art and Design', false, 16),
    (c, 'performing_arts', 'Performing Arts', false, 17),
    (c, 'agriculture', 'Agriculture', false, 18),
    (c, 'nutrition_food_technology', 'Nutrition and Food Technology', false, 19),
    (c, 'ict', 'Information and Communication Technology', false, 20),
    (c, 'technology_design', 'Technology and Design', false, 21);

  insert into public.national_aims (national_curriculum_id, kind, position, description)
  select c, 'national', x.ord::smallint, x.txt
  from unnest(array[
    'To promote understanding and appreciation of the value of national unity, patriotism and cultural heritage, with due consideration to international relations and beneficial interdependence.',
    'To inculcate moral, ethical and spiritual values in the individual and to develop self-discipline, integrity, tolerance and human fellowship.',
    'To inculcate into Ugandans a sense of service, duty and leadership for participation in civic, social and national affairs through group activities in educational institutions and the community.',
    'To promote scientific, technical and cultural knowledge, skills and attitudes needed to enhance individual and national development.',
    'To eradicate illiteracy and equip the individual with basic skills and knowledge to exploit the environment for self-development as well as national development; for better health, nutrition and family life, and the capacity for continued learning.',
    'To equip the learners with the ability to contribute to the building of an integrated, self-sustaining and independent national economy.'
  ]) with ordinality as x(txt, ord);

  insert into public.national_rules (
    national_curriculum_id, rule_group, description, requirement_level, sort_order
  )
  values
    (c, 'assessment',
      'Formative assessment is weighted 20% and summative assessment 80%, assessed through oral, written, performance and practical demonstration -- not exam-only.',
      'mandatory', 1),
    (c, 'teaching',
      '5 generic skills (critical thinking and problem-solving; cooperation and self-directed learning; creativity and innovation; mathematical computation and ICT proficiency; communication) and 9 national values (respect for humanity, honesty, justice, hard work, integrity, creativity, social responsibility, national harmony, patriotism) are embedded across every subject rather than taught separately.',
      'mandatory', 2),
    (c, 'teaching',
      'At S1-S2 schools teach up to 12 subjects: compulsory English, Mathematics, History and Political Education, Geography, Physical Education, Religious Education, Entrepreneurship and Kiswahili, a science pathway (separate Physics/Biology/Chemistry or combined General Science), plus one elective. Subject choice narrows to 8-9 subjects at S3-S4.',
      'mandatory', 3);
end $$;

-- ------------------------------------------------------------
-- 4. Upper Secondary / A-Level (S5-S6) -- 29 subjects, weighted AOs
-- ------------------------------------------------------------
do $$
declare
  c uuid;
begin
  if exists (select 1 from public.national_curricula where slug = 'uganda-a-level') then
    raise notice 'national curriculum uganda-a-level already loaded; skipping';
    return;
  end if;

  insert into public.national_curricula (
    slug, title, authority, cycle_label, class_level, ecosystem_type, edition,
    source_url, orientation_terms
  )
  values (
    'uganda-a-level',
    'Advanced Level Curriculum (Competency-Based), Uganda',
    'National Curriculum Development Centre (NCDC), Ministry of Education, Science, Technology and Sports',
    'Upper Secondary (A-Level): Competency-based',
    'S5-S6',
    'secondary_school',
    '2025',
    'https://ncdc.go.ug/book-category/a-level-curriculum-2025/',
    array[]::smallint[]
  )
  returning id into c;

  insert into public.national_strands (national_curriculum_id, key, name, is_thematic, sort_order)
  values
    (c, 'agriculture', 'Agriculture', false, 1),
    (c, 'arabic', 'Arabic', false, 2),
    (c, 'art_design', 'Art and Design', false, 3),
    (c, 'biology', 'Biology', false, 4),
    (c, 'chemistry', 'Chemistry', false, 5),
    (c, 'chinese', 'Chinese', false, 6),
    (c, 'clothing_textiles', 'Clothing and Textiles', false, 7),
    (c, 'cre', 'Christian Religious Education', false, 8),
    (c, 'economics', 'Economics', false, 9),
    (c, 'entrepreneurship', 'Entrepreneurship', false, 10),
    (c, 'foods_nutrition', 'Foods and Nutrition', false, 11),
    (c, 'french', 'French', false, 12),
    (c, 'general_paper', 'General Paper', false, 13),
    (c, 'geography', 'Geography', false, 14),
    (c, 'german', 'German Language', false, 15),
    (c, 'history', 'History', false, 16),
    (c, 'ire', 'Islamic Religious Education', false, 17),
    (c, 'kiswahili', 'Kiswahili', false, 18),
    (c, 'latin', 'Latin Language', false, 19),
    (c, 'literature_english', 'Literature in English', false, 20),
    (c, 'mathematics', 'Mathematics', false, 21),
    (c, 'subsidiary_mathematics', 'Subsidiary Mathematics', false, 22),
    (c, 'physics', 'Physics', false, 23),
    (c, 'luganda', 'Luganda', false, 24),
    (c, 'music', 'Music', false, 25),
    (c, 'geometrical_mechanical_drawing', 'Geometrical and Mechanical Drawing', false, 26),
    (c, 'geometrical_building_drawing', 'Geometrical and Building Drawing', false, 27),
    (c, 'woodwork', 'Woodwork', false, 28),
    (c, 'engineering_metalwork', 'Engineering and Metalwork', false, 29);

  insert into public.national_aims (national_curriculum_id, kind, position, description)
  select c, 'national', x.ord::smallint, x.txt
  from unnest(array[
    'To promote understanding and appreciation of the value of national unity, patriotism and cultural heritage, with due consideration to international relations and beneficial interdependence.',
    'To inculcate moral, ethical and spiritual values in the individual and to develop self-discipline, integrity, tolerance and human fellowship.',
    'To inculcate into Ugandans a sense of service, duty and leadership for participation in civic, social and national affairs through group activities in educational institutions and the community.',
    'To promote scientific, technical and cultural knowledge, skills and attitudes needed to enhance individual and national development.',
    'To eradicate illiteracy and equip the individual with basic skills and knowledge to exploit the environment for self-development as well as national development; for better health, nutrition and family life, and the capacity for continued learning.',
    'To equip the learners with the ability to contribute to the building of an integrated, self-sustaining and independent national economy.'
  ]) with ordinality as x(txt, ord);

  insert into public.national_rules (
    national_curriculum_id, rule_group, description, requirement_level, sort_order
  )
  values
    (c, 'teaching',
      'Each student combines 3 principal subjects + 1 subsidiary subject + the compulsory General Paper.',
      'mandatory', 1),
    (c, 'assessment',
      'Each subject''s assessment is organised around numbered, weighted Assessment Objectives (e.g. AO1, AO2...) specific to that subject, rather than one syllabus-wide mark. See each subject''s own assessment guidelines for its objectives and weights.',
      'mandatory', 1);
end $$;
