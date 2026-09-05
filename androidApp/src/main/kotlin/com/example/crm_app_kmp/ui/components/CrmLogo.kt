package com.example.crm_app_kmp.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.crm_app_kmp.ui.theme.BorderLight
import com.example.crm_app_kmp.ui.theme.TextPrimary

@Composable
fun CrmLogo(
    size: Dp = 72.dp,
    fontSize: Int = 22
) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(Color.White)
            .border(1.dp, BorderLight, CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "CRM",
            color = com.example.crm_app_kmp.ui.theme.DeepNavy,
            fontSize = fontSize.sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = 1.sp
        )
    }
}
