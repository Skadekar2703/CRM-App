package com.example.crm_app_kmp.ui.notepad

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.crm_app_kmp.notes.NoteModel
import com.example.crm_app_kmp.notes.NoteRepository
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidNotepadContent() {
    val notes = remember { mutableStateListOf(*NoteRepository.getNotes().toTypedArray()) }

    var searchQuery by remember { mutableStateOf("") }
    var showFormDialog by remember { mutableStateOf(false) }
    var editingNote by remember { mutableStateOf<NoteModel?>(null) }
    var deletingNote by remember { mutableStateOf<NoteModel?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    val filteredNotes = notes.filter { n ->
        val q = searchQuery.lowercase().trim()
        q.isEmpty() || n.title.lowercase().contains(q) || n.content.lowercase().contains(q)
    }

    val pinnedNotes = filteredNotes.filter { it.isPinned }
    val otherNotes = filteredNotes.filter { !it.isPinned }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // SEARCH FIELD
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search notes...", fontSize = 14.sp, color = TextMuted) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // TOAST MESSAGE
            toastMsg?.let { msg ->
                Surface(
                    color = Color(0xFFF0FDF4),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "✓ $msg",
                        color = Color(0xFF16A34A),
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            // LIST OF NOTES
            if (filteredNotes.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No notes found.", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    // PINNED NOTES SECTION
                    if (pinnedNotes.isNotEmpty()) {
                        item {
                            Text(
                                text = "📌 PINNED NOTES (${pinnedNotes.size})",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = PrimaryBlue
                            )
                        }
                        items(pinnedNotes, key = { "pinned_${it.id}" }) { note ->
                            NoteCard(
                                note = note,
                                onEdit = {
                                    editingNote = note
                                    showFormDialog = true
                                },
                                onDelete = { deletingNote = note },
                                onTogglePin = {
                                    val updated = NoteRepository.togglePin(note.id)
                                    if (updated != null) {
                                        val idx = notes.indexOfFirst { it.id == note.id }
                                        if (idx >= 0) notes[idx] = updated
                                        toastMsg = if (updated.isPinned) "Note pinned" else "Note unpinned"
                                    }
                                },
                                onToggleUrgent = {
                                    val updated = NoteRepository.toggleUrgent(note.id)
                                    if (updated != null) {
                                        val idx = notes.indexOfFirst { it.id == note.id }
                                        if (idx >= 0) notes[idx] = updated
                                        toastMsg = if (updated.isUrgent) "Marked as Urgent" else "Marked Normal"
                                    }
                                }
                            )
                        }
                    }

                    // OTHER NOTES SECTION
                    if (otherNotes.isNotEmpty()) {
                        item {
                            Text(
                                text = if (pinnedNotes.isNotEmpty()) "OTHER NOTES (${otherNotes.size})" else "ALL NOTES (${otherNotes.size})",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextMuted
                            )
                        }
                        items(otherNotes, key = { "other_${it.id}" }) { note ->
                            NoteCard(
                                note = note,
                                onEdit = {
                                    editingNote = note
                                    showFormDialog = true
                                },
                                onDelete = { deletingNote = note },
                                onTogglePin = {
                                    val updated = NoteRepository.togglePin(note.id)
                                    if (updated != null) {
                                        val idx = notes.indexOfFirst { it.id == note.id }
                                        if (idx >= 0) notes[idx] = updated
                                        toastMsg = if (updated.isPinned) "Note pinned" else "Note unpinned"
                                    }
                                },
                                onToggleUrgent = {
                                    val updated = NoteRepository.toggleUrgent(note.id)
                                    if (updated != null) {
                                        val idx = notes.indexOfFirst { it.id == note.id }
                                        if (idx >= 0) notes[idx] = updated
                                        toastMsg = if (updated.isUrgent) "Marked as Urgent" else "Marked Normal"
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }

        // FLOATING "+" ADD BUTTON
        FloatingActionButton(
            onClick = {
                editingNote = null
                showFormDialog = true
            },
            containerColor = PrimaryBlue,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Note", modifier = Modifier.size(24.dp))
        }
    }

    // ADD / EDIT NOTE DIALOG
    if (showFormDialog) {
        NoteFormDialog(
            editingNote = editingNote,
            onDismiss = { showFormDialog = false },
            onSave = { title, content, isUrgent, isPinned ->
                if (editingNote != null) {
                    val updated = NoteRepository.updateNote(
                        id = editingNote!!.id,
                        title = title,
                        content = content,
                        isUrgent = isUrgent,
                        isPinned = isPinned
                    )
                    if (updated != null) {
                        val idx = notes.indexOfFirst { it.id == editingNote!!.id }
                        if (idx >= 0) notes[idx] = updated
                        toastMsg = "Note '$title' updated."
                    }
                } else {
                    val newN = NoteRepository.addNote(
                        title = title,
                        content = content,
                        isUrgent = isUrgent,
                        isPinned = isPinned
                    )
                    notes.add(0, newN)
                    toastMsg = "New note '$title' created."
                }
                showFormDialog = false
            }
        )
    }

    // DELETE CONFIRMATION DIALOG
    deletingNote?.let { target ->
        Dialog(onDismissRequest = { deletingNote = null }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text("Delete Note?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Are you sure you want to delete '${target.title}'?", fontSize = 14.sp, color = TextMuted)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = { deletingNote = null },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                NoteRepository.deleteNote(target.id)
                                notes.removeAll { it.id == target.id }
                                toastMsg = "Note '${target.title}' deleted."
                                deletingNote = null
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = ErrorRed),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Delete", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NoteCard(
    note: NoteModel,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onTogglePin: () -> Unit,
    onToggleUrgent: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (note.isUrgent) Modifier.border(1.dp, ErrorRed.copy(alpha = 0.5f), RoundedCornerShape(16.dp)) else Modifier
            ),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // HEADER: TITLE & PIN ICON
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = note.title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    modifier = Modifier.weight(1f)
                )

                IconButton(
                    onClick = onTogglePin,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        Icons.Default.PushPin,
                        contentDescription = "Pin",
                        tint = if (note.isPinned) PrimaryBlue else TextMuted.copy(alpha = 0.5f),
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            // URGENT BADGE
            if (note.isUrgent) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFFFEF2F2))
                        .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = ErrorRed, modifier = Modifier.size(12.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("URGENT", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                    }
                }
            }

            // CONTENT PREVIEW
            Text(
                text = note.content,
                fontSize = 13.sp,
                color = TextMuted,
                lineHeight = 18.sp
            )

            HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(top = 4.dp))

            // FOOTER: DATE & ACTIONS
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(note.createdAt, fontSize = 11.sp, color = TextMuted)

                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (note.isUrgent) Color(0xFFFEE2E2) else Color(0xFFF1F5F9))
                            .clickable { onToggleUrgent() }
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = if (note.isUrgent) "Urgent" else "Make Urgent",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (note.isUrgent) ErrorRed else TextMuted
                        )
                    }

                    IconButton(onClick = onEdit, modifier = Modifier.size(30.dp)) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextPrimary, modifier = Modifier.size(16.dp))
                    }

                    IconButton(onClick = onDelete, modifier = Modifier.size(30.dp)) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete", tint = ErrorRed, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun NoteFormDialog(
    editingNote: NoteModel?,
    onDismiss: () -> Unit,
    onSave: (
        title: String,
        content: String,
        isUrgent: Boolean,
        isPinned: Boolean
    ) -> Unit
) {
    var title by remember { mutableStateOf(editingNote?.title ?: "") }
    var content by remember { mutableStateOf(editingNote?.content ?: "") }
    var isUrgent by remember { mutableStateOf(editingNote?.isUrgent ?: false) }
    var isPinned by remember { mutableStateOf(editingNote?.isPinned ?: false) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (editingNote != null) "Edit Note" else "Add New Note",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                errorMsg?.let { err ->
                    Text("⚠️ $err", color = ErrorRed, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it; if (errorMsg != null) errorMsg = null },
                    placeholder = { Text("Note Title *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = content,
                    onValueChange = { content = it; if (errorMsg != null) errorMsg = null },
                    placeholder = { Text("Note Content *", fontSize = 13.sp) },
                    minLines = 4,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(
                            checked = isUrgent,
                            onCheckedChange = { isUrgent = it },
                            colors = CheckboxDefaults.colors(checkedColor = ErrorRed)
                        )
                        Text("Urgent", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = ErrorRed)
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(
                            checked = isPinned,
                            onCheckedChange = { isPinned = it },
                            colors = CheckboxDefaults.colors(checkedColor = PrimaryBlue)
                        )
                        Text("Pin to Top", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = PrimaryBlue)
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Cancel", fontSize = 13.sp)
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Button(
                        onClick = {
                            if (title.isBlank()) {
                                errorMsg = "Note Title is required."
                            } else if (content.isBlank()) {
                                errorMsg = "Note Content is required."
                            } else {
                                onSave(title.trim(), content.trim(), isUrgent, isPinned)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (editingNote != null) "Save Changes" else "Save Note", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
