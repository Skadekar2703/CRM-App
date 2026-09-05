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
                if session.role.caseInsensitiveCompare("ADMIN") == .orderedSame {
                    IOSUserManagementContentView()
                } else {
                    IOSDashboardMainContentView(session: session, onLogout: onLogout, onNavigateSection: { activeSection = $0 })
                }
            case "Settings":
                IOSSettingsView()
            case "Sign Out":
                Color.clear.onAppear { onLogout() }
            default:
                IOSPlaceholderView(title: "\(activeSection) Module")
            }
        }
    }
}

struct IOSDebtorModel: Identifiable {
    let id: String
    let name: String
    let area: String
    let amount: Double
}

struct IOSTransactionModel: Identifiable {
    let id: String
    let customerName: String
    let type: String
    let amount: Double
    let dateStr: String
}

struct IOSNoteModel: Identifiable {
    let id: String
    let title: String
    let content: String
    let isUrgent: Bool
}

struct IOSReminderModel: Identifiable {
    let id: String
    let title: String
    let dueTime: String
}

struct IOSDashboardMainContentView: View {
    let session: UserSessionIOS
    var onLogout: () -> Void
    var onNavigateSection: (String) -> Void = { _ in }

    @AppStorage("crm_is_dark_mode") private var isDarkMode = false

    @State private var totalBaki: Double = 0.0
    @State private var totalJama: Double = 0.0
    @State private var todayUdhar: Double = 0.0
    @State private var todayJama: Double = 0.0
    @State private var pendingChequesCount: Int = 0
    @State private var urgentNotesCount: Int = 0
    @State private var daagMoveCount: Int = 0

    @State private var debtors: [IOSDebtorModel] = []
    @State private var transactions: [IOSTransactionModel] = []
    @State private var notes: [IOSNoteModel] = []
    @State private var reminders: [IOSReminderModel] = []

    @State private var isLoading = true
    @State private var errorMessage: String? = nil

    private var textPrimary: Color {
        isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255)
    }
    private var textMuted: Color {
        isDarkMode ? Color(red: 148/255, green: 163/255, blue: 184/255) : Color(red: 100/255, green: 116/255, blue: 139/255)
    }
    private var cardBg: Color {
        isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color.white
    }
    private var pageBg: Color {
        isDarkMode ? Color(red: 11/255, green: 15/255, blue: 25/255) : Color(red: 248/255, green: 250/255, blue: 252/255)
    }
    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)
    private let errorRed = Color(red: 220/255, green: 38/255, blue: 38/255)
    private let greenColor = Color(red: 22/255, green: 163/255, blue: 74/255)

    func fetchAllDashboardData() {
        isLoading = true
        errorMessage = nil

        let client = SupabaseIOSClient.shared

        // 1. Udhaari for Total Baki, Total Jama, Today's Udhaar, Today's Jama
        client.fetchTable(table: "udhaari") { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let items):
                    var bSum = 0.0
                    var jSum = 0.0
                    var uToday = 0.0
                    var jToday = 0.0
                    var txList: [IOSTransactionModel] = []
                    let todayStr = ISO8601DateFormatter().string(from: Date()).components(separatedBy: "T").first ?? ""

                    for item in items {
                        let type = item["type"] as? String ?? "Udhaar"
                        let amt = (item["amount"] as? NSNumber)?.doubleValue ?? 0.0
                        let cName = item["customer_name"] as? String ?? "Customer"
                        let rawDate = item["date"] as? String ?? ""
                        let datePart = rawDate.components(separatedBy: "T").first ?? ""
                        let id = "\(item["id"] ?? UUID().uuidString)"

                        if type == "Udhaar" || type == "Baki" {
                            bSum += amt
                            if datePart == todayStr {
                                uToday += amt
                            }
                        } else if type == "Jama" {
                            jSum += amt
                            if datePart == todayStr {
                                jToday += amt
                            }
                        }
                        txList.append(IOSTransactionModel(id: id, customerName: cName, type: type, amount: amt, dateStr: "Today"))
                    }
                    self.totalBaki = bSum
                    self.totalJama = jSum
                    self.todayUdhar = uToday
                    self.todayJama = jToday
                    self.transactions = Array(txList.prefix(5))
                    self.isLoading = false
                case .failure(let err):
                    self.errorMessage = err.localizedDescription
                    self.isLoading = false
                }
            }
        }

        // 2. Customers for Top Baki
        client.fetchTable(table: "customers") { result in
            DispatchQueue.main.async {
                if case .success(let items) = result {
                    var dList: [IOSDebtorModel] = []
                    for item in items {
                        let rawBaki = (item["baki"] as? NSNumber)?.doubleValue ?? 0.0
                        let name = item["name"] as? String ?? "Unnamed Customer"
                        let area = item["area"] as? String ?? "General Market"
                        let id = "\(item["id"] ?? UUID().uuidString)"

                        if rawBaki > 0 {
                            dList.append(IOSDebtorModel(id: id, name: name, area: area, amount: rawBaki))
                        }
                    }
                    dList.sort { $0.amount > $1.amount }
                    self.debtors = Array(dList.prefix(5))
                }
            }
        }

        // 3. Notes
        client.fetchTable(table: "notes") { result in
            DispatchQueue.main.async {
                if case .success(let items) = result {
                    var nList: [IOSNoteModel] = []
                    var uCount = 0
                    for item in items {
                        let title = item["title"] as? String ?? "Note"
                        let content = item["content"] as? String ?? ""
                        let priority = item["priority"] as? String ?? "Normal"
                        let isUrgent = priority == "High"
                        if isUrgent { uCount += 1 }
                        let id = "\(item["id"] ?? UUID().uuidString)"
                        nList.append(IOSNoteModel(id: id, title: title, content: content, isUrgent: isUrgent))
                    }
                    self.urgentNotesCount = uCount
                    self.notes = Array(nList.prefix(3))
                }
            }
        }

        // 4. Reminders
        client.fetchTable(table: "reminders") { result in
            DispatchQueue.main.async {
                if case .success(let items) = result {
                    var rList: [IOSReminderModel] = []
                    for item in items {
                        let title = item["title"] as? String ?? "Reminder"
                        let id = "\(item["id"] ?? UUID().uuidString)"
                        rList.append(IOSReminderModel(id: id, title: title, dueTime: "Today"))
                    }
                    self.reminders = Array(rList.prefix(3))
                }
            }
        }

        // 5. Cheques
        client.fetchTable(table: "cheques") { result in
            DispatchQueue.main.async {
                if case .success(let items) = result {
                    self.pendingChequesCount = items.count
                }
            }
        }

        // 6. Daag
        client.fetchTable(table: "daag") { result in
            DispatchQueue.main.async {
                if case .success(let items) = result {
                    self.daagMoveCount = items.count
                }
            }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // SYSTEM LIVE SYNC BAR
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("BUSINESS SNAPSHOT")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(textMuted)
                        Text("Real-time ledger overview")
                            .font(.caption2)
                            .foregroundColor(textMuted.opacity(0.8))
                    }
                    Spacer()
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 6, height: 6)
                        Text("Live Synced")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 21/255, green: 128/255, blue: 61/255))
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color(red: 220/255, green: 252/255, blue: 231/255))
                    .clipShape(Capsule())
                }

                // SUMMARY METRIC CARDS (7 CARDS REQUIRED IN EXACT ORDER)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        IOSMetricCard(title: "TOTAL BAKI", value: "₹\(Int(totalBaki))", sub: "Sum of all Baki", color: errorRed) { onNavigateSection("Customers") }
                        IOSMetricCard(title: "TOTAL JAMA", value: "₹\(Int(totalJama))", sub: "Sum of all Jama", color: greenColor) { onNavigateSection("Customers") }
                        IOSMetricCard(title: "TODAY'S UDHAAR", value: "₹\(Int(todayUdhar))", sub: "Given Today", color: primaryBlue) { onNavigateSection("Udhaari") }
                        IOSMetricCard(title: "TODAY'S JAMA", value: "₹\(Int(todayJama))", sub: "Received Today", color: greenColor) { onNavigateSection("Udhaari") }
                        IOSMetricCard(title: "CHEQUES", value: "\(pendingChequesCount)", sub: "Pending Clearance", color: Color.orange) { onNavigateSection("Cheques") }
                        IOSMetricCard(title: "URGENT NOTES", value: "\(urgentNotesCount)", sub: "Pinned Notes", color: errorRed) { onNavigateSection("Notepad") }
                        IOSMetricCard(title: "DAAG MOVE", value: "\(daagMoveCount)", sub: "Stock Records", color: primaryBlue) { onNavigateSection("Daag") }
                    }
                }

                // FOUR PRIMARY SHORTCUTS
                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        StitchShortcutTile(
                            title: "+ Customer",
                            sub: "Add new party",
                            bgColor: Color(red: 240/255, green: 253/255, blue: 244/255),
                            textColor: Color(red: 21/255, green: 128/255, blue: 61/255),
                            iconName: "person.badge.plus",
                            action: { onNavigateSection("Customers") }
                        )

                        StitchShortcutTile(
                            title: "+ Udhar",
                            sub: "Debit / Give credit",
                            bgColor: Color(red: 254/255, green: 242/255, blue: 242/255),
                            textColor: Color(red: 185/255, green: 28/255, blue: 28/255),
                            iconName: "plus",
                            action: { onNavigateSection("Udhaari") }
                        )
                    }

                    HStack(spacing: 12) {
                        StitchShortcutTile(
                            title: "+ Jama",
                            sub: "Credit / Receive payment",
                            bgColor: Color(red: 236/255, green: 253/255, blue: 245/255),
                            textColor: Color(red: 4/255, green: 120/255, blue: 87/255),
                            iconName: "banknote",
                            action: { onNavigateSection("Udhaari") }
                        )

                        StitchShortcutTile(
                            title: "+ Daag",
                            sub: "Record stock dispatch",
                            bgColor: Color(red: 239/255, green: 246/255, blue: 255/255),
                            textColor: Color(red: 29/255, green: 78/255, blue: 216/255),
                            iconName: "shippingbox",
                            action: { onNavigateSection("Daag") }
                        )
                    }
                }

                // TOP BAKI (DEBTORS)
                VStack(alignment: .leading, spacing: 10) {
                    IOSSectionHeader(title: "🤝 Top Baki (Debtors)") { onNavigateSection("Customers") }
                    if debtors.isEmpty {
                        IOSEmptyCard(title: "No active Baki records", sub: "All customer receivables are fully settled.")
                    } else {
                        ForEach(debtors) { d in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(d.name)
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(textPrimary)
                                    Text(d.area)
                                        .font(.caption)
                                        .foregroundColor(textMuted)
                                }
                                Spacer()
                                Text("₹\(Int(d.amount))")
                                    .font(.subheadline)
                                    .fontWeight(.heavy)
                                    .foregroundColor(errorRed)
                            }
                            .padding(12)
                            .background(cardBg)
                            .cornerRadius(12)
                        }
                    }
                }

                // PINNED & URGENT NOTES
                VStack(alignment: .leading, spacing: 10) {
                    IOSSectionHeader(title: "📌 Pinned & Urgent Notes") { onNavigateSection("Notepad") }
                    if notes.isEmpty {
                        IOSEmptyCard(title: "No notes available", sub: "Create notes in Notepad to pin urgent tasks here.")
                    } else {
                        ForEach(notes) { n in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(n.title)
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(textPrimary)
                                    if !n.content.isEmpty {
                                        Text(n.content)
                                            .font(.caption)
                                            .foregroundColor(textMuted)
                                    }
                                }
                                Spacer()
                            }
                            .padding(12)
                            .background(cardBg)
                            .cornerRadius(12)
                        }
                    }
                }

                // TODAY'S REMINDERS
                VStack(alignment: .leading, spacing: 10) {
                    IOSSectionHeader(title: "⏰ Today's Reminders") { onNavigateSection("Reminders") }
                    if reminders.isEmpty {
                        IOSEmptyCard(title: "No reminders today", sub: "You have no follow-up reminders scheduled for today.")
                    } else {
                        ForEach(reminders) { rem in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(rem.title)
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(textPrimary)
                                    Text(rem.dueTime)
                                        .font(.caption)
                                        .foregroundColor(textMuted)
                                }
                                Spacer()
                                Text("Scheduled")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(primaryBlue)
                            }
                            .padding(12)
                            .background(cardBg)
                            .cornerRadius(12)
                        }
                    }
                }

                // RECENT TRANSACTIONS
                VStack(alignment: .leading, spacing: 10) {
                    IOSSectionHeader(title: "📖 Recent Transactions") { onNavigateSection("Udhaari") }
                    if transactions.isEmpty {
                        IOSEmptyCard(title: "No recent transactions", sub: "No Jama or Udhar entries recorded yet.")
                    } else {
                        ForEach(transactions) { t in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(t.customerName)
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(textPrimary)
                                    Text("\(t.type) • \(t.dateStr)")
                                        .font(.caption)
                                        .foregroundColor(textMuted)
                                }
                                Spacer()
                                let isJama = t.type == "Jama"
                                Text(isJama ? "- ₹\(Int(t.amount))" : "+ ₹\(Int(t.amount))")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                    .foregroundColor(isJama ? greenColor : errorRed)
                            }
                            .padding(12)
                            .background(cardBg)
                            .cornerRadius(12)
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(pageBg)
        .onAppear {
            fetchAllDashboardData()
        }
    }
}

struct IOSMetricCard: View {
    let title: String
    let value: String
    let sub: String
    let color: Color
    var onClick: () -> Void

    @AppStorage("crm_is_dark_mode") private var isDarkMode = false

    private var cardBg: Color {
        isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color.white
    }

    var body: some View {
        Button(action: onClick) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(Color.gray)
                Text(value)
                    .font(.title3)
                    .fontWeight(.heavy)
                    .foregroundColor(color)
                Text(sub)
                    .font(.caption2)
                    .foregroundColor(Color.gray.opacity(0.8))
            }
            .padding(14)
            .frame(width: 140, alignment: .leading)
            .background(cardBg)
            .cornerRadius(14)
            .shadow(color: Color.black.opacity(0.04), radius: 2)
        }
    }
}

struct StitchShortcutTile: View {
    let title: String
    let sub: String
    let bgColor: Color
    let textColor: Color
    let iconName: String
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(textColor.opacity(0.15))
                        .frame(width: 40, height: 40)
                    Image(systemName: iconName)
                        .foregroundColor(textColor)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textColor)
                    Text(sub)
                        .font(.caption2)
                        .foregroundColor(textColor.opacity(0.8))
                }
                Spacer()
            }
            .padding(14)
            .frame(maxWidth: .infinity)
            .background(bgColor)
            .cornerRadius(16)
        }
    }
}

struct IOSSectionHeader: View {
    let title: String
    var onViewAll: () -> Void

    @AppStorage("crm_is_dark_mode") private var isDarkMode = false

    var body: some View {
        HStack {
            Text(title)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(isDarkMode ? .white : Color(red: 30/255, green: 41/255, blue: 59/255))
            Spacer()
            Button(action: onViewAll) {
                Text("View All →")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
            }
        }
    }
}

struct IOSEmptyCard: View {
    let title: String
    let sub: String

    @AppStorage("crm_is_dark_mode") private var isDarkMode = false

    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(isDarkMode ? .white : Color(red: 30/255, green: 41/255, blue: 59/255))
            Text(sub)
                .font(.caption)
                .foregroundColor(Color.gray)
        }
        .frame(maxWidth: .infinity)
        .padding(20)
        .background(isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color.white)
        .cornerRadius(12)
    }
}
