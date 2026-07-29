-- Orgullo Embajador — evolve testimonials: conversation screenshot + rating
--
-- The admin panel now lets staff attach a screenshot of the WhatsApp
-- conversation (separate from the person's avatar photo, which already
-- used image_url) and a 1-5 star rating, shown with icons instead of text
-- on both the admin panel and the public site.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste >
-- Run. Safe to re-run. Run AFTER 0001-0005.

alter table public.testimonials add column if not exists screenshot_url text;

alter table public.testimonials add column if not exists rating smallint not null default 5;

alter table public.testimonials drop constraint if exists testimonials_rating_check;

alter table public.testimonials
  add constraint testimonials_rating_check
  check (rating between 1 and 5);
