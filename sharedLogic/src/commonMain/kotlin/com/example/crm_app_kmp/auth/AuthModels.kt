package com.example.crm_app_kmp.auth

import kotlin.js.JsExport

@JsExport
enum class AuthScreen {
    LOGIN,
    SIGN_UP
}

@JsExport
enum class AuthStatus {
    CHECKING_SESSION,
    AUTHENTICATED,
    UNAUTHENTICATED
}

@JsExport
data class UserSession(
    val id: String,
    val email: String,
    val username: String? = null,
    val accessToken: String? = null,
    val refreshToken: String? = null
)

@JsExport
data class AuthState(
    val status: AuthStatus,
    val session: UserSession? = null,
    val profile: UserProfile? = null,
    val errorMessage: String? = null
)

@JsExport
data class ValidationResult(
    val isValid: Boolean,
    val errorMessage: String? = null
)

@JsExport
data class SignUpValidationResult(
    val usernameError: String? = null,
    val emailError: String? = null,
    val passwordError: String? = null,
    val confirmPasswordError: String? = null
) {
    val isValid: Boolean
        get() = usernameError == null && emailError == null && passwordError == null && confirmPasswordError == null
}
