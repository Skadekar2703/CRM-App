package com.example.crm_app_kmp.ui.customers

import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
import android.content.Intent
import android.net.Uri
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
import androidx.compose.material.icons.automirrored.filled.Message
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Message
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
import com.example.crm_app_kmp.customers.CustomerDetailsModel
import com.example.crm_app_kmp.customers.CustomerRepository
import com.example.crm_app_kmp.customers.CustomerTxn
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

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
    var categoryFilter by remember { mutableStateOf("All") }
    var cibilFilter by remember { mutableStateOf("All") }
    var statusFilter by remember { mutableStateOf("All") }

    var showFilterSheet by remember { mutableStateOf(false) }
    var showFormDialog by remember { mutableStateOf(false) }
    var editingCustomer by remember { mutableStateOf<CustomerDetailsModel?>(null) }
    var historyCustomer by remember { mutableStateOf<CustomerDetailsModel?>(null) }
    var deletingCustomer by remember { mutableStateOf<CustomerDetailsModel?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    fun refreshCustomers() {
        scope.launch {
            isLoading = true
            val res = supabaseClient.fetchCustomers()
            isLoading = false
            res.onSuccess { list ->
                customers.clear()
                customers.addAll(list.map { c ->
                    CustomerDetailsModel(
                        id = c.id,
                        name = c.name,
                        area = c.area.ifBlank { "Local" },
                        mobile = c.phone,
                        category = "Regular",
                        cibilScore = 750,
                        cibilStatus = "Normal",
                        creditLimit = 50000.0,
                        currentBalance = 0.0,
                        balanceType = "Baki",
                        status = "Active"
                    )
                })
            }
        }
    }

    androidx.compose.runtime.LaunchedEffect(Unit) {
        refreshCustomers()
    }

    val filteredCustomers = customers.filter { c ->
        val q = searchQuery.lowercase().trim()
        val matchesQuery = q.isEmpty() ||
                c.id.lowercase().contains(q) ||
                c.name.lowercase().contains(q) ||
                c.mobile.lowercase().contains(q) ||
                c.area.lowercase().contains(q)

        val matchesArea = areaFilter.equals("All", ignoreCase = true) || c.area.lowercase().contains(areaFilter.lowercase())
        val matchesCat = categoryFilter.equals("All", ignoreCase = true) || c.category.equals(categoryFilter, ignoreCase = true)

        val matchesCibil = when {
            cibilFilter.equals("All", ignoreCase = true) -> true
            cibilFilter.contains("Good", ignoreCase = true) -> c.cibilScore >= 750
            cibilFilter.contains("Average", ignoreCase = true) -> c.cibilScore in 650..749
            cibilFilter.contains("Risk", ignoreCase = true) || cibilFilter.contains("Bad", ignoreCase = true) -> c.cibilScore < 650
            else -> true
        }

        val matchesStatus = when {
            statusFilter.equals("All", ignoreCase = true) -> true
            statusFilter.equals("Active", ignoreCase = true) -> c.status.equals("Active", ignoreCase = true)
            statusFilter.equals("Inactive", ignoreCase = true) -> c.status.equals("Inactive", ignoreCase = true)
            statusFilter.equals("Warning", ignoreCase = true) || statusFilter.equals("Bad", ignoreCase = true) -> c.isBadOrOverdue
            else -> true
        }

        matchesQuery && matchesArea && matchesCat && matchesCibil && matchesStatus
    }

    val totalBaki = customers.filter { it.balanceType.equals("Baki", ignoreCase = true) }.sumOf { it.currentBalance }
    val totalJama = customers.filter { it.balanceType.equals("Jama", ignoreCase = true) }.sumOf { it.currentBalance }
    val activeCount = customers.count { it.status.equals("Active", ignoreCase = true) }

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
                placeholder = { Text("Search customers...", fontSize = 14.sp, color = TextMuted) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                trailingIcon = {
                    IconButton(onClick = { showFilterSheet = true }) {
                        Icon(
                            Icons.Default.Tune,
                            contentDescription = "Filters",
                            tint = if (areaFilter != "All" || categoryFilter != "All" || cibilFilter != "All" || statusFilter != "All") PrimaryBlue else TextMuted
                        )
                    }
                },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // SUMMARY CARDS (HORIZONTAL SCROLLABLE)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                CustomerSummaryCard(
                    title = "Total Customers",
                    value = "${customers.size}",
                    subText = "Registered",
                    accentColor = PrimaryBlue
                )
                CustomerSummaryCard(
                    title = "Active Customers",
                    value = "$activeCount",
                    subText = "In Good Standing",
                    accentColor = Color(0xFF16A34A)
                )
                CustomerSummaryCard(
                    title = "Total Baki",
                    value = "₹${totalBaki.toInt()}",
                    subText = "Outstanding Credit",
                    accentColor = ErrorRed
                )
                CustomerSummaryCard(
                    title = "Total Jama",
                    value = "₹${totalJama.toInt()}",
                    subText = "Advance Received",
                    accentColor = Color(0xFF16A34A)
                )
            }

            // QUICK FILTER CHIPS
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val filterChips = listOf("All", "Active", "Warning/Bad", "VIP", "Regular", "Wholesale")
                filterChips.forEach { chip ->
                    val isSelected = when (chip) {
                        "All" -> areaFilter == "All" && categoryFilter == "All" && cibilFilter == "All" && statusFilter == "All"
                        "Active" -> statusFilter == "Active"
                        "Warning/Bad" -> statusFilter == "Warning" || cibilFilter == "Risk"
                        "VIP" -> categoryFilter == "VIP"
                        "Regular" -> categoryFilter == "Regular"
                        "Wholesale" -> categoryFilter == "Wholesale"
                        else -> false
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(if (isSelected) PrimaryBlue else Color.White)
                            .border(1.dp, if (isSelected) PrimaryBlue else Color(0xFFCBD5E1), RoundedCornerShape(20.dp))
                            .clickable {
                                when (chip) {
                                    "All" -> {
                                        areaFilter = "All"
                                        categoryFilter = "All"
                                        cibilFilter = "All"
                                        statusFilter = "All"
                                    }
                                    "Active" -> { statusFilter = if (statusFilter == "Active") "All" else "Active" }
                                    "Warning/Bad" -> { statusFilter = if (statusFilter == "Warning") "All" else "Warning"; cibilFilter = "Risk" }
                                    "VIP" -> { categoryFilter = if (categoryFilter == "VIP") "All" else "VIP" }
                                    "Regular" -> { categoryFilter = if (categoryFilter == "Regular") "All" else "Regular" }
                                    "Wholesale" -> { categoryFilter = if (categoryFilter == "Wholesale") "All" else "Wholesale" }
                                }
                            }
                            .padding(horizontal = 14.dp, vertical = 7.dp)
                    ) {
                        Text(
                            text = chip,
                            fontSize = 12.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) Color.White else TextPrimary
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

            // CUSTOMER CARDS LIST
            if (filteredCustomers.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No customers found.", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(filteredCustomers, key = { it.id }) { customer ->
                        CustomerCard(
                            customer = customer,
                            onCall = {
                                try {
                                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${customer.mobile}"))
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    toastMsg = "Call: ${customer.mobile}"
                                }
                            },
                            onMessage = {
                                try {
                                    val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:${customer.mobile}"))
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    toastMsg = "Message sent to ${customer.mobile}"
                                }
                            },
                            onEdit = {
                                editingCustomer = customer
                                showFormDialog = true
                            },
                            onHistory = {
                                historyCustomer = customer
                            },
                            onDelete = {
                                deletingCustomer = customer
                            }
                        )
                    }
                }
            }
        }

        // FLOATING "+" ADD CUSTOMER BUTTON
        FloatingActionButton(
            onClick = {
                editingCustomer = null
                showFormDialog = true
            },
            containerColor = PrimaryBlue,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Customer", modifier = Modifier.size(24.dp))
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
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Filter Customers", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Button(
                        onClick = {
                            areaFilter = "All"
                            categoryFilter = "All"
                            cibilFilter = "All"
                            statusFilter = "All"
                            showFilterSheet = false
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary)
                    ) {
                        Text("Reset All", fontSize = 12.sp)
                    }
                }

                HorizontalDivider()

                // CATEGORY FILTER
                Text("Category", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("All", "Regular", "VIP", "Wholesale").forEach { cat ->
                        FilterChipItem(label = cat, isSelected = categoryFilter == cat, onClick = { categoryFilter = cat })
                    }
                }

                // CIBIL STATUS FILTER
                Text("CIBIL Status", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("All", "Good (750+)", "Average (650-749)", "Risk (<650)").forEach { cib ->
                        FilterChipItem(label = cib, isSelected = cibilFilter == cib, onClick = { cibilFilter = cib })
                    }
                }

                // STATUS FILTER
                Text("Account Status", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("All", "Active", "Warning", "Inactive").forEach { st ->
                        FilterChipItem(label = st, isSelected = statusFilter == st, onClick = { statusFilter = st })
                    }
                }

                Button(
                    onClick = { showFilterSheet = false },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Apply Filters", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    // ADD / EDIT CUSTOMER DIALOG
    if (showFormDialog) {
        CustomerFormDialog(
            editingCustomer = editingCustomer,
            onDismiss = { showFormDialog = false },
            onSave = { name, mobile, area, category, cibilScore, cibilStatus, creditLimit, initialBalance, balanceType, status ->
                if (editingCustomer != null) {
                    val updated = CustomerRepository.updateCustomer(
                        id = editingCustomer!!.id,
                        name = name,
                        mobile = mobile,
                        area = area,
                        category = category,
                        cibilScore = cibilScore,
                        cibilStatus = cibilStatus,
                        creditLimit = creditLimit,
                        status = status
                    )
                    if (updated != null) {
                        val idx = customers.indexOfFirst { it.id == editingCustomer!!.id }
                        if (idx >= 0) customers[idx] = updated
                        toastMsg = "Customer '$name' updated."
                    }
                } else {
                    val newC = CustomerRepository.addCustomer(
                        name = name,
                        mobile = mobile,
                        area = area,
                        category = category,
                        cibilScore = cibilScore,
                        cibilStatus = cibilStatus,
                        creditLimit = creditLimit,
                        initialBalance = initialBalance,
                        balanceType = balanceType
                    )
                    customers.add(0, newC)
                    toastMsg = "New customer '$name' added."
                }
                showFormDialog = false
            }
        )
    }

    // CUSTOMER HISTORY / TRANSACTION LEDGER SHEET
    historyCustomer?.let { customer ->
        ModalBottomSheet(
            onDismissRequest = { historyCustomer = null },
            sheetState = rememberModalBottomSheetState()
        ) {
            CustomerHistorySheet(
                customer = customer,
                onAddTransaction = { type, amount, notes ->
                    CustomerRepository.addTransaction(customer.id, type, amount, notes)
                    // Refresh local state
                    val idx = customers.indexOfFirst { it.id == customer.id }
                    if (idx >= 0) {
                        customers[idx] = CustomerRepository.getCustomers().first { it.id == customer.id }
                        historyCustomer = customers[idx]
                    }
                    toastMsg = "$type of ₹${amount.toInt()} added for ${customer.name}"
                },
                onClose = { historyCustomer = null }
            )
        }
    }

    // DELETE CONFIRMATION DIALOG
    deletingCustomer?.let { target ->
        Dialog(onDismissRequest = { deletingCustomer = null }) {
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
                    Text("Delete Customer?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Are you sure you want to delete '${target.name}' (${target.id})?", fontSize = 14.sp, color = TextMuted)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Button(
                            onClick = { deletingCustomer = null },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                CustomerRepository.deleteCustomer(target.id)
                                customers.removeAll { it.id == target.id }
                                toastMsg = "Customer '${target.name}' deleted."
                                deletingCustomer = null
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
private fun CustomerSummaryCard(
    title: String,
    value: String,
    subText: String,
    accentColor: Color
) {
    Card(
        modifier = Modifier
            .width(160.dp)
            .height(100.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(title, fontSize = 12.sp, color = TextMuted, fontWeight = FontWeight.SemiBold)
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(accentColor)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(subText, fontSize = 11.sp, color = accentColor, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun CustomerCard(
    customer: CustomerDetailsModel,
    onCall: () -> Unit,
    onMessage: () -> Unit,
    onEdit: () -> Unit,
    onHistory: () -> Unit,
    onDelete: () -> Unit
) {
    val isWarning = customer.isBadOrOverdue
    val borderStrokeColor = if (isWarning) ErrorRed.copy(alpha = 0.5f) else Color.Transparent

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(if (isWarning) 1.5.dp else 0.dp, borderStrokeColor, RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // HEADER: ID & STATUS BADGE
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                val displayId = if (customer.id.length > 12) "ID: ${customer.id.take(8)}..." else customer.id
                Text(
                    text = displayId,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryBlue,
                    maxLines = 1
                )

                val badgeBg = if (isWarning) Color(0xFFFEF2F2) else Color(0xFFF0FDF4)
                val badgeText = if (isWarning) ErrorRed else Color(0xFF16A34A)

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(badgeBg)
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = if (isWarning) "Warning" else customer.cibilStatus,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = badgeText,
                        maxLines = 1
                    )
                }
            }

            // CUSTOMER NAME
            Text(
                text = customer.name,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            // LOCATION
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.LocationOn,
                    contentDescription = null,
                    tint = TextMuted,
                    modifier = Modifier.size(15.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = customer.area,
                    fontSize = 13.sp,
                    color = TextMuted,
                    fontWeight = FontWeight.Medium
                )
            }

            // GRID DATA: MOBILE, CIBIL, BAAKI, JAMA, OUTSTANDING
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Mobile", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(customer.mobile, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text("CIBIL Score", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${customer.cibilScore}",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isWarning) ErrorRed else TextPrimary
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Baaki", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = customer.baakiFormatted,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = ErrorRed
                    )
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text("Jama", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = customer.jamaFormatted,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF16A34A)
                    )
                }

                val netBaaki = (customer.currentBalance * (if (customer.balanceType.equals("Jama", ignoreCase = true)) -1 else 1))
                val netColor = if (netBaaki > 0) ErrorRed else if (netBaaki < 0) Color(0xFF16A34A) else TextPrimary
                val netLabel = if (netBaaki > 0) "₹${netBaaki.toInt()} Baaki" else if (netBaaki < 0) "₹${(-netBaaki).toInt()} Jama" else "₹0"

                Column(modifier = Modifier.weight(1f)) {
                    Text("Outstanding", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = netLabel,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = netColor
                    )
                }
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            // ACTIONS BAR: CALL, MESSAGE, EDIT, HISTORY
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    IconButton(
                        onClick = onCall,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFEFF6FF))
                    ) {
                        Icon(Icons.Default.Call, contentDescription = "Call", tint = PrimaryBlue, modifier = Modifier.size(18.dp))
                    }

                    IconButton(
                        onClick = onMessage,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFF0FDF4))
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Message, contentDescription = "Message", tint = Color(0xFF16A34A), modifier = Modifier.size(18.dp))
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = onEdit,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Edit", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = onHistory,
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Icon(Icons.Default.History, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("History", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun FilterChipItem(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .background(if (isSelected) PrimaryBlue else Color(0xFFF1F5F9))
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 7.dp)
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) Color.White else TextPrimary
        )
    }
}

@Composable
private fun CustomerFormDialog(
    editingCustomer: CustomerDetailsModel?,
    onDismiss: () -> Unit,
    onSave: (
        name: String,
        mobile: String,
        area: String,
        category: String,
        cibilScore: Int,
        cibilStatus: String,
        creditLimit: Double,
        initialBalance: Double,
        balanceType: String,
        status: String
    ) -> Unit
) {
    var name by remember { mutableStateOf(editingCustomer?.name ?: "") }
    var mobile by remember { mutableStateOf(editingCustomer?.mobile ?: "") }
    var area by remember { mutableStateOf(editingCustomer?.area ?: "") }
    var category by remember { mutableStateOf(editingCustomer?.category ?: "Regular") }
    var cibilScoreText by remember { mutableStateOf(editingCustomer?.cibilScore?.toString() ?: "750") }
    var cibilStatus by remember { mutableStateOf(editingCustomer?.cibilStatus ?: "Normal") }
    var creditLimitText by remember { mutableStateOf(editingCustomer?.creditLimit?.toInt()?.toString() ?: "100000") }
    var initialBalanceText by remember { mutableStateOf(editingCustomer?.currentBalance?.toInt()?.toString() ?: "0") }
    var balanceType by remember { mutableStateOf(editingCustomer?.balanceType ?: "Baki") }
    var status by remember { mutableStateOf(editingCustomer?.status ?: "Active") }
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
                        text = if (editingCustomer != null) "Edit Customer" else "Add New Customer",
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
                    value = name,
                    onValueChange = { name = it; if (errorMsg != null) errorMsg = null },
                    placeholder = { Text("Customer Name *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = mobile,
                        onValueChange = { mobile = it },
                        placeholder = { Text("Mobile Number", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = area,
                        onValueChange = { area = it },
                        placeholder = { Text("Area / Location", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = creditLimitText,
                        onValueChange = { creditLimitText = it },
                        placeholder = { Text("Dis. Amount / Limit", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = cibilScoreText,
                        onValueChange = { cibilScoreText = it },
                        placeholder = { Text("CIBIL Score (e.g. 750)", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                if (editingCustomer == null) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = initialBalanceText,
                            onValueChange = { initialBalanceText = it },
                            placeholder = { Text("Opening Balance", fontSize = 13.sp) },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        )

                        Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(
                                selected = balanceType == "Baki",
                                onClick = { balanceType = "Baki" },
                                colors = RadioButtonDefaults.colors(selectedColor = ErrorRed)
                            )
                            Text("Baki", fontSize = 12.sp)
                            Spacer(modifier = Modifier.width(4.dp))
                            RadioButton(
                                selected = balanceType == "Jama",
                                onClick = { balanceType = "Jama" },
                                colors = RadioButtonDefaults.colors(selectedColor = Color(0xFF16A34A))
                            )
                            Text("Jama", fontSize = 12.sp)
                        }
                    }
                }

                Text("Category", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    listOf("Regular", "VIP", "Wholesale").forEach { cat ->
                        RadioButton(
                            selected = category == cat,
                            onClick = { category = cat },
                            colors = RadioButtonDefaults.colors(selectedColor = PrimaryBlue)
                        )
                        Text(cat, fontSize = 12.sp)
                        Spacer(modifier = Modifier.width(8.dp))
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
                            if (name.isBlank()) {
                                errorMsg = "Customer Name is required."
                            } else {
                                val cibil = cibilScoreText.toIntOrNull() ?: 750
                                val limit = creditLimitText.toDoubleOrNull() ?: 0.0
                                val bal = initialBalanceText.toDoubleOrNull() ?: 0.0
                                val calculatedStatus = if (cibil < 650) "Bad" else if (cibil < 720) "Warning" else "Normal"

                                onSave(
                                    name.trim(),
                                    mobile.trim(),
                                    area.trim(),
                                    category,
                                    cibil,
                                    calculatedStatus,
                                    limit,
                                    bal,
                                    balanceType,
                                    status
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (editingCustomer != null) "Save Changes" else "Add Customer", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun CustomerHistorySheet(
    customer: CustomerDetailsModel,
    onAddTransaction: (type: String, amount: Double, notes: String) -> Unit,
    onClose: () -> Unit
) {
    var showAddTxForm by remember { mutableStateOf(false) }
    var txType by remember { mutableStateOf("Baki") }
    var txAmountText by remember { mutableStateOf("") }
    var txNotes by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(20.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(customer.name, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Text("Ledger History (${customer.id})", fontSize = 12.sp, color = TextMuted)
            }
            IconButton(onClick = onClose) {
                Icon(Icons.Default.Close, contentDescription = "Close")
            }
        }

        HorizontalDivider()

        // CURRENT BALANCE SUMMARY
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFFF8FAFC))
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Current Balance", fontSize = 12.sp, color = TextMuted)
                Text(
                    text = customer.currentBalanceFormatted,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (customer.balanceType == "Baki") ErrorRed else Color(0xFF16A34A)
                )
            }

            Button(
                onClick = { showAddTxForm = !showAddTxForm },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(if (showAddTxForm) "Cancel" else "+ Add Entry", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        // ADD TRANSACTION FORM
        if (showAddTxForm) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text("Record New Entry", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(
                            selected = txType == "Baki",
                            onClick = { txType = "Baki" },
                            colors = RadioButtonDefaults.colors(selectedColor = ErrorRed)
                        )
                        Text("Baki (Give Credit)", fontSize = 12.sp, fontWeight = FontWeight.Bold)

                        Spacer(modifier = Modifier.width(12.dp))

                        RadioButton(
                            selected = txType == "Jama",
                            onClick = { txType = "Jama" },
                            colors = RadioButtonDefaults.colors(selectedColor = Color(0xFF16A34A))
                        )
                        Text("Jama (Receive Payment)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    OutlinedTextField(
                        value = txAmountText,
                        onValueChange = { txAmountText = it },
                        placeholder = { Text("Amount (₹)", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )

                    OutlinedTextField(
                        value = txNotes,
                        onValueChange = { txNotes = it },
                        placeholder = { Text("Notes / Invoice Ref", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )

                    Button(
                        onClick = {
                            val amt = txAmountText.toDoubleOrNull() ?: 0.0
                            if (amt > 0) {
                                onAddTransaction(txType, amt, txNotes)
                                showAddTxForm = false
                                txAmountText = ""
                                txNotes = ""
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Save Entry", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // TRANSACTION LIST
        Text("Past Transactions", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)

        if (customer.transactions.isEmpty()) {
            Text("No recorded transactions.", fontSize = 13.sp, color = TextMuted)
        } else {
            customer.transactions.forEach { tx ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color.White)
                        .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(10.dp))
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(tx.notes, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text(tx.date, fontSize = 11.sp, color = TextMuted)
                    }

                    Text(
                        text = "${if (tx.type == "Jama") "-" else "+"}${tx.amountFormatted}",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (tx.type == "Jama") Color(0xFF16A34A) else ErrorRed
                    )
                }
            }
        }
    }
}
