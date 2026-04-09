-- =============================================
-- 関東JC ビジネスマッチング アプリ
-- Supabase SQL スキーマ
-- =============================================

-- 参加者テーブル
create table participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null,
  prefecture text not null,
  dept text not null,
  job text not null,
  pr text,
  line_user_id text,
  qr_code text unique default gen_random_uuid()::text,
  created_at timestamptz default now()
);

-- マッチング申請テーブル
create table match_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid references participants(id) on delete cascade,
  to_id uuid references participants(id) on delete cascade,
  status text default 'pending', -- pending / accepted / declined
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(from_id, to_id)
);

-- コネクションテーブル（承認済みペア）
create table connections (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid references participants(id) on delete cascade,
  participant_b uuid references participants(id) on delete cascade,
  created_at timestamptz default now()
);

-- Row Level Security 有効化
alter table participants enable row level security;
alter table match_requests enable row level security;
alter table connections enable row level security;

-- RLS ポリシー（全員読み書き可 ※本番は認証付きに変更推奨）
create policy "allow_all_participants" on participants for all using (true) with check (true);
create policy "allow_all_requests" on match_requests for all using (true) with check (true);
create policy "allow_all_connections" on connections for all using (true) with check (true);

-- マッチング申請更新時刻トリガー
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_requests_updated
before update on match_requests
for each row execute function update_updated_at();
