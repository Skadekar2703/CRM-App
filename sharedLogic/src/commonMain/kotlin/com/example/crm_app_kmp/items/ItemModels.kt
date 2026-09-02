package com.example.crm_app_kmp.items

import kotlin.js.JsExport

@JsExport
data class ItemModel(
    val id: String,
    val name: String,
    val brand: String,
    val code: String,
    val category: String,
    val unit: String,
    val stockQuantity: Int = 0,
    val lowStockAlert: Int = 5,
    val salePrice: Double,
    val status: String = "Active", // "Active", "Low Stock", "Draft", "Inactive"
    val createdDate: String = ""
)

@JsExport
object ItemRepository {
    private val initialItems = mutableListOf<ItemModel>()

    fun getItems(): List<ItemModel> = initialItems.toList()

    fun searchItems(
        query: String,
        categoryFilter: String = "All",
        statusFilter: String = "All"
    ): List<ItemModel> {
        val q = query.lowercase().trim()
        return initialItems.filter { item ->
            val matchesQuery = q.isEmpty() ||
                    item.id.lowercase().contains(q) ||
                    item.name.lowercase().contains(q) ||
                    item.brand.lowercase().contains(q) ||
                    item.code.lowercase().contains(q) ||
                    item.category.lowercase().contains(q)

            val matchesCategory = categoryFilter.equals("All", ignoreCase = true) ||
                    item.category.equals(categoryFilter, ignoreCase = true)

            val matchesStatus = statusFilter.equals("All", ignoreCase = true) ||
                    item.status.equals(statusFilter, ignoreCase = true)

            matchesQuery && matchesCategory && matchesStatus
        }
    }

    fun addItem(
        name: String,
        brand: String,
        code: String,
        category: String,
        unit: String,
        lowStockAlert: Int,
        salePrice: Double,
        status: String
    ): ItemModel {
        val nextId = (initialItems.size + 1).toString()
        val formattedCode = if (code.isBlank()) "ITM-" + nextId.padStart(3, '0') else code
        val newItem = ItemModel(
            id = nextId,
            name = name,
            brand = brand.ifBlank { "Generic" },
            code = formattedCode,
            category = category.ifBlank { "General" },
            unit = unit.ifBlank { "Pcs" },
            lowStockAlert = if (lowStockAlert < 0) 5 else lowStockAlert,
            salePrice = if (salePrice < 0) 0.0 else salePrice,
            status = status.ifBlank { "Active" },
            createdDate = "Just now"
        )
        initialItems.add(0, newItem)
        return newItem
    }

    fun updateItem(
        id: String,
        name: String,
        brand: String,
        code: String,
        category: String,
        unit: String,
        lowStockAlert: Int,
        salePrice: Double,
        status: String
    ): ItemModel? {
        val index = initialItems.indexOfFirst { it.id == id }
        if (index >= 0) {
            val existing = initialItems[index]
            val updated = existing.copy(
                name = name,
                brand = brand.ifBlank { existing.brand },
                code = code.ifBlank { existing.code },
                category = category.ifBlank { existing.category },
                unit = unit.ifBlank { existing.unit },
                lowStockAlert = lowStockAlert,
                salePrice = salePrice,
                status = status.ifBlank { existing.status }
            )
            initialItems[index] = updated
            return updated
        }
        return null
    }

    fun deleteItem(id: String): Boolean {
        return initialItems.removeAll { it.id == id }
    }
}
