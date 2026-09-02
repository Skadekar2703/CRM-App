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
    @State private var cheques: [ChequeIOSItem] = [
        ChequeIOSItem(id: "1", chequeNo: "CHQ-2023-0891", partyName: "Acme Corp", bankName: "HDFC Bank", amount: 45000.0, direction: "Inward", issueDate: "Oct 12, 2023", dueDate: "Oct 25, 2023", status: "Pending", notes: "Client payment for Invoice #1024"),
        ChequeIOSItem(id: "2", chequeNo: "CHQ-2023-0892", partyName: "TechSolutions Ltd", bankName: "ICICI Bank", amount: 125000.0, direction: "Inward", issueDate: "Oct 15, 2023", dueDate: "Nov 01, 2023", status: "Cleared", notes: "Annual retainer fee"),
        ChequeIOSItem(id: "3", chequeNo: "CHQ-2023-0893", partyName: "Global Traders", bankName: "SBI", amount: 32000.0, direction: "Outward", issueDate: "Oct 18, 2023", dueDate: "Nov 05, 2023", status: "Bounced", notes: "Vendor advance payment"),
        ChequeIOSItem(id: "4", chequeNo: "CHQ-2023-0894", partyName: "Vanguard Systems", bankName: "Axis Bank", amount: 18500.0, direction: "Inward", issueDate: "Oct 20, 2023", dueDate: "Nov 10, 2023", status: "Pending", notes: "Hardware order payment")
    ]

    @State private var searchQuery: String = ""
    @State private var statusFilter: String = "All"
    @State private var showFormSheet: Bool = false
    @State private var editingCheque: ChequeIOSItem? = nil
    @State private var deletingCheque: ChequeIOSItem? = nil

    private let textPrimary = Color(red: 30/255, green: 41/255, blue: 59/255)
    private let textMuted = Color(red: 100/255, green: 116/255, blue: 139/255)
    private let bgLight = Color(red: 248/255, green: 250/255, blue: 252/255)
    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)

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
                    Text("Cheques")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)

                    // SEARCH & FILTER BAR (MOBILE REF)
                    HStack(spacing: 10) {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(textMuted)
                            TextField("Search cheques...", text: $searchQuery)
                                .font(.subheadline)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(Color.white)
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
                                .background(Color.white)
                                .cornerRadius(12)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(red: 203/255, green: 213/255, blue: 225/255), lineWidth: 1))
                        }
                    }

                    // VERTICAL CHEQUE CARDS LIST (MOBILE REF)
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
    }
}

struct IOSChequeCard: View {
    let cheque: ChequeIOSItem
    var onEdit: () -> Void
    var onDelete: () -> Void

    private let textPrimary = Color(red: 30/255, green: 41/255, blue: 59/255)
    private let textMuted = Color(red: 100/255, green: 116/255, blue: 139/255)
    private let errorRed = Color(red: 220/255, green: 38/255, blue: 38/255)

    var statusColor: (bg: Color, text: Color) {
        switch cheque.status {
        case "Cleared":
            return (Color(red: 220/255, green: 252/255, blue: 231/255), Color(red: 21/255, green: 128/255, blue: 61/255))
        case "Bounced":
            return (Color(red: 254/255, green: 242/255, blue: 242/255), Color(red: 220/255, green: 38/255, blue: 38/255))
        default:
            return (Color(red: 255/255, green: 237/255, blue: 213/255), Color(red: 194/255, green: 65/255, blue: 12/255))
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(cheque.partyName)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)
                    Text("Ref: \(cheque.chequeNo)")
                        .font(.subheadline)
                        .foregroundColor(textMuted)
                }

                Spacer()

                Text(cheque.status)
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(statusColor.bg)
                    .foregroundColor(statusColor.text)
                    .cornerRadius(12)
            }

            Divider()

            HStack {
                Text("Date: \(cheque.issueDate)")
                    .font(.subheadline)
                    .foregroundColor(textMuted)

                Spacer()

                Text("₹\(Int(cheque.amount))")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(textPrimary)

                HStack(spacing: 8) {
                    Button(action: onEdit) {
                        Image(systemName: "pencil")
                            .font(.caption)
                            .foregroundColor(textPrimary)
                            .frame(width: 30, height: 30)
                            .background(Color(red: 241/255, green: 245/255, blue: 249/255))
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
                .padding(.leading, 6)
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
    @State private var issueDate: String = "Oct 12, 2023"
    @State private var dueDate: String = "Oct 25, 2023"
    @State private var status: String = "Pending"
    @State private var notes: String = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Cheque Information")) {
                    TextField("Party / Company Name *", text: $partyName)
                    TextField("Cheque Number", text: $chequeNo)
                    TextField("Bank Name", text: $bankName)
                    TextField("Amount (₹) *", text: $amount)
                        .keyboardType(.decimalPad)
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
                    TextField("Issue Date", text: $issueDate)
                    TextField("Due Date", text: $dueDate)
                    TextField("Notes / Ref", text: $notes)
                }
            }
            .navigationBarTitle(editingCheque != null ? "Edit Cheque" : "Add New Cheque", displayMode: .inline)
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    let amtNum = Double(amount) ?? 45000.0
                    onSave(chequeNo.isEmpty ? "CHQ-2023-0895" : chequeNo, partyName.isEmpty ? "Client" : partyName, bankName.isEmpty ? "HDFC Bank" : bankName, amtNum, direction, issueDate, dueDate, status, notes)
                }
            )
            .onAppear {
                if let c = editingCheque {
                    chequeNo = c.chequeNo
                    partyName = c.partyName
                    bankName = c.bankName
                    amount = String(c.amount)
                    direction = c.direction
                    issueDate = c.issueDate
                    dueDate = c.dueDate
                    status = c.status
                    notes = c.notes
                }
            }
        }
    }
}
