package com.example.crm_app_kmp.ui.aging

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
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
import com.example.crm_app_kmp.aging.AgingCustomer
import com.example.crm_app_kmp.aging.AgingReportRepository
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidAgingReportContent() {
    val customers = remember { mutableStateListOf(*AgingReportRepository.getAllCustomers().toTypedArray()) }
    var searchQuery by remember { mutableStateOf("") }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    val summary = remember(customers.toList()) {
        AgingReportRepository.calculateSummary(customers)
    }

    val filteredCustomers = customers.filter { c ->
        val q = searchQuery.lowercase().trim()
        q.isEmpty() ||
                c.customerName.lowercase().contains(q) ||
                c.uid.lowercase().contains(q) ||
                c.mobile.lowercase().contains(q) ||
                c.cibilStatus.lowercase().contains(q) ||
                c.agingBucket.lowercase().contains(q)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // TOTAL OUTSTANDING HIGHLIGHT CARD
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("TOTAL BAKI", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Text("₹${summary.totalOutstanding.toInt()}", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                    Text("${summary.customerCount} customers with baki", fontSize = 11.sp, color = TextMuted)
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFFEFF6FF))
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Text("Aging Report", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                }
            }
        }

        // AGING BUCKETS SUMMARY ROW
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // 0-30 DAYS
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    Text("0–30d", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Text("₹${summary.bucket0to30Total.toInt()}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF16A34A))
                    Text("Recent", fontSize = 9.sp, color = TextMuted)
                }
            }

            // 31-60 DAYS
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    Text("31–60d", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Text("₹${summary.bucket31to60Total.toInt()}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                    Text("Watch list", fontSize = 9.sp, color = TextMuted)
                }
            }

            // 61-90 DAYS
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    Text("61–90d", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Text("₹${summary.bucket61to90Total.toInt()}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFFD97706))
                    Text("Aging fast", fontSize = 9.sp, color = TextMuted)
                }
            }

            // 90+ DAYS
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    Text("90+ d", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Text("₹${summary.bucket90PlusTotal.toInt()}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                    Text("Overdue", fontSize = 9.sp, color = TextMuted)
                }
            }
        }

        // SEARCH BAR
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search customer name, UID, mobile or CIBIL...", fontSize = 13.sp, color = TextMuted) },
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

        // RECEIVABLES AGING BY CUSTOMER LIST
        Text("Receivables Aging by Customer", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary)

        if (filteredCustomers.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(40.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("No customer receivables found.", color = TextMuted, fontSize = 14.sp)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(filteredCustomers, key = { it.uid }) { cust ->
                    AgingCustomerCard(customer = cust)
                }
            }
        }
    }
}

@Composable
private fun AgingCustomerCard(customer: AgingCustomer) {
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
                    Text(customer.customerName, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("UID: #${customer.uid} | Mobile: ${customer.mobile}", fontSize = 12.sp, color = TextMuted)
                }

                // CIBIL BADGE
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(
                            when (customer.cibilStatus) {
                                "GOOD" -> Color(0xFFDCFCE7)
                                "AVERAGE" -> Color(0xFFFEF3C7)
                                else -> Color(0xFFFEE2E2)
                            }
                        )
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = "CIBIL: ${customer.cibilStatus}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = when (customer.cibilStatus) {
                            "GOOD" -> Color(0xFF16A34A)
                            "AVERAGE" -> Color(0xFFD97706)
                            else -> ErrorRed
                        }
                    )
                }
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("TOTAL BAKI", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                    Text("₹${customer.balance.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text("AGE: ${customer.ageDays} DAYS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(
                                when {
                                    customer.ageDays <= 30 -> Color(0xFFEFF6FF)
                                    customer.ageDays <= 60 -> Color(0xFFF0FDF4)
                                    customer.ageDays <= 90 -> Color(0xFFFFFBEB)
                                    else -> Color(0xFFFEF2F2)
                                }
                            )
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = customer.agingBucket,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = when {
                                customer.ageDays <= 30 -> PrimaryBlue
                                customer.ageDays <= 60 -> Color(0xFF16A34A)
                                customer.ageDays <= 90 -> Color(0xFFD97706)
                                else -> ErrorRed
                            }
                        )
                    }
                }
            }
        }
    }
}
