create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(user_id) not null,
  receiver_id uuid references public.profiles(user_id) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.messages enable row level security;

drop policy if exists "Users can view messages they sent or received" on public.messages;
create policy "Users can view messages they sent or received"
on public.messages for select
using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);

drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages"
on public.messages for insert
with check (
  auth.uid() = sender_id
);

-- Index for faster querying of conversations
create index if not exists messages_sender_receiver_idx on public.messages(sender_id, receiver_id);
create index if not exists messages_receiver_sender_idx on public.messages(receiver_id, sender_id);
