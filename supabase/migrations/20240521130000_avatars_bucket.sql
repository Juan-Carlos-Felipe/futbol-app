-- Módulo 1.13 — Bucket de Storage para avatares

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

create policy "avatars_upload_own" on storage.objects
for insert with check (
  bucket_id = 'avatars' and auth.role() = 'authenticated'
);

create policy "avatars_update_own" on storage.objects
for update using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "avatars_public_read" on storage.objects
for select using (bucket_id = 'avatars');
