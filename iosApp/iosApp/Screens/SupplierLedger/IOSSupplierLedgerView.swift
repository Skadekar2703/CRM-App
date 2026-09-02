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
    let id: String
    var name: String
    var opening: Double
    var purchases: Double
    var paid: Double
    var returns: Double
    var payable: Double
}

struct IOSLedgerEntryItem: Identifiable {
    let id: String
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
    @State private var suppliers: [(id: String, name: String)] = [
        ("SUP-101", "Metro Cash & Carry"),
        ("SUP-102", "Sharma Wholesale"),
        ("SUP-103", "Vardhman Fabrics"),
        ("SUP-104", "Garg Distributers")
    ]

    @State private var entries: [IOSLedgerEntryItem] = [
        IOSLedgerEntryItem(
            id: "SLE-101",
            supplierId: "SUP-101",
            supplierName: "Metro Cash & Carry",
            date: "01 Jun 2026",
            transactionType: "Opening Balance",
            amount: 0.0,
            reference: "OB-001",
            paymentMode: "Cash",
            description: "Initial balance"
        ),
        IOSLedgerEntryItem(
            id: "SLE-102",
            supplierId: "SUP-102",
            supplierName: "Sharma Wholesale",
            date: "15 Jun 2026",
            transactionType: "Purchase",
            amount: 45000.0,
            reference: "INV-9821",
            paymentMode: "Cash",
            description: "Bulk Basmati Rice 25kg stock purchase"
        ),
        IOSLedgerEntryItem(
            id: "SLE-103",
            supplierId: "SUP-102",
            supplierName: "Sharma Wholesale",
            date: "20 Jun 2026",
            transactionType: "Payment",
            amount: 20000.0,
            reference: "PAY-4412",
            paymentMode: "Bank Transfer",
            description: "Part payment via RTGS"
        ),
        IOSLedgerEntryItem(
            id: "SLE-104",
            supplierId: "SUP-103",
            supplierName: "Vardhman Fabrics",
            date: "10 Jul 2026",
            transactionType: "Purchase",
            amount: 32000.0,
            reference: "INV-1042",
            paymentMode: "Cash",
            description: "Cotton fabric rolls purchase"
        ),
        IOSLedgerEntryItem(
            id: "SLE-105",
            supplierId: "SUP-103",
            supplierName: "Vardhman Fabrics",
            date: "12 Jul 2026",
            transactionType: "Return",
            amount: 4000.0,
            reference: "RET-004",
            paymentMode: "Cash",
            description: "Damaged fabric roll return"
        )
    ]

    @State private var selectedSupplierId: String? = nil
    @State private var searchQuery = ""
    @State private var showFormSheet = false
    @State private var editingEntry: IOSLedgerEntryItem? = nil
    @State private var deletingEntry: IOSLedgerEntryItem? = nil
    @State private var showDeleteAlert = false
    @State private var toastMsg: String? = nil

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
            Color(red: 248/255, green: 250/255, blue: 252/255).ignoresSafeArea()

            VStack(spacing: 14) {
                // SUMMARY CARDS ROW
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("TOTAL PAYABLE")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("₹\(Int(totalPayable))")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("SUPPLIERS")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("\(suppliers.count)")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // SELECT SUPPLIER HEADER & BACK BUTTON
                HStack {
                    if selectedSupplierId != null {
                        Button(action: { selectedSupplierId = nil }) {
                            HStack(spacing: 4) {
                                Image(systemName: "chevron.left")
                                Text("All Suppliers")
                            }
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                        }
                    } else {
                        Text("All Suppliers — Payable Overview")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                    }

                    Spacer()

                    Button(action: {
                        editingEntry = nil
                        showFormSheet = true
                    }) {
                        Text("+ Add Entry")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
                .padding(.horizontal, 16)

                // SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search supplier name or ID...", text: $searchQuery)
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

                // CONTENT
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        if selectedSupplierId == nil {
                            ForEach(filteredOverviews) { overview in
                                IOSSupplierOverviewCard(
                                    overview: overview,
                                    onViewLedger: { selectedSupplierId = overview.id }
                                )
                            }
                        } else {
                            let currentSupName = suppliers.find { $0.id == selectedSupplierId }?.name ?? "Supplier"
                            Text("Detailed Ledger for \(currentSupName)")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)

                            if selectedSupplierEntries.isEmpty {
                                Text("No transactions recorded.")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                                    .padding(.top, 20)
                            } else {
                                ForEach(selectedSupplierEntries) { entry in
                                    IOSLedgerEntryCard(
                                        entry: entry,
                                        onEdit: {
                                            editingEntry = entry
                                            showFormSheet = true
                                        },
                                        onDelete: {
                                            deletingEntry = entry
                                            showDeleteAlert = true
                                        }
                                    )
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 80)
                }
            }

            // FAB ADD BUTTON
            Button(action: {
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
        .sheet(isPresented: $showFormSheet) {
            IOSSupplierLedgerFormSheet(
                entry: editingEntry,
                suppliers: suppliers,
                onSave: { supId, supName, date, type, amount, ref, mode, desc in
                    if let target = editingEntry, let idx = entries.firstIndex(where: { $0.id == target.id }) {
                        entries[idx].supplierId = supId
                        entries[idx].supplierName = supName
                        entries[idx].date = date
                        entries[idx].transactionType = type
                        entries[idx].amount = amount
                        entries[idx].reference = ref
                        entries[idx].paymentMode = mode
                        entries[idx].description = desc
                        toastMsg = "Ledger entry for '\(supName)' updated"
                    } else {
                        let newE = IOSLedgerEntryItem(
                            id: "SLE-\(100 + entries.count + 1)",
                            supplierId: supId,
                            supplierName: supName,
                            date: date,
                            transactionType: type,
                            amount: amount,
                            reference: ref,
                            paymentMode: mode,
                            description: desc
                        )
                        entries.insert(newE, at: 0)
                        toastMsg = "Ledger entry for '\(supName)' recorded"
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
                        entries.removeAll { $0.id == target.id }
                        toastMsg = "Ledger entry deleted"
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
                    Text("ID: \(overview.id)")
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
    var onSave: (String, String, String, String, Double, String, String, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var selectedSupId = "SUP-101"
    @State private var date = "29 Aug 2026"
    @State private var type = "Purchase"
    @State private var amount = ""
    @State private var reference = ""
    @State private var paymentMode = "Cash"
    @State private var description = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Supplier")) {
                    Picker("Select Supplier", selection: $selectedSupId) {
                        ForEach(suppliers, id: \.id) { sup in
                            Text("\(sup.name) (\(sup.id))").tag(sup.id)
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
                }.disabled(date.trimmingCharacters(in: .whitespaces).isEmpty || (Double(amount) ?? -1) < 0)
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
                }
            }
        }
    }
}
