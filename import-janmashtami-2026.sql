-- One-time Janmashtami data import for Hanuman Dal.
--
-- 1. In Supabase Dashboard > Authentication > Users, copy your user's UUID.
-- 2. On the `target_user_id` line below, replace ONLY the all-zero UUID
--    with your user UUID.
-- 3. Run this file in Supabase Dashboard > SQL Editor.
--
-- This is idempotent: re-running it will not add duplicate imported donations.

do $$
declare
  target_user_id uuid := '00000000-0000-0000-0000-000000000000';
  import_date date := '2026-08-07';
  janmashtami_event_id bigint;
  festival_purpose_id bigint;
  receipt_prefix text;
  receipt_sequence integer;
  item record;
  donor_record_id bigint;
begin
  select id into festival_purpose_id
  from purposes
  where user_id = target_user_id and name_en = 'Festival / Utsav'
  limit 1;

  if festival_purpose_id is null then
    insert into purposes (name_en, name_gu, active, user_id)
    values ('Festival / Utsav', 'ઉત્સવ', 1, target_user_id)
    returning id into festival_purpose_id;
  end if;

  select id into janmashtami_event_id
  from events
  where user_id = target_user_id and name_en = 'Janmashtami' and date = import_date
  limit 1;

  if janmashtami_event_id is null then
    insert into events (name_en, name_gu, date, description_en, description_gu, "createdAt", user_id)
    values ('Janmashtami', 'જન્માષ્ટમી', import_date, '', '', now()::text, target_user_id)
    returning id into janmashtami_event_id;
  end if;

  select coalesce("receiptPrefix", 'HD') into receipt_prefix
  from settings
  where user_id = target_user_id
  limit 1;

  select count(*) into receipt_sequence
  from donations
  where user_id = target_user_id
    and date >= date_trunc('year', import_date)::date
    and date < (date_trunc('year', import_date) + interval '1 year')::date;

  for item in
    select *
    from (values
      ('અક્ષય ભોગીભાઈ પિતરિયા', 1001::double precision, 'upi'::text, ''::text),
      ('ધવલ પરસોતમ ચૌહાણ', 501::double precision, 'upi'::text, ''::text),
      ('ચંદ્રેશ ડાયાલાલ ભુજપરીયા', 751::double precision, 'upi'::text, ''::text),
      ('હાર્દિક ડાયાલાલ ભુજપરીયા', 751::double precision, 'upi'::text, ''::text),
      ('કૃષ્ણ ભરોસે', 751::double precision, 'upi'::text, ''::text),
      ('માનવ કિશોરભાઈ ભુજપરિયા', 0::double precision, 'cash'::text, 'દહીં અને માખણ ના દાતાશ્રી'::text),
      ('અશ્વિન હીરજીભાઈ પિતરિયા', 1100::double precision, 'upi'::text, ''::text)
    ) as entries(name_gu, amount, payment_mode, note_gu)
  loop
    select id into donor_record_id
    from donors
    where user_id = target_user_id and name_gu = item.name_gu
    limit 1;

    if donor_record_id is null then
      insert into donors (name_en, name_gu, phone, "address_en", "address_gu", "createdAt", user_id)
      values ('', item.name_gu, '', '', '', now()::text, target_user_id)
      returning id into donor_record_id;
    end if;

    if not exists (
      select 1
      from donations
      where user_id = target_user_id
        and "eventId" = janmashtami_event_id
        and "donorName_gu" = item.name_gu
        and note_en = 'Janmashtami 2026 initial import'
    ) then
      receipt_sequence := receipt_sequence + 1;
      insert into donations (
        "receiptNo", date, "donorId", "donorName_en", "donorName_gu", phone,
        amount, "purposeId", purpose_en, purpose_gu, "paymentMode", "eventId",
        note_en, note_gu, "createdAt", user_id
      ) values (
        receipt_prefix || '-' || extract(year from import_date)::text || '-' || lpad(receipt_sequence::text, 4, '0'),
        import_date, donor_record_id, '', item.name_gu, '', item.amount,
        festival_purpose_id, 'Festival / Utsav', 'ઉત્સવ', item.payment_mode,
        janmashtami_event_id, 'Janmashtami 2026 initial import', item.note_gu,
        now()::text, target_user_id
      );
    end if;
  end loop;
end $$;
