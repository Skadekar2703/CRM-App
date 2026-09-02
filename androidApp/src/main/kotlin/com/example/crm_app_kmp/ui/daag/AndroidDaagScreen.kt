package com.example.crm_app_kmp.ui.daag

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
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Store
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.crm_app_kmp.daag.DaagRepository
import com.example.crm_app_kmp.daag.StockMovementModel
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

import androidx.compose.ui.platform.LocalContext
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
import org.json.JSONObject
import com.example.crm_app_kmp.items.ItemModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidDaagContent() {
    val context = LocalContext.current
    val supabaseClient = remember { com.example.crm_app_kmp.data.SupabaseAndroidClient(context) }
    val scope = rememberCoroutineScope()

    val movements = remember { mutableStateListOf<StockMovementModel>() }
    val availableItems = remember { mutableStateListOf<ItemModel>() }

    var searchQuery by remember { mutableStateOf("") }
    var selectedFilterChip by remember { mutableStateOf("All Movements") }
    var showFormDialog by remember { mutableStateOf(false) }
    var editingMovement by remember { mutableStateOf<StockMovementModel?>(null) }
    var deletingMovement by remember { mutableStateOf<StockMovementModel?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    fun refreshDaagMovements() {
        scope.launch {
            val resItems = supabaseClient.fetchItems()
            resItems.onSuccess { fetchedItems ->
                availableItems.clear()
                availableItems.addAll(fetchedItems)
            }

            val resMov = supabaseClient.fetchTable("stock_movements")
            resMov.onSuccess { array ->
                movements.clear()
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val itemId = obj.optString("item_id", "")
                    val matchedItem = availableItems.find { it.id == itemId }
                    movements.add(
                        StockMovementModel(
                            id = obj.optString("id", ""),
                            date = obj.optString("date", obj.optString("created_at", "Recent")),
                            direction = obj.optString("direction", "IN"),
                            item = obj.optString("item_name", matchedItem?.name ?: "Item"),
                            itemId = itemId,
                            itemSku = obj.optString("item_code", matchedItem?.code ?: ""),
                            quantity = obj.optString("quantity", "1 qty"),
                            amount = obj.optDouble("amount", 0.0),
                            supplier = obj.optString("supplier", "—"),
                            transport = obj.optString("transport", "—"),
                            status = obj.optString("status", "Complete")
                        )
                    )
                }
            }
        }
    }

    androidx.compose.runtime.LaunchedEffect(Unit) {
        refreshDaagMovements()
    }

    val filteredMovements = movements.filter { m ->
        val q = searchQuery.lowercase().trim()
        val matchesQuery = q.isEmpty() ||
                m.id.lowercase().contains(q) ||
                m.item.lowercase().contains(q) ||
                m.supplier.lowercase().contains(q) ||
                m.transport.lowercase().contains(q)

        val matchesFilter = when (selectedFilterChip) {
            "Received" -> m.direction.equals("IN", ignoreCase = true)
            "Dispatched" -> m.direction.equals("OUT", ignoreCase = true)
            else -> true
        }

        matchesQuery && matchesFilter
    }

    val totalIn = movements.count { it.direction.equals("IN", ignoreCase = true) }
    val totalOut = movements.count { it.direction.equals("OUT", ignoreCase = true) }
    var activeTab by remember { mutableStateOf("Items") } // "Items" or "Movements"

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // TOP SUMMARY CARDS: TOTAL ITEMS, LOW STOCK, MOVEMENTS
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Total Items", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text("${availableItems.size} Products", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Movements", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text("${movements.size} Records", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFF16A34A))
                    }
                }
            }

            // TAB SWITCHER CHIPS: ALL ITEMS INVENTORY vs STOCK MOVEMENTS
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (activeTab == "Items") PrimaryBlue else Color.White)
                        .border(1.dp, if (activeTab == "Items") PrimaryBlue else Color(0xFFCBD5E1), RoundedCornerShape(20.dp))
                        .clickable { activeTab = "Items" }
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = "All Items (${availableItems.size})",
                        fontSize = 13.sp,
                        fontWeight = if (activeTab == "Items") FontWeight.Bold else FontWeight.Medium,
                        color = if (activeTab == "Items") Color.White else TextPrimary
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (activeTab == "Movements") PrimaryBlue else Color.White)
                        .border(1.dp, if (activeTab == "Movements") PrimaryBlue else Color(0xFFCBD5E1), RoundedCornerShape(20.dp))
                        .clickable { activeTab = "Movements" }
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = "Stock Movements (${movements.size})",
                        fontSize = 13.sp,
                        fontWeight = if (activeTab == "Movements") FontWeight.Bold else FontWeight.Medium,
                        color = if (activeTab == "Movements") Color.White else TextPrimary
                    )
                }
            }

            // SEARCH FIELD
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search items or movements...", fontSize = 14.sp, color = TextMuted) },
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

            // CONTENT LIST BY TAB
            if (activeTab == "Items") {
                val filteredItems = availableItems.filter {
                    val q = searchQuery.lowercase().trim()
                    q.isEmpty() || it.name.lowercase().contains(q) || it.code.lowercase().contains(q) || it.category.lowercase().contains(q)
                }

                if (filteredItems.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No items found.", color = TextMuted, fontSize = 14.sp)
                    }
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        items(filteredItems, key = { it.id }) { itemObj ->
                            val itemIn = movements.filter { (it.itemId == itemObj.id || it.item.equals(itemObj.name, ignoreCase = true)) && it.direction.equals("IN", ignoreCase = true) }
                                .sumOf { it.quantity.filter { char -> char.isDigit() }.toIntOrNull() ?: 1 }
                            val itemOut = movements.filter { (it.itemId == itemObj.id || it.item.equals(itemObj.name, ignoreCase = true)) && it.direction.equals("OUT", ignoreCase = true) }
                                .sumOf { it.quantity.filter { char -> char.isDigit() }.toIntOrNull() ?: 1 }

                            val computedStock = (itemObj.stockQuantity + itemIn - itemOut).coerceAtLeast(0)
                            val isLowStock = computedStock <= itemObj.lowStockAlert

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
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
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = itemObj.name,
                                                fontSize = 16.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = TextPrimary
                                            )
                                            Text(
                                                text = "Code: ${itemObj.code} | Category: ${itemObj.category}",
                                                fontSize = 12.sp,
                                                color = TextMuted
                                            )
                                        }

                                        val badgeBg = if (computedStock == 0) Color(0xFFFEF2F2) else if (isLowStock) Color(0xFFFEF9C3) else Color(0xFFF0FDF4)
                                        val badgeColor = if (computedStock == 0) ErrorRed else if (isLowStock) Color(0xFFA16207) else Color(0xFF16A34A)
                                        val badgeLabel = if (computedStock == 0) "Out of Stock" else if (isLowStock) "Low Stock" else "In Stock"

                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(badgeBg)
                                                .padding(horizontal = 10.dp, vertical = 4.dp)
                                        ) {
                                            Text(badgeLabel, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = badgeColor)
                                        }
                                    }

                                    HorizontalDivider(color = Color(0xFFF1F5F9))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text("Current Stock", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.SemiBold)
                                            Text("$computedStock ${itemObj.unit}", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                        }

                                        Button(
                                            onClick = {
                                                editingMovement = null
                                                showFormDialog = true
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.height(34.dp)
                                        ) {
                                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("+ Record Movement", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                if (filteredMovements.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No stock movements found.", color = TextMuted, fontSize = 14.sp)
                    }
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        items(filteredMovements, key = { it.id }) { movement ->
                            StockMovementCard(
                                movement = movement,
                                onEdit = {
                                    editingMovement = movement
                                    showFormDialog = true
                                },
                                onDelete = {
                                    deletingMovement = movement
                                }
                            )
                        }
                    }
                }
            }
        }

        // FLOATING "+" ADD BUTTON
        FloatingActionButton(
            onClick = {
                editingMovement = null
                showFormDialog = true
            },
            containerColor = PrimaryBlue,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Movement", modifier = Modifier.size(24.dp))
        }
    }

    // ADD / EDIT MOVEMENT DIALOG
    if (showFormDialog) {
        MovementFormDialog(
            editingMovement = editingMovement,
            availableItems = availableItems,
            onDismiss = { showFormDialog = false },
            onSave = { direction, item, quantity, amount, supplier, transport, status, date ->
                scope.launch {
                    val payload = JSONObject().apply {
                        put("direction", direction)
                        put("item_name", item)
                        put("quantity", quantity)
                        put("amount", amount)
                        put("supplier", supplier)
                        put("transport", transport)
                        put("status", status)
                        put("date", date)
                    }
                    if (editingMovement != null) {
                        supabaseClient.updateRecord("stock_movements", editingMovement!!.id, payload)
                        toastMsg = "Movement '${editingMovement!!.id}' updated."
                    } else {
                        supabaseClient.insertRecord("stock_movements", payload)
                        toastMsg = "New stock movement recorded."
                    }
                    refreshDaagMovements()
                }
                showFormDialog = false
            }
        )
    }

    // DELETE CONFIRMATION DIALOG
    deletingMovement?.let { target ->
        Dialog(onDismissRequest = { deletingMovement = null }) {
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
                    Text("Delete Movement?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Are you sure you want to delete movement '${target.id}' (${target.item})?", fontSize = 14.sp, color = TextMuted)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = { deletingMovement = null },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    supabaseClient.deleteRecord("stock_movements", target.id)
                                    refreshDaagMovements()
                                }
                                toastMsg = "Movement '${target.id}' deleted."
                                deletingMovement = null
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
private fun StockMovementCard(
    movement: StockMovementModel,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val isIn = movement.direction.equals("IN", ignoreCase = true)
    val dirBg = if (isIn) Color(0xFFDCFCE7) else Color(0xFFEFF6FF)
    val dirColor = if (isIn) Color(0xFF16A34A) else PrimaryBlue

    val (statusBg, statusColor) = when (movement.status) {
        "Complete" -> Color(0xFFDCFCE7) to Color(0xFF16A34A)
        "Pending" -> Color(0xFFFEF9C3) to Color(0xFFCA8A04)
        "In Transit" -> Color(0xFFE0F2FE) to PrimaryBlue
        "Cancelled" -> Color(0xFFFEF2F2) to ErrorRed
        else -> Color(0xFFF1F5F9) to TextMuted
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // TOP ROW: ITEM NAME, TRX ID, DIRECTION BADGE
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = movement.item,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = movement.id,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TextMuted
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(dirBg)
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = if (isIn) "IN (Received)" else "OUT (Dispatched)",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = dirColor
                    )
                }
            }

            // DETAILS GRID: QTY, DATE, STATUS
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Qty: ${movement.quantity}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    if (movement.amount > 0) {
                        Text("Amount: ${movement.amountFormatted}", fontSize = 13.sp, color = TextMuted)
                    }
                }

                Column(horizontalAlignment = Alignment.End) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(statusBg)
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = movement.status,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = statusColor
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(movement.date, fontSize = 12.sp, color = TextMuted)
                }
            }

            // SUPPLIER & TRANSPORT INFO IF AVAILABLE
            if (movement.supplier != "—" || movement.transport != "—") {
                HorizontalDivider(color = Color(0xFFF1F5F9))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    if (movement.supplier != "—") {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Store, contentDescription = null, tint = TextMuted, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(movement.supplier, fontSize = 12.sp, color = TextMuted)
                        }
                    }
                    if (movement.transport != "—") {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocalShipping, contentDescription = null, tint = TextMuted, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(movement.transport, fontSize = 12.sp, color = TextMuted)
                        }
                    }
                }
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            // ACTIONS: EDIT, DELETE
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
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

                Spacer(modifier = Modifier.width(8.dp))

                Button(
                    onClick = onDelete,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEF2F2), contentColor = ErrorRed),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.height(34.dp)
                ) {
                    Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Delete", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun MovementFormDialog(
    editingMovement: StockMovementModel?,
    availableItems: List<ItemModel> = emptyList(),
    onDismiss: () -> Unit,
    onSave: (
        direction: String,
        item: String,
        quantity: String,
        amount: Double,
        supplier: String,
        transport: String,
        status: String,
        date: String
    ) -> Unit
) {
    var direction by remember { mutableStateOf(editingMovement?.direction ?: "IN") }
    var selectedItemId by remember { mutableStateOf(availableItems.firstOrNull()?.id ?: "") }
    var item by remember { mutableStateOf(editingMovement?.item ?: availableItems.firstOrNull()?.name ?: "") }
    var quantity by remember { mutableStateOf(editingMovement?.quantity ?: "1 Roll") }
    var amountText by remember { mutableStateOf(editingMovement?.amount?.toInt()?.toString() ?: "0") }
    var supplier by remember { mutableStateOf(editingMovement?.supplier?.takeIf { it != "—" } ?: "") }
    var transport by remember { mutableStateOf(editingMovement?.transport?.takeIf { it != "—" } ?: "") }
    var status by remember { mutableStateOf(editingMovement?.status ?: "Pending") }
    var date by remember { mutableStateOf(editingMovement?.date ?: "Today") }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var expandedItemDropdown by remember { mutableStateOf(false) }

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
                        text = if (editingMovement != null) "Edit Stock Movement" else "Add New Movement",
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

                Text("Direction", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(
                        selected = direction == "IN",
                        onClick = { direction = "IN" },
                        colors = RadioButtonDefaults.colors(selectedColor = Color(0xFF16A34A))
                    )
                    Text("IN (Received)", fontSize = 13.sp, fontWeight = FontWeight.Medium)

                    Spacer(modifier = Modifier.width(16.dp))

                    RadioButton(
                        selected = direction == "OUT",
                        onClick = { direction = "OUT" },
                        colors = RadioButtonDefaults.colors(selectedColor = PrimaryBlue)
                    )
                    Text("OUT (Dispatched)", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                }

                // ITEM DROPDOWN SELECTOR
                Text("Select Item *", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedButton(
                        onClick = { expandedItemDropdown = true },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(item.ifEmpty { "Select Item" }, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                        }
                    }

                    DropdownMenu(
                        expanded = expandedItemDropdown,
                        onDismissRequest = { expandedItemDropdown = false }
                    ) {
                        availableItems.forEach { itemObj ->
                            DropdownMenuItem(
                                text = { Text("${itemObj.name} (${itemObj.code})", fontSize = 13.sp) },
                                onClick = {
                                    item = itemObj.name
                                    selectedItemId = itemObj.id
                                    expandedItemDropdown = false
                                }
                            )
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = quantity,
                        onValueChange = { quantity = it },
                        placeholder = { Text("Quantity (e.g. 2 bora)", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = amountText,
                        onValueChange = { amountText = it },
                        placeholder = { Text("Amount (₹)", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                OutlinedTextField(
                    value = supplier,
                    onValueChange = { supplier = it },
                    placeholder = { Text("Supplier (Optional)", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = transport,
                    onValueChange = { transport = it },
                    placeholder = { Text("Transport / Carrier (Optional)", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                OutlinedTextField(
                    value = date,
                    onValueChange = { date = it },
                    placeholder = { Text("Date (e.g. 15 Aug 2026)", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                Text("Status", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("Complete", "Pending", "In Transit").forEach { st ->
                        val isSelected = status == st
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(16.dp))
                                .background(if (isSelected) PrimaryBlue else Color(0xFFF1F5F9))
                                .clickable { status = st }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(st, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (isSelected) Color.White else TextPrimary)
                        }
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
                            if (item.isBlank()) {
                                errorMsg = "Item Name is required."
                            } else {
                                val amt = amountText.toDoubleOrNull() ?: 0.0
                                onSave(
                                    direction,
                                    item.trim(),
                                    quantity.trim(),
                                    amt,
                                    supplier.trim(),
                                    transport.trim(),
                                    status,
                                    date.trim()
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (editingMovement != null) "Save Changes" else "Add Movement", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
