package com.example.crm_app_kmp.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.NavigationDrawerItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.crm_app_kmp.auth.UserSession
import com.example.crm_app_kmp.navigation.CrmNavigationMenu
import com.example.crm_app_kmp.ui.theme.PrimaryBlue
import com.example.crm_app_kmp.ui.theme.TextMuted
import com.example.crm_app_kmp.ui.theme.TextPrimary
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CrmRootScaffold(
    activeSection: String,
    onNavigateSection: (String) -> Unit,
    userSession: UserSession? = null,
    onLogout: () -> Unit = {},
    content: @Composable () -> Unit
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    var showProfileMenu by remember { mutableStateOf(false) }

    val userDisplayName = userSession?.username ?: userSession?.email?.split("@")?.firstOrNull() ?: "Admin"
    val userInitial = userDisplayName.take(1).uppercase()

    androidx.activity.compose.BackHandler(enabled = drawerState.isOpen) {
        scope.launch { drawerState.close() }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = Color(0xFF0F172A),
                modifier = Modifier.width(280.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .windowInsetsPadding(WindowInsets.statusBars)
                        .windowInsetsPadding(WindowInsets.navigationBars)
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    // FIXED DRAWER HEADER
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(vertical = 12.dp)
                    ) {
                        CrmLogo(size = 36.dp, fontSize = 12)
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(userDisplayName, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text("Management Portal", color = Color(0xFF94A3B8), fontSize = 12.sp)
                        }
                    }

                    HorizontalDivider(color = Color(0xFF1E293B), modifier = Modifier.padding(bottom = 12.dp))

                    // VERTICALLY SCROLLABLE NAVIGATION MENU
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .verticalScroll(rememberScrollState())
                    ) {
                        CrmNavigationMenu.items.forEach { menuItem ->
                            val isSelected = menuItem.id.equals(activeSection, ignoreCase = true)
                            NavigationDrawerItem(
                                label = {
                                    Text(
                                        text = menuItem.label,
                                        color = if (isSelected) Color.White else Color(0xFF94A3B8),
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                        fontSize = 14.sp
                                    )
                                },
                                selected = isSelected,
                                onClick = {
                                    scope.launch { drawerState.close() }
                                    if (menuItem.id == "Sign Out") {
                                        onLogout()
                                    } else {
                                        onNavigateSection(menuItem.id)
                                    }
                                },
                                colors = NavigationDrawerItemDefaults.colors(
                                    selectedContainerColor = PrimaryBlue,
                                    unselectedContainerColor = Color.Transparent
                                ),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.padding(vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }
    ) {
        Scaffold(
            topBar = {
                // UNIFIED TOP APP BAR ON EVERY SINGLE SCREEN
                Surface(
                    color = Color.White,
                    shadowElevation = 2.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.windowInsetsPadding(WindowInsets.statusBars)) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // TOP LEFT: HAMBURGER MENU BUTTON + BRANDING / SCREEN TITLE
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(
                                    onClick = { scope.launch { drawerState.open() } }
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Menu,
                                        contentDescription = "Open Navigation Menu",
                                        tint = TextPrimary
                                    )
                                }

                                CrmLogo(size = 32.dp, fontSize = 11)
                                Spacer(modifier = Modifier.width(10.dp))

                                Text(
                                    text = if (activeSection == "Dashboard") "CRM Dashboard" else activeSection,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                            }

                            // TOP RIGHT: NOTIFICATIONS & PROFILE AVATAR
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(onClick = {}) {
                                    Icon(
                                        imageVector = Icons.Default.Notifications,
                                        contentDescription = "Notifications",
                                        tint = TextMuted
                                    )
                                }

                                Box {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(CircleShape)
                                            .background(PrimaryBlue.copy(alpha = 0.12f))
                                            .border(1.dp, PrimaryBlue.copy(alpha = 0.3f), CircleShape)
                                            .clickable { showProfileMenu = true },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = userInitial,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = PrimaryBlue
                                        )
                                    }

                                    DropdownMenu(
                                        expanded = showProfileMenu,
                                        onDismissRequest = { showProfileMenu = false }
                                    ) {
                                        DropdownMenuItem(
                                            text = {
                                                Column {
                                                    Text(userDisplayName, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                                    userSession?.email?.let { email ->
                                                        Text(email, fontSize = 12.sp, color = TextMuted)
                                                    }
                                                }
                                            },
                                            onClick = { showProfileMenu = false }
                                        )
                                        HorizontalDivider()
                                        DropdownMenuItem(
                                            text = { Text("Sign Out", color = Color(0xFFDC2626), fontWeight = FontWeight.Bold) },
                                            onClick = {
                                                showProfileMenu = false
                                                onLogout()
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ) { innerPadding ->
            var showAiDialog by remember { mutableStateOf(false) }

            // SCREEN CONTENT IS PLACED STRICTLY BELOW TOP APP BAR WITHOUT CUTOFF
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(Color(0xFFF8FAFC))
            ) {
                content()

                // GLOBAL FLOATING AI ASSISTANT BUTTON (BOTTOM-RIGHT ON EVERY SCREEN)
                androidx.compose.material3.ExtendedFloatingActionButton(
                    onClick = { showAiDialog = true },
                    containerColor = Color(0xFF7C3AED),
                    contentColor = Color.White,
                    icon = { Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(18.dp)) },
                    text = { Text("AI Assistant", fontWeight = FontWeight.Bold, fontSize = 13.sp) },
                    shape = RoundedCornerShape(24.dp),
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(bottom = 80.dp, end = 16.dp)
                )

                if (showAiDialog) {
                    com.example.crm_app_kmp.ui.ai.AndroidAiChatDialog(onDismiss = { showAiDialog = false })
                }
            }
        }
    }
}
