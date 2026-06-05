-- 1. Grant basic table permissions to the authenticated role
-- This allows logged-in users to interact with the table at the database level
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;

-- 2. Ensure the authenticated role can use the public schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- 3. Fix/Re-apply the RLS Policy for the users table
-- We use 'WITH CHECK' to ensure users can only update their OWN row
DROP POLICY IF EXISTS "users_own" ON public.users;

CREATE POLICY "users_own" ON public.users 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Verify the handle_new_user function has enough power
-- Sometimes the trigger fails because it lacks permissions
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;

-- 5. Final Grant for Service Role (for your Edge Functions)
GRANT ALL ON public.users TO service_role;






-- 1. Grant usage on the public schema (the container)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 2. Grant permissions on ALL existing tables to the authenticated user
-- This allows the 'authenticated' role to attempt operations that RLS will then filter
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 3. Grant permissions on ALL sequences (needed if you use auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Grant read-only access to anonymous (unlogged in) users for public data
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.product_health_scores TO anon;

-- 5. Ensure Service Role (Edge Functions) has absolute power
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 6. CRITICAL: Fix for the specific error you saw
-- This makes sure future tables also get these permissions automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;


