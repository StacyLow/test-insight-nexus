-- Enable public read access (SELECT) for test_data so the frontend can fetch directly without a backend
create policy if not exists "Anon Select"
on public.test_data
for select
to anon
using (true);