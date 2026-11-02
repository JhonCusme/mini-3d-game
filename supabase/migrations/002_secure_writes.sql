-- =============================================================================
-- 002 · Secure online writes
--
-- Before this migration any client holding the public key could rewrite or
-- delete ANY village, attack record or friendship. From now on:
--   * Tables are read-only for clients (SELECT only).
--   * Every write goes through a SECURITY DEFINER function that checks the
--     caller owns the village (secret per-village token, stored hashed).
--   * Attack locks are atomic, so two players can't attack the same village.
--   * Friend requests live in their own table instead of inside the target's
--     village snapshot (where every publish was wiping them).
--
-- Run it once in the Supabase SQL editor. It is safe to run again.
-- Existing villages are claimed by the first publish after this migration
-- (their owner, normally, as soon as they open the game).
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- Columns ----------------------------------------------------------
alter table public.villages add column if not exists token_hash text;
alter table public.villages add column if not exists user_id uuid;
alter table public.villages add column if not exists locked_by text;
create index if not exists villages_user_idx on public.villages (user_id);

alter table public.friendships add column if not exists sender_info jsonb;

-- ---------- Lock tables down: clients may only read ---------------------------
drop policy if exists "players publish their village" on public.villages;
drop policy if exists "players update their village" on public.villages;
drop policy if exists "players delete their village" on public.villages;
drop policy if exists "attackers report attacks" on public.attacks;
drop policy if exists "friendships are public" on public.friendships;

drop policy if exists "villages are public" on public.villages;
create policy "villages are public" on public.villages for select using (true);

drop policy if exists "defenders read attacks" on public.attacks;
create policy "defenders read attacks" on public.attacks for select using (true);

drop policy if exists "friendships are readable" on public.friendships;
create policy "friendships are readable" on public.friendships for select using (true);

-- Never expose the token hash or the owner account: clients may only read these columns
revoke select on public.villages from anon, authenticated;
grant select (id, name, trophies, shield_until, snapshot, updated_at) on public.villages to anon, authenticated;
revoke insert, update, delete on public.villages, public.attacks, public.friendships from anon, authenticated;

-- ---------- Helpers -----------------------------------------------------------
create or replace function public._village_token_ok(p_id text, p_token text)
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
    -- Owner = knows the village token, or is signed in with the account that owns it
    select exists (
        select 1 from public.villages
        where id = p_id
          and (
              token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
              or (auth.uid() is not null and user_id = auth.uid())
          )
    );
$$;
revoke all on function public._village_token_ok(text, text) from public, anon, authenticated;

-- ---------- Publish own village ----------------------------------------------
create or replace function public.publish_village(
    p_id text, p_token text, p_name text, p_trophies integer, p_shield timestamptz, p_snapshot jsonb
) returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
    v_hash text;
    v_row public.villages%rowtype;
    v_uid uuid := auth.uid();
    v_level integer := coalesce((p_snapshot->>'level')::integer, 1);
begin
    if p_id is null or length(p_id) < 3 or length(p_id) > 80 then raise exception 'invalid_id'; end if;
    if p_token is null or length(p_token) < 16 then raise exception 'invalid_token'; end if;
    if p_id like 'bot\_%' or p_id like 'system\_%' or p_id like 'rival\_%' or p_id like 'campaign\_%' then
        raise exception 'reserved_id';
    end if;
    if length(coalesce(p_name, '')) > 40 then raise exception 'name_too_long'; end if;
    if pg_column_size(p_snapshot) > 200000 then raise exception 'snapshot_too_big'; end if;

    v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');
    select * into v_row from public.villages where id = p_id for update;

    if not found then
        insert into public.villages (id, name, trophies, shield_until, snapshot, updated_at, token_hash, user_id)
        values (p_id, p_name, greatest(0, p_trophies), coalesce(p_shield, now()), p_snapshot, now(), v_hash, v_uid);
    else
        if v_row.token_hash is not null and v_row.token_hash <> v_hash
           and not (v_uid is not null and v_row.user_id = v_uid) then
            raise exception 'not_owner';
        end if;
        update public.villages set
            name = p_name,
            trophies = greatest(0, p_trophies),
            -- Never shorten a shield or battle lock set by the server
            shield_until = greatest(shield_until, coalesce(p_shield, now())),
            snapshot = p_snapshot,
            updated_at = now(),
            token_hash = v_hash,
            user_id = coalesce(v_uid, v_row.user_id)
        where id = p_id;
    end if;

    -- One active village per account: retire this account's other villages
    -- that are at the same or a lower town hall level.
    if v_uid is not null then
        update public.villages set
            name = '[BORRADO_DUPLICADO_' || left(id, 6) || ']',
            shield_until = '3000-01-01T00:00:00Z',
            snapshot = snapshot || jsonb_build_object('isDeleted', true, 'level', 0),
            updated_at = now()
        where user_id = v_uid
          and id <> p_id
          and coalesce((snapshot->>'isDeleted')::boolean, false) = false
          and coalesce((snapshot->>'level')::integer, 1) <= v_level;
    end if;
end;
$$;

-- ---------- Attack lock (atomic) ----------------------------------------------
create or replace function public.lock_village(p_defender text, p_attacker text, p_token text)
returns boolean
language plpgsql security definer set search_path = public, extensions
as $$
declare
    v_count integer;
begin
    if not public._village_token_ok(p_attacker, p_token) then raise exception 'not_owner'; end if;
    if p_defender = p_attacker then return false; end if;
    -- Villages that only exist on the client (bots, system villages) need no lock
    if not exists (select 1 from public.villages where id = p_defender) then return true; end if;

    update public.villages
       set shield_until = now() + interval '3 minutes', locked_by = p_attacker
     where id = p_defender
       and (shield_until <= now() or locked_by = p_attacker);
    get diagnostics v_count = row_count;
    return v_count > 0;
end;
$$;

create or replace function public.unlock_village(p_defender text, p_attacker text, p_token text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
    if not public._village_token_ok(p_attacker, p_token) then raise exception 'not_owner'; end if;
    update public.villages
       set shield_until = now(), locked_by = null
     where id = p_defender and locked_by = p_attacker;
end;
$$;

-- ---------- Report a finished attack -----------------------------------------
create or replace function public.report_attack(p_attacker text, p_token text, p_record jsonb)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
    v_defender text := p_record->>'defenderId';
    v_def public.villages%rowtype;
    v_loot integer;
    v_record jsonb := p_record;
begin
    if not public._village_token_ok(p_attacker, p_token) then raise exception 'not_owner'; end if;
    if (p_record->>'attackerId') is distinct from p_attacker then raise exception 'attacker_mismatch'; end if;

    select * into v_def from public.villages where id = v_defender for update;
    if not found then return; end if; -- bot/system village: nothing to report
    -- Only the player holding the battle lock can report against this village
    if v_def.locked_by is distinct from p_attacker then raise exception 'no_battle_lock'; end if;

    -- Never steal more than the defender had available
    v_loot := least(
        greatest(0, coalesce((p_record->>'coinsStolen')::integer, 0)),
        greatest(0, coalesce((v_def.snapshot->>'lootableCoins')::integer, 0))
    );
    v_record := jsonb_set(v_record, '{coinsStolen}', to_jsonb(v_loot));
    v_record := jsonb_set(v_record, '{createdAt}', to_jsonb((extract(epoch from now()) * 1000)::bigint));

    insert into public.attacks (id, attacker_id, defender_id, record, created_at)
    values (coalesce(p_record->>'id', gen_random_uuid()::text), p_attacker, v_defender, v_record, now())
    on conflict (id) do nothing;

    update public.villages set
        shield_until = case when coalesce((p_record->>'attackerWon')::boolean, false)
                            then now() + interval '30 minutes' else now() end,
        locked_by = null
    where id = v_defender;
end;
$$;

-- ---------- Friends -----------------------------------------------------------
create or replace function public.send_friend_request(p_from text, p_token text, p_to text, p_info jsonb)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
    v_id text;
    v_existing public.friendships%rowtype;
begin
    if not public._village_token_ok(p_from, p_token) then raise exception 'not_owner'; end if;
    if p_from = p_to then raise exception 'self_request'; end if;
    if not exists (select 1 from public.villages where id = p_to) then raise exception 'unknown_player'; end if;

    select * into v_existing from public.friendships
     where (sender_id = p_from and receiver_id = p_to) or (sender_id = p_to and receiver_id = p_from)
     limit 1;
    if found then
        -- They had already asked us: accept straight away
        if v_existing.status = 'pending' and v_existing.sender_id = p_to then
            update public.friendships set status = 'accepted', updated_at = now() where id = v_existing.id;
        end if;
        return v_existing.id;
    end if;

    v_id := 'fr_' || md5(p_from || ':' || p_to);
    insert into public.friendships (id, sender_id, receiver_id, sender_name, receiver_name, status, sender_info)
    values (
        v_id, p_from, p_to,
        left(coalesce(p_info->>'fromName', ''), 40),
        coalesce((select name from public.villages where id = p_to), ''),
        'pending',
        p_info
    );
    return v_id;
end;
$$;

create or replace function public.respond_friend_request(p_me text, p_token text, p_request_id text, p_accept boolean)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
    if not public._village_token_ok(p_me, p_token) then raise exception 'not_owner'; end if;
    if p_accept then
        update public.friendships set status = 'accepted', updated_at = now()
         where id = p_request_id and receiver_id = p_me and status = 'pending';
    else
        delete from public.friendships
         where id = p_request_id and receiver_id = p_me and status = 'pending';
    end if;
end;
$$;

create or replace function public.remove_friend(p_me text, p_token text, p_friend text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
    if not public._village_token_ok(p_me, p_token) then raise exception 'not_owner'; end if;
    delete from public.friendships
     where (sender_id = p_me and receiver_id = p_friend) or (sender_id = p_friend and receiver_id = p_me);
end;
$$;

grant execute on function public.publish_village(text, text, text, integer, timestamptz, jsonb) to anon, authenticated;
grant execute on function public.lock_village(text, text, text) to anon, authenticated;
grant execute on function public.unlock_village(text, text, text) to anon, authenticated;
grant execute on function public.report_attack(text, text, jsonb) to anon, authenticated;
grant execute on function public.send_friend_request(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.respond_friend_request(text, text, text, boolean) to anon, authenticated;
grant execute on function public.remove_friend(text, text, text) to anon, authenticated;
