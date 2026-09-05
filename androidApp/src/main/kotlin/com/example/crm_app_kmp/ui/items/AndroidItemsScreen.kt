package com.example.crm_app_kmp.ui.items

import kotlinx.coroutines.launch
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.example.crm_app_kmp.items.ItemModel
import com.example.crm_app_kmp.items.ItemRepository
import com.example.crm_app_kmp.ui.components.CrmRootScaffold
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@Composable
fun AndroidItemsScreen(
    onNavigateSection: (String) -> Unit = {}
) {
    CrmRootScaffold(
        activeSection = "Items",
        onNavigateSection = onNavigateSection
    ) {
        AndroidItemsContent()
    }
}

@Composable
fun AndroidItemsContent() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val supabaseClient = remember { com.example.crm_app_kmp.data.SupabaseAndroidClient(context) }
    val scope = androidx.compose.runtime.rememberCoroutineScope()

    val itemsList = remember { mutableStateListOf<ItemModel>() }
    var isLoading by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategoryChip by remember { mutableStateOf("All") }

    var showFormDialog by remember { mutableStateOf(false) }
    var editingItem by remember { mutableStateOf<ItemModel?>(null) }
    var deletingItem by remember { mutableStateOf<ItemModel?>(null) }
    var itemsErrorMsg by remember { mutableStateOf<String?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    fun refreshItems() {
        scope.launch {
            isLoading = true
            itemsErrorMsg = null
            val result = supabaseClient.fetchItems()
            isLoading = false
            result.onSuccess { fetched ->
                itemsList.clear()
                itemsList.addAll(fetched)
            }.onFailure { err ->
                itemsErrorMsg = err.message
                toastMsg = err.message
            }
        }
    }

    androidx.compose.runtime.LaunchedEffect(Unit) {
        refreshItems()
    }

    val filteredItems = itemsList.filter { item ->
        val q = searchQuery.lowercase().trim()
        val matchesQuery = q.isEmpty() ||
                item.id.lowercase().contains(q) ||
                item.name.lowercase().contains(q) ||
                item.brand.lowercase().contains(q) ||
                item.code.lowercase().contains(q) ||
                item.category.lowercase().contains(q)

        val matchesCat = selectedCategoryChip.equals("All", ignoreCase = true) ||
                item.category.equals(selectedCategoryChip, ignoreCase = true)

        matchesQuery && matchesCat
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Items",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { refreshItems() },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE2E8F0), contentColor = TextPrimary),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Refresh", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search items...", fontSize = 14.sp, color = TextMuted) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("All", "Textiles", "Hardware", "Electronics", "Groceries", "General").forEach { chip ->
                    val isSelected = selectedCategoryChip == chip
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(if (isSelected) PrimaryBlue else androidx.compose.material3.MaterialTheme.colorScheme.surface)
                            .border(1.dp, if (isSelected) PrimaryBlue else androidx.compose.material3.MaterialTheme.colorScheme.outline, RoundedCornerShape(20.dp))
                            .clickable { selectedCategoryChip = chip }
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = chip,
                            fontSize = 13.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) Color.White else androidx.compose.material3.MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            itemsErrorMsg?.let { msg ->
                Surface(
                    color = Color(0xFFFEF2F2),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "⚠️ $msg",
                        color = Color(0xFFDC2626),
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

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

            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    androidx.compose.material3.CircularProgressIndicator(color = PrimaryBlue)
                }
            } else if (filteredItems.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No items found in database.", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredItems) { item ->
                        MobileItemCard(
                            item = item,
                            onEdit = {
                                editingItem = item
                                showFormDialog = true
                            },
                            onDelete = {
                                deletingItem = item
                            }
                        )
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = {
                editingItem = null
                showFormDialog = true
            },
            containerColor = PrimaryBlue,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Item", modifier = Modifier.size(24.dp))
        }
    }

    if (showFormDialog) {
        ItemFormDialog(
            editingItem = editingItem,
            onDismiss = { showFormDialog = false },
            onSave = { name, brand, code, category, unit, alert, price, status ->
                scope.launch {
                    if (editingItem != null) {
                        val result = supabaseClient.updateItem(editingItem!!.id, name, brand, code, category, unit, editingItem!!.stockQuantity, alert, price, status)
                        result.onSuccess { updated ->
                            val idx = itemsList.indexOfFirst { it.id == editingItem!!.id }
                            if (idx >= 0) itemsList[idx] = updated
                            toastMsg = "Item '$name' updated."
                        }.onFailure { err ->
                            toastMsg = "Error: ${err.message}"
                        }
                    } else {
                        val result = supabaseClient.addItem(name, brand, code, category, unit, 10, alert, price, status)
                        result.onSuccess { newItem ->
                            itemsList.add(0, newItem)
                            toastMsg = "New item '$name' created."
                        }.onFailure { err ->
                            toastMsg = "Error: ${err.message}"
                        }
                    }
                    showFormDialog = false
                }
            }
        )
    }

    deletingItem?.let { target ->
        Dialog(onDismissRequest = { deletingItem = null }) {
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
                    Text("Delete Item?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Are you sure you want to delete '${target.name}' (${target.code})?", fontSize = 14.sp, color = TextMuted)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Button(
                            onClick = { deletingItem = null },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    try {
                                        val result = supabaseClient.deleteItem(target.id)
                                        result.onSuccess {
                                            itemsList.removeAll { it.id == target.id }
                                            toastMsg = "Item '${target.name}' deleted."
                                        }.onFailure { err ->
                                            toastMsg = "Failed to delete: ${err.message}"
                                        }
                                    } catch (e: Exception) {
                                        toastMsg = "Error: ${e.message}"
                                    } finally {
                                        deletingItem = null
                                    }
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
}

@Composable
private fun MobileItemCard(
    item: ItemModel,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = item.name,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${item.brand} • ${item.code}",
                        fontSize = 13.sp,
                        color = TextMuted
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFEFF6FF))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = item.category,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryBlue
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
                    Text(
                        text = "₹${String.format("%.2f", item.salePrice)} / ${item.unit}",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Alert Threshold: ${item.lowStockAlert} ${item.unit}",
                        fontSize = 12.sp,
                        color = TextMuted
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFF1F5F9))
                            .clickable { onEdit() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextPrimary, modifier = Modifier.size(15.dp))
                    }

                    Spacer(modifier = Modifier.width(6.dp))

                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFFEF2F2))
                            .clickable { onDelete() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete", tint = ErrorRed, modifier = Modifier.size(15.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun ItemFormDialog(
    editingItem: ItemModel?,
    onDismiss: () -> Unit,
    onSave: (name: String, brand: String, code: String, category: String, unit: String, lowStockAlert: Int, salePrice: Double, status: String) -> Unit
) {
    var name by remember { mutableStateOf(editingItem?.name ?: "") }
    var brand by remember { mutableStateOf(editingItem?.brand ?: "") }
    var code by remember { mutableStateOf(editingItem?.code ?: "") }
    var category by remember { mutableStateOf(editingItem?.category ?: "Groceries") }
    var unit by remember { mutableStateOf(editingItem?.unit ?: "Pcs") }
    var lowStockAlert by remember { mutableStateOf(editingItem?.lowStockAlert?.toString() ?: "5") }
    var salePrice by remember { mutableStateOf(editingItem?.salePrice?.toString() ?: "45.0") }
    var status by remember { mutableStateOf(editingItem?.status ?: "Active") }
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
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (editingItem != null) "Edit Item" else "Add New Item",
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
                    placeholder = { Text("Item Name *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = brand,
                        onValueChange = { brand = it },
                        placeholder = { Text("Brand Name", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = code,
                        onValueChange = { code = it },
                        placeholder = { Text("Item Code (SKU)", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = category,
                        onValueChange = { category = it },
                        placeholder = { Text("Category", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = unit,
                        onValueChange = { unit = it },
                        placeholder = { Text("Unit (Pcs/Kg/Bag)", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = salePrice,
                        onValueChange = { salePrice = it; if (errorMsg != null) errorMsg = null },
                        placeholder = { Text("Sale Price (₹) *", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = lowStockAlert,
                        onValueChange = { lowStockAlert = it },
                        placeholder = { Text("Low Stock Alert", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
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
                            val priceNum = salePrice.toDoubleOrNull()
                            val alertNum = lowStockAlert.toIntOrNull() ?: 5
                            if (name.isBlank() || priceNum == null || priceNum < 0) {
                                errorMsg = "Item Name and valid Sale Price are required."
                            } else {
                                onSave(name.trim(), brand.trim(), code.trim(), category.trim(), unit.trim(), alertNum, priceNum, status)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (editingItem != null) "Save Changes" else "Add Item", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
