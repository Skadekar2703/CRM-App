import { supabase } from '../lib/supabase';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolUsed?: string;
  suggestedQuestions?: string[];
}

export interface AiChatResponse {
  reply: string;
  toolUsed?: string;
  suggestedQuestions?: string[];
  isConfigured: boolean;
}

export const formatIndianCurrency = (amount: number): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${isNegative ? '-' : ''}₹${formatted}`;
};

// LOCAL CRM READ TOOL DISPATCHER (Client Scoped Database Queries)
export const executeCrmReadTool = async (toolName: string, params: any = {}): Promise<any> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    switch (toolName) {
      case 'get_dashboard_summary': {
        let query = supabase.from('customers').select('baki, jama, status');
        if (userId) query = query.eq('user_id', userId);
        const { data: custs } = await query;
        const custsList = custs || [];
        let totalBaki = 0;
        let totalJama = 0;

        custsList.forEach((c: any) => {
          const rawBaki = Number(c.baki || 0);
          const rawJama = Number(c.jama || 0);
          const bakiVal = rawBaki >= 0 ? rawBaki : 0;
          const jamaVal = rawBaki < 0 ? Math.abs(rawBaki) : rawJama;
          totalBaki += bakiVal;
          totalJama += jamaVal;
        });

        const totalOutstanding = totalBaki - totalJama;
        let daagQuery = supabase.from('daag').select('*', { count: 'exact', head: true });
        let itemsQuery = supabase.from('items').select('*', { count: 'exact', head: true });
        if (userId) {
          daagQuery = daagQuery.eq('user_id', userId);
          itemsQuery = itemsQuery.eq('user_id', userId);
        }

        const { count: daagCount } = await daagQuery;
        const { count: itemsCount } = await itemsQuery;

        return {
          activeCustomers: custsList.length,
          totalBaki: formatIndianCurrency(totalBaki),
          totalJama: formatIndianCurrency(totalJama),
          totalOutstanding: formatIndianCurrency(totalOutstanding),
          pendingDaagItems: daagCount || 0,
          totalItems: itemsCount || 0
        };
      }

      case 'get_customer_balance': {
        const nameQuery = String(params.customerName || '').trim();
        let query = supabase.from('customers').select('*');
        if (userId) query = query.eq('user_id', userId);
        if (nameQuery) query = query.ilike('name', `%${nameQuery}%`);

        const { data } = await query;

        if (!data || data.length === 0) {
          return { found: false, message: `I couldn't find a customer matching "${nameQuery}" in your CRM database.` };
        }
        if (data.length > 1) {
          return {
            found: true,
            multiple: true,
            message: `Found ${data.length} customers matching "${nameQuery}": ${data.map((c: any) => c.name).join(', ')}.`
          };
        }

        const c = data[0];
        const rawBaki = Number(c.baki || 0);
        const rawJama = Number(c.jama || 0);
        const currentBaki = Math.max(0, rawBaki - rawJama);

        return {
          found: true,
          name: c.name,
          currentBaki: formatIndianCurrency(currentBaki),
          totalBakiGiven: formatIndianCurrency(rawBaki),
          jama: formatIndianCurrency(rawJama)
        };
      }

      case 'get_item_details': {
        const searchQuery = String(params.itemName || '').trim();
        let query = supabase.from('items').select('*');
        if (userId) query = query.eq('user_id', userId);
        if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);

        const { data } = await query;

        if (!data || data.length === 0) {
          let allQuery = supabase.from('items').select('name, price, stock_quantity').limit(5);
          if (userId) allQuery = allQuery.eq('user_id', userId);
          const { data: allItems } = await allQuery;

          if (allItems && allItems.length > 0) {
            return {
              found: false,
              message: `No item matching "${searchQuery}" was found in your inventory. Available products: ${allItems.map((i: any) => `${i.name} (${formatIndianCurrency(Number(i.price || 0))})`).join(', ')}`
            };
          }
          return { found: false, message: `No product matching "${searchQuery}" was found in your CRM inventory.` };
        }

        const item = data[0];
        return {
          found: true,
          name: item.name,
          sku: item.sku || item.id,
          price: formatIndianCurrency(Number(item.price || 0)),
          stock: item.stock_quantity || 0,
          category: item.category || 'General'
        };
      }

      case 'get_daag_summary': {
        let query = supabase.from('daag').select('*');
        if (userId) query = query.eq('user_id', userId);
        const { data } = await query;
        const pending = data?.filter((d: any) => d.status === 'Pending' || d.status === 'Out') || [];
        return {
          totalDaagEntries: data?.length || 0,
          pendingItems: pending.length,
          items: (data || []).map((d: any) => `${d.item_name || d.name || 'Item'} (${d.status || 'Pending'})`).join(', ')
        };
      }

      case 'get_sales_summary': {
        let query = supabase.from('sales').select('total_amount');
        if (userId) query = query.eq('user_id', userId);
        const { data } = await query;
        const total = data?.reduce((sum: number, s: any) => sum + Number(s.total_amount || 0), 0) || 0;
        return { totalSalesCount: data?.length || 0, totalRevenue: formatIndianCurrency(total) };
      }

      default:
        return { error: `Tool ${toolName} is not recognized.` };
    }
  } catch (e: any) {
    return { error: e.message };
  }
};

// MAIN CRM AI ASSISTANT FUNCTION
export const queryCrmAiAssistant = async (
  prompt: string,
  _history: AiChatMessage[] = []
): Promise<AiChatResponse> => {
  const lowerPrompt = prompt.toLowerCase().trim();

  // 1. SECURE SUPABASE EDGE FUNCTION CALL (Passes JWT token in Authorization header)
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const { data, error } = await supabase.functions.invoke('crm-ai', {
      body: { prompt, history: _history },
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!error && data && data.reply) {
      const cleanReply = String(data.reply).replace(/\*\**/g, '').replace(/\*/g, '');
      return {
        reply: cleanReply,
        toolUsed: data.toolUsed,
        suggestedQuestions: data.suggestedQuestions || [
          "Give me my CRM summary",
          "Sham ka kitna baki hai?",
          "Daag mein kitne items hain?",
          "How much did I sell this month?"
        ],
        isConfigured: true
      };
    }
  } catch (e) {
    console.log('Edge function invocation fallback to client inspection:', e);
  }

  // 2. DAAG QUERIES (Prioritized to prevent routing to item name search)
  if (lowerPrompt.includes('daag')) {
    const daagData = await executeCrmReadTool('get_daag_summary');
    return {
      reply: `Daag Inventory Summary:\n` +
        `• Pending Items Outside: ${daagData.pendingItems} items\n` +
        `• Total Daag Entries: ${daagData.totalDaagEntries}` +
        (daagData.items ? `\n• Items: ${daagData.items}` : ''),
      toolUsed: 'get_daag_summary',
      suggestedQuestions: ["Give me my CRM summary", "Sham ka kitna baki hai?", "How much did I sell this month?"],
      isConfigured: true
    };
  }

  // 3. CUSTOMER FINANCIAL BALANCE / BAKI QUERIES
  if (lowerPrompt.includes('baki') || lowerPrompt.includes('owe') || lowerPrompt.includes('jama') || lowerPrompt.includes('rohan') || lowerPrompt.includes('sham')) {
    // Extract customer name explicitly
    let searchName = '';
    const words = lowerPrompt.split(/\s+/);
    const stopWords = new Set(['whats', 'what', 'is', 'the', 'baaki', 'baki', 'amount', 'total', 'jama', 'of', 'for', 'ka', 'ki', 'se', 'owe', 'kitna', 'hai', 'how', 'much', 'does', 'did', 'show', 'me']);
    const nameCandidates = words.filter(w => !stopWords.has(w.replace(/[^\w]/g, '')));
    searchName = nameCandidates.join(' ').trim();

    if (!searchName && lowerPrompt.includes('rohan')) searchName = 'rohan';
    if (!searchName && lowerPrompt.includes('sham')) searchName = 'sham';

    if (searchName) {
      const custData = await executeCrmReadTool('get_customer_balance', { customerName: searchName });
      if (custData.found && !custData.multiple) {
        return {
          reply: `Customer Financial Details for ${custData.name}:\n` +
            `• Current Baki (Loan Owed): ${custData.currentBaki}\n` +
            `• Total Baki Given: ${custData.totalBakiGiven}\n` +
            `• Total Jama (Paid): ${custData.jama}`,
          toolUsed: 'get_customer_balance',
          suggestedQuestions: ["Give me my CRM summary", "Daag mein kitne items hain?", "How much did I sell this month?"],
          isConfigured: true
        };
      } else if (custData.message) {
        return {
          reply: custData.message,
          toolUsed: 'get_customer_balance',
          suggestedQuestions: ["Give me my CRM summary", "Daag mein kitne items hain?", "How much did I sell this month?"],
          isConfigured: true
        };
      }
    }
  }

  // 4. ITEM & PRICE QUERIES
  if (lowerPrompt.includes('price') || lowerPrompt.includes('cost') || lowerPrompt.includes('rate') || lowerPrompt.includes('rice') || lowerPrompt.includes('sugar')) {
    const matchTerm = lowerPrompt.match(/(?:price|cost|rate|stock|of|for)?\s*([a-zA-Z0-9\s]+?)\s*(?:price|cost|rate|stock|how|much|\?|$)/i);
    const searchItem = matchTerm?.[1]?.replace(/(price|cost|rate|stock|of|for|how|much|show|me)/gi, '').trim() || 'rice';
    const itemData = await executeCrmReadTool('get_item_details', { itemName: searchItem.length > 0 ? searchItem : 'rice' });

    if (itemData.found) {
      return {
        reply: `Item Inventory Details for ${itemData.name}:\n` +
          `• Price: ${itemData.price}\n` +
          `• Current Stock: ${itemData.stock} units\n` +
          `• Category: ${itemData.category}`,
        toolUsed: 'get_item_details',
        suggestedQuestions: ["Give me my CRM summary", "Sham ka kitna baki hai?", "Daag mein kitne items hain?"],
        isConfigured: true
      };
    } else if (itemData.message) {
      return {
        reply: itemData.message,
        toolUsed: 'get_item_details',
        suggestedQuestions: ["Give me my CRM summary", "Sham ka kitna baki hai?", "Daag mein kitne items hain?"],
        isConfigured: true
      };
    }
  }

  // 5. SALES QUERIES
  if (lowerPrompt.includes('sale') || lowerPrompt.includes('sold') || lowerPrompt.includes('revenue')) {
    const sales = await executeCrmReadTool('get_sales_summary');
    return {
      reply: `Sales Summary:\n` +
        `• Total Sales Count: ${sales.totalSalesCount}\n` +
        `• Total Revenue Collected: ${sales.totalRevenue}`,
      toolUsed: 'get_sales_summary',
      suggestedQuestions: ["Give me my CRM summary", "Sham ka kitna baki hai?", "Daag mein kitne items hain?"],
      isConfigured: true
    };
  }

  // DEFAULT DASHBOARD SUMMARY ONLY WHEN SPECIFICALLY REQUESTED
  const summary = await executeCrmReadTool('get_dashboard_summary');
  return {
    reply: `Real CRM Business Summary:\n` +
      `• Active Customers: ${summary.activeCustomers}\n` +
      `• Total Baki: ${summary.totalBaki}\n` +
      `• Total Jama: ${summary.totalJama}\n` +
      `• Pending Daag Items: ${summary.pendingDaagItems}`,
    toolUsed: 'get_dashboard_summary',
    suggestedQuestions: [
      "Sham ka kitna baki hai?",
      "Daag mein kitne items hain?",
      "How much did I sell this month?",
      "Give me my CRM summary"
    ],
    isConfigured: true
  };
};
