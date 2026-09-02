package com.example.crm_app_kmp.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val DeepNavy = Color(0xFF0F172A)
val CardBackground = Color(0xFFFFFFFF)
val PrimaryBlue = Color(0xFF2563EB)
val TextPrimary = Color(0xFF1E293B)
val TextMuted = Color(0xFF64748B)
val BorderLight = Color(0xFFE2E8F0)
val ErrorRed = Color(0xFFDC2626)
val InputBackground = Color(0xFFF8FAFC)

private val LightColorScheme = lightColorScheme(
    primary = DeepNavy,
    secondary = PrimaryBlue,
    background = DeepNavy,
    surface = CardBackground,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color.White,
    onSurface = TextPrimary,
    outline = BorderLight
)

@Composable
fun CrmTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
