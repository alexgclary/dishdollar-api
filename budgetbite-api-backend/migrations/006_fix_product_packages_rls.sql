-- Remove overly-permissive anonymous policies added after initial migration.
-- Correct state: public SELECT + authenticated INSERT only (matches 005 intent).
-- Applied 2026-03-06 via Supabase MCP.

DROP POLICY IF EXISTS "Allow anon insert" ON product_packages;
DROP POLICY IF EXISTS "Allow anon update" ON product_packages;
