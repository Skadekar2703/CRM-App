package com.example.crm_app_kmp.ai

import kotlin.js.JsExport

@JsExport
data class AiChatMessage(
    val id: String,
    val sender: String, // "user" or "assistant"
    val text: String,
    val timestamp: String,
    val toolUsed: String? = null,
    val suggestedQuestions: Array<String> = emptyArray()
)

@JsExport
data class AiChatRequest(
    val prompt: String,
    val history: Array<AiChatMessage> = emptyArray()
)

@JsExport
data class AiChatResponse(
    val reply: String,
    val toolUsed: String? = null,
    val suggestedQuestions: Array<String> = emptyArray(),
    val isConfigured: Boolean = true
)

@JsExport
object CrmAiPrompts {
    val defaultSuggestions = arrayOf(
        "Give me today's CRM summary",
        "How much Baki do I have?",
        "Who owes me the most?",
        "How many items are in Daag?",
        "Which products are low stock?"
    )
}
