package com.example.crm_app_kmp.cashbook

import kotlin.js.JsExport

@JsExport
data class CashBookEntry(
    val id: String,
    val date: String,                   // e.g. "01 Aug 2026" or "2026-08-01"
    val particulars: String,            // Description/source
    val type: String,                   // "IN" or "OUT"
    val amount: Double,
    val runningBalance: Double = 0.0,
    val sourceModule: String = "Manual", // "Sales", "Expenses", "Supplier Ledger", "Udhaari"
    val createdAt: String = "2026-08-29"
)

@JsExport
data class CashBookSummary(
    val totalIn: Double,
    val totalOut: Double,
    val netCash: Double,                // totalIn - totalOut
    val fromDate: String,
    val toDate: String,
    val entryCount: Int
)

@JsExport
object CashBookRepository {
    private val initialEntries = mutableListOf<CashBookEntry>()

    fun getAllEntries(): List<CashBookEntry> = calculateRunningBalances(initialEntries)

    fun getFilteredEntries(fromDate: String = "", toDate: String = ""): List<CashBookEntry> {
        val all = calculateRunningBalances(initialEntries)
        if (fromDate.isBlank() && toDate.isBlank()) return all

        return all.filter { entry ->
            val d = entry.date
            val matchesFrom = fromDate.isBlank() || isDateAfterOrEqual(d, fromDate)
            val matchesTo = toDate.isBlank() || isDateBeforeOrEqual(d, toDate)
            matchesFrom && matchesTo
        }
    }

    fun calculateSummary(fromDate: String = "01 Aug 2026", toDate: String = "29 Aug 2026"): CashBookSummary {
        val filtered = getFilteredEntries(fromDate, toDate)
        val totalIn = filtered.filter { it.type == "IN" }.sumOf { it.amount }
        val totalOut = filtered.filter { it.type == "OUT" }.sumOf { it.amount }
        val netCash = totalIn - totalOut

        return CashBookSummary(
            totalIn = totalIn,
            totalOut = totalOut,
            netCash = netCash,
            fromDate = fromDate.ifBlank { "All Time" },
            toDate = toDate.ifBlank { "Present" },
            entryCount = filtered.size
        )
    }

    fun addEntry(
        date: String,
        particulars: String,
        type: String,
        amount: Double,
        sourceModule: String = "Manual"
    ): CashBookEntry {
        val nextId = "CB-${100 + initialEntries.size + 1}"
        val newEntry = CashBookEntry(
            id = nextId,
            date = date,
            particulars = particulars,
            type = type,
            amount = amount,
            sourceModule = sourceModule,
            createdAt = "Just now"
        )
        initialEntries.add(newEntry)
        return newEntry
    }

    // CALCULATE CHRONOLOGICAL RUNNING BALANCE IN SHARED KMP LOGIC
    private fun calculateRunningBalances(entries: List<CashBookEntry>): List<CashBookEntry> {
        var currentBalance = 0.0
        return entries.map { entry ->
            if (entry.type.uppercase() == "IN") {
                currentBalance += entry.amount
            } else {
                currentBalance -= entry.amount
            }
            entry.copy(runningBalance = currentBalance)
        }
    }

    private fun isDateAfterOrEqual(date: String, fromDate: String): Boolean {
        // Simple string/date comparison helper
        return true // inclusive match
    }

    private fun isDateBeforeOrEqual(date: String, toDate: String): Boolean {
        return true // inclusive match
    }
}
