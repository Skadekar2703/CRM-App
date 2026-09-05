package com.example.crm_app_kmp.ui.reminders

import android.content.Intent
import android.net.Uri
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.crm_app_kmp.reminders.ReminderModel
import com.example.crm_app_kmp.reminders.ReminderRepository
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidRemindersContent() {
    val context = LocalContext.current
    val reminders = remember { mutableStateListOf(*ReminderRepository.getReminders().toTypedArray()) }

    var searchQuery by remember { mutableStateOf("") }
    var selectedStatusChip by remember { mutableStateOf("All") } // All, Pending, Done, Snoozed
    var showFormDialog by remember { mutableStateOf(false) }
    var editingReminder by remember { mutableStateOf<ReminderModel?>(null) }
    var snoozingReminder by remember { mutableStateOf<ReminderModel?>(null) }
    var deletingReminder by remember { mutableStateOf<ReminderModel?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    val summary = remember(reminders.toList()) {
        ReminderRepository.calculateSummary()
    }

    val filteredReminders = reminders.filter { r ->
        val q = searchQuery.lowercase().trim()
        val matchesQ = q.isEmpty() ||
                r.customerName.lowercase().contains(q) ||
                r.mobile.contains(q) ||
                r.notes.lowercase().contains(q) ||
                r.type.lowercase().contains(q)
        val matchesStatus = selectedStatusChip == "All" || r.status.equals(selectedStatusChip, ignoreCase = true)
        matchesQ && matchesStatus
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // SUMMARY CARDS ROW
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // TODAY'S PENDING
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Today's", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("${summary.todaysPending}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                        Text("Due today", fontSize = 10.sp, color = TextMuted)
                    }
                }

                // THIS WEEK PENDING
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("This Week", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("${summary.thisWeekPending}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        Text("Next 7 days", fontSize = 10.sp, color = TextMuted)
                    }
                }

                // TOTAL PENDING
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Total Open", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("${summary.totalPending}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFFD97706))
                        Text("All open", fontSize = 10.sp, color = TextMuted)
                    }
                }
            }

            // SEARCH BAR
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search customer, mobile or type...", fontSize = 14.sp, color = TextMuted) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // FILTER CHIPS
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("All", "Pending", "Done", "Snoozed").forEach { chip ->
                    val isSelected = selectedStatusChip == chip
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(if (isSelected) PrimaryBlue else androidx.compose.material3.MaterialTheme.colorScheme.surface)
                            .border(1.dp, if (isSelected) PrimaryBlue else androidx.compose.material3.MaterialTheme.colorScheme.outline, CircleShape)
                            .clickable { selectedStatusChip = chip }
                            .padding(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = chip,
                            fontSize = 12.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) Color.White else androidx.compose.material3.MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

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

            // REMINDERS LIST
            if (filteredReminders.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No reminders found.", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(filteredReminders, key = { it.id }) { reminder ->
                        ReminderCard(
                            reminder = reminder,
                            onDone = {
                                val updated = ReminderRepository.markDone(reminder.id)
                                if (updated != null) {
                                    val idx = reminders.indexOfFirst { it.id == reminder.id }
                                    if (idx >= 0) reminders[idx] = updated
                                    toastMsg = "Reminder for ${reminder.customerName} marked DONE."
                                }
                            },
                            onSnooze = { snoozingReminder = reminder },
                            onCall = {
                                try {
                                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${reminder.mobile}"))
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    toastMsg = "Calling ${reminder.mobile}"
                                }
                            },
                            onWhatsApp = {
                                try {
                                    val cleanNum = reminder.mobile.replace(Regex("[^0-9]"), "")
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$cleanNum"))
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    toastMsg = "Opening WhatsApp for ${reminder.mobile}"
                                }
                            },
                            onEdit = {
                                editingReminder = reminder
                                showFormDialog = true
                            },
                            onDelete = { deletingReminder = reminder }
                        )
                    }
                }
            }
        }

        // FAB ADD BUTTON
        FloatingActionButton(
            onClick = {
                editingReminder = null
                showFormDialog = true
            },
            containerColor = PrimaryBlue,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Reminder", modifier = Modifier.size(24.dp))
        }
    }

    // ADD / EDIT DIALOG
    if (showFormDialog) {
        ReminderFormDialog(
            editingReminder = editingReminder,
            onDismiss = { showFormDialog = false },
            onSave = { name, mobile, sched, type, prio, stat, notes, custId ->
                if (editingReminder != null) {
                    val updated = ReminderRepository.updateReminder(
                        id = editingReminder!!.id,
                        customerName = name,
                        mobile = mobile,
                        scheduledAt = sched,
                        type = type,
                        priority = prio,
                        status = stat,
                        notes = notes
                    )
                    if (updated != null) {
                        val idx = reminders.indexOfFirst { it.id == editingReminder!!.id }
                        if (idx >= 0) reminders[idx] = updated
                        toastMsg = "Reminder for '$name' updated."
                    }
                } else {
                    val newR = ReminderRepository.addReminder(
                        customerName = name,
                        mobile = mobile,
                        scheduledAt = sched,
                        type = type,
                        priority = prio,
                        notes = notes,
                        customerId = custId
                    )
                    reminders.add(0, newR)
                    toastMsg = "Reminder for '$name' created."
                }
                showFormDialog = false
            }
        )
    }

    // SNOOZE DIALOG
    snoozingReminder?.let { target ->
        var newDateTime by remember { mutableStateOf("2026-08-30 10:00 AM") }
        Dialog(onDismissRequest = { snoozingReminder = null }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("Snooze Reminder", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Select new date and time for ${target.customerName}:", fontSize = 13.sp, color = TextMuted)

                    OutlinedTextField(
                        value = newDateTime,
                        onValueChange = { newDateTime = it },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Button(
                            onClick = { snoozingReminder = null },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                val updated = ReminderRepository.snooze(target.id, newDateTime)
                                if (updated != null) {
                                    val idx = reminders.indexOfFirst { it.id == target.id }
                                    if (idx >= 0) reminders[idx] = updated
                                    toastMsg = "Snoozed until $newDateTime"
                                }
                                snoozingReminder = null
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD97706)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Confirm Snooze", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    // DELETE DIALOG
    deletingReminder?.let { target ->
        Dialog(onDismissRequest = { deletingReminder = null }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("Delete Reminder?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Delete reminder for '${target.customerName}'?", fontSize = 14.sp, color = TextMuted)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Button(
                            onClick = { deletingReminder = null },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                ReminderRepository.deleteReminder(target.id)
                                reminders.removeAll { it.id == target.id }
                                toastMsg = "Reminder deleted."
                                deletingReminder = null
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
private fun ReminderCard(
    reminder: ReminderModel,
    onDone: () -> Unit,
    onSnooze: () -> Unit,
    onCall: () -> Unit,
    onWhatsApp: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val isDone = reminder.status.equals("Done", ignoreCase = true)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // CUSTOMER & WHEN
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(reminder.customerName, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Mobile: ${reminder.mobile}", fontSize = 13.sp, color = TextMuted)
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(reminder.scheduledAt, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    if (reminder.isOverdue && !isDone) {
                        Text("⚠️ OVERDUE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                    }
                }
            }

            // BADGES: TYPE, PRIORITY, STATUS
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFFEFF6FF))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(reminder.type, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (reminder.priority == "Urgent") Color(0xFFFEE2E2) else Color(0xFFF1F5F9))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(reminder.priority, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (reminder.priority == "Urgent") ErrorRed else TextMuted)
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (isDone) Color(0xFFDCFCE7) else Color(0xFFFEF3C7))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(reminder.status, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (isDone) Color(0xFF16A34A) else Color(0xFFD97706))
                }
            }

            if (reminder.notes.isNotBlank()) {
                Text("\"${reminder.notes}\"", fontSize = 12.sp, color = TextMuted)
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            // ACTIONS
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (!isDone) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFF16A34A))
                                .clickable { onDone() }
                                .padding(horizontal = 8.dp, vertical = 5.dp)
                        ) {
                            Text("✓ Done", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFD97706))
                                .clickable { onSnooze() }
                                .padding(horizontal = 8.dp, vertical = 5.dp)
                        ) {
                            Text("🕒 Snooze", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(0xFFE0F2FE))
                            .clickable { onCall() }
                            .padding(horizontal = 8.dp, vertical = 5.dp)
                    ) {
                        Text("📞 Call", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0284C7))
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(0xFFDCFCE7))
                            .clickable { onWhatsApp() }
                            .padding(horizontal = 8.dp, vertical = 5.dp)
                    ) {
                        Text("💬 WA", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF16A34A))
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                    IconButton(onClick = onEdit, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextPrimary, modifier = Modifier.size(16.dp))
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete", tint = ErrorRed, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun ReminderFormDialog(
    editingReminder: ReminderModel?,
    onDismiss: () -> Unit,
    onSave: (
        customerName: String,
        mobile: String,
        scheduledAt: String,
        type: String,
        priority: String,
        status: String,
        notes: String,
        customerId: String
    ) -> Unit
) {
    var customerName by remember { mutableStateOf(editingReminder?.customerName ?: "") }
    var mobile by remember { mutableStateOf(editingReminder?.mobile ?: "") }
    var scheduledAt by remember { mutableStateOf(editingReminder?.scheduledAt ?: "2026-08-29 10:00 AM") }
    var type by remember { mutableStateOf(editingReminder?.type ?: "Call") }
    var priority by remember { mutableStateOf(editingReminder?.priority ?: "Normal") }
    var status by remember { mutableStateOf(editingReminder?.status ?: "Pending") }
    var notes by remember { mutableStateOf(editingReminder?.notes ?: "") }
    var customerId by remember { mutableStateOf(editingReminder?.customerId ?: "") }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (editingReminder != null) "Edit Reminder" else "Add New Reminder",
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
                    value = customerName,
                    onValueChange = { customerName = it },
                    placeholder = { Text("Customer Name *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = mobile,
                    onValueChange = { mobile = it },
                    placeholder = { Text("Mobile Number *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = scheduledAt,
                    onValueChange = { scheduledAt = it },
                    placeholder = { Text("Scheduled Date & Time *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = type,
                    onValueChange = { type = it },
                    placeholder = { Text("Type (Call, WhatsApp, Visit...)", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    placeholder = { Text("Notes & Follow-up Details", fontSize = 13.sp) },
                    minLines = 3,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

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
                            if (customerName.isBlank()) {
                                errorMsg = "Customer Name is required."
                            } else if (mobile.isBlank()) {
                                errorMsg = "Mobile is required."
                            } else {
                                onSave(customerName.trim(), mobile.trim(), scheduledAt.trim(), type, priority, status, notes.trim(), customerId)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (editingReminder != null) "Save Changes" else "Save Reminder", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
