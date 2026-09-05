package com.example.crm_app_kmp.ui.notepad

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.crm_app_kmp.data.SupabaseAndroidClient
import com.example.crm_app_kmp.notes.NoteModel
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import kotlinx.coroutines.launch
import org.json.JSONObject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidNotepadContent() {
    val context = LocalContext.current
    val supabaseClient = remember { SupabaseAndroidClient(context) }
    val scope = rememberCoroutineScope()

    val notes = remember { mutableStateListOf<NoteModel>() }
    var searchQuery by remember { mutableStateOf("") }
    var showFormDialog by remember { mutableStateOf(false) }
    var editingNote by remember { mutableStateOf<NoteModel?>(null) }
    var deletingNote by remember { mutableStateOf<NoteModel?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val fetchNotes: () -> Unit = {
        scope.launch {
            isLoading = true
            errorMessage = null
            val res = supabaseClient.fetchTable("notes")
            res.onSuccess { arr ->
                notes.clear()
                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    val priority = obj.optString("priority", "Normal")
                    val isUrgent = priority == "High" || obj.optBoolean("is_urgent", false)
                    val isPinned = obj.optBoolean("is_pinned", false)
                    notes.add(
                        NoteModel(
                            id = obj.optString("id", "$i"),
                            title = obj.optString("title", "Untitled Note"),
                            content = obj.optString("content", ""),
                            isUrgent = isUrgent,
                            isPinned = isPinned,
                            createdAt = obj.optString("created_at", "Recent")
                        )
                    )
                }
                isLoading = false
            }.onFailure { err ->
                errorMessage = err.message ?: "Unable to load notes."
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchNotes()
    }

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
                placeholder = { Text("Search notes...", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // TOAST MESSAGE
            toastMsg?.let { msg ->
                val isError = msg.contains("Unable") || msg.contains("Failed")
                Surface(
                    color = if (isError) Color(0xFFFEF2F2) else Color(0xFFF0FDF4),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = if (isError) "⚠️ $msg" else "✓ $msg",
                        color = if (isError) ErrorRed else Color(0xFF16A34A),
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            // ERROR DISPLAY
            errorMessage?.let { err ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("⚠️ $err", color = ErrorRed, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = fetchNotes, colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)) {
                            Text("Retry")
                        }
                    }
                }
            }

            // LIST OF NOTES / LOADING / EMPTY STATE
            if (isLoading) {
                Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = PrimaryBlue)
                }
            } else if (filteredNotes.isEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(40.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("No notes available", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurface)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(if (searchQuery.isNotEmpty()) "No notes matching \"$searchQuery\"" else "Create your first note to get started!", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
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
                                    scope.launch {
                                        val newPin = !note.isPinned
                                        val payload = JSONObject().apply { put("is_pinned", newPin) }
                                        val res = supabaseClient.updateRecord("notes", note.id, payload)
                                        res.onSuccess {
                                            toastMsg = if (newPin) "Note pinned" else "Note unpinned"
                                            fetchNotes()
                                        }.onFailure { err ->
                                            toastMsg = "Unable to update pin status: ${err.message}"
                                        }
                                    }
                                },
                                onToggleUrgent = {
                                    scope.launch {
                                        val newUrgent = !note.isUrgent
                                        val payload = JSONObject().apply { put("priority", if (newUrgent) "High" else "Normal") }
                                        val res = supabaseClient.updateRecord("notes", note.id, payload)
                                        res.onSuccess {
                                            toastMsg = if (newUrgent) "Marked as Urgent" else "Marked Normal"
                                            fetchNotes()
                                        }.onFailure { err ->
                                            toastMsg = "Unable to update priority: ${err.message}"
                                        }
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
                                color = MaterialTheme.colorScheme.onSurfaceVariant
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
                                    scope.launch {
                                        val newPin = !note.isPinned
                                        val payload = JSONObject().apply { put("is_pinned", newPin) }
                                        val res = supabaseClient.updateRecord("notes", note.id, payload)
                                        res.onSuccess {
                                            toastMsg = if (newPin) "Note pinned" else "Note unpinned"
                                            fetchNotes()
                                        }.onFailure { err ->
                                            toastMsg = "Unable to update pin status: ${err.message}"
                                        }
                                    }
                                },
                                onToggleUrgent = {
                                    scope.launch {
                                        val newUrgent = !note.isUrgent
                                        val payload = JSONObject().apply { put("priority", if (newUrgent) "High" else "Normal") }
                                        val res = supabaseClient.updateRecord("notes", note.id, payload)
                                        res.onSuccess {
                                            toastMsg = if (newUrgent) "Marked as Urgent" else "Marked Normal"
                                            fetchNotes()
                                        }.onFailure { err ->
                                            toastMsg = "Unable to update priority: ${err.message}"
                                        }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }

        // FLOATING ACTION BUTTON (+ ADD NOTE)
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
            Icon(Icons.Default.Add, contentDescription = "Add Note")
        }

        // FORM DIALOG (CREATE / EDIT)
        if (showFormDialog) {
            NoteFormDialog(
                editingNote = editingNote,
                onDismiss = { showFormDialog = false },
                onSave = { title, content, isUrgent, isPinned ->
                    scope.launch {
                        val payload = JSONObject().apply {
                            put("title", title.trim())
                            put("content", content.trim())
                            put("priority", if (isUrgent) "High" else "Normal")
                            put("is_pinned", isPinned)
                        }

                        if (editingNote != null) {
                            val res = supabaseClient.updateRecord("notes", editingNote!!.id, payload)
                            res.onSuccess {
                                toastMsg = "Note updated successfully"
                                showFormDialog = false
                                fetchNotes()
                            }.onFailure { err ->
                                toastMsg = "Unable to save note. Please try again."
                            }
                        } else {
                            val res = supabaseClient.insertRecord("notes", payload)
                            res.onSuccess {
                                toastMsg = "Note saved successfully"
                                showFormDialog = false
                                fetchNotes()
                            }.onFailure { err ->
                                toastMsg = "Unable to save note. Please try again."
                            }
                        }
                    }
                }
            )
        }

        // DELETE DIALOG
        deletingNote?.let { target ->
            DeleteNoteConfirmDialog(
                noteTitle = target.title,
                onDismiss = { deletingNote = null },
                onConfirm = {
                    scope.launch {
                        val res = supabaseClient.deleteRecord("notes", target.id)
                        res.onSuccess {
                            toastMsg = "Note deleted"
                            deletingNote = null
                            fetchNotes()
                        }.onFailure { err ->
                            toastMsg = "Unable to delete note. Please try again."
                            deletingNote = null
                        }
                    }
                }
            )
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
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = note.title,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.weight(1f)
                )

                Row {
                    IconButton(onClick = onTogglePin, modifier = Modifier.size(28.dp)) {
                        Icon(
                            imageVector = Icons.Default.PushPin,
                            contentDescription = "Pin",
                            tint = if (note.isPinned) PrimaryBlue else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                        )
                    }
                    IconButton(onClick = onToggleUrgent, modifier = Modifier.size(28.dp)) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = "Urgent",
                            tint = if (note.isUrgent) ErrorRed else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                        )
                    }
                }
            }

            if (note.content.isNotEmpty()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = note.content,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 18.sp
                )
            }

            Spacer(modifier = Modifier.height(10.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(note.createdAt, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Edit", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue, modifier = Modifier.clickable { onEdit() })
                    Text("Delete", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ErrorRed, modifier = Modifier.clickable { onDelete() })
                }
            }
        }
    }
}

@Composable
private fun NoteFormDialog(
    editingNote: NoteModel?,
    onDismiss: () -> Unit,
    onSave: (title: String, content: String, isUrgent: Boolean, isPinned: Boolean) -> Unit
) {
    var title by remember { mutableStateOf(editingNote?.title ?: "") }
    var content by remember { mutableStateOf(editingNote?.content ?: "") }
    var isUrgent by remember { mutableStateOf(editingNote?.isUrgent ?: false) }
    var isPinned by remember { mutableStateOf(editingNote?.isPinned ?: false) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (editingNote != null) "Edit Note" else "Create New Note",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Title") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = content,
                    onValueChange = { content = it },
                    label = { Text("Content / Description") },
                    minLines = 3,
                    maxLines = 5,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = isUrgent,
                        onCheckedChange = { isUrgent = it },
                        colors = CheckboxDefaults.colors(checkedColor = ErrorRed)
                    )
                    Text("Mark as High Priority / Urgent", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = isPinned,
                        onCheckedChange = { isPinned = it },
                        colors = CheckboxDefaults.colors(checkedColor = PrimaryBlue)
                    )
                    Text("Pin to top of Notepad", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(onClick = onDismiss, colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)) {
                        Text("Cancel", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            if (title.isNotBlank()) {
                                onSave(title, content, isUrgent, isPinned)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                    ) {
                        Text("Save Note")
                    }
                }
            }
        }
    }
}

@Composable
private fun DeleteNoteConfirmDialog(
    noteTitle: String,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Delete Note", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                Text("Are you sure you want to delete \"$noteTitle\"? This action cannot be undone.", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Button(onClick = onDismiss, colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)) {
                        Text("Cancel", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(onClick = onConfirm, colors = ButtonDefaults.buttonColors(containerColor = ErrorRed)) {
                        Text("Delete")
                    }
                }
            }
        }
    }
}
