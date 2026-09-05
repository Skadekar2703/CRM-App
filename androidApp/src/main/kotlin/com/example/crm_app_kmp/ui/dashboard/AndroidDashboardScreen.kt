package com.example.crm_app_kmp.ui.dashboard

import kotlinx.coroutines.launch
import androidx.compose.foundation.background
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.crm_app_kmp.auth.UserSession
import com.example.crm_app_kmp.ui.components.CrmRootScaffold
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue

data class DebtorModel(
    val id: String,
    val name: String,
    val mobile: String,
    val area: String,
    val amount: Double
)

data class TransactionModel(
    val id: String,
    val customerName: String,
    val type: String,
    val amount: Double,
    val dateStr: String
)

data class NoteModel(
    val id: String,
    val title: String,
    val content: String,
    val isUrgent: Boolean
)

data class ReminderModel(
    val id: String,
    val title: String,
    val dueTime: String
)

@Composable
fun AndroidDashboardScreen(
    userSession: UserSession,
    isDarkTheme: Boolean = false,
    onToggleTheme: () -> Unit = {},
    onLogout: () -> Unit = {}
) {
    var activeSection by remember { mutableStateOf("Dashboard") }

    CrmRootScaffold(
        activeSection = activeSection,
        onNavigateSection = { activeSection = it },
        userSession = userSession,
        isDarkTheme = isDarkTheme,
        onToggleTheme = onToggleTheme,
        onLogout = onLogout
    ) {
        when (activeSection) {
            "Dashboard", "Home" -> DashboardMainContent(
                userSession = userSession,
                onLogout = onLogout,
                onNavigateSection = { activeSection = it }
            )
            "Areas" -> com.example.crm_app_kmp.ui.areas.AndroidAreasScreen()
            "Categories" -> com.example.crm_app_kmp.ui.categories.AndroidCategoriesContent()
            "Items" -> com.example.crm_app_kmp.ui.items.AndroidItemsContent()
            "Transports" -> com.example.crm_app_kmp.ui.transports.AndroidTransportsContent()
            "Udhaari" -> com.example.crm_app_kmp.ui.udhaari.AndroidUdhaariContent()
            "Cheques" -> com.example.crm_app_kmp.ui.cheques.AndroidChequesContent()
            "Customers" -> com.example.crm_app_kmp.ui.customers.AndroidCustomersContent()
            "Suppliers" -> com.example.crm_app_kmp.ui.suppliers.AndroidSuppliersContent()
            "Employees" -> com.example.crm_app_kmp.ui.employees.AndroidEmployeesContent()
            "Daag" -> com.example.crm_app_kmp.ui.daag.AndroidDaagContent()
            "Notepad", "Notes" -> com.example.crm_app_kmp.ui.notepad.AndroidNotepadContent()
            "Reminders" -> com.example.crm_app_kmp.ui.reminders.AndroidRemindersContent()
            "Expenses" -> com.example.crm_app_kmp.ui.expenses.AndroidExpensesContent()
            "Supplier Ledger", "SupplierLedger" -> com.example.crm_app_kmp.ui.supplierledger.AndroidSupplierLedgerContent()
            "Cash Book", "CashBook" -> com.example.crm_app_kmp.ui.cashbook.AndroidCashBookContent()
            "Profit & Loss", "ProfitAndLoss", "P&L" -> com.example.crm_app_kmp.ui.profitloss.AndroidProfitLossContent()
            "Aging Report", "AgingReport" -> com.example.crm_app_kmp.ui.aging.AndroidAgingReportContent()
            "Users", "UserManagement" -> {
                if (userSession.role.uppercase() == "ADMIN") {
                    com.example.crm_app_kmp.ui.users.AndroidUserManagementContent()
                } else {
                    DashboardMainContent(
                        userSession = userSession,
                        onLogout = onLogout,
                        onNavigateSection = { activeSection = it }
                    )
                }
            }
            "Settings" -> com.example.crm_app_kmp.ui.settings.AndroidSettingsContent()
            "Sign Out" -> {
                onLogout()
            }
            else -> DashboardPlaceholderScreen(title = "$activeSection Module")
        }
    }
}

@Composable
private fun DashboardMainContent(
    userSession: UserSession,
    onLogout: () -> Unit,
    onNavigateSection: (String) -> Unit = {}
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val supabaseClient = remember { com.example.crm_app_kmp.data.SupabaseAndroidClient(context) }
    val scope = rememberCoroutineScope()

    var totalBaaki by remember { mutableStateOf(0.0) }
    var totalJama by remember { mutableStateOf(0.0) }
    var todayUdhar by remember { mutableStateOf(0.0) }
    var todayJama by remember { mutableStateOf(0.0) }
    var pendingChequesCount by remember { mutableStateOf(0) }
    var urgentNotesCount by remember { mutableStateOf(0) }
    var daagMoveCount by remember { mutableStateOf(0) }

    var debtors by remember { mutableStateOf<List<DebtorModel>>(emptyList()) }
    var transactions by remember { mutableStateOf<List<TransactionModel>>(emptyList()) }
    var notes by remember { mutableStateOf<List<NoteModel>>(emptyList()) }
    var reminders by remember { mutableStateOf<List<ReminderModel>>(emptyList()) }

    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val loadData: () -> Unit = {
        scope.launch {
            isLoading = true
            errorMessage = null
            try {
                val todayStr = java.time.LocalDate.now().toString()

                // 1. Udhaari for Total Baki, Total Jama, Today's Udhaar, Today's Jama
                val udhaariRes = supabaseClient.fetchTable("udhaari")
                udhaariRes.onSuccess { arr ->
                    var bSum = 0.0
                    var jSum = 0.0
                    var uToday = 0.0
                    var jToday = 0.0
                    val txList = mutableListOf<TransactionModel>()

                    for (i in 0 until arr.length()) {
                        val obj = arr.getJSONObject(i)
                        val type = obj.optString("type", "Udhaar")
                        val amt = obj.optDouble("amount", 0.0)
                        val date = obj.optString("date", "")
                        val datePart = if (date.contains("T")) date.split("T")[0] else date
                        val cName = obj.optString("customer_name", "Customer")

                        if (type == "Udhaar" || type == "Baki") {
                            bSum += amt
                            if (datePart == todayStr) {
                                uToday += amt
                            }
                        } else if (type == "Jama") {
                            jSum += amt
                            if (datePart == todayStr) {
                                jToday += amt
                            }
                        }
                        txList.add(TransactionModel(obj.optString("id", "$i"), cName, type, amt, if (datePart == todayStr) "Today" else datePart))
                    }
                    totalBaaki = bSum
                    totalJama = jSum
                    todayUdhar = uToday
                    todayJama = jToday
                    transactions = txList.take(5)
                }

                // 2. Customers for Top Baki List
                val custRes = supabaseClient.fetchTable("customers")
                custRes.onSuccess { arr ->
                    val debtorList = mutableListOf<DebtorModel>()
                    for (i in 0 until arr.length()) {
                        val obj = arr.getJSONObject(i)
                        val rawBaki = obj.optDouble("baki", 0.0)
                        val name = obj.optString("name", "Unnamed Customer")
                        val mobile = obj.optString("mobile", obj.optString("phone", ""))
                        val area = obj.optString("area", "General Market")
                        val id = obj.optString("id", "$i")

                        if (rawBaki > 0) {
                            debtorList.add(DebtorModel(id, name, mobile, area, rawBaki))
                        }
                    }
                    debtorList.sortByDescending { it.amount }
                    debtors = debtorList.take(5)
                }

                // 3. Cheques
                val chequesRes = supabaseClient.fetchTable("cheques")
                chequesRes.onSuccess { arr ->
                    var pCount = 0
                    for (i in 0 until arr.length()) {
                        val obj = arr.getJSONObject(i)
                        val status = obj.optString("status", "Pending")
                        if (status == "Pending" || status == "Overdue") {
                            pCount++
                        }
                    }
                    pendingChequesCount = pCount
                }

                // 4. Notes
                val notesRes = supabaseClient.fetchTable("notes")
                notesRes.onSuccess { arr ->
                    var uCount = 0
                    val nList = mutableListOf<NoteModel>()

                    for (i in 0 until arr.length()) {
                        val obj = arr.getJSONObject(i)
                        val priority = obj.optString("priority", "Normal")
                        val isPinned = obj.optBoolean("is_pinned", false)
                        val isUrgent = priority == "High" || isPinned

                        if (isUrgent) uCount++
                        nList.add(
                            NoteModel(
                                id = obj.optString("id", "$i"),
                                title = obj.optString("title", "Note"),
                                content = obj.optString("content", ""),
                                isUrgent = isUrgent
                            )
                        )
                    }
                    urgentNotesCount = uCount
                    notes = nList.take(3)
                }

                // 5. Reminders
                val remRes = supabaseClient.fetchTable("reminders")
                remRes.onSuccess { arr ->
                    val rList = mutableListOf<ReminderModel>()
                    for (i in 0 until arr.length()) {
                        val obj = arr.getJSONObject(i)
                        val due = obj.optString("due_date", "")
                        val datePart = if (due.contains("T")) due.split("T")[0] else due
                        if (datePart == todayStr || due.isEmpty()) {
                            rList.add(
                                ReminderModel(
                                    id = obj.optString("id", "$i"),
                                    title = obj.optString("title", "Reminder"),
                                    dueTime = "Today"
                                )
                            )
                        }
                    }
                    reminders = rList.take(3)
                }

                // 6. Daag
                val daagRes = supabaseClient.fetchTable("daag")
                daagRes.onSuccess { arr ->
                    daagMoveCount = arr.length()
                }

                isLoading = false
            } catch (e: Exception) {
                errorMessage = e.message ?: "Unable to load live dashboard data"
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadData()
    }

    if (isLoading) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = PrimaryBlue)
                Spacer(modifier = Modifier.height(12.dp))
                Text("Loading real-time CRM data...", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        return
    }

    if (errorMessage != null) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Default.Warning, contentDescription = null, tint = ErrorRed, modifier = Modifier.size(36.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Unable to load data", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(errorMessage!!, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = loadData, colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)) {
                        Icon(Icons.Default.Refresh, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Retry")
                    }
                }
            }
        }
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // SYSTEM LIVE SYNC BAR
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("BUSINESS SNAPSHOT", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant, letterSpacing = 0.5.sp)
                Text("Real-time ledger overview", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f))
            }

            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color(0xFFDCFCE7))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFF16A34A)))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Live Synced", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF15803D))
                }
            }
        }

        // BUSINESS SNAPSHOT HORIZONTAL CARDS (7 CARDS REQUIRED IN EXACT ORDER)
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            MetricCard("TOTAL BAKI", "₹${totalBaaki.toInt()}", "Sum of all Baki", ErrorRed, { onNavigateSection("Customers") })
            MetricCard("TOTAL JAMA", "₹${totalJama.toInt()}", "Sum of all Jama", Color(0xFF16A34A), { onNavigateSection("Customers") })
            MetricCard("TODAY'S UDHAAR", "₹${todayUdhar.toInt()}", "Given Today", PrimaryBlue, { onNavigateSection("Udhaari") })
            MetricCard("TODAY'S JAMA", "₹${todayJama.toInt()}", "Received Today", Color(0xFF16A34A), { onNavigateSection("Udhaari") })
            MetricCard("CHEQUES", "$pendingChequesCount", "Pending Clearance", Color(0xFFCA8A04), { onNavigateSection("Cheques") })
            MetricCard("URGENT NOTES", "$urgentNotesCount", "High Priority", ErrorRed, { onNavigateSection("Notepad") })
            MetricCard("DAAG MOVE", "$daagMoveCount", "Dispatched", PrimaryBlue, { onNavigateSection("Daag") })
        }

        // FOUR PRIMARY SHORTCUTS
        Text("PRIMARY ACTIONS", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant, letterSpacing = 0.5.sp)

        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StitchShortcutCard(
                    title = "+ Customer",
                    sub = "Add new party",
                    containerColor = Color(0xFFF0FDF4),
                    borderColor = Color(0xFFBBF7D0),
                    iconColor = Color(0xFF15803D),
                    iconBg = Color(0xFFDCFCE7),
                    icon = Icons.Default.PersonAdd,
                    onClick = { onNavigateSection("Customers") },
                    modifier = Modifier.weight(1f)
                )

                StitchShortcutCard(
                    title = "+ Udhar",
                    sub = "Debit / Give credit",
                    containerColor = Color(0xFFFEF2F2),
                    borderColor = Color(0xFFFECACA),
                    iconColor = Color(0xFFB91C1C),
                    iconBg = Color(0xFFFEE2E2),
                    icon = Icons.Default.Add,
                    onClick = { onNavigateSection("Udhaari") },
                    modifier = Modifier.weight(1f)
                )
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StitchShortcutCard(
                    title = "+ Jama",
                    sub = "Credit / Receive payment",
                    containerColor = Color(0xFFECFDF5),
                    borderColor = Color(0xFFA7F3D0),
                    iconColor = Color(0xFF047857),
                    iconBg = Color(0xFFD1FAE5),
                    icon = Icons.Default.AttachMoney,
                    onClick = { onNavigateSection("Udhaari") },
                    modifier = Modifier.weight(1f)
                )

                StitchShortcutCard(
                    title = "+ Daag",
                    sub = "Record stock dispatch",
                    containerColor = Color(0xFFEFF6FF),
                    borderColor = Color(0xFFBFDBFE),
                    iconColor = Color(0xFF1D4ED8),
                    iconBg = Color(0xFFDBEAFE),
                    icon = Icons.Default.LocalShipping,
                    onClick = { onNavigateSection("Daag") },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // TOP BAKI (DEBTORS) MOBILE REPRESENTATION
        SectionHeader("🤝 Top Baki (Debtors)") { onNavigateSection("Customers") }
        if (debtors.isEmpty()) {
            EmptyStateCard("No active Baki records", "All customer receivables are fully settled.")
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                debtors.forEach { d ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth().clickable { onNavigateSection("Customers") }
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(d.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                Text("${d.area} • Ph: ${d.mobile}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text("₹${d.amount.toInt()}", fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = ErrorRed)
                        }
                    }
                }
            }
        }

        // PINNED & URGENT NOTES
        SectionHeader("📌 Pinned & Urgent Notes") { onNavigateSection("Notepad") }
        if (notes.isEmpty()) {
            EmptyStateCard("No notes available", "Create notes in Notepad to pin urgent tasks here.")
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                notes.forEach { note ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(note.title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            if (note.content.isNotEmpty()) {
                                Text(note.content, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }

        // TODAY'S REMINDERS
        SectionHeader("⏰ Today's Reminders") { onNavigateSection("Reminders") }
        if (reminders.isEmpty()) {
            EmptyStateCard("No reminders today", "You have no follow-up reminders scheduled for today.")
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                reminders.forEach { rem ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(rem.title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                Text(rem.dueTime, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text("Scheduled", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        }
                    }
                }
            }
        }

        // RECENT TRANSACTIONS
        SectionHeader("📖 Recent Transactions") { onNavigateSection("Udhaari") }
        if (transactions.isEmpty()) {
            EmptyStateCard("No recent transactions", "No Jama or Udhar entries recorded yet.")
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                transactions.forEach { t ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth().clickable { onNavigateSection("Udhaari") }
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(t.customerName, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                Text("${t.type} • ${t.dateStr}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            val isJama = t.type == "Jama"
                            Text(
                                text = if (isJama) "- ₹${t.amount.toInt()}" else "+ ₹${t.amount.toInt()}",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isJama) Color(0xFF16A34A) else ErrorRed
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MetricCard(
    title: String,
    value: String,
    sub: String,
    valueColor: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(150.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(title, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = valueColor)
            Spacer(modifier = Modifier.height(2.dp))
            Text(sub, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f))
        }
    }
}

@Composable
private fun StitchShortcutCard(
    title: String,
    sub: String,
    containerColor: Color,
    borderColor: Color,
    iconColor: Color,
    iconBg: Color,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(iconBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(title, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = iconColor)
                Text(sub, fontSize = 11.sp, color = iconColor.copy(alpha = 0.8f))
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String, onViewAll: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
        Text("View All →", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue, modifier = Modifier.clickable { onViewAll() })
    }
}

@Composable
private fun EmptyStateCard(title: String, sub: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
            Spacer(modifier = Modifier.height(2.dp))
            Text(sub, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun DashboardPlaceholderScreen(title: String) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Text(title, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
    }
}
