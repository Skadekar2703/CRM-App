package com.example.crm_app_kmp

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform