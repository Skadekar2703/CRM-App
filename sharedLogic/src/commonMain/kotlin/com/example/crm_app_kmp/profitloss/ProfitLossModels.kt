package com.example.crm_app_kmp.profitloss

import kotlin.js.JsExport
import kotlin.math.max

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
object ProfitLossCalculator {
    fun calculate(
        fromDate: String,
        toDate: String,
        revenue: Double,
        purchases: Double,
        expenses: Double,
        salaries: Double
    ): ProfitLossReport {
        val totalExpensesAndSalaries = expenses + salaries
        val netProfit = revenue - purchases - expenses - salaries
        val isLoss = netProfit < 0

        val statementItems = listOf(
            PLStatementItem(label = "+ Revenue (Sales)", amount = revenue, type = "INCOME"),
            PLStatementItem(label = "− Purchases", amount = purchases, type = "COST"),
            PLStatementItem(label = "− Operating Expenses", amount = expenses, type = "COST"),
            PLStatementItem(label = "− Employee / Labour Costs", amount = salaries, type = "COST"),
            PLStatementItem(
                label = if (isLoss) "= Net Loss" else "= Net Profit",
                amount = netProfit,
                type = "NET",
                isHighlight = true
            )
        )

        val breakdown = CostProfitBreakdownData(
            purchases = purchases,
            expenses = expenses,
            salaries = salaries,
            netProfit = max(0.0, netProfit)
        )

        return ProfitLossReport(
            fromDate = fromDate,
            toDate = toDate,
            revenue = revenue,
            purchases = purchases,
            expenses = expenses,
            salaries = salaries,
            expensesPlusSalaries = totalExpensesAndSalaries,
            netProfit = netProfit,
            isLoss = isLoss,
            statementItems = statementItems,
            breakdown = breakdown
        )
    }

    fun formatINR(amount: Double): String {
        val absVal = kotlin.math.abs(amount)
        val intPart = absVal.toLong()
        val decPart = ((absVal - intPart) * 100).toLong()

        val strInt = intPart.toString()
        val formattedInt = if (strInt.length > 3) {
            val lastThree = strInt.substring(strInt.length - 3)
            val otherNumbers = strInt.substring(0, strInt.length - 3)
            val regex = "(\\d+?)(?=(\\d{2})+(?!\\d))".toRegex()
            val formattedOthers = regex.replace(otherNumbers) { "${it.value}," }
            "$formattedOthers,$lastThree"
        } else {
            strInt
        }

        val formattedDec = if (decPart < 10) "0$decPart" else decPart.toString()
        val prefix = if (amount < 0) "-₹" else "₹"
        return "$prefix$formattedInt.$formattedDec"
    }
}

