package com.example.crm_app_kmp.ui.employees

import android.app.DatePickerDialog
import android.content.Intent
import android.net.Uri
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
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.crm_app_kmp.data.SupabaseAndroidClient
import com.example.crm_app_kmp.employees.EmployeeModel
import com.example.crm_app_kmp.employees.EmployeeTransactionModel
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private fun formatDateDisplay(dateStr: String): String {
    if (dateStr.isBlank()) return "N/A"
    return try {
        val parser = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val d = parser.parse(dateStr.take(10)) ?: Date()
        val formatter = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
        formatter.format(d)
    } catch (e: Exception) {
        dateStr
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidEmployeesContent() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val supabaseClient = remember { SupabaseAndroidClient(context) }

    val employees = remember { mutableStateListOf<EmployeeModel>() }
    val transactions = remember { mutableStateListOf<EmployeeTransactionModel>() }

    var searchQuery by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(true) }
    var showFormDialog by remember { mutableStateOf(false) }
    var editingEmployee by remember { mutableStateOf<EmployeeModel?>(null) }
    var deletingEmployee by remember { mutableStateOf<EmployeeModel?>(null) }
    var selectedEmployeeDetails by remember { mutableStateOf<EmployeeModel?>(null) }

    // Financial Transaction Dialog
    var showTxDialog by remember { mutableStateOf(false) }
    var txTargetEmployee by remember { mutableStateOf<EmployeeModel?>(null) }
    var txType by remember { mutableStateOf("Gift") }

    var toastMsg by remember { mutableStateOf<String?>(null) }

    val loadData: () -> Unit = {
        scope.launch {
            isLoading = true
            try {
                // Fetch Employees
                val empRes = supabaseClient.fetchTable("employees")
                empRes.onSuccess { arr ->
                    employees.clear()
                    for (i in 0 until arr.length()) {
                        val obj = arr.getJSONObject(i)
                        val joinedOnStr = obj.optString("joined_on", "2026-09-05")
                        var days = obj.optInt("active_days", 0)
                        if (days == 0 && joinedOnStr.isNotBlank()) {
                            try {
                                val parser = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                                val d = parser.parse(joinedOnStr.take(10))
                                if (d != null) {
                                    val diff = System.currentTimeMillis() - d.time
                                    days = (diff / (1000 * 60 * 60 * 24)).toInt().coerceAtLeast(1)
                                }
                            } catch (_: Exception) {}
                        }

                        employees.add(
                            EmployeeModel(
                                id = obj.optString("id", "$i"),
                                uid = obj.optString("uid", "EMP-${100 + i}"),
                                name = obj.optString("name", "Staff Member"),
                                role = obj.optString("role", "Staff"),
                                mobile = obj.optString("mobile", obj.optString("phone", "")),
                                email = obj.optString("email", ""),
                                address = obj.optString("address", ""),
                                bankName = obj.optString("bank_name", ""),
                                bankAccount = obj.optString("bank_account", ""),
                                idNumber = obj.optString("id_number", ""),
                                emergencyContact = obj.optString("emergency_contact", ""),
                                joinedOn = joinedOnStr,
                                leftOn = obj.optString("left_on", ""),
                                photoUrl = obj.optString("photo_url", ""),
                                remark = obj.optString("remark", ""),
                                activeDays = days,
                                salary = obj.optDouble("salary", 0.0),
                                salaryType = obj.optString("salary_type", "Monthly"),
                                udhaarBalance = obj.optDouble("udhaar_balance", 0.0),
                                ctcYtd = obj.optDouble("ctc_ytd", 300000.0),
                                status = obj.optString("status", "Active")
                            )
                        )
                    }
                }

                // Fetch Transactions
                val txRes = supabaseClient.fetchTable("employee_transactions")
                txRes.onSuccess { arr ->
                    transactions.clear()
                    for (i in 0 until arr.length()) {
                        val obj = arr.getJSONObject(i)
                        transactions.add(
                            EmployeeTransactionModel(
                                id = obj.optString("id", "$i"),
                                employeeId = obj.optString("employee_id", ""),
                                employeeUid = obj.optString("employee_uid", ""),
                                type = obj.optString("type", "Gift"),
                                amount = obj.optDouble("amount", 0.0),
                                date = obj.optString("date", ""),
                                note = obj.optString("note", "")
                            )
                        )
                    }
                }
            } catch (e: Exception) {
                toastMsg = "Load warning: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadData()
    }

    val filteredEmployees = employees.filter { e ->
        val q = searchQuery.lowercase().trim()
        q.isEmpty() ||
                e.id.lowercase().contains(q) ||
                e.uid.lowercase().contains(q) ||
                e.name.lowercase().contains(q) ||
                e.role.lowercase().contains(q) ||
                e.mobile.lowercase().contains(q)
    }

    val totalStaff = employees.size
    val totalOutstanding = employees.sumOf { it.udhaarBalance }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(androidx.compose.material3.MaterialTheme.colorScheme.background)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp, 16.dp, 16.dp, 90.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // ITEM 1: SEARCH FIELD
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search employees by UID, Name, Role...", fontSize = 14.sp, color = TextMuted) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
            }

            // ITEM 2: TEAM SUMMARY SECTION
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Employee Roster",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "$totalStaff Staff Members",
                            fontSize = 12.sp,
                            color = TextMuted
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "Total Udhaar",
                            fontSize = 11.sp,
                            color = TextMuted,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "₹${totalOutstanding.toInt()}",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = ErrorRed
                        )
                    }
                }
            }

            // ITEM 3: TOAST MESSAGE
            toastMsg?.let { msg ->
                item {
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
            }

            // ITEM 4: EMPLOYEE CARDS LIST OR LOADING/EMPTY STATES
            if (isLoading) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = PrimaryBlue)
                    }
                }
            } else if (filteredEmployees.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No staff members found.", color = TextMuted, fontSize = 14.sp)
                    }
                }
            } else {
                items(filteredEmployees, key = { it.id }) { employee ->
                    EmployeeCard(
                        employee = employee,
                        onCardClick = { selectedEmployeeDetails = employee },
                        onCall = {
                            try {
                                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${employee.mobile}"))
                                context.startActivity(intent)
                            } catch (e: Exception) {
                                toastMsg = "Call: ${employee.mobile}"
                            }
                        },
                        onEdit = {
                            editingEmployee = employee
                            showFormDialog = true
                        },
                        onDelete = {
                            deletingEmployee = employee
                        }
                    )
                }
            }
        }

        // FLOATING "+" ADD BUTTON
        FloatingActionButton(
            onClick = {
                editingEmployee = null
                showFormDialog = true
            },
            containerColor = PrimaryBlue,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Employee", modifier = Modifier.size(24.dp))
        }
    }

    // ADD / EDIT EMPLOYEE DIALOG
    if (showFormDialog) {
        EmployeeFormDialog(
            context = context,
            editingEmployee = editingEmployee,
            onDismiss = { showFormDialog = false },
            onSave = { empJson ->
                scope.launch {
                    val baseJson = JSONObject().apply {
                        put("name", empJson.optString("name"))
                        put("role", empJson.optString("role"))
                        put("mobile", empJson.optString("mobile"))
                        put("email", empJson.optString("email"))
                        put("status", "Active")
                    }

                    if (editingEmployee != null) {
                        val res = supabaseClient.updateRecord("employees", editingEmployee!!.id, empJson)
                        res.onSuccess {
                            toastMsg = "Employee '${empJson.optString("name")}' updated."
                            loadData()
                        }.onFailure { err ->
                            if (err.message?.contains("column") == true || err.message?.contains("schema cache") == true) {
                                scope.launch {
                                    val retry = supabaseClient.updateRecord("employees", editingEmployee!!.id, baseJson)
                                    retry.onSuccess {
                                        toastMsg = "Employee updated (Base fields). Run SQL script for extended fields."
                                        loadData()
                                    }.onFailure { e -> toastMsg = "Error: ${e.message}" }
                                }
                            } else {
                                toastMsg = "Error updating: ${err.message}"
                            }
                        }
                    } else {
                        val res = supabaseClient.insertRecord("employees", empJson)
                        res.onSuccess {
                            toastMsg = "Employee '${empJson.optString("name")}' added."
                            loadData()
                        }.onFailure { err ->
                            if (err.message?.contains("column") == true || err.message?.contains("schema cache") == true) {
                                scope.launch {
                                    val retry = supabaseClient.insertRecord("employees", baseJson)
                                    retry.onSuccess {
                                        toastMsg = "Employee added (Base fields). Run SQL script for extended fields."
                                        loadData()
                                    }.onFailure { e -> toastMsg = "Error: ${e.message}" }
                                }
                            } else {
                                toastMsg = "Error adding: ${err.message}"
                            }
                        }
                    }
                    showFormDialog = false
                }
            }
        )
    }

    // FINANCIAL TRANSACTION DIALOG
    if (showTxDialog && txTargetEmployee != null) {
        EmployeeTransactionDialog(
            context = context,
            employee = txTargetEmployee!!,
            initialType = txType,
            onDismiss = { showTxDialog = false },
            onSave = { txJson ->
                scope.launch {
                    val res = supabaseClient.insertRecord("employee_transactions", txJson)
                    res.onSuccess {
                        val type = txJson.optString("type")
                        val amt = txJson.optDouble("amount", 0.0)

                        // Update Udhaar balance if applicable
                        var currentUdhaar = txTargetEmployee!!.udhaarBalance
                        if (type == "Employee Udhaar") {
                            currentUdhaar += amt
                        } else if (type == "Udhaar Repayment") {
                            currentUdhaar = (currentUdhaar - amt).coerceAtLeast(0.0)
                        }

                        if (currentUdhaar != txTargetEmployee!!.udhaarBalance) {
                            val patch = JSONObject().apply { put("udhaar_balance", currentUdhaar) }
                            supabaseClient.updateRecord("employees", txTargetEmployee!!.id, patch)
                        }

                        toastMsg = "Recorded $type of ₹${amt.toInt()}"
                        loadData()
                    }.onFailure { err ->
                        toastMsg = "Failed to record transaction: ${err.message}"
                    }
                    showTxDialog = false
                }
            }
        )
    }

    // DELETE CONFIRMATION DIALOG
    deletingEmployee?.let { target ->
        Dialog(onDismissRequest = { deletingEmployee = null }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text("Delete Employee?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Are you sure you want to delete '${target.name}' (${target.role})?", fontSize = 14.sp, color = TextMuted)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = { deletingEmployee = null },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    supabaseClient.deleteRecord("employees", target.id)
                                    toastMsg = "Employee '${target.name}' deleted."
                                    if (selectedEmployeeDetails?.id == target.id) {
                                        selectedEmployeeDetails = null
                                    }
                                    loadData()
                                    deletingEmployee = null
                                }
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

    // DETAILED PROFILE DIALOG
    selectedEmployeeDetails?.let { emp ->
        val empTx = transactions.filter { it.employeeId == emp.id || it.employeeUid == emp.uid }
        Dialog(onDismissRequest = { selectedEmployeeDetails = null }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
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
                        Column {
                            Text(emp.name, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Text("UID: ${emp.uid} • ${emp.role}", fontSize = 12.sp, color = PrimaryBlue, fontWeight = FontWeight.Bold)
                        }
                        IconButton(onClick = { selectedEmployeeDetails = null }) {
                            Icon(Icons.Default.Close, contentDescription = "Close")
                        }
                    }

                    HorizontalDivider(color = Color(0xFFF1F5F9))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(androidx.compose.material3.MaterialTheme.colorScheme.surfaceVariant, shape = RoundedCornerShape(10.dp))
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Joined On: ${formatDateDisplay(emp.joinedOn)}", fontSize = 12.sp, color = TextMuted)
                            Text("Active Days: ${emp.activeDays} days", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            val salaryText = if (emp.salary > 0) {
                                if (emp.salaryType.equals("Per Day", ignoreCase = true)) "₹${emp.salary.toInt()} / day" else "₹${emp.salary.toInt()} / mo"
                            } else "Not Set"
                            Text("Salary / Rate: $salaryText", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = PrimaryBlue)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("Udhaar Balance", fontSize = 11.sp, color = TextMuted)
                            Text("₹${emp.udhaarBalance.toInt()}", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = if (emp.udhaarBalance > 0) ErrorRed else Color(0xFF16A34A))
                        }
                    }

                    if (emp.bankName.isNotBlank() || emp.bankAccount.isNotBlank()) {
                        Column {
                            Text("Bank Info", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                            Text("${emp.bankName} - ${emp.bankAccount}", fontSize = 13.sp, color = TextPrimary)
                        }
                    }

                    if (emp.idNumber.isNotBlank() || emp.emergencyContact.isNotBlank()) {
                        Column {
                            Text("Identity & Emergency Contact", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                            Text("ID: ${emp.idNumber.ifBlank { "N/A" }} • SOS: ${emp.emergencyContact.ifBlank { "N/A" }}", fontSize = 13.sp, color = TextPrimary)
                        }
                    }

                    // FINANCIAL ACTIONS IN PROFILE SHEET
                    Text("Record Financial Entry", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Button(
                            onClick = {
                                selectedEmployeeDetails = null
                                txTargetEmployee = emp
                                txType = "Gift"
                                showTxDialog = true
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEF3C7), contentColor = Color(0xFFD97706)),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.weight(1f).height(32.dp),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)
                        ) {
                            Text("+🎁 Gift", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = {
                                selectedEmployeeDetails = null
                                txTargetEmployee = emp
                                txType = "Bonus"
                                showTxDialog = true
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDCFCE7), contentColor = Color(0xFF15803D)),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.weight(1f).height(32.dp),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)
                        ) {
                            Text("+⭐ Bonus", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = {
                                selectedEmployeeDetails = null
                                txTargetEmployee = emp
                                txType = "Employee Udhaar"
                                showTxDialog = true
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEE2E2), contentColor = Color(0xFFB91C1C)),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.weight(1f).height(32.dp),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)
                        ) {
                            Text("+📉 Udhaar", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Text("Transaction History (${empTx.size})", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    if (empTx.isEmpty()) {
                        Text("No financial records yet.", fontSize = 12.sp, color = TextMuted)
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            empTx.take(5).forEach { tx ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().background(androidx.compose.material3.MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(6.dp)).padding(8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column {
                                        Text("${tx.type} (${formatDateDisplay(tx.date)})", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                        if (tx.note.isNotBlank()) Text(tx.note, fontSize = 11.sp, color = TextMuted)
                                    }
                                    Text("₹${tx.amount.toInt()}", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                                }
                            }
                        }
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        Button(
                            onClick = { selectedEmployeeDetails = null },
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                        ) {
                            Text("Close")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EmployeeCard(
    employee: EmployeeModel,
    onCardClick: () -> Unit,
    onCall: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val initials = employee.name.split(" ").mapNotNull { it.firstOrNull()?.toString() }.take(2).joinToString("").uppercase()
    val isUdhaarPositive = employee.udhaarBalance > 0
    val salaryDisplay = if (employee.salary > 0) {
        if (employee.salaryType.equals("Per Day", ignoreCase = true)) "₹${employee.salary.toInt()} / day" else "₹${employee.salary.toInt()} / mo"
    } else "Salary Not Set"

    Card(
        modifier = Modifier.fillMaxWidth().clickable { onCardClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // TOP ROW: AVATAR, NAME, ROLE
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(CircleShape)
                        .background(PrimaryBlue.copy(alpha = 0.12f))
                        .border(1.dp, PrimaryBlue.copy(alpha = 0.3f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (initials.isNotBlank()) initials else "E",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryBlue
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = employee.name,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${employee.uid} • ${employee.role}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = PrimaryBlue
                    )
                }

                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Delete",
                        tint = ErrorRed.copy(alpha = 0.7f),
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            // MOBILE, SALARY & ACTIVE DAYS
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Phone,
                        contentDescription = null,
                        tint = TextMuted,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = employee.mobile.ifBlank { "No Mobile" },
                        fontSize = 13.sp,
                        color = TextPrimary,
                        fontWeight = FontWeight.Medium
                    )
                }

                Text(
                    text = salaryDisplay,
                    fontSize = 12.sp,
                    color = PrimaryBlue,
                    fontWeight = FontWeight.Bold
                )
            }

            // UDHAAR BAL ROW
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(androidx.compose.material3.MaterialTheme.colorScheme.surfaceVariant)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Udhaar Balance:",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextMuted
                )
                Text(
                    text = employee.udhaarBalanceFormatted,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isUdhaarPositive) ErrorRed else Color(0xFF16A34A)
                )
            }

            HorizontalDivider(color = androidx.compose.material3.MaterialTheme.colorScheme.outline)

            // ACTIONS: CALL, EDIT
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = onCall,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue.copy(alpha = 0.15f), contentColor = PrimaryBlue),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .weight(1f)
                        .height(36.dp)
                ) {
                    Icon(Icons.Default.Call, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Call", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = onEdit,
                    colors = ButtonDefaults.buttonColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surfaceVariant, contentColor = TextPrimary),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .weight(1f)
                        .height(36.dp)
                ) {
                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Edit", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun EmployeeFormDialog(
    context: android.content.Context,
    editingEmployee: EmployeeModel?,
    onDismiss: () -> Unit,
    onSave: (JSONObject) -> Unit
) {
    var uid by remember { mutableStateOf(editingEmployee?.uid ?: "EMP-${(100..999).random()}") }
    var name by remember { mutableStateOf(editingEmployee?.name ?: "") }
    var role by remember { mutableStateOf(editingEmployee?.role ?: "Staff") }
    var mobile by remember { mutableStateOf(editingEmployee?.mobile ?: "") }
    var email by remember { mutableStateOf(editingEmployee?.email ?: "") }
    var salaryType by remember { mutableStateOf(editingEmployee?.salaryType ?: "Monthly") }
    var salaryText by remember { mutableStateOf(if ((editingEmployee?.salary ?: 0.0) > 0) editingEmployee?.salary?.toInt().toString() else "") }
    var bankName by remember { mutableStateOf(editingEmployee?.bankName ?: "") }
    var bankAccount by remember { mutableStateOf(editingEmployee?.bankAccount ?: "") }
    var idNumber by remember { mutableStateOf(editingEmployee?.idNumber ?: "") }
    var emergencyContact by remember { mutableStateOf(editingEmployee?.emergencyContact ?: "") }
    var joinedOn by remember { mutableStateOf(editingEmployee?.joinedOn ?: SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())) }
    var remark by remember { mutableStateOf(editingEmployee?.remark ?: "") }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    val calendar = Calendar.getInstance()

    val showDatePicker = {
        val dlg = DatePickerDialog(
            context,
            { _, year, month, dayOfMonth ->
                val cal = Calendar.getInstance()
                cal.set(year, month, dayOfMonth)
                joinedOn = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(cal.time)
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        )
        dlg.show()
    }

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
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (editingEmployee != null) "Edit Employee Profile" else "Add Employee Profile",
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
                    placeholder = { Text("Employee Name *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = mobile,
                        onValueChange = { mobile = it },
                        placeholder = { Text("Mobile Number *", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = role,
                        onValueChange = { role = it },
                        placeholder = { Text("Role / Designation", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                // SALARY TYPE & SALARY AMOUNT
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Row(modifier = Modifier.weight(1.2f), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        listOf("Monthly", "Per Day").forEach { st ->
                            val isSel = salaryType.equals(st, ignoreCase = true)
                            Button(
                                onClick = { salaryType = st },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isSel) PrimaryBlue else Color(0xFFF1F5F9),
                                    contentColor = if (isSel) Color.White else TextPrimary
                                ),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f).height(40.dp),
                                contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)
                            ) {
                                Text(st, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    OutlinedTextField(
                        value = salaryText,
                        onValueChange = { salaryText = it },
                        placeholder = { Text(if (salaryType == "Per Day") "Daily Rate (₹)" else "Monthly Salary (₹)", fontSize = 12.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                // DATE PICKER ROW
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showDatePicker() }
                        .border(1.dp, TextMuted.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Joined On Date *", fontSize = 11.sp, color = TextMuted)
                        Text(formatDateDisplay(joinedOn), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    }
                    Icon(Icons.Default.CalendarToday, contentDescription = "Calendar Picker", tint = PrimaryBlue)
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = bankName,
                        onValueChange = { bankName = it },
                        placeholder = { Text("Bank Name", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = bankAccount,
                        onValueChange = { bankAccount = it },
                        placeholder = { Text("Bank A/C No", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = idNumber,
                        onValueChange = { idNumber = it },
                        placeholder = { Text("CNIC / ID No", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = emergencyContact,
                        onValueChange = { emergencyContact = it },
                        placeholder = { Text("Emergency Contact", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                OutlinedTextField(
                    value = remark,
                    onValueChange = { remark = it },
                    placeholder = { Text("Remark / Notes", fontSize = 13.sp) },
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
                            if (name.isBlank()) {
                                errorMsg = "Employee Name is required."
                            } else {
                                val salVal = salaryText.toDoubleOrNull() ?: 0.0
                                val json = JSONObject().apply {
                                    put("uid", uid)
                                    put("name", name.trim())
                                    put("role", role.trim())
                                    put("mobile", mobile.trim())
                                    put("email", email.trim())
                                    put("salary", salVal)
                                    put("salary_type", salaryType)
                                    put("bank_name", bankName.trim())
                                    put("bank_account", bankAccount.trim())
                                    put("id_number", idNumber.trim())
                                    put("emergency_contact", emergencyContact.trim())
                                    put("joined_on", joinedOn)
                                    put("remark", remark.trim())
                                    put("status", "Active")
                                }
                                onSave(json)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (editingEmployee != null) "Save Changes" else "Add Employee", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun EmployeeTransactionDialog(
    context: android.content.Context,
    employee: EmployeeModel,
    initialType: String,
    onDismiss: () -> Unit,
    onSave: (JSONObject) -> Unit
) {
    var selectedType by remember { mutableStateOf(initialType) }
    var amountText by remember { mutableStateOf("") }
    var dateStr by remember { mutableStateOf(SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())) }
    var note by remember { mutableStateOf("") }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    val calendar = Calendar.getInstance()

    val showDatePicker = {
        val dlg = DatePickerDialog(
            context,
            { _, year, month, dayOfMonth ->
                val cal = Calendar.getInstance()
                cal.set(year, month, dayOfMonth)
                dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(cal.time)
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        )
        dlg.show()
    }

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
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Record Entry for ${employee.name}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)

                errorMsg?.let { err ->
                    Text("⚠️ $err", color = ErrorRed, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                // TYPE SELECTOR
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    listOf("Gift", "Bonus", "Employee Udhaar", "Udhaar Repayment", "Labour Expense").forEach { t ->
                        val isSelected = selectedType == t
                        Button(
                            onClick = { selectedType = t },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isSelected) PrimaryBlue else Color(0xFFF1F5F9),
                                contentColor = if (isSelected) Color.White else TextPrimary
                            ),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.weight(1f).height(32.dp),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)
                        ) {
                            Text(t.take(6), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    placeholder = { Text("Amount (₹) *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                // DATE PICKER
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showDatePicker() }
                        .border(1.dp, TextMuted.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Transaction Date", fontSize = 11.sp, color = TextMuted)
                        Text(formatDateDisplay(dateStr), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    }
                    Icon(Icons.Default.CalendarToday, contentDescription = "Calendar Picker", tint = PrimaryBlue)
                }

                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    placeholder = { Text("Note / Remarks", fontSize = 13.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
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
                            val amt = amountText.toDoubleOrNull()
                            if (amt == null || amt <= 0) {
                                errorMsg = "Enter a valid positive amount."
                            } else {
                                val json = JSONObject().apply {
                                    put("employee_id", employee.id)
                                    put("employee_uid", employee.uid)
                                    put("type", selectedType)
                                    put("amount", amt)
                                    put("date", dateStr)
                                    put("note", note.trim())
                                }
                                onSave(json)
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
