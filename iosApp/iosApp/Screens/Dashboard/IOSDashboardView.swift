import SwiftUI

struct IOSDashboardView: View {
    let session: UserSessionIOS
    var onLogout: () -> Void

    @State private var activeSection: String = "Dashboard"

    var body: some View {
        IOSRootScaffold(
            activeSection: activeSection,
            onNavigateSection: { section in activeSection = section },
            userSession: session,
            onLogout: onLogout
        ) {
            switch activeSection {
            case "Dashboard", "Home":
                IOSDashboardMainContentView(session: session, onLogout: onLogout, onNavigateSection: { activeSection = $0 })
            case "Sales":
                IOSSalesScreen()
            case "Areas":
                IOSAreasContentView()
            case "Categories":
                IOSCategoriesContentView()
            case "Items":
                IOSItemsContentView()
            case "Transports":
                IOSTransportsContentView()
            case "Udhaari":
                IOSUdhaariContentView()
            case "Cheques":
                IOSChequesContentView()
            case "Customers":
                IOSCustomersContentView()
            case "Suppliers":
                IOSSuppliersContentView()
            case "Employees":
                IOSEmployeesContentView()
            case "Daag":
                IOSDaagContentView()
            case "Notepad", "Notes":
                IOSNotepadContentView()
            case "Reminders":
                IOSRemindersContentView()
            case "Expenses":
                IOSExpensesContentView()
            case "Supplier Ledger", "SupplierLedger":
                IOSSupplierLedgerContentView()
            case "Cash Book", "CashBook":
                IOSCashBookContentView()
            case "Profit & Loss", "ProfitAndLoss", "P&L":
                IOSProfitLossContentView()
            case "Aging Report", "AgingReport":
                IOSAgingReportContentView()
            case "Users", "UserManagement":
                IOSUserManagementContentView()
            case "Sign Out":
                Color.clear.onAppear { onLogout() }
            default:
                IOSPlaceholderView(title: "\(activeSection) Module")
            }
        }
    }
}

struct IOSDashboardMainContentView: View {
    let session: UserSessionIOS
    var onLogout: () -> Void
    var onNavigateSection: (String) -> Void = { _ in }

    @State private var totalBaki: Double = 0.0
    @State private var totalJama: Double = 0.0

    private let textPrimary = Color(red: 30/255, green: 41/255, blue: 59/255)
    private let textMuted = Color(red: 100/255, green: 116/255, blue: 139/255)
    private let bgLight = Color(red: 248/255, green: 250/255, blue: 252/255)
    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)
    private let errorRed = Color(red: 220/255, green: 38/255, blue: 38/255)

    func fetchDashboardTotals() {
        SupabaseIOSClient.shared.fetchTable(table: "customers") { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let items):
                    var bSum = 0.0
                    var jSum = 0.0
                    for item in items {
                        let rawBaki = (item["baki"] as? NSNumber)?.doubleValue ?? 0.0
                        if rawBaki > 0 {
                            bSum += rawBaki
                        } else if rawBaki < 0 {
                            jSum += abs(rawBaki)
                        }
                    }
                    self.totalBaki = bSum
                    self.totalJama = jSum
                case .failure:
                    self.totalBaki = 0.0
                    self.totalJama = 0.0
                }
            }
        }
    }

    var outstanding: Double {
        totalBaki - totalJama
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // SUMMARY CARDS (HORIZONTAL SCROLL)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        IOSSummaryCard(
                            title: "Total Baaki",
                            amount: "₹\(Int(totalBaki))",
                            change: "Receivable",
                            isPositive: false
                        )

                        IOSSummaryCard(
                            title: "Total Jama",
                            amount: "₹\(Int(totalJama))",
                            change: "Received",
                            isPositive: true
                        )

                        IOSSummaryCard(
                            title: "Outstanding",
                            amount: outstanding >= 0 ? "₹\(Int(outstanding)) Baaki" : "₹\(Int(-outstanding)) Jama",
                            change: "Net Balance",
                            isPositive: outstanding <= 0
                        )
                    }
                }
                .onAppear {
                    fetchDashboardTotals()
                }

                // QUICK ACTION GRID
                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        IOSQuickActionCard(
                            title: "+ Customer",
                            iconName: "person.badge.plus.fill",
                            bgColor: Color(red: 232/255, green: 245/255, blue: 233/255),
                            contentColor: Color(red: 46/255, green: 125/255, blue: 50/255),
                            action: { onNavigateSection("Customers") }
                        )
                        IOSQuickActionCard(
                            title: "+ Udhar",
                            iconName: "creditcard.fill",
                            bgColor: Color(red: 255/255, green: 235/255, blue: 238/255),
                            contentColor: Color(red: 198/255, green: 40/255, blue: 40/255),
                            action: { onNavigateSection("Udhaari") }
                        )
                    }

                    HStack(spacing: 12) {
                        IOSQuickActionCard(
                            title: "+ Jama",
                            iconName: "banknote.fill",
                            bgColor: Color(red: 232/255, green: 245/255, blue: 233/255),
                            contentColor: Color(red: 46/255, green: 125/255, blue: 50/255),
                            action: { onNavigateSection("Udhaari") }
                        )
                        IOSQuickActionCard(
                            title: "+ Daag",
                            iconName: "shippingbox.fill",
                            bgColor: Color(red: 227/255, green: 242/255, blue: 253/255),
                            contentColor: Color(red: 21/255, green: 101/255, blue: 192/255),
                            action: { onNavigateSection("Daag") }
                        )
                    }
                }

                // PINNED & URGENT NOTES
                VStack(alignment: .leading, spacing: 10) {
                    Text("Pinned & Urgent Notes")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)

                    IOSNoteCard(
                        title: "Call Ramesh regarding overdue Udhar",
                        dateTime: "Today, 2:00 PM",
                        accentColor: errorRed
                    )

                    IOSNoteCard(
                        title: "Verify supplier delivery",
                        dateTime: "Tomorrow",
                        accentColor: primaryBlue
                    )
                }

                // TOP BAKI (DEBTORS)
                VStack(spacing: 12) {
                    HStack {
                        Text("TOP BAKI (DEBTORS)")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(textPrimary)

                        Spacer()

                        Button(action: { onNavigateSection("Udhaari") }) {
                            Text("View All")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(primaryBlue)
                        }
                    }

                    Divider()

                    IOSDebtorRow(name: "Sharma Hardware", lastPaid: "Last paid: 12 days ago", amount: "₹ 45,000")
                    Divider()
                    IOSDebtorRow(name: "Vijay Kirana", lastPaid: "Last paid: 5 days ago", amount: "₹ 22,500")
                    Divider()
                    IOSDebtorRow(name: "Ramesh Textiles", lastPaid: "Last paid: 14 days ago", amount: "₹ 4,50,000")
                }
                .padding(16)
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
            }
            .padding(16)
        }
        .background(bgLight)
    }
}

struct IOSSummaryCard: View {
    let title: String
    let amount: String
    let change: String
    let isPositive: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(Color(red: 100/255, green: 116/255, blue: 139/255))

            Text(amount)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))

            HStack(spacing: 4) {
                Image(systemName: isPositive ? "chart.line.uptrend.xyaxis" : "chart.line.downtrend.xyaxis")
                    .font(.caption)
                    .foregroundColor(isPositive ? Color.green : Color.red)
                Text(change)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(isPositive ? Color.green : Color.red)
            }
        }
        .padding(16)
        .frame(width: 170, height: 115, alignment: .leading)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
    }
}

struct IOSQuickActionCard: View {
    let title: String
    let iconName: String
    let bgColor: Color
    let contentColor: Color
    var action: () -> Void = {}

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: iconName)
                    .font(.title2)
                    .foregroundColor(contentColor)
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(contentColor)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 95)
            .background(bgColor)
            .cornerRadius(16)
        }
    }
}

struct IOSNoteCard: View {
    let title: String
    let dateTime: String
    let accentColor: Color

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 2)
                .fill(accentColor)
                .frame(width: 4, height: 36)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                Text(dateTime)
                    .font(.caption)
                    .foregroundColor(Color(red: 100/255, green: 116/255, blue: 139/255))
            }

            Spacer()

            Image(systemName: "ellipsis")
                .foregroundColor(Color(red: 100/255, green: 116/255, blue: 139/255))
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

struct IOSDebtorRow: View {
    let name: String
    let lastPaid: String
    let amount: String

    var body: some View {
        HStack {
            ZStack {
                Circle()
                    .fill(Color(red: 226/255, green: 232/255, blue: 240/255))
                    .frame(width: 40, height: 40)
                Text(String(name.prefix(2)).uppercased())
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                Text(lastPaid)
                    .font(.caption)
                    .foregroundColor(Color(red: 100/255, green: 116/255, blue: 139/255))
            }

            Spacer()

            Text(amount)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(Color(red: 220/255, green: 38/255, blue: 38/255))
        }
    }
}
