-- HemoConnect: Allow admins/moderators to manage resources
-- Run this in the Supabase SQL Editor AFTER 00005

-- Insert: only admins/moderators can add resources
create policy "Admins can insert resources"
  on public.resources for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- Update: only admins/moderators can update resources
create policy "Admins can update resources"
  on public.resources for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- Delete: only admins can delete resources
create policy "Admins can delete resources"
  on public.resources for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
