-- ─────────────────────────────────────────────
-- FoodWise · Migration 002 (FIXED)
-- OCR module tables + storage bucket
-- ─────────────────────────────────────────────

-- 1. ── OCR analyses Table ──────────────────────
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

-- Index is safe with IF NOT EXISTS
CREATE INDEX IF NOT EXISTS ocr_analyses_user_idx
  ON public.ocr_analyses (user_id, created_at DESC);

-- RLS is safe to enable multiple times
ALTER TABLE public.ocr_analyses ENABLE ROW LEVEL SECURITY;

-- 2. ── ocr_analyses Policies (FIXED) ───────────

-- Drop first to prevent "Already Exists" error
DROP POLICY IF EXISTS "ocr_owner_select" ON public.ocr_analyses;
CREATE POLICY "ocr_owner_select" ON public.ocr_analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ocr_service_insert" ON public.ocr_analyses;
CREATE POLICY "ocr_service_insert" ON public.ocr_analyses
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "ocr_owner_delete" ON public.ocr_analyses;
CREATE POLICY "ocr_owner_delete" ON public.ocr_analyses
  FOR DELETE USING (auth.uid() = user_id);


-- 3. ── product-images storage bucket ───────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;


-- 4. ── Storage Policies (FIXED) ────────────────

-- Note: Storage policies are on 'storage.objects'
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_service_insert" ON storage.objects;
CREATE POLICY "product_images_service_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "product_images_owner_delete" ON storage.objects;
CREATE POLICY "product_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- 5. ── Permissions ─────────────────────────────
GRANT ALL ON public.ocr_analyses TO authenticated;
GRANT ALL ON public.ocr_analyses TO service_role;