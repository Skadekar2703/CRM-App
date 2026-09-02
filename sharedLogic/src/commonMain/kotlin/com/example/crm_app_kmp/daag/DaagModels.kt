package com.example.crm_app_kmp.daag

import kotlin.js.JsExport

@JsExport
data class StockMovementModel(
    val id: String,              // e.g. "TRX-98234"
    val date: String,            // e.g. "15 Aug 2026"
    val direction: String,       // "IN" or "OUT"
    val item: String,            // e.g. "Basmati Rice 25kg"
    val itemId: String = "",     // Foreign key reference to items.id
    val itemSku: String = "",    // Item SKU/Code
    val quantity: String,        // e.g. "2 bora", "+50", "-15", "5 peti"
    val amount: Double = 0.0,    // e.g. 0.0 or 1250.0
    val supplier: String = "—",  // e.g. "Sharma Wholesale"
    val transport: String = "—", // e.g. "VRL Logistics"
    val status: String = "Complete" // "Complete", "Pending", "In Transit", "Cancelled"
) {
    val amountFormatted: String get() = "₹${amount.toInt()}"
}

@JsExport
object DaagRepository {
    private val initialMovements = mutableListOf<StockMovementModel>()

    fun getMovements(): List<StockMovementModel> = initialMovements.toList()

    fun filterMovements(
        query: String = "",
        directionFilter: String = "All",
        statusFilter: String = "All"
    ): List<StockMovementModel> {
        val q = query.lowercase().trim()
        return initialMovements.filter { m ->
            val matchesQuery = q.isEmpty() ||
                    m.id.lowercase().contains(q) ||
                    m.item.lowercase().contains(q) ||
                    m.supplier.lowercase().contains(q) ||
                    m.transport.lowercase().contains(q)

            val matchesDirection = directionFilter.equals("All", ignoreCase = true) ||
                    (directionFilter.equals("Received", ignoreCase = true) && m.direction.equals("IN", ignoreCase = true)) ||
                    (directionFilter.equals("Dispatched", ignoreCase = true) && m.direction.equals("OUT", ignoreCase = true)) ||
                    m.direction.equals(directionFilter, ignoreCase = true)

            val matchesStatus = statusFilter.equals("All", ignoreCase = true) || m.status.equals(statusFilter, ignoreCase = true)

            matchesQuery && matchesDirection && matchesStatus
        }
    }

    fun addMovement(
        direction: String,
        item: String,
        quantity: String,
        amount: Double,
        supplier: String,
        transport: String,
        status: String,
        date: String
    ): StockMovementModel {
        val nextId = "TRX-${98234 + initialMovements.size}"
        val newM = StockMovementModel(
            id = nextId,
            date = date.ifBlank { "Today" },
            direction = direction.ifBlank { "IN" },
            item = item.ifBlank { "Item" },
            quantity = quantity.ifBlank { "1 qty" },
            amount = amount,
            supplier = supplier.ifBlank { "—" },
            transport = transport.ifBlank { "—" },
            status = status.ifBlank { "Pending" }
        )
        initialMovements.add(0, newM)
        return newM
    }

    fun updateMovement(
        id: String,
        direction: String,
        item: String,
        quantity: String,
        amount: Double,
        supplier: String,
        transport: String,
        status: String,
        date: String
    ): StockMovementModel? {
        val idx = initialMovements.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val updated = initialMovements[idx].copy(
                direction = direction,
                item = item,
                quantity = quantity,
                amount = amount,
                supplier = supplier,
                transport = transport,
                status = status,
                date = date
            )
            initialMovements[idx] = updated
            return updated
        }
        return null
    }

    fun deleteMovement(id: String): Boolean {
        return initialMovements.removeAll { it.id == id }
    }
}
