package com.example.crm_app_kmp.notes

import kotlin.js.JsExport

@JsExport
data class NoteModel(
    val id: String,              // e.g. "NOTE-101"
    val title: String,           // e.g. "Payment Clearance Needed"
    val content: String,         // e.g. "Contact Ramesh Textiles..."
    val isUrgent: Boolean = false,
    val isPinned: Boolean = false,
    val createdAt: String = "Aug 28, 2026",
    val updatedAt: String = "Aug 28, 2026"
)

@JsExport
object NoteRepository {
    private val initialNotes = mutableListOf<NoteModel>()

    fun getNotes(): List<NoteModel> = initialNotes.toList()

    fun filterNotes(query: String = ""): List<NoteModel> {
        val q = query.lowercase().trim()
        if (q.isEmpty()) return initialNotes.toList()
        return initialNotes.filter { n ->
            n.title.lowercase().contains(q) || n.content.lowercase().contains(q)
        }
    }

    fun addNote(
        title: String,
        content: String,
        isUrgent: Boolean,
        isPinned: Boolean
    ): NoteModel {
        val nextId = "NOTE-${100 + initialNotes.size + 1}"
        val newN = NoteModel(
            id = nextId,
            title = title,
            content = content,
            isUrgent = isUrgent,
            isPinned = isPinned,
            createdAt = "Just now",
            updatedAt = "Just now"
        )
        initialNotes.add(0, newN)
        return newN
    }

    fun updateNote(
        id: String,
        title: String,
        content: String,
        isUrgent: Boolean,
        isPinned: Boolean
    ): NoteModel? {
        val idx = initialNotes.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val updated = initialNotes[idx].copy(
                title = title,
                content = content,
                isUrgent = isUrgent,
                isPinned = isPinned,
                updatedAt = "Just now"
            )
            initialNotes[idx] = updated
            return updated
        }
        return null
    }

    fun togglePin(id: String): NoteModel? {
        val idx = initialNotes.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val existing = initialNotes[idx]
            val updated = existing.copy(isPinned = !existing.isPinned)
            initialNotes[idx] = updated
            return updated
        }
        return null
    }

    fun toggleUrgent(id: String): NoteModel? {
        val idx = initialNotes.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val existing = initialNotes[idx]
            val updated = existing.copy(isUrgent = !existing.isUrgent)
            initialNotes[idx] = updated
            return updated
        }
        return null
    }

    fun deleteNote(id: String): Boolean {
        return initialNotes.removeAll { it.id == id }
    }
}
