package com.example.crm_app_kmp.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val DeepNavy = Color(0xFF0F172A)
val PrimaryBlue = Color(0xFF2563EB)
val ErrorRed = Color(0xFFDC2626)

// DYNAMIC ADAPTIVE THEME TOKENS FOR LIGHT & DARK MODE
val TextPrimary: Color
    @Composable
    get() = MaterialTheme.colorScheme.onSurface

val TextMuted: Color
    @Composable
    get() = MaterialTheme.colorScheme.onSurfaceVariant

val CardBackground: Color
    @Composable
    get() = MaterialTheme.colorScheme.surface

val InputBackground: Color
    @Composable
    get() = MaterialTheme.colorScheme.surfaceVariant

val BorderLight: Color
    @Composable
    get() = MaterialTheme.colorScheme.outline

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF2563EB),
    secondary = Color(0xFF3B82F6),
    background = Color(0xFF0B0F19),
    surface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFF1E293B),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF8FAFC),
    onSurfaceVariant = Color(0xFFCBD5E1),
    outline = Color(0xFF334155)
)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryBlue,
    secondary = DeepNavy,
    background = Color(0xFFF1F5F9),
    surface = Color.White,
    surfaceVariant = Color(0xFFF8FAFC),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFF1E293B),
    onSurface = Color(0xFF1E293B),
    onSurfaceVariant = Color(0xFF64748B),
    outline = Color(0xFFE2E8F0)
)

@Composable
fun CrmTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
