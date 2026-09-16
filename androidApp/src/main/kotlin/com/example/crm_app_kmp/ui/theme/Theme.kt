package com.example.crm_app_kmp.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val DeepNavy = Color(0xFF0F172A)
val PrimaryBlue = Color(0xFF3B82F6)
val ErrorRed = Color(0xFFEF4444)
val SuccessGreen = Color(0xFF22C55E)
val WarningOrange = Color(0xFFF59E0B)

// DYNAMIC ADAPTIVE THEME TOKENS FOR LIGHT & DARK MODE
val TextPrimary: Color
    @Composable
    get() = MaterialTheme.colorScheme.onSurface

val TextSecondary: Color
    @Composable
    get() = MaterialTheme.colorScheme.onSurfaceVariant

val TextMuted: Color
    @Composable
    get() = if (MaterialTheme.colorScheme.background == Color(0xFF080D1A)) Color(0xFF94A3B8) else Color(0xFF64748B)

val CardBackground: Color
    @Composable
    get() = MaterialTheme.colorScheme.surface

val ElevatedCardBackground: Color
    @Composable
    get() = MaterialTheme.colorScheme.surfaceVariant

val BorderLight: Color
    @Composable
    get() = MaterialTheme.colorScheme.outline

val InputBackground: Color
    @Composable
    get() = MaterialTheme.colorScheme.surfaceVariant

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF3B82F6),
    secondary = Color(0xFF8B5CF6),
    background = Color(0xFF080D1A),
    surface = Color(0xFF111A2E),
    surfaceVariant = Color(0xFF17233A),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF8FAFC),
    onSurfaceVariant = Color(0xFFCBD5E1),
    outline = Color(0xFF26354F),
    error = Color(0xFFEF4444)
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF3B82F6),
    secondary = Color(0xFF8B5CF6),
    background = Color(0xFFF4F7FB),
    surface = Color.White,
    surfaceVariant = Color(0xFFF8FAFC),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFF0F172A),
    onSurface = Color(0xFF0F172A),
    onSurfaceVariant = Color(0xFF475569),
    outline = Color(0xFFD9E2EF),
    error = Color(0xFFEF4444)
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
