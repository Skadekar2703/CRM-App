import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || supabaseAnonKey;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { action, username, password, role, status, userId, seedSecret } = body;

    const defaultBusinessId = "00000000-0000-0000-0000-000000000001";

    // SPECIAL ACTION: PROVISION INITIAL ADMIN ACCOUNTS IDEMPOTENTLY
    if (action === "SEED_INITIAL_ADMINS") {
      const initialAdmins = [
        { username: "admin1", email: "admin1@business.crm", password: "admin123" },
        { username: "admin2", email: "admin2@business.crm", password: "admin123" },
        { username: "admin3", email: "admin3@business.crm", password: "admin123" }
      ];

      const results = [];

      for (const admin of initialAdmins) {
        let authUserId = "";

        // Check if Auth user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const foundUser = existingUsers?.users?.find(u => u.email === admin.email);

        if (foundUser) {
          authUserId = foundUser.id;
        } else {
          // Create new user in Supabase Auth via Admin API
          const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: admin.email,
            password: admin.password,
            email_confirm: true,
            user_metadata: { username: admin.username, role: "ADMIN" }
          });

          if (createErr || !created?.user) {
            results.push({ username: admin.username, status: "Failed", error: createErr?.message });
            continue;
          }
          authUserId = created.user.id;
        }

        // Upsert into business_members table
        const { error: memberErr } = await supabaseAdmin
          .from("business_members")
          .upsert({
            id: authUserId,
            business_id: defaultBusinessId,
            username: admin.username,
            role: "ADMIN",
            status: "Active"
          });

        if (memberErr) {
          results.push({ username: admin.username, status: "Auth created, member profile failed", error: memberErr.message });
        } else {
          results.push({ username: admin.username, status: "Success", userId: authUserId });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. VERIFY ADMIN AUTHENTICATION TOKEN FOR REGULAR OPERATIONS
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Authentication token required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { data: { user: callingUser }, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !callingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // 2. CHECK CALLER'S ROLE IN BUSINESS MEMBERS
    const { data: callerMember, error: callerErr } = await supabaseAdmin
      .from("business_members")
      .select("business_id, role, status")
      .eq("id", callingUser.id)
      .single();

    if (callerErr || !callerMember || callerMember.role !== "ADMIN" || callerMember.status !== "Active") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin privilege required to manage staff users." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const businessId = callerMember.business_id;

    // 3. ACTION DISPATCHER
    if (action === "CREATE_STAFF") {
      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: "Username and password are required to create staff." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const syntheticEmail = `${cleanUsername}@business.crm`;
      const staffRole = role === "ADMIN" ? "ADMIN" : "STAFF";

      // Check if username already exists in business_members
      const { data: existingMember } = await supabaseAdmin
        .from("business_members")
        .select("id")
        .eq("username", cleanUsername)
        .single();

      if (existingMember) {
        return new Response(
          JSON.stringify({ error: `Username "${cleanUsername}" is already taken.` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Create User in Supabase Auth via Admin API
      const { data: createdAuthUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: syntheticEmail,
        password: password,
        email_confirm: true,
        user_metadata: { username: cleanUsername, role: staffRole }
      });

      if (createErr || !createdAuthUser?.user) {
        return new Response(
          JSON.stringify({ error: `Failed to create auth user: ${createErr?.message || "Unknown error"}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const newUserId = createdAuthUser.user.id;

      // Upsert into business_members
      const { error: memberErr } = await supabaseAdmin
        .from("business_members")
        .upsert({
          id: newUserId,
          business_id: businessId,
          username: cleanUsername,
          role: staffRole,
          status: "Active"
        });

      if (memberErr) {
        return new Response(
          JSON.stringify({ error: `User created but profile sync failed: ${memberErr.message}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: `Staff user "${cleanUsername}" created successfully.`, userId: newUserId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "CHANGE_PASSWORD") {
      if (!userId || !password) {
        return new Response(
          JSON.stringify({ error: "User ID and new password are required." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Verify target user belongs to same business and is STAFF
      const { data: targetMember, error: targetErr } = await supabaseAdmin
        .from("business_members")
        .select("business_id, role, status")
        .eq("id", userId)
        .single();

      if (targetErr || !targetMember) {
        return new Response(
          JSON.stringify({ error: "Target user not found." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      if (targetMember.business_id !== businessId) {
        return new Response(
          JSON.stringify({ error: "Forbidden: Target user belongs to a different business." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }

      if (targetMember.role !== "STAFF") {
        return new Response(
          JSON.stringify({ error: "Forbidden: Admin passwords cannot be modified via staff management." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }

      // Update password via Supabase Auth Admin API
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password
      });

      if (updateErr) {
        return new Response(
          JSON.stringify({ error: `Failed to change password: ${updateErr.message}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Staff password changed successfully." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "TOGGLE_STATUS") {
      if (!userId || !status) {
        return new Response(
          JSON.stringify({ error: "User ID and status are required." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Verify target user belongs to same business and is STAFF
      const { data: targetMember, error: targetErr } = await supabaseAdmin
        .from("business_members")
        .select("business_id, role, status")
        .eq("id", userId)
        .single();

      if (targetErr || !targetMember) {
        return new Response(
          JSON.stringify({ error: "Target user not found." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      if (targetMember.business_id !== businessId) {
        return new Response(
          JSON.stringify({ error: "Forbidden: Target user belongs to a different business." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }

      if (targetMember.role !== "STAFF") {
        return new Response(
          JSON.stringify({ error: "Forbidden: Admin account status cannot be modified." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }

      const newStatus = status === "Disabled" ? "Disabled" : "Active";
      const { error: statusErr } = await supabaseAdmin
        .from("business_members")
        .update({ status: newStatus })
        .eq("id", userId)
        .eq("business_id", businessId);

      if (statusErr) {
        return new Response(
          JSON.stringify({ error: `Failed to update status: ${statusErr.message}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Ban/unban Supabase Auth user to enforce Auth layer rejection as well
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: newStatus === "Disabled" ? "876000h" : "none"
      });

      return new Response(
        JSON.stringify({ success: true, message: `Staff user status updated to ${newStatus}.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action type specified." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Manage Staff Edge Function Error: ${err.message}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
