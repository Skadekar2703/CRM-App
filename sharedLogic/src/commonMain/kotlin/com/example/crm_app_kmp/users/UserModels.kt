package com.example.crm_app_kmp.users

import kotlin.js.JsExport

@JsExport
data class UserModel(
    val id: String,
    val username: String,
    val email: String,
    val role: String,                   // "ADMIN", "STAFF"
    val status: String = "Active",       // "Active", "Disabled"
    val businessId: String = "00000000-0000-0000-0000-000000000001",
    val createdAt: String = "2026-09-02"
)

@JsExport
object UserRepository {
    private val initialUsers = mutableListOf<UserModel>()

    fun getAllUsers(): List<UserModel> = initialUsers.toList()

    fun getFilteredUsers(
        searchQuery: String = "",
        roleFilter: String = "All Roles",
        statusFilter: String = "All Status",
        dateFrom: String = "",
        dateTo: String = ""
    ): List<UserModel> {
        val q = searchQuery.lowercase().trim()

        return initialUsers.filter { user ->
            val matchesSearch = q.isEmpty() ||
                    user.id.lowercase().contains(q) ||
                    user.username.lowercase().contains(q) ||
                    user.email.lowercase().contains(q) ||
                    user.role.lowercase().contains(q)

            val matchesRole = roleFilter == "All Roles" || user.role.equals(roleFilter, ignoreCase = true)
            val matchesStatus = statusFilter == "All Status" || user.status.equals(statusFilter, ignoreCase = true)
            matchesSearch && matchesRole && matchesStatus
        }
    }

    fun setUsers(users: List<UserModel>) {
        initialUsers.clear()
        initialUsers.addAll(users)
    }

    fun addUser(username: String, email: String, role: String, status: String = "Active"): UserModel {
        val nextId = "${initialUsers.size + 1}"
        val newUser = UserModel(
            id = nextId,
            username = username,
            email = email,
            role = role,
            status = status,
            createdAt = "02 Sep 2026"
        )
        initialUsers.add(0, newUser)
        return newUser
    }

    fun updateUser(id: String, username: String, email: String, role: String, status: String = "Active"): UserModel? {
        val idx = initialUsers.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val existing = initialUsers[idx]
            val updated = existing.copy(
                username = username,
                email = email,
                role = role,
                status = status
            )
            initialUsers[idx] = updated
            return updated
        }
        return null
    }

    fun deleteUser(id: String): Boolean {
        return initialUsers.removeAll { it.id == id }
    }
}
