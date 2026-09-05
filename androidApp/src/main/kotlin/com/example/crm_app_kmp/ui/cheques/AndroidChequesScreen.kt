package com.example.crm_app_kmp.ui.cheques

import android.app.DatePickerDialog
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.crm_app_kmp.cheques.ChequeDateUtils
import com.example.crm_app_kmp.cheques.ChequeModel
import com.example.crm_app_kmp.data.SupabaseAndroidClient
import com.example.crm_app_kmp.ui.components.CrmRootScaffold
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.util.Calendar

@Composable
fun AndroidChequesScreen(
    onNavigateSection: (String) -> Unit = {}
) {
    CrmRootScaffold(
        activeSection = "Cheques",
        onNavigateSection = onNavigateSection
    ) {
        AndroidChequesContent()
    }
}

@Composable
fun AndroidChequesContent() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val supabaseClient = remember { SupabaseAndroidClient(context) }

    val chequesList = remember { mutableStateListOf<ChequeModel>() }
    var searchQuery by remember { mutableStateOf("") }
    var statusFilter by remember { mutableStateOf("All") }

    var showFormDialog by remember { mutableStateOf(false) }
    var editingCheque by remember { mutableStateOf<ChequeModel?>(null) }
    var deletingCheque by remember { mutableStateOf<ChequeModel?>(null) }
    var statusActionTarget by remember { mutableStateOf<Pair<ChequeModel, String>?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    fun loadChequesFromSupabase() {
        scope.launch {
            val res = supabaseClient.fetchTable("cheques")
            res.onSuccess { arr ->
                val list = mutableListOf<ChequeModel>()
                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    val id = obj.optString("id")
                    val chequeNo = obj.optString("cheque_number", obj.optString("chequeNo", "CHK-000"))
                    val partyName = obj.optString("party_name", "Party Name")
                    val bankName = obj.optString("bank_name", "HDFC Bank")
                    val amount = obj.optDouble("amount", 0.0)
                    val partyType = obj.optString("party_type", "Customer")
                    val direction = if (partyType == "Supplier") "Outward" else "Inward"
                    val rawIssue = obj.optString("issue_date", "")
                    val rawDue = obj.optString("due_date", "")
                    val status = obj.optString("status", "Pending")
                    val notes = obj.optString("notes", "")

                    list.add(
                        ChequeModel(
                            id = id,
                            chequeNo = chequeNo,
                            partyName = partyName,
                            bankName = bankName,
                            amount = amount,
                            direction = direction,
                            issueDate = ChequeDateUtils.formatToDisplayDate(rawIssue),
                            dueDate = ChequeDateUtils.formatToDisplayDate(rawDue),
                            status = status,
                            notes = notes,
                            createdDate = "Recent"
                        )
                    )
                }
                chequesList.clear()
                chequesList.addAll(list)
            }
        }
    }

    LaunchedEffect(Unit) {
        loadChequesFromSupabase()
    }

    // CALCULATED COUNTS
    val allCount = chequesList.size
    val pendingCount = chequesList.count { it.status.equals("Pending", ignoreCase = true) }
    val clearedCount = chequesList.count { it.status.equals("Cleared", ignoreCase = true) }
    val bouncedCount = chequesList.count { it.status.equals("Bounced", ignoreCase = true) }

    val filteredCheques = chequesList.filter { c ->
        val q = searchQuery.lowercase().trim()
        val matchesQuery = q.isEmpty() ||
                c.id.lowercase().contains(q) ||
                c.chequeNo.lowercase().contains(q) ||
                c.partyName.lowercase().contains(q) ||
                c.bankName.lowercase().contains(q)

        val matchesStatus = statusFilter.equals("All", ignoreCase = true) || c.status.equals(statusFilter, ignoreCase = true)

        matchesQuery && matchesStatus
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(androidx.compose.material3.MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // SCREEN TITLE
            Text(
                text = "Cheque Register",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            // SUMMARY METRICS CARDS ROW
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                MetricChip("ALL", "$allCount", Color(0xFF0284C7), Modifier.weight(1f))
                MetricChip("PENDING", "$pendingCount", Color(0xFFEA580C), Modifier.weight(1f))
                MetricChip("CLEARED", "$clearedCount", Color(0xFF16A34A), Modifier.weight(1f))
                MetricChip("BOUNCED", "$bouncedCount", ErrorRed, Modifier.weight(1f))
            }

            // SEARCH & FILTER ROW
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search cheques...", fontSize = 14.sp, color = TextMuted) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                )

                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(androidx.compose.material3.MaterialTheme.colorScheme.surface)
                        .border(1.dp, androidx.compose.material3.MaterialTheme.colorScheme.outline, RoundedCornerShape(12.dp))
                        .clickable {
                            statusFilter = when (statusFilter) {
                                "All" -> "Pending"
                                "Pending" -> "Cleared"
                                "Cleared" -> "Bounced"
                                else -> "All"
                            }
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.FilterList, contentDescription = "Filter", tint = PrimaryBlue)
                }
            }

            // TOAST BANNER
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

            // VERTICAL CHEQUE CARDS LIST
            if (filteredCheques.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No cheque records found.", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredCheques) { cheque ->
                        MobileChequeCard(
                            cheque = cheque,
                            onEdit = {
                                editingCheque = cheque
                                showFormDialog = true
                            },
                            onDelete = {
                                deletingCheque = cheque
                            },
                            onClearStatus = {
                                statusActionTarget = Pair(cheque, "Cleared")
                            },
                            onBounceStatus = {
                                statusActionTarget = Pair(cheque, "Bounced")
                            }
                        )
                    }
                }
            }
        }

        // FAB (+)
        FloatingActionButton(
            onClick = {
                editingCheque = null
                showFormDialog = true
            },
            containerColor = PrimaryBlue,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Cheque", modifier = Modifier.size(24.dp))
        }
    }

    // ADD / EDIT FORM DIALOG
    if (showFormDialog) {
        ChequeFormDialog(
            editingCheque = editingCheque,
            onDismiss = { showFormDialog = false },
            onSave = { no, party, bank, amt, dir, issue, due, status, notes ->
                scope.launch {
                    val partyType = if (dir == "Outward") "Supplier" else "Customer"
                    val issueIso = ChequeDateUtils.parseDisplayToIso(issue)
                    val dueIso = ChequeDateUtils.parseDisplayToIso(due)
                    val payload = JSONObject().apply {
                        put("cheque_number", no)
                        put("party_name", party)
                        put("party_type", partyType)
                        put("bank_name", bank)
                        put("amount", amt)
                        put("issue_date", issueIso)
                        put("due_date", dueIso)
                        put("status", status)
                        put("notes", notes)
                    }

                    if (editingCheque != null) {
                        val isUuid = editingCheque!!.id.length == 36 && editingCheque!!.id.contains("-")
                        val res = if (isUuid) supabaseClient.updateRecord("cheques", editingCheque!!.id, payload) else Result.success(Unit)
                        res.onSuccess {
                            val updated = editingCheque!!.copy(
                                chequeNo = no, partyName = party, bankName = bank, amount = amt, direction = dir,
                                issueDate = ChequeDateUtils.formatToDisplayDate(issueIso),
                                dueDate = ChequeDateUtils.formatToDisplayDate(dueIso),
                                status = status, notes = notes
                            )
                            val idx = chequesList.indexOfFirst { it.id == editingCheque!!.id }
                            if (idx >= 0) chequesList[idx] = updated
                            toastMsg = "Cheque '$no' updated."
                        }.onFailure {
                            toastMsg = "Unable to update cheque. Please try again."
                        }
                    } else {
                        val res = supabaseClient.insertRecord("cheques", payload)
                        res.onSuccess { createdObj ->
                            val newId = createdObj.optString("id", System.currentTimeMillis().toString())
                            val newC = ChequeModel(
                                id = newId, chequeNo = no, partyName = party, bankName = bank, amount = amt, direction = dir,
                                issueDate = ChequeDateUtils.formatToDisplayDate(issueIso),
                                dueDate = ChequeDateUtils.formatToDisplayDate(dueIso),
                                status = status, notes = notes, createdDate = "Just now"
                            )
                            chequesList.add(0, newC)
                            toastMsg = "New cheque '$no' created."
                        }.onFailure {
                            toastMsg = "Unable to create cheque. Please try again."
                        }
                    }
                    showFormDialog = false
                }
            }
        )
    }

    // STATUS CHANGE CONFIRMATION DIALOG
    statusActionTarget?.let { (target, nextStatus) ->
        Dialog(onDismissRequest = { statusActionTarget = null }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text("Confirm Status Change", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Mark cheque #${target.chequeNo} (${target.partyName}) as $nextStatus?", fontSize = 14.sp, color = TextMuted)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Button(
                            onClick = { statusActionTarget = null },
                            colors = ButtonDefaults.buttonColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surfaceVariant, contentColor = TextPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    val isUuid = target.id.length == 36 && target.id.contains("-")
                                    val payload = JSONObject().apply { put("status", nextStatus) }
                                    val res = if (isUuid) supabaseClient.updateRecord("cheques", target.id, payload) else Result.success(Unit)
                                    res.onSuccess {
                                        val idx = chequesList.indexOfFirst { it.id == target.id }
                                        if (idx >= 0) {
                                            chequesList[idx] = chequesList[idx].copy(status = nextStatus)
                                        }
                                        toastMsg = "Cheque '${target.chequeNo}' marked as $nextStatus."
                                    }.onFailure {
                                        toastMsg = "Unable to update cheque status. Please try again."
                                    }
                                    statusActionTarget = null
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Confirm", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    // DELETE CONFIRMATION DIALOG
    deletingCheque?.let { target ->
        Dialog(onDismissRequest = { deletingCheque = null }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text("Delete Cheque?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Are you sure you want to delete cheque '${target.chequeNo}' (${target.partyName})?", fontSize = 14.sp, color = TextMuted)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Button(
                            onClick = { deletingCheque = null },
                            colors = ButtonDefaults.buttonColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surfaceVariant, contentColor = TextPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    val isUuid = target.id.length == 36 && target.id.contains("-")
                                    if (isUuid) {
                                        supabaseClient.deleteRecord("cheques", target.id)
                                    }
                                    chequesList.removeAll { it.id == target.id }
                                    toastMsg = "Cheque '${target.chequeNo}' deleted."
                                    deletingCheque = null
                                }
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
private fun MetricChip(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = color.copy(alpha = 0.1f),
        shape = RoundedCornerShape(10.dp)
    ) {
        Column(
            modifier = Modifier.padding(vertical = 8.dp, horizontal = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = color)
            Text(text = value, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = color)
        }
    }
}

@Composable
private fun MobileChequeCard(
    cheque: ChequeModel,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onClearStatus: () -> Unit,
    onBounceStatus: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = cheque.partyName,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Ref: ${cheque.chequeNo} • ${cheque.bankName}",
                        fontSize = 13.sp,
                        color = TextMuted
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                val badgeBg = when (cheque.status) {
                    "Cleared" -> Color(0xFFDCFCE7)
                    "Bounced" -> Color(0xFFFEF2F2)
                    else -> Color(0xFFFFEDD5)
                }
                val badgeText = when (cheque.status) {
                    "Cleared" -> Color(0xFF15803D)
                    "Bounced" -> ErrorRed
                    else -> Color(0xFFC2410C)
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(badgeBg)
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = cheque.status,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = badgeText
                    )
                }
            }

            HorizontalDivider(color = androidx.compose.material3.MaterialTheme.colorScheme.outline)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Issue: ${cheque.issueDate}",
                    fontSize = 13.sp,
                    color = TextMuted
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "₹${String.format("%.0f", cheque.amount)}",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = TextPrimary
                    )

                    Spacer(modifier = Modifier.width(10.dp))

                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(androidx.compose.material3.MaterialTheme.colorScheme.surfaceVariant)
                            .clickable { onEdit() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextPrimary, modifier = Modifier.size(15.dp))
                    }

                    Spacer(modifier = Modifier.width(6.dp))

                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFFEF2F2))
                            .clickable { onDelete() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete", tint = ErrorRed, modifier = Modifier.size(15.dp))
                    }
                }
            }

            if (cheque.status.equals("Pending", ignoreCase = true)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = onClearStatus,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF0FDF4), contentColor = Color(0xFF16A34A)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("✓ Clear", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = onBounceStatus,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEF2F2), contentColor = ErrorRed),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("✕ Bounce", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ChequeFormDialog(
    editingCheque: ChequeModel?,
    onDismiss: () -> Unit,
    onSave: (no: String, party: String, bank: String, amt: Double, dir: String, issue: String, due: String, status: String, notes: String) -> Unit
) {
    val context = LocalContext.current

    var chequeNo by remember { mutableStateOf(editingCheque?.chequeNo ?: "") }
    var partyName by remember { mutableStateOf(editingCheque?.partyName ?: "") }
    var bankName by remember { mutableStateOf(editingCheque?.bankName ?: "HDFC Bank") }
    var amount by remember { mutableStateOf(editingCheque?.amount?.toString() ?: "45000") }
    var direction by remember { mutableStateOf(editingCheque?.direction ?: "Inward") }
    var issueDateDisplay by remember { mutableStateOf(editingCheque?.issueDate?.ifBlank { "05 Sep 2026" } ?: "05 Sep 2026") }
    var dueDateDisplay by remember { mutableStateOf(editingCheque?.dueDate?.ifBlank { "05 Sep 2026" } ?: "05 Sep 2026") }
    var status by remember { mutableStateOf(editingCheque?.status ?: "Pending") }
    var notes by remember { mutableStateOf(editingCheque?.notes ?: "") }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    fun openDatePicker(initialDisplay: String, onSelected: (String) -> Unit) {
        val calendar = Calendar.getInstance()
        val iso = ChequeDateUtils.parseDisplayToIso(initialDisplay)
        val parts = iso.split("-")
        if (parts.size == 3) {
            val y = parts[0].toIntOrNull()
            val m = parts[1].toIntOrNull()?.minus(1)
            val d = parts[2].toIntOrNull()
            if (y != null && m != null && d != null) {
                calendar.set(y, m, d)
            }
        }
        val y = calendar.get(Calendar.YEAR)
        val m = calendar.get(Calendar.MONTH)
        val d = calendar.get(Calendar.DAY_OF_MONTH)

        DatePickerDialog(context, { _, selectedYear, selectedMonth, selectedDay ->
            val monthStr = String.format("%02d", selectedMonth + 1)
            val dayStr = String.format("%02d", selectedDay)
            val isoStr = "$selectedYear-$monthStr-$dayStr"
            val formatted = ChequeDateUtils.formatToDisplayDate(isoStr)
            onSelected(formatted)
            errorMsg = null
        }, y, m, d).show()
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (editingCheque != null) "Edit Cheque" else "Add New Cheque",
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
                    value = partyName,
                    onValueChange = { partyName = it; if (errorMsg != null) errorMsg = null },
                    placeholder = { Text("Party / Company Name *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = chequeNo,
                        onValueChange = { chequeNo = it },
                        placeholder = { Text("Cheque Ref No", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = amount,
                        onValueChange = { amount = it; if (errorMsg != null) errorMsg = null },
                        placeholder = { Text("Amount (₹) *", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                OutlinedTextField(
                    value = bankName,
                    onValueChange = { bankName = it },
                    placeholder = { Text("Bank Name", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                // DATE PICKER FIELDS ROW
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // ISSUE DATE PICKER
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .border(1.dp, Color(0xFFCBD5E1), RoundedCornerShape(10.dp))
                            .clickable { openDatePicker(issueDateDisplay) { issueDateDisplay = it } }
                            .padding(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(issueDateDisplay, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                            Icon(Icons.Default.DateRange, contentDescription = "Pick Issue Date", tint = PrimaryBlue, modifier = Modifier.size(18.dp))
                        }
                    }

                    // DUE DATE PICKER
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .border(1.dp, Color(0xFFCBD5E1), RoundedCornerShape(10.dp))
                            .clickable { openDatePicker(dueDateDisplay) { dueDateDisplay = it } }
                            .padding(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(dueDateDisplay, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                            Icon(Icons.Default.DateRange, contentDescription = "Pick Due Date", tint = PrimaryBlue, modifier = Modifier.size(18.dp))
                        }
                    }
                }

                Text("Status", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    listOf("Pending", "Cleared", "Bounced").forEach { st ->
                        RadioButton(
                            selected = status == st,
                            onClick = { status = st },
                            colors = RadioButtonDefaults.colors(selectedColor = PrimaryBlue)
                        )
                        Text(st, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Spacer(modifier = Modifier.width(6.dp))
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
                            val amtNum = amount.toDoubleOrNull()
                            if (partyName.isBlank() || amtNum == null || amtNum <= 0) {
                                errorMsg = "Party Name and valid Amount are required."
                            } else if (issueDateDisplay.isBlank()) {
                                errorMsg = "Issue Date is required."
                            } else if (!ChequeDateUtils.isDueDateValid(issueDateDisplay, dueDateDisplay)) {
                                errorMsg = "Due Date cannot be earlier than Issue Date."
                            } else {
                                onSave(chequeNo.trim(), partyName.trim(), bankName.trim(), amtNum, direction, issueDateDisplay.trim(), dueDateDisplay.trim(), status, notes.trim())
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (editingCheque != null) "Save Changes" else "Add Cheque", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
