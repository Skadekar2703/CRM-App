package com.example.crm_app_kmp.expenses

import kotlin.js.JsExport

@JsExport
data class ExpenseModel(
    val id: String,
    val date: String,             // e.g. "14 Jun 2026" or "2026-08-29"
    val category: String,         // Rent, Electricity, Office Supplies, Fuel, Tea & Snacks, Maintenance, Other
    val amount: Double,           // e.g. 1200.0
    val paymentMode: String = "Cash", // Cash, UPI, Bank Transfer, Card, Other
    val paidTo: String = "",
    val description: String = "",
    val createdAt: String = "2026-08-29",
    val updatedAt: String = "2026-08-29"
)

@JsExport
data class ExpenseSummary(
    val todayTotal: Double,
    val monthTotal: Double,
    val totalRecords: Int
)

@JsExport
object ExpenseRepository {
    private val initialExpenses = mutableListOf<ExpenseModel>()

    fun getExpenses(): List<ExpenseModel> = initialExpenses.toList()

    fun calculateSummary(): ExpenseSummary {
        val todayStr = "29 Aug 2026"
        val todayIso = "2026-08-29"
        val monthStr = "Aug"
        val monthNum = "-08-"

        val todaySum = initialExpenses
            .filter { it.date.contains(todayStr) || it.date.contains(todayIso) }
            .sumOf { it.amount }

        val monthSum = initialExpenses
            .filter { it.date.contains(monthStr) || it.date.contains(monthNum) || it.date.contains("Jun") }
            .sumOf { it.amount }

        return ExpenseSummary(
            todayTotal = todaySum,
            monthTotal = monthSum,
            totalRecords = initialExpenses.size
        )
    }

    fun searchExpenses(query: String = ""): List<ExpenseModel> {
        val q = query.lowercase().trim()
        if (q.isEmpty()) return initialExpenses.toList()
        return initialExpenses.filter { e ->
            e.category.lowercase().contains(q) ||
                    e.paidTo.lowercase().contains(q) ||
                    e.description.lowercase().contains(q) ||
                    e.paymentMode.lowercase().contains(q) ||
                    e.id.lowercase().contains(q)
        }
    }

    fun addExpense(
        date: String,
        category: String,
        amount: Double,
        paymentMode: String,
        paidTo: String = "",
        description: String = ""
    ): ExpenseModel {
        val nextId = "EXP-${100 + initialExpenses.size + 1}"
        val newE = ExpenseModel(
            id = nextId,
            date = date,
            category = category,
            amount = amount,
            paymentMode = paymentMode,
            paidTo = paidTo,
            description = description,
            createdAt = "Just now"
        )
        initialExpenses.add(0, newE)
        return newE
    }

    fun updateExpense(
        id: String,
        date: String,
        category: String,
        amount: Double,
        paymentMode: String,
        paidTo: String = "",
        description: String = ""
    ): ExpenseModel? {
        val idx = initialExpenses.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val updated = initialExpenses[idx].copy(
                date = date,
                category = category,
                amount = amount,
                paymentMode = paymentMode,
                paidTo = paidTo,
                description = description,
                updatedAt = "Just now"
            )
            initialExpenses[idx] = updated
            return updated
        }
        return null
    }

    fun deleteExpense(id: String): Boolean {
        return initialExpenses.removeAll { it.id == id }
    }
}
