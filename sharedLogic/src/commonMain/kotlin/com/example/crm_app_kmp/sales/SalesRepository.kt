package com.example.crm_app_kmp.sales

import kotlin.js.JsExport

@JsExport
object SalesRepository {

    private val initialProducts = mutableListOf<ItemProduct>()
    private val initialCustomers = emptyList<CustomerModel>()
    private val initialSales = mutableListOf<SaleTransaction>()

    fun getProducts(): List<ItemProduct> = initialProducts.toList()

    fun getCustomers(): List<CustomerModel> = initialCustomers

    fun getSalesHistory(): List<SaleTransaction> = initialSales.toList()

    fun getSummaryStats(): SalesSummaryStats {
        val todayTotal = initialSales.filter { it.saleDate.startsWith("Today") }.sumOf { it.total }
        val todayCount = initialSales.count { it.saleDate.startsWith("Today") }
        val weekTotal = initialSales.sumOf { it.total } + 42000.0
        val monthTotal = weekTotal + 185000.0

        return SalesSummaryStats(
            todaySalesFormatted = "₹${todayTotal.toInt()}",
            todayCount = todayCount,
            thisWeekSalesFormatted = "₹${weekTotal.toInt()}",
            thisWeekChange = "+8.4%",
            thisMonthSalesFormatted = "₹${monthTotal.toInt()}",
            thisMonthChange = "+12.1%"
        )
    }

    fun completeSale(
        items: List<CartItem>,
        customer: CustomerModel,
        discount: Double,
        tax: Double,
        paymentMethod: String
    ): SaleTransaction {
        val subtotal = items.sumOf { it.total }
        val total = (subtotal - discount) + tax
        val invoiceNo = "INV-2026-00" + (initialSales.size + 1)

        val idSeed = (10000..99999).random()
        val lineItems = items.mapIndexed { index, cartItem ->
            SaleLineItem(
                id = "li_${idSeed}_$index",
                itemId = cartItem.product.id,
                itemName = cartItem.product.name,
                quantity = cartItem.quantity,
                unitPrice = cartItem.product.price,
                total = cartItem.total
            )
        }

        // Deduct inventory stock
        items.forEach { cartItem ->
            val idx = initialProducts.indexOfFirst { it.id == cartItem.product.id }
            if (idx >= 0) {
                val current = initialProducts[idx]
                val newStock = (current.stockQuantity - cartItem.quantity).coerceAtLeast(0)
                initialProducts[idx] = current.copy(stockQuantity = newStock)
            }
        }

        val newTransaction = SaleTransaction(
            id = "s_$idSeed",
            invoiceNumber = invoiceNo,
            customerId = customer.id,
            customerName = customer.name,
            saleDate = "Today, Just now",
            subtotal = subtotal,
            discount = discount,
            tax = tax,
            total = total,
            paymentMethod = paymentMethod,
            status = "Completed",
            items = lineItems
        )

        initialSales.add(0, newTransaction)
        return newTransaction
    }

    fun addCustomProduct(name: String, price: Double, category: String = "General"): ItemProduct {
        val newProduct = ItemProduct(
            id = "custom_${(10000..99999).random()}",
            name = name,
            sku = "CUST-${(100..999).random()}",
            category = category,
            price = price,
            stockQuantity = 99
        )
        initialProducts.add(0, newProduct)
        return newProduct
    }
}
