package com.example.crm_app_kmp.ui.categories

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
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.People
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
import org.json.JSONObject
import com.example.crm_app_kmp.categories.CategoryModel
import com.example.crm_app_kmp.ui.components.CrmRootScaffold
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@Composable
fun AndroidCategoriesScreen(
    onNavigateSection: (String) -> Unit = {}
) {
    CrmRootScaffold(
        activeSection = "Categories",
        onNavigateSection = onNavigateSection
    ) {
        AndroidCategoriesContent()
    }
}

@Composable
fun AndroidCategoriesContent() {
    val context = LocalContext.current
    val supabaseClient = remember { com.example.crm_app_kmp.data.SupabaseAndroidClient(context) }
    val scope = rememberCoroutineScope()

    val categories = remember { mutableStateListOf<CategoryModel>() }
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilterChip by remember { mutableStateOf("All") }

    var showFormDialog by remember { mutableStateOf(false) }
    var editingCategory by remember { mutableStateOf<CategoryModel?>(null) }
    var deletingCategory by remember { mutableStateOf<CategoryModel?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }
    var errorToastMsg by remember { mutableStateOf<String?>(null) }

    fun refreshCategories() {
        scope.launch {
            val res = supabaseClient.fetchTable("categories")
            res.onSuccess { array ->
                categories.clear()
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    categories.add(
                        CategoryModel(
                            id = obj.optString("id", ""),
                            name = obj.optString("name", ""),
                            type = "Customer Category",
                            status = obj.optString("status", "Active"),
                            createdDate = "Recent",
                            usageCount = 0,
                            subText = obj.optString("description", "")
                        )
                    )
                }
            }
        }
    }

    androidx.compose.runtime.LaunchedEffect(Unit) {
        refreshCategories()
    }

    val filteredCategories = categories.filter { cat ->
        val q = searchQuery.lowercase().trim()
        val matchesQuery = q.isEmpty() ||
                cat.id.lowercase().contains(q) ||
                cat.name.lowercase().contains(q) ||
                cat.status.lowercase().contains(q)

        val matchesFilter = when (selectedFilterChip) {
            "All" -> true
            "Active" -> cat.status.equals("Active", ignoreCase = true)
            else -> true
        }

        matchesQuery && matchesFilter
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text(
                text = "Customer Categories",
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold,
                color = androidx.compose.material3.MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Manage categories used for customer classification.",
                fontSize = 13.sp,
                color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant
            )

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search customer categories...", fontSize = 14.sp, color = TextMuted) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("All", "Active").forEach { chip ->
                    val isSelected = selectedFilterChip == chip
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(if (isSelected) PrimaryBlue else androidx.compose.material3.MaterialTheme.colorScheme.surface)
                            .border(1.dp, if (isSelected) PrimaryBlue else androidx.compose.material3.MaterialTheme.colorScheme.outline, RoundedCornerShape(20.dp))
                            .clickable { selectedFilterChip = chip }
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

            errorToastMsg?.let { err ->
                Surface(
                    color = Color(0xFFFEF2F2),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "⚠️ $err",
                        color = ErrorRed,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            if (filteredCategories.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No customer categories found.", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.padding(bottom = 80.dp)
                ) {
                    filteredCategories.forEach { cat ->
                        MobileCategoryCard(
                            category = cat,
                            onEdit = {
                                editingCategory = cat
                                showFormDialog = true
                            },
                            onDelete = {
                                deletingCategory = cat
                            }
                        )
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = {
                editingCategory = null
                showFormDialog = true
            },
            containerColor = PrimaryBlue,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Category", modifier = Modifier.size(24.dp))
        }
    }

    if (showFormDialog) {
        CategoryFormDialog(
            editingCategory = editingCategory,
            existingCategories = categories,
            onDismiss = { showFormDialog = false },
            onSave = { name, status ->
                scope.launch {
                    val trimmed = name.trim()
                    val duplicate = categories.any { c -> c.name.equals(trimmed, ignoreCase = true) && c.id != editingCategory?.id }
                    if (duplicate) {
                        errorToastMsg = "Category '$trimmed' already exists."
                        return@launch
                    }

                    val payload = JSONObject().apply {
                        put("name", trimmed)
                        put("status", status)
                    }
                    if (editingCategory != null) {
                        supabaseClient.updateRecord("categories", editingCategory!!.id, payload)
                        toastMsg = "Category '$trimmed' updated."
                    } else {
                        supabaseClient.insertRecord("categories", payload)
                        toastMsg = "New category '$trimmed' created."
                    }
                    refreshCategories()
                }
                showFormDialog = false
            }
        )
    }

    deletingCategory?.let { target ->
        Dialog(onDismissRequest = { deletingCategory = null }) {
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
                    Text("Delete Category?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Are you sure you want to delete '${target.name}'?", fontSize = 14.sp, color = TextMuted)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Button(
                            onClick = { deletingCategory = null },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9), contentColor = TextPrimary),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    // Delete protection check against active customers
                                    val custRes = supabaseClient.fetchTable("customers")
                                    var isAssigned = false
                                    custRes.onSuccess { arr ->
                                        for (i in 0 until arr.length()) {
                                            val cObj = arr.getJSONObject(i)
                                            val cCat = cObj.optString("category", "")
                                            val cCatId = cObj.optString("category_id", "")
                                            if (cCat.equals(target.name, ignoreCase = true) || cCatId == target.id) {
                                                isAssigned = true
                                                break
                                            }
                                        }
                                    }

                                    if (isAssigned) {
                                        errorToastMsg = "This category is assigned to customers and cannot be deleted."
                                        deletingCategory = null
                                        return@launch
                                    }

                                    supabaseClient.deleteRecord("categories", target.id)
                                    toastMsg = "Category '${target.name}' deleted."
                                    refreshCategories()
                                    deletingCategory = null
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
private fun MobileCategoryCard(
    category: CategoryModel,
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
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFF0FDF4)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.People, contentDescription = null, tint = Color(0xFF16A34A), modifier = Modifier.size(20.dp))
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = category.name,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            maxLines = 1,
                            overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Customer Category",
                            fontSize = 12.sp,
                            color = TextMuted,
                            maxLines = 1,
                            overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                        )
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                val statusBg = if (category.status.equals("Active", ignoreCase = true)) Color(0xFFDCFCE7) else Color(0xFFFEF2F2)
                val statusText = if (category.status.equals("Active", ignoreCase = true)) Color(0xFF15803D) else ErrorRed

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(statusBg)
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = category.status,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = statusText,
                        maxLines = 1,
                        softWrap = false
                    )
                }
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Created: ${category.createdDate}",
                    fontSize = 12.sp,
                    color = TextMuted
                )

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
private fun CategoryFormDialog(
    editingCategory: CategoryModel?,
    existingCategories: List<CategoryModel>,
    onDismiss: () -> Unit,
    onSave: (name: String, status: String) -> Unit
) {
    var name by remember { mutableStateOf(editingCategory?.name ?: "") }
    var status by remember { mutableStateOf(editingCategory?.status ?: "Active") }
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
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (editingCategory != null) "Edit Category" else "Add New Category",
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
                    placeholder = { Text("Category Name *", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                Text("Status", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(
                        selected = status == "Active",
                        onClick = { status = "Active" },
                        colors = RadioButtonDefaults.colors(selectedColor = PrimaryBlue)
                    )
                    Text("Active", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Spacer(modifier = Modifier.width(16.dp))
                    RadioButton(
                        selected = status == "Inactive",
                        onClick = { status = "Inactive" },
                        colors = RadioButtonDefaults.colors(selectedColor = ErrorRed)
                    )
                    Text("Inactive", fontSize = 13.sp, fontWeight = FontWeight.Medium)
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
                            if (name.isBlank()) {
                                errorMsg = "Category Name is required."
                            } else {
                                onSave(name.trim(), status)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (editingCategory != null) "Save Changes" else "Add Category", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
