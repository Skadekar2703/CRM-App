package com.example.crm_app_kmp.cheques

import kotlin.js.JsExport

@JsExport
data class ChequeModel(
    val id: String,
    val chequeNo: String,
    val partyName: String,
    val bankName: String,
    val amount: Double,
    val direction: String, // "Inward" or "Outward"
    val issueDate: String,
    val dueDate: String,
    val status: String, // "Pending", "Cleared", "Bounced"
    val notes: String,
    val createdDate: String
)

@JsExport
object ChequeDateUtils {
    private val months = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")

    fun formatToDisplayDate(rawDate: String): String {
        if (rawDate.isBlank()) return ""
        val clean = rawDate.trim().split("T")[0]
        val parts = clean.split("-")
        if (parts.size == 3 && parts[0].length == 4) {
            val year = parts[0]
            val monthIdx = parts[1].toIntOrNull()?.minus(1) ?: 0
            val day = parts[2].padStart(2, '0')
            if (monthIdx in 0..11) {
                return "$day ${months[monthIdx]} $year"
            }
        }
        return rawDate
    }

    fun parseDisplayToIso(displayDate: String): String {
        if (displayDate.isBlank()) return ""
        val clean = displayDate.trim()
        if (clean.matches(Regex("^\\d{4}-\\d{2}-\\d{2}$"))) {
            return clean
        }
        val parts = clean.split(" ", "-")
        if (parts.size == 3) {
            val day = parts[0].padStart(2, '0')
            val monthStr = parts[1]
            val year = parts[2]
            val monthIdx = months.indexOfFirst { it.equals(monthStr, ignoreCase = true) }
            if (monthIdx >= 0) {
                val monthNum = (monthIdx + 1).toString().padStart(2, '0')
                return "$year-$monthNum-$day"
            }
        }
        return displayDate
    }

    fun isDueDateValid(issueDateIsoOrDisplay: String, dueDateIsoOrDisplay: String): Boolean {
        val issueIso = parseDisplayToIso(issueDateIsoOrDisplay)
        val dueIso = parseDisplayToIso(dueDateIsoOrDisplay)
        if (issueIso.matches(Regex("^\\d{4}-\\d{2}-\\d{2}$")) && dueIso.matches(Regex("^\\d{4}-\\d{2}-\\d{2}$"))) {
            return dueIso >= issueIso
        }
        return true
    }
}


@JsExport
object ChequeRepository {
    private val initialCheques = mutableListOf<ChequeModel>()

    fun getCheques(): List<ChequeModel> = initialCheques.toList()

    fun searchCheques(
        query: String = "",
        directionFilter: String = "All",
        statusFilter: String = "All"
    ): List<ChequeModel> {
        val q = query.lowercase().trim()
        return initialCheques.filter { c ->
            val matchesQuery = q.isEmpty() ||
                    c.id.lowercase().contains(q) ||
                    c.chequeNo.lowercase().contains(q) ||
                    c.partyName.lowercase().contains(q) ||
                    c.bankName.lowercase().contains(q)

            val matchesDirection = directionFilter.equals("All", ignoreCase = true) || c.direction.equals(directionFilter, ignoreCase = true)
            val matchesStatus = statusFilter.equals("All", ignoreCase = true) || c.status.equals(statusFilter, ignoreCase = true)

            matchesQuery && matchesDirection && matchesStatus
        }
    }

    fun getAllCount(): Int = initialCheques.size
    fun getPendingCount(): Int = initialCheques.count { it.status.equals("Pending", ignoreCase = true) }
    fun getClearedCount(): Int = initialCheques.count { it.status.equals("Cleared", ignoreCase = true) }
    fun getBouncedCount(): Int = initialCheques.count { it.status.equals("Bounced", ignoreCase = true) }

    fun addCheque(
        chequeNo: String,
        partyName: String,
        bankName: String,
        amount: Double,
        direction: String,
        issueDate: String,
        dueDate: String,
        status: String,
        notes: String
    ): ChequeModel {
        val nextId = (initialCheques.size + 1).toString()
        val formattedNo = if (chequeNo.isBlank()) "CHQ-2023-08" + (90 + initialCheques.size) else chequeNo
        val newCheque = ChequeModel(
            id = nextId,
            chequeNo = formattedNo,
            partyName = partyName,
            bankName = bankName.ifBlank { "HDFC Bank" },
            amount = if (amount < 0) 0.0 else amount,
            direction = direction.ifBlank { "Inward" },
            issueDate = issueDate.ifBlank { "Oct 24, 2023" },
            dueDate = dueDate.ifBlank { "Nov 15, 2023" },
            status = status.ifBlank { "Pending" },
            notes = notes,
            createdDate = "Just now"
        )
        initialCheques.add(0, newCheque)
        return newCheque
    }

    fun updateCheque(
        id: String,
        chequeNo: String,
        partyName: String,
        bankName: String,
        amount: Double,
        direction: String,
        issueDate: String,
        dueDate: String,
        status: String,
        notes: String
    ): ChequeModel? {
        val idx = initialCheques.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val existing = initialCheques[idx]
            val updated = existing.copy(
                chequeNo = chequeNo,
                partyName = partyName,
                bankName = bankName,
                amount = amount,
                direction = direction,
                issueDate = issueDate,
                dueDate = dueDate,
                status = status,
                notes = notes
            )
            initialCheques[idx] = updated
            return updated
        }
        return null
    }

    fun deleteCheque(id: String): Boolean {
        return initialCheques.removeAll { it.id == id }
    }
}
