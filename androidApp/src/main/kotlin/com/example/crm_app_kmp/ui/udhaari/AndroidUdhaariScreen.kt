package com.example.crm_app_kmp.ui.udhaari

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
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
import com.example.crm_app_kmp.udhaari.UdhaariCurrencyFormatter
import com.example.crm_app_kmp.udhaari.UdhaariCustomerModel
import com.example.crm_app_kmp.udhaari.UdhaariRepository
import com.example.crm_app_kmp.udhaari.UdhaariTransactionModel
import com.example.crm_app_kmp.ui.components.CrmRootScaffold
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary
import kotlinx.coroutines.launch
import org.json.JSONObject

@Composable
fun AndroidUdhaariScreen(
    onNavigateSection: (String) -> Unit = {}
) {
    CrmRootScaffold(
        activeSection = "Udhaari",
        onNavigateSection = onNavigateSection
    ) {
        AndroidUdhaariContent()
    }
}

@Composable
fun AndroidUdhaariContent() {
    val context = LocalContext.current
    val supabaseClient = remember { com.example.crm_app_kmp.data.SupabaseAndroidClient(context) }
    val scope = rememberCoroutineScope()

    val customersList = remember { mutableStateListOf<UdhaariCustomerModel>() }
    var searchQuery by remember { mutableStateOf("") }
    var areaFilter by remember { mutableStateOf("All") }

    var showCustomerDialog by remember { mutableStateOf(false) }
    var showTxnDialog by remember { mutableStateOf(false) }
    var showHistoryDialog by remember { mutableStateOf(false) }
    var presetTxnType by remember { mutableStateOf("Baki") }
    var selectedTxnCustomerUid by remember { mutableStateOf("") }
    var historyCustomer by remember { mutableStateOf<UdhaariCustomerModel?>(null) }

    var editingCustomer by remember { mutableStateOf<UdhaariCustomerModel?>(null) }
    var deletingCustomer by remember { mutableStateOf<UdhaariCustomerModel?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    fun refreshUdhaariCustomers() {
        scope.launch {
            val res = supabaseClient.fetchTable("customers")
            res.onSuccess { array ->
                customersList.clear()
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val rawBaki = obj.optDouble("baki", 0.0)
                    val rawJama = obj.optDouble("jama", 0.0)
                    val bakiVal = if (rawBaki >= 0) rawBaki else 0.0
                    val jamaVal = if (rawBaki < 0) kotlin.math.abs(rawBaki) else rawJama

                    customersList.add(
                        UdhaariCustomerModel(
                            uid = obj.optString("id", ""),
                            name = obj.optString("name", "Customer"),
                            mobile = obj.optString("phone", ""),
                            area = obj.optString("area", "General Area"),
                            category = obj.optString("category", "Regular"),
                            cibilStatus = obj.optString("cibil_status", "Good"),
                            baki = bakiVal,
                            jama = jamaVal,
                            creditLimit = obj.optDouble("credit_limit", 100000.0),
                            lastTxnDate = "Recent",
                            status = obj.optString("status", "Active")
                        )
                    )
                }
            }
        }
    }

    androidx.compose.runtime.LaunchedEffect(Unit) {
        refreshUdhaariCustomers()
    }

    val totalBaki by remember {
        androidx.compose.runtime.derivedStateOf {
            UdhaariRepository.calculateTotalBaki(customersList)
        }
    }
    val totalJama by remember {
        androidx.compose.runtime.derivedStateOf {
            UdhaariRepository.calculateTotalJama(customersList)
        }
    }
    val totalOutstanding by remember {
        androidx.compose.runtime.derivedStateOf {
            UdhaariRepository.calculateTotalOutstanding(totalBaki, totalJama)
        }
    }

    val filteredCustomers = customersList.filter { c ->
        val q = searchQuery.lowercase().trim()
        val matchesQuery = q.isEmpty() ||
                c.uid.lowercase().contains(q) ||
                c.name.lowercase().contains(q) ||
                c.mobile.lowercase().contains(q) ||
                c.area.lowercase().contains(q)

        val matchesArea = areaFilter == "All" || c.area.equals(areaFilter, ignoreCase = true)
        matchesQuery && matchesArea
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // SUMMARY CARDS (Single Source of Truth)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // CARD 1: TOTAL BAKI
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "Total Baki",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = ErrorRed
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = UdhaariCurrencyFormatter.formatIndianCurrency(totalBaki),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = ErrorRed
                        )
                    }
                }

                // CARD 2: TOTAL JAMA
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "Total Jama",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF16A34A)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = UdhaariCurrencyFormatter.formatIndianCurrency(totalJama),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF16A34A)
                        )
                    }
                }

                // CARD 3: OUTSTANDING
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "Outstanding",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = UdhaariCurrencyFormatter.formatIndianCurrency(totalOutstanding),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = if (totalOutstanding >= 0) ErrorRed else Color(0xFF16A34A)
                        )
                    }
                }
            }

            // ROUNDED SEARCH BAR
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search customers...", fontSize = 14.sp, color = TextMuted) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

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

            // CUSTOMERS LIST
            if (filteredCustomers.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No customer credit records found.", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredCustomers) { customer ->
                        MobileUdhaariCustomerCard(
                            customer = customer,
                            onAddBaki = {
                                presetTxnType = "Baki"
                                selectedTxnCustomerUid = customer.uid
                                showTxnDialog = true
                            },
                            onAddJama = {
                                presetTxnType = "Jama"
                                selectedTxnCustomerUid = customer.uid
                                showTxnDialog = true
                            },
                            onViewHistory = {
                                historyCustomer = customer
                                showHistoryDialog = true
                            },
                            onEdit = {
                                editingCustomer = customer
                                showCustomerDialog = true
                            },
                            onDelete = {
                                deletingCustomer = customer
                            }
                        )
                    }
                }
            }
        }

        // FAB (+)
        FloatingActionButton(
            onClick = {
                presetTxnType = "Baki"
                selectedTxnCustomerUid = customersList.firstOrNull()?.uid ?: ""
                showTxnDialog = true
            },
            containerColor = PrimaryBlue,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Record Transaction", modifier = Modifier.size(24.dp))
        }
    }

    // ADD / EDIT CUSTOMER DIALOG
    if (showCustomerDialog) {
        UdhaariCustomerFormDialog(
            editingCustomer = editingCustomer,
            onDismiss = { showCustomerDialog = false },
            onSave = { name, mobile, area, category, cibil, limit ->
                scope.launch {
                    val payload = JSONObject().apply {
                        put("name", name)
                        put("phone", mobile)
                        put("area", area)
                        put("category", category)
                        put("cibil_status", cibil)
                        put("credit_limit", limit)
                    }
                    if (editingCustomer != null) {
                        supabaseClient.updateRecord("customers", editingCustomer!!.uid, payload)
                        toastMsg = "Customer '$name' updated."
                    } else {
                        supabaseClient.insertRecord("customers", payload)
                        toastMsg = "Customer '$name' added."
                    }
                    refreshUdhaariCustomers()
                }
                showCustomerDialog = false
            }
        )
    }

    // ADD TRANSACTION DIALOG
    if (showTxnDialog) {
        UdhaariTxnDialog(
            customers = customersList,
            initialType = presetTxnType,
            initialCustomerUid = selectedTxnCustomerUid,
            onDismiss = { showTxnDialog = false },
            onSave = { uid, type, amount, notes ->
                scope.launch {
                    val targetC = customersList.find { it.uid == uid }
                    var newBaki = targetC?.baki ?: 0.0
                    var newJama = targetC?.jama ?: 0.0
                    if (type.equals("Baki", ignoreCase = true)) {
                        newBaki += amount
                    } else {
                        newBaki = kotlin.math.max(0.0, newBaki - amount)
                        newJama += amount
                    }

                    val txnPayload = JSONObject().apply {
                        put("customer_id", uid)
                        put("customer_name", targetC?.name ?: "Customer")
                        put("type", type)
                        put("amount", amount)
                        put("notes", notes)
                        put("status", "Completed")
                    }
                    supabaseClient.insertRecord("udhaari", txnPayload)

                    val custPayload = JSONObject().apply {
                        put("baki", newBaki)
                        put("jama", newJama)
                    }
                    supabaseClient.updateRecord("customers", uid, custPayload)

                    toastMsg = "₹${amount.toInt()} $type recorded for ${targetC?.name}."
                    refreshUdhaariCustomers()
                }
                showTxnDialog = false
            }
        )
    }

    // HISTORY DIALOG
    if (showHistoryDialog && historyCustomer != null) {
        UdhaariHistoryDialog(
            customer = historyCustomer!!,
            supabaseClient = supabaseClient,
            onDismiss = { showHistoryDialog = false },
            onRefresh = { refreshUdhaariCustomers() }
        )
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
                    Text("Are you sure you want to delete '${target.name}'?", fontSize = 14.sp, color = TextMuted)

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
                                scope.launch {
                                    supabaseClient.deleteRecord("customers", target.uid)
                                    refreshUdhaariCustomers()
                                }
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
private fun MobileUdhaariCustomerCard(
    customer: UdhaariCustomerModel,
    onAddBaki: () -> Unit,
    onAddJama: () -> Unit,
    onViewHistory: () -> Unit,
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
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    val initials = customer.name.split(" ").take(2).mapNotNull { it.firstOrNull() }.joinToString("").uppercase().ifEmpty { "C" }
                    val avatarBg = when (customer.cibilStatus) {
                        "Good" -> Color(0xFFDCFCE7)
                        "Average" -> Color(0xFFFEF9C3)
                        else -> Color(0xFFE0F2FE)
                    }
                    val avatarText = when (customer.cibilStatus) {
                        "Good" -> Color(0xFF15803D)
                        "Average" -> Color(0xFFA16207)
                        else -> Color(0xFF0369A1)
                    }

                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(avatarBg),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(initials, color = avatarText, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column {
                        Text(
                            text = customer.name,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, tint = TextMuted, modifier = Modifier.size(13.dp))
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(customer.area, fontSize = 12.sp, color = TextMuted)
                        }
                    }
                }

                // Outstanding amount
                Column(horizontalAlignment = Alignment.End) {
                    Text("Outstanding", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Text(
                        text = UdhaariCurrencyFormatter.formatIndianCurrency(customer.outstanding),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = if (customer.outstanding >= 0) ErrorRed else Color(0xFF16A34A)
                    )
                }
            }

            // Baki & Jama metrics box
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFFF8FAFC))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Total Baki", fontSize = 11.sp, color = ErrorRed, fontWeight = FontWeight.Bold)
                    Text(UdhaariCurrencyFormatter.formatIndianCurrency(customer.baki), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Total Jama", fontSize = 11.sp, color = Color(0xFF16A34A), fontWeight = FontWeight.Bold)
                    Text(UdhaariCurrencyFormatter.formatIndianCurrency(customer.jama), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF16A34A))
                }
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Button(
                        onClick = onAddBaki,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEF2F2), contentColor = ErrorRed),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.height(30.dp)
                    ) {
                        Text("+ Baki", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = onAddJama,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF0FDF4), contentColor = Color(0xFF16A34A)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.height(30.dp)
                    ) {
                        Text("+ Jama", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Box(
                        modifier = Modifier
                            .size(30.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFF1F5F9))
                            .clickable { onViewHistory() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.History, contentDescription = "History", tint = TextPrimary, modifier = Modifier.size(15.dp))
                    }

                    Box(
                        modifier = Modifier
                            .size(30.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFF1F5F9))
                            .clickable { onEdit() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit Profile", tint = TextPrimary, modifier = Modifier.size(15.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun UdhaariHistoryDialog(
    customer: UdhaariCustomerModel,
    supabaseClient: com.example.crm_app_kmp.data.SupabaseAndroidClient,
    onDismiss: () -> Unit,
    onRefresh: () -> Unit
) {
    val scope = rememberCoroutineScope()
    val transactions = remember { mutableStateListOf<UdhaariTransactionModel>() }
    var isLoading by remember { mutableStateOf(true) }

    fun fetchLogs() {
        scope.launch {
            isLoading = true
            val res = supabaseClient.fetchTable("udhaari")
            res.onSuccess { array ->
                transactions.clear()
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val custId = obj.optString("customer_id", "")
                    val custName = obj.optString("customer_name", "")
                    if (custId == customer.uid || (customer.uid.isBlank() && custName == customer.name)) {
                        transactions.add(
                            UdhaariTransactionModel(
                                id = obj.optString("id", ""),
                                customerUid = custId,
                                type = obj.optString("type", "Baki"),
                                amount = obj.optDouble("amount", 0.0),
                                date = obj.optString("created_at", "Recent").take(10),
                                notes = obj.optString("notes", "")
                            )
                        )
                    }
                }
            }
            isLoading = false
        }
    }

    androidx.compose.runtime.LaunchedEffect(customer.uid) {
        fetchLogs()
    }

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
                    Text("History — ${customer.name}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                if (isLoading) {
                    Text("Loading history...", fontSize = 13.sp, color = TextMuted)
                } else if (transactions.isEmpty()) {
                    Text("No transactions found for ${customer.name}.", fontSize = 13.sp, color = TextMuted)
                } else {
                    LazyColumn(
                        modifier = Modifier.height(240.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(transactions) { txn ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFF8FAFC))
                                    .padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("${txn.type} — ${txn.notes.ifEmpty { "Entry" }}", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = if (txn.type == "Baki") ErrorRed else Color(0xFF16A34A))
                                    Text(txn.date, fontSize = 11.sp, color = TextMuted)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(UdhaariCurrencyFormatter.formatIndianCurrency(txn.amount), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = if (txn.type == "Baki") ErrorRed else Color(0xFF16A34A))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    IconButton(
                                        onClick = {
                                            scope.launch {
                                                supabaseClient.deleteRecord("udhaari", txn.id)
                                                fetchLogs()
                                                onRefresh()
                                            }
                                        },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(Icons.Default.Delete, contentDescription = "Delete", tint = ErrorRed, modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                }

                Button(
                    onClick = onDismiss,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.align(Alignment.End)
                ) {
                    Text("Close", fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
private fun UdhaariCustomerFormDialog(
    editingCustomer: UdhaariCustomerModel?,
    onDismiss: () -> Unit,
    onSave: (name: String, mobile: String, area: String, category: String, cibil: String, limit: Double) -> Unit
) {
    var name by remember { mutableStateOf(editingCustomer?.name ?: "") }
    var mobile by remember { mutableStateOf(editingCustomer?.mobile ?: "") }
    var area by remember { mutableStateOf(editingCustomer?.area ?: "Main Bazar") }
    var category by remember { mutableStateOf(editingCustomer?.category ?: "Retailer") }
    var cibilStatus by remember { mutableStateOf(editingCustomer?.cibilStatus ?: "Good") }
    var creditLimit by remember { mutableStateOf(editingCustomer?.creditLimit?.toString() ?: "50000") }
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
                        text = if (editingCustomer != null) "Edit Customer Profile" else "Add Customer Profile",
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
                        placeholder = { Text("Area Name", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                OutlinedTextField(
                    value = creditLimit,
                    onValueChange = { creditLimit = it },
                    placeholder = { Text("Credit Limit (₹)", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                Text("CIBIL Status", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    listOf("Good", "Average", "Bad").forEach { st ->
                        RadioButton(
                            selected = cibilStatus == st,
                            onClick = { cibilStatus = st },
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
                            val limitNum = creditLimit.toDoubleOrNull() ?: 50000.0
                            if (name.isBlank()) {
                                errorMsg = "Customer Name is required."
                            } else {
                                onSave(name.trim(), mobile.trim(), area.trim(), category, cibilStatus, limitNum)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (editingCustomer != null) "Save Profile" else "Add Profile", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun UdhaariTxnDialog(
    customers: List<UdhaariCustomerModel>,
    initialType: String = "Baki",
    initialCustomerUid: String = "",
    onDismiss: () -> Unit,
    onSave: (customerUid: String, type: String, amount: Double, notes: String) -> Unit
) {
    var selectedUid by remember {
        mutableStateOf(
            if (initialCustomerUid.isNotBlank() && customers.any { it.uid == initialCustomerUid }) initialCustomerUid else (customers.firstOrNull()?.uid ?: "")
        )
    }
    var txnType by remember { mutableStateOf(initialType) }
    var amount by remember { mutableStateOf("1000") }
    var notes by remember { mutableStateOf("") }
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
                    Text("Record $txnType Transaction", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                errorMsg?.let { err ->
                    Text("⚠️ $err", color = ErrorRed, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                // CUSTOMER SELECTOR
                Text("Select Customer *", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                var expandedCustomerDropdown by remember { mutableStateOf(false) }
                val selectedCustomerName = customers.find { it.uid == selectedUid }?.name ?: "Select Customer"

                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedButton(
                        onClick = { expandedCustomerDropdown = true },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(selectedCustomerName, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                        }
                    }

                    DropdownMenu(
                        expanded = expandedCustomerDropdown,
                        onDismissRequest = { expandedCustomerDropdown = false }
                    ) {
                        customers.forEach { cust ->
                            DropdownMenuItem(
                                text = { Text("${cust.name} (${cust.area})", fontSize = 13.sp) },
                                onClick = {
                                    selectedUid = cust.uid
                                    expandedCustomerDropdown = false
                                }
                            )
                        }
                    }
                }

                Text("Transaction Type", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(selected = txnType == "Baki", onClick = { txnType = "Baki" }, colors = RadioButtonDefaults.colors(selectedColor = ErrorRed))
                    Text("Baki (Debit/Debt)", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                    Spacer(modifier = Modifier.width(16.dp))
                    RadioButton(selected = txnType == "Jama", onClick = { txnType = "Jama" }, colors = RadioButtonDefaults.colors(selectedColor = Color(0xFF16A34A)))
                    Text("Jama (Credit/Payment)", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF16A34A))
                }

                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it; if (errorMsg != null) errorMsg = null },
                    placeholder = { Text("Amount (₹) *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    placeholder = { Text("Notes / Reference", fontSize = 13.sp) },
                    singleLine = true,
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
                            val amtNum = amount.toDoubleOrNull()
                            if (selectedUid.isBlank()) {
                                errorMsg = "Please select a customer."
                            } else if (amtNum == null || amtNum <= 0) {
                                errorMsg = "Please enter a valid amount."
                            } else {
                                onSave(selectedUid, txnType, amtNum, notes.trim())
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = if (txnType == "Baki") ErrorRed else Color(0xFF16A34A)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Save $txnType", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
