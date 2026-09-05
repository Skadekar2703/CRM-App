package com.example.crm_app_kmp.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.example.crm_app_kmp.auth.AuthScreen
import com.example.crm_app_kmp.auth.UserSession
import com.example.crm_app_kmp.data.SupabaseAndroidClient
import com.example.crm_app_kmp.ui.screens.DashboardScreen
import com.example.crm_app_kmp.ui.screens.LoginScreen
import com.example.crm_app_kmp.ui.screens.SignUpScreen
import com.example.crm_app_kmp.ui.theme.CrmTheme
import com.example.crm_app_kmp.ui.theme.DeepNavy
import kotlinx.coroutines.launch

@Composable
fun AuthApp() {
    val context = LocalContext.current
    val supabaseClient = remember { SupabaseAndroidClient(context) }
    val scope = rememberCoroutineScope()

    var currentScreen by remember { mutableStateOf(AuthScreen.LOGIN) }
    var currentSession by remember { mutableStateOf<UserSession?>(null) }

    var isInitialLoading by remember { mutableStateOf(true) }
    var isAuthLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    val prefs = remember { context.getSharedPreferences("crm_prefs", android.content.Context.MODE_PRIVATE) }
    var isDarkTheme by remember { mutableStateOf(prefs.getBoolean("dark_mode", false)) }

    LaunchedEffect(Unit) {
        val restored = supabaseClient.restoreSession()
        if (restored != null) {
            currentSession = restored
        }
        isInitialLoading = false
    }

    CrmTheme(darkTheme = isDarkTheme) {
        if (isInitialLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(DeepNavy),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    color = Color.White,
                    modifier = Modifier.size(36.dp),
                    strokeWidth = 3.dp
                )
            }
        } else if (currentSession != null) {
            com.example.crm_app_kmp.ui.dashboard.AndroidDashboardScreen(
                userSession = currentSession!!,
                isDarkTheme = isDarkTheme,
                onToggleTheme = {
                    val newTheme = !isDarkTheme
                    isDarkTheme = newTheme
                    prefs.edit().putBoolean("dark_mode", newTheme).apply()
                },
                onLogout = {
                    supabaseClient.logout()
                    currentSession = null
                    currentScreen = AuthScreen.LOGIN
                    errorMessage = null
                    successMessage = null
                }
            )
        } else {
            when (currentScreen) {
                AuthScreen.LOGIN -> LoginScreen(
                    onNavigateToSignUp = {
                        errorMessage = null
                        successMessage = null
                        currentScreen = AuthScreen.SIGN_UP
                    },
                    onLoginClick = { username, password, role ->
                        scope.launch {
                            isAuthLoading = true
                            errorMessage = null
                            successMessage = null
                            val result = supabaseClient.loginByUsername(username, password, role)
                            isAuthLoading = false
                            result.onSuccess { session ->
                                currentSession = session
                            }.onFailure { err ->
                                errorMessage = err.message
                            }
                        }
                    },
                    onForgotPasswordClick = { email ->
                        scope.launch {
                            isAuthLoading = true
                            errorMessage = null
                            successMessage = null
                            val result = supabaseClient.resetPassword(email)
                            isAuthLoading = false
                            result.onSuccess {
                                successMessage = "Password reset instructions sent to $email"
                            }.onFailure { err ->
                                errorMessage = err.message
                            }
                        }
                    },
                    isLoading = isAuthLoading,
                    errorMessage = errorMessage,
                    successMessage = successMessage
                )
                AuthScreen.SIGN_UP -> SignUpScreen(
                    onNavigateToLogin = {
                        errorMessage = null
                        successMessage = null
                        currentScreen = AuthScreen.LOGIN
                    },
                    onSignUpClick = { username, email, password ->
                        scope.launch {
                            isAuthLoading = true
                            errorMessage = null
                            successMessage = null
                            val result = supabaseClient.signUp(username, email, password)
                            isAuthLoading = false
                            result.onSuccess { session ->
                                currentSession = session
                            }.onFailure { err ->
                                errorMessage = err.message
                            }
                        }
                    },
                    isLoading = isAuthLoading,
                    errorMessage = errorMessage
                )
            }
        }
    }
}
