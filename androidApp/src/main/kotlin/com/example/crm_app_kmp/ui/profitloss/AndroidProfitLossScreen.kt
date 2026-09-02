package com.example.crm_app_kmp.ui.profitloss

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.crm_app_kmp.profitloss.ProfitLossRepository
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidProfitLossContent() {
    var fromDate by remember { mutableStateOf("01/08/2026") }
    var toDate by remember { mutableStateOf("31/08/2026") }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    val report = remember(fromDate, toDate) {
        ProfitLossRepository.calculateReport(fromDate, toDate)
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
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Report Period", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = fromDate,
                        onValueChange = { fromDate = it },
                        placeholder = { Text("FROM", fontSize = 12.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )

                    OutlinedTextField(
                        value = toDate,
                        onValueChange = { toDate = it },
                        placeholder = { Text("TO", fontSize = 12.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )

                    Button(
                        onClick = { toastMsg = "Report calculated." },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.height(54.dp)
                    ) {
                        Text("Show", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Text("Selected: ${report.fromDate} to ${report.toDate}", fontSize = 11.sp, color = TextMuted)
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
                // REVENUE
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("REVENUE", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("₹${report.revenue.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        Text("Total sales", fontSize = 10.sp, color = TextMuted)
                    }
                }

                // PURCHASES
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("PURCHASES", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("₹${report.purchases.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFFD97706))
                        Text("Supplier purchases", fontSize = 10.sp, color = TextMuted)
                    }
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                // EXPENSES + SALARIES
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("EXPENSES + SALARIES", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("₹${report.expensesPlusSalaries.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                        Text("₹${report.expenses.toInt()} exp + ₹${report.salaries.toInt()} sal", fontSize = 10.sp, color = TextMuted)
                    }
                }

                // NET PROFIT
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("NET PROFIT", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("₹${report.netProfit.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = if (report.isLoss) ErrorRed else Color(0xFF16A34A))
                        Text("Revenue - all costs", fontSize = 10.sp, color = TextMuted)
                    }
                }
            }
        }

        // P&L STATEMENT CARD
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("P&L Statement", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                HorizontalDivider(color = Color(0xFFF1F5F9))

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
                            color = TextPrimary
                        )

                        Text(
                            text = "₹${item.amount.toInt()}",
                            fontSize = if (item.isHighlight) 16.sp else 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = when (item.type) {
                                "INCOME" -> PrimaryBlue
                                "COST" -> ErrorRed
                                else -> if (report.isLoss) ErrorRed else Color(0xFF16A34A)
                            }
                        )
                    }
                    if (item.isHighlight) HorizontalDivider(color = Color(0xFFE2E8F0), thickness = 2.dp)
                    else HorizontalDivider(color = Color(0xFFF8FAFC))
                }
            }
        }

        // COST VS PROFIT BREAKDOWN VISUALIZATION CARD
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Cost vs Profit Breakdown", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)

                // PURCHASES BAR
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Purchases", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        Text("₹${report.purchases.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
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
                        Text("Expenses", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                        Text("₹${report.expenses.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
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
                        Text("Salaries", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFD97706))
                        Text("₹${report.salaries.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
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
                        Text("Net Profit", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF16A34A))
                        Text("₹${report.breakdown.netProfit.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
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
