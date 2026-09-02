package com.example.crm_app_kmp.profitloss

import kotlin.js.JsExport

@JsExport
data class PLStatementItem(
    val label: String,
    val amount: Double,
    val type: String,                   // "INCOME", "COST", "NET"
    val isHighlight: Boolean = false
)

@JsExport
data class CostProfitBreakdownData(
    val purchases: Double,
    val expenses: Double,
    val salaries: Double,
    val netProfit: Double
)

@JsExport
data class ProfitLossReport(
    val fromDate: String,
    val toDate: String,
    val revenue: Double,
    val purchases: Double,
    val expenses: Double,
    val salaries: Double,
    val expensesPlusSalaries: Double,
    val netProfit: Double,
    val isLoss: Boolean,
    val statementItems: List<PLStatementItem>,
    val breakdown: CostProfitBreakdownData
)

@JsExport
object ProfitLossRepository {
    fun calculateReport(fromDate: String = "01/08/2026", toDate: String = "31/08/2026"): ProfitLossReport {
        // Base financial dataset for the report period
        val revenue = 185000.0
        val purchases = 77000.0
        val expenses = 16050.0
        val salaries = 25000.0
        val expPlusSalaries = expenses + salaries

        // Net Profit = Revenue - Purchases - Expenses - Salaries
        val netProfit = revenue - purchases - expenses - salaries
        val isLoss = netProfit < 0

        val statementItems = listOf(
            PLStatementItem(label = "+ Revenue (Sales)", amount = revenue, type = "INCOME"),
            PLStatementItem(label = "− Purchases", amount = purchases, type = "COST"),
            PLStatementItem(label = "− Expenses", amount = expenses, type = "COST"),
            PLStatementItem(label = "− Salaries (paid)", amount = salaries, type = "COST"),
            PLStatementItem(label = "= Net Profit", amount = netProfit, type = "NET", isHighlight = true)
        )

        val breakdown = CostProfitBreakdownData(
            purchases = purchases,
            expenses = expenses,
            salaries = salaries,
            netProfit = maxOf(0.0, netProfit)
        )

        return ProfitLossReport(
            fromDate = fromDate.ifBlank { "01/08/2026" },
            toDate = toDate.ifBlank { "31/08/2026" },
            revenue = revenue,
            purchases = purchases,
            expenses = expenses,
            salaries = salaries,
            expensesPlusSalaries = expPlusSalaries,
            netProfit = netProfit,
            isLoss = isLoss,
            statementItems = statementItems,
            breakdown = breakdown
        )
    }
}
