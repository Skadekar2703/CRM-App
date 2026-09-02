package com.example.crm_app_kmp.ui.cheques

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
import com.example.crm_app_kmp.cheques.ChequeModel
import com.example.crm_app_kmp.cheques.ChequeRepository
import com.example.crm_app_kmp.ui.components.CrmRootScaffold
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

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
    val chequesList = remember { mutableStateListOf(*ChequeRepository.getCheques().toTypedArray()) }
    var searchQuery by remember { mutableStateOf("") }
    var statusFilter by remember { mutableStateOf("All") }

    var showFormDialog by remember { mutableStateOf(false) }
    var editingCheque by remember { mutableStateOf<ChequeModel?>(null) }
    var deletingCheque by remember { mutableStateOf<ChequeModel?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

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

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // SCREEN TITLE (MOBILE REF)
            Text(
                text = "Cheques",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            // SEARCH & FILTER ROW (MOBILE REF)
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

                // FILTER BUTTON
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.White)
                        .border(1.dp, Color(0xFFCBD5E1), RoundedCornerShape(12.dp))
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

            // VERTICAL CHEQUE CARDS LIST (MOBILE REF)
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
                    verticalArrangement = Arrangement.spacedBy(14.dp)
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
                            }
                        )
                    }
                }
            }
        }

        // FLOATING ACTION BUTTON (+)
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
                if (editingCheque != null) {
                    val updated = ChequeRepository.updateCheque(editingCheque!!.id, no, party, bank, amt, dir, issue, due, status, notes)
                    if (updated != null) {
                        val idx = chequesList.indexOfFirst { it.id == editingCheque!!.id }
                        if (idx >= 0) chequesList[idx] = updated
                        toastMsg = "Cheque '$no' updated."
                    }
                } else {
                    val newC = ChequeRepository.addCheque(no, party, bank, amt, dir, issue, due, status, notes)
                    chequesList.add(0, newC)
                    toastMsg = "New cheque '$no' created."
                }
                showFormDialog = false
            }
        )
    }

    // DELETE CONFIRMATION DIALOG
    deletingCheque?.let { target ->
        Dialog(onDismissRequest = { deletingCheque = null }) {
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
                    Text("Delete Cheque?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Are you sure you want to delete cheque '${target.chequeNo}' (${target.partyName})?", fontSize = 14.sp, color = TextMuted)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Button(
                            onClick = { deletingCheque = null },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                ChequeRepository.deleteCheque(target.id)
                                chequesList.removeAll { it.id == target.id }
                                toastMsg = "Cheque '${target.chequeNo}' deleted."
                                deletingCheque = null
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
private fun MobileChequeCard(
    cheque: ChequeModel,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
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
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Ref: ${cheque.chequeNo}",
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

            HorizontalDivider(color = Color(0xFFF1F5F9))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Date: ${cheque.issueDate}",
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
                            .background(Color(0xFFF1F5F9))
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
        }
    }
}

@Composable
private fun ChequeFormDialog(
    editingCheque: ChequeModel?,
    onDismiss: () -> Unit,
    onSave: (no: String, party: String, bank: String, amt: Double, dir: String, issue: String, due: String, status: String, notes: String) -> Unit
) {
    var chequeNo by remember { mutableStateOf(editingCheque?.chequeNo ?: "") }
    var partyName by remember { mutableStateOf(editingCheque?.partyName ?: "") }
    var bankName by remember { mutableStateOf(editingCheque?.bankName ?: "HDFC Bank") }
    var amount by remember { mutableStateOf(editingCheque?.amount?.toString() ?: "45000") }
    var direction by remember { mutableStateOf(editingCheque?.direction ?: "Inward") }
    var issueDate by remember { mutableStateOf(editingCheque?.issueDate ?: "Oct 12, 2023") }
    var dueDate by remember { mutableStateOf(editingCheque?.dueDate ?: "Oct 25, 2023") }
    var status by remember { mutableStateOf(editingCheque?.status ?: "Pending") }
    var notes by remember { mutableStateOf(editingCheque?.notes ?: "") }
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

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = bankName,
                        onValueChange = { bankName = it },
                        placeholder = { Text("Bank Name", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = issueDate,
                        onValueChange = { issueDate = it },
                        placeholder = { Text("Issue Date", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
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
                            } else {
                                onSave(chequeNo.trim(), partyName.trim(), bankName.trim(), amtNum, direction, issueDate.trim(), dueDate.trim(), status, notes.trim())
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
