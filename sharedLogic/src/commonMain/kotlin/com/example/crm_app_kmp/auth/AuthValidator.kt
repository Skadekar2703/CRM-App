package com.example.crm_app_kmp.auth

import kotlin.js.JsExport

@JsExport
object AuthValidator {

    fun validateUsername(username: String): ValidationResult {
        return if (username.isBlank()) {
            ValidationResult(false, "Username is required")
        } else {
            ValidationResult(true)
        }
    }

    fun validateEmail(email: String): ValidationResult {
        val trimmed = email.trim()
        return when {
            trimmed.isBlank() -> ValidationResult(false, "Email is required")
            !trimmed.contains("@") || !trimmed.contains(".") || trimmed.indexOf("@") > trimmed.lastIndexOf(".") -> {
                ValidationResult(false, "Please enter a valid email address")
            }
            else -> ValidationResult(true)
        }
    }

    fun validatePassword(password: String): ValidationResult {
        return when {
            password.isEmpty() -> ValidationResult(false, "Password is required")
            password.length < 6 -> ValidationResult(false, "Password must be at least 6 characters")
            else -> ValidationResult(true)
        }
    }

    fun validateConfirmPassword(password: String, confirmPassword: String): ValidationResult {
        return when {
            confirmPassword.isEmpty() -> ValidationResult(false, "Please confirm your password")
            password != confirmPassword -> ValidationResult(false, "Passwords do not match")
            else -> ValidationResult(true)
        }
    }

    fun validateSignUp(
        username: String,
        email: String,
        password: String,
        confirmPassword: String
    ): SignUpValidationResult {
        val uResult = validateUsername(username)
        val eResult = validateEmail(email)
        val pResult = validatePassword(password)
        val cpResult = validateConfirmPassword(password, confirmPassword)

        return SignUpValidationResult(
            usernameError = uResult.errorMessage,
            emailError = eResult.errorMessage,
            passwordError = pResult.errorMessage,
            confirmPasswordError = cpResult.errorMessage
        )
    }
}
