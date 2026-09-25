-- ============================================================
-- National curriculum reference data: Uganda, Primary 1 -- Themes 2-12
--
-- Adds the competences and assessment guidelines for the remaining 11
-- themes, loaded structurally (but not populated) by
-- national_curriculum_p1.sql. Same source, same helper-function pattern.
-- Loaded as a second seed file since the first is idempotent per-curriculum
-- (skips entirely once uganda-primary-1 exists) and re-running it would
-- never reach these inserts.
-- ============================================================

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
  select id into c from public.national_curricula where slug = 'uganda-primary-1';
  if c is null then
    raise exception 'uganda-primary-1 curriculum not found; run national_curriculum_p1.sql first';
  end if;

  -- Idempotent: skip if Theme 2 already has competences loaded.
  if exists (
    select 1
    from public.curriculum_nodes as cn
    where cn.national_curriculum_id = c
      and cn.node_type = 'sub_theme'
      and cn.attributes ->> 'code' = '2.1'
      and exists (
        select 1 from public.curriculum_nodes as comp
        where comp.parent_id = cn.id and comp.node_type = 'competence'
      )
  ) then
    raise notice 'Themes 2-12 competences already loaded; skipping';
    return;
  end if;

  -- ============================================================
  -- Theme 2: Our Home
  -- ============================================================

  -- 2.1 People in our home (Nuclear Family)
  perform pg_temp.seed_competences(c, '2.1', 'mathematics', array[
    'Forming sets', 'Comparing, e.g. bigger than, smaller than, wider than',
    'Counting things 1-10', 'Playing number games',
    'Adding orally up to 5 using concrete objects',
    'Measuring height using non-standard units',
    'Recognising and writing number symbols 1-5'
  ]);
  perform pg_temp.seed_competences(c, '2.1', 'literacy', array[
    'Listening to stories about people at home', 'Naming', 'Grouping', 'Talking about',
    'Telling / re-telling / signing stories', 'Reciting rhymes and prayers',
    'Pre-reading: recognising, e.g. shapes, objects', 'Pre-reading: matching',
    'Pre-reading: sequencing pictures according to size', 'Pre-reading: joining puzzles',
    'Pre-writing: writing patterns', 'Pre-writing: scribbling',
    'Pre-writing: joining dots using lines', 'Pre-writing: tracing different shapes',
    'Pre-writing: shading', 'Pre-writing: drawing and copying'
  ]);
  perform pg_temp.seed_competences(c, '2.1', 'english', array[
    'Naming family members, e.g. mother, father, baby, sister, brother, girl, boy, woman, man, child',
    'Using the structures: "This is my ..." / "Show me a ..."',
    'Using the structures: "This is a ..." / "Point to the ..." / "I am pointing to the ..."'
  ]);
  perform pg_temp.seed_competences(c, '2.1', 'cpa', array[
    'Singing / signing', 'Listening', 'Acting',
    'Making simple percussion instruments, e.g. shakers, clappers',
    'Modelling', 'Making colours using locally available materials',
    'Drawing / brailing', 'Tearing and pasting', 'Colouring', 'Shading', 'Threading'
  ]);
  perform pg_temp.seed_competences(c, '2.1', 'life_skills', array[
    'Self-awareness', 'Self-esteem', 'Decision-making', 'Interpersonal relationships',
    'Mobility orientation and rehabilitation (SNE)', 'Identity', 'Respect', 'Togetherness', 'Loyalty'
  ], 'flexible');

  -- 2.2 Roles/responsibilities of different family members
  perform pg_temp.seed_competences(c, '2.2', 'mathematics', array[
    'Sorting different objects according to kind', 'Forming sets', 'Counting 1-10',
    'Playing number games', 'Matching number symbols to pictures 1-5',
    'Filling in missing numbers up to 5, e.g. 1, 2, box, 4, 5',
    'Adding orally up to 5 using concrete objects',
    'Measuring time: morning, afternoon, evening, night',
    'Telling time of the day using natural indicators, e.g. sun, trees, shadows',
    'Measuring shadows according to length relating to time of the day'
  ]);
  perform pg_temp.seed_competences(c, '2.2', 'literacy', array[
    'Identifying', 'Saying riddles',
    'Naming different activities, e.g. cooking, cleaning, milking, washing',
    'Telling / re-telling / signing stories', 'Reciting rhymes, tongue twisters',
    'Imitating family roles',
    'Role-playing greetings at different times, e.g. morning, afternoon, evening',
    'Pre-reading: describing', 'Pre-reading: recognising pictures', 'Pre-reading: matching',
    'Pre-reading: fitting jigsaws', 'Pre-reading: drawing straight lines',
    'Pre-writing: scribbling', 'Pre-writing: shading', 'Pre-writing: writing patterns',
    'Pre-writing: colouring / painting', 'Pre-writing: drawing and copying'
  ]);
  perform pg_temp.seed_competences(c, '2.2', 'english', array[
    'Naming roles and responsibilities of family members, e.g. cook, clean, wash, dig, teach, milk, sweep',
    'Using the structures: "What are you doing?" / "I am ...ing"',
    'Using the structures: "What is she/he doing?" / "She/He is ...ing"'
  ]);
  perform pg_temp.seed_competences(c, '2.2', 'cpa', array[
    'Singing / signing', 'Listening', 'Decorating',
    'Modelling using local available materials', 'Drawing', 'Colouring', 'Tearing and pasting'
  ]);
  perform pg_temp.seed_competences(c, '2.2', 'life_skills', array[
    'Creative thinking', 'Critical thinking', 'Assertiveness', 'Effective communication',
    'Friendship formation', 'Interpersonal relationships', 'Coping with emotions', 'Self esteem',
    'Mobility orientation and rehabilitation (SNE)', 'Responsibility', 'Co-operation',
    'Endurance', 'Unity', 'Acceptance', 'Appreciation', 'Respect', 'Patience'
  ], 'flexible');

  -- 2.3 Things found in our home and their uses
  perform pg_temp.seed_competences(c, '2.3', 'mathematics', array[
    'Sorting, e.g. common objects in the home', 'Drawing shapes: circle, square',
    'Writing number symbols 1-5', 'Matching number symbols 1-5 to pictures or objects',
    'Adding objects within the range of 5',
    'Recognising that 2 + 3 = 3 + 2, practically using concrete objects'
  ]);
  perform pg_temp.seed_competences(c, '2.3', 'literacy', array[
    'Saying proverbs / tongue twisters', 'Imitating animal and bird sounds, e.g. cat, cow',
    'Naming different things found in our home and their uses',
    'Talking about things found in a home', 'Reciting rhymes and prayers',
    'Telling / re-telling / signing stories about things in our home',
    'Pre-reading: recognising, e.g. missing parts in pictures and shapes',
    'Pre-reading: sequencing different objects by size', 'Pre-reading: fitting jigsaws puzzles',
    'Pre-reading: reading simple words related to animals in the home',
    'Pre-writing: tracing', 'Pre-writing: scribbling', 'Pre-writing: drawing',
    'Pre-writing: shading', 'Pre-writing: copying', 'Pre-writing: writing patterns'
  ]);
  perform pg_temp.seed_competences(c, '2.3', 'english', array[
    'Naming things found in our home, e.g. cow, goat, hen, duck, banana plant, mango tree, bird, egg, milk, bed, spoon, fork, plate, cup, red, blue',
    'Using the structures: "Show me a ..." / "This is a ..."',
    'Using the structures: "What is this/that?" / "This/that is a ..."'
  ]);
  perform pg_temp.seed_competences(c, '2.3', 'cpa', array[
    'Singing / signing', 'Role-playing', 'Movement', 'Listening',
    'Making play things using local available materials', 'Drawing', 'Painting', 'Cutting and pasting'
  ]);
  perform pg_temp.seed_competences(c, '2.3', 'life_skills', array[
    'Interpersonal relationships', 'Negotiation', 'Decision-making', 'Self-awareness',
    'Critical thinking', 'Creative thinking', 'Problem solving', 'Self-esteem',
    'Mobility orientation and rehabilitation (SNE)', 'Sharing', 'Responsibility',
    'Care', 'Honesty', 'Friendship', 'Patience', 'Cooperation', 'Unity'
  ], 'flexible');

  perform pg_temp.seed_guidelines(c, 2::smallint, 'mathematics', array[
    'Count 1-10', 'Write and match number symbols 1-5 with pictures / objects',
    'Sort objects by shape', 'Measure height using non-standard units',
    'Add up to 5 using concrete materials / adding objects within the range 5',
    'Tell different times of day'
  ]);
  perform pg_temp.seed_guidelines(c, 2::smallint, 'literacy', array[
    'Naming things found in the home and their uses', 'Describe shapes and objects',
    'Tell a simple story', 'Trace with accuracy', 'Draw 2 animals and copy their names',
    'Copy a simple pattern accurately', 'State at least 2 riddles / proverbs correctly'
  ]);
  perform pg_temp.seed_guidelines(c, 2::smallint, 'cpa', array[
    'Draw and colour', 'Model one item', 'Sing a song correctly'
  ]);
  perform pg_temp.seed_guidelines(c, 2::smallint, 'english', array[
    'Identify 4 close members of the family by their names and titles',
    'Name 6 things in the home', 'Introduce self by name',
    'Use the learnt words and structures correctly'
  ]);

  -- ============================================================
  -- Theme 3: Our Community
  -- ============================================================

  -- 3.1 People in our community
  perform pg_temp.seed_competences(c, '3.1', 'mathematics', array[
    'Sorting', 'Sequencing', 'Matching', 'Forming different sets', 'Counting (1-20)',
    'Writing number symbols 1-9', 'Filling in missing numbers, e.g. 3, 4, 5, box, 7, 8'
  ]);
  perform pg_temp.seed_competences(c, '3.1', 'literacy', array[
    'Naming people by title, name and gender', 'Identifying', 'Listening to folk tales',
    'Telling / re-telling / signing stories', 'Reciting rhymes',
    'Describing people according to size, height, behaviour, position, title and occupation',
    'Describing pictures of people', 'Pre-reading: matching pictures', 'Pre-reading: reading pictures',
    'Pre-reading: recognising and reacting to appropriate imperatives (4 commands, e.g. come in, stand up)',
    'Pre-reading: identifying 3 vowel letters within context of known words',
    'Pre-writing: joining dots to form pictures', 'Pre-writing: modelling letters',
    'Pre-writing: tracing', 'Pre-writing: copying simple words'
  ]);
  perform pg_temp.seed_competences(c, '3.1', 'english', array[
    'Naming people in our community, e.g. boy, girl, man, woman, doctor, nurse, teacher, shopkeeper',
    'Using the structures: "Show me ..." / "This/that is a ..."',
    'Using the structures: "Who is he/she ...?" / "He/She is ..." / "Point to ..." / "I am pointing to ..."',
    'Playing situational games related to roles'
  ]);
  perform pg_temp.seed_competences(c, '3.1', 'cpa', array[
    'Imitating', 'Reciting', 'Role-playing', 'Singing / signing', 'Movement',
    'Drawing', 'Colouring', 'Shading', 'Modelling', 'Sorting'
  ]);
  perform pg_temp.seed_competences(c, '3.1', 'life_skills', array[
    'Effective communication', 'Self-awareness', 'Creative thinking',
    'Interpersonal relationships', 'Problem-solving', 'Critical thinking',
    'Mobility, orientation and rehabilitation (SNE)', 'Acceptance', 'Togetherness',
    'Respect', 'Cooperation', 'Unity', 'Friendliness', 'Identity', 'Sympathy', 'Responsibility'
  ], 'flexible');

  -- 3.2 Activities in our community
  perform pg_temp.seed_competences(c, '3.2', 'mathematics', array[
    'Forming sets', 'Counting (11-20)', 'Matching', 'Measuring capacity of containers',
    'Adding numbers orally with sum less than 20', 'Telling time: days of the week',
    'Recognising the symbols "+" and "="', 'Adding numbers whose sum is less than 10'
  ]);
  perform pg_temp.seed_competences(c, '3.2', 'literacy', array[
    'Naming at least 10 activities', 'Identifying', 'Saying tongue-twisters',
    'Telling / signing stories', 'Fitting jigsaw puzzles',
    'Naming different tools used in different activities, e.g. fishing net',
    'Pre-reading: telling days of the week',
    'Pre-reading: reading and reacting to appropriate imperatives (4 more commands, e.g. go out, sit down)',
    'Pre-writing: scribbling', 'Pre-writing: tracing', 'Pre-writing: copying',
    'Pre-writing: writing patterns and letters',
    'Pre-writing: identifying more vowel letters within context of known words'
  ]);
  perform pg_temp.seed_competences(c, '3.2', 'english', array[
    'Using vocabulary (verbs), e.g. fish, plant, harvest, sell, dry, weed',
    'Using the structures: "What are you doing?" / "I am ..." / "We are ..."',
    'Using the structures: "What is he/she doing?" / "He/she is ..."'
  ]);
  perform pg_temp.seed_competences(c, '3.2', 'cpa', array[
    'Singing / signing', 'Reciting', 'Role-playing', 'Telling / re-telling / signing stories',
    'Making movements', 'Drawing and colouring', 'Shading', 'Cutting and pasting'
  ]);
  perform pg_temp.seed_competences(c, '3.2', 'life_skills', array[
    'Effective communication', 'Self-awareness', 'Decision-making', 'Friendship formation',
    'Leadership skills', 'Interpersonal relationships', 'Creative thinking', 'Self-esteem',
    'Critical thinking', 'Mobility, orientation and rehabilitation (SNE)', 'Friendliness',
    'Endurance', 'Unity', 'Happiness', 'Joy', 'Cultural identity'
  ], 'flexible');

  -- 3.3 Important places in our community
  perform pg_temp.seed_competences(c, '3.3', 'mathematics', array[
    'Sorting', 'Matching', 'Sequencing', 'Identifying empty sets and the symbol for "zero"',
    'Counting 1-20', 'Writing number symbols (0-9)',
    'Adding numbers whose sum is less than 5 using a number line',
    'Describing places according to distance using pictographs'
  ]);
  perform pg_temp.seed_competences(c, '3.3', 'literacy', array[
    'Listening to jingles', 'Identifying', 'Telling / re-telling / signing stories',
    'Naming different important places in our community',
    'Role-playing situations using polite expression in informal settings, e.g. market, shop, hospital',
    'Talking about important places, e.g. what is done here and the appearance',
    'Reciting rhymes', 'Saying tongue-twisters',
    'Pre-reading: reading pictures', 'Pre-reading: fitting jigsaws',
    'Pre-reading: matching pictures to words', 'Pre-reading: reading days of the week',
    'Pre-reading: recognising 4 more words', 'Pre-reading: recognising simple verbs in present tense',
    'Pre-writing: drawing', 'Pre-writing: colouring', 'Pre-writing: writing patterns and letters',
    'Pre-writing: copying simple words', 'Pre-writing: tracing'
  ]);
  perform pg_temp.seed_competences(c, '3.3', 'english', array[
    'Naming important places in our community, e.g. post office, hospital, church, mosque, bank, police station, market, shop, home, clinic, well',
    'Using the structures: "Show me a ... (hospital)" / "This/that is a ..."',
    'Using the structures: "What is this/that?" / "This/that is ..." / "What can you see?"',
    'Using the structures: "I/We can see a ..." / "Point to the ..." / "I am pointing to the ..."',
    'Using the structures: "Can you see a ...?" / "Yes, I/We can ..." / "No, I/We can''t ..."'
  ]);
  perform pg_temp.seed_competences(c, '3.3', 'cpa', array[
    'Singing / signing', 'Miming', 'Dancing creatively', 'Reciting rhymes',
    'Modelling', 'Drawing', 'Colouring', 'Shading'
  ]);
  perform pg_temp.seed_competences(c, '3.3', 'life_skills', array[
    'Effective communication', 'Interpersonal relationships', 'Friendship formation',
    'Non-violent conflict resolution', 'Mobility, orientation and rehabilitation (SNE)',
    'Decision-making', 'Critical thinking', 'Creative thinking', 'Care', 'Appreciation',
    'Share', 'Loyalty', 'Responsibility', 'Identity', 'Respect', 'Cooperation'
  ], 'flexible');

  perform pg_temp.seed_guidelines(c, 3::smallint, 'mathematics', array[
    'Sort by size and colour', 'Count 1-20', 'Match and write number symbols 0-9',
    'Add orally using concrete materials to sum less than 20',
    'Comparing capacity of containers using liquids', 'Draw circles',
    'Interpreting the pictographs'
  ]);
  perform pg_temp.seed_guidelines(c, 3::smallint, 'literacy', array[
    'Recite rhymes', 'Retell short stories with confidence',
    'Assemble jigsaws of 2-3 pieces', 'Tell differences of pictures / objects by shape or colour',
    'Recognise up to 10 words related to family and community',
    'Copy a simple pattern accurately', 'Recite tongue twisters accurately',
    'Telling days of the week'
  ]);
  perform pg_temp.seed_guidelines(c, 3::smallint, 'cpa', array[
    'Draw and colour', 'Sing songs correctly', 'Trace accurately', 'Move according to rhythm'
  ]);
  perform pg_temp.seed_guidelines(c, 3::smallint, 'english', array[
    'Play situational games using words and structures learnt',
    'Match pictures on flash cards to the chart'
  ]);

  -- ============================================================
  -- Theme 4: The Human Body and Health
  -- ============================================================

  -- 4.1 External parts of the body and their uses
  perform pg_temp.seed_competences(c, '4.1', 'mathematics', array[
    'Counting (1-40)', 'Measuring length, using non-standard measures, e.g. the foot, hand span',
    'Reading and writing number symbols 0-20', 'Forming sets using pictures of parts of body',
    'Comparing sets by number of objects', 'Adding numbers less than 10 using a number line'
  ]);
  perform pg_temp.seed_competences(c, '4.1', 'literacy', array[
    'Naming parts of the body',
    'Describing parts of the body and their uses (e.g. skin - to feel; eyes - to see)',
    'Comparing: bigger, smaller, longer, shorter', 'Reciting rhymes',
    'Telling stories about parts of the body', 'Answering questions',
    'Pre-reading: reading pictures/signing', 'Pre-reading: fitting jig-saws',
    'Pre-reading: matching', 'Pre-reading: reading 4 words',
    'Pre-reading: identifying first two consonants in given words',
    'Pre-writing: drawing and labelling parts of body', 'Pre-writing: writing letters',
    'Pre-writing: writing patterns', 'Pre-writing: identifying missing parts of pictures',
    'Pre-writing: copying simple words'
  ]);
  perform pg_temp.seed_competences(c, '4.1', 'english', array[
    'Naming parts of the body, e.g. head, hand, shoulders, knees, toes, foot, body, back, chest, hair, mouth, teeth',
    'Using the structures: "Show me your ..." / "This is my ..." / "These are my ..."',
    'Using the structures: "How many ... have you?" / "I have ..." / "How many ... does he/she?" / "He/She has ..."'
  ]);
  perform pg_temp.seed_competences(c, '4.1', 'cpa', array[
    'Singing / signing songs related to parts of the body', 'Role-playing', 'Dancing',
    'Modelling', 'Finger printing'
  ]);
  perform pg_temp.seed_competences(c, '4.1', 'life_skills', array[
    'Self-awareness', 'Self-esteem', 'Effective communication', 'Interpersonal relationships',
    'Friendship formation', 'Creative thinking', 'Critical thinking',
    'Mobility orientation and rehabilitation (SNE)', 'Appreciation', 'Care', 'Respect',
    'Privacy', 'Confidentiality', 'Acceptance', 'Identity'
  ], 'flexible');

  -- 4.2 Personal hygiene
  perform pg_temp.seed_competences(c, '4.2', 'mathematics', array[
    'Matching', 'Counting (1-40)', 'Measuring using non-standard measures, e.g. foot',
    'Adding 2 numbers whose sum is less than 9 horizontally',
    'Telling time: according to months of the year using natural events'
  ]);
  perform pg_temp.seed_competences(c, '4.2', 'literacy', array[
    'Identifying and naming materials for cleaning body parts',
    'Describing pictures related to diseases', 'Talking about how to keep the body clean',
    'Talking about how to keep materials for cleaning the body',
    'Talking about value of sanitation', 'Telling / signing stories', 'Reciting rhymes',
    'Pre-reading: matching', 'Pre-reading: reading pictures', 'Pre-reading: sequencing pictures',
    'Pre-reading: fitting jigsaws',
    'Pre-reading: identifying two or more consonants from given words',
    'Pre-reading: reading 2-syllable words', 'Pre-reading: reading singular and plural words',
    'Pre-reading: using possessives with nouns (e.g. my hand)',
    'Pre-writing: writing letters and words', 'Pre-writing: writing patterns',
    'Pre-writing: drawing pictures'
  ]);
  perform pg_temp.seed_competences(c, '4.2', 'english', array[
    'Naming things used for cleaning our body, e.g. soap, water, towel, fingers, comb, brush, basin',
    'Using the structures: "What are you doing?" / "I am ...ing my ..."',
    'Using the structures: "What is he/she doing?" / "He/She is ...ing his/her ..."',
    'Using the structures: "What are they doing?" / "They are ...ing their ..."'
  ]);
  perform pg_temp.seed_competences(c, '4.2', 'cpa', array[
    'Singing / signing', 'Reciting rhymes', 'Saying jingles', 'Modelling', 'Weaving',
    'Cutting and pasting', 'Finger printing'
  ]);
  perform pg_temp.seed_competences(c, '4.2', 'life_skills', array[
    'Creative thinking', 'Critical thinking', 'Self-awareness', 'Self-esteem',
    'Effective communication', 'Coping with emotions', 'Assertiveness',
    'Interpersonal relationships', 'Mobility orientation and rehabilitation (SNE)',
    'Care', 'Responsibility', 'Self-criticism', 'Obedience', 'Appreciation', 'Friendliness', 'Cooperation'
  ], 'flexible');

  -- 4.3 Diseases
  perform pg_temp.seed_competences(c, '4.3', 'mathematics', array[
    'Counting 1-40', 'Writing number symbols 1-20',
    'Adding sum less than 20 orally using concrete objects',
    'Adding numbers whose sum is less than 10, horizontally and vertically'
  ]);
  perform pg_temp.seed_competences(c, '4.3', 'literacy', array[
    'Talking about different diseases', 'Naming common causes of diseases',
    'Classifying different diseases, e.g. curable and non-curable',
    'Identifying pictures of people suffering from different diseases',
    'Talking about various preventive and control measures of diseases like HIV and AIDS, TB, malaria',
    'Telling / signing stories', 'Saying riddles', 'Saying proverbs', 'Reciting rhymes',
    'Singing songs related to diseases, e.g. HIV and AIDS',
    'Pre-reading: matching', 'Pre-reading: reading words',
    'Pre-reading: reading and distinguishing singular and plural words',
    'Pre-writing: drawing and labelling', 'Pre-writing: copying words',
    'Pre-writing: writing patterns and letters'
  ]);
  perform pg_temp.seed_competences(c, '4.3', 'english', array[
    'Naming common diseases, causes and preventive measures, e.g. headache, malaria, cough, mosquitoes, house flies, pin',
    'Using the structures: "Are you well/ill?" / "I am very well, thank you." / "Yes, I am." / "No I am not."',
    'Using the structures: "Is he/she well/ill?" / "He/She is ill/sick." / "What is this/that?" / "This/that is a ..."'
  ]);
  perform pg_temp.seed_competences(c, '4.3', 'cpa', array[
    'Singing / signing songs related to diseases, e.g. HIV and AIDS', 'Dancing', 'Reciting rhymes',
    'Moving according to rhyme', 'Painting', 'Drawing', 'Colouring', 'Shading',
    'Making patterns using shapes'
  ]);
  perform pg_temp.seed_competences(c, '4.3', 'life_skills', array[
    'Interpersonal relationships', 'Self esteem', 'Problem solving', 'Creative thinking',
    'Self-awareness', 'Assertiveness', 'Coping with emotions', 'Decision-making', 'Empathy',
    'Critical thinking', 'Effective communication', 'Mobility and orientation (SNE)',
    'Privacy', 'Honesty', 'Care', 'Responsibility', 'Co-operation', 'Unity', 'Respect', 'Friendliness'
  ], 'flexible');

  perform pg_temp.seed_guidelines(c, 4::smallint, 'mathematics', array[
    'Count 1-40', 'Write number symbols 0-20', 'Add vertically and horizontally up to 10',
    'Measure length using non-standard measures', 'Tell some months of the year'
  ]);
  perform pg_temp.seed_guidelines(c, 4::smallint, 'literacy', array[
    'Name parts of the body', 'Talk about the uses of the parts of the body',
    'Identify some common diseases', 'Talk about ways of avoiding diseases',
    'Read and write at least 4 words with 2-letter syllables'
  ]);
  perform pg_temp.seed_guidelines(c, 4::smallint, 'cpa', array[
    'Draw and colour a picture', 'Dance to the rhythm', 'Sing songs correctly'
  ]);
  perform pg_temp.seed_guidelines(c, 4::smallint, 'english', array[
    'Name at least 5 body parts',
    'Construct orally at least 5 simple sentences about the body correctly',
    'Play situational games using new words and structures accordingly',
    'Respond to commands by miming actions related to cleanliness'
  ]);

  -- ============================================================
  -- Theme 5: Weather
  -- ============================================================

  -- 5.1 Elements and types of weather
  perform pg_temp.seed_competences(c, '5.1', 'mathematics', array[
    'Matching', 'Counting 1-40', 'Writing number symbols (1-30)',
    'Adding numbers whose sum is less than 20 vertically without carrying',
    'Reading number names 1-5', 'Writing / brailing number names 1-5'
  ]);
  perform pg_temp.seed_competences(c, '5.1', 'literacy', array[
    'Listening to stories', 'Identifying elements and types of weather', 'Naming',
    'Describing', 'Saying words related to weather', 'Reciting rhymes',
    'Telling / re-telling / signing stories',
    'Pre-reading: reading pictures', 'Pre-reading: matching', 'Pre-reading: reading at least 4 words',
    'Pre-reading: identifying more consonants from given words', 'Pre-reading: forming short sentences',
    'Pre-writing: drawing and labelling', 'Pre-writing: writing pattern',
    'Pre-writing: writing known letters', 'Pre-writing: writing words'
  ]);
  perform pg_temp.seed_competences(c, '5.1', 'english', array[
    'Naming elements and types of weather, e.g. sun, rain, wind, cloud(s), water, hot, shine(ing), rain(ing), cold, blow(ing), rainy, cloudy, sunny, windy',
    'Using the structures: "Is it ...?" / "Yes, it''s ..." / "No, it''s not ..."',
    'Using the structures: "Is it ...? (raining)" / "Yes, it''s..." / "No, it is not ..."',
    'Using the structures: "What is the weather like?" / "It is ..."'
  ]);
  perform pg_temp.seed_competences(c, '5.1', 'cpa', array[
    'Listening', 'Singing', 'Dancing',
    'Playing simple percussion instruments, e.g. shakers, rattles, clappers',
    'Drawing', 'Tearing and pasting', 'Shading / Colouring'
  ]);
  perform pg_temp.seed_competences(c, '5.1', 'life_skills', array[
    'Effective communication', 'Decision-making', 'Problem-solving', 'Self-awareness',
    'Mobility and orientation (SNE)', 'Endurance', 'Appreciation', 'Responsibility'
  ], 'flexible');

  -- 5.2 Activities for different seasons
  perform pg_temp.seed_competences(c, '5.2', 'mathematics', array[
    'Sorting', 'Sequencing', 'Drawing shapes: triangles, rectangles', 'Counting up to 50',
    'Writing number symbols (1-30)', 'Writing / brailing number names 1-5',
    'Recognising place value: tens and ones'
  ]);
  perform pg_temp.seed_competences(c, '5.2', 'literacy', array[
    'Naming activities and tools', 'Reciting rhymes', 'Telling / re-telling / signing stories',
    'Asking questions', 'Answering questions',
    'Pre-reading: matching (following paths), e.g. animals and their homes, animals and their young',
    'Pre-reading: reading simple words and sentences', 'Pre-reading: fitting jigsaw puzzles',
    'Pre-writing: writing patterns', 'Pre-writing: writing known letters', 'Pre-writing: writing syllables'
  ]);
  perform pg_temp.seed_competences(c, '5.2', 'english', array[
    'Using vocabulary, e.g. axe, basket, knife, hoe, spade, rake, can, wheelbarrow',
    'Using the structures: "What''s this/that?" / "It''s a ..." / "This / That is ..."',
    'Using the structures: "What do we use ... for?" / "We use ... for ..." / "When do you plant ...?" / "I plant in ..."',
    'Using the structures: "Is he/she ...?" / "No, he/she is not ..." / "Yes, he/she is ..."'
  ]);
  perform pg_temp.seed_competences(c, '5.2', 'cpa', array[
    'Listening to lullabies', 'Singing / signing work songs', 'Dancing', 'Reciting rhymes',
    'Role-playing', 'Dramatising', 'Drawing'
  ]);
  perform pg_temp.seed_competences(c, '5.2', 'life_skills', array[
    'Problem-solving', 'Interpersonal relationships', 'Decision-making', 'Negotiation',
    'Self-awareness', 'Assertiveness', 'Creative thinking', 'Critical thinking',
    'Mobility and orientation (SNE)', 'Love', 'Responsibility', 'Co-operation', 'Endurance',
    'Sharing', 'Care', 'Patience'
  ], 'flexible');

  -- 5.3 Effects and management of weather
  perform pg_temp.seed_competences(c, '5.3', 'mathematics', array[
    'Forming sets', 'Matching',
    'Adding with sum less than 20 horizontally and vertically without carrying',
    'Counting in 2s', 'Multiplying by 2 as repeated addition',
    'Recognising place value tens and ones'
  ]);
  perform pg_temp.seed_competences(c, '5.3', 'literacy', array[
    'Naming', 'Matching', 'Reciting rhymes, tongue twisters',
    'Talking about different clothes', 'Identifying singular and plural words',
    'Talking about ways of controlling soil erosion', 'Listening to stories',
    'Talking about ways of harvesting water', 'Naming and talking about effects and management of weather',
    'Identifying wind-breakers',
    'Pre-reading: reading pictures', 'Pre-reading: fitting jigsaw puzzles',
    'Pre-reading: reading 2-syllable words with double vowels',
    'Pre-writing: writing patterns', 'Pre-writing: writing 2 short sentences', 'Pre-writing: drawing',
    'Pre-writing: copying words', 'Pre-writing: writing words with double vowels'
  ]);
  perform pg_temp.seed_competences(c, '5.3', 'english', array[
    'Using vocabulary, e.g. jacket, shirt, dress, blanket, sweater, shorts, socks, boots, umbrella, hat, raincoat, plant, grass, tree, water, hoe, rake, panga, slasher',
    'Using the structures: "What is this/that?" / "This is a ..." / "That is a ..." / "It''s a ..."',
    'Using the structures: "What are these/those?" / "Those/these are ..." / "What do you use ... for?" / "I use ... for ...ing"',
    'Using the structures: "What colour is the ...?" / "It is ... (colour)"'
  ]);
  perform pg_temp.seed_competences(c, '5.3', 'cpa', array[
    'Singing / signing', 'Role-playing', 'Dancing', 'Reciting rhymes', 'Making crafts',
    'Modelling', 'Colouring', 'Drawing', 'Shading'
  ]);
  perform pg_temp.seed_competences(c, '5.3', 'life_skills', array[
    'Effective communication', 'Creative thinking', 'Decision-making', 'Problem-solving',
    'Interpersonal relationships', 'Critical thinking', 'Self-esteem', 'Assertiveness',
    'Mobility & orientation (SNE)', 'Responsibility', 'Sharing', 'Acceptance'
  ], 'flexible');

  perform pg_temp.seed_guidelines(c, 5::smallint, 'mathematics', array[
    'Count to 50 in correct order', 'Recognise and write number symbols to 30',
    'Write number names ''one'' to ''five''',
    'Add horizontally and vertically to sum less than 20, no carrying',
    'Identify place value in a 2-digit number',
    'Show multiplication of 2 as repeated addition'
  ]);
  perform pg_temp.seed_guidelines(c, 5::smallint, 'literacy', array[
    'Name different types of weather', 'Describe different elements of weather',
    'Read at least 5 sight words', 'Recite/sign rhymes correctly',
    'Tell and retell/sign stories correctly', 'Write at least 5 words',
    'Write at least 2 short sentences'
  ]);
  perform pg_temp.seed_guidelines(c, 5::smallint, 'english', array[
    'Name 4 types of weather', 'Describe the day''s weather', 'Talk about what people are wearing'
  ]);
  perform pg_temp.seed_guidelines(c, 5::smallint, 'cpa', array[
    'Draw pictures related to weather', 'Shade/colour pictures related to weather',
    'Tear and paste creatively', 'Model creatively', 'Sing songs correctly',
    'Move to the rhythm', 'Play simple percussion instruments'
  ]);

  -- ============================================================
  -- Theme 6: Accidents and Safety
  -- ============================================================

  -- 6.1 Accidents and safety at home
  perform pg_temp.seed_competences(c, '6.1', 'mathematics', array[
    'Counting up to 60', 'Writing number symbols up to 40', 'Writing number names 6-10',
    'Reading number names 6-10', 'Matching symbols to number names 1-10',
    'Multiplying table of 2', 'Recognising symbol for multiplication "x"',
    'Adding with sum less than 40 vertically and horizontally, no carrying'
  ]);
  perform pg_temp.seed_competences(c, '6.1', 'literacy', array[
    'Identifying things that cause bodily harm', 'Naming sharp objects that can cause harm',
    'Describing given pictures', 'Describing dangerous situations',
    'Telling / re-telling / signing stories', 'Reciting rhymes related to safety',
    'Saying sentences related to safety, e.g. "Don''t play with fire." / "Don''t play with knives."',
    'Pre-reading: matching', 'Pre-reading: fitting jigsaw puzzles', 'Pre-reading: playing picture dominoes',
    'Pre-reading: reading words with double vowels',
    'Pre-reading: reading 4 simple sentences with link verbs (e.g. "to be", "to have")',
    'Pre-writing: writing letters', 'Pre-writing: copying words', 'Pre-writing: copying simple sentences'
  ]);
  perform pg_temp.seed_competences(c, '6.1', 'english', array[
    'Naming accidents and safety at home, e.g. pin, knife, thorn, fire, razor blade, broken glass, needle, sharp, hurt, fall, burn, cut',
    'Using the structures: "Don''t play with ..." / "Show me a ..." / "This is a ..." / "That is a ..."',
    'Using the structures: "Are you ... (hurt, burnt)?" / "Yes, I am..." / "No, I am not ...."'
  ]);
  perform pg_temp.seed_competences(c, '6.1', 'cpa', array[
    'Singing / signing', 'Reciting, e.g. rhymes', 'Role-playing', 'Telling / signing stories',
    'Saying riddles', 'Drawing', 'Colouring', 'Cutting and pasting'
  ]);
  perform pg_temp.seed_competences(c, '6.1', 'life_skills', array[
    'Empathy', 'Critical thinking', 'Decision-making', 'Self-awareness',
    'Interpersonal relationships', 'Self-esteem', 'Mobility and orientation (SNE)',
    'Care', 'Co-operation', 'Perseverance', 'Responsibility', 'Patience', 'Friendliness'
  ], 'flexible');

  -- 6.2 Accidents and safety on the way
  perform pg_temp.seed_competences(c, '6.2', 'mathematics', array[
    'Sorting', 'Matching', 'Counting (51-60)', 'Writing number symbols up to 40',
    'Adding with sum less than 40 vertically without carrying',
    'Measuring (using non-standard units): capacity, distance'
  ]);
  perform pg_temp.seed_competences(c, '6.2', 'literacy', array[
    'Naming different types of accidents', 'Listening to stories',
    'Telling, re-telling / signing stories',
    'Naming safe ways of moving to and from school, e.g. "Walk on the path." / "Don''t play on the road." / "Don''t sit by the roadside." / "Don''t play in water." / "Don''t climb trees." / "Don''t play with dangerous objects."',
    'Reciting simple rhymes related to safety', 'Carrying out field visits / outdoor walk',
    'Role-playing first aid',
    'Pre-reading: reading words related to accidents and safety',
    'Pre-reading: matching pictures to the chart', 'Pre-reading: reading singular and plural words',
    'Pre-reading: reading 4 simple sentences',
    'Pre-writing: drawing and labelling', 'Pre-writing: modelling letters', 'Pre-writing: writing patterns',
    'Pre-writing: writing singular and plural words', 'Pre-writing: writing 4 simple sentences'
  ]);
  perform pg_temp.seed_competences(c, '6.2', 'english', array[
    'Naming accidents and safety on the way, e.g. burn, bite, play, drown, knock',
    'Using the structures: "Don''t ...(play)" / "Be careful with ...(dogs)" / "Never ..."',
    'Using the structures: "Are they ...?" / "Yes, they are ..." / "No, they are not ..."'
  ]);
  perform pg_temp.seed_competences(c, '6.2', 'cpa', array[
    'Singing / signing', 'Role-playing', 'Telling and re-telling / signing stories',
    'Saying riddles', 'Reciting, e.g. rhymes',
    'Making simple percussion instruments, e.g. rattles, clappers, shakers',
    'Dancing', 'Making play materials', 'Modelling', 'Drawing', 'Colouring'
  ]);
  perform pg_temp.seed_competences(c, '6.2', 'life_skills', array[
    'Empathy', 'Decision-making', 'Self-awareness', 'Interpersonal relationship', 'Self-esteem',
    'Mobility and orientation (SNE)', 'Assertiveness', 'Care', 'Co-operation', 'Perseverance',
    'Responsibility', 'Patience', 'Friendliness'
  ], 'flexible');

  -- 6.3 Accidents and safety at school and in class
  perform pg_temp.seed_competences(c, '6.3', 'mathematics', array[
    'Sequencing', 'Matching', 'Measuring length and distance using non-standard units, e.g. classroom floor',
    'Playing number game', 'Subtracting up to 10 with concrete materials',
    'Recognising the symbol for subtraction "-"'
  ]);
  perform pg_temp.seed_competences(c, '6.3', 'literacy', array[
    'Talking about accidents at school and in the class',
    'Naming different things that may cause accidents at school and in class',
    'Discussing ways of protection from accidents',
    'Describing use and misuse of things found in school and classroom',
    'Pre-reading: reading pictures', 'Pre-reading: matching', 'Pre-reading: completing words',
    'Pre-reading: reading words with singular and plurals related to safety',
    'Pre-writing: completing pictures', 'Pre-writing: drawing pictures', 'Pre-writing: matching',
    'Pre-writing: copying simple words', 'Pre-writing: forming plurals of given words'
  ]);
  perform pg_temp.seed_competences(c, '6.3', 'english', array[
    'Naming accidents and safety at school and in classes, e.g. cut, prick, hurt, ill, well, glass, knife (knives), stone(s), drown, fractures, fall, latrine',
    'Using the structures: "Be careful with ...." / "It can ... you."',
    'Using the structures: "Are you ... (hurt, cut, alright)?" / "No, I am not." / "Yes, I am."',
    'Using the structures: "Are they ... (hurt, cut, alright)?" / "Yes, they are." / "No, they are not."'
  ]);
  perform pg_temp.seed_competences(c, '6.3', 'cpa', array[
    'Singing / signing', 'Role-playing', 'Telling / re-telling / signing stories', 'Saying riddles',
    'Reciting rhymes', 'Drawing', 'Modelling using local materials', 'Making educative posters',
    'Making collage'
  ]);
  perform pg_temp.seed_competences(c, '6.3', 'life_skills', array[
    'Effective communication', 'Empathy', 'Critical thinking', 'Decision-making',
    'Coping with emotions', 'Coping with stress', 'Interpersonal relationships', 'Self-awareness',
    'Self-esteem', 'Mobility and orientation (SNE)', 'Care', 'Assertiveness', 'Co-operation',
    'Perseverance', 'Responsibility', 'Patience', 'Friendliness'
  ], 'flexible');

  perform pg_temp.seed_guidelines(c, 6::smallint, 'mathematics', array[
    'Count 0-60 in correct order', 'Write number symbols 0-40', 'Number names 1-10',
    'Match number symbols to number names', 'Compare capacity measures (using common containers)',
    'Subtract up to 10 using concrete materials', 'Recognise the symbol for subtraction'
  ]);
  perform pg_temp.seed_guidelines(c, 6::smallint, 'literacy', array[
    'Name at least 5 different accidents that can happen', 'Recite rhymes',
    'Tell / retell / sign stories about safety and accidents', 'Form at least 5 simple sentences',
    'Read at least 5 words in singular and plural forms', 'Explain ways of avoiding accidents'
  ]);
  perform pg_temp.seed_guidelines(c, 6::smallint, 'cpa', array[
    'Draw and colour pictures', 'Sing a song about safety',
    'Model some objects from the First Aid Box', 'Play a simple percussion instrument'
  ]);
  perform pg_temp.seed_guidelines(c, 6::smallint, 'english', array[
    'Use at least 5 vocabulary words and structures correctly', 'Describe activities in a picture'
  ]);

  -- ============================================================
  -- Theme 7: Living Together
  -- ============================================================

  -- 7.1 The family
  perform pg_temp.seed_competences(c, '7.1', 'mathematics', array[
    'Counting 61-70', 'Sorting', 'Forming sets related to family members',
    'Writing number symbols 41-50', 'Writing number names 11-15',
    'Adding with sum less than 50 vertically, no carrying'
  ]);
  perform pg_temp.seed_competences(c, '7.1', 'literacy', array[
    'Naming family members', 'Reciting rhymes', 'Describing pictures related to family members',
    'Saying simple sentences using polite expressions in situations',
    'Talking about relationships in the family',
    'Pre-reading: drawing pictures of family members', 'Pre-reading: reading words',
    'Pre-reading: matching pictures to words, e.g. mother, father, sister, brother',
    'Pre-reading: joining jigsaws',
    'Pre-reading: reading short sentences using link words, e.g. ...with..., ...and...',
    'Pre-reading: reading a family tree',
    'Pre-reading: reading and recognising possessive adjectives with nouns',
    'Pre-writing: joining dots', 'Pre-writing: writing letters', 'Pre-writing: writing patterns',
    'Pre-writing: writing words for family members (e.g. son, daughter) as labels for pictures',
    'Pre-writing: reading words with consonants (my mother)'
  ]);
  perform pg_temp.seed_competences(c, '7.1', 'english', array[
    'Naming family members, e.g. grandmother, grandfather, uncle, aunt, nephew, niece, father, mother, sister, brother, baby',
    'Using the structures: "This is my .../our ..." / "This is her/his ..."',
    'Using the structures: "What is ... doing?", e.g. "Father is ..."'
  ]);
  perform pg_temp.seed_competences(c, '7.1', 'cpa', array[
    'Role-playing different family roles', 'Singing / signing', 'Listening', 'Dancing',
    'Drawing', 'Colouring / shading', 'Modelling using local materials'
  ]);
  perform pg_temp.seed_competences(c, '7.1', 'life_skills', array[
    'Negotiation', 'Interpersonal relationships', 'Empathy', 'Self-esteem',
    'Effective communication', 'Mobility and orientation (SNE)', 'Responsibility', 'Share',
    'Care', 'Togetherness', 'Hard work', 'Co-operation', 'Endurance', 'Sympathy', 'Unity'
  ], 'flexible');

  -- 7.2 Ways of living together in the school
  perform pg_temp.seed_competences(c, '7.2', 'mathematics', array[
    'Counting 61-70', 'Writing number names (16-20)', 'Writing number symbols 41-50',
    'Subtracting up to 20 vertically, no borrowing', 'Playing number games',
    'Matching symbols to numbers', 'Identifying 2 halves that make a whole'
  ]);
  perform pg_temp.seed_competences(c, '7.2', 'literacy', array[
    'Talking about school rules and regulations',
    'Recite the school motto; saying school prayer; recite at least 2 lines of the school prayer',
    'Telling and re-telling / signing stories related to responsibilities in school, e.g. sweeping',
    'Discussing various ways of living together, e.g. sharing, working together, playing, using polite expressions',
    'Use polite expressions as used in formal setting', 'Making and following class rules',
    'Pre-reading: reading known words related to the school, e.g. sharing, helping',
    'Pre-reading: reading polite notices', 'Pre-reading: matching', 'Pre-reading: reading simple sentences',
    'Pre-writing: writing patterns', 'Pre-writing: writing words', 'Pre-writing: writing simple sentences'
  ]);
  perform pg_temp.seed_competences(c, '7.2', 'english', array[
    'Using vocabulary, e.g. share, care, talk, play, learn, work, sweep',
    'Using the structures: "What are you doing?" / "I/We ..."',
    'Using the structures: "What do you do every day?" / "I/We ... (pray) every day."'
  ]);
  perform pg_temp.seed_competences(c, '7.2', 'cpa', array[
    'Singing / signing', 'The last two lines of the National Anthem', 'School anthem',
    'Role-playing', 'Dancing', 'Listening', 'Drawing and naming activities, e.g. someone sweeping',
    'Colouring / shading', 'Modelling'
  ]);
  perform pg_temp.seed_competences(c, '7.2', 'life_skills', array[
    'Self-esteem', 'Effective communication', 'Decision-making', 'Interpersonal relationships',
    'Mobility and orientation (SNE)', 'Responsibility', 'Sharing', 'Care', 'Togetherness',
    'Hard work', 'Co-operation', 'Endurance', 'Acceptance'
  ], 'flexible');

  -- 7.3 Ways of living together in the community
  perform pg_temp.seed_competences(c, '7.3', 'mathematics', array[
    'Sorting', 'Sequencing', 'Drawing and measuring rectangular objects', 'Comparing shapes',
    'Adding using number line', 'Playing number games', 'Matching symbols to number names',
    'Counting in 10s up to 70', 'Multiplying by 10 as repeated addition'
  ]);
  perform pg_temp.seed_competences(c, '7.3', 'literacy', array[
    'Reciting simple rhymes related to the activities',
    'Telling / retelling / signing stories related to living together',
    'Pre-reading: reading words, e.g. village, tree, animal, planting', 'Pre-reading: matching',
    'Pre-reading: reading polite notices',
    'Pre-reading: reading and recognising pronouns and possessive, e.g. he/she, our/yours',
    'Pre-writing: drawing pictures related to family responsibilities, e.g. caring, cooking',
    'Pre-writing: writing names of objects already learnt, e.g. village, trees, animals',
    'Pre-writing: writing patterns', 'Pre-writing: writing short sentences'
  ]);
  perform pg_temp.seed_competences(c, '7.3', 'english', array[
    'Using vocabulary, e.g. village, care, share, clean, help, cook',
    'Using the structures: "What is/he/she/they ... doing?" / "He/she/they is/are ...ing"'
  ]);
  perform pg_temp.seed_competences(c, '7.3', 'cpa', array[
    'Role playing', 'Singing / signing', 'Dancing',
    'Playing simple percussion instruments, e.g. rattles, shakers',
    'Singing school anthem ("We Young women and men", chorus)', 'Modelling, e.g. homestead',
    'Drawing', 'Colouring / shading'
  ]);
  perform pg_temp.seed_competences(c, '7.3', 'life_skills', array[
    'Self-awareness', 'Empathy', 'Decision-making', 'Effective communication',
    'Mobility and orientation (SNE)', 'Interpersonal relationships', 'Creative thinking',
    'Critical thinking', 'Responsibility', 'Sharing', 'Care', 'Togetherness', 'Co-operation', 'Endurance'
  ], 'flexible');

  perform pg_temp.seed_guidelines(c, 7::smallint, 'mathematics', array[
    'Count 1-70', 'Write number symbols 0-50', 'Write number names 1-25',
    'Add numbers whose sums are less than 50, vertically and horizontally, without carrying',
    'Compare length, breadth and width of common objects (squares and rectangles)',
    'Subtract horizontally, without borrowing, up to 20', 'Multiplying by 10 as repeated addition'
  ]);
  perform pg_temp.seed_guidelines(c, 7::smallint, 'literacy', array[
    'Name people and things in the community', 'Recite rhymes correctly', 'Describe pictures',
    'Match pictures to words',
    'Talk about various ways of living together, e.g. sharing, working together, playing',
    'Tell / re-tell / sign stories correctly', 'Fit jigsaws of 2-4 pieces',
    'Write 5 simple sentences', 'Read at least five words'
  ]);
  perform pg_temp.seed_guidelines(c, 7::smallint, 'cpa', array[
    'Sing songs correctly', 'Move to the rhythm', 'Play simple percussion instruments',
    'Draw / shade / colour pictures of family members', 'Model different shapes',
    'Trace pictures of family members'
  ]);
  perform pg_temp.seed_guidelines(c, 7::smallint, 'english', array[
    'Use at least 5 learnt words and structures correctly'
  ]);

  -- ============================================================
  -- Theme 8: Food and Nutrition
  -- ============================================================

  -- 8.1 Names and sources of food
  perform pg_temp.seed_competences(c, '8.1', 'mathematics', array[
    'Sorting and grouping', 'Counting (71-80)', 'Writing number symbols 61-70',
    'Writing number names 26-30', 'Matching symbols to number names 16-20',
    'Adding numbers vertically whose sum is less than 60, no carrying',
    'Subtracting up to 30 no borrowing'
  ]);
  perform pg_temp.seed_competences(c, '8.1', 'literacy', array[
    'Naming and talking about foods and their sources', 'Telling / re-telling / signing stories',
    'Reciting rhymes', 'Talking about simple food taboos',
    'Pre-reading: fitting jigsaws', 'Pre-reading: matching', 'Pre-reading: reading names of foods',
    'Pre-reading: forming words out of cut-out letters', 'Pre-reading: making sentences in every tense',
    'Pre-reading: reading simple sentences about food',
    'Pre-writing: writing patterns', 'Pre-writing: writing the days of the week',
    'Pre-writing: writing simple sentences'
  ]);
  perform pg_temp.seed_competences(c, '8.1', 'english', array[
    'Naming foods and sources (singular and plural), e.g. potatoes, water, bananas, millet, fish, peas, groundnuts, beans, eggs, simsim, shop, market, garden',
    'Using the structures: "Where do we get ... from?" / "We get ... from ..." / "Are these/those ...?"',
    'Using the structures: "Yes, they are ..." / "No, they are not" / "Do you like ... (matooke)?" / "Yes, I do ..." / "No, I don''t ..."'
  ]);
  perform pg_temp.seed_competences(c, '8.1', 'cpa', array[
    'Singing / signing', 'Dancing', 'Story-telling', 'Playing simple percussion instruments',
    'Drawing', 'Doodling', 'Making mosaic, e.g. from sweet potatoes', 'Colouring/shading'
  ]);
  perform pg_temp.seed_competences(c, '8.1', 'life_skills', array[
    'Self-awareness', 'Problem-solving', 'Decision-making', 'Creative thinking',
    'Effective communication', 'Mobility and orientation (SNE)', 'Self-esteem',
    'Critical thinking', 'Responsibility', 'Appreciation', 'Care', 'Respect', 'Share'
  ], 'flexible');

  -- 8.2 Uses of food to our bodies
  perform pg_temp.seed_competences(c, '8.2', 'mathematics', array[
    'Counting 71-80', 'Matching number symbols to number names 16-20',
    'Adding up to 70 vertically, no carrying', 'Writing number names 26-30',
    'Subtracting numbers vertically up to 30 without borrowing', 'Telling time for meals'
  ]);
  perform pg_temp.seed_competences(c, '8.2', 'literacy', array[
    'Naming', 'Describing', 'Telling / re-telling / signing stories related to uses of food to our bodies',
    'Reciting rhymes',
    'Constructing sentences using the future tense, e.g. "If you eat greens you will be healthy."',
    'Pre-reading: matching', 'Pre-reading: reading simple words',
    'Pre-reading: reading simple sentences about future events',
    'Pre-writing: writing simple words', 'Pre-writing: writing patterns',
    'Pre-writing: copying simple sentences about future events'
  ]);
  perform pg_temp.seed_competences(c, '8.2', 'english', array[
    'Naming foods and their uses to our bodies, e.g. fish, banana, strong, weak, sick, health',
    'Using the structures: "Do you like ...?" / "I like / don''t like ..." / "Do you eat ...?" / "We don''t eat ..." / "Yes, I do/No, I don''t ..."',
    'Singing a rhyme, "For health and strength ..."'
  ]);
  perform pg_temp.seed_competences(c, '8.2', 'cpa', array[
    'Singing / signing', 'Listening', 'Playing simple percussion instrument, e.g. clappers, shakers',
    'Tearing and pasting', 'Assembling, e.g. toys', 'Drawing'
  ]);
  perform pg_temp.seed_competences(c, '8.2', 'life_skills', array[
    'Self-esteem', 'Effective communication', 'Assertiveness', 'Interpersonal relationships',
    'Decision-making', 'Critical thinking', 'Orientation and mobility (SNE)', 'Appreciation',
    'Identity', 'Acceptance', 'Perseverance'
  ], 'flexible');

  -- 8.3 Keeping food safe
  perform pg_temp.seed_competences(c, '8.3', 'mathematics', array[
    'Grouping', 'Counting (71-80)', 'Recognising shapes of food containers',
    'Multiplication by 3 using repeated addition', 'Identifying quarters to make a half and a whole'
  ]);
  perform pg_temp.seed_competences(c, '8.3', 'literacy', array[
    'Talking about how to keep food safe', 'Telling news', 'Reciting rhymes',
    'Identifying edible and non-edible items', 'Talking about importance of keeping food safe',
    'Pre-reading: matching', 'Pre-reading: reading words', 'Pre-reading: fitting jigsaws',
    'Pre-reading: reading short sentences in present tense',
    'Pre-writing: writing patterns', 'Pre-writing: writing simple words',
    'Pre-writing: writing short sentences in present tense'
  ]);
  perform pg_temp.seed_competences(c, '8.3', 'english', array[
    'Naming ways and importance of keeping food safe, e.g. clean, cover, cook, salt, sun dry, wash, store',
    'Using the structures: "What are they ...ing?" / "They are ...ing" / "What are we ...ing?" / "We are ...ing"',
    'Using the structures: "What is he/she doing...?" / "He/she is ..."'
  ]);
  perform pg_temp.seed_competences(c, '8.3', 'cpa', array[
    'Singing / signing songs', 'Reciting rhymes / poems', 'Movement',
    'Playing simple percussion Instruments, e.g. rattles, shakers, clappers', 'Role-playing',
    'Listening', 'Colouring', 'Printing using, e.g. banana fibre stalk, leaves, potatoes', 'Drawing'
  ]);
  perform pg_temp.seed_competences(c, '8.3', 'life_skills', array[
    'Effective communication', 'Self-awareness', 'Critical thinking', 'Decision-making',
    'Interpersonal relationships', 'Creative thinking', 'Orientation and mobility (SNE)',
    'Self-esteem', 'Caring', 'Responsibility', 'Honesty', 'Respect'
  ], 'flexible');

  perform pg_temp.seed_guidelines(c, 8::smallint, 'mathematics', array[
    'Count 1-80', 'Recognise and write number symbols to 80', 'Writing number names to 30',
    'Add vertically, numbers whose sum is less than 70', 'Subtract up to 30, no borrowing',
    'Make drawings to show quarters', 'Use containers and estimate capacity'
  ]);
  perform pg_temp.seed_guidelines(c, 8::smallint, 'literacy', array[
    'Talk about ways of keeping foods safe', 'Talk about reasons for keeping foods safe',
    'Recite rhymes / poems',
    'Tell and re-tell stories related to food and nutrition with confidence',
    'Assemble graded jigsaws with at least 4 pieces', 'Read 8-15 words related to food',
    'Write 3 short sentences about good feeding', 'Read sentences in present tense'
  ]);
  perform pg_temp.seed_guidelines(c, 8::smallint, 'cpa', array[
    'Print creatively using potatoes, leaves, fibre stalk',
    'Draw and colour at least 3 pictures of different foods', 'Sing songs correctly',
    'Play simple percussion instruments', 'Dance / move to the rhythm',
    'Model at least one food container'
  ]);
  perform pg_temp.seed_guidelines(c, 8::smallint, 'english', array[
    'Recite a poem / rhyme correctly', 'Name at least 5 foods',
    'Say what foods they like and do not like', 'Say what they eat at home'
  ]);

  -- ============================================================
  -- Theme 9: Our Transport
  -- ============================================================

  -- 9.1 Types and means of transport
  perform pg_temp.seed_competences(c, '9.1', 'mathematics', array[
    'Counting 1-90', 'Writing number symbols 81-90', 'Writing number names 31-35',
    'Matching number symbols to number names', 'Telling number of days in a month',
    'Multiplying by 3 using repeated addition',
    'Classifying means of transport according to sizes, colour, types'
  ]);
  perform pg_temp.seed_competences(c, '9.1', 'literacy', array[
    'Describing different types of transport',
    'Telling / re-telling / signing stories using past tense form of speech',
    'Naming different means of transport and places where they are found, e.g. bus park, taxi-park, airport, railway station',
    'Saying tongue-twisters', 'Reciting riddles and rhymes',
    'Pre-reading: matching words of different means of transport, e.g. train-railway, car-road',
    'Pre-reading: reading pictures', 'Pre-reading: reading words',
    'Pre-reading: reading sentences in past tense form, e.g. "I came by bus."',
    'Pre-reading: reciting rhymes and saying riddles',
    'Pre-writing: drawing and labelling pictures', 'Pre-writing: writing patterns',
    'Pre-writing: writing learnt words and simple sentences'
  ]);
  perform pg_temp.seed_competences(c, '9.1', 'english', array[
    'Naming types and means of transport, e.g. road, water, air, railway, car, bus, bicycle, motorcycle, donkey, camel, horse, boat, ship, lorry',
    'Using the structures: "What''s this/that?" / "This/that is ..." / "What are these/those?" / "These/Those are..."',
    'Using the structures: "Where is the ...?" / "It''s ..." / "Here is the ..." / "What''s he/she doing?" / "He/She is ..."',
    'Using the structures: "Who is on ...?" / "... is on the ..." / "What are you/they doing?" / "I am/They are ..."',
    'Reading five simple common words from the vocabulary'
  ]);
  perform pg_temp.seed_competences(c, '9.1', 'cpa', array[
    'Role-playing', 'Singing / signing songs and lullabies', 'Dancing', 'Making models',
    'Drawing', 'Colouring', 'Painting', 'Constructing'
  ]);
  perform pg_temp.seed_competences(c, '9.1', 'life_skills', array[
    'Self-awareness', 'Effective communication', 'Assertiveness', 'Decision-making',
    'Coping with emotions', 'Orientation and mobility (SNE)', 'Critical thinking',
    'Creative thinking', 'Patience', 'Responsibility', 'Sharing', 'Appreciation',
    'Co-operation', 'Perseverance'
  ], 'flexible');

  -- 9.2 Importance of transport
  perform pg_temp.seed_competences(c, '9.2', 'mathematics', array[
    'Counting 1-90', 'Matching number names to number symbols (1-40)',
    'Writing number names 31-40', 'Adding numbers less than 70 no carrying'
  ]);
  perform pg_temp.seed_competences(c, '9.2', 'literacy', array[
    'Describing common types of transport', 'Talking about the safest types of transport',
    'Reciting rhymes', 'Listening to a story', 'Asking and answering questions',
    'Imitating sounds and demonstrating movement of different types of transport, e.g. bus, train',
    'Pre-reading: sequencing pictures to form story', 'Pre-reading: reading simple words and sentences',
    'Pre-writing: writing patterns', 'Pre-writing: writing learnt words and simple sentences'
  ]);
  perform pg_temp.seed_competences(c, '9.2', 'english', array[
    'Giving the plurals of means of transport, e.g. bus-buses, lorry-lorries',
    'Using the structures: "What is this/that?" / "It is a ..." / "That is a ..." / "What are these/those?"',
    'Using the structures: "They are ..." / "How many ... are there?" / "There are ..."',
    'Reading five simple common words from the vocabulary'
  ]);
  perform pg_temp.seed_competences(c, '9.2', 'cpa', array[
    'Singing / signing', 'Making models of different means of transport', 'Drawing', 'Colouring/shading'
  ]);
  perform pg_temp.seed_competences(c, '9.2', 'life_skills', array[
    'Self-esteem', 'Critical thinking', 'Decision-making', 'Assertiveness',
    'Mobility and orientation (SNE)', 'Co-operation', 'Unity', 'Respect', 'Sharing', 'Appreciation'
  ], 'flexible');

  -- 9.3 Measures related to transport
  perform pg_temp.seed_competences(c, '9.3', 'mathematics', array[
    'Counting 1-90', 'Subtracting up to 40 no borrowing', 'Recognising money up to 500 coins',
    'Estimating distance, e.g. far-near, long-short', 'Estimating transport fare',
    'Comparing transport in terms of capacity, speed, and fare'
  ]);
  perform pg_temp.seed_competences(c, '9.3', 'literacy', array[
    'Listening to stories', 'Reciting rhymes',
    'Talking about measures in terms of distance, e.g. far - near',
    'Comparing means of transport in relation to speed and time',
    'Pre-reading: matching', 'Pre-reading: reading pictures',
    'Pre-reading: reading word and sentences related to transport',
    'Pre-writing: tracing coins', 'Pre-writing: writing patterns',
    'Pre-writing: writing words and sentences related to measures'
  ]);
  perform pg_temp.seed_competences(c, '9.3', 'english', array[
    'Comparing measures related to transport, e.g. tall-short, far-near, shorter/longer (than), bigger/smaller (than), heavy-light, bus, lorry, bicycle',
    'Using the structures: "My home is (far)... from school." / "Where is the ...?" / "It is ..."',
    'Using the structures: "Is the ... (long/short/far/near)?" / "Yes, it is." / "Not, it''s not"',
    'Using the structures: "The ... is bigger than the ..." / "It is ...than ... (longer, bigger)"',
    'Reading five simple common words from the vocabulary'
  ]);
  perform pg_temp.seed_competences(c, '9.3', 'cpa', array[
    'Singing / signing', 'Reciting rhymes', 'Dancing', 'Drawing', 'Colouring', 'Painting',
    'Modelling', 'Making, e.g. mock money', 'Making a simple percussion instruction'
  ]);
  perform pg_temp.seed_competences(c, '9.3', 'life_skills', array[
    'Self-awareness', 'Empathy', 'Critical thinking', 'Decision-making', 'Assertiveness',
    'Creative thinking', 'Friendship formation', 'Interpersonal relationships',
    'Orientation and mobility (SNE)', 'Problem solving', 'Appreciation', 'Patience',
    'Responsibility', 'Perseverance', 'Care'
  ], 'flexible');

  perform pg_temp.seed_guidelines(c, 9::smallint, 'mathematics', array[
    'Count 1-90 confidently', 'Write number symbols up to 80', 'Write number names up to 40',
    'Subtract vertically to 40, no borrowing', 'Multiply by 3 using repeated addition'
  ]);
  perform pg_temp.seed_guidelines(c, 9::smallint, 'literacy', array[
    'Name different means of transport', 'Write 3 simple sentences related to transport',
    'Describe different means of transport', 'Write 5 words related to transport',
    'Respond to 3 questions about a story related to transport',
    'Talking about measures related to transport'
  ]);
  perform pg_temp.seed_guidelines(c, 9::smallint, 'cpa', array[
    'Recite rhymes', 'Sing a song related to transport', 'Move according to the rhythm',
    'Display and talk about pictures of transport'
  ]);
  perform pg_temp.seed_guidelines(c, 9::smallint, 'english', array[
    'Name some means of transport', 'Use at least 6 vocabulary words and structures correctly',
    'Read about 3 words'
  ]);

  -- ============================================================
  -- Theme 10: Things We Make
  -- ============================================================

  -- 10.1 Things we make at home and at school
  perform pg_temp.seed_competences(c, '10.1', 'mathematics', array[
    'Counting 1-99', 'Writing number symbols 1-90', 'Writing number names 41-60',
    'Matching number symbols to number names', 'Adding sum less than 80 without carrying'
  ]);
  perform pg_temp.seed_competences(c, '10.1', 'literacy', array[
    'Describing objects and their uses', 'Talking about things we make', 'Matching',
    'Reciting rhymes / tongue twisters',
    'Pre-reading: fitting jigsaws', 'Pre-reading: completing pictures',
    'Pre-reading: reading words and sentences with future tense',
    'Pre-writing: writing patterns', 'Pre-writing: drawing and labelling',
    'Pre-writing: writing words and sentences'
  ]);
  perform pg_temp.seed_competences(c, '10.1', 'english', array[
    'Using vocabulary (prepositions), e.g. mat, pot, basket, toy, ball, rope, in, on, under, hand bag, shaker, necklace, skirt',
    'Using the structures: "This is a ..." / "The ball is (on) the (chair)." / "That is a ..."',
    'Using the structures: "These are ..." / "Those are ..." / "Where is/are the ...?" / "It is/they are... (on/in) ..."',
    'Reading five simple common words from the vocabulary'
  ]);
  perform pg_temp.seed_competences(c, '10.1', 'cpa', array[
    'Dancing to the rhythm', 'Singing / signing songs', 'Dancing',
    'Making at least one simple percussion instrument, e.g. clappers, rattles', 'Singing lullabies',
    'Cutting and pasting', 'Weaving', 'Modelling', 'Drawing', 'Painting', 'Colouring/shading'
  ]);
  perform pg_temp.seed_competences(c, '10.1', 'life_skills', array[
    'Self-esteem', 'Problem-solving', 'Critical thinking', 'Creative thinking',
    'Interpersonal relationships', 'Mobility and orientation (SNE)', 'Effective communication',
    'Appreciation', 'Co-operation', 'Unity', 'Sharing', 'Responsibility', 'Care'
  ], 'flexible');

  -- 10.2 Materials we use and their sources
  perform pg_temp.seed_competences(c, '10.2', 'mathematics', array[
    'Forming sets', 'Comparing', 'Counting (1-99)',
    'Adding numbers whose sum is less than 80, no carrying', 'Multiplying by 2 and 3',
    'Filling in the missing number in patterns, e.g. 2, 4, box, 8, 10 and 3, 6, box, 12, 15'
  ]);
  perform pg_temp.seed_competences(c, '10.2', 'literacy', array[
    'Describing materials we use to make things', 'Talking about sources of materials',
    'Reciting rhymes / tongue twisters',
    'Pre-reading: reading pictures of things we make',
    'Pre-reading: reading words and sentences with future tense',
    'Pre-writing: writing patterns', 'Pre-writing: drawing and labelling',
    'Pre-writing: writing words and sentences'
  ]);
  perform pg_temp.seed_competences(c, '10.2', 'english', array[
    'Naming materials we use and their sources, e.g. paper, palm leaf, sisal, seeds, soil, clay, banana fibre, stick, raffia',
    'Using the structures: "What do you use to make ...?" / "I use ... to make ..."',
    'Using the structures: "What are you doing?" / "I am making ..." / "What is he/she doing?" / "She/he is making ..."',
    'Reading five simple common words from the vocabulary'
  ]);
  perform pg_temp.seed_competences(c, '10.2', 'cpa', array[
    'Listening to music', 'Singing / signing', 'Reciting rhymes', 'Modelling', 'Drawing',
    'Painting', 'Colouring', 'Weaving'
  ]);
  perform pg_temp.seed_competences(c, '10.2', 'life_skills', array[
    'Creative thinking', 'Critical thinking', 'Effective communication', 'Problem-solving',
    'Self-esteem', 'Assertiveness', 'Mobility and orientation (SNE)', 'Care', 'Appreciation',
    'Respect', 'Sharing', 'Responsibility', 'Co-operation'
  ], 'flexible');

  -- 10.3 Importance of things we make
  perform pg_temp.seed_competences(c, '10.3', 'mathematics', array[
    'Comparing', 'Practising buying and selling (shopping game)', 'Identifying shapes of containers',
    'Subtracting up to 80, no borrowing',
    'Measuring things, e.g. edge of book, using non standard units (length and width)'
  ]);
  perform pg_temp.seed_competences(c, '10.3', 'literacy', array[
    'Identifying materials', 'Classifying by colour', 'Making simple sentences',
    'Reciting rhyme / riddles', 'Using the language of buying and selling in conversations',
    'Talking about importance of things we make',
    'Pre-reading: matching', 'Pre-reading: reading words', 'Pre-reading: reading sentences',
    'Pre-writing: writing patterns', 'Pre-writing: writing letters', 'Pre-writing: writing words and sentences'
  ]);
  perform pg_temp.seed_competences(c, '10.3', 'english', array[
    'Giving the plurals of things we make, e.g. ball-balls, bag-bags, pot-pots, basket-baskets, toy-toys, doll-dolls',
    'Using the structures: "What is this/that?" / "This is ..." / "That is ..."',
    'Using the structures: "What are these/those?" / "These/those are ..." / "How many ... can you see?" / "I can see ..."',
    'Using the structures: "How many ... do you have?" / "I have ..."',
    'Reading five simple common words from the vocabulary'
  ]);
  perform pg_temp.seed_competences(c, '10.3', 'cpa', array[
    'Singing / signing', 'Dramatising', 'Dancing', 'Imitating', 'Miming', 'Modelling',
    'Drawing', 'Shading'
  ]);
  perform pg_temp.seed_competences(c, '10.3', 'life_skills', array[
    'Self-awareness', 'Self-esteem', 'Problem-solving', 'Decision-making', 'Negotiation',
    'Critical thinking', 'Interpersonal relationships', 'Assertiveness',
    'Orientation and mobility (SNE)', 'Self-criticism', 'Honesty', 'Appreciation',
    'Responsibility', 'Co-operation'
  ], 'flexible');

  perform pg_temp.seed_guidelines(c, 10::smallint, 'mathematics', array[
    'Write number symbols 0-90', 'Write number names 0-60', 'Match names and number symbols',
    'Adding numbers with sum less than 80, no carrying', 'Subtracting numbers up to 80, no borrowing'
  ]);
  perform pg_temp.seed_guidelines(c, 10::smallint, 'literacy', array[
    'Talk about the importance of the things we make', 'Name at least 5 different things we make',
    'Read at least 6 words', 'Read 5 sentences', 'Write 5 words',
    'Write 6 sentences about things we make using the vocabulary learnt'
  ]);
  perform pg_temp.seed_guidelines(c, 10::smallint, 'cpa', array[
    'Sing songs correctly', 'Move according to the rhythm',
    'Make at least one simple percussion instrument following instructions',
    'Draw and colour / shade 4 things we make'
  ]);
  perform pg_temp.seed_guidelines(c, 10::smallint, 'english', array[
    'Form plurals of common words', 'Use at least 6 vocabulary words and structures correctly',
    'Read about 3 words'
  ]);

  -- ============================================================
  -- Theme 11: Our Environment
  -- ============================================================

  -- 11.1 Components and importance of things in our environment
  perform pg_temp.seed_competences(c, '11.1', 'mathematics', array[
    'Counting (1-99)', 'Writing number symbols 0-99', 'Writing number names 61-99',
    'Matching number names to number symbols',
    'Recording data in form of pictographs of the things in the school environment'
  ]);
  perform pg_temp.seed_competences(c, '11.1', 'literacy', array[
    'Naming and talking about different animals, birds and plants',
    'Naming and talking about physical features such as lakes, rivers, hills, and mountains (within the learner''s environment)',
    'Talking about the importance of the components', 'Imitating animal sounds',
    'Telling / re-telling / signing stories',
    'Pre-reading: matching (following paths), e.g. animals and their homes, animals and their young',
    'Pre-reading: reading simple words and sentences', 'Pre-reading: fitting jigsaw puzzles',
    'Pre-writing: writing patterns', 'Pre-writing: writing simple words and sentences'
  ]);
  perform pg_temp.seed_competences(c, '11.1', 'english', array[
    'Naming components of things in our environment, e.g. tree, bird, dog, rabbit, hen, sheep, plant, zebra, monkey, lion, elephant, snake, flower',
    'Using the structures: "Show me a/an/the..." / "This is a/an/the ..." / "That is a/an/the ..."',
    'Using the structures: "What are these/those?" / "These are ..." / "Those are ..." / "How many ... are there?" / "There are..."',
    'Reading given simple common words'
  ]);
  perform pg_temp.seed_competences(c, '11.1', 'cpa', array[
    'Singing / signing', 'Dancing to rhythm', 'Reciting rhymes',
    'Playing simple percussion instruments', 'Modelling', 'Drawing', 'Cutting and pasting',
    'Folding and cutting'
  ]);
  perform pg_temp.seed_competences(c, '11.1', 'life_skills', array[
    'Self awareness', 'Effective communication', 'Orientation and mobility (SNE)',
    'Assertiveness', 'Problem-solving', 'Interpersonal relationships', 'Creative thinking',
    'Appreciation', 'Care', 'Responsibility'
  ], 'flexible');

  -- 11.2 Factors that damage our environment
  perform pg_temp.seed_competences(c, '11.2', 'mathematics', array[
    'Filling in missing numbers, e.g. 2 + box = 8, box + 6 = 9',
    'Recognising that the order of numbers in addition does not change the sum, e.g. 2+3=3+2'
  ]);
  perform pg_temp.seed_competences(c, '11.2', 'literacy', array[
    'Identifying factors that damage our environment', 'Talking about factors that damage our environment',
    'Telling / re-telling / signing stories', 'Saying tongue twisters, riddles', 'Recording and reporting',
    'Pre-reading: matching', 'Pre-reading: reading pictures', 'Pre-reading: reading simple words and sentences',
    'Pre-writing: drawing / labelling', 'Pre-writing: writing pattern',
    'Pre-writing: writing simple words and sentences'
  ]);
  perform pg_temp.seed_competences(c, '11.2', 'english', array[
    'Using vocabulary, e.g. sand, ground, cow, goat, wind, leaf',
    'Using the structures: "What''s this?" / "It''s a ..." / "What are these?" / "These are ..."',
    'Using the structures: "What is he/she ...?" / "He/She is ..." / "What are you/they doing?" / "I am/They are ..."',
    'Using the structures: "Why are you ...?" / "I ... to ..."',
    'Reading five simple common words from the vocabulary'
  ]);
  perform pg_temp.seed_competences(c, '11.2', 'cpa', array[
    'Making simple percussion instruments', 'Drawing', 'Colouring/shading', 'Painting'
  ]);
  perform pg_temp.seed_competences(c, '11.2', 'life_skills', array[
    'Assertiveness', 'Mobility and orientation (SNE)', 'Self-criticism', 'Responsibility',
    'Appreciation', 'Togetherness', 'Co-operation', 'Care'
  ], 'flexible');

  -- 11.3 Conservation of our environment
  perform pg_temp.seed_competences(c, '11.3', 'mathematics', array[
    'Counting 1-99', 'Adding numbers whose sum is up to 99', 'Subtracting up to 99 without borrowing',
    'Saying the days of the week, months of the year',
    'Counting and recording in picture form (pictograph)'
  ]);
  perform pg_temp.seed_competences(c, '11.3', 'literacy', array[
    'Reciting rhymes / proverbs', 'Naming and talking about ways of conserving the environment',
    'Telling / re-telling / signing stories',
    'Pre-reading: matching', 'Pre-reading: reading simple words and sentences using past tense form',
    'Pre-reading: reading pictures',
    'Pre-writing: writing simple words', 'Pre-writing: writing simple sentences in different tenses'
  ]);
  perform pg_temp.seed_competences(c, '11.3', 'english', array[
    'Using vocabulary, e.g. soil, tree, watering can, plant, watering, rake, hoe, slasher',
    'Using the structures: "What are they doing?" / "They are ..." / "What is she/he doing?" / "She/He is ..."',
    'Using the structures: "When do we/they ...(water, plant)?" / "We/They ..."',
    'Reading five simple common words from the vocabulary'
  ]);
  perform pg_temp.seed_competences(c, '11.3', 'cpa', array[
    'Singing / signing song related to conservation', 'Dancing', 'Listening',
    'Making simple percussion instruments', 'Reciting rhymes', 'Drawing', 'Colouring', 'Modelling'
  ]);
  perform pg_temp.seed_competences(c, '11.3', 'life_skills', array[
    'Effective communication', 'Self-awareness', 'Assertiveness', 'Mobility and orientation (SNE)',
    'Interpersonal relationship', 'Care', 'Responsibility', 'Appreciation', 'Togetherness', 'Co-operation'
  ], 'flexible');

  perform pg_temp.seed_guidelines(c, 11::smallint, 'mathematics', array[
    'Count up to 99', 'Write number symbols up to 99', 'Write number names up to 99',
    'Identify missing numbers', 'Add vertically to 99 without carrying',
    'Subtract vertically to 99 without borrowing', 'Multiply by 2, 3, and 10 correctly',
    'Representing information in form of pictures'
  ]);
  perform pg_temp.seed_guidelines(c, 11::smallint, 'literacy', array[
    'Read at least 5 words related to the environment', 'Read at least 5 simple sentences',
    'Write at least 5 simple sentences about the environment', 'Copy 5 different patterns',
    'Describe the uses of 3 different animals', 'Talking about the importance of the environment'
  ]);
  perform pg_temp.seed_guidelines(c, 11::smallint, 'cpa', array[
    'Sing songs related to conservation', 'Move according to the rhythm',
    'Make a simple percussion instrument',
    'Draw and colour a picture related to the environment', 'Cut and paste at least 2 pictures'
  ]);
  perform pg_temp.seed_guidelines(c, 11::smallint, 'english', array[
    'Ask questions about things around them',
    'Use at least 7 vocabulary words and structures correctly', 'Read about 3 words'
  ]);

  -- ============================================================
  -- Theme 12: Peace and Security
  -- ============================================================

  -- 12.1 Peace and security in our homes
  perform pg_temp.seed_competences(c, '12.1', 'mathematics', array[
    'Counting up to 99', 'Writing symbols up to 99', 'Writing number names up to 99',
    'Matching number names to symbols up to 99',
    'Adding numbers up to 99 vertically without carrying', 'Recite the multiplication table of 2',
    'Subtracting numbers up to 99 vertically without carrying or borrowing'
  ]);
  perform pg_temp.seed_competences(c, '12.1', 'literacy', array[
    'Talking about factors that promote peace and security in a home, e.g. good relationships, good health',
    'Telling / re-telling / signing stories related to peace-making and peace-keeping',
    'Talking about factors that cause insecurity in a home', 'Reciting rhymes',
    'Talking about ways of resolving conflict',
    'Pre-reading: reading words, e.g. fire, gun, food, knife, spear, water',
    'Pre-reading: sequencing pictures', 'Pre-reading: reading short sentences with a variety of verbs and tenses',
    'Pre-writing: writing patterns', 'Pre-writing: writing words related to peace and security',
    'Pre-writing: writing sentences'
  ]);
  perform pg_temp.seed_competences(c, '12.1', 'english', array[
    'Using vocabulary, e.g. fire, fight, spear, gun, knife, needle, stick, stone, share, help, pray, play',
    'Using the structures: "Who has ... (gun)?" / "Tom/She/He has a ... (gun)"',
    'Using the structures: "Who is your friend?" / "... (name) is my friend." / "He/She is my friend."',
    'Reading five simple common words from the vocabulary'
  ]);
  perform pg_temp.seed_competences(c, '12.1', 'cpa', array[
    'Singing / signing stories', 'Listening', 'Dancing',
    'Making simple percussion Instruments, e.g. shakers', 'Drawing', 'Colouring', 'Painting'
  ]);
  perform pg_temp.seed_competences(c, '12.1', 'life_skills', array[
    'Interpersonal relationships', 'Sympathy', 'Empathy', 'Effective communication', 'Negotiation',
    'Critical thinking', 'Problem-solving', 'Coping with emotions', 'Coping with stress',
    'Mobility and orientation (SNE)', 'Friendliness', 'Co-operation', 'Honesty', 'Royalty', 'Obedience'
  ], 'flexible');

  -- 12.2 Peace and security in our school
  perform pg_temp.seed_competences(c, '12.2', 'mathematics', array[
    'Counting up to 99', 'Reciting the multiplication table of 3', 'Comparing weight, length',
    'Interpreting information on pictographs'
  ]);
  perform pg_temp.seed_competences(c, '12.2', 'literacy', array[
    'Talking about factors that promote peace and security', 'Telling / signing stories',
    'Talking about ways of keeping peace',
    'Identifying aspects of violence, e.g. bullying, fighting, corporal punishment, theft, use of abusive language, indiscipline, defilement',
    'Talking about ways of resolving conflict',
    'Pre-reading: reading words related to peace and security', 'Pre-reading: reading sentences to the chart',
    'Pre-reading: writing words to match pictures',
    'Pre-writing: writing patterns', 'Pre-writing: writing words', 'Pre-writing: writing sentences'
  ]);
  perform pg_temp.seed_competences(c, '12.2', 'english', array[
    'Using vocabulary, e.g. peace and security, share, pray, friends, play',
    'Using the structures: "What do you like?" / "I like ..." / "I don''t like ..."',
    'Reading five simple common words from the vocabulary'
  ]);
  perform pg_temp.seed_competences(c, '12.2', 'cpa', array[
    'Singing / signing songs', 'Reciting rhymes', 'Dramatising',
    'Playing simple percussion instruments, e.g. shakers, clappers', 'Listening to music', 'Drawing'
  ]);
  perform pg_temp.seed_competences(c, '12.2', 'life_skills', array[
    'Interpersonal relationships', 'Negotiation', 'Effective communication',
    'Mobility and orientation (SNE)', 'Decision-making', 'Assertiveness', 'Self-esteem',
    'Copying with emotions', 'Coping with stress', 'Non-violent conflict resolution',
    'Friendliness', 'Co-operation', 'Honesty', 'Loyalty', 'Nationalism', 'Obedience'
  ], 'flexible');

  -- 12.3 Peace and security in our community
  perform pg_temp.seed_competences(c, '12.3', 'mathematics', array[
    'Counting up to 99', 'Revising quarters and halves', 'Subtracting numbers up to 99 without borrowing',
    'Multiplying by 10', 'Reciting the multiplication table to 10'
  ]);
  perform pg_temp.seed_competences(c, '12.3', 'literacy', array[
    'Naming people who provide security', 'Talking about ways of keeping peace', 'Reciting rhymes',
    'Telling / signing stories', 'Talking about ways of resolving conflict',
    'Pre-reading: matching pictures to words', 'Pre-reading: reading words related to keeping peace',
    'Pre-reading: reading sentences',
    'Pre-writing: copying and labelling', 'Pre-writing: writing patterns', 'Pre-writing: writing words',
    'Pre-writing: writing sentences'
  ]);
  perform pg_temp.seed_competences(c, '12.3', 'english', array[
    'Identifying people who keep peace and security in our community, e.g. policeman/policewoman, elder, religious leader, child(ren), man/woman, boy/girl',
    'Using the structures: "Who is she/he?" / "She/He is ..." / "What does he/she do?" / "She/He ..."',
    'Using the structures: "What can you see?" / "I can see ..." / "Who are they?" / "They are…"',
    'Using the structures: "What are they doing?" / "They are ...ing"',
    'Reading five simple common words from the vocabulary'
  ]);
  perform pg_temp.seed_competences(c, '12.3', 'cpa', array[
    'Singing / signing', 'Listening', 'Dancing',
    'Playing simple percussion Instruments, e.g. clappers, shakers', 'Drawing', 'Shading', 'Colouring'
  ]);
  perform pg_temp.seed_competences(c, '12.3', 'life_skills', array[
    'Negotiation', 'Interpersonal relationships', 'Empathy', 'Creative thinking', 'Decision-making',
    'Critical thinking', 'Problem-solving', 'Assertiveness', 'Self esteem',
    'Mobility orientation (SNE)', 'Non-violent conflict resolution', 'Friendship formation',
    'Nationalism', 'Interdependence', 'Unity', 'Co-operation', 'Loyalty', 'Sympathy'
  ], 'flexible');

  perform pg_temp.seed_guidelines(c, 12::smallint, 'mathematics', array[
    'Add up to 99 without carrying', 'Subtract without borrowing up to 99',
    'Identifying missing numbers', 'Write number symbols up to 99',
    'Match number symbols to number names', 'Interpret information in pictorial form',
    'Compare weight and length of objects'
  ]);
  perform pg_temp.seed_guidelines(c, 12::smallint, 'literacy', array[
    'Read 5 simple sentences correctly', 'Describe 5 situations that cause insecurity',
    'Talk about ways of keeping peace'
  ]);
  perform pg_temp.seed_guidelines(c, 12::smallint, 'cpa', array[
    'Take part in a role play about security', 'Sing a peace song', 'Move to the rhythm',
    'Draw, shade / colour a pictures', 'Play a percussion instrument in a group'
  ]);
  perform pg_temp.seed_guidelines(c, 12::smallint, 'english', array[
    'Use at least 7 vocabulary words and structures correctly', 'Ask and answer questions',
    'Read at least 3 words'
  ]);

end $$;
