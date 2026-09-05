import SwiftUI

struct IOSProfitLossView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Profit & Loss",
            onNavigateSection: onNavigateSection
        ) {
            IOSProfitLossContentView()
        }
    }
}

struct IOSPLStatementItem: Identifiable {
    let id = UUID()
    var label: String
    var amount: Double
    var type: String // "INCOME", "COST", "NET"
    var isHighlight: Bool = false
}

struct IOSProfitLossContentView: View {
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var bgApp: Color {
        isDarkMode ? Color(red: 11/255, green: 18/255, blue: 32/255) : Color(red: 248/255, green: 250/255, blue: 252/255)
    }
    private var cardBg: Color {
        isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white
    }
    private var cardSecondaryBg: Color {
        isDarkMode ? Color(red: 30/255, green: 41/255, blue: 59/255) : Color(red: 241/255, green: 245/255, blue: 249/255)
    }
    private var textPrimary: Color {
        isDarkMode ? Color(red: 248/255, green: 250/255, blue: 252/255) : Color(red: 30/255, green: 41/255, blue: 59/255)
    }
    private var textMuted: Color {
        isDarkMode ? Color(red: 148/255, green: 163/255, blue: 184/255) : Color(red: 100/255, green: 116/255, blue: 139/255)
    }

    @State private var fromDate = "2026-08-01"
    @State private var toDate = "2026-09-30"
    @State private var toastMsg: String? = nil
    @State private var revenue: Double = 0.0
    @State private var purchases: Double = 0.0
    @State private var expenses: Double = 0.0
    @State private var salaries: Double = 0.0

    var expensesPlusSalaries: Double {
        expenses + salaries
    }

    var netProfit: Double {
        revenue - purchases - expenses - salaries
    }

    var isLoss: Bool {
        netProfit < 0
    }

    var statementItems: [IOSPLStatementItem] {
        [
            IOSPLStatementItem(label: "+ Revenue (Sales)", amount: revenue, type: "INCOME"),
            IOSPLStatementItem(label: "− Purchases / Cost", amount: purchases, type: "COST"),
            IOSPLStatementItem(label: "− Operating Expenses", amount: expenses, type: "COST"),
            IOSPLStatementItem(label: "− Employee / Labour Costs", amount: salaries, type: "COST"),
            IOSPLStatementItem(label: isLoss ? "= Net Loss" : "= Net Profit", amount: netProfit, type: "NET", isHighlight: true)
        ]
    }

    func formatINR(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencySymbol = "₹"
        formatter.locale = Locale(identifier: "en_IN")
        return formatter.string(from: NSNumber(value: amount)) ?? "₹\(Int(amount))"
    }

    func fetchRealData() {
        // 1. Fetch Sales (Revenue)
        SupabaseIOSClient.shared.fetchTable(table: "sales") { salesRes in
            var rSum = 0.0
            if case .success(let items) = salesRes {
                for item in items {
                    let amt = (item["grand_total"] as? Double) ?? (item["total_amount"] as? Double) ?? 0.0
                    rSum += amt
                }
            }

            // 2. Fetch Purchases (supplier_ledger)
            SupabaseIOSClient.shared.fetchTable(table: "supplier_ledger") { ledgerRes in
                var pSum = 0.0
                if case .success(let items) = ledgerRes {
                    for item in items {
                        let type = ((item["transaction_type"] as? String) ?? (item["type"] as? String) ?? "").lowercased()
                        if type == "purchase" || type == "bill" {
                            let amt = (item["amount"] as? Double) ?? 0.0
                            pSum += amt
                        }
                    }
                }

                // 3. Fetch Expenses
                SupabaseIOSClient.shared.fetchTable(table: "expenses") { expRes in
                    var eSum = 0.0
                    if case .success(let items) = expRes {
                        for item in items {
                            let cat = ((item["category"] as? String) ?? "").lowercased()
                            if !cat.contains("salary") && !cat.contains("labour") {
                                let amt = (item["amount"] as? Double) ?? 0.0
                                eSum += amt
                            }
                        }
                    }

                    // 4. Fetch Employee Transactions (Salaries)
                    SupabaseIOSClient.shared.fetchTable(table: "employee_transactions") { empRes in
                        var sSum = 0.0
                        if case .success(let items) = empRes {
                            for item in items {
                                let type = ((item["type"] as? String) ?? "").lowercased()
                                if type.contains("salary") || type.contains("bonus") || type.contains("gift") {
                                    let amt = (item["amount"] as? Double) ?? 0.0
                                    sSum += amt
                                }
                            }
                        }

                        DispatchQueue.main.async {
                            self.revenue = rSum
                            self.purchases = pSum
                            self.expenses = eSum
                            self.salaries = sSum
                        }
                    }
                }
            }
        }
    }

    var body: some View {
        ZStack {
            bgApp.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 14) {
                    // REPORT PERIOD CARD
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Report Period")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(textPrimary)

                        HStack(spacing: 8) {
                            TextField("FROM", text: $fromDate)
                                .font(.caption)
                                .foregroundColor(textPrimary)
                                .padding(8)
                                .background(cardSecondaryBg)
                                .cornerRadius(8)

                            TextField("TO", text: $toDate)
                                .font(.caption)
                                .foregroundColor(textPrimary)
                                .padding(8)
                                .background(cardSecondaryBg)
                                .cornerRadius(8)

                            Button(action: {
                                fetchRealData()
                                toastMsg = "P&L recalculated from Supabase"
                            }) {
                                Text("Show")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(8)
                            }
                        }

                        Text("Selected: \(fromDate) to \(toDate)")
                            .font(.caption2)
                            .foregroundColor(textMuted)
                    }
                    .padding(14)
                    .background(cardBg)
                    .cornerRadius(14)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)

                    if let msg = toastMsg {
                        Text("✓ \(msg)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(Color.green)
                            .padding(10)
                            .frame(maxWidth: .infinity)
                            .background(Color.green.opacity(0.15))
                            .cornerRadius(8)
                    }

                    // FOUR SUMMARY CARDS
                    VStack(spacing: 10) {
                        HStack(spacing: 10) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("REVENUE")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(textMuted)
                                Text(formatINR(revenue))
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(cardBg)
                            .cornerRadius(12)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("PURCHASES")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(textMuted)
                                Text(formatINR(purchases))
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.orange)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(cardBg)
                            .cornerRadius(12)
                        }

                        HStack(spacing: 10) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("EXPENSES + SALARIES")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(textMuted)
                                Text(formatINR(expensesPlusSalaries))
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.red)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(cardBg)
                            .cornerRadius(12)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(isLoss ? "NET LOSS" : "NET PROFIT")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(textMuted)
                                Text(formatINR(netProfit))
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(isLoss ? .red : .green)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(cardBg)
                            .cornerRadius(12)
                        }
                    }

                    // P&L STATEMENT CARD
                    VStack(alignment: .leading, spacing: 10) {
                        Text("P&L Statement")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(textPrimary)

                        Divider()

                        ForEach(statementItems) { item in
                            HStack {
                                Text(item.label)
                                    .font(item.isHighlight ? .subheadline : .caption)
                                    .fontWeight(item.isHighlight ? .bold : .semibold)
                                    .foregroundColor(textPrimary)
                                Spacer()
                                Text(formatINR(item.amount))
                                    .font(item.isHighlight ? .headline : .caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(item.type == "INCOME" ? .blue : item.type == "COST" ? .red : (isLoss ? .red : .green))
                            }
                            if item.isHighlight { Divider() }
                        }
                    }
                    .padding(14)
                    .background(cardBg)
                    .cornerRadius(14)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)

                    // COST VS PROFIT BREAKDOWN CARD
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Cost vs Profit Breakdown")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(textPrimary)

                        VStack(spacing: 8) {
                            HStack {
                                Text("Purchases")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                                Spacer()
                                Text(formatINR(purchases))
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(textPrimary)
                            }
                            ProgressView(value: purchases, total: max(1.0, revenue))
                                .accentColor(.blue)

                            HStack {
                                Text("Expenses")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.red)
                                Spacer()
                                Text(formatINR(expenses))
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(textPrimary)
                            }
                            ProgressView(value: expenses, total: max(1.0, revenue))
                                .accentColor(.red)

                            HStack {
                                Text("Salaries")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.orange)
                                Spacer()
                                Text(formatINR(salaries))
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(textPrimary)
                            }
                            ProgressView(value: salaries, total: max(1.0, revenue))
                                .accentColor(.orange)

                            HStack {
                                Text(isLoss ? "Net Loss" : "Net Profit")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(isLoss ? .red : .green)
                                Spacer()
                                Text(formatINR(netProfit))
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(textPrimary)
                            }
                            ProgressView(value: max(0, netProfit), total: max(1.0, revenue))
                                .accentColor(isLoss ? .red : .green)
                        }
                    }
                    .padding(14)
                    .background(cardBg)
                    .cornerRadius(14)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
            }
            .onAppear {
                fetchRealData()
            }
        }
    }
}

