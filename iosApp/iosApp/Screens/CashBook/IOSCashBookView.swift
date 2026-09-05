import SwiftUI

struct IOSCashBookView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Cash Book",
            onNavigateSection: onNavigateSection
        ) {
            IOSCashBookContentView()
        }
    }
}

struct IOSCashBookEntryItem: Identifiable {
    let id: String
    var date: String
    var particulars: String
    var type: String // "IN" or "OUT"
    var amount: Double
    var runningBalance: Double
    var sourceModule: String
}

struct IOSCashBookContentView: View {
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }
    private var bgApp: Color { isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color(red: 248/255, green: 250/255, blue: 252/255) }
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 15/255, green: 23/255, blue: 42/255) }

    @State private var fromDate = "01 Aug 2026"
    @State private var toDate = "31 Aug 2026"
    @State private var searchQuery = ""
    @State private var showFormSheet = false
    @State private var toastMsg: String? = nil

    @State private var entries: [IOSCashBookEntryItem] = [
        IOSCashBookEntryItem(
            id: "CB-101",
            date: "01 Aug 2026",
            particulars: "Opening Cash Balance",
            type: "IN",
            amount: 50000.0,
            runningBalance: 50000.0,
            sourceModule: "System"
        ),
        IOSCashBookEntryItem(
            id: "CB-102",
            date: "05 Aug 2026",
            particulars: "Cash Sale - Invoice #INV-8812 (Metro Store)",
            type: "IN",
            amount: 18500.0,
            runningBalance: 68500.0,
            sourceModule: "Sales"
        ),
        IOSCashBookEntryItem(
            id: "CB-103",
            date: "08 Aug 2026",
            particulars: "Office Rent Expense (Aug 2026)",
            type: "OUT",
            amount: 12000.0,
            runningBalance: 56500.0,
            sourceModule: "Expenses"
        ),
        IOSCashBookEntryItem(
            id: "CB-104",
            date: "12 Aug 2026",
            particulars: "Supplier Payment to Sharma Wholesale (RTGS)",
            type: "OUT",
            amount: 20000.0,
            runningBalance: 36500.0,
            sourceModule: "Supplier Ledger"
        ),
        IOSCashBookEntryItem(
            id: "CB-105",
            date: "15 Aug 2026",
            particulars: "Udhaari Recovery from Royal Traders",
            type: "IN",
            amount: 8500.0,
            runningBalance: 45000.0,
            sourceModule: "Udhaari"
        ),
        IOSCashBookEntryItem(
            id: "CB-106",
            date: "18 Aug 2026",
            particulars: "Staff Daily Tea & Refreshment Expenses",
            type: "OUT",
            amount: 650.0,
            runningBalance: 44350.0,
            sourceModule: "Expenses"
        ),
        IOSCashBookEntryItem(
            id: "CB-107",
            date: "22 Aug 2026",
            particulars: "Cash Sale - Invoice #INV-8840 (Apex Logistics)",
            type: "IN",
            amount: 24000.0,
            runningBalance: 68350.0,
            sourceModule: "Sales"
        ),
        IOSCashBookEntryItem(
            id: "CB-108",
            date: "25 Aug 2026",
            particulars: "Electricity & Utility Bill Payment",
            type: "OUT",
            amount: 3400.0,
            runningBalance: 64950.0,
            sourceModule: "Expenses"
        ),
        IOSCashBookEntryItem(
            id: "CB-109",
            date: "29 Aug 2026",
            particulars: "Customer Payment Received - Cheque Clearance",
            type: "IN",
            amount: 15000.0,
            runningBalance: 79950.0,
            sourceModule: "Cheques"
        )
    ]

    var filteredEntries: [IOSCashBookEntryItem] {
        let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        if q.isEmpty { return entries }
        return entries.filter { $0.particulars.lowercased().contains(q) || $0.sourceModule.lowercased().contains(q) }
    }

    var totalIn: Double {
        filteredEntries.filter { $0.type == "IN" }.reduce(0) { $0 + $1.amount }
    }

    var totalOut: Double {
        filteredEntries.filter { $0.type == "OUT" }.reduce(0) { $0 + $1.amount }
    }

    var netCash: Double {
        totalIn - totalOut
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            bgApp.ignoresSafeArea()

            VStack(spacing: 14) {
                // SUMMARY CARDS ROW
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("TOTAL IN")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("₹\(Int(totalIn))")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(cardBg)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("TOTAL OUT")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("₹\(Int(totalOut))")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(cardBg)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("NET CASH")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("₹\(Int(netCash))")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(cardBg)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // DATE RANGE ROW
                HStack(spacing: 8) {
                    TextField("FROM", text: $fromDate)
                        .font(.caption)
                        .padding(8)
                        .background(cardBg)
                        .cornerRadius(8)

                    TextField("TO", text: $toDate)
                        .font(.caption)
                        .padding(8)
                        .background(cardBg)
                        .cornerRadius(8)

                    Button(action: { toastMsg = "Date range updated" }) {
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
                .padding(.horizontal, 16)

                // SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search particulars...", text: $searchQuery)
                    if !searchQuery.isEmpty {
                        Button(action: { searchQuery = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding(10)
                .background(cardBg)
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                .padding(.horizontal, 16)

                if let msg = toastMsg {
                    Text("✓ \(msg)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(Color.green)
                        .padding(10)
                        .frame(maxWidth: .infinity)
                        .background(Color(red: 240/255, green: 253/255, blue: 244/255))
                        .cornerRadius(8)
                        .padding(.horizontal, 16)
                }

                // DAY BOOK TRANSACTIONS
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(filteredEntries) { entry in
                            IOSCashBookCard(entry: entry)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 80)
                }
            }

            // FAB ADD BUTTON
            Button(action: { showFormSheet = true }) {
                Image(systemName: "plus")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(Color.blue)
                    .clipShape(Circle())
                    .shadow(radius: 4)
            }
            .padding(20)
        }
        .sheet(isPresented: $showFormSheet) {
            IOSCashBookFormSheet(
                onSave: { date, particulars, type, amount, source in
                    let lastBal = entries.last?.runningBalance ?? 0.0
                    let newBal = type == "IN" ? lastBal + amount : lastBal - amount
                    let newE = IOSCashBookEntryItem(
                        id: "CB-\(100 + entries.count + 1)",
                        date: date,
                        particulars: particulars,
                        type: type,
                        amount: amount,
                        runningBalance: newBal,
                        sourceModule: source
                    )
                    entries.append(newE)
                    toastMsg = "Cash transaction recorded"
                    showFormSheet = false
                }
            )
        }
    }
}

struct IOSCashBookCard: View {
    let entry: IOSCashBookEntryItem
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255) }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(entry.date)
                    .font(.caption)
                    .foregroundColor(.gray)
                Spacer()
                Text(entry.type)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(entry.type == "IN" ? Color.green.opacity(0.12) : Color.red.opacity(0.12))
                    .foregroundColor(entry.type == "IN" ? .green : .red)
                    .cornerRadius(6)
            }

            Text(entry.particulars)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(textPrimary)

            Text("Source: \(entry.sourceModule)")
                .font(.caption2)
                .foregroundColor(.gray)

            Divider()

            HStack {
                HStack(spacing: 4) {
                    Text(entry.type == "IN" ? "In: " : "Out: ")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text("₹\(Int(entry.amount))")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(entry.type == "IN" ? .green : .red)
                }

                Spacer()

                HStack(spacing: 4) {
                    Text("Balance: ")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text("₹\(Int(entry.runningBalance))")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                }
            }
        }
        .padding(14)
        .background(cardBg)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

struct IOSCashBookFormSheet: View {
    var onSave: (String, String, String, Double, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var date = "29 Aug 2026"
    @State private var particulars = ""
    @State private var type = "IN"
    @State private var amount = ""
    @State private var sourceModule = "Manual"

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Transaction Details")) {
                    TextField("Date *", text: $date)

                    Picker("Direction *", selection: $type) {
                        Text("Cash IN").tag("IN")
                        Text("Cash OUT").tag("OUT")
                    }

                    TextField("Amount (₹) *", text: $amount)
                        .keyboardType(.decimalPad)

                    TextField("Source Module", text: $sourceModule)

                    TextEditor(text: $particulars)
                        .frame(minHeight: 80)
                }
            }
            .navigationTitle("Add Cash Entry")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    let amt = Double(amount) ?? 0.0
                    onSave(date, particulars, type, amt, sourceModule)
                }.disabled(date.trimmingCharacters(in: .whitespaces).isEmpty || particulars.trimmingCharacters(in: .whitespaces).isEmpty || (Double(amount) ?? 0) <= 0)
            )
        }
    }
}
