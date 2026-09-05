package com.example.crm_app_kmp.ui.expenses

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
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
import com.example.crm_app_kmp.expenses.ExpenseModel
import com.example.crm_app_kmp.expenses.ExpenseRepository
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidExpensesContent() {
    val expenses = remember { mutableStateListOf(*ExpenseRepository.getExpenses().toTypedArray()) }

    var searchQuery by remember { mutableStateOf("") }
    var showFormDialog by remember { mutableStateOf(false) }
    var editingExpense by remember { mutableStateOf<ExpenseModel?>(null) }
    var deletingExpense by remember { mutableStateOf<ExpenseModel?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    val summary = remember(expenses.toList()) {
        ExpenseRepository.calculateSummary()
    }

    val filteredExpenses = expenses.filter { e ->
        val q = searchQuery.lowercase().trim()
        q.isEmpty() ||
                e.category.lowercase().contains(q) ||
                e.paidTo.lowercase().contains(q) ||
                e.description.lowercase().contains(q) ||
                e.paymentMode.lowercase().contains(q)
    }

    Box(modifier = Modifier.fillMaxSize()) {
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
                // TODAY'S EXPENSES
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Today's", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("₹${summary.todayTotal.toInt()}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
                        Text("Spent today", fontSize = 10.sp, color = TextMuted)
                    }
                }

                // THIS MONTH
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("This Month", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("₹${summary.monthTotal.toInt()}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        Text("Current month", fontSize = 10.sp, color = TextMuted)
                    }
                }

                // TOTAL RECORDS
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Total Records", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text("${summary.totalRecords}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFFD97706))
                        Text("Active entries", fontSize = 10.sp, color = TextMuted)
                    }
                }
            }

            // SEARCH BAR
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search by category, paid to or description...", fontSize = 14.sp, color = TextMuted) },
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

            // EXPENSES LIST
            if (filteredExpenses.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No expenses found.", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(filteredExpenses, key = { it.id }) { expense ->
                        ExpenseCard(
                            expense = expense,
                            onEdit = {
                                editingExpense = expense
                                showFormDialog = true
                            },
                            onDelete = { deletingExpense = expense }
                        )
                    }
                }
            }
        }

        // FAB ADD BUTTON
        FloatingActionButton(
            onClick = {
                editingExpense = null
                showFormDialog = true
            },
            containerColor = PrimaryBlue,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Expense", modifier = Modifier.size(24.dp))
        }
    }

    // ADD / EDIT FORM DIALOG
    if (showFormDialog) {
        ExpenseFormDialog(
            editingExpense = editingExpense,
            onDismiss = { showFormDialog = false },
            onSave = { date, category, amount, paymentMode, paidTo, description ->
                if (editingExpense != null) {
                    val updated = ExpenseRepository.updateExpense(
                        id = editingExpense!!.id,
                        date = date,
                        category = category,
                        amount = amount,
                        paymentMode = paymentMode,
                        paidTo = paidTo,
                        description = description
                    )
                    if (updated != null) {
                        val idx = expenses.indexOfFirst { it.id == editingExpense!!.id }
                        if (idx >= 0) expenses[idx] = updated
                        toastMsg = "Expense '$category' updated."
                    }
                } else {
                    val newE = ExpenseRepository.addExpense(
                        date = date,
                        category = category,
                        amount = amount,
                        paymentMode = paymentMode,
                        paidTo = paidTo,
                        description = description
                    )
                    expenses.add(0, newE)
                    toastMsg = "Expense '$category' recorded."
                }
                showFormDialog = false
            }
        )
    }

    // DELETE DIALOG
    deletingExpense?.let { target ->
        Dialog(onDismissRequest = { deletingExpense = null }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("Delete Expense?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Delete expense entry for '${target.category}' (₹${target.amount})?", fontSize = 14.sp, color = TextMuted)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Button(
                            onClick = { deletingExpense = null },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                ExpenseRepository.deleteExpense(target.id)
                                expenses.removeAll { it.id == target.id }
                                toastMsg = "Expense deleted."
                                deletingExpense = null
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
private fun ExpenseCard(
    expense: ExpenseModel,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
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
            // CATEGORY & AMOUNT
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(expense.category, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Text("₹${expense.amount.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
            }

            // DATE & MODE BADGE
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(expense.date, fontSize = 12.sp, color = TextMuted)
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFFEFF6FF))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(expense.paymentMode, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                }
            }

            if (expense.paidTo.isNotBlank() || expense.description.isNotBlank()) {
                HorizontalDivider(color = Color(0xFFF1F5F9))
                if (expense.paidTo.isNotBlank()) {
                    Text("Paid To: ${expense.paidTo}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                }
                if (expense.description.isNotBlank()) {
                    Text(expense.description, fontSize = 12.sp, color = TextMuted)
                }
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            // ACTIONS
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Button(
                        onClick = onEdit,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Edit", fontSize = 12.sp)
                    }

                    Button(
                        onClick = onDelete,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEE2E2), contentColor = ErrorRed),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete", modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Delete", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ExpenseFormDialog(
    editingExpense: ExpenseModel?,
    onDismiss: () -> Unit,
    onSave: (
        date: String,
        category: String,
        amount: Double,
        paymentMode: String,
        paidTo: String,
        description: String
    ) -> Unit
) {
    var date by remember { mutableStateOf(editingExpense?.date ?: "29 Aug 2026") }
    var category by remember { mutableStateOf(editingExpense?.category ?: "Rent") }
    var amountStr by remember { mutableStateOf(editingExpense?.amount?.let { "$it" } ?: "") }
    var paymentMode by remember { mutableStateOf(editingExpense?.paymentMode ?: "Cash") }
    var paidTo by remember { mutableStateOf(editingExpense?.paidTo ?: "") }
    var description by remember { mutableStateOf(editingExpense?.description ?: "") }
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
                    Text(
                        text = if (editingExpense != null) "Edit Expense" else "Add New Expense",
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
                    value = date,
                    onValueChange = { date = it },
                    placeholder = { Text("Expense Date *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = category,
                    onValueChange = { category = it },
                    placeholder = { Text("Category (Rent, Electricity...)", fontSize = 13.sp) },
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
                    value = paymentMode,
                    onValueChange = { paymentMode = it },
                    placeholder = { Text("Payment Mode (Cash, UPI, Card)", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = paidTo,
                    onValueChange = { paidTo = it },
                    placeholder = { Text("Paid To (Optional)", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    placeholder = { Text("Description (Optional)", fontSize = 13.sp) },
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
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
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
                            } else if (category.isBlank()) {
                                errorMsg = "Category is required."
                            } else if (amt == null || amt <= 0) {
                                errorMsg = "Amount must be greater than 0."
                            } else {
                                onSave(date.trim(), category.trim(), amt, paymentMode.trim(), paidTo.trim(), description.trim())
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (editingExpense != null) "Save Changes" else "Save Expense", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
