import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const results: string[] = [];

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error: bucketErr } = await supabase.storage.createBucket("feed-images", {
      public: true,
      allowedMimeTypes: ["image/*"],
      fileSizeLimit: 5242880,
    });
    if (bucketErr && !bucketErr.message.includes("already exists")) {
      results.push(`Bucket error: ${bucketErr.message}`);
    } else {
      results.push("feed-images bucket ready");
    }

    if (!dbUrl) {
      return new Response(
        JSON.stringify({ error: "SUPABASE_DB_URL not found", results }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pool = new Pool(dbUrl, 1, true);
    const conn = await pool.connect();

    try {
      await conn.queryArray(`CREATE TABLE IF NOT EXISTS feed_posts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), person_id uuid NOT NULL, content text NOT NULL, image_url text, is_birthday_post boolean DEFAULT false, created_at timestamptz DEFAULT now())`);
      results.push("feed_posts ok");
      await conn.queryArray(`ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY`);
      await conn.queryArray(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='feed_posts' AND policyname='read_fp') THEN CREATE POLICY read_fp ON feed_posts FOR SELECT USING (true); CREATE POLICY ins_fp ON feed_posts FOR INSERT WITH CHECK (true); CREATE POLICY del_fp ON feed_posts FOR DELETE USING (true); END IF; END $$`);

      await conn.queryArray(`CREATE TABLE IF NOT EXISTS feed_likes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), post_id uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE, person_id uuid NOT NULL, created_at timestamptz DEFAULT now(), UNIQUE(post_id, person_id))`);
      results.push("feed_likes ok");
      await conn.queryArray(`ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY`);
      await conn.queryArray(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='feed_likes' AND policyname='read_fl') THEN CREATE POLICY read_fl ON feed_likes FOR SELECT USING (true); CREATE POLICY ins_fl ON feed_likes FOR INSERT WITH CHECK (true); CREATE POLICY del_fl ON feed_likes FOR DELETE USING (true); END IF; END $$`);

      await conn.queryArray(`CREATE TABLE IF NOT EXISTS feed_comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), post_id uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE, person_id uuid NOT NULL, content text NOT NULL, created_at timestamptz DEFAULT now())`);
      results.push("feed_comments ok");
      await conn.queryArray(`ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY`);
      await conn.queryArray(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='feed_comments' AND policyname='read_fc') THEN CREATE POLICY read_fc ON feed_comments FOR SELECT USING (true); CREATE POLICY ins_fc ON feed_comments FOR INSERT WITH CHECK (true); CREATE POLICY del_fc ON feed_comments FOR DELETE USING (true); END IF; END $$`);
    } finally {
      conn.release();
      await pool.end();
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err), results }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
