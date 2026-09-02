package com.example.crm_app_kmp.dashboard

import kotlin.js.JsExport

@JsExport
data class DashboardSummary(
    val totalBakiFormatted: String,
    val totalBakiChange: String,
    val isTotalBakiPositive: Boolean,
    val cashInHandFormatted: String,
    val cashInHandChange: String,
    val isCashInHandPositive: Boolean,
    val todayUdharFormatted: String,
    val todayUdharTransactions: Int,
    val todayCollectionsFormatted: String,
    val todayCollectionsBadge: String,
    val chequesCount: Int,
    val chequesPending: Int,
    val urgentNotesCount: Int,
    val daagMoveCount: Int
)

@JsExport
data class DebtorItem(
    val id: String,
    val customerName: String,
    val area: String,
    val amountFormatted: String,
    val status: String,
    val lastPaidInfo: String,
    val phone: String = ""
)

@JsExport
data class UrgentNote(
    val id: String,
    val title: String,
    val description: String,
    val dateTimeInfo: String,
    val priority: String
)

@JsExport
data class RiskyPaymentItem(
    val id: String,
    val customerName: String,
    val riskLevel: String,
    val reason: String,
    val amountFormatted: String,
    val lastContactInfo: String
)
