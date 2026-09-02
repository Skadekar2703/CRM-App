package com.example.crm_app_kmp.reminders

import kotlin.js.JsExport

@JsExport
enum class ReminderType(val label: String) {
    CALL("Call"),
    WHATSAPP("WhatsApp"),
    VISIT("Visit"),
    PAYMENT_FOLLOWUP("Payment Follow-up"),
    MEETING("Meeting"),
    OTHER("Other")
}

@JsExport
enum class ReminderPriority(val label: String) {
    LOW("Low"),
    NORMAL("Normal"),
    HIGH("High"),
    URGENT("Urgent")
}

@JsExport
enum class ReminderStatus(val label: String) {
    PENDING("Pending"),
    DONE("Done"),
    SNOOZED("Snoozed"),
    CANCELLED("Cancelled")
}

@JsExport
data class ReminderModel(
    val id: String,
    val customerId: String = "",
    val customerName: String,
    val mobile: String,
    val scheduledAt: String,     // e.g. "2026-08-29 09:00 AM" or "22 May 2026, 09:00 AM"
    val type: String = "Call",   // Call, WhatsApp, Visit, Payment Follow-up, Meeting, Other
    val priority: String = "Normal", // Low, Normal, High, Urgent
    val status: String = "Pending",  // Pending, Done, Snoozed, Cancelled
    val notes: String = "",
    val snoozedUntil: String? = null,
    val createdAt: String = "2026-08-29",
    val isOverdue: Boolean = false
)

@JsExport
data class ReminderSummary(
    val todaysPending: Int,
    val thisWeekPending: Int,
    val totalPending: Int
)

@JsExport
object ReminderRepository {
    private val initialReminders = mutableListOf<ReminderModel>()

    fun getReminders(): List<ReminderModel> = initialReminders.toList()

    fun calculateSummary(): ReminderSummary {
        val pendingList = initialReminders.filter { it.status == "Pending" || it.status == "Snoozed" }
        val todaysCount = pendingList.count { it.scheduledAt.contains("2026-08-29") || it.isOverdue }
        val thisWeekCount = pendingList.size
        val totalOpenCount = pendingList.size
        return ReminderSummary(
            todaysPending = todaysCount,
            thisWeekPending = thisWeekCount,
            totalPending = totalOpenCount
        )
    }

    fun filterReminders(
        query: String = "",
        statusFilter: String = "All",
        priorityFilter: String = "All",
        typeFilter: String = "All"
    ): List<ReminderModel> {
        val q = query.lowercase().trim()
        return initialReminders.filter { r ->
            val matchesQuery = q.isEmpty() ||
                    r.customerName.lowercase().contains(q) ||
                    r.customerId.lowercase().contains(q) ||
                    r.mobile.lowercase().contains(q) ||
                    r.notes.lowercase().contains(q) ||
                    r.type.lowercase().contains(q)

            val matchesStatus = statusFilter == "All" || r.status.equals(statusFilter, ignoreCase = true)
            val matchesPriority = priorityFilter == "All" || r.priority.equals(priorityFilter, ignoreCase = true)
            val matchesType = typeFilter == "All" || r.type.equals(typeFilter, ignoreCase = true)

            matchesQuery && matchesStatus && matchesPriority && matchesType
        }
    }

    fun addReminder(
        customerName: String,
        mobile: String,
        scheduledAt: String,
        type: String,
        priority: String,
        notes: String,
        customerId: String = ""
    ): ReminderModel {
        val nextId = "REM-${1000 + initialReminders.size + 1}"
        val newR = ReminderModel(
            id = nextId,
            customerId = if (customerId.isBlank()) "100${100 + initialReminders.size}" else customerId,
            customerName = customerName,
            mobile = mobile,
            scheduledAt = scheduledAt,
            type = type,
            priority = priority,
            status = "Pending",
            notes = notes,
            createdAt = "Just now"
        )
        initialReminders.add(0, newR)
        return newR
    }

    fun updateReminder(
        id: String,
        customerName: String,
        mobile: String,
        scheduledAt: String,
        type: String,
        priority: String,
        status: String,
        notes: String
    ): ReminderModel? {
        val idx = initialReminders.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val existing = initialReminders[idx]
            val updated = existing.copy(
                customerName = customerName,
                mobile = mobile,
                scheduledAt = scheduledAt,
                type = type,
                priority = priority,
                status = status,
                notes = notes
            )
            initialReminders[idx] = updated
            return updated
        }
        return null
    }

    fun markDone(id: String): ReminderModel? {
        val idx = initialReminders.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val updated = initialReminders[idx].copy(status = "Done", isOverdue = false)
            initialReminders[idx] = updated
            return updated
        }
        return null
    }

    fun snooze(id: String, newDateTime: String): ReminderModel? {
        val idx = initialReminders.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val updated = initialReminders[idx].copy(
                status = "Snoozed",
                snoozedUntil = newDateTime,
                scheduledAt = newDateTime,
                isOverdue = false
            )
            initialReminders[idx] = updated
            return updated
        }
        return null
    }

    fun deleteReminder(id: String): Boolean {
        return initialReminders.removeAll { it.id == id }
    }
}
