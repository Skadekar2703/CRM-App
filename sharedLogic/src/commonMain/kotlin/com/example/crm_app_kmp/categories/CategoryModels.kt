package com.example.crm_app_kmp.categories

import kotlin.js.JsExport

@JsExport
data class CategoryModel(
    val id: String,
    val name: String,
    val type: String = "Customer Category", // Defaults to Customer Category
    val status: String = "Active", // "Active" or "Inactive"
    val createdDate: String = "Recent",
    val usageCount: Int = 0,
    val subText: String? = null
)

@JsExport
object CategoryRepository {
    private val initialCategories = mutableListOf<CategoryModel>()

    fun getCategories(): List<CategoryModel> = initialCategories.toList()

    fun filterCategories(
        query: String,
        typeFilter: String = "All",
        statusFilter: String = "All"
    ): List<CategoryModel> {
        val q = query.lowercase().trim()
        return initialCategories.filter { cat ->
            val matchesQuery = q.isEmpty() ||
                    cat.id.lowercase().contains(q) ||
                    cat.name.lowercase().contains(q) ||
                    cat.status.lowercase().contains(q) ||
                    (cat.subText != null && cat.subText.lowercase().contains(q))

            val matchesStatus = when (statusFilter.lowercase()) {
                "all" -> true
                "active" -> cat.status.equals("Active", ignoreCase = true)
                "inactive", "archived" -> cat.status.equals("Inactive", ignoreCase = true) || cat.status.equals("Archived", ignoreCase = true)
                else -> cat.status.equals(statusFilter, ignoreCase = true)
            }

            matchesQuery && matchesStatus
        }
    }

    fun addCategory(
        name: String,
        type: String = "Customer Category",
        status: String = "Active",
        subText: String? = null
    ): CategoryModel {
        val nextNum = initialCategories.size + 1
        val formattedId = "#CAT-" + nextNum.toString().padStart(3, '0')
        val formattedStatus = if (status.lowercase().contains("inactive") || status.lowercase().contains("archived")) "Inactive" else "Active"

        val newCategory = CategoryModel(
            id = formattedId,
            name = name,
            type = "Customer Category",
            status = formattedStatus,
            createdDate = "Just now",
            usageCount = 0,
            subText = subText
        )
        initialCategories.add(0, newCategory)
        return newCategory
    }

    fun updateCategory(
        id: String,
        name: String,
        type: String,
        status: String,
        subText: String? = null
    ): CategoryModel? {
        val index = initialCategories.indexOfFirst { it.id == id }
        if (index >= 0) {
            val existing = initialCategories[index]
            val formattedType = if (type.lowercase().contains("item")) "Item Category" else "Customer Category"
            val formattedStatus = if (status.lowercase().contains("inactive") || status.lowercase().contains("archived")) "Inactive" else "Active"

            val updated = existing.copy(
                name = name,
                type = formattedType,
                status = formattedStatus,
                subText = subText ?: existing.subText
            )
            initialCategories[index] = updated
            return updated
        }
        return null
    }

    fun deleteCategory(id: String): Boolean {
        return initialCategories.removeAll { it.id == id }
    }
}
