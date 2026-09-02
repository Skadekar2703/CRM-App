package com.example.crm_app_kmp.suppliers

import kotlin.js.JsExport

@JsExport
data class SupplierModel(
    val id: String,              // e.g. "SUP-001"
    val partyName: String,       // e.g. "Acme Global Supplies"
    val contactPerson: String,   // e.g. "Jane Doe"
    val mobile: String,          // e.g. "+1 (555) 123-4567"
    val email: String = "",      // e.g. "jane@acmeglobal.com"
    val address: String = "",    // e.g. "Industrial Area, Phase 2"
    val status: String = "Active"// "Active" or "Inactive"
)

@JsExport
object SupplierRepository {
    private val initialSuppliers = mutableListOf<SupplierModel>()

    fun getSuppliers(): List<SupplierModel> = initialSuppliers.toList()

    fun filterSuppliers(
        query: String = "",
        statusFilter: String = "All"
    ): List<SupplierModel> {
        val q = query.lowercase().trim()
        return initialSuppliers.filter { s ->
            val matchesQuery = q.isEmpty() ||
                    s.id.lowercase().contains(q) ||
                    s.partyName.lowercase().contains(q) ||
                    s.contactPerson.lowercase().contains(q) ||
                    s.mobile.lowercase().contains(q) ||
                    s.address.lowercase().contains(q)

            val matchesStatus = statusFilter.equals("All", ignoreCase = true) || s.status.equals(statusFilter, ignoreCase = true)

            matchesQuery && matchesStatus
        }
    }

    fun addSupplier(
        partyName: String,
        contactPerson: String,
        mobile: String,
        email: String,
        address: String,
        status: String
    ): SupplierModel {
        val nextId = "SUP-00${initialSuppliers.size + 1}"
        val newS = SupplierModel(
            id = nextId,
            partyName = partyName,
            contactPerson = contactPerson.ifBlank { "Contact Person" },
            mobile = mobile,
            email = email,
            address = address,
            status = status.ifBlank { "Active" }
        )
        initialSuppliers.add(0, newS)
        return newS
    }

    fun updateSupplier(
        id: String,
        partyName: String,
        contactPerson: String,
        mobile: String,
        email: String,
        address: String,
        status: String
    ): SupplierModel? {
        val idx = initialSuppliers.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val existing = initialSuppliers[idx]
            val updated = existing.copy(
                partyName = partyName,
                contactPerson = contactPerson,
                mobile = mobile,
                email = email,
                address = address,
                status = status
            )
            initialSuppliers[idx] = updated
            return updated
        }
        return null
    }

    fun deleteSupplier(id: String): Boolean {
        return initialSuppliers.removeAll { it.id == id }
    }
}
