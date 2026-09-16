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
    val udhaari: Double,
    val jama: Double,
    val salaries: Double,
    val netProfit: Double,
    val revenue: Double,
    val purchases: Double,
    val expenses: Double,
    val expensesPlusSalaries: Double,
    val isLoss: Boolean,
    val statementItems: List<PLStatementItem>,
    val breakdown: CostProfitBreakdownData
)

@JsExport
object ProfitLossCalculator {
    fun calculate(
        fromDate: String,
        toDate: String,
        revenue: Double = 0.0,
        purchases: Double = 0.0,
        expenses: Double = 0.0,
        salaries: Double = 0.0,
        udhaari: Double = 0.0,
        jama: Double = 0.0
    ): ProfitLossReport {
        val totalExpensesAndSalaries = expenses + salaries
        val netProfit = revenue - purchases - expenses - salaries
        val isLoss = netProfit < 0

        val statementItems = listOf(
            PLStatementItem(label = "+ Revenue (Sales)", amount = revenue, type = "INCOME"),
            PLStatementItem(label = "− Purchases / Cost", amount = purchases, type = "COST"),
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
            udhaari = udhaari,
            jama = jama,
            salaries = salaries,
            netProfit = netProfit,
            revenue = revenue,
            purchases = purchases,
            expenses = expenses,
            expensesPlusSalaries = totalExpensesAndSalaries,
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

@JsExport
data class EmployeeSalaryRecord(
    val salary: Double,
    val salaryType: String, // "Monthly" or "Per Day"
    val joinedOn: String,   // "YYYY-MM-DD"
    val leftOn: String? = null,
    val status: String = "Active"
)

@JsExport
object SalaryCostCalculator {
    fun calculateAttributableSalary(
        fromDate: String,
        toDate: String,
        employees: List<EmployeeSalaryRecord>
    ): Double {
        var total = 0.0
        val fDate = fromDate.take(10)
        val tDate = toDate.take(10)

        for (emp in employees) {
            if (emp.status.equals("Inactive", ignoreCase = true) && emp.leftOn.isNullOrBlank()) {
                continue
            }
            val empJoined = if (emp.joinedOn.isNotBlank()) emp.joinedOn.take(10) else fDate
            val empLeft = if (!emp.leftOn.isNullOrBlank()) emp.leftOn.take(10) else null

            // Overlap interval [overlapStart, overlapEnd]
            val overlapStart = if (empJoined > fDate) empJoined else fDate
            val overlapEnd = if (empLeft != null && empLeft < tDate) empLeft else tDate

            if (overlapStart <= overlapEnd) {
                val days = daysBetween(overlapStart, overlapEnd) + 1
                if (days > 0) {
                    val salary = emp.salary
                    val isMonthly = emp.salaryType.equals("Monthly", ignoreCase = true) || emp.salaryType.isBlank()
                    val cost = if (isMonthly) {
                        (salary / 30.0) * days
                    } else {
                        salary * days
                    }
                    total += cost
                }
            }
        }
        return total
    }

    fun daysBetween(startISO: String, endISO: String): Int {
        try {
            val sParts = startISO.take(10).split("-")
            val eParts = endISO.take(10).split("-")
            if (sParts.size == 3 && eParts.size == 3) {
                val sY = sParts[0].toInt()
                val sM = sParts[1].toInt()
                val sD = sParts[2].toInt()
                val eY = eParts[0].toInt()
                val eM = eParts[1].toInt()
                val eD = eParts[2].toInt()
                return epochDay(eY, eM, eD) - epochDay(sY, sM, sD)
            }
        } catch (_: Exception) {}
        return 0
    }

    private fun epochDay(year: Int, month: Int, day: Int): Int {
        var y = year
        var m = month
        if (m <= 2) {
            y -= 1
            m += 12
        }
        val era = y / 400
        val yoe = y - era * 400
        val doy = (153 * (m - 3) + 2) / 5 + day - 1
        val doe = yoe * 365 + yoe / 4 - yoe / 100 + doy
        return era * 146097 + doe - 719468
    }
}

