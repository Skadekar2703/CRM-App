package com.example.crm_app_kmp.ui.cashbook

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.window.Dialog
import com.example.crm_app_kmp.cashbook.CashBookEntry
import com.example.crm_app_kmp.cashbook.CashBookRepository
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidCashBookContent() {
    val entries = remember { mutableStateListOf(*CashBookRepository.getAllEntries().toTypedArray()) }

    var fromDate by remember { mutableStateOf("01 Aug 2026") }
    var toDate by remember { mutableStateOf("29 Aug 2026") }
    var searchQuery by remember { mutableStateOf("") }
    var showFormDialog by remember { mutableStateOf(false) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    val summary = remember(entries.toList()) {
        CashBookRepository.calculateSummary(fromDate, toDate)
    }

    val filteredEntries = entries.filter { e ->
        val q = searchQuery.lowercase().trim()
        q.isEmpty() || e.particulars.lowercase().contains(q) || e.sourceModule.lowercase().contains(q)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(androidx.compose.material3.MaterialTheme.colorScheme.background)
    ) {
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
                // TOTAL IN
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("TOTAL IN", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("₹${summary.totalIn.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF16A34A))
                        Text("Money received", fontSize = 10.sp, color = TextMuted)
                    }
                }

                // TOTAL OUT
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("TOTAL OUT", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("₹${summary.totalOut.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                        Text("Money spent", fontSize = 10.sp, color = TextMuted)
                    }
                }

                // NET CASH
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("NET CASH", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("₹${summary.netCash.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        Text("In date range", fontSize = 10.sp, color = TextMuted)
                    }
                }
            }

            // DATE RANGE FILTER ROW
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
                    onClick = { toastMsg = "Date range updated." },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.height(54.dp)
                ) {
                    Text("Show", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }

            // SEARCH BAR
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search particulars or source module...", fontSize = 14.sp, color = TextMuted) },
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

            // DAY BOOK TRANSACTION LIST
            Text("Day Book — Cash Transactions", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary)

            if (filteredEntries.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No cash transactions found.", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(filteredEntries, key = { it.id }) { entry ->
                        CashBookCard(entry = entry)
                    }
                }
            }
        }

        // FAB ADD BUTTON
        FloatingActionButton(
            onClick = { showFormDialog = true },
            containerColor = PrimaryBlue,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Cash Entry", modifier = Modifier.size(24.dp))
        }
    }

    // ADD CASH TRANSACTION DIALOG
    if (showFormDialog) {
        CashBookFormDialog(
            onDismiss = { showFormDialog = false },
            onSave = { date, particulars, type, amt, sourceModule ->
                val newE = CashBookRepository.addEntry(
                    date = date,
                    particulars = particulars,
                    type = type,
                    amount = amt,
                    sourceModule = sourceModule
                )
                entries.add(newE)
                toastMsg = "Cash entry '$particulars' recorded."
                showFormDialog = false
            }
        )
    }
}

@Composable
private fun CashBookCard(entry: CashBookEntry) {
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
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(entry.date, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (entry.type == "IN") Color(0xFFDCFCE7) else Color(0xFFFEE2E2))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(entry.type, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (entry.type == "IN") Color(0xFF16A34A) else ErrorRed)
                }
            }

            Text(entry.particulars, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text("Source: ${entry.sourceModule}", fontSize = 11.sp, color = TextMuted)

            HorizontalDivider(color = androidx.compose.material3.MaterialTheme.colorScheme.outline)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(if (entry.type == "IN") "In: " else "Out: ", fontSize = 12.sp, color = TextMuted)
                    Text("₹${entry.amount.toInt()}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = if (entry.type == "IN") Color(0xFF16A34A) else ErrorRed)
                }

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Balance: ", fontSize = 12.sp, color = TextMuted)
                    Text("₹${entry.runningBalance.toInt()}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                }
            }
        }
    }
}

@Composable
private fun CashBookFormDialog(
    onDismiss: () -> Unit,
    onSave: (
        date: String,
        particulars: String,
        type: String,
        amount: Double,
        sourceModule: String
    ) -> Unit
) {
    var date by remember { mutableStateOf("29 Aug 2026") }
    var particulars by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("IN") }
    var amountStr by remember { mutableStateOf("") }
    var sourceModule by remember { mutableStateOf("Manual") }
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
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Add Cash Transaction", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                errorMsg?.let { err ->
                    Text("⚠️ $err", color = ErrorRed, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                OutlinedTextField(
                    value = date,
                    onValueChange = { date = it },
                    placeholder = { Text("Date *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = type,
                    onValueChange = { type = it },
                    placeholder = { Text("Type (IN / OUT) *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = amountStr,
                    onValueChange = { amountStr = it },
                    placeholder = { Text("Amount (₹) *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = sourceModule,
                    onValueChange = { sourceModule = it },
                    placeholder = { Text("Source Module (Sales, Expenses...)", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = particulars,
                    onValueChange = { particulars = it },
                    placeholder = { Text("Particulars / Description *", fontSize = 13.sp) },
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
                        colors = ButtonDefaults.buttonColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surfaceVariant, contentColor = TextPrimary),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Cancel", fontSize = 13.sp)
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Button(
                        onClick = {
                            val amt = amountStr.toDoubleOrNull()
                            if (date.isBlank()) {
                                errorMsg = "Date is required."
                            } else if (particulars.isBlank()) {
                                errorMsg = "Particulars description is required."
                            } else if (amt == null || amt <= 0) {
                                errorMsg = "Amount must be greater than 0."
                            } else {
                                onSave(date.trim(), particulars.trim(), type.uppercase().trim(), amt, sourceModule.trim())
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Save Entry", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
