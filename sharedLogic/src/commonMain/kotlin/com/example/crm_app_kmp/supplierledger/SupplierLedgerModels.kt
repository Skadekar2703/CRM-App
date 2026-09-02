package com.example.crm_app_kmp.supplierledger

import kotlin.js.JsExport

@JsExport
data class SupplierLedgerEntry(
    val id: String,
    val supplierId: String,
    val supplierName: String,
    val date: String,                   // e.g. "29 Aug 2026"
    val transactionType: String,        // "Opening Balance", "Purchase", "Payment", "Return"
    val amount: Double,
    val reference: String = "",          // Invoice/Ref number
    val paymentMode: String = "Cash",    // Cash, UPI, Bank Transfer, Cheque
    val description: String = "",
    val runningBalance: Double = 0.0,
    val createdAt: String = "2026-08-29"
)

@JsExport
data class SupplierOverview(
    val supplierId: String,
    val supplierName: String,
    val opening: Double,
    val purchases: Double,
    val paid: Double,
    val returns: Double,
    val payable: Double                 // Opening + Purchases - Paid - Returns
)

@JsExport
data class SupplierLedgerHeaderSummary(
    val totalPayable: Double,
    val supplierCount: Int
)

@JsExport
object SupplierLedgerRepository {
    private val initialEntries = mutableListOf<SupplierLedgerEntry>()
    private val suppliersList = mutableListOf<Pair<String, String>>()

    fun getSuppliers(): List<Pair<String, String>> = suppliersList.toList()

    fun getAllEntries(): List<SupplierLedgerEntry> = initialEntries.toList()

    fun getSupplierLedger(supplierId: String): List<SupplierLedgerEntry> {
        return initialEntries.filter { it.supplierId == supplierId }
    }

    fun calculateSupplierOverview(): List<SupplierOverview> {
        return suppliersList.map { (supId, supName) ->
            val entries = initialEntries.filter { it.supplierId == supId }
            val opening = entries.filter { it.transactionType == "Opening Balance" }.sumOf { it.amount }
            val purchases = entries.filter { it.transactionType == "Purchase" }.sumOf { it.amount }
            val paid = entries.filter { it.transactionType == "Payment" }.sumOf { it.amount }
            val returns = entries.filter { it.transactionType == "Return" }.sumOf { it.amount }

            // Payable = Opening + Purchases - Paid - Returns
            val payable = (opening + purchases) - (paid + returns)

            SupplierOverview(
                supplierId = supId,
                supplierName = supName,
                opening = opening,
                purchases = purchases,
                paid = paid,
                returns = returns,
                payable = maxOf(0.0, payable)
            )
        }
    }

    fun getHeaderSummary(): SupplierLedgerHeaderSummary {
        val overviews = calculateSupplierOverview()
        val totalPayable = overviews.sumOf { it.payable }
        return SupplierLedgerHeaderSummary(
            totalPayable = totalPayable,
            supplierCount = overviews.size
        )
    }

    fun searchOverviews(query: String = ""): List<SupplierOverview> {
        val q = query.lowercase().trim()
        val all = calculateSupplierOverview()
        if (q.isEmpty()) return all
        return all.filter { it.supplierName.lowercase().contains(q) || it.supplierId.lowercase().contains(q) }
    }

    fun addLedgerEntry(
        supplierId: String,
        supplierName: String,
        date: String,
        transactionType: String,
        amount: Double,
        reference: String = "",
        paymentMode: String = "Cash",
        description: String = ""
    ): SupplierLedgerEntry {
        val nextId = "SLE-${100 + initialEntries.size + 1}"
        val newEntry = SupplierLedgerEntry(
            id = nextId,
            supplierId = supplierId,
            supplierName = supplierName,
            date = date,
            transactionType = transactionType,
            amount = amount,
            reference = reference,
            paymentMode = paymentMode,
            description = description,
            createdAt = "Just now"
        )
        initialEntries.add(0, newEntry)
        return newEntry
    }

    fun updateLedgerEntry(
        id: String,
        date: String,
        transactionType: String,
        amount: Double,
        reference: String,
        paymentMode: String,
        description: String
    ): SupplierLedgerEntry? {
        val idx = initialEntries.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val existing = initialEntries[idx]
            val updated = existing.copy(
                date = date,
                transactionType = transactionType,
                amount = amount,
                reference = reference,
                paymentMode = paymentMode,
                description = description
            )
            initialEntries[idx] = updated
            return updated
        }
        return null
    }

    fun deleteLedgerEntry(id: String): Boolean {
        return initialEntries.removeAll { it.id == id }
    }
}
