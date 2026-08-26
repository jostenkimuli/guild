-- Allow lesson pages to embed a video (e.g. lecture recording)
-- alongside or instead of the text body.

alter table public.lesson_pages
  add column video_url text;
