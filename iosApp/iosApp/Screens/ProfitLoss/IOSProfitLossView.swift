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

    private static var initialFirstOfMonth: String {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-01"
        return fmt.string(from: Date())
    }

    private static var initialToday: String {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        return fmt.string(from: Date())
    }

    @State private var fromDate = initialFirstOfMonth
    @State private var toDate = initialToday
    @State private var startDateObj = Calendar.current.date(from: Calendar.current.dateComponents([.year, .month], from: Date())) ?? Date()
    @State private var endDateObj = Date()
    @State private var toastMsg: String? = nil
    @State private var udhaari: Double = 0.0
    @State private var jama: Double = 0.0
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

    func calculateAttributableSalary(employees: [[String: Any]], fromDateStr: String, toDateStr: String) -> Double {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        guard let repStart = fmt.date(from: fromDateStr),
              let repEnd = fmt.date(from: toDateStr) else { return 0.0 }

        var total = 0.0
        for emp in employees {
            let status = ((emp["status"] as? String) ?? "active").lowercased()
            if status == "inactive" { continue }

            let salary = (emp["salary"] as? Double) ?? (emp["monthly_salary"] as? Double) ?? 0.0
            if salary <= 0 { continue }

            let salaryType = ((emp["salary_type"] as? String) ?? "Monthly").lowercased()

            var empStart = repStart
            if let jStr = emp["joined_on"] as? String, !jStr.isEmpty {
                let prefix = String(jStr.prefix(10))
                if let jd = fmt.date(from: prefix) {
                    empStart = jd
                }
            }

            var empEnd: Date? = nil
            if let lStr = emp["left_on"] as? String, !lStr.isEmpty {
                let prefix = String(lStr.prefix(10))
                if let ld = fmt.date(from: prefix) {
                    empEnd = ld
                }
            }

            let effStart = max(repStart, empStart)
            let effEnd = empEnd != nil ? min(repEnd, empEnd!) : repEnd

            if effStart <= effEnd {
                let days = Double(Calendar.current.dateComponents([.day], from: effStart, to: effEnd).day ?? 0) + 1.0
                if days > 0 {
                    if salaryType.contains("day") || salaryType.contains("daily") {
                        total += salary * days
                    } else {
                        total += (salary / 30.0) * days
                    }
                }
            }
        }
        return total
    }

    func fetchRealData() {
        // 1. Fetch Sales (Revenue)
        SupabaseIOSClient.shared.fetchTable(table: "sales") { salesRes in
            var rSum = 0.0
            if case .success(let items) = salesRes {
                for item in items {
                    let status = ((item["status"] as? String) ?? "").lowercased()
                    if status == "cancelled" { continue }

                    let dtStr = String(((item["sale_date"] as? String) ?? (item["date"] as? String) ?? (item["created_at"] as? String) ?? "").prefix(10))
                    if dtStr.isEmpty || (dtStr >= self.fromDate && dtStr <= self.toDate) {
                        let amt = (item["total"] as? Double) ?? (item["grand_total"] as? Double) ?? (item["total_amount"] as? Double) ?? (item["subtotal"] as? Double) ?? 0.0
                        rSum += amt
                    }
                }
            }

            // 2. Fetch Purchases (supplier_ledger)
            SupabaseIOSClient.shared.fetchTable(table: "supplier_ledger") { ledgerRes in
                var pSum = 0.0
                if case .success(let items) = ledgerRes {
                    for item in items {
                        let dtStr = String(((item["date"] as? String) ?? (item["created_at"] as? String) ?? "").prefix(10))
                        if dtStr.isEmpty || (dtStr >= self.fromDate && dtStr <= self.toDate) {
                            let type = ((item["transaction_type"] as? String) ?? (item["type"] as? String) ?? "").lowercased()
                            if type == "purchase" || type == "bill" || type == "debit" {
                                let amt = (item["amount"] as? Double) ?? 0.0
                                pSum += amt
                            }
                        }
                    }
                }

                // 3. Fetch Expenses
                SupabaseIOSClient.shared.fetchTable(table: "expenses") { expRes in
                    var eSum = 0.0
                    if case .success(let items) = expRes {
                        for item in items {
                            let dtStr = String(((item["expense_date"] as? String) ?? (item["date"] as? String) ?? (item["created_at"] as? String) ?? "").prefix(10))
                            if dtStr.isEmpty || (dtStr >= self.fromDate && dtStr <= self.toDate) {
                                let cat = ((item["category"] as? String) ?? "").lowercased()
                                if !cat.contains("salary") && !cat.contains("labour") && !cat.contains("labor") {
                                    let amt = (item["amount"] as? Double) ?? 0.0
                                    eSum += amt
                                }
                            }
                        }
                    }

                    // 4. Fetch Employees (Base Salary Cost) & Employee Transactions
                    SupabaseIOSClient.shared.fetchTable(table: "employees") { empListRes in
                        var baseSalarySum = 0.0
                        if case .success(let emps) = empListRes {
                            baseSalarySum = self.calculateAttributableSalary(employees: emps, fromDateStr: self.fromDate, toDateStr: self.toDate)
                        }

                        SupabaseIOSClient.shared.fetchTable(table: "employee_transactions") { empRes in
                            var sSum = baseSalarySum
                            if case .success(let items) = empRes {
                                for item in items {
                                    let dtStr = String(((item["date"] as? String) ?? (item["created_at"] as? String) ?? "").prefix(10))
                                    if dtStr.isEmpty || (dtStr >= self.fromDate && dtStr <= self.toDate) {
                                        let type = ((item["type"] as? String) ?? "").lowercased()
                                        if type.contains("salary") || type.contains("bonus") || type.contains("gift") || type.contains("payment") || type.contains("labour") || type.contains("labor") || type.contains("extra") {
                                            let amt = (item["amount"] as? Double) ?? 0.0
                                            sSum += amt
                                        }
                                    }
                                }
                            }

                            // 5. Fetch Udhaari & Jama
                            SupabaseIOSClient.shared.fetchTable(table: "udhaari") { udhaariRes in
                                var uSum = 0.0
                                var jSum = 0.0
                                if case .success(let items) = udhaariRes {
                                    for item in items {
                                        let dtStr = String(((item["date"] as? String) ?? (item["created_at"] as? String) ?? "").prefix(10))
                                        if dtStr.isEmpty || (dtStr >= self.fromDate && dtStr <= self.toDate) {
                                            let type = ((item["type"] as? String) ?? "").lowercased()
                                            let amt = (item["amount"] as? Double) ?? 0.0
                                            if type == "baki" || type == "udhaar" || type == "debit" || type.contains("baki") || type.contains("udhaar") {
                                                uSum += amt
                                            } else if type == "jama" || type == "payment" || type == "credit" || type.contains("jama") || type.contains("payment") {
                                                jSum += amt
                                            }
                                        }
                                    }
                                }

                                DispatchQueue.main.async {
                                    self.revenue = rSum
                                    self.purchases = pSum
                                    self.expenses = eSum
                                    self.salaries = sSum
                                    self.udhaari = uSum
                                    self.jama = jSum
                                }
                            }
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
                            DatePicker("", selection: $startDateObj, displayedComponents: .date)
                                .labelsHidden()
                                .padding(4)
                                .background(cardSecondaryBg)
                                .cornerRadius(8)

                            Text("to")
                                .font(.caption)
                                .foregroundColor(textMuted)

                            DatePicker("", selection: $endDateObj, displayedComponents: .date)
                                .labelsHidden()
                                .padding(4)
                                .background(cardSecondaryBg)
                                .cornerRadius(8)

                            Spacer()

                            Button(action: {
                                let fmt = DateFormatter()
                                fmt.dateFormat = "yyyy-MM-dd"
                                fromDate = fmt.string(from: startDateObj)
                                toDate = fmt.string(from: endDateObj)
                                fetchRealData()
                                toastMsg = "P&L recalculated for \(fromDate) to \(toDate)"
                            }) {
                                Text("Recalculate")
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
                            // CARD 1: UDHAARI
                            VStack(alignment: .leading, spacing: 2) {
                                Text("UDHAARI")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(textMuted)
                                Text(formatINR(udhaari))
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.red)
                                Text("Customer credit / Baki")
                                    .font(.system(size: 10))
                                    .foregroundColor(textMuted)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(cardBg)
                            .cornerRadius(12)

                            // CARD 2: JAMA
                            VStack(alignment: .leading, spacing: 2) {
                                Text("JAMA")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(textMuted)
                                Text(formatINR(jama))
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.green)
                                Text("Payments received")
                                    .font(.system(size: 10))
                                    .foregroundColor(textMuted)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(cardBg)
                            .cornerRadius(12)
                        }

                        HStack(spacing: 10) {
                            // CARD 3: SALARIES
                            VStack(alignment: .leading, spacing: 2) {
                                Text("SALARIES")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(textMuted)
                                Text(formatINR(salaries))
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.orange)
                                Text("Employee / labour cost")
                                    .font(.system(size: 10))
                                    .foregroundColor(textMuted)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(cardBg)
                            .cornerRadius(12)

                            // CARD 4: NET PROFIT
                            VStack(alignment: .leading, spacing: 2) {
                                Text(isLoss ? "NET LOSS" : "NET PROFIT")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(textMuted)
                                Text(formatINR(netProfit))
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(isLoss ? .red : .green)
                                Text("Revenue − all costs")
                                    .font(.system(size: 10))
                                    .foregroundColor(textMuted)
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
                                Text("Operating Expenses")
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
                                Text("Employee / Labour")
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

