package com.example.crm_app_kmp.ui.suppliers

import android.content.Intent
import android.net.Uri
import kotlinx.coroutines.launch
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
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
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
import com.example.crm_app_kmp.suppliers.SupplierModel
import com.example.crm_app_kmp.suppliers.SupplierRepository
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidSuppliersContent() {
    val context = LocalContext.current
    val supabaseClient = remember { com.example.crm_app_kmp.data.SupabaseAndroidClient(context) }
    val scope = androidx.compose.runtime.rememberCoroutineScope()
    val suppliers = remember { mutableStateListOf(*SupplierRepository.getSuppliers().toTypedArray()) }

    var searchQuery by remember { mutableStateOf("") }
    var selectedStatusFilter by remember { mutableStateOf("All") }

    var showFilterSheet by remember { mutableStateOf(false) }
    var showFormDialog by remember { mutableStateOf(false) }
    var editingSupplier by remember { mutableStateOf<SupplierModel?>(null) }
    var deletingSupplier by remember { mutableStateOf<SupplierModel?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    fun refreshSuppliers() {
        scope.launch {
            val res = supabaseClient.fetchTable("suppliers")
            res.onSuccess { array ->
                if (array.length() > 0) {
                    suppliers.clear()
                    for (i in 0 until array.length()) {
                        val obj = array.getJSONObject(i)
                        suppliers.add(
                            SupplierModel(
                                id = obj.optString("id", "SUP-00${i + 1}"),
                                partyName = obj.optString("name", obj.optString("party_name", "Supplier")),
                                contactPerson = obj.optString("company", obj.optString("contact_person", "")),
                                mobile = obj.optString("phone", obj.optString("mobile", "")),
                                email = obj.optString("email", ""),
                                address = obj.optString("area", obj.optString("address", "")),
                                paymentTerms = obj.optString("payment_terms", "Net 30 Days"),
                                photoUrl = obj.optString("photo_url", obj.optString("photo", "")),
                                status = obj.optString("status", "Active")
                            )
                        )
                    }
                }
            }
        }
    }

    androidx.compose.runtime.LaunchedEffect(Unit) {
        refreshSuppliers()
    }

    val filteredSuppliers = suppliers.filter { s ->
        val q = searchQuery.lowercase().trim()
        val matchesQuery = q.isEmpty() ||
                s.id.lowercase().contains(q) ||
                s.partyName.lowercase().contains(q) ||
                s.contactPerson.lowercase().contains(q) ||
                s.mobile.lowercase().contains(q) ||
                s.address.lowercase().contains(q)

        val matchesStatus = selectedStatusFilter.equals("All", ignoreCase = true) || s.status.equals(selectedStatusFilter, ignoreCase = true)

        matchesQuery && matchesStatus
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // SEARCH & FILTER BUTTON ROW
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search suppliers...", fontSize = 14.sp, color = TextMuted) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                )

                IconButton(
                    onClick = { showFilterSheet = true },
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (selectedStatusFilter != "All") PrimaryBlue.copy(alpha = 0.12f) else androidx.compose.material3.MaterialTheme.colorScheme.surface)
                        .border(1.dp, if (selectedStatusFilter != "All") PrimaryBlue else androidx.compose.material3.MaterialTheme.colorScheme.outline, RoundedCornerShape(12.dp))
                ) {
                    Icon(
                        Icons.Default.Tune,
                        contentDescription = "Filter",
                        tint = if (selectedStatusFilter != "All") PrimaryBlue else androidx.compose.material3.MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            // SECTION HEADING WITH TOTAL COUNT
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Supplier List",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                Text(
                    text = "${filteredSuppliers.size} Total",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted
                )
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

            // SUPPLIER CARDS LIST
            if (filteredSuppliers.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No suppliers found.", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(filteredSuppliers, key = { it.id }) { supplier ->
                        SupplierCard(
                            supplier = supplier,
                            onCall = {
                                try {
                                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${supplier.mobile}"))
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    toastMsg = "Call: ${supplier.mobile}"
                                }
                            },
                            onEdit = {
                                editingSupplier = supplier
                                showFormDialog = true
                            },
                            onDelete = {
                                deletingSupplier = supplier
                            }
                        )
                    }
                }
            }
        }

        // FLOATING "+" ADD BUTTON
        FloatingActionButton(
            onClick = {
                editingSupplier = null
                showFormDialog = true
            },
            containerColor = PrimaryBlue,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Supplier", modifier = Modifier.size(24.dp))
        }
    }

    // FILTER BOTTOM SHEET
    if (showFilterSheet) {
        ModalBottomSheet(
            onDismissRequest = { showFilterSheet = false },
            sheetState = rememberModalBottomSheetState()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Filter Suppliers", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Button(
                        onClick = {
                            selectedStatusFilter = "All"
                            showFilterSheet = false
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary)
                    ) {
                        Text("Reset Filter", fontSize = 12.sp)
                    }
                }

                HorizontalDivider()

                Text("Status", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("All", "Active", "Inactive").forEach { status ->
                        val isSelected = selectedStatusFilter == status
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(if (isSelected) PrimaryBlue else androidx.compose.material3.MaterialTheme.colorScheme.surfaceVariant)
                                .clickable { selectedStatusFilter = status }
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = status,
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) Color.White else androidx.compose.material3.MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = { showFilterSheet = false },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Apply Filter", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    // ADD / EDIT SUPPLIER DIALOG
    if (showFormDialog) {
        SupplierFormDialog(
            editingSupplier = editingSupplier,
            onDismiss = { showFormDialog = false },
            onSave = { partyName, contactPerson, mobile, email, address, status ->
                val jsonPayload = org.json.JSONObject().apply {
                    put("name", partyName)
                    put("company", contactPerson)
                    put("phone", mobile)
                    put("email", email)
                    put("area", address)
                    put("status", status)
                }
                scope.launch {
                    if (editingSupplier != null) {
                        val targetId = editingSupplier!!.id
                        val isUuid = targetId.matches(Regex("^[0-9a-fA-F-]{36}$"))
                        if (isUuid) {
                            supabaseClient.updateRecord("suppliers", targetId, jsonPayload)
                        }
                        toastMsg = "Supplier '$partyName' updated."
                    } else {
                        supabaseClient.insertRecord("suppliers", jsonPayload)
                        toastMsg = "New supplier '$partyName' added."
                    }
                    refreshSuppliers()
                }
                showFormDialog = false
            }
        )
    }

    // ADMIN 3-STEP DELETE CONFIRMATION DIALOG
    deletingSupplier?.let { target ->
        com.example.crm_app_kmp.ui.components.ThreeStepDeleteDialog(
            itemName = target.partyName,
            itemDetails = "ID: ${target.id}, Phone: ${target.mobile}",
            userRole = "ADMIN",
            onDismiss = { deletingSupplier = null },
            onConfirmDelete = {
                val isUuid = target.id.matches(Regex("^[0-9a-fA-F-]{36}$"))
                scope.launch {
                    if (isUuid) {
                        supabaseClient.deleteRecord("suppliers", target.id)
                    }
                    suppliers.removeAll { it.id == target.id }
                    toastMsg = "Supplier '${target.partyName}' deleted."
                    deletingSupplier = null
                }
            }
        )
    }
}

@Composable
private fun SupplierCard(
    supplier: SupplierModel,
    onCall: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val isActive = supplier.status.equals("Active", ignoreCase = true)
    val statusBg = if (isActive) Color(0xFFDCFCE7) else Color(0xFFF1F5F9)
    val statusText = if (isActive) Color(0xFF15803D) else Color(0xFF64748B)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // HEADER: PARTY NAME & STATUS BADGE
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = supplier.partyName,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    modifier = Modifier.weight(1f)
                )

                Spacer(modifier = Modifier.width(8.dp))

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(statusBg)
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = supplier.status,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = statusText
                    )
                }
            }

            // CONTACT PERSON
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Person,
                    contentDescription = null,
                    tint = TextMuted,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = supplier.contactPerson,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
            }

            // MOBILE NUMBER
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Phone,
                    contentDescription = null,
                    tint = TextMuted,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = supplier.mobile,
                    fontSize = 14.sp,
                    color = TextMuted
                )
            }

            // ADDRESS (IF AVAILABLE)
            if (supplier.address.isNotBlank()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = TextMuted,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = supplier.address,
                        fontSize = 13.sp,
                        color = TextMuted
                    )
                }
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            // ACTIONS: CALL, EDIT, DELETE
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = onCall,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEFF6FF), contentColor = PrimaryBlue),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.height(36.dp)
                ) {
                    Icon(Icons.Default.Call, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Call", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = onEdit,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.height(36.dp)
                ) {
                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Edit", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = onDelete,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEF2F2), contentColor = ErrorRed),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.height(36.dp)
                ) {
                    Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Delete", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun SupplierFormDialog(
    editingSupplier: SupplierModel?,
    onDismiss: () -> Unit,
    onSave: (
        partyName: String,
        contactPerson: String,
        mobile: String,
        email: String,
        address: String,
        status: String
    ) -> Unit
) {
    var partyName by remember { mutableStateOf(editingSupplier?.partyName ?: "") }
    var contactPerson by remember { mutableStateOf(editingSupplier?.contactPerson ?: "") }
    var mobile by remember { mutableStateOf(editingSupplier?.mobile ?: "") }
    var email by remember { mutableStateOf(editingSupplier?.email ?: "") }
    var paymentTerms by remember { mutableStateOf("Net 30 Days") }
    var address by remember { mutableStateOf(editingSupplier?.address ?: "") }
    var status by remember { mutableStateOf(editingSupplier?.status ?: "Active") }
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
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (editingSupplier != null) "Edit Supplier" else "Add New Supplier",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                errorMsg?.let { err ->
                    Surface(
                        color = Color(0xFFFEF2F2),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "⚠️ $err",
                            color = ErrorRed,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }

                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.weight(1f, fill = false)
                ) {
                    item {
                        com.example.crm_app_kmp.ui.components.AppTextField(
                            value = partyName,
                            onValueChange = { partyName = it; errorMsg = null },
                            label = "Supplier / Party Name",
                            placeholder = "e.g. Acme Global Supplies",
                            isRequired = true
                        )
                    }
                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(modifier = Modifier.weight(1f)) {
                                com.example.crm_app_kmp.ui.components.AppTextField(
                                    value = contactPerson,
                                    onValueChange = { contactPerson = it },
                                    label = "Contact Person",
                                    placeholder = "Jane Doe"
                                )
                            }
                            Box(modifier = Modifier.weight(1f)) {
                                com.example.crm_app_kmp.ui.components.AppPhoneField(
                                    value = mobile,
                                    onValueChange = { mobile = it },
                                    label = "Mobile Number",
                                    placeholder = "9876543210"
                                )
                            }
                        }
                    }
                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(modifier = Modifier.weight(1f)) {
                                com.example.crm_app_kmp.ui.components.AppEmailField(
                                    value = email,
                                    onValueChange = { email = it },
                                    label = "Email Address",
                                    placeholder = "jane@acme.com"
                                )
                            }
                            Box(modifier = Modifier.weight(1f)) {
                                com.example.crm_app_kmp.ui.components.AppDropdown(
                                    value = paymentTerms,
                                    onValueChange = { paymentTerms = it },
                                    label = "Payment Terms",
                                    options = listOf("Net 15 Days", "Net 30 Days", "Net 45 Days", "Advance / Cash")
                                )
                            }
                        }
                    }
                    item {
                        com.example.crm_app_kmp.ui.components.AppTextField(
                            value = address,
                            onValueChange = { address = it },
                            label = "Address / Facility Location",
                            placeholder = "Industrial Area, Phase 2"
                        )
                    }
                    item {
                        com.example.crm_app_kmp.ui.components.AppDropdown(
                            value = status,
                            onValueChange = { status = it },
                            label = "Status",
                            options = listOf("Active", "Inactive"),
                            isRequired = true
                        )
                    }
                    item {
                        com.example.crm_app_kmp.ui.components.AppFormButton(
                            text = if (editingSupplier != null) "Save Changes" else "Add Supplier",
                            onClick = {
                                if (partyName.isBlank()) {
                                    errorMsg = "Party / Supplier Name is required"
                                    return@AppFormButton
                                }
                                onSave(
                                    partyName.trim(),
                                    contactPerson.trim().ifEmpty { "Contact Person" },
                                    mobile.trim(),
                                    email.trim(),
                                    address.trim(),
                                    status
                                )
                            }
                        )
                    }
                }
            }
        }
    }
}

