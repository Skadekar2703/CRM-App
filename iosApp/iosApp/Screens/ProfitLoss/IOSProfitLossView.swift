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
    @State private var fromDate = "01/08/2026"
    @State private var toDate = "31/08/2026"
    @State private var toastMsg: String? = nil

    private val revenue: Double = 185000.0
    private val purchases: Double = 77000.0
    private val expenses: Double = 16050.0
    private val salaries: Double = 25000.0

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
            IOSPLStatementItem(label: "− Purchases", amount: purchases, type: "COST"),
            IOSPLStatementItem(label: "− Expenses", amount: expenses, type: "COST"),
            IOSPLStatementItem(label: "− Salaries (paid)", amount: salaries, type: "COST"),
            IOSPLStatementItem(label: "= Net Profit", amount: netProfit, type: "NET", isHighlight: true)
        ]
    }

    var body: some View {
        ZStack {
            Color(red: 248/255, green: 250/255, blue: 252/255).ignoresSafeArea()

            ScrollView {
                VStack(spacing: 14) {
                    // REPORT PERIOD CARD
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Report Period")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))

                        HStack(spacing: 8) {
                            TextField("FROM", text: $fromDate)
                                .font(.caption)
                                .padding(8)
                                .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                                .cornerRadius(8)

                            TextField("TO", text: $toDate)
                                .font(.caption)
                                .padding(8)
                                .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                                .cornerRadius(8)

                            Button(action: { toastMsg = "P&L Report updated" }) {
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
                            .foregroundColor(.gray)
                    }
                    .padding(14)
                    .background(Color.white)
                    .cornerRadius(14)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)

                    if let msg = toastMsg {
                        Text("✓ \(msg)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(Color.green)
                            .padding(10)
                            .frame(maxWidth: .infinity)
                            .background(Color(red: 240/255, green: 253/255, blue: 244/255))
                            .cornerRadius(8)
                    }

                    // FOUR SUMMARY CARDS
                    VStack(spacing: 10) {
                        HStack(spacing: 10) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("REVENUE")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.gray)
                                Text("₹\(Int(revenue))")
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.white)
                            .cornerRadius(12)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("PURCHASES")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.gray)
                                Text("₹\(Int(purchases))")
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.orange)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.white)
                            .cornerRadius(12)
                        }

                        HStack(spacing: 10) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("EXPENSES + SALARIES")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.gray)
                                Text("₹\(Int(expensesPlusSalaries))")
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.red)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.white)
                            .cornerRadius(12)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("NET PROFIT")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.gray)
                                Text("₹\(Int(netProfit))")
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(isLoss ? .red : .green)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.white)
                            .cornerRadius(12)
                        }
                    }

                    // P&L STATEMENT CARD
                    VStack(alignment: .leading, spacing: 10) {
                        Text("P&L Statement")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))

                        Divider()

                        ForEach(statementItems) { item in
                            HStack {
                                Text(item.label)
                                    .font(item.isHighlight ? .subheadline : .caption)
                                    .fontWeight(item.isHighlight ? .bold : .semibold)
                                    .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                                Spacer()
                                Text("₹\(Int(item.amount))")
                                    .font(item.isHighlight ? .headline : .caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(item.type == "INCOME" ? .blue : item.type == "COST" ? .red : (isLoss ? .red : .green))
                            }
                            if item.isHighlight { Divider() }
                        }
                    }
                    .padding(14)
                    .background(Color.white)
                    .cornerRadius(14)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)

                    // COST VS PROFIT BREAKDOWN CARD
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Cost vs Profit Breakdown")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))

                        VStack(spacing: 8) {
                            HStack {
                                Text("Purchases")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                                Spacer()
                                Text("₹\(Int(purchases))")
                                    .font(.caption)
                                    .fontWeight(.bold)
                            }
                            ProgressView(value: purchases, total: revenue)
                                .accentColor(.blue)

                            HStack {
                                Text("Expenses")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.red)
                                Spacer()
                                Text("₹\(Int(expenses))")
                                    .font(.caption)
                                    .fontWeight(.bold)
                            }
                            ProgressView(value: expenses, total: revenue)
                                .accentColor(.red)

                            HStack {
                                Text("Salaries")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.orange)
                                Spacer()
                                Text("₹\(Int(salaries))")
                                    .font(.caption)
                                    .fontWeight(.bold)
                            }
                            ProgressView(value: salaries, total: revenue)
                                .accentColor(.orange)

                            HStack {
                                Text("Net Profit")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.green)
                                Spacer()
                                Text("₹\(Int(netProfit))")
                                    .font(.caption)
                                    .fontWeight(.bold)
                            }
                            ProgressView(value: max(0, netProfit), total: revenue)
                                .accentColor(.green)
                        }
                    }
                    .padding(14)
                    .background(Color.white)
                    .cornerRadius(14)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
            }
        }
    }
}
