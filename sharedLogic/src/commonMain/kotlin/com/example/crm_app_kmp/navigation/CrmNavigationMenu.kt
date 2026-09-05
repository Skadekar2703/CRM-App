package com.example.crm_app_kmp.navigation

import kotlin.js.JsExport

@JsExport
data class CrmMenuItem(
    val id: String,
    val label: String,
    val adminOnly: Boolean = false,
    val isAction: Boolean = false
)

@JsExport
object CrmNavigationMenu {
    val items: List<CrmMenuItem> = listOf(
        CrmMenuItem("Dashboard", "Dashboard"),
        CrmMenuItem("Customers", "Customers"),
        CrmMenuItem("Categories", "Categories"),
        CrmMenuItem("Udhaari", "Udhaari"),
        CrmMenuItem("Profit & Loss", "Profit & Loss"),
        CrmMenuItem("Cheques", "Cheques"),
        CrmMenuItem("Cash Book", "Cash Book"),
        CrmMenuItem("Expenses", "Expenses"),
        CrmMenuItem("Areas", "Areas"),
        CrmMenuItem("Notepad", "Notepad"),
        CrmMenuItem("Reminders", "Reminders"),
        CrmMenuItem("Daag", "Daag"),
        CrmMenuItem("Employees", "Employees"),
        CrmMenuItem("Users", "Users", adminOnly = true),
        CrmMenuItem("Settings", "Settings"),
        CrmMenuItem("Dark Theme", "Dark Theme", isAction = true),
        CrmMenuItem("Logout", "Logout", isAction = true)
    )
}
