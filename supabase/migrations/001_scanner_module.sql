-- ─────────────────────────────────────────────
-- FoodWise · Migration (FIXED)
-- Scanner module tables
-- ─────────────────────────────────────────────

-- 1. ── Enable Extensions ──────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. ── Products Table ─────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode           TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  brand             TEXT,
  image_url         TEXT,
  categories        TEXT[],
  labels            TEXT[],
  allergens         TEXT[],
  ingredients_text  TEXT,
  nutriments        JSONB NOT NULL DEFAULT '{}',
  nova_group        SMALLINT CHECK (nova_group BETWEEN 1 AND 4),
  nutriscore_grade  TEXT CHECK (nutriscore_grade IN ('a','b','c','d','e')),
  countries         TEXT[],
  source            TEXT NOT NULL DEFAULT 'openfoodfacts'
                      CHECK (source IN ('openfoodfacts','admin','user_submitted')),
  embedding         vector(1536),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_barcode_idx ON public.products (barcode);
CREATE INDEX IF NOT EXISTS products_name_idx ON public.products USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS products_embedding_idx ON public.products
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop and Recreate Product Policies
DROP POLICY IF EXISTS "products_read_all" ON public.products;
CREATE POLICY "products_read_all" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "products_write_service" ON public.products;
CREATE POLICY "products_write_service" ON public.products
  FOR ALL USING (auth.role() = 'service_role');


-- 3. ── Product Health Scores Table ────────────
CREATE TABLE IF NOT EXISTS public.product_health_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  total             SMALLINT NOT NULL CHECK (total BETWEEN 0 AND 100),
  grade             TEXT NOT NULL CHECK (grade IN ('A','B','C','D','F')),
  breakdown         JSONB NOT NULL DEFAULT '{}',
  ingredient_risks  JSONB NOT NULL DEFAULT '[]',
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);

ALTER TABLE public.product_health_scores ENABLE ROW LEVEL SECURITY;

-- Drop and Recreate Score Policies
DROP POLICY IF EXISTS "scores_read_all" ON public.product_health_scores;
CREATE POLICY "scores_read_all" ON public.product_health_scores
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "scores_write_service" ON public.product_health_scores;
CREATE POLICY "scores_write_service" ON public.product_health_scores
  FOR ALL USING (auth.role() = 'service_role');


-- 4. ── Scan History Table ─────────────────────
CREATE TABLE IF NOT EXISTS public.scan_history (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id           UUID REFERENCES public.products(id) ON DELETE SET NULL,
  barcode              TEXT NOT NULL,
  product_name         TEXT NOT NULL,
  product_image        TEXT,
  health_score_total   SMALLINT,
  health_score_grade   TEXT,
  scanned_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scan_history_user_idx ON public.scan_history (user_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS scan_history_barcode_idx ON public.scan_history (barcode);

ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- Drop and Recreate History Policies
DROP POLICY IF EXISTS "scan_history_owner_select" ON public.scan_history;
CREATE POLICY "scan_history_owner_select" ON public.scan_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "scan_history_owner_insert" ON public.scan_history;
CREATE POLICY "scan_history_owner_insert" ON public.scan_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "scan_history_owner_delete" ON public.scan_history;
CREATE POLICY "scan_history_owner_delete" ON public.scan_history
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "scan_history_service_insert" ON public.scan_history;
CREATE POLICY "scan_history_service_insert" ON public.scan_history
  FOR INSERT WITH CHECK (auth.role() = 'service_role');


-- 5. ── Automation Triggers ───────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger before creating it
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 6. ── Final Grants ──────────────────────────
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_health_scores TO anon, authenticated;
GRANT ALL ON public.scan_history TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;