package com.example.crm_app_kmp.areas

import kotlin.js.JsExport

@JsExport
data class AreaModel(
    val id: String,
    val name: String,
    val status: String,
    val createdDate: String,
    val locationCount: Int
)

@JsExport
object AreaRepository {
    private val initialAreas = mutableListOf<AreaModel>()

    fun getAreas(): List<AreaModel> = initialAreas.toList()

    fun filterAreas(query: String, statusFilter: String = "All"): List<AreaModel> {
        val q = query.lowercase().trim()
        return initialAreas.filter { area ->
            val matchesQuery = q.isEmpty() ||
                    area.id.lowercase().contains(q) ||
                    area.name.lowercase().contains(q) ||
                    area.status.lowercase().contains(q)

            val matchesStatus = statusFilter.equals("All", ignoreCase = true) ||
                    area.status.equals(statusFilter, ignoreCase = true)

            matchesQuery && matchesStatus
        }
    }

    fun addArea(name: String, status: String): AreaModel {
        val nextId = "#" + (1040 + initialAreas.size + 8)
        val newArea = AreaModel(nextId, name, status, "Just now", 0)
        initialAreas.add(0, newArea)
        return newArea
    }

    fun updateArea(id: String, name: String, status: String): AreaModel? {
        val index = initialAreas.indexOfFirst { it.id == id }
        if (index >= 0) {
            val updated = initialAreas[index].copy(name = name, status = status)
            initialAreas[index] = updated
            return updated
        }
        return null
    }

    fun deleteArea(id: String): Boolean {
        return initialAreas.removeAll { it.id == id }
    }
}
