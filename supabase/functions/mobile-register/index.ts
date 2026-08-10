import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

interface RegisterRequest {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

interface RegisterData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed.", 405);
  }

  try {
    let body: RegisterRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body.", 400);
    }

    const validationError = validate(body);
    if (validationError) {
      return errorResponse(validationError, 422);
    }

    const fullName = body.full_name.trim();
    const email    = body.email.trim().toLowerCase();
    const phone    = body.phone.trim();
    const password = body.password;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
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

    const { error: profileError } = await supabase
      .from("customer_profiles")
      .upsert(
        { id: userId, full_name: fullName, email, phone },
        { onConflict: "id" }
      );

    if (profileError) {
      console.warn("[register] Profile upsert warning:", profileError.message);
    }

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
