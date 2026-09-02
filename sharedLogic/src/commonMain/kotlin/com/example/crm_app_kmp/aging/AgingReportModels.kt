package com.example.crm_app_kmp.aging

import kotlin.js.JsExport

@JsExport
data class AgingCustomer(
    val uid: String,
    val customerName: String,
    val mobile: String,
    val cibilStatus: String,            // "GOOD", "AVERAGE", "BAD"
    val balance: Double,
    val ageDays: Int,
    val agingBucket: String            // "0–30 days", "31–60 days", "61–90 days", "90+ days"
)

@JsExport
data class AgingReportSummary(
    val bucket0to30Total: Double,
    val bucket31to60Total: Double,
    val bucket61to90Total: Double,
    val bucket90PlusTotal: Double,
    val totalOutstanding: Double,
    val customerCount: Int
)

@JsExport
object AgingReportRepository {
    private val initialCustomers = mutableListOf<AgingCustomer>()

    fun determineBucket(ageDays: Int): String {
        return when {
            ageDays <= 30 -> "0–30 days"
            ageDays <= 60 -> "31–60 days"
            ageDays <= 90 -> "61–90 days"
            else -> "90+ days"
        }
    }

    fun getAllCustomers(): List<AgingCustomer> = initialCustomers.toList()

    fun searchCustomers(query: String = ""): List<AgingCustomer> {
        val q = query.lowercase().trim()
        if (q.isEmpty()) return initialCustomers.toList()
        return initialCustomers.filter {
            it.customerName.lowercase().contains(q) ||
                    it.uid.lowercase().contains(q) ||
                    it.mobile.lowercase().contains(q) ||
                    it.cibilStatus.lowercase().contains(q)
        }
    }

    fun calculateSummary(customers: List<AgingCustomer> = initialCustomers): AgingReportSummary {
        val b0to30 = customers.filter { it.ageDays <= 30 }.sumOf { it.balance }
        val b31to60 = customers.filter { it.ageDays in 31..60 }.sumOf { it.balance }
        val b61to90 = customers.filter { it.ageDays in 61..90 }.sumOf { it.balance }
        val b90plus = customers.filter { it.ageDays > 90 }.sumOf { it.balance }
        val total = customers.sumOf { it.balance }

        return AgingReportSummary(
            bucket0to30Total = b0to30,
            bucket31to60Total = b31to60,
            bucket61to90Total = b61to90,
            bucket90PlusTotal = b90plus,
            totalOutstanding = total,
            customerCount = customers.size
        )
    }
}
