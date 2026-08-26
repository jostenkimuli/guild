-- 1. Calendar year on ecosystems (for sidebar display)
ALTER TABLE public.ecosystems
  ADD COLUMN calendar_year smallint
  CHECK (calendar_year BETWEEN 1900 AND 2200);

-- 2. Link topics → subjects (subjects already exist, linked to grades)
ALTER TABLE public.topics
  ADD COLUMN subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL;

CREATE INDEX idx_topics_subject_id ON public.topics (subject_id);

-- 3. Due date on assessments
ALTER TABLE public.assessments
  ADD COLUMN due_date timestamptz;

-- 4. Student progress table
CREATE TABLE public.student_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  topic_id    uuid not null references public.topics(id) on delete cascade,
  status      text not null default 'not_started'
                check (status in ('not_started', 'in_progress', 'completed')),
  progress_pct numeric(5,2) default 0
                check (progress_pct between 0 and 100),
  started_at  timestamptz,
  completed_at timestamptz,
  created_at  timestamptz not null default now(),
  unique(user_id, topic_id)
);

CREATE INDEX idx_student_progress_user ON public.student_progress (user_id);
CREATE INDEX idx_student_progress_topic ON public.student_progress (topic_id);

-- RLS: students see own progress, staff see progress for their space's students
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_progress_select_own"
  ON public.student_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "student_progress_select_staff"
  ON public.student_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      JOIN public.units u ON u.id = t.unit_id
      JOIN public.terms tr ON tr.id = u.term_id
      JOIN public.grades g ON g.id = tr.grade_id
      JOIN public.curricula c ON c.id = g.curriculum_id
      WHERE t.id = student_progress.topic_id
        AND public.can_access_curriculum(c.id)
    )
  );

CREATE POLICY "student_progress_insert_own"
  ON public.student_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "student_progress_update_own"
  ON public.student_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "student_progress_update_staff"
  ON public.student_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      JOIN public.units u ON u.id = t.unit_id
      JOIN public.terms tr ON tr.id = u.term_id
      JOIN public.grades g ON g.id = tr.grade_id
      JOIN public.curricula c ON c.id = g.curriculum_id
      WHERE t.id = student_progress.topic_id
        AND public.can_edit_curriculum(c.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.topics t
      JOIN public.units u ON u.id = t.unit_id
      JOIN public.terms tr ON tr.id = u.term_id
      JOIN public.grades g ON g.id = tr.grade_id
      JOIN public.curricula c ON c.id = g.curriculum_id
      WHERE t.id = student_progress.topic_id
        AND public.can_edit_curriculum(c.id)
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.student_progress TO authenticated;
