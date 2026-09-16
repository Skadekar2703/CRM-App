package com.example.crm_app_kmp.ui.components

import android.app.DatePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.SubcomposeAsyncImage
import coil.request.ImageRequest
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary
import java.util.Calendar

import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.IconButton
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.layout.heightIn
import androidx.compose.ui.window.Dialog

@Composable
fun AppSectionHeader(
    title: String,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(Color(0xFF0F172A))
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Text(
            text = title.uppercase(),
            fontSize = 12.sp,
            fontWeight = FontWeight.ExtraBold,
            color = Color(0xFF38BDF8),
            letterSpacing = 0.5.sp
        )
    }
}

@Composable
fun AppTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "",
    required: Boolean = false,
    isRequired: Boolean = required,
    readOnly: Boolean = false,
    enabled: Boolean = true,
    singleLine: Boolean = true,
    minLines: Int = 1,
    helperText: String? = null,
    errorMessage: String? = null,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    modifier: Modifier = Modifier
) {
    val isReq = required || isRequired
    Column(modifier = modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = label,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            if (isReq) {
                Text(
                    text = " *",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = ErrorRed
                )
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, color = TextMuted, fontSize = 13.sp) },
            readOnly = readOnly,
            enabled = enabled,
            singleLine = singleLine,
            minLines = minLines,
            isError = errorMessage != null,
            keyboardOptions = keyboardOptions,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = MaterialTheme.colorScheme.surface,
                unfocusedContainerColor = if (readOnly || !enabled) Color(0xFF1E293B) else MaterialTheme.colorScheme.surface,
                disabledContainerColor = Color(0xFF1E293B),
                focusedBorderColor = PrimaryBlue,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                disabledBorderColor = Color(0xFF334155),
                errorBorderColor = ErrorRed,
                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                disabledTextColor = TextMuted
            )
        )
        if (helperText != null && errorMessage == null) {
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = helperText, fontSize = 11.sp, color = TextMuted)
        }
        if (errorMessage != null) {
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = "⚠️ $errorMessage", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = ErrorRed)
        }
    }
}

@Composable
fun AppNumberField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "0",
    required: Boolean = false,
    isRequired: Boolean = required,
    readOnly: Boolean = false,
    enabled: Boolean = true,
    helperText: String? = null,
    errorMessage: String? = null,
    allowDecimal: Boolean = true,
    modifier: Modifier = Modifier
) {
    AppTextField(
        label = label,
        value = value,
        onValueChange = { input ->
            val filtered = if (allowDecimal) {
                input.filter { c -> c.isDigit() || c == '.' }
            } else {
                input.filter { c -> c.isDigit() }
            }
            onValueChange(filtered)
        },
        placeholder = placeholder,
        required = required || isRequired,
        readOnly = readOnly,
        enabled = enabled,
        helperText = helperText,
        errorMessage = errorMessage,
        keyboardOptions = KeyboardOptions(keyboardType = if (allowDecimal) KeyboardType.Decimal else KeyboardType.Number),
        modifier = modifier
    )
}

@Composable
fun AppPhoneField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "10 Digits",
    required: Boolean = false,
    isRequired: Boolean = required,
    readOnly: Boolean = false,
    enabled: Boolean = true,
    errorMessage: String? = null,
    modifier: Modifier = Modifier
) {
    AppTextField(
        label = label,
        value = value,
        onValueChange = { input ->
            val phoneAllowed = input.filter { c -> c.isDigit() || c == '+' || c == '-' || c == ' ' || c == '(' || c == ')' }
            if (phoneAllowed.length <= 20) {
                onValueChange(phoneAllowed)
            }
        },
        placeholder = placeholder,
        required = required || isRequired,
        readOnly = readOnly,
        enabled = enabled,
        errorMessage = errorMessage,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
        modifier = modifier
    )
}

@Composable
fun AppEmailField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "name@example.com",
    required: Boolean = false,
    isRequired: Boolean = required,
    readOnly: Boolean = false,
    enabled: Boolean = true,
    errorMessage: String? = null,
    modifier: Modifier = Modifier
) {
    AppTextField(
        label = label,
        value = value,
        onValueChange = onValueChange,
        placeholder = placeholder,
        required = required || isRequired,
        readOnly = readOnly,
        enabled = enabled,
        errorMessage = errorMessage,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
        modifier = modifier
    )
}

@Composable
fun AppDropdown(
    label: String,
    selectedValue: String = "",
    value: String = selectedValue,
    options: List<String>,
    onSelect: (String) -> Unit = {},
    onValueChange: (String) -> Unit = onSelect,
    placeholder: String = "-- Select --",
    required: Boolean = false,
    isRequired: Boolean = required,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    emptyMessage: String = "No options available",
    errorMessage: String? = null,
    modifier: Modifier = Modifier
) {
    var showSelectionModal by remember { mutableStateOf(false) }
    val displayVal = if (value.isNotBlank()) value else selectedValue
    val handleSelect: (String) -> Unit = { selected ->
        onSelect(selected)
        onValueChange(selected)
    }
    val isReq = required || isRequired

    Column(modifier = modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = label,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            if (isReq) {
                Text(text = " *", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
            }
        }
        Spacer(modifier = Modifier.height(4.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .border(
                    width = 1.dp,
                    color = when {
                        errorMessage != null -> ErrorRed
                        showSelectionModal -> PrimaryBlue
                        else -> MaterialTheme.colorScheme.outline
                    },
                    shape = RoundedCornerShape(10.dp)
                )
                .background(if (enabled) MaterialTheme.colorScheme.surface else Color(0xFF1E293B))
                .clickable(enabled = enabled && !isLoading) { showSelectionModal = true }
                .padding(horizontal = 14.dp, vertical = 14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = when {
                        isLoading -> "Loading $label..."
                        displayVal.isNotBlank() -> displayVal
                        else -> placeholder
                    },
                    fontSize = 13.sp,
                    fontWeight = if (displayVal.isNotBlank()) FontWeight.Medium else FontWeight.Normal,
                    color = when {
                        isLoading -> TextMuted
                        displayVal.isNotBlank() -> MaterialTheme.colorScheme.onSurface
                        else -> TextMuted
                    }
                )
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = PrimaryBlue
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.ArrowDropDown,
                        contentDescription = "Select Option",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }

        if (errorMessage != null) {
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = "⚠️ $errorMessage", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = ErrorRed)
        }
    }

    if (showSelectionModal) {
        Dialog(onDismissRequest = { showSelectionModal = false }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Select $label",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        IconButton(onClick = { showSelectionModal = false }) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = TextMuted)
                        }
                    }

                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = MaterialTheme.colorScheme.outlineVariant)

                    if (options.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(text = emptyMessage, fontSize = 13.sp, color = TextMuted)
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 300.dp)
                        ) {
                            items(options) { item ->
                                val isSelected = item == displayVal
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (isSelected) PrimaryBlue.copy(alpha = 0.15f) else Color.Transparent)
                                        .clickable {
                                            handleSelect(item)
                                            showSelectionModal = false
                                        }
                                        .padding(horizontal = 12.dp, vertical = 14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = item,
                                        fontSize = 14.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = if (isSelected) PrimaryBlue else MaterialTheme.colorScheme.onSurface
                                    )
                                    if (isSelected) {
                                        Icon(
                                            imageVector = Icons.Default.Check,
                                            contentDescription = "Selected",
                                            tint = PrimaryBlue,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AppDatePicker(
    label: String,
    value: String,
    onDateSelected: (String) -> Unit = {},
    onValueChange: (String) -> Unit = onDateSelected,
    placeholder: String = "Select Date",
    required: Boolean = false,
    isRequired: Boolean = required,
    enabled: Boolean = true,
    errorMessage: String? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val handleDateSelected: (String) -> Unit = { selected ->
        onDateSelected(selected)
        onValueChange(selected)
    }
    val isReq = required || isRequired

    fun openPicker() {
        val calendar = Calendar.getInstance()
        val parts = value.split("-")
        if (parts.size == 3) {
            val y = parts[0].toIntOrNull()
            val m = parts[1].toIntOrNull()?.minus(1)
            val d = parts[2].toIntOrNull()
            if (y != null && m != null && d != null) {
                calendar.set(y, m, d)
            }
        }
        val y = calendar.get(Calendar.YEAR)
        val m = calendar.get(Calendar.MONTH)
        val d = calendar.get(Calendar.DAY_OF_MONTH)

        DatePickerDialog(context, { _, selectedYear, selectedMonth, selectedDay ->
            val monthStr = String.format("%02d", selectedMonth + 1)
            val dayStr = String.format("%02d", selectedDay)
            handleDateSelected("$selectedYear-$monthStr-$dayStr")
        }, y, m, d).show()
    }

    Column(modifier = modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = label,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            if (isReq) {
                Text(text = " *", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ErrorRed)
            }
        }
        Spacer(modifier = Modifier.height(4.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .border(1.dp, if (errorMessage != null) ErrorRed else MaterialTheme.colorScheme.outline, RoundedCornerShape(10.dp))
                .background(if (enabled) MaterialTheme.colorScheme.surface else Color(0xFF1E293B))
                .clickable(enabled = enabled) { openPicker() }
                .padding(horizontal = 14.dp, vertical = 14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (value.isNotBlank()) value else placeholder,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (value.isNotBlank()) MaterialTheme.colorScheme.onSurface else TextMuted
                )
                Icon(
                    imageVector = Icons.Default.CalendarToday,
                    contentDescription = "Pick Date",
                    tint = PrimaryBlue,
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        if (errorMessage != null) {
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = "⚠️ $errorMessage", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = ErrorRed)
        }
    }
}


@Composable
fun AppImagePicker(
    label: String = "Photo / Image",
    photoUrl: String,
    onPickImage: () -> Unit,
    onRemoveImage: () -> Unit,
    enabled: Boolean = true,
    isUploading: Boolean = false,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(text = label, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        Spacer(modifier = Modifier.height(6.dp))

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF1E293B))
                    .border(2.dp, PrimaryBlue, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                if (photoUrl.isNotBlank()) {
                    SubcomposeAsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(photoUrl)
                            .crossfade(true)
                            .build(),
                        contentDescription = "Photo Preview",
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                    )
                } else {
                    Text("📷", fontSize = 22.sp)
                }
            }

            Column {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = onPickImage,
                        enabled = enabled && !isUploading,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                    ) {
                        Text(
                            text = if (isUploading) "Uploading..." else if (photoUrl.isNotBlank()) "Replace Photo" else "Upload Photo",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (photoUrl.isNotBlank() && enabled) {
                        TextButton(onClick = onRemoveImage) {
                            Text("Remove", fontSize = 12.sp, color = ErrorRed, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AppFormButton(
    text: String,
    onClick: () -> Unit,
    isLoading: Boolean = false,
    enabled: Boolean = true,
    isSecondary: Boolean = false,
    modifier: Modifier = Modifier
) {
    if (isSecondary) {
        OutlinedButton(
            onClick = onClick,
            enabled = enabled && !isLoading,
            shape = RoundedCornerShape(10.dp),
            modifier = modifier.height(48.dp)
        ) {
            Text(text = text, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
    } else {
        Button(
            onClick = onClick,
            enabled = enabled && !isLoading,
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
            modifier = modifier.height(48.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    color = Color.White,
                    modifier = Modifier.size(20.dp),
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Saving...", fontSize = 13.sp, fontWeight = FontWeight.Bold)
            } else {
                Text(text = text, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }
        }
    }
}
