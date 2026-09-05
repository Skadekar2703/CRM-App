import SwiftUI

struct ChequeIOSItem: Identifiable {
    let id: String
    var chequeNo: String
    var partyName: String
    var bankName: String
    var amount: Double
    var direction: String
    var issueDate: String
    var dueDate: String
    var status: String
    var notes: String
}

struct IOSChequesView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Cheques",
            onNavigateSection: onNavigateSection
        ) {
            IOSChequesContentView()
        }
    }
}

struct IOSChequesContentView: View {
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    @State private var cheques: [ChequeIOSItem] = [
        ChequeIOSItem(id: "1", chequeNo: "CHQ-2023-0891", partyName: "Acme Corp", bankName: "HDFC Bank", amount: 45000.0, direction: "Inward", issueDate: "05 Sep 2026", dueDate: "15 Sep 2026", status: "Pending", notes: "Client payment for Invoice #1024"),
        ChequeIOSItem(id: "2", chequeNo: "CHQ-2023-0892", partyName: "TechSolutions Ltd", bankName: "ICICI Bank", amount: 125000.0, direction: "Inward", issueDate: "01 Sep 2026", dueDate: "10 Sep 2026", status: "Cleared", notes: "Annual retainer fee"),
        ChequeIOSItem(id: "3", chequeNo: "CHQ-2023-0893", partyName: "Global Traders", bankName: "SBI", amount: 32000.0, direction: "Outward", issueDate: "20 Aug 2026", dueDate: "30 Aug 2026", status: "Bounced", notes: "Vendor advance payment")
    ]

    @State private var searchQuery: String = ""
    @State private var statusFilter: String = "All"
    @State private var showFormSheet: Bool = false
    @State private var editingCheque: ChequeIOSItem? = nil
    @State private var deletingCheque: ChequeIOSItem? = nil
    @State private var statusActionTarget: (cheque: ChequeIOSItem, nextStatus: String)? = nil

    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255) }
    private var textMuted: Color { isDarkMode ? Color(red: 156/255, green: 163/255, blue: 175/255) : Color(red: 100/255, green: 116/255, blue: 139/255) }
    private var bgLight: Color { isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color(red: 248/255, green: 250/255, blue: 252/255) }
    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }
    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)

    var allCount: Int { cheques.count }
    var pendingCount: Int { cheques.filter { $0.status.caseInsensitiveCompare("Pending") == .orderedSame }.count }
    var clearedCount: Int { cheques.filter { $0.status.caseInsensitiveCompare("Cleared") == .orderedSame }.count }
    var bouncedCount: Int { cheques.filter { $0.status.caseInsensitiveCompare("Bounced") == .orderedSame }.count }

    var filteredCheques: [ChequeIOSItem] {
        cheques.filter { c in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespaces)
            let matchesQuery = q.isEmpty ||
                c.id.lowercased().contains(q) ||
                c.chequeNo.lowercased().contains(q) ||
                c.partyName.lowercased().contains(q) ||
                c.bankName.lowercased().contains(q)

            let matchesStatus = statusFilter == "All" || c.status.caseInsensitiveCompare(statusFilter) == .orderedSame

            return matchesQuery && matchesStatus
        }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("Cheque Register")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)

                    // SUMMARY COUNTERS
                    HStack(spacing: 8) {
                        IOSMetricCard(title: "ALL", value: "\(allCount)", color: primaryBlue)
                        IOSMetricCard(title: "PENDING", value: "\(pendingCount)", color: Color.orange)
                        IOSMetricCard(title: "CLEARED", value: "\(clearedCount)", color: Color.green)
                        IOSMetricCard(title: "BOUNCED", value: "\(bouncedCount)", color: Color.red)
                    }

                    // SEARCH & FILTER BAR
                    HStack(spacing: 10) {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(textMuted)
                            TextField("Search cheques...", text: $searchQuery)
                                .font(.subheadline)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(cardBg)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(red: 203/255, green: 213/255, blue: 225/255), lineWidth: 1))

                        Button(action: {
                            switch statusFilter {
                            case "All": statusFilter = "Pending"
                            case "Pending": statusFilter = "Cleared"
                            case "Cleared": statusFilter = "Bounced"
                            default: statusFilter = "All"
                            }
                        }) {
                            Image(systemName: "line.3.horizontal.decrease.circle.fill")
                                .font(.title2)
                                .foregroundColor(primaryBlue)
                                .frame(width: 44, height: 44)
                                .background(cardBg)
                                .cornerRadius(12)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(red: 203/255, green: 213/255, blue: 225/255), lineWidth: 1))
                        }
                    }

                    // VERTICAL CHEQUE CARDS LIST
                    if filteredCheques.isEmpty {
                        VStack {
                            Spacer()
                            Text("No cheque records found.")
                                .font(.subheadline)
                                .foregroundColor(textMuted)
                            Spacer()
                        }
                        .frame(maxWidth: .infinity, minHeight: 200)
                    } else {
                        LazyVStack(spacing: 14) {
                            ForEach(filteredCheques) { cheque in
                                IOSChequeCard(
                                    cheque: cheque,
                                    onEdit: {
                                        editingCheque = cheque
                                        showFormSheet = true
                                    },
                                    onDelete: {
                                        deletingCheque = cheque
                                    },
                                    onClearStatus: {
                                        statusActionTarget = (cheque, "Cleared")
                                    },
                                    onBounceStatus: {
                                        statusActionTarget = (cheque, "Bounced")
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
                editingCheque = nil
                showFormSheet = true
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
        .sheet(isPresented: $showFormSheet) {
            IOSChequeFormSheet(
                editingCheque: editingCheque,
                onSave: { no, party, bank, amt, dir, issue, due, status, notes in
                    if let existing = editingCheque, let idx = cheques.firstIndex(where: { $0.id == existing.id }) {
                        cheques[idx] = ChequeIOSItem(id: existing.id, chequeNo: no, partyName: party, bankName: bank, amount: amt, direction: dir, issueDate: issue, dueDate: due, status: status, notes: notes)
                    } else {
                        let newC = ChequeIOSItem(id: "\(cheques.count + 1)", chequeNo: no, partyName: party, bankName: bank, amount: amt, direction: dir, issueDate: issue, dueDate: due, status: status, notes: notes)
                        cheques.insert(newC, at: 0)
                    }
                    showFormSheet = false
                }
            )
        }
        .alert(item: $deletingCheque) { target in
            Alert(
                title: Text("Delete Cheque?"),
                message: Text("Are you sure you want to delete cheque '\(target.chequeNo)' (\(target.partyName))?"),
                primaryButton: .destructive(Text("Delete")) {
                    cheques.removeAll { $0.id == target.id }
                },
                secondaryButton: .cancel()
            )
        }
        .alert(isPresented: Binding<Bool>(
            get: { statusActionTarget != nil },
            set: { if !$0 { statusActionTarget = nil } }
        )) {
            let target = statusActionTarget?.cheque
            let nextSt = statusActionTarget?.nextStatus ?? "Cleared"
            return Alert(
                title: Text("Confirm Status Change"),
                message: Text("Mark cheque #\(target?.chequeNo ?? "") as \(nextSt)?"),
                primaryButton: .default(Text("Confirm")) {
                    if let t = target, let idx = cheques.firstIndex(where: { $0.id == t.id }) {
                        cheques[idx].status = nextSt
                    }
                    statusActionTarget = nil
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSMetricCard: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text(title)
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(value)
                .font(.callout)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

struct IOSChequeCard: View {
    let cheque: ChequeIOSItem
    var onEdit: () -> Void
    var onDelete: () -> Void
    var onClearStatus: () -> Void
    var onBounceStatus: () -> Void

    private let textPrimary = Color(red: 30/255, green: 41/255, blue: 59/255)
    private let textMuted = Color(red: 100/255, green: 116/255, blue: 139/255)
    private let errorRed = Color(red: 220/255, green: 38/255, blue: 38/255)
    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(cheque.partyName)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)
                    Text("Ref: \(cheque.chequeNo) • \(cheque.bankName)")
                        .font(.subheadline)
                        .foregroundColor(textMuted)
                }

                Spacer()

                Text(cheque.status)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(cheque.status == "Cleared" ? Color.green.opacity(0.15) : cheque.status == "Bounced" ? Color.red.opacity(0.15) : Color.orange.opacity(0.15))
                    .foregroundColor(cheque.status == "Cleared" ? .green : cheque.status == "Bounced" ? .red : .orange)
                    .cornerRadius(8)
            }

            Divider()

            HStack {
                Text("Issue: \(cheque.issueDate)")
                    .font(.caption)
                    .foregroundColor(textMuted)

                Spacer()

                Text("₹\(Int(cheque.amount))")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(textPrimary)

                HStack(spacing: 8) {
                    Button(action: onEdit) {
                        Image(systemName: "pencil")
                            .font(.caption)
                            .foregroundColor(primaryBlue)
                            .frame(width: 30, height: 30)
                            .background(primaryBlue.opacity(0.1))
                            .clipShape(Circle())
                    }
                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .font(.caption)
                            .foregroundColor(errorRed)
                            .frame(width: 30, height: 30)
                            .background(Color(red: 254/255, green: 242/255, blue: 242/255))
                            .clipShape(Circle())
                    }
                }
            }

            if cheque.status.caseInsensitiveCompare("Pending") == .orderedSame {
                HStack(spacing: 8) {
                    Button(action: onClearStatus) {
                        Text("✓ Clear")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(Color.green)
                            .frame(maxWidth: .infinity, minHeight: 32)
                            .background(Color.green.opacity(0.1))
                            .cornerRadius(8)
                    }

                    Button(action: onBounceStatus) {
                        Text("✕ Bounce")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(errorRed)
                            .frame(maxWidth: .infinity, minHeight: 32)
                            .background(errorRed.opacity(0.1))
                            .cornerRadius(8)
                    }
                }
            }
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }
}

struct IOSChequeFormSheet: View {
    var editingCheque: ChequeIOSItem?
    var onSave: (String, String, String, Double, String, String, String, String, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var chequeNo: String = ""
    @State private var partyName: String = ""
    @State private var bankName: String = ""
    @State private var amount: String = ""
    @State private var direction: String = "Inward"
    @State private var issueDate: Date = Date()
    @State private var dueDate: Date = Date()
    @State private var status: String = "Pending"
    @State private var notes: String = ""
    @State private var errorMsg: String? = nil

    private let dateFormatter: DateFormatter = {
        let df = DateFormatter()
        df.dateFormat = "dd MMM yyyy"
        return df
    }()

    var body: some View {
        NavigationView {
            Form {
                if let err = errorMsg {
                    Section {
                        Text("⚠️ \(err)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                    }
                }

                Section(header: Text("Cheque Information")) {
                    TextField("Party / Company Name *", text: $partyName)
                    TextField("Cheque Number", text: $chequeNo)
                    TextField("Bank Name", text: $bankName)
                    TextField("Amount (₹) *", text: $amount)
                        .keyboardType(.decimalPad)
                }

                Section(header: Text("Dates")) {
                    DatePicker("Issue Date *", selection: $issueDate, displayedComponents: .date)
                    DatePicker("Due Date", selection: $dueDate, displayedComponents: .date)
                }

                Section(header: Text("Details")) {
                    Picker("Direction", selection: $direction) {
                        Text("Inward").tag("Inward")
                        Text("Outward").tag("Outward")
                    }
                    Picker("Status", selection: $status) {
                        Text("Pending").tag("Pending")
                        Text("Cleared").tag("Cleared")
                        Text("Bounced").tag("Bounced")
                    }
                    TextField("Notes / Ref", text: $notes)
                }
            }
            .navigationBarTitle(editingCheque != null ? "Edit Cheque" : "Add New Cheque", displayMode: .inline)
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    let amtNum = Double(amount) ?? 0.0
                    if partyName.trimmingCharacters(in: .whitespaces).isEmpty || amtNum <= 0 {
                        errorMsg = "Party Name and valid Amount are required."
                    } else if dueDate < issueDate {
                        errorMsg = "Due Date cannot be earlier than Issue Date."
                    } else {
                        let issueStr = dateFormatter.string(from: issueDate)
                        let dueStr = dateFormatter.string(from: dueDate)
                        onSave(chequeNo.isEmpty ? "CHQ-2023-0895" : chequeNo, partyName, bankName.isEmpty ? "HDFC Bank" : bankName, amtNum, direction, issueStr, dueStr, status, notes)
                    }
                }
            )
            .onAppear {
                if let c = editingCheque {
                    chequeNo = c.chequeNo
                    partyName = c.partyName
                    bankName = c.bankName
                    amount = String(c.amount)
                    direction = c.direction
                    if let parsedIssue = dateFormatter.date(from: c.issueDate) {
                        issueDate = parsedIssue
                    }
                    if let parsedDue = dateFormatter.date(from: c.dueDate) {
                        dueDate = parsedDue
                    }
                    status = c.status
                    notes = c.notes
                }
            }
        }
    }
}
