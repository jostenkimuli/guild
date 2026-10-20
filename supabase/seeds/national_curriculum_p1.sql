-- ============================================================
-- National curriculum reference data: Uganda, Primary 1 (thematic curriculum)
--
-- Source: "The National Primary School Curriculum for Uganda - Primary 1",
-- National Curriculum Development Centre (NCDC), Ministry of Education,
-- Science, Technology and Sports (reprinted 2016).
--
-- Themes and sub-themes are rows in the generic curriculum_nodes tree
-- (node_type 'theme' / 'sub_theme' / 'competence' -- see migration
-- 20260922000000_flexible_curriculum_nodes.sql). Loaded here: every theme
-- and sub-theme, the aims, the weekly period allocation, the rules, the
-- religious/physical education schedules, and the full competences and
-- assessment guidelines for Theme 1. The competences of Themes 2-12 are not
-- loaded yet.
--
-- NOTE: the NCDC booklet is copyrighted ("no part may be reproduced without
-- the prior written permission of the publisher"). Obtain permission or a
-- licence before loading this text into a production environment.
-- ============================================================

-- Helper: add competence nodes under one sub-theme (by its code, e.g.
-- "1.1"), for one strand. Lives only for this session.
create or replace function pg_temp.seed_competences(
  p_curriculum uuid,
  p_subtheme_code text,
  p_strand_key text,
  p_items text[],
  p_level public.requirement_level default 'required_outcome'
)
returns void
language plpgsql
as $$
declare
  v_subtheme_id uuid;
  v_strand_id uuid;
begin
  select cn.id into v_subtheme_id
  from public.curriculum_nodes as cn
  where cn.national_curriculum_id = p_curriculum
    and cn.node_type = 'sub_theme'
    and cn.attributes ->> 'code' = p_subtheme_code;

  if v_subtheme_id is null then
    raise exception 'seed_competences: sub-theme % not found', p_subtheme_code;
  end if;

  select id into v_strand_id
  from public.national_strands
  where national_curriculum_id = p_curriculum and key = p_strand_key;

  if v_strand_id is null then
    raise exception 'seed_competences: strand % not found', p_strand_key;
  end if;

  insert into public.curriculum_nodes (
    national_curriculum_id, parent_id, node_type, strand_id, title,
    sequence_order, requirement_level
  )
  select p_curriculum, v_subtheme_id, 'competence', v_strand_id, x.txt, x.ord::smallint, p_level
  from unnest(p_items) with ordinality as x(txt, ord);
end;
$$;

-- Helper: add "competences that can be assessed" guidelines under one
-- theme (by theme_no), for one strand.
create or replace function pg_temp.seed_guidelines(
  p_curriculum uuid,
  p_theme_no smallint,
  p_strand_key text,
  p_items text[]
)
returns void
language plpgsql
as $$
declare
  v_theme_node_id uuid;
  v_strand_id uuid;
begin
  select cn.id into v_theme_node_id
  from public.curriculum_nodes as cn
  where cn.national_curriculum_id = p_curriculum
    and cn.node_type = 'theme'
    and (cn.attributes ->> 'theme_no')::smallint = p_theme_no;

  if v_theme_node_id is null then
    raise exception 'seed_guidelines: theme % not found', p_theme_no;
  end if;

  select id into v_strand_id
  from public.national_strands
  where national_curriculum_id = p_curriculum and key = p_strand_key;

  if v_strand_id is null then
    raise exception 'seed_guidelines: strand % not found', p_strand_key;
  end if;

  insert into public.national_assessment_guidelines (
    theme_node_id, strand_id, description, sort_order
  )
  select v_theme_node_id, v_strand_id, x.txt, x.ord::smallint
  from unnest(p_items) with ordinality as x(txt, ord);
end;
$$;

do $$
declare
  c uuid;
begin
  -- Idempotent: hosted syncs run seeds with `db push --include-seed`. Never
  -- reload (deleting would cascade into schools' adoptions and plans).
  if exists (
    select 1 from public.national_curricula where slug = 'uganda-primary-1'
  ) then
    raise notice 'national curriculum uganda-primary-1 already loaded; skipping';
    return;
  end if;

  -- ----------------------------------------------------------
  -- the curriculum
  -- ----------------------------------------------------------
  insert into public.national_curricula (
    slug, title, authority, cycle_label, class_level, ecosystem_type, edition,
    source_url, orientation_terms
  )
  values (
    'uganda-primary-1',
    'The National Primary School Curriculum for Uganda - Primary 1',
    'National Curriculum Development Centre (NCDC), Ministry of Education, Science, Technology and Sports',
    'Lower Primary (P1-P3): Basic Skills',
    'P1',
    'primary_school',
    'Reprinted 2016',
    'https://www.ncdc.go.ug',
    array[1]::smallint[]
  )
  returning id into c;

  -- ----------------------------------------------------------
  -- strands
  -- ----------------------------------------------------------
  insert into public.national_strands (national_curriculum_id, key, name, is_thematic, sort_order)
  values
    (c, 'mathematics', 'Mathematics', true, 1),
    (c, 'literacy', 'Literacy', true, 2),
    (c, 'english', 'English (non-medium)', true, 3),
    (c, 'cpa', 'Creative Performing Arts', true, 4),
    (c, 'life_skills', 'Life Skills and Values', true, 5),
    (c, 'cre', 'Christian Religious Education', false, 6),
    (c, 'ire', 'Islamic Religious Education', false, 7),
    (c, 'pe', 'Physical Education', false, 8);

  -- ----------------------------------------------------------
  -- aims
  -- ----------------------------------------------------------
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

  insert into public.national_aims (national_curriculum_id, kind, position, description)
  select c, 'primary', x.ord::smallint, x.txt
  from unnest(array[
    'To enable individuals to acquire functional, permanent and developmental literacy, numeracy and communication skills in English, Kiswahili and, at least, one Uganda Language.',
    'To develop and maintain sound mental and physical health among learners.',
    'To instil the values of living and working cooperatively with other people and caring for others in the community.',
    'To develop and cherish the cultural, moral and spiritual values of life and appreciate the richness that lies in our varied and diverse cultures and values.',
    'To promote understanding and appreciation for the protection and utilisation of the natural environment, using scientific and technological knowledge and skills.',
    'To develop an understanding of one''s rights and civic responsibilities and duties for the purpose of positive and responsible participation in civic matters.',
    'To develop a sense of patriotism, nationalism and national unity in diversity.',
    'To develop pre-requisites for continuing education.',
    'To acquire a variety of practical skills for enabling one to make a living in a multi-skilled manner.',
    'To develop an appreciation for the dignity of work and for making a living by one''s honest effort.',
    'To equip the child with the knowledge, skills and values of responsible parenthood.',
    'To develop skills in management of time and finance and respect for private and public property.',
    'To develop the ability to use the problem-solving approach in various life situations.',
    'To develop discipline and good manners.'
  ]) with ordinality as x(txt, ord);

  -- ----------------------------------------------------------
  -- weekly period allocation (adds up to 40 periods a week)
  -- ----------------------------------------------------------
  insert into public.national_period_allocations (
    national_curriculum_id, key, label, group_label, periods, block_size, follows_key, note, sort_order
  )
  values
    (c, 'news', 'News', 'News', 3, 1, null,
      'Usually the first period of the day; draws on learners'' out-of-school experiences.', 1),
    (c, 'local_language', 'Local language', 'News', 2, 1, null,
      'Two local-language periods a week alongside the three News periods.', 2),
    (c, 'mathematics', 'Mathematics', null, 5, 1, null, null, 3),
    (c, 'literacy_1', 'Literacy I', null, 5, 1, null,
      'Literacy I and II follow one another.', 4),
    (c, 'literacy_2', 'Literacy II', null, 5, 1, 'literacy_1',
      'Always directly after Literacy I.', 5),
    (c, 'english', 'English', null, 5, 1, null, null, 6),
    (c, 'music', 'Music', 'Creative Performing Arts', 3, 1, null, null, 7),
    (c, 'art_craft', 'Art and Craft', 'Creative Performing Arts', 2, 1, null, null, 8),
    (c, 'pe', 'Physical Education', null, 5, 1, null, null, 9),
    (c, 're', 'Religious Education', null, 3, 1, null,
      'Christian or Islamic Religious Education.', 10),
    (c, 'free_activity', 'Free Activity', null, 2, 2, null,
      'One double lesson, mostly play-based.', 11);

  -- ----------------------------------------------------------
  -- rules
  -- ----------------------------------------------------------
  insert into public.national_rules (
    national_curriculum_id, rule_group, description, requirement_level, sort_order
  )
  values
    (c, 'language',
      'A local language (the child''s own, or one familiar to the child) is the language of instruction and assessment in P1-P3. English is taught as a subject.',
      'mandatory', 1),
    (c, 'language',
      'Only when no local or area language predominates in a school is the curriculum delivered and assessed in English.',
      'mandatory', 2),
    (c, 'timetable',
      'Literacy I and Literacy II lessons follow one another.',
      'mandatory', 1),
    (c, 'timetable',
      'The News lesson is generally the first period of the day. Schools provide 3 News periods and 2 local-language periods a week.',
      'mandatory', 2),
    (c, 'timetable',
      'The Free Activity lesson is a double lesson.',
      'mandatory', 3),
    (c, 'timetable',
      'Music (3 periods) and Art and Craft (2 periods) sit under Creative Performing Arts.',
      'mandatory', 4),
    (c, 'assessment',
      'Assessment happens during normal lessons. Teachers do not set separate assessment tests or examinations.',
      'mandatory', 1),
    (c, 'assessment',
      'Teachers keep a record for each learner showing the competences achieved. Assessment is cumulative.',
      'mandatory', 2),
    (c, 'assessment',
      'Use simple check-lists. Show learner performance on a progress chart and give regular reports to learners and parents.',
      'mandatory', 3),
    (c, 'assessment',
      'The main purpose of assessment at this stage is diagnostic and remedial.',
      'mandatory', 4),
    (c, 'teaching',
      'The curriculum is flexible and not exhaustive. Teachers choose activities that suit their learners, mostly songs, games, acting and drawing.',
      'flexible', 1),
    (c, 'teaching',
      'Free Activity lessons may be structured in any appropriate way.',
      'flexible', 2);

  -- ----------------------------------------------------------
  -- themes, then sub-themes as their children
  -- (Term 1: 1-4, Term 2: 5-8, Term 3: 9-12)
  -- ----------------------------------------------------------
  with inserted_themes as (
    insert into public.curriculum_nodes (
      national_curriculum_id, parent_id, node_type, title, description, sequence_order, attributes
    )
    select c, null, 'theme', x.name, x.learning_outcome, x.theme_no,
      jsonb_build_object('theme_no', x.theme_no, 'term_no', x.term_no)
    from (values
      (1, 1, 'Our School',
        'The learner is able to know, communicate with, and relate to other people harmoniously; show creativity by producing and manipulating learning and play materials available in his/her immediate environment.'),
      (1, 2, 'Our Home',
        'The learner is able to know and relate to people, identify things in the home, appreciate and participate in home activities.'),
      (1, 3, 'Our Community',
        'The learner is able to know, communicate and relate with other people harmoniously, and identify important places in the community.'),
      (1, 4, 'The Human Body and Health',
        'The learner is able to identify, protect know and care for his/her body for health.'),
      (2, 5, 'Weather',
        'The learner is able to know, appreciate and manage weather to improve production and the economy.'),
      (2, 6, 'Accidents and Safety',
        'The learner is able to identify and know the common accidents, understand the importance and effects of taking precautions.'),
      (2, 7, 'Living Together',
        'The learner is able to identify people, relate and appreciate ways of living with them harmoniously.'),
      (2, 8, 'Food and Nutrition',
        'The learner is able to identify sources of food, appreciate its uses and demonstrate ways of keeping it safe.'),
      (3, 9, 'Our Transport',
        'The learner is able to differentiate types and means of transport, appreciate their importance and related measures.'),
      (3, 10, 'Things We Make',
        'The learner is able to identify, appreciate and express oneself aesthetically and imaginatively.'),
      (3, 11, 'Our Environment',
        'The child is able to explore, observe, appreciate and identify ways of conserving the environment.'),
      (3, 12, 'Peace and Security',
        'The learner is able to recognise and appreciate the importance of living with others harmoniously in the home, school and community.')
    ) as x(term_no, theme_no, name, learning_outcome)
    returning id, (attributes ->> 'theme_no')::int as theme_no
  )
  insert into public.curriculum_nodes (
    national_curriculum_id, parent_id, node_type, title, description, sequence_order, attributes
  )
  select c, it.id, 'sub_theme', x.name, x.content, x.pos,
    jsonb_build_object('code', x.code, 'position', x.pos)
  from (values
    (1, '1.1', 1, 'People in our school (titles and names)',
      'Titles (Sir, Madam, teacher, nurse, Mrs, Miss, Mr) and names (e.g. Masika, Silvia, Wambi, Daudi)'),
    (1, '1.2', 2, 'Things in our school',
      'Buildings, classroom objects, play objects, sign-post, gate, flag'),
    (1, '1.3', 3, 'Activities in our school',
      'Sweeping, gardening, reading, writing, playing, praying, cleaning, caring, teaching, learning'),
    (2, '2.1', 1, 'People in our home (nuclear family)',
      'Nuclear family: father, mother, children'),
    (2, '2.2', 2, 'Roles and responsibilities of different family members',
      'Cooking, cleaning, milking, washing, pounding, grinding, digging, peeling, slashing, sweeping, mopping, breast-feeding'),
    (2, '2.3', 3, 'Things found in our home and their uses',
      'Objects found in our home, rooms in the house, animals, birds, plants'),
    (3, '3.1', 1, 'People in our community',
      'Doctor, teacher, nurse, shopkeeper, carpenter, driver, policeman, barber, religious leaders, LC leaders'),
    (3, '3.2', 2, 'Activities in our community',
      'Fishing, keeping cattle, farming, trading, building, washing, mining, cultural activities (circumcision, marriage)'),
    (3, '3.3', 3, 'Important places in our community',
      'School, hospital, post office, radio station, market, places of worship, bank, police station, recreation centre'),
    (4, '4.1', 1, 'External parts of the body and their uses',
      'Parts: eyes, ears, nose, lips, hands, legs. Uses: see, walk, touch, hear, taste, smell'),
    (4, '4.2', 2, 'Personal hygiene',
      'Ways of caring for body parts, materials used for cleaning our bodies, importance of keeping clean'),
    (4, '4.3', 3, 'Diseases',
      'Common diseases, causes and spread of diseases, preventive measures'),
    (5, '5.1', 1, 'Elements and types of weather',
      'Elements (sun, rain, clouds, wind) and types (rainy, cloudy, sunny, windy)'),
    (5, '5.2', 2, 'Activities for different seasons',
      'Preparing land, planting, watering plants, weeding, harvesting, drying seeds and crops, marketing; tools'),
    (5, '5.3', 3, 'Effects and management of weather',
      'Effects (sweat, getting wet, slides, floods, storms, soil erosion, drought) and management (clothing, mulching, watering, planting trees, wind breakers, water harvesting)'),
    (6, '6.1', 1, 'Accidents and safety at home',
      'Burns, falling, cutting, poisoning, snake or dog bite, drowning, electric shock; safety precautions; effects of accidents'),
    (6, '6.2', 2, 'Accidents and safety on the way',
      'Snake, dog or insect bites, motor accident, drowning, cuts and injuries, electrical shock, lightning; safety precautions; effects'),
    (6, '6.3', 3, 'Accidents and safety at school and in class',
      'Cuts and injuries, drowning, fractures, falling in a pit latrine or septic tank, poisoning; safety precautions; effects'),
    (7, '7.1', 1, 'The family',
      'Nuclear family (father, mother, children) and extended family (grandparents, uncles, aunts, other relatives)'),
    (7, '7.2', 2, 'Ways of living together in the school',
      'School activities (playing, sharing, working, caring, helping, learning) and school routine (rules, motto, anthem, school prayer)'),
    (7, '7.3', 3, 'Ways of living together in the community',
      'Working together (clearing roads, cleaning wells, sharing, caring) and taking part in ceremonies (wedding, naming, baptism)'),
    (8, '8.1', 1, 'Names and sources of food',
      'Names (fish, peas, millet, groundnuts, bananas, eggs, simsim, potatoes) and sources (lake, garden, market, river, animals, plants, shops)'),
    (8, '8.2', 2, 'Uses of food to our bodies',
      'Health, strength, growth'),
    (8, '8.3', 3, 'Keeping food safe',
      'Ways of keeping food safe (covering, washing, smoking, salting, cooking, refrigerating, sun drying, storing) and why it matters'),
    (9, '9.1', 1, 'Types and means of transport',
      'Types (rail, water, air, road) and means (car, bus, bicycle, motorcycle, donkey, camel, horse, ship, boat, aeroplane, train, helicopter)'),
    (9, '9.2', 2, 'Importance of transport',
      'Carrying people, foods, building materials, animals, water'),
    (9, '9.3', 3, 'Measures related to transport',
      'Time (non-unitary), money, distance, speed, size'),
    (10, '10.1', 1, 'Things we make at home and at school',
      'Mats, baskets, pots, dolls, toys, balls, ropes, hats, winnowers'),
    (10, '10.2', 2, 'Materials we use and their sources',
      'Materials (banana fibres, sisal, seeds, clay) and sources (swamp, forests, plants)'),
    (10, '10.3', 3, 'Importance of things we make',
      'Income generation, domestic use, play, decoration, teaching and learning'),
    (11, '11.1', 1, 'Components and importance of things in our environment',
      'Components (people, rivers, lakes, mountains, plants, land, hills, animals) and their importance'),
    (11, '11.2', 2, 'Factors that damage our environment',
      'Cutting down trees, burning grass, over-grazing, poor farming methods, poor waste disposal, building in wetlands, over-harvesting of sand, leaving uncovered holes, pollution'),
    (11, '11.3', 3, 'Conservation of our environment',
      'Mulching, watering, planting trees, proper waste disposal, water harvesting, proper use of available resources'),
    (12, '12.1', 1, 'Peace and security in our homes',
      'Factors that promote peace and security at home; causes of insecurity in our home'),
    (12, '12.2', 2, 'Peace and security in our school',
      'Factors promoting peace at school; causes of insecurity in our school'),
    (12, '12.3', 3, 'Peace and security in our community',
      'People who keep peace and security in our community; importance of peace and security')
  ) as x(theme_no, code, pos, name, content)
  join inserted_themes as it on it.theme_no = x.theme_no;

  -- ----------------------------------------------------------
  -- Theme 1 competences (full, from the NCDC matrix)
  -- ----------------------------------------------------------

  -- 1.1 People in our school
  perform pg_temp.seed_competences(c, '1.1', 'mathematics', array[
    'Sorting', 'Comparing', 'Matching',
    'Counting 1-5 using objects, e.g. stones, pictures'
  ]);
  perform pg_temp.seed_competences(c, '1.1', 'literacy', array[
    'Naming', 'Identifying', 'Describing, e.g. pictures of people',
    'Listening to stories', 'Reciting rhymes about school',
    'Giving and responding to commands',
    'Role-playing: welcoming, greeting and bidding farewell in different situations',
    'Pre-reading: reciting rhymes, comparing pictures, drawing, recognising name tags, matching',
    'Pre-writing: drawing, scribbling, tracing, matching, completing missing parts, making patterns'
  ]);
  perform pg_temp.seed_competences(c, '1.1', 'english', array[
    'Greetings: "Good morning"',
    'Naming people by title, i.e. Sir, teacher, Mr., Madam (as used in the school)',
    'Reciting rhymes',
    'Referring to people by name and sex, e.g. Wambi, boy, girl',
    'Using the structures: "What''s your name?" / "My name is ..."',
    'Using the structures: "I am a ... (girl/boy)"',
    'Using the structures: "What is his/her name?" / "His/her name is ..." / "He / She is ..."'
  ]);
  perform pg_temp.seed_competences(c, '1.1', 'cpa', array[
    'Singing / signing songs related to the people in the school',
    'Singing and dancing', 'Modelling', 'Drawing'
  ]);
  perform pg_temp.seed_competences(c, '1.1', 'life_skills', array[
    'Effective communication', 'Creative thinking', 'Problem-solving',
    'Critical thinking', 'Decision-making', 'Self-esteem',
    'Mobility, orientation and rehabilitation (SNE)',
    'Respect', 'Identity', 'Cooperation', 'Appreciation', 'Friendliness'
  ], 'flexible');

  -- 1.2 Things in our school
  perform pg_temp.seed_competences(c, '1.2', 'mathematics', array[
    'Sorting, e.g. objects by shape, size and colour', 'Counting 1-5'
  ]);
  perform pg_temp.seed_competences(c, '1.2', 'literacy', array[
    'Naming, e.g. objects and pictures', 'Identifying',
    'Describing, e.g. objects and pictures', 'Role-playing',
    'Pre-reading: matching picture to picture, matching picture to objects correctly',
    'Pre-writing: drawing, scribbling, colouring, pasting, modelling, making patterns'
  ]);
  perform pg_temp.seed_competences(c, '1.2', 'english', array[
    'Naming things in the school, e.g. chair, duster, table, desk, bench, chalkboard, window, door, book, pencil',
    'Using the structures: "What''s this?" / "This is a ..."',
    'Using the structures: "What''s that?" / "It''s a ..."',
    'Using the structure: "Show me a ..."'
  ]);
  perform pg_temp.seed_competences(c, '1.2', 'cpa', array[
    'Singing simple songs about things in our school', 'Reciting simple rhymes',
    'Singing simple traditional songs', 'Modelling objects', 'Drawing',
    'Making play items from locally available materials'
  ]);
  perform pg_temp.seed_competences(c, '1.2', 'life_skills', array[
    'Friendship formation', 'Mobility orientation and rehabilitation (SNE)',
    'Interpersonal relationships', 'Sharing', 'Responsibility', 'Care'
  ], 'flexible');

  -- 1.3 Activities in our school
  perform pg_temp.seed_competences(c, '1.3', 'mathematics', array[
    'Sorting into sets', 'Counting 1-5', 'Matching', 'Sequencing',
    'Adding 1 more', 'Playing number games'
  ]);
  perform pg_temp.seed_competences(c, '1.3', 'literacy', array[
    'Naming, e.g. activities performed at school', 'Describing',
    'Talking about activities in our school', 'Asking and answering questions',
    'Role-playing: calls and commands, e.g. go, come, take, stop',
    'Saying tongue twisters',
    'Pre-reading: reciting rhymes, comparing, matching',
    'Pre-writing: tracing, making patterns, drawing, tearing and pasting, colouring / shading'
  ]);
  perform pg_temp.seed_competences(c, '1.3', 'english', array[
    'Naming activities in our school, e.g. sweep, garden, read, write, play, pray, clean, learn',
    'Using the structures: "What are you doing?" / "I am ..." / "We are ..."',
    'Using the structures: "What is she/he doing?" / "She/he is ..."'
  ]);
  perform pg_temp.seed_competences(c, '1.3', 'cpa', array[
    'Singing the National Anthem', 'Telling / signing stories', 'Role-playing',
    'Acting short plays', 'Singing lullabies', 'Drawing', 'Tracing', 'Colouring',
    'Folding and tearing papers'
  ]);
  perform pg_temp.seed_competences(c, '1.3', 'life_skills', array[
    'Self-awareness', 'Decision-making', 'Friendship formation',
    'Non-violent conflict resolution', 'Self-esteem', 'Coping with stress',
    'Effective communication', 'Assertiveness',
    'Mobility orientation and rehabilitation (SNE)',
    'Patience', 'Co-operation', 'Unity', 'Endurance', 'Sharing'
  ], 'flexible');

  -- Theme 1 assessment guidelines
  perform pg_temp.seed_guidelines(c, 1::smallint, 'mathematics', array[
    'Sort objects or pictures of people by shape and size',
    'Count to 5',
    'Match picture to picture with the same number of items up to 5',
    'Add "1 more"'
  ]);
  perform pg_temp.seed_guidelines(c, 1::smallint, 'literacy', array[
    'Listen to others attentively', 'Tell his/her news appropriately',
    'Tell his/her names logically', 'Trace and shade with some accuracy',
    'Sit in a proper posture when writing', 'Hold a pencil appropriately when writing',
    'Use appropriate language in welcoming, greeting and bidding farewell'
  ]);
  perform pg_temp.seed_guidelines(c, 1::smallint, 'cpa', array[
    'Draw shapes and colour them', 'Model at least one meaningful item',
    'Sing the first two lines of the National Anthem',
    'Play at least one percussion instrument', 'Sing a song and move to the rhythm'
  ]);
  perform pg_temp.seed_guidelines(c, 1::smallint, 'english', array[
    'Greet one another',
    'Name 5 items in the classroom and pronounce them correctly',
    'Respond to 5 commands appropriately', 'Introduce oneself and others'
  ]);

  -- ----------------------------------------------------------
  -- Religious and physical education (run outside the themes)
  -- ----------------------------------------------------------
  insert into public.national_area_units (strand_id, term_no, weeks_label, title, learning_outcome, sort_order)
  select s.id, x.term_no, x.weeks, x.title, x.outcome, x.ord
  from (values
    -- Christian Religious Education: Discovering God's gift to me
    ('cre', 1, 'Weeks 2-4', 'I am part of God''s creation', 'The learner is able to discover, understand and appreciate God''s creation and care for it.', 1),
    ('cre', 1, 'Weeks 5-7', 'People found at school and visitors', null, 2),
    ('cre', 1, 'Weeks 8-10', 'People found at home and those who visit us', null, 3),
    ('cre', 1, 'Weeks 11-13', 'Aspects of physical creation in the environment', null, 4),
    ('cre', 2, 'Weeks 1-3', 'The world God has made for us', null, 1),
    ('cre', 2, 'Weeks 4-6', 'God''s family and Jesus our brother, the Son of God', null, 2),
    ('cre', 2, 'Weeks 7-9', 'Jesus'' teaching and serving others', null, 3),
    ('cre', 2, 'Weeks 10-12', 'God''s family, e.g. the church', null, 4),
    ('cre', 3, 'Weeks 1-3', 'God''s family with Jesus our friend', null, 1),
    ('cre', 3, 'Weeks 4-6', 'God''s family and our concern for sharing', null, 2),
    ('cre', 3, 'Weeks 7-9', 'Interpersonal relationships in the home', null, 3),
    ('cre', 3, 'Weeks 10-12', 'God''s family and his love', null, 4),
    -- Islamic Religious Education
    ('ire', 1, 'Weeks 2-4', 'Reading from the Quran: the Islamic greeting (Salaam) and Surat Al-Fatiha', 'The learner is able to appreciate, and practise the principles and teachings of Islam in order to have total submission to the will and laws of God.', 1),
    ('ire', 1, 'Weeks 5-7', 'Tawhiid (faith): worshipping', 'The learner is able to understand the principle of Tawhiid.', 2),
    ('ire', 1, 'Weeks 8-10', 'Fiqh (practices): physical purity and ablution', 'The learner is able to recognise and understand the rules and regulations of the places of worship and the concept of physical purity.', 3),
    ('ire', 1, 'Weeks 11-13', 'Moral and spiritual teachings: duas, respect, and the life of Prophet Muhammad', 'The learner is able to know and appreciate the life of Prophet Mohammed (PBHU), practices (prayers) for different occasions and show respect for parents, teachers, leaders and elders.', 4),
    ('ire', 2, 'Weeks 1-3', 'Reading from the Quran: Surat Al-Ikhlas', 'The learner is able to recite Surat Al-Ikhlas and understand the message contained in the Surah.', 1),
    ('ire', 2, 'Weeks 4-6', 'Tawhiid (faith): attributes of God and the pillars of faith (Imaan)', 'The learner is able to understand the principles of Tawhiid.', 2),
    ('ire', 2, 'Weeks 7-9', 'Moral and spiritual teaching (Hadith): showing respect', 'The learner is able to understand and appreciate the value of respect.', 3),
    ('ire', 2, 'Weeks 10-12', 'The history of Islam: Muhammad as a youth', 'The learner is able to know and appreciate the life of Prophet Mohammed (P.B.U.H).', 4),
    ('ire', 3, 'Weeks 1-3', 'Reading from the Quran: Surat Annas', 'The learner is able to recite Surat Annas and understand the message contained in the Surah.', 1),
    ('ire', 3, 'Weeks 4-6', 'Tawhiid (faith): Allah and His creation', 'The learner is able to understand the principle of Tawhiid.', 2),
    ('ire', 3, 'Weeks 7-9', 'Fiqh (practice): types of water and Tayammum', 'The learner is able to recognise, understand the rules and regulations of the places of worship and the concept of physical purity.', 3),
    ('ire', 3, 'Weeks 10-12', 'Moral and spiritual teaching: cleanliness; history of Islam: Muhammad''s trip to Syria', 'The learner is able to understand the importance of cleanliness of the environment of prayer and uphold it.', 4),
    -- Physical Education
    ('pe', 1, 'Weeks 2-4', 'Traditional games: imitational games', null, 1),
    ('pe', 1, 'Weeks 5-7', 'Body movement experiences and space awareness', null, 2),
    ('pe', 1, 'Weeks 8-10', 'Traditional games: imitational movements', null, 3),
    ('pe', 1, 'Weeks 11-13', 'Games for lower primary: simple games', null, 4),
    ('pe', 2, 'Weeks 1-3', 'Traditional games involving imitation', null, 1),
    ('pe', 2, 'Weeks 4-6', 'Experience with body and space', null, 2),
    ('pe', 2, 'Weeks 7-9', 'Games for lower primary: simple games', null, 3),
    ('pe', 2, 'Weeks 10-12', 'Traditional games involving imitation: animal-like movements', null, 4),
    ('pe', 3, 'Weeks 1-3', 'Basic movement experiences and space awareness', null, 1),
    ('pe', 3, 'Weeks 4-6', 'Games for lower primary: simple games', null, 2),
    ('pe', 3, 'Weeks 7-9', 'Traditional games involving imitation', null, 3),
    ('pe', 3, 'Weeks 10-12', 'Games for lower primary: simple games', null, 4)
  ) as x(strand_key, term_no, weeks, title, outcome, ord)
  join public.national_strands as s
    on s.national_curriculum_id = c and s.key = x.strand_key;
end $$;
