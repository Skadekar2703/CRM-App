package com.example.crm_app_kmp.ui.profitloss

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import com.example.crm_app_kmp.data.SupabaseAndroidClient
import com.example.crm_app_kmp.profitloss.ProfitLossCalculator
import com.example.crm_app_kmp.profitloss.ProfitLossReport
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue

private fun getTodayISO(): String {
    val cal = java.util.Calendar.getInstance()
    return String.format("%04d-%02d-%02d", cal.get(java.util.Calendar.YEAR), cal.get(java.util.Calendar.MONTH) + 1, cal.get(java.util.Calendar.DAY_OF_MONTH))
}

private fun getFirstOfMonthISO(): String {
    val cal = java.util.Calendar.getInstance()
    return String.format("%04d-%02d-01", cal.get(java.util.Calendar.YEAR), cal.get(java.util.Calendar.MONTH) + 1)
}

private fun getFirstOfWeekISO(): String {
    val cal = java.util.Calendar.getInstance()
    cal.firstDayOfWeek = java.util.Calendar.MONDAY
    cal.set(java.util.Calendar.DAY_OF_WEEK, java.util.Calendar.MONDAY)
    return String.format("%04d-%02d-%02d", cal.get(java.util.Calendar.YEAR), cal.get(java.util.Calendar.MONTH) + 1, cal.get(java.util.Calendar.DAY_OF_MONTH))
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidProfitLossContent() {
    val context = LocalContext.current
    val supabaseClient = remember { SupabaseAndroidClient(context) }
    val scope = rememberCoroutineScope()

    var fromDate by remember { mutableStateOf(getFirstOfMonthISO()) }
    var toDate by remember { mutableStateOf(getTodayISO()) }
    var activeChip by remember { mutableStateOf("This Month") }
    var toastMsg by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    var report by remember {
        mutableStateOf(
            ProfitLossCalculator.calculate(getFirstOfMonthISO(), getTodayISO(), 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
        )
    }

    fun fetchAndCalculatePL() {
        scope.launch {
            isLoading = true
            val res = supabaseClient.fetchProfitLossReport(fromDate, toDate)
            res.onSuccess { rep ->
                report = rep
            }.onFailure { err ->
                toastMsg = "Error: ${err.message}"
            }
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        fetchAndCalculatePL()
    }

    val totalBreakdownSum = report.purchases + report.expenses + report.salaries + report.breakdown.netProfit
    val purchasesPct = if (totalBreakdownSum > 0) (report.purchases / totalBreakdownSum).toFloat() else 0f
    val expensesPct = if (totalBreakdownSum > 0) (report.expenses / totalBreakdownSum).toFloat() else 0f
    val salariesPct = if (totalBreakdownSum > 0) (report.salaries / totalBreakdownSum).toFloat() else 0f
    val netProfitPct = if (totalBreakdownSum > 0) (report.breakdown.netProfit / totalBreakdownSum).toFloat() else 0f

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // REPORT PERIOD CARD
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Report Period", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)

                    // QUICK DATE RANGE CHIPS
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("Today", "This Week", "This Month", "Custom").forEach { chip ->
                            val isSelected = activeChip == chip
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(if (isSelected) PrimaryBlue else MaterialTheme.colorScheme.surfaceVariant)
                                    .clickable {
                                        activeChip = chip
                                        val todayStr = getTodayISO()
                                        when (chip) {
                                            "Today" -> {
                                                fromDate = todayStr
                                                toDate = todayStr
                                            }
                                            "This Week" -> {
                                                fromDate = getFirstOfWeekISO()
                                                toDate = todayStr
                                            }
                                            "This Month" -> {
                                                fromDate = getFirstOfMonthISO()
                                                toDate = todayStr
                                            }
                                        }
                                        fetchAndCalculatePL()
                                    }
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Text(
                                    text = chip,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        com.example.crm_app_kmp.ui.components.AppDatePicker(
                            label = "Start Date",
                            value = fromDate,
                            onDateSelected = {
                                fromDate = it
                                activeChip = "Custom"
                            }
                        )
                    }

                    Box(modifier = Modifier.weight(1f)) {
                        com.example.crm_app_kmp.ui.components.AppDatePicker(
                            label = "End Date",
                            value = toDate,
                            onDateSelected = {
                                toDate = it
                                activeChip = "Custom"
                            }
                        )
                    }
                }

                Button(
                    onClick = {
                        fetchAndCalculatePL()
                        toastMsg = "Report recalculated from Supabase."
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth().height(44.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.height(20.dp).width(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text("Recalculate Profit & Loss", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }

                Text("Selected: ${report.fromDate} to ${report.toDate}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
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

        // FOUR SUMMARY CARDS GRID (2x2)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                // CARD 1: UDHAARI
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("UDHAARI", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold)
                        Text(ProfitLossCalculator.formatINR(report.udhaari), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                        Text("Customer credit / Baki", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                // CARD 2: JAMA
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("JAMA", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold)
                        Text(ProfitLossCalculator.formatINR(report.jama), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF16A34A))
                        Text("Payments received", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                // CARD 3: SALARIES
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("SALARIES", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold)
                        Text(ProfitLossCalculator.formatINR(report.salaries), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFFD97706))
                        Text("Employee / labour cost", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                // CARD 4: NET PROFIT
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(if (report.isLoss) "NET LOSS" else "NET PROFIT", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold)
                        Text(ProfitLossCalculator.formatINR(report.netProfit), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = if (report.isLoss) ErrorRed else Color(0xFF16A34A))
                        Text("Revenue − all costs", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }

        // P&L STATEMENT CARD
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("P&L Statement", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))

                report.statementItems.forEach { item ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = item.label,
                            fontSize = if (item.isHighlight) 15.sp else 14.sp,
                            fontWeight = if (item.isHighlight) FontWeight.Bold else FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Text(
                            text = ProfitLossCalculator.formatINR(item.amount),
                            fontSize = if (item.isHighlight) 15.sp else 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = when (item.type) {
                                "INCOME" -> PrimaryBlue
                                "COST" -> ErrorRed
                                else -> if (report.isLoss) ErrorRed else Color(0xFF16A34A)
                            }
                        )
                    }
                    if (item.isHighlight) HorizontalDivider(color = MaterialTheme.colorScheme.outline, thickness = 2.dp)
                    else HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                }
            }
        }

        // COST VS PROFIT BREAKDOWN VISUALIZATION CARD
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Cost vs Profit Breakdown", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)

                // PURCHASES BAR
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Purchases", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        Text("${ProfitLossCalculator.formatINR(report.purchases)} (${(purchasesPct * 100).toInt()}%)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFFE0F2FE))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(purchasesPct)
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(PrimaryBlue)
                        )
                    }
                }

                // EXPENSES BAR
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Operating Expenses", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                        Text("${ProfitLossCalculator.formatINR(report.expenses)} (${(expensesPct * 100).toInt()}%)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFFFEE2E2))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(expensesPct)
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(ErrorRed)
                        )
                    }
                }

                // SALARIES BAR
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Employee / Labour", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFD97706))
                        Text("${ProfitLossCalculator.formatINR(report.salaries)} (${(salariesPct * 100).toInt()}%)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFFFEF3C7))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(salariesPct)
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFFD97706))
                        )
                    }
                }

                // NET PROFIT BAR
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Net Profit Margin", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF16A34A))
                        Text("${ProfitLossCalculator.formatINR(report.breakdown.netProfit)} (${(netProfitPct * 100).toInt()}%)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFFDCFCE7))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(netProfitPct)
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFF16A34A))
                        )
                    }
                }
            }
        }
    }
}

