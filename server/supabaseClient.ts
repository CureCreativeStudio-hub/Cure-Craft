import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Support standard Supabase environment variable naming across Vercel, Vite, Next.js, and Docker
export const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

export const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const SUPABASE_STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || 'branding-assets';

let supabaseInstance: SupabaseClient | null = null;
let bucketVerified = false;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_URL.startsWith('http') &&
    SUPABASE_KEY &&
    SUPABASE_KEY.length > 10
  );
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('[Supabase] Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

/**
 * Ensures the branding storage bucket exists in Supabase.
 * Attempts auto-creation if using a service role key.
 */
export async function ensureStorageBucket(): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  if (bucketVerified) return true;

  try {
    const { data: buckets, error: listErr } = await client.storage.listBuckets();
    if (!listErr && buckets) {
      const exists = buckets.some((b) => b.name === SUPABASE_STORAGE_BUCKET || b.id === SUPABASE_STORAGE_BUCKET);
      if (exists) {
        bucketVerified = true;
        return true;
      }
    }

    // Attempt to create public bucket if missing
    const { error: createErr } = await client.storage.createBucket(SUPABASE_STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 15 * 1024 * 1024,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
    });

    if (!createErr) {
      console.log(`[Supabase] Successfully created public bucket: ${SUPABASE_STORAGE_BUCKET}`);
      bucketVerified = true;
      return true;
    } else {
      console.warn(`[Supabase] Note on bucket creation: ${createErr.message}`);
      // Bucket might already exist or need admin panel creation if using anon key
      return false;
    }
  } catch (err: any) {
    console.warn(`[Supabase] Could not verify/create bucket: ${err?.message || err}`);
    return false;
  }
}

/**
 * Uploads an image buffer directly to Supabase Storage.
 * Returns the permanent public CDN URL.
 */
export async function uploadToSupabaseStorage(
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ success: boolean; publicUrl: string; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, publicUrl: '', error: 'Supabase credentials not configured' };
  }

  await ensureStorageBucket();

  try {
    const { error: uploadError } = await client.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
        cacheControl: '31536000', // 1 year cache
      });

    if (uploadError) {
      return { success: false, publicUrl: '', error: uploadError.message };
    }

    const { data: publicUrlData } = client.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      publicUrl: '',
      error: err?.message || 'Storage upload failed',
    };
  }
}
