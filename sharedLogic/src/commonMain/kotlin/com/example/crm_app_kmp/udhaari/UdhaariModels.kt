package com.example.crm_app_kmp.udhaari

import kotlin.js.JsExport
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.round

@JsExport
data class UdhaariCustomerModel(
    val uid: String,
    val name: String,
    val mobile: String,
    val area: String,
    val category: String,
    val cibilStatus: String, // "Good", "Average", "Bad"
    val baki: Double = 0.0,
    val jama: Double = 0.0,
    val outstanding: Double = baki - jama,
    val balance: Double = outstanding,
    val balanceType: String = if (outstanding < 0) "Jama" else "Baki",
    val creditLimit: Double = 100000.0,
    val lastTxnDate: String = "Recent",
    val status: String = "Active", // "Active" or "Inactive"
    val photoUrl: String? = null
)

@JsExport
data class UdhaariTransactionModel(
    val id: String,
    val customerUid: String,
    val type: String, // "Baki" or "Jama"
    val amount: Double,
    val date: String,
    val notes: String
)

@JsExport
object UdhaariCurrencyFormatter {
    fun formatIndianCurrency(amount: Double): String {
        val isNegative = amount < 0
        val absAmount = if (isNegative) -amount else amount
        val rawString = floor(absAmount).toLong().toString()
        val dec = (round((absAmount - floor(absAmount)) * 100)).toInt()
        val decStr = if (dec < 10) "0$dec" else "$dec"

        val formattedInt = if (rawString.length <= 3) {
            rawString
        } else {
            val lastThree = rawString.takeLast(3)
            val remaining = rawString.dropLast(3)
            val sb = StringBuilder()
            var i = remaining.length
            while (i > 0) {
                val start = max(0, i - 2)
                if (sb.isNotEmpty()) sb.insert(0, ",")
                sb.insert(0, remaining.substring(start, i))
                i -= 2
            }
            "$sb,$lastThree"
        }

        val prefix = if (isNegative) "-₹" else "₹"
        return "$prefix$formattedInt.$decStr"
    }
}

@JsExport
object UdhaariRepository {
    private val initialCustomers = mutableListOf<UdhaariCustomerModel>()
    private val initialTransactions = mutableListOf<UdhaariTransactionModel>()

    fun getCustomers(): List<UdhaariCustomerModel> = initialCustomers.toList()

    fun filterCustomers(
        query: String = "",
        areaFilter: String = "All",
        categoryFilter: String = "All",
        cibilFilter: String = "All",
        statusFilter: String = "All"
    ): List<UdhaariCustomerModel> {
        val q = query.lowercase().trim()
        return initialCustomers.filter { c ->
            val matchesQuery = q.isEmpty() ||
                    c.uid.lowercase().contains(q) ||
                    c.name.lowercase().contains(q) ||
                    c.mobile.lowercase().contains(q) ||
                    c.area.lowercase().contains(q)

            val matchesArea = areaFilter.equals("All", ignoreCase = true) || c.area.equals(areaFilter, ignoreCase = true)
            val matchesCat = categoryFilter.equals("All", ignoreCase = true) || c.category.equals(categoryFilter, ignoreCase = true)
            val matchesCibil = cibilFilter.equals("All", ignoreCase = true) || c.cibilStatus.equals(cibilFilter, ignoreCase = true)
            val matchesStatus = statusFilter.equals("All", ignoreCase = true) || c.status.equals(statusFilter, ignoreCase = true)

            matchesQuery && matchesArea && matchesCat && matchesCibil && matchesStatus
        }
    }

    fun calculateTotalBaki(customers: List<UdhaariCustomerModel>): Double {
        return customers
            .filter { it.status.equals("Active", ignoreCase = true) }
            .sumOf { it.baki }
    }

    fun calculateTotalJama(customers: List<UdhaariCustomerModel>): Double {
        return customers
            .filter { it.status.equals("Active", ignoreCase = true) }
            .sumOf { it.jama }
    }

    fun calculateTotalOutstanding(totalBaki: Double, totalJama: Double): Double {
        return totalBaki - totalJama
    }

    fun getTotalBaki(): Double = calculateTotalBaki(initialCustomers)

    fun getTotalJama(): Double = calculateTotalJama(initialCustomers)

    fun getTotalOutstanding(): Double = calculateTotalOutstanding(getTotalBaki(), getTotalJama())

    fun getActiveCustomerCount(): Int {
        return initialCustomers.count { it.status.equals("Active", ignoreCase = true) }
    }

    fun addCustomer(
        name: String,
        mobile: String,
        area: String,
        category: String,
        cibilStatus: String,
        initialBaki: Double,
        initialJama: Double,
        creditLimit: Double
    ): UdhaariCustomerModel {
        val nextUid = (100029 + initialCustomers.size).toString()
        val newC = UdhaariCustomerModel(
            uid = nextUid,
            name = name,
            mobile = mobile,
            area = area.ifBlank { "General Area" },
            category = category.ifBlank { "Regular" },
            cibilStatus = cibilStatus.ifBlank { "Good" },
            baki = if (initialBaki < 0) 0.0 else initialBaki,
            jama = if (initialJama < 0) 0.0 else initialJama,
            creditLimit = if (creditLimit < 0) 0.0 else creditLimit,
            lastTxnDate = "Just now",
            status = "Active"
        )
        initialCustomers.add(0, newC)
        return newC
    }

    fun updateCustomer(
        uid: String,
        name: String,
        mobile: String,
        area: String,
        category: String,
        cibilStatus: String,
        creditLimit: Double,
        status: String
    ): UdhaariCustomerModel? {
        val idx = initialCustomers.indexOfFirst { it.uid == uid }
        if (idx >= 0) {
            val existing = initialCustomers[idx]
            val updated = existing.copy(
                name = name,
                mobile = mobile,
                area = area,
                category = category,
                cibilStatus = cibilStatus,
                creditLimit = creditLimit,
                status = status
            )
            initialCustomers[idx] = updated
            return updated
        }
        return null
    }

    fun deleteCustomer(uid: String): Boolean {
        return initialCustomers.removeAll { it.uid == uid }
    }

    fun addTransaction(
        customerUid: String,
        type: String, // "Baki" or "Jama"
        amount: Double,
        notes: String
    ): Boolean {
        val idx = initialCustomers.indexOfFirst { it.uid == customerUid }
        if (idx >= 0 && amount > 0) {
            val customer = initialCustomers[idx]
            var newBaki = customer.baki
            var newJama = customer.jama

            if (type.equals("Baki", ignoreCase = true)) {
                newBaki += amount
            } else {
                newBaki -= amount
                newJama += amount
            }

            val updated = customer.copy(
                baki = newBaki,
                jama = newJama,
                lastTxnDate = "Just now"
            )
            initialCustomers[idx] = updated

            initialTransactions.add(
                0,
                UdhaariTransactionModel(
                    id = "TX${100 + initialTransactions.size + 1}",
                    customerUid = customerUid,
                    type = type,
                    amount = amount,
                    date = "Just now",
                    notes = notes
                )
            )
            return true
        }
        return false
    }
}
