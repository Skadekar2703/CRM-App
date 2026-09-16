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
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import com.example.crm_app_kmp.data.SupabaseAndroidClient
import com.example.crm_app_kmp.supplierledger.SupplierLedgerEntry
import com.example.crm_app_kmp.supplierledger.SupplierLedgerHeaderSummary
import com.example.crm_app_kmp.supplierledger.SupplierLedgerRepository
import com.example.crm_app_kmp.supplierledger.SupplierOverview
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary
import kotlinx.coroutines.launch
import org.json.JSONObject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidSupplierLedgerContent() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val supabaseClient = remember { SupabaseAndroidClient(context) }

    val entries = remember { mutableStateListOf<SupplierLedgerEntry>() }
    val suppliers = remember { mutableStateListOf<Pair<String, String>>() }

    var isLoadingSuppliers by remember { mutableStateOf(false) }
    var suppliersError by remember { mutableStateOf<String?>(null) }

    var selectedSupplierId by remember { mutableStateOf<String?>(null) }
    var searchQuery by remember { mutableStateOf("") }
    var showFormDialog by remember { mutableStateOf(false) }
    var editingEntry by remember { mutableStateOf<SupplierLedgerEntry?>(null) }
    var deletingEntry by remember { mutableStateOf<SupplierLedgerEntry?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    fun refreshSuppliers() {
        scope.launch {
            isLoadingSuppliers = true
            suppliersError = null
            val res = supabaseClient.fetchTable("suppliers")
            res.onSuccess { array ->
                suppliers.clear()
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val id = obj.optString("id", "SUP-00${i + 1}")
                    val name = obj.optString("name", obj.optString("party_name", "Supplier"))
                    suppliers.add(Pair(id, name))
                }
            }.onFailure { err ->
                suppliersError = err.message ?: "Unable to load suppliers"
            }
            isLoadingSuppliers = false
        }
    }

    fun refreshLedger() {
        scope.launch {
            val res = supabaseClient.fetchTable("supplier_ledger")
            res.onSuccess { array ->
                entries.clear()
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    entries.add(
                        SupplierLedgerEntry(
                            id = obj.optString("id", "SLE-${100 + i}"),
                            supplierId = obj.optString("supplier_id", "SUP-101"),
                            supplierName = obj.optString("supplier_name", "Supplier"),
                            date = obj.optString("date", "29 Aug 2026"),
                            transactionType = obj.optString("transaction_type", "Purchase"),
                            amount = obj.optDouble("amount", 0.0),
                            reference = obj.optString("reference", ""),
                            paymentMode = obj.optString("payment_mode", "Cash"),
                            description = obj.optString("notes", obj.optString("description", "")),
                            runningBalance = obj.optDouble("running_balance", 0.0),
                            createdAt = obj.optString("created_at", "2026-08-29")
                        )
                    )
                }
            }
        }
    }

    LaunchedEffect(Unit) {
        refreshSuppliers()
        refreshLedger()
    }

    val overviews = remember(suppliers.toList(), entries.toList()) {
        suppliers.map { (supId, supName) ->
            val supEntries = entries.filter { it.supplierId == supId }
            val opening = supEntries.filter { it.transactionType == "Opening Balance" }.sumOf { it.amount }
            val purchases = supEntries.filter { it.transactionType == "Purchase" }.sumOf { it.amount }
            val paid = supEntries.filter { it.transactionType == "Payment" }.sumOf { it.amount }
            val returns = supEntries.filter { it.transactionType == "Return" }.sumOf { it.amount }
            val payable = maxOf(0.0, (opening + purchases) - (paid + returns))
            SupplierOverview(
                supplierId = supId,
                supplierName = supName,
                opening = opening,
                purchases = purchases,
                paid = paid,
                returns = returns,
                payable = payable
            )
        }
    }

    val headerSummary = remember(overviews) {
        val totalPayable = overviews.sumOf { it.payable }
        SupplierLedgerHeaderSummary(
            totalPayable = totalPayable,
            supplierCount = overviews.size
        )
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
                    modifier = Modifier.weight(1f).height(94.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, androidx.compose.material3.MaterialTheme.colorScheme.outline)
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize().padding(12.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("TOTAL PAYABLE (WE OWE)", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                        Text("₹${String.format("%.2f", headerSummary.totalPayable)}", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                        Text("Amount owed to suppliers", fontSize = 10.5.sp, color = TextMuted)
                    }
                }

                // SUPPLIERS COUNT
                Card(
                    modifier = Modifier.weight(1f).height(94.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, androidx.compose.material3.MaterialTheme.colorScheme.outline)
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize().padding(12.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("SUPPLIERS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        Text("${headerSummary.supplierCount}", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                        Text("Total registered", fontSize = 10.5.sp, color = TextMuted)
                    }
                }
            }

            // SEARCH BAR & SELECTOR
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search supplier...", fontSize = 13.sp) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = TextMuted) },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                )

                if (selectedSupplierId != null) {
                    Button(
                        onClick = { selectedSupplierId = null },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE2E8F0), contentColor = TextPrimary),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Overview Mode", fontSize = 12.sp)
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

            // MAIN CONTENT VIEW
            if (selectedSupplierId == null) {
                // ALL SUPPLIERS OVERVIEW LIST
                if (filteredOverviews.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No supplier ledger activity found.", color = TextMuted, fontSize = 14.sp)
                    }
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(filteredOverviews, key = { it.supplierId }) { overview ->
                            SupplierOverviewCard(
                                overview = overview,
                                onClick = { selectedSupplierId = overview.supplierId }
                            )
                        }
                    }
                }
            } else {
                // SPECIFIC SUPPLIER DETAILED LEDGER
                val selectedSupName = suppliers.find { it.first == selectedSupplierId }?.second ?: "Supplier"

                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(onClick = { selectedSupplierId = null }) {
                                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                            }
                            Column {
                                Text(selectedSupName, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text("ID: $selectedSupplierId", fontSize = 12.sp, color = TextMuted)
                            }
                        }
                    }

                    if (selectedSupplierEntries.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(40.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No entries recorded for $selectedSupName.", color = TextMuted, fontSize = 14.sp)
                        }
                    } else {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(selectedSupplierEntries, key = { it.id }) { entry ->
                                LedgerEntryCard(
                                    entry = entry,
                                    onEdit = {
                                        editingEntry = entry
                                        refreshSuppliers()
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

        // FLOATING ADD LEDGER ENTRY BUTTON
        FloatingActionButton(
            onClick = {
                refreshSuppliers()
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
            isLoadingSuppliers = isLoadingSuppliers,
            suppliersError = suppliersError,
            onDismiss = { showFormDialog = false },
            onSave = { supId, supName, date, type, amt, ref, mode, desc ->
                scope.launch {
                    val payload = JSONObject().apply {
                        put("supplier_id", supId)
                        put("supplier_name", supName)
                        put("date", date)
                        put("transaction_type", type)
                        put("amount", amt)
                        put("reference", ref)
                        put("payment_mode", mode)
                        put("notes", desc)
                    }

                    if (editingEntry != null) {
                        supabaseClient.updateRecord("supplier_ledger", editingEntry!!.id, payload)
                        toastMsg = "Ledger entry for '$supName' updated."
                    } else {
                        supabaseClient.insertRecord("supplier_ledger", payload)
                        toastMsg = "Ledger entry for '$supName' recorded."
                    }

                    refreshLedger()
                    showFormDialog = false
                }
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
                                scope.launch {
                                    supabaseClient.deleteRecord("supplier_ledger", target.id)
                                    refreshLedger()
                                    toastMsg = "Entry deleted."
                                    deletingEntry = null
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
private fun SupplierOverviewCard(
    overview: SupplierOverview,
    onClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(12.dp))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(overview.supplierName, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
                    val shortId = if (overview.supplierId.length > 16) "${overview.supplierId.take(8)}...${overview.supplierId.takeLast(4)}" else overview.supplierId
                    Text("ID: $shortId", fontSize = 11.sp, color = TextMuted)
                }

                Surface(
                    color = if (overview.payable > 0) Color(0xFFFEF2F2) else Color(0xFFF1F5F9),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = if (overview.payable > 0) "Payable: ₹${String.format("%.2f", overview.payable)}" else "Settled",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (overview.payable > 0) Color(0xFFDC2626) else TextMuted,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Purchases: ₹${String.format("%.0f", overview.purchases)}", fontSize = 12.sp, color = TextMuted)
                Text("Paid: ₹${String.format("%.0f", overview.paid)}", fontSize = 12.sp, color = Color(0xFF16A34A))
                Text("Returns: ₹${String.format("%.0f", overview.returns)}", fontSize = 12.sp, color = TextMuted)
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
    val isPurchase = entry.transactionType.equals("Purchase", ignoreCase = true)
    val isPayment = entry.transactionType.equals("Payment", ignoreCase = true)
    val badgeColor = when {
        isPurchase -> Color(0xFFEFF6FF)
        isPayment -> Color(0xFFF0FDF4)
        else -> Color(0xFFFFF7ED)
    }
    val badgeTextColor = when {
        isPurchase -> PrimaryBlue
        isPayment -> Color(0xFF16A34A)
        else -> Color(0xFFEA580C)
    }

    Card(
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(10.dp))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Surface(color = badgeColor, shape = RoundedCornerShape(4.dp)) {
                        Text(
                            text = entry.transactionType,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = badgeTextColor,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                    Text(entry.date, fontSize = 12.sp, color = TextMuted)
                }

                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "₹${String.format("%.2f", entry.amount)}",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isPayment) Color(0xFF16A34A) else TextPrimary
                )

                if (entry.reference.isNotBlank()) {
                    Text("Ref: ${entry.reference}", fontSize = 11.sp, color = TextMuted)
                }
                if (entry.description.isNotBlank()) {
                    Text(entry.description, fontSize = 11.sp, color = TextMuted)
                }
            }

            Row {
                IconButton(onClick = onEdit) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextMuted, modifier = Modifier.size(16.dp))
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = ErrorRed, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}

@Composable
private fun SupplierLedgerFormDialog(
    editingEntry: SupplierLedgerEntry?,
    suppliers: List<Pair<String, String>>,
    isLoadingSuppliers: Boolean,
    suppliersError: String?,
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
    var selectedSupId by remember { mutableStateOf(editingEntry?.supplierId ?: suppliers.firstOrNull()?.first ?: "") }
    var dropdownExpanded by remember { mutableStateOf(false) }

    var date by remember { mutableStateOf(editingEntry?.date ?: "29 Aug 2026") }
    var transactionType by remember { mutableStateOf(editingEntry?.transactionType ?: "Purchase") }
    var amountStr by remember { mutableStateOf(editingEntry?.amount?.let { "$it" } ?: "") }
    var reference by remember { mutableStateOf(editingEntry?.reference ?: "") }
    var paymentMode by remember { mutableStateOf(editingEntry?.paymentMode ?: "Cash") }
    var description by remember { mutableStateOf(editingEntry?.description ?: "") }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    val selectedSupplier = suppliers.find { it.first == selectedSupId }
    val dropdownLabel = when {
        isLoadingSuppliers -> "Loading suppliers..."
        suppliersError != null -> "Unable to load suppliers"
        suppliers.isEmpty() -> "No suppliers available"
        selectedSupplier != null -> "${selectedSupplier.second} (${selectedSupplier.first.take(8)})"
        else -> "Select Supplier *"
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

                // SUPPLIER DROPDOWN
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = dropdownLabel,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Select Supplier *", fontSize = 13.sp) },
                        trailingIcon = {
                            Icon(Icons.Default.ArrowDropDown, contentDescription = "Dropdown")
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(enabled = !isLoadingSuppliers && suppliers.isNotEmpty()) {
                                dropdownExpanded = true
                            },
                        enabled = false,
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledTextColor = TextPrimary,
                            disabledBorderColor = Color(0xFFCBD5E1),
                            disabledLabelColor = TextMuted
                        ),
                        shape = RoundedCornerShape(10.dp)
                    )

                    DropdownMenu(
                        expanded = dropdownExpanded,
                        onDismissRequest = { dropdownExpanded = false },
                        modifier = Modifier.fillMaxWidth(0.85f)
                    ) {
                        suppliers.forEach { (supId, supName) ->
                            DropdownMenuItem(
                                text = { Text("$supName ($supId)", fontSize = 14.sp) },
                                onClick = {
                                    selectedSupId = supId
                                    dropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = date,
                    onValueChange = { date = it },
                    label = { Text("Date *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = transactionType,
                    onValueChange = { transactionType = it },
                    label = { Text("Type (Purchase, Payment, Return...)", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = amountStr,
                    onValueChange = { amountStr = it },
                    label = { Text("Amount (₹) *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = reference,
                    onValueChange = { reference = it },
                    label = { Text("Reference / Invoice No.", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description / Remarks", fontSize = 13.sp) },
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
                            if (selectedSupId.isBlank()) {
                                errorMsg = "Supplier is required."
                            } else if (date.isBlank()) {
                                errorMsg = "Date is required."
                            } else if (amt == null || amt < 0) {
                                errorMsg = "Valid Amount is required."
                            } else {
                                val matchedSupName = suppliers.find { it.first == selectedSupId }?.second ?: "Supplier"
                                onSave(selectedSupId, matchedSupName, date.trim(), transactionType, amt, reference.trim(), paymentMode, description.trim())
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                        shape = RoundedCornerShape(8.dp),
                        enabled = !isLoadingSuppliers && suppliers.isNotEmpty()
                    ) {
                        Text(if (editingEntry != null) "Save Changes" else "Save Entry", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
