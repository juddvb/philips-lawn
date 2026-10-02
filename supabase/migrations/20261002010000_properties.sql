-- Phase 2: properties and lawn zones (docs/SPEC.md, "Data model").
-- Polygons are stored as JSON arrays of {latitude, longitude} for now. Move to PostGIS
-- geometry when phase 6 needs spatial queries (service areas, nearby jobs).

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  -- Totals across zones, computed in the app (src/lib/lawnGeometry.ts) and saved with the zones.
  area_sqft integer not null default 0,
  edge_ft integer not null default 0,
  gate_width_in integer,
  slope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_owner_id_idx on public.properties (owner_id);

create table public.lawn_zones (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  -- [{ "latitude": 37.29, "longitude": -80.05 }, ...], at least 3 corners.
  polygon jsonb not null check (jsonb_typeof(polygon) = 'array' and jsonb_array_length(polygon) >= 3),
  area_sqft integer not null,
  edge_ft integer not null,
  -- 1 = full sun. Set from photos in phase 3.
  sun_fraction real not null default 1 check (sun_fraction between 0 and 1),
  created_at timestamptz not null default now()
);

create index lawn_zones_property_id_idx on public.lawn_zones (property_id);

alter table public.properties enable row level security;
alter table public.lawn_zones enable row level security;

create policy "Owners manage their properties"
  on public.properties for all
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Owners manage their lawn zones"
  on public.lawn_zones for all
  to authenticated
  using (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = (select auth.uid())));

create trigger properties_touch_updated_at
  before update on public.properties
  for each row execute function public.touch_updated_at();

-- Save a property and replace its zones in one transaction. Runs as the caller, so RLS applies.
-- p_property: { id?, address, lat, lng }
-- p_zones: [{ name, polygon, area_sqft, edge_ft, sun_fraction }]
create function public.save_property(p_property jsonb, p_zones jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(p_property ->> 'id', '')::uuid;
begin
  if v_id is null then
    insert into public.properties (owner_id, address, lat, lng)
    values ((select auth.uid()), p_property ->> 'address', (p_property ->> 'lat')::float8, (p_property ->> 'lng')::float8)
    returning id into v_id;
  else
    update public.properties
       set address = p_property ->> 'address',
           lat = (p_property ->> 'lat')::float8,
           lng = (p_property ->> 'lng')::float8
     where id = v_id;
    if not found then
      raise exception 'Property not found';
    end if;
    delete from public.lawn_zones where property_id = v_id;
  end if;

  insert into public.lawn_zones (property_id, name, sort_order, polygon, area_sqft, edge_ft, sun_fraction)
  select v_id, z.value ->> 'name', z.ordinality - 1, z.value -> 'polygon',
         round((z.value ->> 'area_sqft')::numeric), round((z.value ->> 'edge_ft')::numeric),
         coalesce((z.value ->> 'sun_fraction')::real, 1)
    from jsonb_array_elements(p_zones) with ordinality as z;

  update public.properties
     set area_sqft = coalesce((select sum(area_sqft) from public.lawn_zones where property_id = v_id), 0),
         edge_ft = coalesce((select sum(edge_ft) from public.lawn_zones where property_id = v_id), 0)
   where id = v_id;

  return v_id;
end;
$$;
