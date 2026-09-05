package com.example.crm_app_kmp.ui.areas

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
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
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
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
import com.example.crm_app_kmp.areas.AreaModel
import com.example.crm_app_kmp.areas.AreaRepository
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AndroidAreasScreen() {
    val context = LocalContext.current
    val supabaseClient = remember { com.example.crm_app_kmp.data.SupabaseAndroidClient(context) }
    val scope = rememberCoroutineScope()

    val areas = remember { mutableStateListOf<AreaModel>() }
    var searchQuery by remember { mutableStateOf("") }
    var selectedStatusFilter by remember { mutableStateOf("All") }

    var showFormDialog by remember { mutableStateOf(false) }
    var editingArea by remember { mutableStateOf<AreaModel?>(null) }
    var deletingArea by remember { mutableStateOf<AreaModel?>(null) }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    fun refreshAreas() {
        scope.launch {
            val res = supabaseClient.fetchTable("areas")
            res.onSuccess { array ->
                areas.clear()
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    areas.add(
                        AreaModel(
                            id = obj.optString("id", ""),
                            name = obj.optString("name", ""),
                            status = obj.optString("status", "Active"),
                            createdDate = "Recent",
                            locationCount = 0
                        )
                    )
                }
            }
        }
    }

    androidx.compose.runtime.LaunchedEffect(Unit) {
        refreshAreas()
    }

    val filteredAreas = areas.filter { a ->
        val q = searchQuery.lowercase().trim()
        val matchesQuery = q.isEmpty() || a.id.lowercase().contains(q) || a.name.lowercase().contains(q) || a.status.lowercase().contains(q)
        val matchesStatus = selectedStatusFilter == "All" || a.status.equals(selectedStatusFilter, ignoreCase = true)
        matchesQuery && matchesStatus
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
            // SEARCH & STATUS FILTERS
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search areas...", fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // FILTER CHIPS
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("All", "Active", "Inactive").forEach { filter ->
                    val isSelected = selectedStatusFilter == filter
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(if (isSelected) androidx.compose.material3.MaterialTheme.colorScheme.primary else androidx.compose.material3.MaterialTheme.colorScheme.surface)
                            .border(1.dp, if (isSelected) androidx.compose.material3.MaterialTheme.colorScheme.primary else androidx.compose.material3.MaterialTheme.colorScheme.outline, CircleShape)
                            .clickable { selectedStatusFilter = filter }
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = filter,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) androidx.compose.material3.MaterialTheme.colorScheme.onPrimary else androidx.compose.material3.MaterialTheme.colorScheme.onSurface
                        )
                    }
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

            // AREA CARDS LIST (REF 1)
            LazyLazyColumnList(
                areas = filteredAreas,
                onEdit = {
                    editingArea = it
                    showFormDialog = true
                },
                onDelete = {
                    deletingArea = it
                }
            )
        }

        // FLOATING ACTION BUTTON
        FloatingActionButton(
            onClick = {
                editingArea = null
                showFormDialog = true
            },
            containerColor = PrimaryBlue,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Area")
        }
    }

    // ADD / EDIT DIALOG
    if (showFormDialog) {
        AreaFormDialog(
            editingArea = editingArea,
            onDismiss = { showFormDialog = false },
            onSave = { name, status ->
                scope.launch {
                    val payload = JSONObject().apply {
                        put("name", name.trim())
                    }
                    val res = if (editingArea != null) {
                        supabaseClient.updateRecord("areas", editingArea!!.id, payload)
                    } else {
                        supabaseClient.insertRecord("areas", payload)
                    }
                    res.onSuccess {
                        toastMsg = if (editingArea != null) "Area '$name' updated." else "New Area '$name' added."
                        refreshAreas()
                    }.onFailure { err ->
                        val msg = err.message ?: ""
                        if (msg.contains("unique", ignoreCase = true) || msg.contains("duplicate", ignoreCase = true) || msg.contains("23505")) {
                            toastMsg = "An area named '$name' already exists in your account."
                        } else {
                            toastMsg = "Failed to save area: $msg"
                        }
                    }
                }
                showFormDialog = false
            }
        )
    }

    // DELETE CONFIRMATION DIALOG
    deletingArea?.let { target ->
        Dialog(onDismissRequest = { deletingArea = null }) {
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
                    Text("Delete Area?", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = androidx.compose.material3.MaterialTheme.colorScheme.onSurface)
                    Text("Are you sure you want to delete '${target.name}'?", fontSize = 14.sp, color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = { deletingArea = null },
                            colors = ButtonDefaults.buttonColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surfaceVariant, contentColor = androidx.compose.material3.MaterialTheme.colorScheme.onSurface),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Cancel", fontSize = 13.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    supabaseClient.deleteRecord("areas", target.id)
                                    refreshAreas()
                                }
                                toastMsg = "Area '${target.name}' deleted."
                                deletingArea = null
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
private fun ColumnScope.LazyLazyColumnList(
    areas: List<AreaModel>,
    onEdit: (AreaModel) -> Unit,
    onDelete: (AreaModel) -> Unit
) {
    if (areas.isEmpty()) {
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentAlignment = Alignment.Center
        ) {
            Text("No areas found.", color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp)
        }
    } else {
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(areas) { area ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = area.name,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = androidx.compose.material3.MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (area.status == "Active") Color(0xFFF0FDF4) else androidx.compose.material3.MaterialTheme.colorScheme.surfaceVariant)
                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = area.status,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (area.status == "Active") Color(0xFF16A34A) else androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = "${area.locationCount} Locations",
                                    fontSize = 13.sp,
                                    color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(onClick = { onEdit(area) }) {
                                Icon(Icons.Default.Edit, contentDescription = "Edit", tint = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            IconButton(onClick = { onDelete(area) }) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = ErrorRed)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AreaFormDialog(
    editingArea: AreaModel?,
    onDismiss: () -> Unit,
    onSave: (name: String, status: String) -> Unit
) {
    var name by remember { mutableStateOf(editingArea?.name ?: "") }
    var status by remember { mutableStateOf(editingArea?.status ?: "Active") }
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
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (editingArea != null) "Edit Area" else "Add New Area",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = androidx.compose.material3.MaterialTheme.colorScheme.onSurface
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                errorMsg?.let { error ->
                    Text(
                        text = "⚠️ $error",
                        color = ErrorRed,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Area Name *", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = androidx.compose.material3.MaterialTheme.colorScheme.onSurface)
                    OutlinedTextField(
                        value = name,
                        onValueChange = {
                            name = it
                            if (errorMsg != null) errorMsg = null
                        },
                        placeholder = { Text("e.g. North Region Hub", fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Status", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = androidx.compose.material3.MaterialTheme.colorScheme.onSurface)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(
                            selected = status == "Active",
                            onClick = { status = "Active" },
                            colors = RadioButtonDefaults.colors(selectedColor = PrimaryBlue)
                        )
                        Text("Active", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = androidx.compose.material3.MaterialTheme.colorScheme.onSurface)

                        Spacer(modifier = Modifier.width(16.dp))

                        RadioButton(
                            selected = status == "Inactive",
                            onClick = { status = "Inactive" },
                            colors = RadioButtonDefaults.colors(selectedColor = PrimaryBlue)
                        )
                        Text("Inactive", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = androidx.compose.material3.MaterialTheme.colorScheme.onSurface)
                    }
                }

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
                                errorMsg = "Area Name is required."
                            } else {
                                onSave(name.trim(), status)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (editingArea != null) "Save Changes" else "Add Area", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
