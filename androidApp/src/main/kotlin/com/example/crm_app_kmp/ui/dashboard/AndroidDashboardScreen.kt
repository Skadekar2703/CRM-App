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
import androidx.compose.material.icons.automirrored.filled.TrendingDown
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
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
import com.example.crm_app_kmp.dashboard.DebtorItem
import com.example.crm_app_kmp.dashboard.MockDashboardRepository
import com.example.crm_app_kmp.ui.components.CrmRootScaffold
import com.example.crm_app_kmp.ui.theme.CardBackground
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@Composable
fun AndroidDashboardScreen(
    userSession: UserSession,
    onLogout: () -> Unit
) {
    var activeSection by remember { mutableStateOf("Dashboard") }

    CrmRootScaffold(
        activeSection = activeSection,
        onNavigateSection = { activeSection = it },
        userSession = userSession,
        onLogout = onLogout
    ) {
        when (activeSection) {
            "Dashboard", "Home" -> DashboardMainContent(
                userSession = userSession,
                onLogout = onLogout,
                onNavigateSection = { activeSection = it }
            )
            "Sales" -> com.example.crm_app_kmp.ui.sales.SalesScreen()
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
            "Users", "UserManagement" -> com.example.crm_app_kmp.ui.users.AndroidUserManagementContent()
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
    val scope = androidx.compose.runtime.rememberCoroutineScope()

    var totalSales by remember { mutableStateOf(0.0) }
    var txCount by remember { mutableStateOf(0) }
    var itemsCount by remember { mutableStateOf(0) }
    var totalBaaki by remember { mutableStateOf(0.0) }
    var totalJama by remember { mutableStateOf(0.0) }
    var isLoading by remember { mutableStateOf(true) }

    androidx.compose.runtime.LaunchedEffect(Unit) {
        scope.launch {
            val salesRes = supabaseClient.fetchSalesHistory()
            val itemsRes = supabaseClient.fetchItems()
            val custRes = supabaseClient.fetchTable("customers")

            salesRes.onSuccess { list ->
                totalSales = list.sumOf { it.total }
                txCount = list.size
            }
            itemsRes.onSuccess { items ->
                itemsCount = items.size
            }
            custRes.onSuccess { arr ->
                var bSum = 0.0
                var jSum = 0.0
                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    val rawBaki = obj.optDouble("baki", 0.0)
                    if (rawBaki > 0) {
                        bSum += rawBaki
                    } else if (rawBaki < 0) {
                        jSum += kotlin.math.abs(rawBaki)
                    }
                }
                totalBaaki = bSum
                totalJama = jSum
            }
            isLoading = false
        }
    }

    val debtors = remember { MockDashboardRepository.getDebtors() }
    val urgentNotes = remember { MockDashboardRepository.getUrgentNotes() }
    val outstanding = totalBaaki - totalJama

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // SUMMARY CARDS (HORIZONTAL SCROLL)
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            SummaryCard(
                title = "Total Sales",
                amount = "₹${totalSales.toInt()}",
                change = "$txCount Completed",
                isPositive = true
            )
            SummaryCard(
                title = "Live Inventory",
                amount = "$itemsCount Products",
                change = "Connected to Supabase",
                isPositive = true
            )
            SummaryCard(
                title = "Total Baaki",
                amount = "₹${totalBaaki.toInt()}",
                change = "Receivable",
                isPositive = false
            )
            SummaryCard(
                title = "Total Jama",
                amount = "₹${totalJama.toInt()}",
                change = "Received",
                isPositive = true
            )
            SummaryCard(
                title = "Outstanding",
                amount = if (outstanding >= 0) "₹${outstanding.toInt()} Baaki" else "₹${(-outstanding).toInt()} Jama",
                change = "Net Balance",
                isPositive = outstanding <= 0
            )
        }

        // QUICK ACTION GRID
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickActionCard(
                    title = "+ Customer",
                    icon = Icons.Default.PersonAdd,
                    bgColor = Color(0xFFE8F5E9),
                    contentColor = Color(0xFF2E7D32),
                    onClick = { onNavigateSection("Customers") },
                    modifier = Modifier.weight(1f)
                )
                QuickActionCard(
                    title = "+ Udhar",
                    icon = Icons.Default.Add,
                    bgColor = Color(0xFFFFEBEE),
                    contentColor = Color(0xFFC62828),
                    onClick = { onNavigateSection("Udhaari") },
                    modifier = Modifier.weight(1f)
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickActionCard(
                    title = "+ Jama",
                    icon = Icons.Default.AttachMoney,
                    bgColor = Color(0xFFE8F5E9),
                    contentColor = Color(0xFF2E7D32),
                    onClick = { onNavigateSection("Udhaari") },
                    modifier = Modifier.weight(1f)
                )
                QuickActionCard(
                    title = "+ Daag",
                    icon = Icons.Default.LocalShipping,
                    bgColor = Color(0xFFE3F2FD),
                    contentColor = Color(0xFF1565C0),
                    onClick = { onNavigateSection("Daag") },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // PINNED & URGENT NOTES
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(
                text = "Pinned & Urgent Notes",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            urgentNotes.forEach { note ->
                NoteCard(
                    title = note.title,
                    dateTime = note.dateTimeInfo,
                    accentColor = if (note.priority == "HIGH") ErrorRed else PrimaryBlue
                )
            }
        }

        // TOP BAKI (DEBTORS)
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "TOP BAKI (DEBTORS)",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    Text(
                        text = "View All",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryBlue,
                        modifier = Modifier.clickable { onNavigateSection("Udhaari") }
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                debtors.take(3).forEach { debtor ->
                    DebtorRow(debtor = debtor)
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun SummaryCard(
    title: String,
    amount: String,
    change: String,
    isPositive: Boolean
) {
    Card(
        modifier = Modifier
            .width(180.dp)
            .height(120.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = title,
                fontSize = 13.sp,
                color = TextMuted,
                fontWeight = FontWeight.Medium
            )

            Text(
                text = amount,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = if (isPositive) Icons.AutoMirrored.Filled.TrendingUp else Icons.AutoMirrored.Filled.TrendingDown,
                    contentDescription = null,
                    tint = if (isPositive) Color(0xFF16A34A) else ErrorRed,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = change,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isPositive) Color(0xFF16A34A) else ErrorRed
                )
            }
        }
    }
}

@Composable
private fun QuickActionCard(
    title: String,
    icon: ImageVector,
    bgColor: Color,
    contentColor: Color,
    onClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .height(85.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = contentColor,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = title,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = contentColor
            )
        }
    }
}

@Composable
private fun NoteCard(
    title: String,
    dateTime: String,
    accentColor: Color
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(36.dp)
                    .background(accentColor, RoundedCornerShape(2.dp))
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                Text(
                    text = dateTime,
                    fontSize = 12.sp,
                    color = TextMuted
                )
            }
        }
    }
}

@Composable
private fun DebtorRow(debtor: DebtorItem) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFE2E8F0)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = debtor.customerName.take(2).uppercase(),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF0F172A)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column {
                Text(
                    text = debtor.customerName,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                Text(
                    text = debtor.lastPaidInfo,
                    fontSize = 12.sp,
                    color = TextMuted
                )
            }
        }

        Text(
            text = debtor.amountFormatted,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = ErrorRed
        )
    }
}

@Composable
private fun DashboardPlaceholderScreen(title: String) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = title,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = TextMuted
        )
    }
}
