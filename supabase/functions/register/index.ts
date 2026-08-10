import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS ─────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Standard Response Contract ───────────────────────────────────────────────
// MUST match Flutter ApiResponse<T>: { status: bool, message: string, data?: T }
interface ApiResponse<T = unknown> {
  status: boolean;
  message: string;
  data?: T;
}

function jsonResponse<T>(body: ApiResponse<T>, statusCode = 200): Response {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, statusCode = 400): Response {
  return jsonResponse<null>({ status: false, message }, statusCode);
}

// ─── Request / Response Types ─────────────────────────────────────────────────
interface RegisterRequest {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

// The `data` payload returned on success — matches Flutter CustomerProfileModel
interface RegisterData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

// ─── Input Validation ─────────────────────────────────────────────────────────
function validate(body: RegisterRequest): string | null {
  if (!body.full_name || body.full_name.trim().length < 2) {
    return "Full name must be at least 2 characters.";
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    return "A valid email address is required.";
  }
  if (!body.phone || body.phone.replace(/\D/g, "").length < 7) {
    return "A valid phone number is required.";
  }
  if (!body.password || body.password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed.", 405);
  }

  try {
    // ── 1. Parse body ──────────────────────────────────────────────────────────
    let body: RegisterRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body.", 400);
    }

    // ── 2. Validate inputs ─────────────────────────────────────────────────────
    const validationError = validate(body);
    if (validationError) {
      return errorResponse(validationError, 422);
    }

    const fullName = body.full_name.trim();
    const email    = body.email.trim().toLowerCase();
    const phone    = body.phone.trim();
    const password = body.password;

    // ── 3. Admin Supabase client (service_role bypasses RLS) ──────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 4. Create auth user ────────────────────────────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Sends a confirmation email to the user's inbox
      user_metadata: {
        full_name: fullName,
        phone,
      },
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists")) {
        return errorResponse("An account with this email already exists.", 409);
      }
      console.error("[register] Auth error:", authError.message);
      return errorResponse("Failed to create account. Please try again.", 400);
    }

    const userId = authData.user?.id;
    if (!userId) {
      return errorResponse("Account creation failed. Please try again.", 500);
    }

    // ── 5. Upsert customer_profiles ────────────────────────────────────────────
    // The DB trigger `handle_new_customer` auto-creates this row on auth.users insert.
    // This upsert guarantees all fields are populated correctly regardless of trigger timing.
    const { error: profileError } = await supabase
      .from("customer_profiles")
      .upsert(
        { id: userId, full_name: fullName, email, phone },
        { onConflict: "id" }
      );

    if (profileError) {
      // Non-fatal — DB trigger will still create the row. Log and continue.
      console.warn("[register] Profile upsert warning:", profileError.message);
    }

    // ── 6. Respond ─────────────────────────────────────────────────────────────
    // 201 Created — user exists in auth.users but email is NOT yet confirmed.
    // The Flutter app should show a "check your email" message instead of navigating to Home.
    return jsonResponse<RegisterData>({
      status: true,
      message: "Account created! Please check your email and click the confirmation link to activate your account.",
      data: {
        id: userId,
        full_name: fullName,
        email,
        phone,
      },
    }, 201);

  } catch (err) {
    console.error("[register] Unexpected error:", err);
    return errorResponse("An unexpected error occurred. Please try again.", 500);
  }
});
