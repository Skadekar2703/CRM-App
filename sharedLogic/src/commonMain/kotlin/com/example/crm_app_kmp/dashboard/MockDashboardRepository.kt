package com.example.crm_app_kmp.dashboard

import kotlin.js.JsExport

@JsExport
object MockDashboardRepository {

    fun getSummary(): DashboardSummary {
        return DashboardSummary(
            totalBakiFormatted = "₹1.2M",
            totalBakiChange = "+5% this week",
            isTotalBakiPositive = true,
            cashInHandFormatted = "₹ 85,200",
            cashInHandChange = "-1.1%",
            isCashInHandPositive = false,
            todayUdharFormatted = "₹45K",
            todayUdharTransactions = 24,
            todayCollectionsFormatted = "₹82K",
            todayCollectionsBadge = "Good pace",
            chequesCount = 12,
            chequesPending = 3,
            urgentNotesCount = 5,
            daagMoveCount = 148
        )
    }

    fun getDebtors(): List<DebtorItem> {
        return listOf(
            DebtorItem(
                id = "1",
                customerName = "Ramesh Textiles",
                area = "South Market",
                amountFormatted = "₹4,50,000",
                status = "Overdue",
                lastPaidInfo = "Last paid: 14 days ago",
                phone = "+91 98765 43210"
            ),
            DebtorItem(
                id = "2",
                customerName = "Sharma Traders",
                area = "West Zone",
                amountFormatted = "₹3,20,000",
                status = "Pending",
                lastPaidInfo = "Last paid: 12 days ago",
                phone = "+91 98123 45678"
            ),
            DebtorItem(
                id = "3",
                customerName = "Gupta Enterprises",
                area = "Central Plaza",
                amountFormatted = "₹1,85,000",
                status = "Overdue",
                lastPaidInfo = "Last paid: 20 days ago",
                phone = "+91 97654 32109"
            ),
            DebtorItem(
                id = "4",
                customerName = "Vijay Kirana",
                area = "North Market",
                amountFormatted = "₹45,000",
                status = "Pending",
                lastPaidInfo = "Last paid: 5 days ago",
                phone = "+91 99887 76655"
            )
        )
    }

    fun getUrgentNotes(): List<UrgentNote> {
        return listOf(
            UrgentNote(
                id = "n1",
                title = "Call Supplier A",
                description = "Discuss pending fabric delivery for order #1042.",
                dateTimeInfo = "10:30 AM",
                priority = "HIGH"
            ),
            UrgentNote(
                id = "n2",
                title = "Bank Visit",
                description = "Deposit 5 clearance cheques before 2 PM.",
                dateTimeInfo = "Today",
                priority = "MEDIUM"
            ),
            UrgentNote(
                id = "n3",
                title = "Staff Meeting",
                description = "Weekly target review with sales team.",
                dateTimeInfo = "Tomorrow",
                priority = "LOW"
            )
        )
    }

    fun getRiskyPayments(): List<RiskyPaymentItem> {
        return listOf(
            RiskyPaymentItem(
                id = "r1",
                customerName = "Verma Logistics",
                riskLevel = "High Risk",
                reason = "Cheque bounced twice. Last contact: 5 days ago.",
                amountFormatted = "₹85,000",
                lastContactInfo = "5 days ago"
            ),
            RiskyPaymentItem(
                id = "r2",
                customerName = "Nidhi Garments",
                riskLevel = "Medium Risk",
                reason = "Promised payment delayed by 2 weeks.",
                amountFormatted = "₹42,000",
                lastContactInfo = "2 weeks ago"
            )
        )
    }
}
