package com.example.crm_app_kmp.auth

import kotlin.js.JsExport

@JsExport
data class UserProfile(
    val id: String,
    val username: String,
    val email: String,
    val role: String = "ADMIN",
    val status: String = "Active",
    val businessId: String = "00000000-0000-0000-0000-000000000001",
    val createdAt: String? = null,
    val updatedAt: String? = null
)
