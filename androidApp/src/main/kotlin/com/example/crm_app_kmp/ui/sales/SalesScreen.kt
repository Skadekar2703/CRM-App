package com.example.crm_app_kmp.ui.sales

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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PointOfSale
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import com.example.crm_app_kmp.sales.CartItem
import com.example.crm_app_kmp.sales.CustomerModel
import com.example.crm_app_kmp.sales.ItemProduct
import com.example.crm_app_kmp.sales.SaleTransaction
import com.example.crm_app_kmp.sales.SalesRepository
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SalesScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(androidx.compose.material3.MaterialTheme.colorScheme.background)
    ) {
        // SEGMENTED TAB ROW
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface,
            contentColor = PrimaryBlue,
            indicator = { tabPositions ->
                TabRowDefaults.Indicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                    color = PrimaryBlue,
                    height = 3.dp
                )
            }
        ) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = {
                    Text(
                        text = "NEW SALE (POS)",
                        fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Medium,
                        fontSize = 14.sp
                    )
                }
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = {
                    Text(
                        text = "SALES HISTORY",
                        fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Medium,
                        fontSize = 14.sp
                    )
                }
            )
        }

        Box(modifier = Modifier.fillMaxSize()) {
            when (selectedTab) {
                0 -> AndroidPosView()
                1 -> AndroidSalesHistoryView()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AndroidPosView() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val supabaseClient = remember { com.example.crm_app_kmp.data.SupabaseAndroidClient(context) }
    val scope = androidx.compose.runtime.rememberCoroutineScope()

    val products = remember { mutableStateListOf<ItemProduct>() }
    val customers = remember { mutableStateListOf<CustomerModel>() }
    val cart = remember { mutableStateListOf<CartItem>() }

    var isLoadingCatalog by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("All") }
    val defaultCustomer = remember { CustomerModel("c1", "Walk-in Customer", "+91 00000 00000", "walkin@crm.com", "General") }
    var selectedCustomer by remember { mutableStateOf(defaultCustomer) }
    var paymentMethod by remember { mutableStateOf("Cash") }
    var showCartSheet by remember { mutableStateOf(false) }
    var successMsg by remember { mutableStateOf<String?>(null) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var completedReceiptTx by remember { mutableStateOf<SaleTransaction?>(null) }

    // Add Item Dialog State
    var showAddItemDialog by remember { mutableStateOf(false) }
    var newItemName by remember { mutableStateOf("") }
    var newItemPrice by remember { mutableStateOf("") }
    var newItemStock by remember { mutableStateOf("") }
    var newItemCategory by remember { mutableStateOf("General") }
    var addItemError by remember { mutableStateOf<String?>(null) }
    var isSavingItem by remember { mutableStateOf(false) }
    val categoriesList = remember { mutableStateListOf("General", "Textiles", "Hardware", "Electronics") }

    fun refreshCatalog() {
        scope.launch {
            isLoadingCatalog = true
            val itemRes = supabaseClient.fetchItems()
            val custRes = supabaseClient.fetchCustomers()
            val catRes = supabaseClient.fetchCategories()
            isLoadingCatalog = false

            itemRes.onSuccess { fetched ->
                products.clear()
                products.addAll(fetched.map { item ->
                    ItemProduct(
                        id = item.id,
                        name = item.name,
                        sku = item.code,
                        category = item.category,
                        price = item.salePrice,
                        stockQuantity = item.stockQuantity
                    )
                })
            }

            custRes.onSuccess { fetched ->
                customers.clear()
                customers.addAll(fetched.map { c ->
                    CustomerModel(
                        id = c.id,
                        name = c.name,
                        phone = c.mobile,
                        email = "",
                        area = c.area
                    )
                })
                if (customers.isNotEmpty()) {
                    selectedCustomer = customers.first()
                }
            }

            catRes.onSuccess { fetchedCats ->
                if (fetchedCats.isNotEmpty()) {
                    categoriesList.clear()
                    categoriesList.addAll(fetchedCats)
                }
            }
        }
    }

    androidx.compose.runtime.LaunchedEffect(Unit) {
        refreshCatalog()
    }

    val categories = listOf("All") + categoriesList.distinct()

    val filteredProducts = products.filter { p ->
        val matchesSearch = p.name.contains(searchQuery, ignoreCase = true) || p.sku.contains(searchQuery, ignoreCase = true)
        val matchesCategory = selectedCategory == "All" || p.category.equals(selectedCategory, ignoreCase = true)
        matchesSearch && matchesCategory
    }

    val totalItemsCount = cart.sumOf { it.quantity }
    val subtotal = cart.sumOf { it.total }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // SEARCH, ADD ITEM & REFRESH
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search items...", fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                )

                Button(
                    onClick = {
                        newItemName = ""
                        newItemPrice = ""
                        newItemStock = ""
                        newItemCategory = if (categoriesList.isNotEmpty()) categoriesList.first() else "General"
                        addItemError = null
                        showAddItemDialog = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 8.dp)
                ) {
                    Text("+ Add Item", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                IconButton(
                    onClick = { refreshCatalog() },
                    modifier = Modifier
                        .size(42.dp)
                        .background(PrimaryBlue, RoundedCornerShape(12.dp))
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = "Refresh Inventory", tint = Color.White)
                }
            }

            // CATEGORIES ROW
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                categories.forEach { cat ->
                    val isSelected = selectedCategory == cat
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(if (isSelected) androidx.compose.material3.MaterialTheme.colorScheme.primary else androidx.compose.material3.MaterialTheme.colorScheme.surface)
                            .border(1.dp, if (isSelected) androidx.compose.material3.MaterialTheme.colorScheme.primary else androidx.compose.material3.MaterialTheme.colorScheme.outline, CircleShape)
                            .clickable { selectedCategory = cat }
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = cat,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) androidx.compose.material3.MaterialTheme.colorScheme.onPrimary else androidx.compose.material3.MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            // SUCCESS TOAST
            if (successMsg != null) {
                androidx.compose.material3.Surface(
                    color = Color(0xFFF0FDF4),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "✓ ${successMsg!!}",
                        color = Color(0xFF16A34A),
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            // ERROR BANNER
            if (errorMsg != null) {
                androidx.compose.material3.Surface(
                    color = Color(0xFFFEF2F2),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "⚠️ ${errorMsg!!}",
                        color = ErrorRed,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            if (isLoadingCatalog) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    androidx.compose.material3.CircularProgressIndicator(color = PrimaryBlue)
                }
            } else if (filteredProducts.isEmpty()) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "📦",
                            fontSize = 36.sp
                        )
                        Text(
                            text = "No products found",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Add your first product to start making sales.",
                            fontSize = 12.sp,
                            color = TextMuted
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Button(
                            onClick = {
                                newItemName = ""
                                newItemPrice = ""
                                newItemStock = ""
                                newItemCategory = if (categoriesList.isNotEmpty()) categoriesList.first() else "General"
                                addItemError = null
                                showAddItemDialog = true
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("+ Add New Item", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            } else {
                // PRODUCT GRID (2 COLUMNS)
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(filteredProducts) { product ->
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = product.name,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary,
                                    maxLines = 2
                                )

                                Text(
                                    text = "SKU: ${product.sku.ifBlank { "N/A" }}",
                                    fontSize = 10.sp,
                                    color = TextMuted
                                )

                                Spacer(modifier = Modifier.height(4.dp))

                                val (stockText, stockColor) = when {
                                    product.isOutOfStock -> "Out of Stock" to ErrorRed
                                    product.stockQuantity <= 5 -> "Low Stock: ${product.stockQuantity}" to Color(0xFFD97706)
                                    else -> "Stock: ${product.stockQuantity}" to Color(0xFF16A34A)
                                }

                                Text(
                                    text = stockText,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = stockColor
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = product.priceFormatted,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TextPrimary
                                    )

                                    Button(
                                        onClick = {
                                            errorMsg = null
                                            if (!product.isOutOfStock) {
                                                val existingIndex = cart.indexOfFirst { it.product.id == product.id }
                                                if (existingIndex >= 0) {
                                                    val currQty = cart[existingIndex].quantity
                                                    if (currQty + 1 > product.stockQuantity) {
                                                        errorMsg = "Insufficient stock for '${product.name}'. Only ${product.stockQuantity} units available."
                                                    } else {
                                                        cart[existingIndex] = cart[existingIndex].copy(quantity = currQty + 1)
                                                    }
                                                } else {
                                                    cart.add(CartItem(product, 1))
                                                }
                                            }
                                        },
                                        enabled = !product.isOutOfStock,
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (product.isOutOfStock) Color(0xFF94A3B8) else Color(0xFF16A34A)
                                        ),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = if (product.isOutOfStock) "Out" else "+ Add",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // FLOATING CART FAB
        if (totalItemsCount > 0) {
            FloatingActionButton(
                onClick = { showCartSheet = true },
                containerColor = PrimaryBlue,
                contentColor = Color.White,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(20.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.ShoppingCart, contentDescription = "Cart")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("$totalItemsCount Items • ₹${subtotal.toInt()}", fontWeight = FontWeight.Bold)
                }
            }
        }

        // CART MODAL BOTTOM SHEET
        if (showCartSheet) {
            ModalBottomSheet(
                onDismissRequest = { showCartSheet = false },
                sheetState = rememberModalBottomSheetState()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Cart Summary", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text("$totalItemsCount Items", fontSize = 13.sp, color = TextMuted)
                    }

                    Divider()

                    // CART ITEMS LIST
                    cart.forEachIndexed { index, item ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(item.product.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text("${item.product.priceFormatted} × ${item.quantity} = ${item.totalFormatted}", fontSize = 12.sp, color = TextMuted)
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(
                                    onClick = {
                                        if (item.quantity > 1) {
                                            cart[index] = item.copy(quantity = item.quantity - 1)
                                        } else {
                                            cart.removeAt(index)
                                        }
                                    }
                                ) { Icon(Icons.Default.Remove, contentDescription = null) }

                                Text("${item.quantity}", fontWeight = FontWeight.Bold, fontSize = 14.sp)

                                IconButton(
                                    onClick = {
                                        if (item.quantity + 1 > item.product.stockQuantity) {
                                            errorMsg = "Insufficient stock for '${item.product.name}'. Only ${item.product.stockQuantity} units available."
                                        } else {
                                            cart[index] = item.copy(quantity = item.quantity + 1)
                                        }
                                    }
                                ) { Icon(Icons.Default.Add, contentDescription = null) }

                                IconButton(
                                    onClick = { cart.removeAt(index) }
                                ) { Icon(Icons.Default.Delete, contentDescription = null, tint = ErrorRed) }
                            }
                        }
                    }

                    Divider()

                    // CUSTOMER & PAYMENT METHOD
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Customer: ${selectedCustomer.name}", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf("Cash", "Card", "UPI").forEach { mode ->
                                val isSelected = paymentMethod == mode
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (isSelected) PrimaryBlue else Color(0xFFF1F5F9))
                                        .clickable { paymentMethod = mode }
                                        .padding(vertical = 10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = mode,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSelected) Color.White else TextPrimary
                                    )
                                }
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Total Payable", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text("₹${subtotal.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                    }

                    Button(
                        onClick = {
                            scope.launch {
                                try {
                                    errorMsg = null
                                    val result = supabaseClient.completeSaleAtomic(
                                        customerId = if (selectedCustomer.id.startsWith("c")) null else selectedCustomer.id,
                                        customerName = selectedCustomer.name,
                                        subtotal = subtotal,
                                        discount = 0.0,
                                        tax = 0.0,
                                        total = subtotal,
                                        paymentMethod = paymentMethod,
                                        cartItems = cart
                                    )

                                    result.onSuccess { json ->
                                        val invNo = json.optString("invoice_number", "INV-${System.currentTimeMillis().toString().takeLast(6)}")
                                        val tx = SaleTransaction(
                                            id = json.optString("id", "s_${System.currentTimeMillis()}"),
                                            invoiceNumber = invNo,
                                            customerId = selectedCustomer.id,
                                            customerName = selectedCustomer.name,
                                            saleDate = "Just now",
                                            subtotal = subtotal,
                                            discount = 0.0,
                                            tax = 0.0,
                                            total = subtotal,
                                            paymentMethod = paymentMethod,
                                            status = "Completed",
                                            items = cart.map { c ->
                                                com.example.crm_app_kmp.sales.SaleLineItem(
                                                    id = "li_${c.product.id}",
                                                    itemId = c.product.id,
                                                    itemName = c.product.name,
                                                    quantity = c.quantity,
                                                    unitPrice = c.product.price,
                                                    total = c.total
                                                )
                                            }
                                        )
                                        completedReceiptTx = tx
                                        cart.clear()
                                        showCartSheet = false
                                        successMsg = "Sale completed! Invoice #$invNo"
                                        refreshCatalog()
                                    }.onFailure { err ->
                                        errorMsg = err.message
                                    }
                                } catch (e: Exception) {
                                    errorMsg = e.message ?: "Sale execution failed. Please check connection."
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Complete Sale", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    if (showAddItemDialog) {
        var dropdownExpanded by remember { mutableStateOf(false) }
        AlertDialog(
            onDismissRequest = { if (!isSavingItem) showAddItemDialog = false },
            title = { Text("+ Add New Item", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    if (addItemError != null) {
                        Text(
                            text = "⚠️ ${addItemError!!}",
                            color = ErrorRed,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    OutlinedTextField(
                        value = newItemName,
                        onValueChange = { newItemName = it },
                        label = { Text("Product Name *") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = newItemPrice,
                        onValueChange = { newItemPrice = it },
                        label = { Text("Price (₹) *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = newItemStock,
                        onValueChange = { newItemStock = it },
                        label = { Text("Stock Quantity *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = newItemCategory,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Category") },
                            trailingIcon = {
                                Icon(
                                    Icons.Default.ArrowDropDown,
                                    contentDescription = null,
                                    modifier = Modifier.clickable { dropdownExpanded = !dropdownExpanded }
                                )
                            },
                            modifier = Modifier.fillMaxWidth().clickable { dropdownExpanded = !dropdownExpanded }
                        )

                        DropdownMenu(
                            expanded = dropdownExpanded,
                            onDismissRequest = { dropdownExpanded = false }
                        ) {
                            categoriesList.forEach { cat ->
                                DropdownMenuItem(
                                    text = { Text(cat) },
                                    onClick = {
                                        newItemCategory = cat
                                        dropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val name = newItemName.trim()
                        val priceVal = newItemPrice.toDoubleOrNull()
                        val stockVal = newItemStock.toIntOrNull()

                        if (name.isBlank()) {
                            addItemError = "Product name is required."
                            return@Button
                        }
                        if (priceVal == null || priceVal < 0) {
                            addItemError = "Please enter a valid price (>= 0)."
                            return@Button
                        }
                        if (stockVal == null || stockVal < 0) {
                            addItemError = "Please enter a valid stock quantity (>= 0)."
                            return@Button
                        }

                        scope.launch {
                            isSavingItem = true
                            addItemError = null
                            val res = supabaseClient.addItem(
                                name = name,
                                brand = "Generic",
                                code = "",
                                category = newItemCategory,
                                unit = "Pcs",
                                stockQuantity = stockVal,
                                lowStockAlert = 5,
                                salePrice = priceVal,
                                status = "Active"
                            )
                            isSavingItem = false
                            res.onSuccess { newItem ->
                                showAddItemDialog = false
                                successMsg = "Item \"${newItem.name}\" added successfully!"
                                refreshCatalog()
                            }.onFailure { err ->
                                addItemError = err.message ?: "Failed to add item"
                            }
                        }
                    },
                    enabled = !isSavingItem,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A))
                ) {
                    if (isSavingItem) {
                        androidx.compose.material3.CircularProgressIndicator(color = Color.White, modifier = Modifier.size(16.dp))
                    } else {
                        Text("Save Item")
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showAddItemDialog = false },
                    enabled = !isSavingItem
                ) {
                    Text("Cancel")
                }
            }
        )
    }

    completedReceiptTx?.let { tx ->
        Dialog(onDismissRequest = { completedReceiptTx = null }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Receipt #${tx.invoiceNumber}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        IconButton(onClick = { completedReceiptTx = null }) {
                            Icon(Icons.Default.Close, contentDescription = "Close")
                        }
                    }

                    Text("Customer: ${tx.customerName}", fontSize = 13.sp, color = TextMuted)
                    Text("Payment: ${tx.paymentMethod}", fontSize = 13.sp, color = TextMuted)

                    Divider()

                    tx.items.forEach { item ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("${item.itemName} × ${item.quantity}", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            Text(item.totalFormatted, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Divider()

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Total Amount", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text(tx.totalFormatted, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                    }

                    Button(
                        onClick = { completedReceiptTx = null },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                    ) {
                        Text("Close Receipt")
                    }
                }
            }
        }
    }
}

@Composable
private fun AndroidSalesHistoryView() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val supabaseClient = remember { com.example.crm_app_kmp.data.SupabaseAndroidClient(context) }
    val scope = androidx.compose.runtime.rememberCoroutineScope()

    val sales = remember { mutableStateListOf<SaleTransaction>() }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var selectedTx by remember { mutableStateOf<SaleTransaction?>(null) }

    fun refreshSalesHistory() {
        scope.launch {
            isLoading = true
            errorMessage = null
            val result = supabaseClient.fetchSalesHistory()
            isLoading = false
            result.onSuccess { fetched ->
                sales.clear()
                sales.addAll(fetched)
            }.onFailure { err ->
                errorMessage = err.message
            }
        }
    }

    androidx.compose.runtime.LaunchedEffect(Unit) {
        refreshSalesHistory()
    }

    val totalSalesSum = sales.sumOf { it.total }
    val totalCount = sales.size
    val todayFormatted = "₹${totalSalesSum.toInt()}"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // STATS SCROLL ROW
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatBox("Today's Sales", todayFormatted, "$totalCount Transactions")
            StatBox("This Week", todayFormatted, "Live")
            StatBox("This Month", todayFormatted, "Live")
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Recent Transactions", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Button(
                onClick = { refreshSalesHistory() },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE2E8F0), contentColor = TextPrimary),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Refresh", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        if (errorMessage != null) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFFEF2F2), shape = RoundedCornerShape(10.dp))
                    .border(1.dp, Color(0xFFFCA5A5), shape = RoundedCornerShape(10.dp))
                    .padding(12.dp)
            ) {
                Text(text = "⚠️ $errorMessage", color = Color(0xFFDC2626), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        if (isLoading) {
            Text("Loading sales transactions from Supabase...", fontSize = 14.sp, color = PrimaryBlue, modifier = Modifier.padding(vertical = 20.dp))
        } else if (sales.isEmpty()) {
            Text("No sales transactions found in database.", fontSize = 14.sp, color = TextMuted, modifier = Modifier.padding(vertical = 20.dp))
        }

        sales.forEach { tx ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { selectedTx = tx },
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
                        Text(tx.invoiceNumber, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        Text(tx.customerName, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                        Text(tx.saleDate, fontSize = 11.sp, color = TextMuted)
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(tx.totalFormatted, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFF0FDF4))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(tx.paymentMethod, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF16A34A))
                        }
                    }
                }
            }
        }
    }

    selectedTx?.let { tx ->
        Dialog(onDismissRequest = { selectedTx = null }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Invoice ${tx.invoiceNumber}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        IconButton(onClick = { selectedTx = null }) {
                            Icon(Icons.Default.Close, contentDescription = "Close")
                        }
                    }

                    Text("Customer: ${tx.customerName}", fontSize = 13.sp, color = TextMuted)
                    Text("Date: ${tx.saleDate}", fontSize = 13.sp, color = TextMuted)
                    Text("Payment: ${tx.paymentMethod}", fontSize = 13.sp, color = TextMuted)

                    Divider()

                    tx.items.forEach { item ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("${item.itemName} × ${item.quantity}", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            Text(item.totalFormatted, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Divider()

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Total Amount", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text(tx.totalFormatted, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                    }

                    Button(
                        onClick = { selectedTx = null },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                    ) {
                        Text("Close Receipt")
                    }
                }
            }
        }
    }
}

@Composable
private fun StatBox(title: String, value: String, sub: String) {
    Card(
        modifier = Modifier
            .width(150.dp)
            .height(95.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(title, fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text(sub, fontSize = 11.sp, color = Color(0xFF16A34A), fontWeight = FontWeight.Bold)
        }
    }
}
