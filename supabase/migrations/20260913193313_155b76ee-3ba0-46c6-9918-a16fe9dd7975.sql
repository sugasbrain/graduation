ALTER TABLE public.rsvps
ADD COLUMN companion_names text[] NOT NULL DEFAULT ARRAY[]::text[];

ALTER TABLE public.rsvps
ADD CONSTRAINT rsvps_companion_names_limit
CHECK (cardinality(companion_names) <= 10);

UPDATE public.rsvps
SET party_size = 1 + cardinality(companion_names);