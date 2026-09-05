package com.example.crm_app_kmp.ui.ai

import org.json.JSONObject

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.crm_app_kmp.ai.AiChatMessage
import com.example.crm_app_kmp.ai.CrmAiPrompts
import com.example.crm_app_kmp.data.SupabaseAndroidClient
import com.example.crm_app_kmp.udhaari.UdhaariCurrencyFormatter
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary
import kotlinx.coroutines.launch

@Composable
fun AndroidAiChatDialog(
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val supabaseClient = remember { SupabaseAndroidClient(context) }
    val scope = rememberCoroutineScope()

    val messages = remember {
        mutableStateListOf(
            AiChatMessage(
                id = "init-1",
                sender = "assistant",
                text = "Hello! I am your CRM AI Assistant. Ask me anything about your Baki/Jama debt, Daag items, inventory, or sales.",
                timestamp = "Just now",
                suggestedQuestions = CrmAiPrompts.defaultSuggestions
            )
        )
    }

    var inputPrompt by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    fun processQuery(prompt: String) {
        if (prompt.isBlank() || isLoading) return
        val userText = prompt.trim()

        messages.add(
            AiChatMessage(
                id = "user-${System.currentTimeMillis()}",
                sender = "user",
                text = userText,
                timestamp = "Just now"
            )
        )
        inputPrompt = ""
        isLoading = true

        scope.launch {
            val lower = userText.lowercase()
            var reply = ""
            var suggested = CrmAiPrompts.defaultSuggestions

            val payload = JSONObject().apply {
                put("prompt", userText)
            }
            val edgeRes = supabaseClient.invokeEdgeFunction("crm-ai", payload)
            edgeRes.onSuccess { obj ->
                reply = obj.optString("reply", "")
            }

            if (reply.isBlank()) {
                if (lower.contains("baki") || lower.contains("owe") || lower.contains("jama") || lower.contains("rohan") || lower.contains("sham")) {
                    val res = supabaseClient.fetchTable("customers")
                    res.onSuccess { array ->
                        var totalBaki = 0.0
                        var totalJama = 0.0
                        var targetCust: String? = null
                        var custBaki = 0.0
                        var custJama = 0.0

                        for (i in 0 until array.length()) {
                            val obj = array.getJSONObject(i)
                            val b = obj.optDouble("baki", 0.0)
                            val j = obj.optDouble("jama", 0.0)
                            val name = obj.optString("name", "")
                            totalBaki += if (b >= 0) b else 0.0
                            totalJama += if (b < 0) kotlin.math.abs(b) else j

                            if (lower.contains(name.lowercase())) {
                                targetCust = name
                                custBaki = b
                                custJama = j
                            }
                        }

                        if (targetCust != null) {
                            reply = "Customer Financial Details for $targetCust:\n" +
                                    "• Total Baki (Debt): ${UdhaariCurrencyFormatter.formatIndianCurrency(custBaki)}\n" +
                                    "• Total Jama (Paid): ${UdhaariCurrencyFormatter.formatIndianCurrency(custJama)}"
                        } else {
                            reply = "Overall Udhaari Summary:\n" +
                                    "• Total Baki: ${UdhaariCurrencyFormatter.formatIndianCurrency(totalBaki)}\n" +
                                    "• Total Jama: ${UdhaariCurrencyFormatter.formatIndianCurrency(totalJama)}"
                        }
                    }
                } else if (lower.contains("daag")) {
                    val res = supabaseClient.fetchTable("daag")
                    res.onSuccess { array ->
                        var pending = 0
                        for (i in 0 until array.length()) {
                            val st = array.getJSONObject(i).optString("status", "")
                            if (st.equals("Pending", ignoreCase = true) || st.equals("Out", ignoreCase = true)) {
                                pending++
                            }
                        }
                        reply = "Daag Inventory Summary:\n" +
                                "• Pending Items Outside: $pending item(s)\n" +
                                "• Total Daag Entries: ${array.length()}"
                    }
                } else {
                    reply = "Unable to fetch AI answer for that prompt. Please ensure internet connectivity and try again."
                }
            }

            if (reply.isBlank()) {
                reply = "Unable to process query. Please check network connection."
            }

            val cleanReply = reply.replace("**", "").replace("*", "")

            messages.add(
                AiChatMessage(
                    id = "assistant-${System.currentTimeMillis()}",
                    sender = "assistant",
                    text = cleanReply,
                    timestamp = "Just now",
                    suggestedQuestions = suggested
                )
            )
            isLoading = false
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(540.dp)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // HEADER
                Surface(
                    color = Color(0xFF0F172A),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(PrimaryBlue),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("CRM AI Assistant", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text("Gemini & Real CRM Data", color = Color(0xFF94A3B8), fontSize = 11.sp)
                            }
                        }

                        Row {
                            IconButton(onClick = {
                                messages.clear()
                                messages.add(
                                    AiChatMessage(
                                        id = "init-reset",
                                        sender = "assistant",
                                        text = "Chat cleared. Ask me any question about your CRM.",
                                        timestamp = "Just now",
                                        suggestedQuestions = CrmAiPrompts.defaultSuggestions
                                    )
                                )
                            }) {
                                Icon(Icons.Default.Delete, contentDescription = "Clear", tint = Color(0xFF94A3B8), modifier = Modifier.size(20.dp))
                            }
                            IconButton(onClick = onDismiss) {
                                Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White, modifier = Modifier.size(20.dp))
                            }
                        }
                    }
                }

                // MESSAGES BODY
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .weight(1f)
                        .background(androidx.compose.material3.MaterialTheme.colorScheme.background)
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(messages) { msg ->
                        val isUser = msg.sender == "user"
                        Box(
                            modifier = Modifier.fillMaxWidth(),
                            contentAlignment = if (isUser) Alignment.CenterEnd else Alignment.CenterStart
                        ) {
                            Surface(
                                color = if (isUser) PrimaryBlue else androidx.compose.material3.MaterialTheme.colorScheme.surfaceVariant,
                                shape = RoundedCornerShape(
                                    topStart = 14.dp,
                                    topEnd = 14.dp,
                                    bottomStart = if (isUser) 14.dp else 2.dp,
                                    bottomEnd = if (isUser) 2.dp else 14.dp
                                ),
                                shadowElevation = 1.dp
                            ) {
                                Text(
                                    text = msg.text,
                                    fontSize = 13.sp,
                                    color = if (isUser) Color.White else androidx.compose.material3.MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier.padding(12.dp)
                                )
                            }
                        }
                    }

                    if (isLoading) {
                        item {
                            Surface(
                                color = Color.White,
                                shape = RoundedCornerShape(12.dp),
                                shadowElevation = 1.dp
                            ) {
                                Text("✨ Querying CRM database...", color = TextMuted, fontSize = 12.sp, modifier = Modifier.padding(10.dp))
                            }
                        }
                    }
                }

                // QUICK SUGGESTIONS
                val suggestions = messages.lastOrNull { it.sender == "assistant" }?.suggestedQuestions ?: CrmAiPrompts.defaultSuggestions
                if (suggestions.isNotEmpty()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.White)
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        suggestions.take(2).forEach { q ->
                            Surface(
                                color = Color(0xFFF1F5F9),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.clickable { processQuery(q) }
                            ) {
                                Text(q, fontSize = 11.sp, color = TextPrimary, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp))
                            }
                        }
                    }
                }

                // INPUT ROW
                Surface(
                    color = Color.White,
                    shadowElevation = 4.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = inputPrompt,
                            onValueChange = { inputPrompt = it },
                            placeholder = { Text("Ask about Baki, Daag, Sales...", fontSize = 12.sp, color = TextMuted) },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        )

                        Spacer(modifier = Modifier.width(8.dp))

                        IconButton(
                            onClick = { processQuery(inputPrompt) },
                            enabled = inputPrompt.isNotBlank() && !isLoading,
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (inputPrompt.isNotBlank() && !isLoading) PrimaryBlue else Color(0xFFCBD5E1))
                        ) {
                            Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send", tint = Color.White, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }
}
