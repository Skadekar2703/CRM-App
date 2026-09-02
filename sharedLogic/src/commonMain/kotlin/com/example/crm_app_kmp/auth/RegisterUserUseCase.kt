package com.example.crm_app_kmp.auth

import kotlin.js.JsExport

@JsExport
object RegisterUserUseCase {

    fun validateRegistrationInput(
        username: String,
        email: String,
        password: String
    ): ValidationResult {
        val uResult = AuthValidator.validateUsername(username)
        if (!uResult.isValid) return uResult

        val eResult = AuthValidator.validateEmail(email)
        if (!eResult.isValid) return eResult

        val pResult = AuthValidator.validatePassword(password)
        if (!pResult.isValid) return pResult

        return ValidationResult(true)
    }

    fun buildUserProfile(
        authUserId: String,
        username: String,
        email: String,
        role: String = "user"
    ): UserProfile {
        return UserProfile(
            id = authUserId, // MUST MATCH auth.users(id)
            username = username.trim(),
            email = email.trim(),
            role = role,
            createdAt = null,
            updatedAt = null
        )
    }
}
