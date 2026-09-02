package com.example.crm_app_kmp.sales

import kotlin.js.JsExport

@JsExport
data class ItemProduct(
    val id: String,
    val name: String,
    val sku: String,
    val category: String,
    val price: Double,
    val stockQuantity: Int
) {
    val priceFormatted: String get() = "₹${price.toInt()}"
    val stockStatus: String get() = when {
        stockQuantity <= 0 -> "OUT OF STOCK"
        stockQuantity <= 5 -> "LOW"
        else -> "IN STOCK"
    }
    val isOutOfStock: Boolean get() = stockQuantity <= 0
}

@JsExport
data class CustomerModel(
    val id: String,
    val name: String,
    val phone: String = "",
    val email: String = "",
    val area: String = ""
)

@JsExport
data class CartItem(
    val product: ItemProduct,
    var quantity: Int
) {
    val total: Double get() = product.price * quantity
    val totalFormatted: String get() = "₹${total.toInt()}"
}

@JsExport
data class SaleLineItem(
    val id: String,
    val itemId: String,
    val itemName: String,
    val quantity: Int,
    val unitPrice: Double,
    val total: Double
) {
    val unitPriceFormatted: String get() = "₹${unitPrice.toInt()}"
    val totalFormatted: String get() = "₹${total.toInt()}"
}

@JsExport
data class SaleTransaction(
    val id: String,
    val invoiceNumber: String,
    val customerId: String,
    val customerName: String,
    val saleDate: String,
    val subtotal: Double,
    val discount: Double,
    val tax: Double,
    val total: Double,
    val paymentMethod: String,
    val status: String,
    val items: List<SaleLineItem>
) {
    val totalFormatted: String get() = "₹${total.toInt()}"
}

@JsExport
data class SalesSummaryStats(
    val todaySalesFormatted: String,
    val todayCount: Int,
    val thisWeekSalesFormatted: String,
    val thisWeekChange: String,
    val thisMonthSalesFormatted: String,
    val thisMonthChange: String
)
