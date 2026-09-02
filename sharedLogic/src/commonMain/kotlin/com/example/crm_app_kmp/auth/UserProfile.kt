package com.example.crm_app_kmp.auth

import kotlin.js.JsExport

@JsExport
data class UserProfile(
    val id: String,
    val username: String,
    val email: String,
    val role: String = "user",
    val createdAt: String? = null,
    val updatedAt: String? = null
)
