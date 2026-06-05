-- =====================================================
-- FOODWISE · MASTER PRODUCTION SCHEMA
-- Optimized for: Realtime, AI Recommendations, and OCR
-- =====================================================

-- 1. EXTENSIONS & CLEANUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. CORE TABLES
-- User profiles (Linked to Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT,
  avatar_url           TEXT,
  email                TEXT UNIQUE,
  dietary_preferences  JSONB NOT NULL DEFAULT '{
    "allergens": [],
    "goals": [],
    "is_vegan": false,
    "is_vegetarian": false
  }'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products (OpenFoodFacts Cache)
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
  source            TEXT NOT NULL DEFAULT 'openfoodfacts' CHECK (source IN ('openfoodfacts','admin','user_submitted')),
  embedding         vector(1536),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Health Scores (Computed result)
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

-- 3. FEATURE TABLES
-- Scan history
CREATE TABLE IF NOT EXISTS public.scan_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id          UUID REFERENCES public.products(id) ON DELETE SET NULL,
  barcode             TEXT NOT NULL,
  product_name        TEXT NOT NULL,
  product_image       TEXT,
  health_score_total  SMALLINT,
  health_score_grade  TEXT,
  scanned_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OCR analysis history
CREATE TABLE IF NOT EXISTS public.ocr_analyses (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_url          TEXT,
  ocr_full_text      TEXT NOT NULL,
  ocr_confidence     NUMERIC(4,3) CHECK (ocr_confidence BETWEEN 0 AND 1),
  ingredient_section TEXT NOT NULL,
  ingredients        JSONB NOT NULL DEFAULT '[]',
  risk_summary       JSONB NOT NULL DEFAULT '{}',
  ai_verdict         TEXT NOT NULL,
  ai_model           TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  processing_ms      INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Family & Grocery Groups
CREATE TABLE IF NOT EXISTS public.family_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.family_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id  UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_group_id, user_id)
);

-- Realtime Grocery Lists
CREATE TABLE IF NOT EXISTS public.grocery_lists (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id  UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
  created_by       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  is_archived      BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grocery_list_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_list_id  UUID NOT NULL REFERENCES public.grocery_lists(id) ON DELETE CASCADE,
  product_id       UUID REFERENCES public.products(id) ON DELETE SET NULL,
  custom_name      TEXT,
  quantity         INTEGER NOT NULL DEFAULT 1,
  unit             TEXT,
  is_completed     BOOLEAN NOT NULL DEFAULT false,
  added_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. SEARCH INDEXES
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_name_fts ON public.products USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_embedding ON public.products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_scan_history_user_date ON public.scan_history (user_id, scanned_at DESC);

-- 5. AUTOMATION (TRIGGERS)
-- Auto-create public.users row on Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. PERMISSIONS (Fixes 42501 Errors)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Default grants for future-proofing
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_list_items ENABLE ROW LEVEL SECURITY;

-- Products/Scores: Public read, Service write
CREATE POLICY "products_read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_service" ON public.products FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "scores_read" ON public.product_health_scores FOR SELECT USING (true);
CREATE POLICY "scores_service" ON public.product_health_scores FOR ALL USING (auth.role() = 'service_role');

-- Personal Data (Own rows only)
CREATE POLICY "users_own" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "history_own" ON public.scan_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ocr_own" ON public.ocr_analyses FOR ALL USING (auth.uid() = user_id);

-- Family/Lists (Shared logic)
CREATE POLICY "lists_access" ON public.grocery_lists FOR ALL USING (
  auth.uid() = created_by OR 
  EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_group_id = grocery_lists.family_group_id AND fm.user_id = auth.uid())
);

CREATE POLICY "items_access" ON public.grocery_list_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.grocery_lists gl 
    WHERE gl.id = grocery_list_id AND (gl.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_group_id = gl.family_group_id AND fm.user_id = auth.uid()))
  )
);

-- 8. STORAGE & REALTIME
-- Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "storage_service_all" ON storage.objects FOR ALL USING (auth.role() = 'service_role');

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.grocery_lists, public.grocery_list_items;
EXCEPTION WHEN OTHERS THEN 
  -- Handle if tables are already in publication
END $$;