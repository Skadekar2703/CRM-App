import SwiftUI

struct IOSCustomersView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Customers",
            onNavigateSection: onNavigateSection
        ) {
            IOSCustomersContentView()
        }
    }
}

struct IOSCustomerItem: Identifiable {
    let id: String
    var name: String
    var area: String
    var mobile: String
    var category: String
    var cibilScore: Int
    var cibilStatus: String
    var creditLimit: Double
    var currentBalance: Double
    var balanceType: String
    var status: String
    var transactions: [IOSCustomerTxn]

    var isWarning: Bool {
        return cibilStatus.caseInsensitiveCompare("Bad") == .orderedSame || cibilStatus.caseInsensitiveCompare("Warning") == .orderedSame || cibilScore < 650
    }
}

struct IOSCustomerTxn: Identifiable {
    let id: String
    let date: String
    let type: String
    let amount: Double
    let notes: String
}

struct IOSCustomersContentView: View {
    @State private var customers: [IOSCustomerItem] = []

    @State private var searchQuery = ""
    @State private var selectedFilterChip = "All"
    @State private var showFormSheet = false
    @State private var editingCustomer: IOSCustomerItem? = nil
    @State private var historyCustomer: IOSCustomerItem? = nil
    @State private var toastMsg: String? = nil

    var filteredCustomers: [IOSCustomerItem] {
        customers.filter { c in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            let matchesQuery = q.isEmpty || c.id.lowercased().contains(q) || c.name.lowercased().contains(q) || c.mobile.lowercased().contains(q) || c.area.lowercased().contains(q)

            let matchesChip: Bool
            switch selectedFilterChip {
            case "Active":
                matchesChip = c.status.caseInsensitiveCompare("Active") == .orderedSame
            case "Warning/Bad":
                matchesChip = c.isWarning
            case "VIP":
                matchesChip = c.category.caseInsensitiveCompare("VIP") == .orderedSame
            case "Regular":
                matchesChip = c.category.caseInsensitiveCompare("Regular") == .orderedSame
            case "Wholesale":
                matchesChip = c.category.caseInsensitiveCompare("Wholesale") == .orderedSame
            default:
                matchesChip = true
            }

            return matchesQuery && matchesChip
        }
    }

    var totalBaki: Double {
        customers.filter { $0.balanceType == "Baki" }.reduce(0) { $0 + $1.currentBalance }
    }

    var totalJama: Double {
        customers.filter { $0.balanceType == "Jama" }.reduce(0) { $0 + $1.currentBalance }
    }

    var activeCount: Int {
        customers.filter { $0.status == "Active" }.count
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Color(red: 248/255, green: 250/255, blue: 252/255).ignoresSafeArea()

            VStack(spacing: 12) {
                // TOP SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search customers...", text: $searchQuery)
                    if !searchQuery.isEmpty {
                        Button(action: { searchQuery = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding(10)
                .background(Color.white)
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // SUMMARY CARDS (HORIZONTAL SCROLL)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        IOSCustomerSummaryCard(
                            title: "Total Customers",
                            value: "\(customers.count)",
                            subText: "Registered",
                            accentColor: Color.blue
                        )
                        IOSCustomerSummaryCard(
                            title: "Active Customers",
                            value: "\(activeCount)",
                            subText: "In Good Standing",
                            accentColor: Color.green
                        )
                        IOSCustomerSummaryCard(
                            title: "Total Baaki",
                            value: "₹\(Int(totalBaki))",
                            subText: "Outstanding Credit",
                            accentColor: Color.red
                        )
                        IOSCustomerSummaryCard(
                            title: "Total Jama",
                            value: "₹\(Int(totalJama))",
                            subText: "Advance Received",
                            accentColor: Color.green
                        )
                    }
                    .padding(.horizontal, 16)
                }

                // FILTER CHIPS
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(["All", "Active", "Warning/Bad", "VIP", "Regular", "Wholesale"], id: \.self) { chip in
                            let isSelected = selectedFilterChip == chip
                            Button(action: { selectedFilterChip = chip }) {
                                Text(chip)
                                    .font(.caption)
                                    .fontWeight(isSelected ? .bold : .medium)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(isSelected ? Color.blue : Color.white)
                                    .foregroundColor(isSelected ? .white : Color(red: 30/255, green: 41/255, blue: 59/255))
                                    .cornerRadius(20)
                                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(isSelected ? Color.blue : Color(red: 203/255, green: 213/255, blue: 225/255), lineWidth: 1))
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                }

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

                // CUSTOMERS LIST
                ScrollView {
                    LazyVStack(spacing: 14) {
                        ForEach(filteredCustomers) { customer in
                            IOSCustomerCard(
                                customer: customer,
                                onCall: {
                                    if let url = URL(string: "tel://\(customer.mobile)") {
                                        UIApplication.shared.open(url)
                                    }
                                },
                                onMessage: {
                                    if let url = URL(string: "sms://\(customer.mobile)") {
                                        UIApplication.shared.open(url)
                                    }
                                },
                                onEdit: {
                                    editingCustomer = customer
                                    showFormSheet = true
                                },
                                onHistory: {
                                    historyCustomer = customer
                                }
                            )
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 80)
                }
            }

            // FAB ADD BUTTON
            Button(action: {
                editingCustomer = nil
                showFormSheet = true
            }) {
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
            IOSCustomerFormSheet(
                customer: editingCustomer,
                onSave: { name, mobile, area, category, cibilScore, creditLimit, balanceType, initialBalance in
                    if let target = editingCustomer, let idx = customers.firstIndex(where: { $0.id == target.id }) {
                        customers[idx].name = name
                        customers[idx].mobile = mobile
                        customers[idx].area = area
                        customers[idx].category = category
                        customers[idx].cibilScore = cibilScore
                        customers[idx].creditLimit = creditLimit
                        toastMsg = "Customer '\(name)' updated"
                    } else {
                        let newC = IOSCustomerItem(
                            id: "CUS-\(35 + customers.count)",
                            name: name,
                            area: area.isEmpty ? "General Area" : area,
                            mobile: mobile,
                            category: category,
                            cibilScore: cibilScore,
                            cibilStatus: cibilScore < 650 ? "Bad" : "Normal",
                            creditLimit: creditLimit,
                            currentBalance: initialBalance,
                            balanceType: balanceType,
                            status: "Active",
                            transactions: initialBalance > 0 ? [IOSCustomerTxn(id: "TX-601", date: "Just now", type: balanceType, amount: initialBalance, notes: "Initial Balance")] : []
                        )
                        customers.insert(newC, at: 0)
                        toastMsg = "Customer '\(name)' added"
                    }
                    showFormSheet = false
                }
            )
        }
        .sheet(item: $historyCustomer) { customer in
            IOSCustomerHistorySheet(
                customer: customer,
                onAddTx: { type, amount, notes in
                    if let idx = customers.firstIndex(where: { $0.id == customer.id }) {
                        var target = customers[idx]
                        let newTx = IOSCustomerTxn(id: "TX-\(700 + target.transactions.count + 1)", date: "Today", type: type, amount: amount, notes: notes.isEmpty ? type : notes)
                        target.transactions.insert(newTx, at: 0)
                        if type == "Baki" {
                            if target.balanceType == "Baki" {
                                target.currentBalance += amount
                            } else {
                                if amount >= target.currentBalance {
                                    target.currentBalance = amount - target.currentBalance
                                    target.balanceType = "Baki"
                                } else {
                                    target.currentBalance -= amount
                                }
                            }
                        } else {
                            if target.balanceType == "Baki" {
                                if amount >= target.currentBalance {
                                    target.currentBalance = amount - target.currentBalance
                                    target.balanceType = "Jama"
                                } else {
                                    target.currentBalance -= amount
                                }
                            } else {
                                target.currentBalance += amount
                            }
                        }
                        customers[idx] = target
                        historyCustomer = target
                        toastMsg = "\(type) of ₹\(Int(amount)) saved for \(target.name)"
                    }
                }
            )
        }
    }
}

struct IOSCustomerSummaryCard: View {
    let title: String
    let value: String
    let subText: String
    let accentColor: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption2)
                .fontWeight(.semibold)
                .foregroundColor(.gray)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))

            HStack(spacing: 4) {
                Circle()
                    .fill(accentColor)
                    .frame(width: 6, height: 6)
                Text(subText)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(accentColor)
            }
        }
        .padding(12)
        .frame(width: 155, height: 95, alignment: .leading)
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }
}

struct IOSCustomerCard: View {
    let customer: IOSCustomerItem
    var onCall: () -> Void
    var onMessage: () -> Void
    var onEdit: () -> Void
    var onHistory: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // HEADER ROW: ID & CIBIL BADGE
            HStack {
                Text(customer.id)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)

                Spacer()

                Text(customer.isWarning ? "Warning (\(customer.cibilStatus))" : customer.cibilStatus)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(customer.isWarning ? Color.red.opacity(0.12) : Color.green.opacity(0.12))
                    .foregroundColor(customer.isWarning ? .red : .green)
                    .cornerRadius(12)
            }

            // CUSTOMER NAME
            Text(customer.name)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))

            // LOCATION
            HStack(spacing: 4) {
                Image(systemName: "mappin.circle.fill")
                    .font(.caption)
                    .foregroundColor(.gray)
                Text(customer.area)
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }

            // GRID INFO
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Mobile")
                        .font(.caption2)
                        .foregroundColor(.gray)
                    Text(customer.mobile)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                }
                Spacer()
                VStack(alignment: .leading, spacing: 2) {
                    Text("CIBIL Status")
                        .font(.caption2)
                        .foregroundColor(.gray)
                    Text("\(customer.cibilScore)")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(customer.isWarning ? .red : Color(red: 30/255, green: 41/255, blue: 59/255))
                }
            }

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Dis. Amount")
                        .font(.caption2)
                        .foregroundColor(.gray)
                    Text("₹\(Int(customer.creditLimit))")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                }
                Spacer()
                VStack(alignment: .leading, spacing: 2) {
                    Text("Current Bal.")
                        .font(.caption2)
                        .foregroundColor(.gray)
                    Text("₹\(Int(customer.currentBalance))")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(customer.balanceType == "Baki" ? .red : .green)
                }
            }

            Divider()

            // ACTIONS
            HStack {
                HStack(spacing: 8) {
                    Button(action: onCall) {
                        Image(systemName: "phone.fill")
                            .font(.caption)
                            .foregroundColor(.blue)
                            .padding(8)
                            .background(Color.blue.opacity(0.1))
                            .clipShape(Circle())
                    }
                    Button(action: onMessage) {
                        Image(systemName: "message.fill")
                            .font(.caption)
                            .foregroundColor(.green)
                            .padding(8)
                            .background(Color.green.opacity(0.1))
                            .clipShape(Circle())
                    }
                }

                Spacer()

                HStack(spacing: 8) {
                    Button(action: onEdit) {
                        HStack(spacing: 4) {
                            Image(systemName: "pencil")
                            Text("Edit")
                        }
                        .font(.caption)
                        .fontWeight(.bold)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                        .cornerRadius(8)
                    }

                    Button(action: onHistory) {
                        HStack(spacing: 4) {
                            Image(systemName: "clock.arrow.circlepath")
                            Text("History")
                        }
                        .font(.caption)
                        .fontWeight(.bold)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }
                }
            }
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(customer.isWarning ? Color.red.opacity(0.4) : Color.clear, lineWidth: 1.5)
        )
        .shadow(color: Color.black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

struct IOSCustomerFormSheet: View {
    var customer: IOSCustomerItem?
    var onSave: (String, String, String, String, Int, Double, String, Double) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var name = ""
    @State private var mobile = ""
    @State private var area = ""
    @State private var category = "Regular"
    @State private var cibilScore = "750"
    @State private var creditLimit = "100000"
    @State private var balanceType = "Baki"
    @State private var initialBalance = "0"

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Customer Information")) {
                    TextField("Customer Name", text: $name)
                    TextField("Mobile Number", text: $mobile)
                        .keyboardType(.phonePad)
                    TextField("Area / Location", text: $area)
                }

                Section(header: Text("Account & Credit Settings")) {
                    Picker("Category", selection: $category) {
                        Text("Regular").tag("Regular")
                        Text("VIP").tag("VIP")
                        Text("Wholesale").tag("Wholesale")
                    }

                    TextField("CIBIL Score (e.g. 750)", text: $cibilScore)
                        .keyboardType(.numberPad)
                    TextField("Discount / Credit Limit (₹)", text: $creditLimit)
                        .keyboardType(.numberPad)
                }

                if customer == nil {
                    Section(header: Text("Opening Balance")) {
                        TextField("Opening Balance Amount (₹)", text: $initialBalance)
                            .keyboardType(.numberPad)
                        Picker("Type", selection: $balanceType) {
                            Text("Baki (Credit)").tag("Baki")
                            Text("Jama (Advance)").tag("Jama")
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }
                }
            }
            .navigationTitle(customer == nil ? "Add Customer" : "Edit Customer")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    let score = Int(cibilScore) ?? 750
                    let limit = Double(creditLimit) ?? 0.0
                    let bal = Double(initialBalance) ?? 0.0
                    onSave(name, mobile, area, category, score, limit, balanceType, bal)
                }.disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            )
            .onAppear {
                if let c = customer {
                    name = c.name
                    mobile = c.mobile
                    area = c.area
                    category = c.category
                    cibilScore = "\(c.cibilScore)"
                    creditLimit = "\(Int(c.creditLimit))"
                }
            }
        }
    }
}

struct IOSCustomerHistorySheet: View {
    let customer: IOSCustomerItem
    var onAddTx: (String, Double, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var showAddForm = false
    @State private var txType = "Baki"
    @State private var amountText = ""
    @State private var notesText = ""

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // BALANCE SUMMARY CARD
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Current Balance")
                                .font(.caption)
                                .foregroundColor(.gray)
                            Text("₹\(Int(customer.currentBalance))")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(customer.balanceType == "Baki" ? .red : .green)
                        }

                        Spacer()

                        Button(action: { showAddForm.toggle() }) {
                            Text(showAddForm ? "Cancel" : "+ Add Entry")
                                .font(.caption)
                                .fontWeight(.bold)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }
                    }
                    .padding(16)
                    .background(Color(red: 248/255, green: 250/255, blue: 252/255))
                    .cornerRadius(12)

                    // RECORD ENTRY FORM
                    if showAddForm {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Record Transaction")
                                .font(.headline)
                                .fontWeight(.bold)

                            Picker("Type", selection: $txType) {
                                Text("Baki (Give Credit)").tag("Baki")
                                Text("Jama (Receive Payment)").tag("Jama")
                            }
                            .pickerStyle(SegmentedPickerStyle())

                            TextField("Amount (₹)", text: $amountText)
                                .keyboardType(.numberPad)
                                .textFieldStyle(RoundedBorderTextFieldStyle())

                            TextField("Notes / Invoice Ref", text: $notesText)
                                .textFieldStyle(RoundedBorderTextFieldStyle())

                            Button(action: {
                                if let amt = Double(amountText), amt > 0 {
                                    onAddTx(txType, amt, notesText)
                                    showAddForm = false
                                    amountText = ""
                                    notesText = ""
                                }
                            }) {
                                Text("Save Entry")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 44)
                                    .background(Color.blue)
                                    .cornerRadius(10)
                            }
                        }
                        .padding(14)
                        .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                        .cornerRadius(12)
                    }

                    // HISTORY LIST
                    Text("Ledger Transactions")
                        .font(.headline)
                        .fontWeight(.bold)

                    if customer.transactions.isEmpty {
                        Text("No recorded transactions.")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    } else {
                        VStack(spacing: 10) {
                            ForEach(customer.transactions) { tx in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(tx.notes)
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                                        Text(tx.date)
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                    }

                                    Spacer()

                                    Text("\(tx.type == "Jama" ? "-" : "+")₹\(Int(tx.amount))")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(tx.type == "Jama" ? .green : .red)
                                }
                                .padding(12)
                                .background(Color.white)
                                .cornerRadius(10)
                                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(red: 226/255, green: 232/255, blue: 240/255), lineWidth: 1))
                            }
                        }
                    }
                }
                .padding(16)
            }
            .navigationTitle("\(customer.name) (\(customer.id))")
            .navigationBarItems(trailing: Button("Done") { presentationMode.wrappedValue.dismiss() })
        }
    }
}
