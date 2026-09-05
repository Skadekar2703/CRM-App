package com.example.crm_app_kmp.customers

import kotlin.js.JsExport

@JsExport
data class CustomerTxn(
    val id: String,
    val date: String,
    val type: String, // "Baki", "Jama", "Invoice"
    val amount: Double,
    val notes: String,
    val runningBalance: Double = 0.0
) {
    val amountFormatted: String get() = "₹${amount.toInt()}"
    val runningBalanceFormatted: String get() = "₹${runningBalance.toInt()}"
}

@JsExport
data class CustomerDetailsModel(
    val id: String,                  // UUID
    val customerId: String,          // 6-digit numeric ID e.g. "100001"
    val customerCode: String,        // Format: Cd + 12 digits e.g. "Cd123456789012"
    val name: String,                // Full Name
    val mobile: String,              // 10 digits
    val alternateMobile: String = "",// Alternate Mobile
    val email: String = "",          // Email
    val idCncNo: String = "",        // ID / CNC Number
    val photoUrl: String? = null,    // Storage URL / Reference
    val cibilStatus: String = "Good",// "Good", "Medium", "Low", "Bad"
    val cibilScore: Int = 750,       // CIBIL Numeric Score
    val category: String = "Customer",// "Retailer", "Customer", "Wholesaler"
    val categoryId: String? = null,  // FK to public.categories.id
    val creditLimit: Double = 50000.0,// Credit Limit (max allowable Baki)
    val openingBalance: Double = 0.0,// Account Opening Balance
    val taxNo: String = "",          // Tax Number
    val udharWapisiDin: Int = 30,    // Credit Return Days
    val address: String = "",        // Full Address
    val area: String = "Local Market",// Area name
    val areaId: String? = null,      // FK to public.areas.id
    val remark: String = "",         // Remark / Description
    val guarantorName: String = "",  // Guarantor Name
    val guarantorMobile: String = "",// Guarantor Mobile
    val baki: Double = 0.0,          // Baki / Debit balance
    val jama: Double = 0.0,          // Jama / Credit balance
    val lastTxnDate: String = "Recent",// Last transaction date
    val status: String = "Active",   // "Active" / "Inactive"
    val creditBlocked: Boolean = false, // Credit Blocked flag
    val transactions: List<CustomerTxn> = emptyList()
) {
    val outstanding: Double get() = baki - jama
    val outstandingFormatted: String get() = "₹${outstanding.toInt()}"
    val bakiFormatted: String get() = "₹${baki.toInt()}"
    val jamaFormatted: String get() = "₹${jama.toInt()}"
    val isRiskOrBad: Boolean get() = cibilStatus.equals("Bad", ignoreCase = true) || cibilStatus.equals("Low", ignoreCase = true)

    val cibilDotColor: String get() = when (cibilStatus.lowercase()) {
        "bad" -> "#EF4444"      // Red
        "low" -> "#F97316"      // Orange
        "medium", "average" -> "#EAB308" // Yellow
        else -> "#22C55E"       // Green
    }
}

@JsExport
object CustomerValidator {
    fun validateCategory(category: String?): String? {
        if (category.isNullOrBlank() || category.trim().equals("Select Category", ignoreCase = true)) {
            return "Please select a customer category."
        }
        return null
    }

    fun validateName(name: String): String? {
        val trimmed = name.trim()
        if (trimmed.isBlank()) return "Customer name is required."
        return null
    }

    fun validateMobile(mobile: String): String? {
        val trimmed = mobile.trim()
        if (trimmed.isBlank()) return "Mobile number is required."
        if (!trimmed.matches(Regex("^[0-9]{10}$"))) return "Mobile number must be exactly 10 numeric digits."
        return null
    }

    fun validateCustomerCode(code: String): String? {
        val trimmed = code.trim()
        if (trimmed.isBlank()) return "CD Code is required."
        return null
    }

    fun validateGuarantorMobile(mobile: String): String? {
        val trimmed = mobile.trim()
        if (trimmed.isNotEmpty() && !trimmed.matches(Regex("^[0-9]{10}$"))) {
            return "Guarantor mobile number must be exactly 10 numeric digits."
        }
        return null
    }

    fun validateCreditLimit(creditLimit: Double): String? {
        if (creditLimit < 0) return "Credit Limit cannot be negative."
        return null
    }

    fun validateBakiTransaction(
        currentOutstanding: Double,
        newBakiAmount: Double,
        creditLimit: Double,
        isCreditBlocked: Boolean
    ): String? {
        if (isCreditBlocked) {
            return "Credit is blocked for this customer."
        }
        val projectedOutstanding = currentOutstanding + newBakiAmount
        if (projectedOutstanding > creditLimit) {
            return "Udhar exceeds the customer's credit limit."
        }
        return null
    }

    fun cleanNull(value: String?, fallback: String = ""): String {
        if (value == null) return fallback
        val trimmed = value.trim()
        if (trimmed.equals("null", ignoreCase = true)) return fallback
        return trimmed
    }
}

