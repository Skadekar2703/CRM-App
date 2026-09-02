package com.example.crm_app_kmp.transports

import kotlin.js.JsExport

@JsExport
data class TransportModel(
    val id: String,
    val transportName: String,
    val mobile: String,
    val contactPerson: String,
    val vehicleNumber: String,
    val status: String, // "Active" or "Inactive"
    val createdDate: String
)

@JsExport
object TransportRepository {
    private val initialTransports = mutableListOf<TransportModel>()

    fun getTransports(): List<TransportModel> = initialTransports.toList()

    fun filterTransports(
        query: String,
        statusFilter: String = "All"
    ): List<TransportModel> {
        val q = query.lowercase().trim()
        return initialTransports.filter { t ->
            val matchesQuery = q.isEmpty() ||
                    t.id.lowercase().contains(q) ||
                    t.transportName.lowercase().contains(q) ||
                    t.mobile.lowercase().contains(q) ||
                    t.contactPerson.lowercase().contains(q) ||
                    t.vehicleNumber.lowercase().contains(q)

            val matchesStatus = when (statusFilter.lowercase()) {
                "all" -> true
                "active" -> t.status.equals("Active", ignoreCase = true)
                "inactive" -> t.status.equals("Inactive", ignoreCase = true)
                else -> t.status.equals(statusFilter, ignoreCase = true)
            }

            matchesQuery && matchesStatus
        }
    }

    fun addTransport(
        transportName: String,
        mobile: String,
        contactPerson: String,
        vehicleNumber: String,
        status: String
    ): TransportModel {
        val nextId = (1040 + initialTransports.size + 8).toString()
        val formattedStatus = if (status.lowercase().contains("inactive")) "Inactive" else "Active"

        val newTransport = TransportModel(
            id = nextId,
            transportName = transportName,
            mobile = mobile,
            contactPerson = contactPerson,
            vehicleNumber = vehicleNumber.ifBlank { "N/A" },
            status = formattedStatus,
            createdDate = "Just now"
        )
        initialTransports.add(0, newTransport)
        return newTransport
    }

    fun updateTransport(
        id: String,
        transportName: String,
        mobile: String,
        contactPerson: String,
        vehicleNumber: String,
        status: String
    ): TransportModel? {
        val index = initialTransports.indexOfFirst { it.id == id }
        if (index >= 0) {
            val existing = initialTransports[index]
            val formattedStatus = if (status.lowercase().contains("inactive")) "Inactive" else "Active"

            val updated = existing.copy(
                transportName = transportName,
                mobile = mobile,
                contactPerson = contactPerson,
                vehicleNumber = vehicleNumber.ifBlank { existing.vehicleNumber },
                status = formattedStatus
            )
            initialTransports[index] = updated
            return updated
        }
        return null
    }

    fun deleteTransport(id: String): Boolean {
        return initialTransports.removeAll { it.id == id }
    }

    fun getTransportById(id: String): TransportModel? {
        return initialTransports.find { it.id == id }
    }
}
