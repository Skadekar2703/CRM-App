import SwiftUI

struct IOSSupplierLedgerView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Supplier Ledger",
            onNavigateSection: onNavigateSection
        ) {
            IOSSupplierLedgerContentView()
        }
    }
}

struct IOSSupplierOverviewItem: Identifiable {
    var id: String
    var name: String
    var opening: Double
    var purchases: Double
    var paid: Double
    var returns: Double
    var payable: Double
}

struct IOSLedgerEntryItem: Identifiable {
    var id: String
    var supplierId: String
    var supplierName: String
    var date: String
    var transactionType: String
    var amount: Double
    var reference: String
    var paymentMode: String
    var description: String
}

struct IOSSupplierLedgerContentView: View {
    @State private var suppliers: [(id: String, name: String)] = []
    @State private var entries: [IOSLedgerEntryItem] = []
    @State private var isLoadingSuppliers = false
    @State private var suppliersError: String? = nil

    @State private var selectedSupplierId: String? = nil
    @State private var searchQuery = ""
    @State private var showFormSheet = false
    @State private var editingEntry: IOSLedgerEntryItem? = nil
    @State private var deletingEntry: IOSLedgerEntryItem? = nil
    @State private var showDeleteAlert = false
    @State private var toastMsg: String? = nil

    private var cardBg: Color { Color.white }
    private var bgApp: Color { Color(red: 248/255, green: 250/255, blue: 252/255) }

    func fetchSuppliers() {
        isLoadingSuppliers = true
        suppliersError = nil
        SupabaseIOSClient.shared.fetchTable(table: "suppliers") { result in
            DispatchQueue.main.async {
                self.isLoadingSuppliers = false
                switch result {
                case .success(let items):
                    self.suppliers = items.map { item in
                        let id = item["id"] as? String ?? UUID().uuidString
                        let name = item["name"] as? String ?? item["party_name"] as? String ?? "Supplier"
                        return (id: id, name: name)
                    }
                case .failure(let err):
                    self.suppliersError = err.localizedDescription
                }
            }
        }
    }

    func fetchLedger() {
        SupabaseIOSClient.shared.fetchTable(table: "supplier_ledger") { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let items):
                    self.entries = items.map { item in
                        IOSLedgerEntryItem(
                            id: item["id"] as? String ?? UUID().uuidString,
                            supplierId: item["supplier_id"] as? String ?? "",
                            supplierName: item["supplier_name"] as? String ?? "Supplier",
                            date: item["date"] as? String ?? "29 Aug 2026",
                            transactionType: item["transaction_type"] as? String ?? "Purchase",
                            amount: (item["amount"] as? NSNumber)?.doubleValue ?? (Double(item["amount"] as? String ?? "0") ?? 0.0),
                            reference: item["reference"] as? String ?? "",
                            paymentMode: item["payment_mode"] as? String ?? "Cash",
                            description: item["notes"] as? String ?? item["description"] as? String ?? ""
                        )
                    }
                case .failure:
                    break
                }
            }
        }
    }

    var overviews: [IOSSupplierOverviewItem] {
        suppliers.map { sup in
            let supEntries = entries.filter { $0.supplierId == sup.id }
            let opening = supEntries.filter { $0.transactionType == "Opening Balance" }.reduce(0) { $0 + $1.amount }
            let purchases = supEntries.filter { $0.transactionType == "Purchase" }.reduce(0) { $0 + $1.amount }
            let paid = supEntries.filter { $0.transactionType == "Payment" }.reduce(0) { $0 + $1.amount }
            let returns = supEntries.filter { $0.transactionType == "Return" }.reduce(0) { $0 + $1.amount }
            let payable = max(0, (opening + purchases) - (paid + returns))

            return IOSSupplierOverviewItem(
                id: sup.id,
                name: sup.name,
                opening: opening,
                purchases: purchases,
                paid: paid,
                returns: returns,
                payable: payable
            )
        }
    }

    var totalPayable: Double {
        overviews.reduce(0) { $0 + $1.payable }
    }

    var filteredOverviews: [IOSSupplierOverviewItem] {
        let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        if q.isEmpty { return overviews }
        return overviews.filter { $0.name.lowercased().contains(q) || $0.id.lowercased().contains(q) }
    }

    var selectedSupplierEntries: [IOSLedgerEntryItem] {
        guard let supId = selectedSupplierId else { return [] }
        return entries.filter { $0.supplierId == supId }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            bgApp.ignoresSafeArea()

            VStack(spacing: 14) {
                // SUMMARY CARDS ROW
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("TOTAL PAYABLE (WE OWE)")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                        Text("₹\(Int(totalPayable))")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                        Text("Amount owed to suppliers")
                            .font(.caption2)
                            .foregroundColor(.gray)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, minHeight: 85, alignment: .leading)
                    .background(cardBg)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("SUPPLIERS")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                        Text("\(suppliers.count)")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                        Text("Total registered")
                            .font(.caption2)
                            .foregroundColor(.gray)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, minHeight: 85, alignment: .leading)
                    .background(cardBg)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)

                // SEARCH BAR & MODE CONTROLS
                HStack(spacing: 10) {
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.gray)
                        TextField("Search supplier...", text: $searchQuery)
                    }
                    .padding(10)
                    .background(cardBg)
                    .cornerRadius(10)

                    if selectedSupplierId != nil {
                        Button(action: { selectedSupplierId = nil }) {
                            Text("Overview")
                                .font(.caption)
                                .fontWeight(.bold)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 8)
                                .background(Color.gray.opacity(0.2))
                                .foregroundColor(.primary)
                                .cornerRadius(8)
                        }
                    }
                }
                .padding(.horizontal, 16)

                // TOAST MESSAGE
                if let msg = toastMsg {
                    Text(msg)
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Color.black.opacity(0.8))
                        .cornerRadius(20)
                }

                // MAIN LIST CONTENT
                if selectedSupplierId == nil {
                    if filteredOverviews.isEmpty {
                        VStack(spacing: 8) {
                            Text("No supplier ledger activity found.")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 12) {
                                ForEach(filteredOverviews) { overview in
                                    IOSSupplierOverviewCard(
                                        overview: overview,
                                        onViewLedger: { selectedSupplierId = overview.id }
                                    )
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.bottom, 80)
                        }
                    }
                } else {
                    let selectedSupName = suppliers.first(where: { $0.id == selectedSupplierId })?.name ?? "Supplier"

                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Button(action: { selectedSupplierId = nil }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "chevron.left")
                                    Text("Back")
                                }
                                .font(.subheadline)
                                .foregroundColor(.blue)
                            }
                            Spacer()
                            Text(selectedSupName)
                                .font(.headline)
                                .fontWeight(.bold)
                            Spacer()
                        }
                        .padding(.horizontal, 16)

                        if selectedSupplierEntries.isEmpty {
                            VStack(spacing: 8) {
                                Text("No entries recorded for \(selectedSupName).")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                            }
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                        } else {
                            ScrollView {
                                LazyVStack(spacing: 10) {
                                    ForEach(selectedSupplierEntries) { entry in
                                        IOSLedgerEntryCard(
                                            entry: entry,
                                            onEdit: {
                                                editingEntry = entry
                                                fetchSuppliers()
                                                showFormSheet = true
                                            },
                                            onDelete: {
                                                deletingEntry = entry
                                                showDeleteAlert = true
                                            }
                                        )
                                    }
                                }
                                .padding(.horizontal, 16)
                                .padding(.bottom, 80)
                            }
                        }
                    }
                }
            }

            // FAB ADD BUTTON
            Button(action: {
                fetchSuppliers()
                editingEntry = nil
                showFormSheet = true
            }) {
                Image(systemName: "plus")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(Color.green)
                    .clipShape(Circle())
                    .shadow(radius: 4)
            }
            .padding(20)
        }
        .onAppear {
            fetchSuppliers()
            fetchLedger()
        }
        .sheet(isPresented: $showFormSheet) {
            IOSSupplierLedgerFormSheet(
                entry: editingEntry,
                suppliers: suppliers,
                isLoadingSuppliers: isLoadingSuppliers,
                suppliersError: suppliersError,
                onSave: { supId, supName, date, type, amount, ref, mode, desc in
                    let payload: [String: Any] = [
                        "supplier_id": supId,
                        "supplier_name": supName,
                        "date": date,
                        "transaction_type": type,
                        "amount": amount,
                        "reference": ref,
                        "payment_mode": mode,
                        "notes": desc
                    ]

                    if let target = editingEntry {
                        SupabaseIOSClient.shared.updateRecord(table: "supplier_ledger", id: target.id, payload: payload) { _ in
                            DispatchQueue.main.async {
                                self.fetchLedger()
                                self.toastMsg = "Ledger entry for '\(supName)' updated"
                            }
                        }
                    } else {
                        SupabaseIOSClient.shared.insertRecord(table: "supplier_ledger", payload: payload) { _ in
                            DispatchQueue.main.async {
                                self.fetchLedger()
                                self.toastMsg = "Ledger entry for '\(supName)' recorded"
                            }
                        }
                    }
                    showFormSheet = false
                }
            )
        }
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Delete Ledger Entry"),
                message: Text("Are you sure you want to delete entry for '\(deletingEntry?.supplierName ?? "")' (₹\(Int(deletingEntry?.amount ?? 0)))?"),
                primaryButton: .destructive(Text("Delete")) {
                    if let target = deletingEntry {
                        SupabaseIOSClient.shared.deleteRecord(table: "supplier_ledger", id: target.id) { _ in
                            DispatchQueue.main.async {
                                self.fetchLedger()
                                self.toastMsg = "Ledger entry deleted"
                            }
                        }
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSSupplierOverviewCard: View {
    let overview: IOSSupplierOverviewItem
    var onViewLedger: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(overview.name)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                    let shortId = overview.id.count > 16 ? String(overview.id.prefix(8)) + "..." + String(overview.id.suffix(4)) : overview.id
                    Text("ID: \(shortId)")
                        .font(.caption)
                        .foregroundColor(.gray)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("PAYABLE")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                    Text("₹\(Int(overview.payable))")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(overview.payable > 0 ? .red : .green)
                }
            }

            Divider()

            HStack {
                Text("Opening: ₹\(Int(overview.opening))")
                    .font(.caption2)
                    .foregroundColor(.gray)
                Spacer()
                Text("Purchases: ₹\(Int(overview.purchases))")
                    .font(.caption2)
                    .foregroundColor(.blue)
                Spacer()
                Text("Paid: ₹\(Int(overview.paid))")
                    .font(.caption2)
                    .foregroundColor(.green)
            }

            Divider()

            HStack {
                Spacer()
                Button(action: onViewLedger) {
                    Text("View Ledger →")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                }
            }
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

struct IOSLedgerEntryCard: View {
    let entry: IOSLedgerEntryItem
    var onEdit: () -> Void
    var onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(entry.date)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                Spacer()
                Text(entry.transactionType)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(entry.transactionType == "Payment" ? Color.green.opacity(0.12) : Color.blue.opacity(0.12))
                    .foregroundColor(entry.transactionType == "Payment" ? .green : .blue)
                    .cornerRadius(6)
            }

            HStack {
                Text("Ref: \(entry.reference.isEmpty ? "—" : entry.reference)")
                    .font(.caption)
                    .foregroundColor(.gray)
                Spacer()
                Text("₹\(Int(entry.amount))")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(entry.transactionType == "Payment" ? .green : Color(red: 30/255, green: 41/255, blue: 59/255))
            }

            if !entry.description.isEmpty {
                Text(entry.description)
                    .font(.caption)
                    .foregroundColor(.gray)
            }

            Divider()

            HStack {
                Spacer()
                HStack(spacing: 8) {
                    Button(action: onEdit) {
                        Image(systemName: "pencil")
                            .font(.caption)
                            .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                            .padding(6)
                            .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                            .cornerRadius(6)
                    }

                    Button(action: onDelete) {
                        Image(systemName: "trash.fill")
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding(6)
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(6)
                    }
                }
            }
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

struct IOSSupplierLedgerFormSheet: View {
    var entry: IOSLedgerEntryItem?
    var suppliers: [(id: String, name: String)]
    var isLoadingSuppliers: Bool = false
    var suppliersError: String? = nil
    var onSave: (String, String, String, String, Double, String, String, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var selectedSupId = ""
    @State private var date = "29 Aug 2026"
    @State private var type = "Purchase"
    @State private var amount = ""
    @State private var reference = ""
    @State private var paymentMode = "Cash"
    @State private var description = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Select Supplier *")) {
                    if isLoadingSuppliers {
                        Text("Loading suppliers...").foregroundColor(.gray)
                    } else if let err = suppliersError {
                        Text("Unable to load suppliers (\(err))").foregroundColor(.red)
                    } else if suppliers.isEmpty {
                        Text("No suppliers available").foregroundColor(.orange)
                    } else {
                        Picker("Supplier", selection: $selectedSupId) {
                            ForEach(suppliers, id: \.id) { sup in
                                Text("\(sup.name) (\(sup.id.prefix(8)))").tag(sup.id)
                            }
                        }
                    }
                }

                Section(header: Text("Transaction Details")) {
                    TextField("Date *", text: $date)

                    Picker("Type *", selection: $type) {
                        Text("Purchase").tag("Purchase")
                        Text("Payment").tag("Payment")
                        Text("Return").tag("Return")
                        Text("Opening Balance").tag("Opening Balance")
                    }

                    TextField("Amount (₹) *", text: $amount)
                        .keyboardType(.decimalPad)

                    TextField("Reference / Invoice No.", text: $reference)

                    Picker("Payment Mode", selection: $paymentMode) {
                        Text("Cash").tag("Cash")
                        Text("UPI").tag("UPI")
                        Text("Bank Transfer").tag("Bank Transfer")
                        Text("Cheque").tag("Cheque")
                    }

                    TextEditor(text: $description)
                        .frame(minHeight: 80)
                }
            }
            .navigationTitle(entry == nil ? "Add Ledger Entry" : "Edit Ledger Entry")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    let amt = Double(amount) ?? 0.0
                    let supName = suppliers.first(where: { $0.id == selectedSupId })?.name ?? "Supplier"
                    onSave(selectedSupId, supName, date, type, amt, reference, paymentMode, description)
                }.disabled(selectedSupId.isEmpty || date.trimmingCharacters(in: .whitespaces).isEmpty || (Double(amount) ?? -1) < 0 || isLoadingSuppliers || suppliers.isEmpty)
            )
            .onAppear {
                if let e = entry {
                    selectedSupId = e.supplierId
                    date = e.date
                    type = e.transactionType
                    amount = "\(Int(e.amount))"
                    reference = e.reference
                    paymentMode = e.paymentMode
                    description = e.description
                } else if selectedSupId.isEmpty, let first = suppliers.first {
                    selectedSupId = first.id
                }
            }
        }
    }
}
