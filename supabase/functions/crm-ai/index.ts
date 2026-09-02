import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatIndianCurrency = (amount: number): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? "-" : ""}₹${formatted}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey || geminiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return new Response(
        JSON.stringify({
          reply: "AI Assistant is not configured yet. Please set GEMINI_API_KEY in Supabase Edge Function Secrets.",
          isConfigured: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || supabaseAnonKey;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. EXTRACT AND AUTHENTICATE USER FROM ACCESS TOKEN
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    
    let userId: string | null = null;
    if (token && token !== supabaseAnonKey) {
      const { data: authData } = await supabase.auth.getUser(token);
      if (authData?.user) {
        userId = authData.user.id;
      }
    }

    const body = await req.json();
    const prompt = body.prompt || "";
    const history = body.history || [];
    const model = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";

    console.log(`[CRM-AI] Request received. Auth User ID: ${userId || "UNAUTHENTICATED/ANON"}, Prompt: "${prompt}"`);

    // 2. DIAGNOSTIC ENDPOINT TO INSPECT DUPLICATE RECORDS ACROSS ALL TABLES
    if (prompt === "__run_duplicate_diagnostics__") {
      const tables = ["areas", "categories", "transports", "suppliers", "employees", "items", "customers"];
      const diagResults: any = {};

      for (const table of tables) {
        let query = supabase.from(table).select("*");
        if (userId) query = query.eq("user_id", userId);
        const { data: rows, error } = await query;
        if (error) {
          diagResults[table] = { error: error.message };
          continue;
        }
        const rowList = rows || [];
        const groups: any = {};
        rowList.forEach((r: any) => {
          const uId = r.user_id || "NULL_USER";
          const rawName = r.name || r.area_name || r.item_name || "UNNAMED";
          const normName = String(rawName).trim().toLowerCase();
          const key = `${uId}:::${normName}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(r);
        });

        const duplicates: any[] = [];
        Object.keys(groups).forEach((k) => {
          if (groups[k].length > 1) {
            duplicates.push({
              key: k,
              count: groups[k].length,
              records: groups[k].map((rec: any) => ({
                id: rec.id,
                user_id: rec.user_id,
                name: rec.name || rec.area_name || rec.item_name,
                sku: rec.sku,
                price: rec.price,
                stock_quantity: rec.stock_quantity,
                created_at: rec.created_at
              }))
            });
          }
        });

        diagResults[table] = {
          totalCount: rowList.length,
          duplicateGroupsCount: duplicates.length,
          duplicateGroups: duplicates
        };
      }

      return new Response(
        JSON.stringify({ reply: JSON.stringify(diagResults, null, 2), isConfigured: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. FETCH ACCOUNT-SCOPED REAL CRM DATA SNAPSHOT
    let custQuery = supabase.from("customers").select("*");
    let udhaariQuery = supabase.from("udhaari").select("*").order("created_at", { ascending: false }).limit(50);
    let salesQuery = supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(50);
    let itemsQuery = supabase.from("items").select("*").limit(50);
    let daagQuery = supabase.from("daag").select("*").limit(50);
    let suppliersQuery = supabase.from("suppliers").select("*").limit(50);
    let expensesQuery = supabase.from("expenses").select("*").limit(50);
    let chequesQuery = supabase.from("cheques").select("*").limit(50);
    let employeesQuery = supabase.from("employees").select("*").limit(50);

    if (userId) {
      custQuery = custQuery.eq("user_id", userId);
      udhaariQuery = udhaariQuery.eq("user_id", userId);
      salesQuery = salesQuery.eq("user_id", userId);
      itemsQuery = itemsQuery.eq("user_id", userId);
      daagQuery = daagQuery.eq("user_id", userId);
      suppliersQuery = suppliersQuery.eq("user_id", userId);
      expensesQuery = expensesQuery.eq("user_id", userId);
      chequesQuery = chequesQuery.eq("user_id", userId);
      employeesQuery = employeesQuery.eq("user_id", userId);
    }

    const [
      { data: rawCusts },
      { data: rawUdhaari },
      { data: rawSales },
      { data: rawItems },
      { data: rawDaag },
      { data: rawSuppliers },
      { data: rawExpenses },
      { data: rawCheques },
      { data: rawEmployees }
    ] = await Promise.all([
      custQuery,
      udhaariQuery,
      salesQuery,
      itemsQuery,
      daagQuery,
      suppliersQuery,
      expensesQuery,
      chequesQuery,
      employeesQuery
    ]);

    const custsList = rawCusts || [];
    
    // CALCULATE BAKI AND JAMA ACCORDING TO UDHAARI SCREEN LOGIC
    let totalBaki = 0;
    let totalJama = 0;

    const processedCustomers = custsList.map((c: any) => {
      const rawBaki = Number(c.baki || 0);
      const rawJama = Number(c.jama || 0);
      const bakiVal = rawBaki >= 0 ? rawBaki : 0;
      const jamaVal = rawBaki < 0 ? Math.abs(rawBaki) : rawJama;
      const outstandingVal = bakiVal - jamaVal;

      totalBaki += bakiVal;
      totalJama += jamaVal;

      return {
        id: c.id,
        name: c.name || "Customer",
        phone: c.phone || c.mobile || "",
        area: c.area || "General",
        baki: formatIndianCurrency(bakiVal),
        jama: formatIndianCurrency(jamaVal),
        outstanding: formatIndianCurrency(outstandingVal),
        rawBaki: bakiVal,
        rawJama: jamaVal,
        rawOutstanding: outstandingVal,
        status: c.status || "Active"
      };
    });

    const totalOutstanding = totalBaki - totalJama;

    const crmContext = {
      accountUserId: userId || "All-Accessible",
      summary: {
        totalCustomers: custsList.length,
        totalBaki: formatIndianCurrency(totalBaki),
        totalJama: formatIndianCurrency(totalJama),
        totalOutstanding: formatIndianCurrency(totalOutstanding),
        totalItemsCount: rawItems?.length || 0,
        totalDaagEntries: rawDaag?.length || 0,
        totalSalesCount: rawSales?.length || 0,
        totalSuppliersCount: rawSuppliers?.length || 0,
        totalEmployeesCount: rawEmployees?.length || 0,
      },
      customers: processedCustomers,
      recentUdhaariTransactions: (rawUdhaari || []).map((u: any) => ({
        customer: u.customer_name,
        type: u.type,
        amount: formatIndianCurrency(Number(u.amount || 0)),
        date: u.created_at,
        notes: u.notes,
      })),
      sales: (rawSales || []).map((s: any) => ({
        customer: s.customer_name || s.customer || "Customer",
        amount: formatIndianCurrency(Number(s.total_amount || s.amount || 0)),
        items: s.items || s.item_name || "Items",
        date: s.created_at,
        status: s.status,
      })),
      items: (rawItems || []).map((i: any) => ({
        name: i.name,
        sku: i.sku || i.id,
        stock: i.stock_quantity || 0,
        price: formatIndianCurrency(Number(i.price || 0)),
        rawPrice: Number(i.price || 0),
        category: i.category || "General"
      })),
      daag: (rawDaag || []).map((d: any) => ({
        item: d.item_name || d.name,
        status: d.status || "Pending",
        quantity: d.quantity || 1,
        supplier: d.supplier || "Supplier",
      })),
      suppliers: (rawSuppliers || []).map((sp: any) => ({
        name: sp.name,
        balance: formatIndianCurrency(Number(sp.balance || 0)),
        area: sp.area,
      })),
      expenses: (rawExpenses || []).map((ex: any) => ({
        category: ex.category || ex.name,
        amount: formatIndianCurrency(Number(ex.amount || 0)),
        date: ex.created_at,
      })),
      cheques: (rawCheques || []).map((ch: any) => ({
        payee: ch.payee || ch.name,
        amount: formatIndianCurrency(Number(ch.amount || 0)),
        status: ch.status || "Pending",
      })),
      employees: (rawEmployees || []).map((emp: any) => ({
        name: emp.name,
        role: emp.role || emp.designation,
        status: emp.status || "Active",
      })),
    };

    // SYSTEM PROMPT FOR INTENT-SPECIFIC CRM ASSISTANT
    const systemPrompt = "You are the general-purpose CRM Data Assistant for the currently authenticated account. " +
      "Your job is to answer natural-language questions about customers, sales, item stock, Udhaari Baki/Jama, Daag items, suppliers, expenses, and employees using the Real CRM Database Context provided.\n\n" +
      "CRITICAL RULES:\n" +
      "1. NEVER output Markdown bold asterisks (**) or bullet asterisks (*) anywhere in your response. Clean plain text only.\n" +
      "2. INTENT ROUTING:\n" +
      "   - If the user asks about a SPECIFIC CUSTOMER (e.g., 'whats the baaki amount of rohan?', 'Rohan ka kitna baki hai?'), search the customers array in the context for a customer matching that name. Return Rohan's exact Baki, Jama, and Outstanding. DO NOT return the full business summary!\n" +
      "   - If the customer does NOT exist in the context, explicitly reply: 'I couldn't find a customer named [Name] in your CRM database.'\n" +
      "   - If the user asks about DAAG items (e.g., 'Daag mein kitne items hain?', 'How many items are in Daag?', 'Daag ke items dikhao'), answer using the daag array and totalDaagEntries summary. DO NOT treat 'Daag mein kitne items hain' as an item name search!\n" +
      "   - If the user asks about PRODUCT PRICE/STOCK (e.g., 'price of rice'), search the items array for rice and state its price and stock_quantity.\n" +
      "   - If the user asks for a GENERAL CRM/BUSINESS SUMMARY, output the dashboard summary statistics.\n" +
      "3. Financial Math: Outstanding = Total Baki - Total Jama. Baki is debt owed by customer, Jama is payment received from customer.\n" +
      "4. Support English, Hindi, and Hinglish queries seamlessly.";

    // BUILD GEMINI REST CONTEXT WITH CONVERSATION HISTORY
    const contents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      history.slice(-6).forEach((h: any) => {
        contents.push({
          role: h.sender === "user" ? "user" : "model",
          parts: [{ text: String(h.text || "") }],
        });
      });
    }

    contents.push({
      role: "user",
      parts: [
        {
          text: `${systemPrompt}\n\nUser Question: "${prompt}"\n\nReal CRM Database Context:\n${JSON.stringify(crmContext, null, 2)}\n\nAnswer the user's question directly and accurately in clean plain text without any ** symbols.`,
        },
      ],
    });

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

    const res = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    const geminiData = await res.json();

    if (geminiData.error) {
      console.error(`[CRM-AI] Gemini API Error: ${geminiData.error.message}`);
      return new Response(
        JSON.stringify({
          reply: `Gemini API Error: ${geminiData.error.message || "Failed to process request"}`,
          isConfigured: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      replyText = "I queried your CRM database, but could not generate a response for that specific question.";
    }

    // SANITIZE ASTERISKS (Ensure zero Markdown ** reach the client UI)
    replyText = replyText.replace(/\*\*/g, "").replace(/\*/g, "");

    console.log(`[CRM-AI] Response generated successfully for User ID ${userId || "ANON"}.`);

    return new Response(
      JSON.stringify({
        reply: replyText,
        suggestedQuestions: [
          "Give me my CRM summary",
          "Sham ka kitna baki hai?",
          "Daag mein kitne items hain?",
          "How much did I sell this month?",
        ],
        isConfigured: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error(`[CRM-AI] Edge Function Exception: ${err.message}`);
    return new Response(
      JSON.stringify({ reply: `Error connecting to CRM AI service: ${err.message}`, isConfigured: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
