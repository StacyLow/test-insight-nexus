
-- Ensure RLS is enabled (safe to run even if already enabled)
alter table public.test_data enable row level security;

-- Create SELECT policy for anon role if it doesn't already exist
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'test_data'
      and policyname = 'Anon Select'
  ) then
    create policy "Anon Select"
      on public.test_data
      for select
      to anon
      using (true);
  end if;
end
$$;
