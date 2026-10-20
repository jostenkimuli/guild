-- ============================================================
-- Demo data: "A Sample School Ecosystem" has adopted Uganda P1 and started
-- implementing it -- an adoption, a realistic mix of planned weeks (one
-- approved, one ready, one draft -- every status is visible), a fully
-- valid published timetable (every required period placed, respecting the
-- Literacy I/II follow rule and the Free Activity double-lesson block), and
-- all four school decisions.
--
-- Written as direct inserts (not the save_implementation_week /
-- save_implementation_timetable RPCs), matching how every other seed in
-- this repo writes demo data: seeds run outside PostgREST, so there is no
-- auth.uid() for the RPCs' is_ecosystem_owner() check to see.
-- ============================================================

do $$
declare
  eco uuid;
  curr uuid;
  ecoadmin uuid := '33333333-3333-3333-3333-333333333333';
  teacher uuid := '66666666-6666-6666-6666-666666666666'; -- testteacher@example.com
  n11 uuid; n12 uuid; n13 uuid; -- sub-theme nodes 1.1 / 1.2 / 1.3
  math_id uuid; lit_id uuid; eng_id uuid; cpa_id uuid;
  tt uuid; -- implementation_timetables.id
  w11 uuid; w12 uuid;

  a_news uuid; a_local uuid; a_math uuid; a_lit1 uuid; a_lit2 uuid;
  a_eng uuid; a_music uuid; a_art uuid; a_pe uuid; a_re uuid; a_free uuid;
begin
  select id into eco from public.ecosystems where slug = 'a-sample-school';
  select id into curr from public.national_curricula where slug = 'uganda-primary-1';
  if eco is null or curr is null then
    raise notice 'a-sample-school or uganda-primary-1 not found; skipping demo data';
    return;
  end if;

  if exists (
    select 1 from public.school_curriculum_adoptions
    where ecosystem_id = eco and national_curriculum_id = curr
  ) then
    raise notice 'Demo implementation data already present; skipping';
    return;
  end if;

  -- ----------------------------------------------------------
  -- adoption
  -- ----------------------------------------------------------
  insert into public.school_curriculum_adoptions (
    ecosystem_id, national_curriculum_id, adopted_by, notify_on_change
  )
  values (eco, curr, ecoadmin, true);

  -- ----------------------------------------------------------
  -- Term 1 weeks: 1.1 approved, 1.2 ready, 1.3 draft
  -- ----------------------------------------------------------
  select id into n11 from public.curriculum_nodes
    where national_curriculum_id = curr and node_type = 'sub_theme' and attributes ->> 'code' = '1.1';
  select id into n12 from public.curriculum_nodes
    where national_curriculum_id = curr and node_type = 'sub_theme' and attributes ->> 'code' = '1.2';
  select id into n13 from public.curriculum_nodes
    where national_curriculum_id = curr and node_type = 'sub_theme' and attributes ->> 'code' = '1.3';

  select id into math_id from public.national_strands where national_curriculum_id = curr and key = 'mathematics';
  select id into lit_id from public.national_strands where national_curriculum_id = curr and key = 'literacy';
  select id into eng_id from public.national_strands where national_curriculum_id = curr and key = 'english';
  select id into cpa_id from public.national_strands where national_curriculum_id = curr and key = 'cpa';

  insert into public.implementation_weeks (
    ecosystem_id, node_id, teacher_id, planned_start, planned_end, status,
    local_language_notes, sne_adaptations, checking_notes, reviewed_by, reviewed_at
  )
  values (
    eco, n11, teacher, '2026-02-02', '2026-02-06', 'approved',
    'Greetings and titles taught first in Luganda ("Osiibye otya"), then in English.',
    'Name tags in large print; seat learners with low vision near the front.',
    'Checklist: names 5 classmates, counts to 5 with stones, greets a visitor unprompted.',
    ecoadmin, now()
  )
  returning id into w11;

  insert into public.implementation_week_strand_plans (week_id, strand_id, how_we_teach) values
    (w11, math_id, 'Count local stones and bottle tops up to 5; sort classroom objects by size.'),
    (w11, lit_id, 'Name tags and a welcome song; learners draw and name a classmate.'),
    (w11, eng_id, 'Greeting routine every morning: "Good morning" call and response.'),
    (w11, cpa_id, 'Model a classmate''s face from clay; sing the welcome song with actions.');

  insert into public.implementation_weeks (
    ecosystem_id, node_id, teacher_id, planned_start, planned_end, status,
    local_language_notes, checking_notes
  )
  values (
    eco, n12, teacher, '2026-02-09', '2026-02-13', 'ready',
    'Classroom object names taught in Luganda first, e.g. "entebbe" (chair).',
    'Checklist: names 5 classroom objects and points to them correctly.'
  )
  returning id into w12;

  insert into public.implementation_week_strand_plans (week_id, strand_id, how_we_teach) values
    (w12, math_id, 'Sort classroom objects by shape and colour; count 1-5 using pencils.'),
    (w12, eng_id, 'Point-and-name drill with real classroom objects: chair, desk, book, pencil.');

  insert into public.implementation_weeks (ecosystem_id, node_id, status)
  values (eco, n13, 'draft');

  -- ----------------------------------------------------------
  -- A full, valid, published weekly timetable (40 periods, 8/day)
  -- ----------------------------------------------------------
  select id into a_news   from public.national_period_allocations where national_curriculum_id = curr and key = 'news';
  select id into a_local  from public.national_period_allocations where national_curriculum_id = curr and key = 'local_language';
  select id into a_math   from public.national_period_allocations where national_curriculum_id = curr and key = 'mathematics';
  select id into a_lit1   from public.national_period_allocations where national_curriculum_id = curr and key = 'literacy_1';
  select id into a_lit2   from public.national_period_allocations where national_curriculum_id = curr and key = 'literacy_2';
  select id into a_eng    from public.national_period_allocations where national_curriculum_id = curr and key = 'english';
  select id into a_music  from public.national_period_allocations where national_curriculum_id = curr and key = 'music';
  select id into a_art    from public.national_period_allocations where national_curriculum_id = curr and key = 'art_craft';
  select id into a_pe     from public.national_period_allocations where national_curriculum_id = curr and key = 'pe';
  select id into a_re     from public.national_period_allocations where national_curriculum_id = curr and key = 're';
  select id into a_free   from public.national_period_allocations where national_curriculum_id = curr and key = 'free_activity';

  insert into public.implementation_timetables (
    ecosystem_id, national_curriculum_id, periods_per_day, published_at, published_by
  )
  values (eco, curr, 8, now(), ecoadmin)
  returning id into tt;

  insert into public.implementation_timetable_slots (timetable_id, day_of_week, period_no, allocation_id) values
    -- Monday: News, Local language, Mathematics
    (tt, 1, 1, a_news), (tt, 1, 2, a_news), (tt, 1, 3, a_news),
    (tt, 1, 4, a_local), (tt, 1, 5, a_local),
    (tt, 1, 6, a_math), (tt, 1, 7, a_math), (tt, 1, 8, a_math),
    -- Tuesday: Mathematics, Literacy I/II (2 pairs), English
    (tt, 2, 1, a_math), (tt, 2, 2, a_math),
    (tt, 2, 3, a_lit1), (tt, 2, 4, a_lit2),
    (tt, 2, 5, a_lit1), (tt, 2, 6, a_lit2),
    (tt, 2, 7, a_eng), (tt, 2, 8, a_eng),
    -- Wednesday: Literacy I/II (3 pairs), English
    (tt, 3, 1, a_lit1), (tt, 3, 2, a_lit2),
    (tt, 3, 3, a_lit1), (tt, 3, 4, a_lit2),
    (tt, 3, 5, a_lit1), (tt, 3, 6, a_lit2),
    (tt, 3, 7, a_eng), (tt, 3, 8, a_eng),
    -- Thursday: English, Music, Art & Craft, PE
    (tt, 4, 1, a_eng),
    (tt, 4, 2, a_music), (tt, 4, 3, a_music), (tt, 4, 4, a_music),
    (tt, 4, 5, a_art), (tt, 4, 6, a_art),
    (tt, 4, 7, a_pe), (tt, 4, 8, a_pe),
    -- Friday: PE, Religious Education, Free Activity (double lesson)
    (tt, 5, 1, a_pe), (tt, 5, 2, a_pe), (tt, 5, 3, a_pe),
    (tt, 5, 4, a_re), (tt, 5, 5, a_re), (tt, 5, 6, a_re),
    (tt, 5, 7, a_free), (tt, 5, 8, a_free);

  -- ----------------------------------------------------------
  -- school decisions
  -- ----------------------------------------------------------
  insert into public.school_decisions (
    ecosystem_id, national_curriculum_id, decision_key, value, detail, decided_by
  )
  values
    (eco, curr, 'language_of_instruction', 'local', 'Luganda', ecoadmin),
    (eco, curr, 'religious_education', 'cre', null, ecoadmin),
    (eco, curr, 'competence_recording', 'checklist_and_chart', null, ecoadmin),
    (eco, curr, 'parent_reports', 'termly', null, ecoadmin);
end $$;
