package com.example.crm_app_kmp.navigation

import kotlin.js.JsExport

@JsExport
data class CrmMenuItem(
    val id: String,
    val label: String
)

@JsExport
object CrmNavigationMenu {
    val items: List<CrmMenuItem> = listOf(
        CrmMenuItem("Dashboard", "Dashboard"),
        CrmMenuItem("Sales", "Sales"),
        CrmMenuItem("Areas", "Areas"),
        CrmMenuItem("Categories", "Categories"),
        CrmMenuItem("Items", "Items"),
        CrmMenuItem("Transports", "Transports"),
        CrmMenuItem("Udhaari", "Udhaari"),
        CrmMenuItem("Cheques", "Cheques"),
        CrmMenuItem("Customers", "Customers"),
        CrmMenuItem("Suppliers", "Suppliers"),
        CrmMenuItem("Employees", "Employees"),
        CrmMenuItem("Daag", "Daag"),
        CrmMenuItem("Notepad", "Notepad"),
        CrmMenuItem("Reminders", "Reminders"),
        CrmMenuItem("Expenses", "Expenses"),
        CrmMenuItem("Supplier Ledger", "Supplier Ledger"),
        CrmMenuItem("Cash Book", "Cash Book"),
        CrmMenuItem("Profit & Loss", "Profit & Loss"),
        CrmMenuItem("Aging Report", "Aging Report"),
        CrmMenuItem("Users", "Users"),
        CrmMenuItem("Settings", "Settings"),
        CrmMenuItem("Sign Out", "Logout")
    )
}
