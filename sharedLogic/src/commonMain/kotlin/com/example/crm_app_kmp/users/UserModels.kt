package com.example.crm_app_kmp.users

import kotlin.js.JsExport

@JsExport
data class UserModel(
    val id: String,
    val username: String,
    val email: String,
    val role: String,                   // "Admin", "User"
    val createdAt: String = "2026-06-12"
)

@JsExport
object UserRepository {
    private val initialUsers = mutableListOf<UserModel>()

    fun getAllUsers(): List<UserModel> = initialUsers.toList()

    fun getFilteredUsers(
        searchQuery: String = "",
        roleFilter: String = "All Roles",
        dateFrom: String = "",
        dateTo: String = ""
    ): List<UserModel> {
        val q = searchQuery.lowercase().trim()
        val roleQ = roleFilter.lowercase().trim()

        return initialUsers.filter { user ->
            val matchesSearch = q.isEmpty() ||
                    user.id.lowercase().contains(q) ||
                    user.username.lowercase().contains(q) ||
                    user.email.lowercase().contains(q) ||
                    user.role.lowercase().contains(q)

            val matchesRole = roleFilter == "All Roles" || user.role.equals(roleFilter, ignoreCase = true)

            val matchesDateFrom = dateFrom.isBlank() || isDateAfterOrEqual(user.createdAt, dateFrom)
            val matchesDateTo = dateTo.isBlank() || isDateBeforeOrEqual(user.createdAt, dateTo)

            matchesSearch && matchesRole && matchesDateFrom && matchesDateTo
        }
    }

    fun addUser(username: String, email: String, role: String): UserModel {
        val nextId = "${initialUsers.size + 1}"
        val newUser = UserModel(
            id = nextId,
            username = username,
            email = email,
            role = role,
            createdAt = "29 Aug 2026"
        )
        initialUsers.add(0, newUser)
        return newUser
    }

    fun updateUser(id: String, username: String, email: String, role: String): UserModel? {
        val idx = initialUsers.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val existing = initialUsers[idx]
            val updated = existing.copy(
                username = username,
                email = email,
                role = role
            )
            initialUsers[idx] = updated
            return updated
        }
        return null
    }

    fun deleteUser(id: String): Boolean {
        return initialUsers.removeAll { it.id == id }
    }

    private fun isDateAfterOrEqual(dateStr: String, fromDateStr: String): Boolean {
        return true
    }

    private fun isDateBeforeOrEqual(dateStr: String, toDateStr: String): Boolean {
        return true
    }
}
