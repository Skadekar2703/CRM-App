package com.example.crm_app_kmp.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.crm_app_kmp.ui.theme.ErrorRed
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary

@Composable
fun ThreeStepDeleteDialog(
    itemName: String,
    itemDetails: String? = null,
    userRole: String = "ADMIN",
    onDismiss: () -> Unit,
    onConfirmDelete: () -> Unit
) {
    var step by remember { mutableStateOf(1) }

    if (!userRole.equals("ADMIN", ignoreCase = true)) {
        AlertDialog(
            onDismissRequest = onDismiss,
            title = {
                Text(
                    text = "🔒 Access Denied",
                    color = ErrorRed,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = "Only Admin users can delete records.",
                    color = TextPrimary
                )
            },
            confirmButton = {
                Button(onClick = onDismiss) {
                    Text("OK")
                }
            }
        )
        return
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = when (step) {
                    1 -> "⚠️ Delete $itemName? (Confirmation 1 of 3)"
                    2 -> "⚠️ Confirm Delete (Confirmation 2 of 3)"
                    else -> "⚠️ Final Confirmation (Confirmation 3 of 3)"
                },
                color = ErrorRed,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                when (step) {
                    1 -> {
                        Text(
                            text = "Are you sure you want to delete $itemName?",
                            color = TextPrimary,
                            fontSize = 14.sp
                        )
                        if (!itemDetails.isNullOrBlank()) {
                            Text(
                                text = itemDetails,
                                color = TextMuted,
                                fontSize = 12.sp
                            )
                        }
                    }
                    2 -> {
                        Text(
                            text = "This action will remove $itemName. Please confirm that you want to continue.",
                            color = TextPrimary,
                            fontSize = 14.sp
                        )
                    }
                    else -> {
                        Text(
                            text = "This action cannot be undone. Are you sure you want to permanently delete $itemName?",
                            color = ErrorRed,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (step < 3) {
                        step++
                    } else {
                        onConfirmDelete()
                        onDismiss()
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = ErrorRed),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = if (step < 3) "Continue →" else "Delete Permanently",
                    fontWeight = FontWeight.Bold
                )
            }
        },
        dismissButton = {
            OutlinedButton(
                onClick = onDismiss,
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Cancel", color = TextMuted)
            }
        }
    )
}
