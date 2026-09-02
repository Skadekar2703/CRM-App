package com.example.crm_app_kmp.customers

import kotlin.js.JsExport

@JsExport
data class CustomerTxn(
    val id: String,
    val date: String,
    val type: String, // "Baki", "Jama", "Invoice"
    val amount: Double,
    val notes: String
) {
    val amountFormatted: String get() = "₹${amount.toInt()}"
}

@JsExport
data class CustomerDetailsModel(
    val id: String,              // e.g. "CUS-32"
    val name: String,            // e.g. "Lokesh"
    val area: String,            // e.g. "Jeeva Nagar, Madurai"
    val mobile: String,          // e.g. "9087563412"
    val category: String,        // e.g. "Regular", "VIP", "Wholesale"
    val cibilScore: Int,         // e.g. 850
    val cibilStatus: String,     // e.g. "Normal", "Good", "Warning", "Bad"
    val creditLimit: Double,     // e.g. 100000.0 (Dis. Amount / Limit)
    val currentBalance: Double,  // e.g. 85000.0
    val balanceType: String,     // "Baki" or "Jama"
    val status: String,          // "Active", "Inactive"
    val transactions: List<CustomerTxn> = emptyList(),
    val baakiAmount: Double = if (balanceType.equals("Baki", ignoreCase = true)) currentBalance else 0.0,
    val jamaAmount: Double = if (balanceType.equals("Jama", ignoreCase = true)) currentBalance else 0.0
) {
    val creditLimitFormatted: String get() = "₹${creditLimit.toInt()}"
    val currentBalanceFormatted: String get() = "₹${currentBalance.toInt()}"
    val baakiFormatted: String get() = "₹${baakiAmount.toInt()}"
    val jamaFormatted: String get() = "₹${jamaAmount.toInt()}"
    val isBadOrOverdue: Boolean get() = cibilStatus.equals("Bad", ignoreCase = true) || cibilStatus.equals("Warning", ignoreCase = true) || cibilScore < 650
}

@JsExport
object CustomerRepository {
    private val initialCustomers = mutableListOf<CustomerDetailsModel>()

    fun getCustomers(): List<CustomerDetailsModel> = initialCustomers.toList()

    fun getTotalCustomers(): Int = initialCustomers.size

    fun getActiveCustomers(): Int = initialCustomers.count { it.status.equals("Active", ignoreCase = true) }

    fun getTotalBaki(): Double = initialCustomers
        .filter { it.balanceType.equals("Baki", ignoreCase = true) && it.status.equals("Active", ignoreCase = true) }
        .sumOf { it.currentBalance }

    fun filterCustomers(
        query: String = "",
        areaFilter: String = "All",
        categoryFilter: String = "All",
        cibilFilter: String = "All",
        statusFilter: String = "All"
    ): List<CustomerDetailsModel> {
        val q = query.lowercase().trim()
        return initialCustomers.filter { c ->
            val matchesQuery = q.isEmpty() ||
                    c.id.lowercase().contains(q) ||
                    c.name.lowercase().contains(q) ||
                    c.mobile.lowercase().contains(q) ||
                    c.area.lowercase().contains(q)

            val matchesArea = areaFilter.equals("All", ignoreCase = true) || c.area.equals(areaFilter, ignoreCase = true)
            val matchesCat = categoryFilter.equals("All", ignoreCase = true) || c.category.equals(categoryFilter, ignoreCase = true)

            val matchesCibil = when {
                cibilFilter.equals("All", ignoreCase = true) -> true
                cibilFilter.equals("Good", ignoreCase = true) || cibilFilter.contains("Good", ignoreCase = true) -> c.cibilScore >= 750
                cibilFilter.equals("Average", ignoreCase = true) || cibilFilter.contains("Average", ignoreCase = true) -> c.cibilScore in 650..749
                cibilFilter.equals("Warning", ignoreCase = true) || cibilFilter.contains("Risk", ignoreCase = true) || cibilFilter.contains("Bad", ignoreCase = true) -> c.cibilScore < 650
                else -> c.cibilStatus.equals(cibilFilter, ignoreCase = true)
            }

            val matchesStatus = when {
                statusFilter.equals("All", ignoreCase = true) -> true
                statusFilter.equals("Active", ignoreCase = true) -> c.status.equals("Active", ignoreCase = true)
                statusFilter.equals("Inactive", ignoreCase = true) -> c.status.equals("Inactive", ignoreCase = true)
                statusFilter.equals("Warning", ignoreCase = true) || statusFilter.equals("Bad", ignoreCase = true) -> c.isBadOrOverdue
                else -> c.status.equals(statusFilter, ignoreCase = true)
            }

            matchesQuery && matchesArea && matchesCat && matchesCibil && matchesStatus
        }
    }

    fun addCustomer(
        name: String,
        mobile: String,
        area: String,
        category: String,
        cibilScore: Int,
        cibilStatus: String,
        creditLimit: Double,
        initialBalance: Double,
        balanceType: String
    ): CustomerDetailsModel {
        val nextId = "CUS-${35 + initialCustomers.size}"
        val newC = CustomerDetailsModel(
            id = nextId,
            name = name,
            area = area.ifBlank { "General Area" },
            mobile = mobile,
            category = category.ifBlank { "Regular" },
            cibilScore = if (cibilScore <= 0) 750 else cibilScore,
            cibilStatus = cibilStatus.ifBlank { if (cibilScore < 650) "Bad" else "Normal" },
            creditLimit = creditLimit,
            currentBalance = initialBalance,
            balanceType = balanceType.ifBlank { "Baki" },
            status = "Active",
            transactions = if (initialBalance > 0) listOf(
                CustomerTxn("TX-${600 + initialCustomers.size}", "Today", balanceType, initialBalance, "Initial Balance")
            ) else emptyList()
        )
        initialCustomers.add(0, newC)
        return newC
    }

    fun updateCustomer(
        id: String,
        name: String,
        mobile: String,
        area: String,
        category: String,
        cibilScore: Int,
        cibilStatus: String,
        creditLimit: Double,
        status: String
    ): CustomerDetailsModel? {
        val idx = initialCustomers.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val existing = initialCustomers[idx]
            val updated = existing.copy(
                name = name,
                mobile = mobile,
                area = area,
                category = category,
                cibilScore = cibilScore,
                cibilStatus = cibilStatus,
                creditLimit = creditLimit,
                status = status
            )
            initialCustomers[idx] = updated
            return updated
        }
        return null
    }

    fun deleteCustomer(id: String): Boolean {
        return initialCustomers.removeAll { it.id == id }
    }

    fun addTransaction(
        customerId: String,
        type: String, // "Baki" or "Jama"
        amount: Double,
        notes: String
    ): Boolean {
        val idx = initialCustomers.indexOfFirst { it.id == customerId }
        if (idx >= 0 && amount > 0) {
            val customer = initialCustomers[idx]
            var currentBal = customer.currentBalance
            var currentType = customer.balanceType

            if (type.equals("Baki", ignoreCase = true)) {
                if (currentType.equals("Baki", ignoreCase = true)) {
                    currentBal += amount
                } else {
                    if (amount >= currentBal) {
                        currentBal = amount - currentBal
                        currentType = "Baki"
                    } else {
                        currentBal -= amount
                    }
                }
            } else {
                // Jama (Payment Received)
                if (currentType.equals("Baki", ignoreCase = true)) {
                    if (amount >= currentBal) {
                        currentBal = amount - currentBal
                        currentType = "Jama"
                    } else {
                        currentBal -= amount
                    }
                } else {
                    currentBal += amount
                }
            }

            val newTx = CustomerTxn(
                id = "TX-${700 + customer.transactions.size + 1}",
                date = "Today",
                type = type,
                amount = amount,
                notes = notes.ifBlank { if (type == "Jama") "Payment Received" else "Credit Added" }
            )

            val updated = customer.copy(
                currentBalance = currentBal,
                balanceType = currentType,
                transactions = listOf(newTx) + customer.transactions
            )
            initialCustomers[idx] = updated
            return true
        }
        return false
    }
}
