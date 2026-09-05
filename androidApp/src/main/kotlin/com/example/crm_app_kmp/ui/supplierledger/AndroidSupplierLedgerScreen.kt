package com.example.crm_app_kmp.ui.supplierledger

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
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Search
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.crm_app_kmp.supplierledger.SupplierLedgerEntry
import com.example.crm_app_kmp.supplierledger.SupplierLedgerRepository
import com.example.crm_app_kmp.supplierledger.SupplierOverview
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidSupplierLedgerContent() {
    val entries = remember { mutableStateListOf(*SupplierLedgerRepository.getAllEntries().toTypedArray()) }
    val suppliers = remember { SupplierLedgerRepository.getSuppliers() }

    var selectedSupplierId by remember { mutableStateOf<String?> (null) }
    var searchQuery by remember { mutableStateOf("") }
    var showFormDialog by remember { mutableStateOf(false) }
    var editingEntry by remember { mutableStateOf<SupplierLedgerEntry?>(null) }
    var deletingEntry by remember { mutableStateOf<SupplierLedgerEntry?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    val overviews = remember(entries.toList()) {
        SupplierLedgerRepository.calculateSupplierOverview()
    }

    val headerSummary = remember(overviews) {
        SupplierLedgerRepository.getHeaderSummary()
    }

    val filteredOverviews = overviews.filter { s ->
        val q = searchQuery.lowercase().trim()
        q.isEmpty() || s.supplierName.lowercase().contains(q) || s.supplierId.lowercase().contains(q)
    }

    val selectedSupplierEntries = remember(entries.toList(), selectedSupplierId) {
        if (selectedSupplierId == null) emptyList()
        else entries.filter { it.supplierId == selectedSupplierId }
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
                // TOTAL PAYABLE (WE OWE)
                Card(
                    modifier = Modifier.weight(1.2f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("TOTAL PAYABLE", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("₹${headerSummary.totalPayable.toInt()}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                        Text("We owe suppliers", fontSize = 10.sp, color = TextMuted)
                    }
                }

                // SUPPLIERS COUNT
                Card(
                    modifier = Modifier.weight(0.9f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("SUPPLIERS", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("${headerSummary.supplierCount}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        Text("Active entries", fontSize = 10.sp, color = TextMuted)
                    }
                }
            }

            // PICK SUPPLIER / SEARCH ROW
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                if (selectedSupplierId != null) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFE2E8F0))
                            .clickable { selectedSupplierId = null }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back to Overview", tint = TextPrimary, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("All Suppliers", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    }
                } else {
                    Text("All Suppliers — Payable Overview", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFF16A34A))
                        .clickable {
                            editingEntry = null
                            showFormDialog = true
                        }
                        .padding(horizontal = 12.dp, vertical = 7.dp)
                ) {
                    Text("+ Add Entry", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }

            // SEARCH BAR
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search supplier name or ID...", fontSize = 14.sp, color = TextMuted) },
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

            // CONTENT LIST
            if (selectedSupplierId == null) {
                /* ALL SUPPLIERS OVERVIEW LIST */
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(filteredOverviews, key = { it.supplierId }) { overview ->
                        SupplierOverviewCard(
                            overview = overview,
                            onViewLedger = { selectedSupplierId = overview.supplierId }
                        )
                    }
                }
            } else {
                /* SUPPLIER SPECIFIC TRANSACTIONS LIST */
                val currentSupName = suppliers.find { it.first == selectedSupplierId }?.second ?: "Supplier"
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Detailed Ledger for $currentSupName",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryBlue,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )

                    if (selectedSupplierEntries.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(30.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No transactions for this supplier.", color = TextMuted, fontSize = 14.sp)
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(selectedSupplierEntries, key = { it.id }) { entry ->
                                LedgerEntryCard(
                                    entry = entry,
                                    onEdit = {
                                        editingEntry = entry
                                        showFormDialog = true
                                    },
                                    onDelete = { deletingEntry = entry }
                                )
                            }
                        }
                    }
                }
            }
        }

        // FAB ADD BUTTON
        FloatingActionButton(
            onClick = {
                editingEntry = null
                showFormDialog = true
            },
            containerColor = Color(0xFF16A34A),
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Entry", modifier = Modifier.size(24.dp))
        }
    }

    // ADD / EDIT FORM DIALOG
    if (showFormDialog) {
        SupplierLedgerFormDialog(
            editingEntry = editingEntry,
            suppliers = suppliers,
            onDismiss = { showFormDialog = false },
            onSave = { supId, supName, date, type, amt, ref, mode, desc ->
                if (editingEntry != null) {
                    val updated = SupplierLedgerRepository.updateLedgerEntry(
                        id = editingEntry!!.id,
                        date = date,
                        transactionType = type,
                        amount = amt,
                        reference = ref,
                        paymentMode = mode,
                        description = desc
                    )
                    if (updated != null) {
                        val idx = entries.indexOfFirst { it.id == editingEntry!!.id }
                        if (idx >= 0) entries[idx] = updated
                        toastMsg = "Ledger entry for '$supName' updated."
                    }
                } else {
                    val newE = SupplierLedgerRepository.addLedgerEntry(
                        supplierId = supId,
                        supplierName = supName,
                        date = date,
                        transactionType = type,
                        amount = amt,
                        reference = ref,
                        paymentMode = mode,
                        description = desc
                    )
                    entries.add(0, newE)
                    toastMsg = "Ledger entry for '$supName' recorded."
                }
                showFormDialog = false
            }
        )
    }

    // DELETE CONFIRMATION DIALOG
    deletingEntry?.let { target ->
        Dialog(onDismissRequest = { deletingEntry = null }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("Delete Ledger Entry?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Delete entry for '${target.supplierName}' (₹${target.amount})?", fontSize = 14.sp, color = TextMuted)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Button(
                            onClick = { deletingEntry = null },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                SupplierLedgerRepository.deleteLedgerEntry(target.id)
                                entries.removeAll { it.id == target.id }
                                toastMsg = "Entry deleted."
                                deletingEntry = null
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
private fun SupplierOverviewCard(
    overview: SupplierOverview,
    onViewLedger: () -> Unit
) {
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
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(overview.supplierName, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("ID: ${overview.supplierId}", fontSize = 12.sp, color = TextMuted)
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text("PAYABLE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                    Text("₹${overview.payable.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = if (overview.payable > 0) ErrorRed else Color(0xFF16A34A))
                }
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Opening: ₹${overview.opening.toInt()}", fontSize = 12.sp, color = TextMuted)
                Text("Purchases: ₹${overview.purchases.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = PrimaryBlue)
                Text("Paid: ₹${overview.paid.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF16A34A))
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFFEFF6FF))
                        .clickable { onViewLedger() }
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text("View Ledger →", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                }
            }
        }
    }
}

@Composable
private fun LedgerEntryCard(
    entry: SupplierLedgerEntry,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(entry.date, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (entry.transactionType == "Payment") Color(0xFFDCFCE7) else Color(0xFFEFF6FF))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(entry.transactionType, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (entry.transactionType == "Payment") Color(0xFF16A34A) else PrimaryBlue)
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Ref: ${entry.reference.ifBlank { "—" }}", fontSize = 12.sp, color = TextMuted)
                Text("₹${entry.amount.toInt()}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = if (entry.transactionType == "Payment") Color(0xFF16A34A) else TextPrimary)
            }

            if (entry.description.isNotBlank()) {
                Text(entry.description, fontSize = 12.sp, color = TextMuted)
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
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
private fun SupplierLedgerFormDialog(
    editingEntry: SupplierLedgerEntry?,
    suppliers: List<Pair<String, String>>,
    onDismiss: () -> Unit,
    onSave: (
        supplierId: String,
        supplierName: String,
        date: String,
        transactionType: String,
        amount: Double,
        reference: String,
        paymentMode: String,
        description: String
    ) -> Unit
) {
    var selectedSupId by remember { mutableStateOf(editingEntry?.supplierId ?: suppliers.firstOrNull()?.first ?: "SUP-101") }
    var date by remember { mutableStateOf(editingEntry?.date ?: "29 Aug 2026") }
    var transactionType by remember { mutableStateOf(editingEntry?.transactionType ?: "Purchase") }
    var amountStr by remember { mutableStateOf(editingEntry?.amount?.let { "$it" } ?: "") }
    var reference by remember { mutableStateOf(editingEntry?.reference ?: "") }
    var paymentMode by remember { mutableStateOf(editingEntry?.paymentMode ?: "Cash") }
    var description by remember { mutableStateOf(editingEntry?.description ?: "") }
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
                        text = if (editingEntry != null) "Edit Ledger Entry" else "Add Supplier Ledger Entry",
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
                    value = date,
                    onValueChange = { date = it },
                    placeholder = { Text("Date *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = transactionType,
                    onValueChange = { transactionType = it },
                    placeholder = { Text("Type (Purchase, Payment, Return...)", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = amountStr,
                    onValueChange = { amountStr = it },
                    placeholder = { Text("Amount (₹) *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = reference,
                    onValueChange = { reference = it },
                    placeholder = { Text("Reference / Invoice No.", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    placeholder = { Text("Description / Remarks", fontSize = 13.sp) },
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
                            val amt = amountStr.toDoubleOrNull()
                            if (date.isBlank()) {
                                errorMsg = "Date is required."
                            } else if (amt == null || amt < 0) {
                                errorMsg = "Valid Amount is required."
                            } else {
                                val matchedSupName = suppliers.find { it.first == selectedSupId }?.second ?: "Supplier"
                                onSave(selectedSupId, matchedSupName, date.trim(), transactionType, amt, reference.trim(), paymentMode, description.trim())
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (editingEntry != null) "Save Changes" else "Save Entry", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
