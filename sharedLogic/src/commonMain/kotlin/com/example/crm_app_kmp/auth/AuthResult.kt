package com.example.crm_app_kmp.auth

import kotlin.js.JsExport

@JsExport
data class AuthResult(
    val isSuccess: Boolean,
    val userProfile: UserProfile? = null,
    val session: UserSession? = null,
    val errorMessage: String? = null
) {
    companion object {
        fun success(profile: UserProfile, session: UserSession): AuthResult {
            return AuthResult(
                isSuccess = true,
                userProfile = profile,
                session = session,
                errorMessage = null
            )
        }

        fun error(message: String): AuthResult {
            return AuthResult(
                isSuccess = false,
                userProfile = null,
                session = null,
                errorMessage = message
            )
        }
    }
}
