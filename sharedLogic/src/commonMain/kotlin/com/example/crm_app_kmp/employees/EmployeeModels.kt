package com.example.crm_app_kmp.employees

import kotlin.js.JsExport

@JsExport
data class EmployeeModel(
    val id: String,              // e.g. "EMP-001"
    val name: String,            // e.g. "Ramesh Kumar"
    val role: String,            // e.g. "Senior Sales Exec"
    val mobile: String,          // e.g. "+91 98765 43210"
    val email: String = "",      // e.g. "ramesh@crm.com"
    val udhaarBalance: Double = 0.0, // e.g. 12500.0
    val status: String = "Active"// "Active" or "Inactive"
) {
    val udhaarBalanceFormatted: String get() = "₹${udhaarBalance.toInt()}"
}

@JsExport
object EmployeeRepository {
    private val initialEmployees = mutableListOf<EmployeeModel>()

    fun getEmployees(): List<EmployeeModel> = initialEmployees.toList()

    fun getTotalStaffCount(): Int = initialEmployees.size

    fun getTotalOutstanding(): Double = initialEmployees.sumOf { it.udhaarBalance }

    fun filterEmployees(query: String = ""): List<EmployeeModel> {
        val q = query.lowercase().trim()
        if (q.isEmpty()) return initialEmployees.toList()
        return initialEmployees.filter { e ->
            e.id.lowercase().contains(q) ||
                    e.name.lowercase().contains(q) ||
                    e.role.lowercase().contains(q) ||
                    e.mobile.lowercase().contains(q)
        }
    }

    fun addEmployee(
        name: String,
        role: String,
        mobile: String,
        email: String,
        udhaarBalance: Double
    ): EmployeeModel {
        val nextId = "EMP-00${initialEmployees.size + 1}"
        val newE = EmployeeModel(
            id = nextId,
            name = name,
            role = role.ifBlank { "Staff" },
            mobile = mobile,
            email = email,
            udhaarBalance = if (udhaarBalance < 0) 0.0 else udhaarBalance,
            status = "Active"
        )
        initialEmployees.add(0, newE)
        return newE
    }

    fun updateEmployee(
        id: String,
        name: String,
        role: String,
        mobile: String,
        email: String,
        udhaarBalance: Double
    ): EmployeeModel? {
        val idx = initialEmployees.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val existing = initialEmployees[idx]
            val updated = existing.copy(
                name = name,
                role = role,
                mobile = mobile,
                email = email,
                udhaarBalance = udhaarBalance
            )
            initialEmployees[idx] = updated
            return updated
        }
        return null
    }

    fun deleteEmployee(id: String): Boolean {
        return initialEmployees.removeAll { it.id == id }
    }
}
