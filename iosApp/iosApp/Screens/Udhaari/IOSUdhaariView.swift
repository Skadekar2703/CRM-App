import SwiftUI

struct UdhaariCustomerIOSItem: Identifiable {
    let id: String
    var name: String
    var mobile: String
    var area: String
    var cibilStatus: String
    var baki: Double
    var jama: Double
    var outstanding: Double
    var lastTxnDate: String
    var photoUrl: String?
}

func formatIndianCurrencySwift(_ amount: Double) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.currencyCode = "INR"
    formatter.currencySymbol = "₹"
    formatter.locale = Locale(identifier: "en_IN")
    return formatter.string(from: NSNumber(value: amount)) ?? "₹\(amount)"
}

struct IOSUdhaariView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Udhaari",
            onNavigateSection: onNavigateSection
        ) {
            IOSUdhaariContentView()
        }
    }
}

struct IOSUdhaariContentView: View {
    @State private var customers: [UdhaariCustomerIOSItem] = []

    @State private var searchQuery: String = ""
    @State private var showCustomerSheet: Bool = false
    @State private var showTxnSheet: Bool = false
    @State private var showHistorySheet: Bool = false
    @State private var presetTxnType: String = "Baki"
    @State private var selectedTxnCustomerUid: String = ""
    @State private var historyCustomer: UdhaariCustomerIOSItem? = nil

    @State private var editingCustomer: UdhaariCustomerIOSItem? = nil
    @State private var deletingCustomer: UdhaariCustomerIOSItem? = nil

    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var textPrimary: Color {
        isDarkMode ? Color(red: 248/255, green: 250/255, blue: 252/255) : Color(red: 30/255, green: 41/255, blue: 59/255)
    }
    private var textMuted: Color {
        isDarkMode ? Color(red: 148/255, green: 163/255, blue: 184/255) : Color(red: 100/255, green: 116/255, blue: 139/255)
    }
    private var bgLight: Color {
        isDarkMode ? Color(red: 11/255, green: 18/255, blue: 32/255) : Color(red: 248/255, green: 250/255, blue: 252/255)
    }
    private var cardBg: Color {
        isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white
    }
    private var cardBorder: Color {
        isDarkMode ? Color(red: 51/255, green: 65/255, blue: 85/255) : Color(red: 226/255, green: 232/255, blue: 240/255)
    }
    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)
    private let errorRed = Color(red: 220/255, green: 38/255, blue: 38/255)
    private let successGreen = Color(red: 22/255, green: 163/255, blue: 74/255)

    func fetchCustomers() {
        SupabaseIOSClient.shared.fetchTable(table: "customers") { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let items):
                    self.customers = items.map { item in
                        let rawBaki = (item["baki"] as? NSNumber)?.doubleValue ?? 0.0
                        let rawJama = (item["jama"] as? NSNumber)?.doubleValue ?? 0.0
                        let currentBaki = max(0.0, rawBaki - rawJama)
                        let photoStr = item["photo_url"] as? String
                        return UdhaariCustomerIOSItem(
                            id: item["id"] as? String ?? UUID().uuidString,
                            name: item["name"] as? String ?? "Customer",
                            mobile: item["phone"] as? String ?? "",
                            area: item["area"] as? String ?? "Local Market",
                            cibilStatus: item["cibil_status"] as? String ?? "Good",
                            baki: currentBaki,
                            jama: rawJama,
                            outstanding: currentBaki,
                            lastTxnDate: "Recent",
                            photoUrl: photoStr
                        )
                    }
                case .failure:
                    self.customers = []
                }
            }
        }
    }

    var totalBaki: Double {
        customers.reduce(0) { $0 + $1.baki }
    }
    var totalJama: Double {
        customers.reduce(0) { $0 + $1.jama }
    }

    var filteredCustomers: [UdhaariCustomerIOSItem] {
        customers.filter { c in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespaces)
            return q.isEmpty || c.name.lowercased().contains(q) || c.mobile.lowercased().contains(q) || c.area.lowercased().contains(q)
        }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    // SUMMARY CARDS
                    HStack(spacing: 8) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Total Baki")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundColor(errorRed)
                            Text(formatIndianCurrencySwift(totalBaki))
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(errorRed)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(cardBg)
                        .cornerRadius(10)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Total Jama")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundColor(successGreen)
                            Text(formatIndianCurrencySwift(totalJama))
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(successGreen)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(cardBg)
                        .cornerRadius(10)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("CUSTOMERS")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundColor(textMuted)
                            Text("\(customers.count)")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(primaryBlue)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(cardBg)
                        .cornerRadius(10)
                    }

                    // SEARCH BAR
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(textMuted)
                        TextField("Search customers...", text: $searchQuery)
                    }
                    .padding(10)
                    .background(cardBg)
                    .cornerRadius(10)

                    // CUSTOMER LIST
                    if filteredCustomers.isEmpty {
                        VStack {
                            Spacer().frame(height: 40)
                            Text("No customers found.")
                                .font(.subheadline)
                                .foregroundColor(textMuted)
                        }
                        .frame(maxWidth: .infinity)
                    } else {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredCustomers) { c in
                                IOSUdhaariCustomerCard(
                                    customer: c,
                                    onAddBaki: {
                                        presetTxnType = "Baki"
                                        selectedTxnCustomerUid = c.id
                                        showTxnSheet = true
                                    },
                                    onAddJama: {
                                        presetTxnType = "Jama"
                                        selectedTxnCustomerUid = c.id
                                        showTxnSheet = true
                                    },
                                    onViewHistory: {
                                        historyCustomer = c
                                        showHistorySheet = true
                                    },
                                    onEdit: {
                                        editingCustomer = c
                                        showCustomerSheet = true
                                    },
                                    onDelete: {
                                        deletingCustomer = c
                                    }
                                )
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(bgLight)

            // FAB BUTTON (+)
            Button(action: {
                presetTxnType = "Baki"
                selectedTxnCustomerUid = customers.first?.id ?? ""
                showTxnSheet = true
            }) {
                Image(systemName: "plus")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(primaryBlue)
                    .clipShape(Circle())
                    .shadow(color: primaryBlue.opacity(0.4), radius: 6, x: 0, y: 3)
            }
            .padding(20)
        }
        .onAppear {
            fetchCustomers()
        }
        .sheet(isPresented: $showCustomerSheet) {
            IOSUdhaariCustomerSheet(
                editingCustomer: editingCustomer,
                onSave: { name, mobile, area, cibil in
                    let payload: [String: Any] = [
                        "name": name,
                        "phone": mobile,
                        "area": area,
                        "cibil_status": cibil
                    ]
                    if let existing = editingCustomer {
                        SupabaseIOSClient.shared.insertRecord(table: "customers", payload: payload) { _ in
                            self.fetchCustomers()
                        }
                    } else {
                        SupabaseIOSClient.shared.insertRecord(table: "customers", payload: payload) { _ in
                            self.fetchCustomers()
                        }
                    }
                    showCustomerSheet = false
                }
            )
        }
        .sheet(isPresented: $showTxnSheet) {
            IOSUdhaariTxnSheet(
                customers: customers,
                initialType: presetTxnType,
                initialCustomerUid: selectedTxnCustomerUid,
                onSave: { customerId, type, amt in
                    if let target = customers.first(where: { $0.id == customerId }) {
                        var newBaki = target.baki
                        var newJama = target.jama
                        if type == "Baki" {
                            newBaki += amt
                        } else {
                            newBaki = max(0, newBaki - amt)
                            newJama += amt
                        }

                        let txnPayload: [String: Any] = [
                            "customer_id": customerId,
                            "customer_name": target.name,
                            "type": type,
                            "amount": amt,
                            "status": "Completed"
                        ]

                        SupabaseIOSClient.shared.insertRecord(table: "udhaari", payload: txnPayload) { _ in
                            SupabaseIOSClient.shared.insertRecord(table: "customers", payload: ["id": customerId, "baki": newBaki, "jama": newJama]) { _ in
                                self.fetchCustomers()
                            }
                        }
                    }
                    showTxnSheet = false
                }
            )
        }
        .sheet(isPresented: $showHistorySheet) {
            if let target = historyCustomer {
                IOSUdhaariHistorySheet(customer: target, onRefresh: { self.fetchCustomers() })
            }
        }
        .alert(item: $deletingCustomer) { target in
            Alert(
                title: Text("Delete Customer?"),
                message: Text("Are you sure you want to delete '\(target.name)'?"),
                primaryButton: .destructive(Text("Delete")) {
                    SupabaseIOSClient.shared.deleteRecord(table: "customers", id: target.id) { _ in
                        self.fetchCustomers()
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSUdhaariCustomerCard: View {
    let customer: UdhaariCustomerIOSItem
    var onAddBaki: () -> Void
    var onAddJama: () -> Void
    var onViewHistory: () -> Void
    var onEdit: () -> Void
    var onDelete: () -> Void

    private let textPrimary = Color(red: 30/255, green: 41/255, blue: 59/255)
    private let textMuted = Color(red: 100/255, green: 116/255, blue: 139/255)
    private let errorRed = Color(red: 220/255, green: 38/255, blue: 38/255)
    private let successGreen = Color(red: 22/255, green: 163/255, blue: 74/255)
    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                HStack(spacing: 10) {
                    if let photoStr = customer.photoUrl, let url = URL(string: photoStr) {
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case .success(let img):
                                img
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 40, height: 40)
                                    .clipShape(Circle())
                                    .overlay(Circle().stroke(primaryBlue, lineWidth: 1.5))
                            case .failure, .empty:
                                ZStack {
                                    Circle()
                                        .fill(Color(red: 224/255, green: 242/255, blue: 254/255))
                                        .frame(width: 40, height: 40)
                                    Text(String(customer.name.prefix(2)).uppercased())
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundColor(primaryBlue)
                                }
                            @unknown default:
                                Circle().fill(primaryBlue).frame(width: 40, height: 40)
                            }
                        }
                    } else {
                        ZStack {
                            Circle()
                                .fill(Color(red: 224/255, green: 242/255, blue: 254/255))
                                .frame(width: 40, height: 40)
                            Text(String(customer.name.prefix(2)).uppercased())
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(primaryBlue)
                        }
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(customer.name)
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(textPrimary)
                        HStack(spacing: 2) {
                            Image(systemName: "mappin.and.ellipse")
                                .font(.caption2)
                                .foregroundColor(textMuted)
                            Text(customer.area)
                                .font(.caption)
                                .foregroundColor(textMuted)
                        }
                    }
                }

                Spacer()
            }

            HStack(spacing: 8) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Total Baki")
                        .font(.caption2)
                        .foregroundColor(errorRed)
                    Text(formatIndianCurrencySwift(customer.baki))
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(errorRed)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(6)
                .background(Color(red: 254/255, green: 242/255, blue: 242/255))
                .cornerRadius(6)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Total Jama")
                        .font(.caption2)
                        .foregroundColor(successGreen)
                    Text(formatIndianCurrencySwift(customer.jama))
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(successGreen)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(6)
                .background(Color(red: 240/255, green: 253/255, blue: 244/255))
                .cornerRadius(6)
            }

            Divider()

            HStack {
                Text("CIBIL: \(customer.cibilStatus)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color(red: 254/255, green: 242/255, blue: 242/255))
                    .foregroundColor(errorRed)
                    .cornerRadius(8)

                Spacer()

                HStack(spacing: 6) {
                    Button(action: onAddBaki) {
                        Text("+ Baki")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(errorRed)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(red: 254/255, green: 242/255, blue: 242/255))
                            .cornerRadius(6)
                    }

                    Button(action: onAddJama) {
                        Text("+ Jama")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(successGreen)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(red: 240/255, green: 253/255, blue: 244/255))
                            .cornerRadius(6)
                    }

                    Button(action: onViewHistory) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.caption)
                            .foregroundColor(textPrimary)
                            .frame(width: 28, height: 28)
                            .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                            .clipShape(Circle())
                    }

                    Button(action: onEdit) {
                        Image(systemName: "pencil")
                            .font(.caption)
                            .foregroundColor(textPrimary)
                            .frame(width: 28, height: 28)
                            .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                            .clipShape(Circle())
                    }
                }
            }
        }
        .padding(14)
        .background(cardBg)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }
}

struct IOSUdhaariHistorySheet: View {
    let customer: UdhaariCustomerIOSItem
    var onRefresh: () -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var transactions: [[String: Any]] = []

    var body: some View {
        NavigationView {
            List {
                ForEach(0..<transactions.count, id: \.self) { idx in
                    let item = transactions[idx]
                    let type = item["type"] as? String ?? "Baki"
                    let amt = (item["amount"] as? NSNumber)?.doubleValue ?? 0.0
                    let notes = item["notes"] as? String ?? "Entry"
                    HStack {
                        VStack(alignment: .leading) {
                            Text(type)
                                .font(.headline)
                                .foregroundColor(type == "Baki" ? .red : .green)
                            Text(notes)
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        Text(formatIndianCurrencySwift(amt))
                            .fontWeight(.bold)
                            .foregroundColor(type == "Baki" ? .red : .green)
                    }
                }
            }
            .navigationBarTitle("History — \(customer.name)", displayMode: .inline)
            .navigationBarItems(trailing: Button("Done") { presentationMode.wrappedValue.dismiss() })
            .onAppear {
                SupabaseIOSClient.shared.fetchTable(table: "udhaari") { res in
                    if case .success(let items) = res {
                        DispatchQueue.main.async {
                            self.transactions = items.filter { ($0["customer_id"] as? String) == customer.id || ($0["customer_name"] as? String) == customer.name }
                        }
                    }
                }
            }
        }
    }
}

struct IOSUdhaariCustomerSheet: View {
    var editingCustomer: UdhaariCustomerIOSItem?
    var onSave: (String, String, String, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var name: String = ""
    @State private var mobile: String = ""
    @State private var area: String = "Main Bazar"
    @State private var cibil: String = "Good"

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Customer Credit Details")) {
                    TextField("Customer Name *", text: $name)
                    TextField("Mobile Number", text: $mobile)
                    TextField("Area", text: $area)
                    Picker("CIBIL Status", selection: $cibil) {
                        Text("Good").tag("Good")
                        Text("Average").tag("Average")
                        Text("Bad").tag("Bad")
                    }
                }
            }
            .navigationBarTitle(editingCustomer != null ? "Edit Customer Profile" : "Add Customer Profile", displayMode: .inline)
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    onSave(name.isEmpty ? "Customer" : name, mobile, area, cibil)
                }
            )
            .onAppear {
                if let c = editingCustomer {
                    name = c.name
                    mobile = c.mobile
                    area = c.area
                    cibil = c.cibilStatus
                }
            }
        }
    }
}

struct IOSUdhaariTxnSheet: View {
    let customers: [UdhaariCustomerIOSItem]
    var initialType: String = "Baki"
    var initialCustomerUid: String = ""
    var onSave: (String, String, Double) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var selectedCustomerId: String = ""
    @State private var txnType: String = "Baki"
    @State private var amount: String = "1000"

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Record Transaction")) {
                    Picker("Select Customer", selection: $selectedCustomerId) {
                        ForEach(customers) { c in
                            Text(c.name).tag(c.id)
                        }
                    }
                    Picker("Transaction Type", selection: $txnType) {
                        Text("Baki (Debit/Debt)").tag("Baki")
                        Text("Jama (Credit/Payment)").tag("Jama")
                    }
                    TextField("Amount (₹) *", text: $amount)
                        .keyboardType(.decimalPad)
                }
            }
            .navigationBarTitle("Add \(txnType) Entry", displayMode: .inline)
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    let targetId = selectedCustomerId.isEmpty ? (customers.first?.id ?? "1") : selectedCustomerId
                    let amtNum = Double(amount) ?? 1000.0
                    onSave(targetId, txnType, amtNum)
                }
            )
            .onAppear {
                txnType = initialType
                if !initialCustomerUid.isEmpty {
                    selectedCustomerId = initialCustomerUid
                } else if selectedCustomerId.isEmpty, let first = customers.first {
                    selectedCustomerId = first.id
                }
            }
        }
    }
}
