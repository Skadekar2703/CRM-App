package com.example.crm_app_kmp.ui.customers

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintManager
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.SubcomposeAsyncImage
import coil.request.ImageRequest
import com.example.crm_app_kmp.customers.CustomerDetailsModel
import com.example.crm_app_kmp.customers.CustomerTxn
import com.example.crm_app_kmp.customers.CustomerValidator
import kotlinx.coroutines.launch

// DYNAMIC CRM THEME COLORS (Material 3 Adaptive)
private val DarkBg: Color @Composable get() = MaterialTheme.colorScheme.background
private val DarkCardBg: Color @Composable get() = MaterialTheme.colorScheme.surface
private val DarkBorder: Color @Composable get() = MaterialTheme.colorScheme.outline
private val PrimaryBlue: Color @Composable get() = MaterialTheme.colorScheme.primary
private val AccentBlue = Color(0xFF2563EB)
private val BakiRed = Color(0xFFEF4444)
private val JamaGreen = Color(0xFF22C55E)
private val CibilOrange = Color(0xFFF97316)
private val CibilYellow = Color(0xFFEAB308)
private val TextWhite: Color @Composable get() = MaterialTheme.colorScheme.onSurface
private val TextMuted: Color @Composable get() = MaterialTheme.colorScheme.onSurfaceVariant

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidCustomersContent() {
    val context = LocalContext.current
    val supabaseClient = remember { com.example.crm_app_kmp.data.SupabaseAndroidClient(context) }
    val scope = rememberCoroutineScope()

    val customers = remember { mutableStateListOf<CustomerDetailsModel>() }
    var isLoading by remember { mutableStateOf(true) }

    var searchQuery by remember { mutableStateOf("") }
    var areaFilter by remember { mutableStateOf("All") }
    var cibilFilter by remember { mutableStateOf("All") }
    var statusFilter by remember { mutableStateOf("All") }

    var showFormDialog by remember { mutableStateOf(false) }
    var editingCustomer by remember { mutableStateOf<CustomerDetailsModel?>(null) }
    var profileCustomer by remember { mutableStateOf<CustomerDetailsModel?>(null) }
    var historyCustomer by remember { mutableStateOf<CustomerDetailsModel?>(null) }
    var deletingCustomer by remember { mutableStateOf<CustomerDetailsModel?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }
    var userRole by remember { mutableStateOf("STAFF") }

    fun refreshCustomers() {
        scope.launch {
            isLoading = true
            val res = supabaseClient.fetchCustomers()
            isLoading = false
            res.onSuccess { list ->
                customers.clear()
                customers.addAll(list)
            }
        }
    }

    LaunchedEffect(Unit) {
        refreshCustomers()
        scope.launch {
            userRole = supabaseClient.getUserRole()
        }
    }

    val filteredCustomers = customers.filter { c ->
        val q = searchQuery.lowercase().trim()
        val matchesQuery = q.isEmpty() ||
                c.id.lowercase().contains(q) ||
                c.customerId.lowercase().contains(q) ||
                c.customerCode.lowercase().contains(q) ||
                c.name.lowercase().contains(q) ||
                c.mobile.lowercase().contains(q) ||
                c.area.lowercase().contains(q)

        val matchesArea = areaFilter.equals("All", ignoreCase = true) || c.area.lowercase().contains(areaFilter.lowercase())

        val matchesCibil = when {
            cibilFilter.equals("All", ignoreCase = true) -> true
            cibilFilter.contains("Good", ignoreCase = true) -> c.cibilStatus.equals("Good", ignoreCase = true)
            cibilFilter.contains("Medium", ignoreCase = true) || cibilFilter.contains("Average", ignoreCase = true) -> c.cibilStatus.equals("Medium", ignoreCase = true)
            cibilFilter.contains("Low", ignoreCase = true) -> c.cibilStatus.equals("Low", ignoreCase = true)
            cibilFilter.contains("Bad", ignoreCase = true) -> c.cibilStatus.equals("Bad", ignoreCase = true)
            else -> true
        }

        val matchesStatus = when {
            statusFilter.equals("All", ignoreCase = true) -> true
            statusFilter.equals("Active", ignoreCase = true) -> c.status.equals("Active", ignoreCase = true)
            statusFilter.equals("Inactive", ignoreCase = true) -> c.status.equals("Inactive", ignoreCase = true)
            else -> true
        }

        matchesQuery && matchesArea && matchesCibil && matchesStatus
    }

    val totalBaki = customers.sumOf { it.baki }
    val activeCount = customers.count { it.status.equals("Active", ignoreCase = true) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp, 16.dp, 16.dp, 90.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // ITEM 1: TOAST MESSAGE
            toastMsg?.let { msg ->
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DarkCardBg),
                        border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryBlue),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "✅ $msg",
                            color = PrimaryBlue,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }
            }

            // ITEM 2: TOP SEARCH & ADD CUSTOMER BAR
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search ID, Name, Mobile, CD...", color = TextMuted, fontSize = 12.sp) },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = PrimaryBlue) },
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = DarkCardBg,
                            unfocusedContainerColor = DarkCardBg,
                            focusedBorderColor = PrimaryBlue,
                            unfocusedBorderColor = DarkBorder,
                            focusedTextColor = TextWhite,
                            unfocusedTextColor = TextWhite
                        ),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.width(10.dp))

                    Button(
                        onClick = {
                            editingCustomer = null
                            showFormDialog = true
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.height(52.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Add", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }

            // ITEM 3: TOP 3 SUMMARY CARDS
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    SummaryCard(
                        title = "TOTAL CUSTOMERS",
                        value = "${customers.size}",
                        subText = "Registered",
                        accentColor = PrimaryBlue,
                        modifier = Modifier.weight(1f)
                    )

                    SummaryCard(
                        title = "ACTIVE CUSTOMERS",
                        value = "$activeCount",
                        subText = "Good Standing",
                        accentColor = JamaGreen,
                        modifier = Modifier.weight(1f)
                    )

                    SummaryCard(
                        title = "TOTAL BAKI",
                        value = "₹${totalBaki.toInt()}",
                        subText = "Receivable",
                        accentColor = BakiRed,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // ITEM 4: CUSTOMER LIST / LOADING / EMPTY
            if (isLoading) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                        Text("Loading customer directory...", color = PrimaryBlue, fontWeight = FontWeight.Bold)
                    }
                }
            } else if (filteredCustomers.isEmpty()) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                        Text("No customer records found.", color = TextMuted, fontSize = 14.sp)
                    }
                }
            } else {
                items(filteredCustomers, key = { it.id }) { customer ->
                    AndroidCustomerCard(
                        customer = customer,
                        userRole = userRole,
                        onProfile = { profileCustomer = customer },
                        onHistory = { historyCustomer = customer },
                        onEdit = {
                            if (userRole.equals("ADMIN", ignoreCase = true)) {
                                editingCustomer = customer
                                showFormDialog = true
                            } else {
                                toastMsg = "Only Admin can edit customer details."
                            }
                        },
                        onDelete = {
                            if (userRole.equals("ADMIN", ignoreCase = true)) {
                                deletingCustomer = customer
                            } else {
                                toastMsg = "Only Admin can delete customer details."
                            }
                        }
                    )
                }
            }
        }

        // FORM DIALOG
        if (showFormDialog) {
            AndroidCustomerFormDialog(
                editingCustomer = editingCustomer,
                userRole = userRole,
                onDismiss = {
                    showFormDialog = false
                    editingCustomer = null
                },
                onSave = { data ->
                    scope.launch {
                        if (editingCustomer != null) {
                            val res = supabaseClient.updateCustomer(
                                id = editingCustomer!!.id,
                                customerCode = data.customerCode,
                                name = data.name,
                                mobile = data.mobile,
                                alternateMobile = data.alternateMobile,
                                email = data.email,
                                idCncNo = data.idCncNo,
                                photoUrl = data.photoUrl,
                                cibilStatus = data.cibilStatus,
                                cibilScore = data.cibilScore,
                                category = data.category,
                                categoryId = data.categoryId,
                                creditLimit = data.creditLimit,
                                openingBalance = data.openingBalance,
                                taxNo = data.taxNo,
                                udharWapisiDin = data.udharWapisiDin,
                                address = data.address,
                                area = data.area,
                                areaId = data.areaId,
                                remark = data.remark,
                                guarantorName = data.guarantorName,
                                guarantorMobile = data.guarantorMobile,
                                status = data.status,
                                creditBlocked = data.creditBlocked
                            )
                            res.onSuccess {
                                toastMsg = "Customer profile updated successfully."
                                refreshCustomers()
                            }.onFailure { err ->
                                toastMsg = err.message ?: "Failed to update customer."
                            }
                        } else {
                            val res = supabaseClient.addCustomer(
                                customerId = data.customerId,
                                customerCode = data.customerCode,
                                name = data.name,
                                mobile = data.mobile,
                                alternateMobile = data.alternateMobile,
                                email = data.email,
                                idCncNo = data.idCncNo,
                                photoUrl = data.photoUrl,
                                cibilStatus = data.cibilStatus,
                                cibilScore = data.cibilScore,
                                category = data.category,
                                categoryId = data.categoryId,
                                creditLimit = data.creditLimit,
                                openingBalance = data.openingBalance,
                                taxNo = data.taxNo,
                                udharWapisiDin = data.udharWapisiDin,
                                address = data.address,
                                area = data.area,
                                areaId = data.areaId,
                                remark = data.remark,
                                guarantorName = data.guarantorName,
                                guarantorMobile = data.guarantorMobile,
                                status = data.status,
                                creditBlocked = data.creditBlocked
                            )
                            res.onSuccess {
                                toastMsg = "New customer created successfully."
                                refreshCustomers()
                            }.onFailure { err ->
                                toastMsg = err.message ?: "Failed to create customer."
                            }
                        }
                        showFormDialog = false
                        editingCustomer = null
                    }
                }
            )
        }

        // PROFILE DIALOG
        profileCustomer?.let { customer ->
            AndroidCustomerProfileDialog(
                customer = customer,
                onDismiss = { profileCustomer = null },
                onEdit = {
                    val target = profileCustomer
                    profileCustomer = null
                    if (userRole.equals("ADMIN", ignoreCase = true)) {
                        editingCustomer = target
                        showFormDialog = true
                    } else {
                        toastMsg = "Only Admin can edit customer details."
                    }
                },
                onHistory = {
                    val target = profileCustomer
                    profileCustomer = null
                    historyCustomer = target
                }
            )
        }

        // HISTORY DIALOG
        historyCustomer?.let { customer ->
            AndroidCustomerHistoryDialog(
                customer = customer,
                onDismiss = { historyCustomer = null },
                onAddTransaction = { type, amount, notes ->
                    scope.launch {
                        val res = supabaseClient.addUdhaariTransactionRpc(customer.id, type, amount, notes)
                        res.onSuccess {
                            toastMsg = "$type entry of ₹${amount.toInt()} recorded."
                            refreshCustomers()
                        }.onFailure { err ->
                            val msg = err.message ?: ""
                            if (msg.contains("credit limit") || msg.contains("Udhar exceeds")) {
                                toastMsg = "Udhar exceeds the customer's credit limit."
                            } else if (msg.contains("blocked")) {
                                toastMsg = "Credit is blocked for this customer."
                            } else {
                                toastMsg = "Transaction failed: $msg"
                            }
                        }
                    }
                }
            )
        }

        // DELETE DIALOG
        deletingCustomer?.let { customer ->
            AndroidCustomerDeleteDialog(
                customer = customer,
                userRole = userRole,
                onDismiss = { deletingCustomer = null },
                onConfirmDelete = {
                    scope.launch {
                        val res = supabaseClient.deleteCustomer(customer.id)
                        res.onSuccess {
                            toastMsg = "Customer permanently deleted."
                            refreshCustomers()
                        }.onFailure { err ->
                            toastMsg = err.message ?: "Failed to delete customer."
                        }
                        deletingCustomer = null
                    }
                }
            )
        }
    }
}

@Composable
private fun SummaryCard(
    title: String,
    value: String,
    subText: String,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCardBg),
        border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(title, fontSize = 9.sp, color = TextMuted, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextWhite)
            Text(subText, fontSize = 10.sp, color = accentColor, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun AndroidCustomerCard(
    customer: CustomerDetailsModel,
    userRole: String,
    onProfile: () -> Unit,
    onHistory: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val cibilColor = when (customer.cibilStatus.lowercase()) {
        "bad" -> BakiRed
        "low" -> CibilOrange
        "medium", "average" -> CibilYellow
        else -> JamaGreen
    }

    var showMenu by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCardBg),
        border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // HEADER: PHOTO + NAME + ID + MOBILE + AREA + ACTIONS
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (!customer.photoUrl.isNullOrBlank()) {
                    SubcomposeAsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(customer.photoUrl)
                            .crossfade(true)
                            .build(),
                        contentDescription = customer.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(50.dp)
                            .clip(CircleShape)
                            .border(1.5.dp, PrimaryBlue, CircleShape),
                        loading = {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(AccentBlue),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (customer.name.length >= 2) customer.name.substring(0, 2).uppercase() else "CU",
                                    color = Color.White,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        },
                        error = {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(AccentBlue),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (customer.name.length >= 2) customer.name.substring(0, 2).uppercase() else "CU",
                                    color = Color.White,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .clip(CircleShape)
                            .background(AccentBlue),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (customer.name.length >= 2) customer.name.substring(0, 2).uppercase() else "CU",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = customer.name,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextWhite,
                            maxLines = 1
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (customer.status.equals("Active", ignoreCase = true)) JamaGreen.copy(alpha = 0.2f) else TextMuted.copy(alpha = 0.2f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = customer.status,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (customer.status.equals("Active", ignoreCase = true)) JamaGreen else TextMuted
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    Text(
                        text = "ID: ${customer.customerId} • ${customer.mobile}",
                        fontSize = 12.sp,
                        color = PrimaryBlue,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "Area: ${customer.area}",
                        fontSize = 11.sp,
                        color = TextMuted
                    )
                }

                Box {
                    IconButton(onClick = { showMenu = true }) {
                        Text("⋮", color = TextMuted, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    }
                    androidx.compose.material3.DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false },
                        modifier = Modifier.background(DarkCardBg)
                    ) {
                        androidx.compose.material3.DropdownMenuItem(
                            text = { Text("Profile", color = TextWhite) },
                            onClick = { showMenu = false; onProfile() }
                        )
                        androidx.compose.material3.DropdownMenuItem(
                            text = { Text("History", color = TextWhite) },
                            onClick = { showMenu = false; onHistory() }
                        )
                        if (userRole.equals("ADMIN", ignoreCase = true)) {
                            androidx.compose.material3.DropdownMenuItem(
                                text = { Text("Edit Details", color = PrimaryBlue) },
                                onClick = { showMenu = false; onEdit() }
                            )
                            androidx.compose.material3.DropdownMenuItem(
                                text = { Text("Delete Customer", color = BakiRed) },
                                onClick = { showMenu = false; onDelete() }
                            )
                        }
                    }
                }
            }

            HorizontalDivider(color = DarkBorder)

            // CIBIL BADGE & CREDIT LIMIT
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(cibilColor)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "CIBIL: ${customer.cibilStatus} (${customer.cibilScore})",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = cibilColor
                    )
                }

                Text(
                    text = "Credit Limit: ₹${customer.creditLimit.toInt()}",
                    fontSize = 11.sp,
                    color = TextWhite,
                    fontWeight = FontWeight.SemiBold
                )
            }

            // BAKI, JAMA & OUTSTANDING SUMMARY
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(DarkBg)
                        .padding(8.dp)
                ) {
                    Column {
                        Text("BAKI", fontSize = 9.sp, color = BakiRed, fontWeight = FontWeight.Bold)
                        Text(customer.bakiFormatted, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BakiRed)
                    }
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(DarkBg)
                        .padding(8.dp)
                ) {
                    Column {
                        Text("JAMA", fontSize = 9.sp, color = JamaGreen, fontWeight = FontWeight.Bold)
                        Text(customer.jamaFormatted, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = JamaGreen)
                    }
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(DarkBg)
                        .padding(8.dp)
                ) {
                    Column {
                        Text("LIMIT", fontSize = 9.sp, color = PrimaryBlue, fontWeight = FontWeight.Bold)
                        Text("₹${customer.creditLimit.toInt()}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                    }
                }
            }

            if (customer.creditBlocked) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(6.dp))
                        .background(BakiRed.copy(alpha = 0.15f))
                        .padding(vertical = 4.dp, horizontal = 8.dp)
                ) {
                    Text(
                        text = "🔒 CREDIT IS BLOCKED FOR THIS CUSTOMER",
                        fontSize = 10.sp,
                        color = BakiRed,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // ACTION BUTTONS
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onProfile,
                    modifier = Modifier.weight(1f).height(38.dp),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryBlue)
                ) {
                    Text("Profile", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                }

                Button(
                    onClick = onHistory,
                    modifier = Modifier.weight(1f).height(38.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("History", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }
    }
}

// NATIVE FORM DIALOG
@Composable
private fun AndroidCustomerFormDialog(
    editingCustomer: CustomerDetailsModel?,
    userRole: String,
    onDismiss: () -> Unit,
    onSave: (CustomerDetailsModel) -> Unit
) {
    fun cleanNull(s: String?, fallback: String = ""): String {
        if (s == null) return fallback
        val tr = s.trim()
        if (tr.equals("null", ignoreCase = true)) return fallback
        return tr
    }

    var name by remember { mutableStateOf(cleanNull(editingCustomer?.name)) }
    var mobile by remember { mutableStateOf(cleanNull(editingCustomer?.mobile)) }
    var alternateMobile by remember { mutableStateOf(cleanNull(editingCustomer?.alternateMobile)) }
    var email by remember { mutableStateOf(cleanNull(editingCustomer?.email)) }
    var idCncNo by remember { mutableStateOf(cleanNull(editingCustomer?.idCncNo)) }
    var photoUrl by remember { mutableStateOf(cleanNull(editingCustomer?.photoUrl)) }
    var customerCode by remember { mutableStateOf(cleanNull(editingCustomer?.customerCode)) }
    var customerId by remember { mutableStateOf(cleanNull(editingCustomer?.customerId, "Auto-Generated")) }

    var cibilStatus by remember { mutableStateOf(cleanNull(editingCustomer?.cibilStatus, "Good")) }
    var category by remember { mutableStateOf(cleanNull(editingCustomer?.category)) }
    var categoryId by remember { mutableStateOf<String?>(editingCustomer?.categoryId) }
    val dbCategories = remember { mutableStateListOf<Pair<String, String>>() }
    var creditLimitText by remember { mutableStateOf(editingCustomer?.creditLimit?.toInt()?.toString() ?: "50000") }
    var openingBalanceText by remember { mutableStateOf(editingCustomer?.openingBalance?.toInt()?.toString() ?: "0") }
    var taxNo by remember { mutableStateOf(cleanNull(editingCustomer?.taxNo)) }
    var udharWapisiDinText by remember { mutableStateOf(editingCustomer?.udharWapisiDin?.toString() ?: "30") }

    var area by remember { mutableStateOf(cleanNull(editingCustomer?.area)) }
    var areaId by remember { mutableStateOf<String?>(editingCustomer?.areaId) }
    val dbAreas = remember { mutableStateListOf<Pair<String, String>>() }
    var address by remember { mutableStateOf(cleanNull(editingCustomer?.address)) }

    var guarantorName by remember { mutableStateOf(cleanNull(editingCustomer?.guarantorName)) }
    var guarantorMobile by remember { mutableStateOf(cleanNull(editingCustomer?.guarantorMobile)) }

    var remark by remember { mutableStateOf(cleanNull(editingCustomer?.remark)) }

    var status by remember { mutableStateOf(cleanNull(editingCustomer?.status, "Active")) }
    var creditBlocked by remember { mutableStateOf(editingCustomer?.creditBlocked ?: false) }

    var errorMsg by remember { mutableStateOf<String?>(null) }
    val isStaff = userRole.equals("STAFF", ignoreCase = true) && editingCustomer != null
    val context = LocalContext.current
    val supabaseClient = remember { com.example.crm_app_kmp.data.SupabaseAndroidClient(context) }

    LaunchedEffect(Unit) {
        val catRes = supabaseClient.fetchTable("categories")
        catRes.onSuccess { arr ->
            dbCategories.clear()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val id = obj.optString("id", "")
                val name = obj.optString("name", "")
                if (name.isNotBlank()) {
                    dbCategories.add(Pair(id, name))
                }
            }
        }

        val areaRes = supabaseClient.fetchTable("areas")
        areaRes.onSuccess { arr ->
            dbAreas.clear()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val id = obj.optString("id", "")
                val name = obj.optString("name", "")
                if (name.isNotBlank()) {
                    dbAreas.add(Pair(id, name))
                }
            }
        }
    }

    LaunchedEffect(editingCustomer) {
        if (editingCustomer == null) {
            val nextId = supabaseClient.generateNextCustomerId()
            customerId = nextId
            if (customerCode.isBlank()) {
                customerCode = nextId
            }
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = DarkCardBg),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (editingCustomer != null) "Edit Customer (${editingCustomer.customerId})" else "Add New Customer",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextWhite
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextMuted)
                    }
                }

                if (isStaff) {
                    Text("🔒 Only Admin can edit customer details.", color = CibilYellow, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                errorMsg?.let { err ->
                    Text("⚠️ $err", color = BakiRed, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                // SECTION 1 — PERSONAL INFORMATION
                Text("1. PERSONAL INFORMATION", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)

                OutlinedTextField(
                    value = photoUrl,
                    onValueChange = { photoUrl = it },
                    enabled = !isStaff,
                    label = { Text("Photo Path / URL", fontSize = 12.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    enabled = !isStaff,
                    label = { Text("Full Name *", fontSize = 12.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                OutlinedTextField(
                    value = mobile,
                    onValueChange = { mobile = it.filter { c -> c.isDigit() } },
                    enabled = !isStaff,
                    label = { Text("Mobile Number (10 digits) *", fontSize = 12.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                OutlinedTextField(
                    value = alternateMobile,
                    onValueChange = { alternateMobile = it.filter { c -> c.isDigit() } },
                    enabled = !isStaff,
                    label = { Text("Alternate Mobile Number", fontSize = 12.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    enabled = !isStaff,
                    label = { Text("Email Address", fontSize = 12.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                // SECTION 2 — CUSTOMER IDENTITY
                Text("2. CUSTOMER IDENTITY", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)

                OutlinedTextField(
                    value = customerId,
                    onValueChange = {},
                    enabled = false,
                    label = { Text("Customer ID (Server-Generated)", fontSize = 12.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                OutlinedTextField(
                    value = customerCode,
                    onValueChange = { customerCode = it },
                    enabled = !isStaff,
                    label = { Text("CD Code * (e.g. cd08, ABC123, 12345)", fontSize = 12.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                // SECTION 3 — CREDIT INFORMATION & CATEGORY
                Text("3. CREDIT INFORMATION & CATEGORY", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)

                OutlinedTextField(
                    value = category,
                    onValueChange = {
                        category = it
                        if (errorMsg != null) errorMsg = null
                    },
                    enabled = !isStaff,
                    label = { Text("Category * (e.g. Retailer, Wholesaler, VIP)", fontSize = 12.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                if (dbCategories.isNotEmpty()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        dbCategories.forEach { pair ->
                            val isSel = category.equals(pair.second, ignoreCase = true)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(if (isSel) PrimaryBlue else Color(0xFF1E293B))
                                    .border(1.dp, if (isSel) PrimaryBlue else Color(0xFF334155), RoundedCornerShape(16.dp))
                                    .clickable {
                                        category = pair.second
                                        categoryId = pair.first
                                        if (errorMsg != null) errorMsg = null
                                    }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = pair.second,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSel) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isSel) Color.White else TextMuted
                                )
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = cibilStatus,
                        onValueChange = { cibilStatus = it },
                        enabled = !isStaff,
                        label = { Text("CIBIL Status", fontSize = 12.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )

                    OutlinedTextField(
                        value = creditLimitText,
                        onValueChange = { creditLimitText = it.filter { c -> c.isDigit() } },
                        enabled = !isStaff,
                        label = { Text("Credit Limit (₹) *", fontSize = 12.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    )
                }

                if (editingCustomer == null) {
                    OutlinedTextField(
                        value = openingBalanceText,
                        onValueChange = { openingBalanceText = it.filter { c -> c.isDigit() } },
                        label = { Text("Opening Balance Baki (₹)", fontSize = 12.sp) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )
                }

                // SECTION 4 — ADDRESS
                Text("4. ADDRESS & AREA", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)

                OutlinedTextField(
                    value = area,
                    onValueChange = { area = it },
                    enabled = !isStaff,
                    label = { Text("Area / Location *", fontSize = 12.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                if (dbAreas.isNotEmpty()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        dbAreas.forEach { pair ->
                            val isSel = area.equals(pair.second, ignoreCase = true)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(if (isSel) PrimaryBlue else Color(0xFF1E293B))
                                    .border(1.dp, if (isSel) PrimaryBlue else Color(0xFF334155), RoundedCornerShape(16.dp))
                                    .clickable {
                                        area = pair.second
                                        areaId = pair.first
                                    }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = pair.second,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSel) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isSel) Color.White else TextMuted
                                )
                            }
                        }
                    }
                }

                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    enabled = !isStaff,
                    label = { Text("Full Address", fontSize = 12.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                // SECTION 5 — GUARANTOR
                Text("5. GUARANTOR INFORMATION", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)

                OutlinedTextField(
                    value = guarantorName,
                    onValueChange = { guarantorName = it },
                    enabled = !isStaff,
                    label = { Text("Guarantor Name", fontSize = 12.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                OutlinedTextField(
                    value = guarantorMobile,
                    onValueChange = { guarantorMobile = it.filter { c -> c.isDigit() } },
                    enabled = !isStaff,
                    label = { Text("Guarantor Mobile", fontSize = 12.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                // SECTION 6 — ADDITIONAL & CONTROLS
                Text("6. ADDITIONAL INFORMATION & CONTROLS", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)

                OutlinedTextField(
                    value = remark,
                    onValueChange = { remark = it },
                    enabled = !isStaff,
                    label = { Text("Remark / Notes", fontSize = 12.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Credit Blocked", fontSize = 13.sp, color = TextWhite, fontWeight = FontWeight.SemiBold)
                    Switch(
                        checked = creditBlocked,
                        onCheckedChange = { creditBlocked = it },
                        enabled = !isStaff,
                        colors = SwitchDefaults.colors(checkedThumbColor = BakiRed)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(onClick = onDismiss, shape = RoundedCornerShape(8.dp)) {
                        Text("Cancel", color = TextMuted)
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    if (!isStaff) {
                        Button(
                            onClick = {
                                val nameErr = CustomerValidator.validateName(name)
                                if (nameErr != null) { errorMsg = nameErr; return@Button }

                                val mobileErr = CustomerValidator.validateMobile(mobile)
                                if (mobileErr != null) { errorMsg = mobileErr; return@Button }

                                val catErr = CustomerValidator.validateCategory(category)
                                if (catErr != null) { errorMsg = catErr; return@Button }

                                val limitVal = creditLimitText.toDoubleOrNull() ?: 50000.0

                                val matchedPair = dbCategories.firstOrNull { it.second.equals(category.trim(), ignoreCase = true) }
                                val finalCatName = matchedPair?.second ?: category.trim()
                                val finalCatId = matchedPair?.first ?: categoryId

                                onSave(
                                    CustomerDetailsModel(
                                        id = editingCustomer?.id ?: "",
                                        customerId = customerId,
                                        customerCode = customerCode,
                                        photoUrl = photoUrl,
                                        name = name,
                                        mobile = mobile,
                                        alternateMobile = alternateMobile,
                                        email = email,
                                        idCncNo = idCncNo,
                                        cibilStatus = cibilStatus,
                                        category = finalCatName,
                                        categoryId = finalCatId,
                                        creditLimit = limitVal,
                                        openingBalance = openingBalanceText.toDoubleOrNull() ?: 0.0,
                                        taxNo = taxNo,
                                        udharWapisiDin = udharWapisiDinText.toIntOrNull() ?: 30,
                                        address = address,
                                        area = area,
                                        remark = remark,
                                        guarantorName = guarantorName,
                                        guarantorMobile = guarantorMobile,
                                        status = status,
                                        creditBlocked = creditBlocked
                                    )
                                )
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Save Customer", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// NATIVE PROFILE DIALOG
@Composable
private fun AndroidCustomerProfileDialog(
    customer: CustomerDetailsModel,
    onDismiss: () -> Unit,
    onEdit: () -> Unit,
    onHistory: () -> Unit
) {
    val context = LocalContext.current

    fun triggerPrint() {
        try {
            val printManager = context.getSystemService(Context.PRINT_SERVICE) as PrintManager
            val webView = WebView(context).apply {
                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        val printAdapter: PrintDocumentAdapter = createPrintDocumentAdapter("Customer_Profile_${customer.customerId}")
                        printManager.print("Customer_Profile_${customer.customerId}", printAdapter, PrintAttributes.Builder().build())
                    }
                }
            }
            val html = """
                <html>
                <head>
                    <style>
                        body { font-family: sans-serif; padding: 20px; color: #1e293b; }
                        h1 { color: #2563eb; margin-bottom: 5px; }
                        .subtitle { color: #64748b; font-size: 14px; margin-bottom: 20px; }
                        .section { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
                        .section-title { font-weight: bold; color: #0f172a; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
                        .label { color: #64748b; font-weight: bold; }
                        .val { color: #0f172a; font-weight: bold; }
                        .baki { color: #ef4444; }
                        .jama { color: #22c55e; }
                    </style>
                </head>
                <body>
                    <h1>${customer.name}</h1>
                    <div class="subtitle">Customer ID: ${customer.customerId} • Code: ${customer.customerCode} • Mobile: ${customer.mobile}</div>
                    
                    <div class="section">
                        <div class="section-title">FINANCIAL SUMMARY</div>
                        <div class="grid">
                            <div><span class="label">Total Baki:</span> <span class="val baki">₹${customer.baki.toInt()}</span></div>
                            <div><span class="label">Total Jama:</span> <span class="val jama">₹${customer.jama.toInt()}</span></div>
                            <div><span class="label">Outstanding Balance:</span> <span class="val">₹${customer.outstanding.toInt()}</span></div>
                            <div><span class="label">Credit Limit:</span> <span class="val">₹${customer.creditLimit.toInt()}</span></div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">PERSONAL INFORMATION</div>
                        <div class="grid">
                            <div><span class="label">Full Name:</span> <span class="val">${customer.name}</span></div>
                            <div><span class="label">Mobile Number:</span> <span class="val">${customer.mobile}</span></div>
                            <div><span class="label">Alternate Mobile:</span> <span class="val">${customer.alternateMobile.ifBlank { "N/A" }}</span></div>
                            <div><span class="label">Email Address:</span> <span class="val">${customer.email.ifBlank { "N/A" }}</span></div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">CREDIT & ACCOUNT INFORMATION</div>
                        <div class="grid">
                            <div><span class="label">ID / CNC No:</span> <span class="val">${customer.idCncNo.ifBlank { "N/A" }}</span></div>
                            <div><span class="label">CIBIL Status:</span> <span class="val">${customer.cibilStatus} (${customer.cibilScore})</span></div>
                            <div><span class="label">Category:</span> <span class="val">${customer.category}</span></div>
                            <div><span class="label">Opening Balance:</span> <span class="val">₹${customer.openingBalance.toInt()}</span></div>
                            <div><span class="label">Tax Number:</span> <span class="val">${customer.taxNo.ifBlank { "N/A" }}</span></div>
                            <div><span class="label">Udhar Return Days:</span> <span class="val">${customer.udharWapisiDin} Days</span></div>
                            <div><span class="label">Account Status:</span> <span class="val">${customer.status}</span></div>
                            <div><span class="label">Credit Blocked:</span> <span class="val">${if (customer.creditBlocked) "YES (BLOCKED)" else "NO"}</span></div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">ADDRESS & LOCATION</div>
                        <div class="grid">
                            <div><span class="label">Area / Location:</span> <span class="val">${customer.area}</span></div>
                            <div><span class="label">Full Address:</span> <span class="val">${customer.address.ifBlank { "N/A" }}</span></div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">GUARANTOR & REMARKS</div>
                        <div class="grid">
                            <div><span class="label">Guarantor Name:</span> <span class="val">${customer.guarantorName.ifBlank { "N/A" }}</span></div>
                            <div><span class="label">Guarantor Mobile:</span> <span class="val">${customer.guarantorMobile.ifBlank { "N/A" }}</span></div>
                            <div><span class="label">Remark / Notes:</span> <span class="val">${customer.remark.ifBlank { "N/A" }}</span></div>
                        </div>
                    </div>
                </body>
                </html>
            """.trimIndent()
            webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
        } catch (e: Exception) {
            android.widget.Toast.makeText(context, "Printing profile...", android.widget.Toast.LENGTH_SHORT).show()
        }
    }

    fun makeCall(mobile: String) {
        if (mobile.isNotBlank()) {
            try {
                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$mobile"))
                context.startActivity(intent)
            } catch (_: Exception) {}
        }
    }

    fun openWhatsApp(mobile: String) {
        if (mobile.isNotBlank()) {
            try {
                val clean = mobile.filter { it.isDigit() }
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://api.whatsapp.com/send?phone=91$clean"))
                context.startActivity(intent)
            } catch (_: Exception) {}
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = DarkCardBg),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // TOP BAR
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = TextMuted)
                        }
                        Text("Customer Profile", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextWhite)
                    }

                    Row {
                        IconButton(onClick = onEdit) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit", tint = PrimaryBlue)
                        }
                        IconButton(onClick = { triggerPrint() }) {
                            Icon(Icons.Default.Print, contentDescription = "Print", tint = TextWhite)
                        }
                    }
                }

                // HEADER CARD: PHOTO + NAME + ID + QUICK CONTACT
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    if (!customer.photoUrl.isNullOrBlank()) {
                        SubcomposeAsyncImage(
                            model = ImageRequest.Builder(LocalContext.current)
                                .data(customer.photoUrl)
                                .crossfade(true)
                                .build(),
                            contentDescription = customer.name,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .border(2.dp, PrimaryBlue, CircleShape),
                            loading = {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(AccentBlue),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(customer.name.take(2).uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                                }
                            },
                            error = {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(AccentBlue),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(customer.name.take(2).uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                                }
                            }
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .background(AccentBlue),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(customer.name.take(2).uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                        }
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(customer.name, fontSize = 19.sp, fontWeight = FontWeight.Bold, color = TextWhite)
                        Text("ID: ${customer.customerId} • ${customer.customerCode}", fontSize = 12.sp, color = PrimaryBlue, fontWeight = FontWeight.SemiBold)
                        Text("Mobile: ${customer.mobile}", fontSize = 12.sp, color = TextMuted)
                    }
                }

                // QUICK ACTION BUTTONS (CALL, WHATSAPP, HISTORY, EDIT)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { makeCall(customer.mobile) },
                        modifier = Modifier.weight(1f).height(38.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = DarkBorder),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.Call, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Call", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = { openWhatsApp(customer.mobile) },
                        modifier = Modifier.weight(1f).height(38.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = JamaGreen),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("WhatsApp", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }

                    Button(
                        onClick = onHistory,
                        modifier = Modifier.weight(1f).height(38.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.History, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("History", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }

                HorizontalDivider(color = DarkBorder)

                // FINANCIAL OVERVIEW (PREVENT OUTSTANDING LABEL CLIPPING)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkBg),
                    border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("CREDIT LIMIT", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold, maxLines = 1)
                            Text("₹${customer.creditLimit.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        }

                        HorizontalDivider(color = DarkBorder)

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("TOTAL BAKI", fontSize = 10.sp, color = BakiRed, fontWeight = FontWeight.Bold, maxLines = 1)
                                Text("₹${customer.baki.toInt()}", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = BakiRed)
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                Text("TOTAL JAMA", fontSize = 10.sp, color = JamaGreen, fontWeight = FontWeight.Bold, maxLines = 1)
                                Text("₹${customer.jama.toInt()}", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = JamaGreen)
                            }
                        }
                    }
                }

                // 1. PERSONAL INFORMATION
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkBg)
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("PERSONAL INFORMATION", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        ProfileDetailRow("Full Name", customer.name)
                        ProfileDetailRow("Customer ID", customer.customerId)
                        ProfileDetailRow("Customer Code", customer.customerCode)
                        ProfileDetailRow("Mobile Number", customer.mobile)
                        ProfileDetailRow("Alternate Mobile", customer.alternateMobile.ifBlank { "N/A" })
                        ProfileDetailRow("Email Address", customer.email.ifBlank { "N/A" })
                    }
                }

                // 2. CREDIT & ACCOUNT INFORMATION
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkBg)
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("CREDIT & ACCOUNT INFORMATION", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        ProfileDetailRow("ID / CNC Number", customer.idCncNo.ifBlank { "N/A" })
                        ProfileDetailRow("CIBIL Status", "${customer.cibilStatus} (${customer.cibilScore})")
                        ProfileDetailRow("Category", customer.category)
                        ProfileDetailRow("Credit Limit", "₹${customer.creditLimit.toInt()}")
                        ProfileDetailRow("Opening Balance", "₹${customer.openingBalance.toInt()}")
                        ProfileDetailRow("Tax Number", customer.taxNo.ifBlank { "N/A" })
                        ProfileDetailRow("Udhar Return Days", "${customer.udharWapisiDin} Days")
                        ProfileDetailRow("Account Status", customer.status)
                        ProfileDetailRow("Credit Blocked", if (customer.creditBlocked) "YES (BLOCKED)" else "NO")
                    }
                }

                // 3. ADDRESS & LOCATION
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkBg)
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("ADDRESS & LOCATION", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        ProfileDetailRow("Area / Location", customer.area)
                        ProfileDetailRow("Full Address", customer.address.ifBlank { "N/A" })
                    }
                }

                // 4. GUARANTOR & REMARK
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkBg)
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("GUARANTOR & REMARK", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        ProfileDetailRow("Guarantor Name", customer.guarantorName.ifBlank { "N/A" })
                        ProfileDetailRow("Guarantor Mobile", customer.guarantorMobile.ifBlank { "N/A" })
                        ProfileDetailRow("Remark / Notes", customer.remark.ifBlank { "N/A" })
                    }
                }

                // 5. CUSTOMER QR REFERENCE
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkBg)
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("CUSTOMER QR REFERENCE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        Box(
                            modifier = Modifier
                                .size(120.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.White)
                                .border(1.dp, PrimaryBlue, RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("QR", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = DarkBg)
                                Text(customer.customerId, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = DarkBg)
                            }
                        }
                        Text(customer.customerCode, fontSize = 11.sp, color = TextMuted)
                        OutlinedButton(
                            onClick = { triggerPrint() },
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryBlue)
                        ) {
                            Icon(Icons.Default.Print, contentDescription = null, tint = PrimaryBlue, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Print Profile PDF", fontSize = 11.sp, color = PrimaryBlue, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfileDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 12.sp, color = TextMuted)
        Text(value, fontSize = 12.sp, color = TextWhite, fontWeight = FontWeight.SemiBold)
    }
}

// NATIVE DEDICATED HISTORY DIALOG
@Composable
private fun AndroidCustomerHistoryDialog(
    customer: CustomerDetailsModel,
    onDismiss: () -> Unit,
    onAddTransaction: (type: String, amount: Double, notes: String) -> Unit
) {
    val context = LocalContext.current
    val supabaseClient = remember { com.example.crm_app_kmp.data.SupabaseAndroidClient(context) }
    val scope = rememberCoroutineScope()

    val transactionsList = remember { mutableStateListOf<com.example.crm_app_kmp.customers.CustomerTxn>() }
    var isLoadingTxns by remember { mutableStateOf(true) }
    var filterType by remember { mutableStateOf("All") }
    var historySearchQuery by remember { mutableStateOf("") }

    var txType by remember { mutableStateOf("Baki") }
    var txAmountText by remember { mutableStateOf("") }
    var txNotes by remember { mutableStateOf("") }
    var showAddForm by remember { mutableStateOf(false) }

    fun loadHistory() {
        scope.launch {
            isLoadingTxns = true
            val res = supabaseClient.fetchCustomerTransactions(customer.id)
            isLoadingTxns = false
            res.onSuccess { list ->
                transactionsList.clear()
                transactionsList.addAll(list)
            }.onFailure {
                transactionsList.clear()
            }
        }
    }

    LaunchedEffect(customer.id) {
        loadHistory()
    }

    val filteredTxns = transactionsList.filter { t ->
        val matchesType = when (filterType) {
            "Baki" -> t.type.equals("Baki", ignoreCase = true)
            "Jama" -> t.type.equals("Jama", ignoreCase = true)
            else -> true
        }
        val q = historySearchQuery.lowercase().trim()
        val matchesQuery = q.isEmpty() || t.notes.lowercase().contains(q) || t.date.contains(q) || t.amountFormatted.contains(q)
        matchesType && matchesQuery
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = DarkCardBg),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // HEADER
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("${customer.name} — History", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = TextWhite)
                        Text("ID: ${customer.customerId} • Code: ${customer.customerCode}", fontSize = 11.sp, color = PrimaryBlue)
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextMuted)
                    }
                }

                // FINANCIAL SUMMARY BAR
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkBg)
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("BAKI", fontSize = 9.sp, color = BakiRed, fontWeight = FontWeight.Bold)
                            Text("₹${customer.baki.toInt()}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BakiRed)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("JAMA", fontSize = 9.sp, color = JamaGreen, fontWeight = FontWeight.Bold)
                            Text("₹${customer.jama.toInt()}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = JamaGreen)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("LIMIT", fontSize = 9.sp, color = PrimaryBlue, fontWeight = FontWeight.Bold)
                            Text("₹${customer.creditLimit.toInt()}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        }
                    }
                }

                // FILTER CHIPS (ALL, BAKI, JAMA)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("All", "Baki", "Jama").forEach { t ->
                        val selected = filterType == t
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (selected) AccentBlue else DarkBg)
                                .clickable { filterType = t }
                                .padding(horizontal = 14.dp, vertical = 6.dp)
                        ) {
                            Text(t, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (selected) Color.White else TextMuted)
                        }
                    }

                    Button(
                        onClick = { showAddForm = !showAddForm },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
                        modifier = Modifier.weight(1f).height(32.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (showAddForm) "Close" else "+ Add", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }

                if (showAddForm) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkBg)
                    ) {
                        Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = txAmountText,
                                onValueChange = { txAmountText = it.filter { c -> c.isDigit() || c == '.' } },
                                placeholder = { Text("Amount (₹)", fontSize = 12.sp) },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp)
                            )
                            OutlinedTextField(
                                value = txNotes,
                                onValueChange = { txNotes = it },
                                placeholder = { Text("Notes / Description", fontSize = 12.sp) },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp)
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = {
                                        val amt = txAmountText.toDoubleOrNull() ?: 0.0
                                        if (amt > 0) {
                                            onAddTransaction("Baki", amt, txNotes)
                                            showAddForm = false
                                            loadHistory()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = BakiRed),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("+ Baki", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                                Button(
                                    onClick = {
                                        val amt = txAmountText.toDoubleOrNull() ?: 0.0
                                        if (amt > 0) {
                                            onAddTransaction("Jama", amt, txNotes)
                                            showAddForm = false
                                            loadHistory()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = JamaGreen),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("+ Jama", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }

                // TRANSACTION LIST
                if (isLoadingTxns) {
                    Box(modifier = Modifier.fillMaxWidth().height(120.dp), contentAlignment = Alignment.Center) {
                        Text("Loading transaction history...", color = PrimaryBlue, fontSize = 13.sp)
                    }
                } else if (filteredTxns.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().height(120.dp), contentAlignment = Alignment.Center) {
                        Text("No transaction history recorded yet.", color = TextMuted, fontSize = 13.sp)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxWidth().height(260.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(filteredTxns) { txn ->
                            val isBaki = txn.type.equals("Baki", ignoreCase = true)
                            val accent = if (isBaki) BakiRed else JamaGreen

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp),
                                colors = CardDefaults.cardColors(containerColor = DarkBg)
                            ) {
                                Row(
                                    modifier = Modifier.padding(10.dp).fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(4.dp))
                                                    .background(accent.copy(alpha = 0.2f))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            ) {
                                                Text(txn.type.uppercase(), color = accent, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                            }
                                            Text(txn.date, color = TextMuted, fontSize = 11.sp)
                                        }
                                        if (txn.notes.isNotBlank()) {
                                            Text(txn.notes, color = TextWhite, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                        }
                                    }

                                    Text(
                                        text = (if (isBaki) "+" else "-") + txn.amountFormatted,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = accent
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// NATIVE DELETE DIALOG
@Composable
private fun AndroidCustomerDeleteDialog(
    customer: CustomerDetailsModel,
    userRole: String,
    onDismiss: () -> Unit,
    onConfirmDelete: () -> Unit
) {
    var step by remember { mutableStateOf(1) }

    if (!userRole.equals("ADMIN", ignoreCase = true)) {
        AlertDialog(
            onDismissRequest = onDismiss,
            title = { Text("🔒 Access Denied", color = BakiRed, fontWeight = FontWeight.Bold) },
            text = { Text("Only Admin can delete customer details.", color = TextWhite) },
            confirmButton = { Button(onClick = onDismiss) { Text("OK") } }
        )
        return
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = when (step) {
                    1 -> "Delete customer?"
                    2 -> "This will remove the customer from active CRM records. Continue?"
                    else -> "Final confirmation: permanently delete this customer?"
                },
                color = BakiRed,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp
            )
        },
        text = {
            Text("Customer: ${customer.name} (ID: ${customer.customerId})", color = TextMuted, fontSize = 13.sp)
        },
        confirmButton = {
            Button(
                onClick = {
                    if (step < 3) step++
                    else onConfirmDelete()
                },
                colors = ButtonDefaults.buttonColors(containerColor = BakiRed)
            ) {
                Text(if (step < 3) "Continue" else "DELETE PERMANENTLY", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text("Cancel", color = TextMuted)
            }
        }
    )
}
