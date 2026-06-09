-- Permisos para marcar partido jugado desde la app (authenticated)
grant execute on function public.update_streaks_after_match(uuid) to authenticated;

-- Realtime: actualizar racha en vivo en el cliente
alter publication supabase_realtime add table public.team_members;
