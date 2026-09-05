package com.example.crm_app_kmp.employees

import kotlin.js.JsExport

@JsExport
data class EmployeeModel(
    val id: String,
    val uid: String = "EMP-001",
    val name: String,
    val role: String = "Staff",
    val mobile: String = "",
    val email: String = "",
    val address: String = "",
    val bankName: String = "",
    val bankAccount: String = "",
    val idNumber: String = "",
    val emergencyContact: String = "",
    val joinedOn: String = "05 Sep 2026",
    val leftOn: String = "",
    val photoUrl: String = "",
    val remark: String = "",
    val activeDays: Int = 0,
    val salary: Double = 0.0,
    val salaryType: String = "Monthly", // "Monthly" or "Per Day"
    val udhaarBalance: Double = 0.0,
    val ctcYtd: Double = 0.0,
    val status: String = "Active"
) {
    val udhaarBalanceFormatted: String get() = "₹${udhaarBalance.toInt()}"
}

@JsExport
data class EmployeeTransactionModel(
    val id: String,
    val employeeId: String,
    val employeeUid: String = "",
    val type: String, // 'Gift', 'Bonus', 'Extra Payment', 'Employee Udhaar', 'Labour Expense', 'Udhaar Repayment'
    val amount: Double,
    val date: String,
    val note: String = ""
)

@JsExport
object EmployeeRepository {
    private val initialEmployees = mutableListOf<EmployeeModel>()
    private val initialTransactions = mutableListOf<EmployeeTransactionModel>()

    fun getEmployees(): List<EmployeeModel> = initialEmployees.toList()
    fun getTransactions(): List<EmployeeTransactionModel> = initialTransactions.toList()

    fun getTotalStaffCount(): Int = initialEmployees.size
    fun getActiveStaffCount(): Int = initialEmployees.count { it.status.equals("Active", ignoreCase = true) }
    fun getTotalOutstandingUdhaar(): Double = initialEmployees.sumOf { it.udhaarBalance }
    fun getTotalUdhaar(): Double = initialEmployees.sumOf { it.udhaarBalance }
    fun getTotalLabourExpense(): Double = initialTransactions.filter { 
        it.type.equals("Labour Expense", ignoreCase = true) || it.type.equals("Bonus", ignoreCase = true) || it.type.equals("Extra Payment", ignoreCase = true) || it.type.equals("Gift", ignoreCase = true)
    }.sumOf { it.amount }

    fun filterEmployees(query: String = "", statusFilter: String = "All"): List<EmployeeModel> {
        val q = query.lowercase().trim()
        return initialEmployees.filter { e ->
            val matchesQ = q.isEmpty() ||
                    e.id.lowercase().contains(q) ||
                    e.uid.lowercase().contains(q) ||
                    e.name.lowercase().contains(q) ||
                    e.role.lowercase().contains(q) ||
                    e.mobile.lowercase().contains(q)
            val matchesStatus = statusFilter.equals("All", ignoreCase = true) || e.status.equals(statusFilter, ignoreCase = true)
            matchesQ && matchesStatus
        }
    }
}
