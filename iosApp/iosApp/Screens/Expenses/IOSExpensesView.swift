import SwiftUI

struct IOSExpensesView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Expenses",
            onNavigateSection: onNavigateSection
        ) {
            IOSExpensesContentView()
        }
    }
}

struct IOSExpenseItem: Identifiable {
    let id: String
    var date: String
    var category: String
    var amount: Double
    var paymentMode: String
    var paidTo: String
    var description: String
}

struct IOSExpensesContentView: View {
    @State private var expenses: [IOSExpenseItem] = [
        IOSExpenseItem(
            id: "EXP-101",
            date: "14 Jun 2026",
            category: "Rent",
            amount: 1200.0,
            paymentMode: "Cash",
            paidTo: "haan",
            description: "tatu"
        ),
        IOSExpenseItem(
            id: "EXP-102",
            date: "14 Jun 2026",
            category: "Electricity",
            amount: 600.0,
            paymentMode: "UPI",
            paidTo: "haan",
            description: "—"
        ),
        IOSExpenseItem(
            id: "EXP-103",
            date: "28 Aug 2026",
            category: "Office Supplies",
            amount: 450.0,
            paymentMode: "UPI",
            paidTo: "Stationery Mart",
            description: "Printer paper rim & invoice books"
        ),
        IOSExpenseItem(
            id: "EXP-104",
            date: "29 Aug 2026",
            category: "Tea & Snacks",
            amount: 120.0,
            paymentMode: "Cash",
            paidTo: "Tea Corner",
            description: "Staff daily refreshments"
        )
    ]

    @State private var searchQuery = ""
    @State private var showFormSheet = false
    @State private var editingExpense: IOSExpenseItem? = nil
    @State private var deletingExpense: IOSExpenseItem? = nil
    @State private var showDeleteAlert = false
    @State private var toastMsg: String? = nil

    var filteredExpenses: [IOSExpenseItem] {
        let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        if q.isEmpty { return expenses }
        return expenses.filter { e in
            e.category.lowercased().contains(q) ||
            e.paidTo.lowercased().contains(q) ||
            e.description.lowercased().contains(q) ||
            e.paymentMode.lowercased().contains(q)
        }
    }

    var todayTotal: Double {
        expenses.filter { $0.date.contains("29 Aug") || $0.date.contains("2026-08-29") }.reduce(0) { $0 + $1.amount }
    }

    var monthTotal: Double {
        expenses.filter { $0.date.contains("Aug") || $0.date.contains("Jun") }.reduce(0) { $0 + $1.amount }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Color(red: 248/255, green: 250/255, blue: 252/255).ignoresSafeArea()

            VStack(spacing: 14) {
                // SUMMARY CARDS ROW
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Today's")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("₹\(Int(todayTotal))")
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
                        Text("This Month")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("₹\(Int(monthTotal))")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Total Records")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("\(expenses.count)")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.orange)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search category, paid to or description...", text: $searchQuery)
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

                // EXPENSES LIST
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(filteredExpenses) { expense in
                            IOSExpenseCard(
                                expense: expense,
                                onEdit: {
                                    editingExpense = expense
                                    showFormSheet = true
                                },
                                onDelete: {
                                    deletingExpense = expense
                                    showDeleteAlert = true
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
                editingExpense = nil
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
            IOSExpenseFormSheet(
                expense: editingExpense,
                onSave: { date, category, amount, mode, paidTo, desc in
                    if let target = editingExpense, let idx = expenses.firstIndex(where: { $0.id == target.id }) {
                        expenses[idx].date = date
                        expenses[idx].category = category
                        expenses[idx].amount = amount
                        expenses[idx].paymentMode = mode
                        expenses[idx].paidTo = paidTo
                        expenses[idx].description = desc
                        toastMsg = "Expense '\(category)' updated"
                    } else {
                        let newE = IOSExpenseItem(
                            id: "EXP-\(100 + expenses.count + 1)",
                            date: date,
                            category: category,
                            amount: amount,
                            paymentMode: mode,
                            paidTo: paidTo,
                            description: desc
                        )
                        expenses.insert(newE, at: 0)
                        toastMsg = "Expense '\(category)' recorded"
                    }
                    showFormSheet = false
                }
            )
        }
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Delete Expense"),
                message: Text("Are you sure you want to delete expense '\(deletingExpense?.category ?? "")' (₹\(Int(deletingExpense?.amount ?? 0)))?"),
                primaryButton: .destructive(Text("Delete")) {
                    if let target = deletingExpense {
                        expenses.removeAll { $0.id == target.id }
                        toastMsg = "Expense '\(target.category)' deleted"
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSExpenseCard: View {
    let expense: IOSExpenseItem
    var onEdit: () -> Void
    var onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(expense.category)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                Spacer()
                Text("₹\(Int(expense.amount))")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.red)
            }

            HStack {
                Text(expense.date)
                    .font(.caption)
                    .foregroundColor(.gray)
                Spacer()
                Text(expense.paymentMode)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.blue.opacity(0.12))
                    .foregroundColor(.blue)
                    .cornerRadius(6)
            }

            if !expense.paidTo.isEmpty || !expense.description.isEmpty {
                Divider()
                if !expense.paidTo.isEmpty {
                    Text("Paid To: \(expense.paidTo)")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                }
                if !expense.description.isEmpty {
                    Text(expense.description)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }

            Divider()

            HStack {
                Spacer()
                HStack(spacing: 8) {
                    Button(action: onEdit) {
                        HStack(spacing: 4) {
                            Image(systemName: "pencil")
                            Text("Edit")
                        }
                        .font(.caption)
                        .fontWeight(.bold)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                        .cornerRadius(6)
                    }

                    Button(action: onDelete) {
                        HStack(spacing: 4) {
                            Image(systemName: "trash.fill")
                            Text("Delete")
                        }
                        .font(.caption)
                        .fontWeight(.bold)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.red.opacity(0.1))
                        .foregroundColor(.red)
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

struct IOSExpenseFormSheet: View {
    var expense: IOSExpenseItem?
    var onSave: (String, String, Double, String, String, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var date = "29 Aug 2026"
    @State private var category = "Rent"
    @State private var amount = ""
    @State private var paymentMode = "Cash"
    @State private var paidTo = ""
    @State private var description = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Expense Details")) {
                    TextField("Expense Date *", text: $date)

                    Picker("Category *", selection: $category) {
                        Text("Rent").tag("Rent")
                        Text("Electricity").tag("Electricity")
                        Text("Office Supplies").tag("Office Supplies")
                        Text("Fuel").tag("Fuel")
                        Text("Tea & Snacks").tag("Tea & Snacks")
                        Text("Maintenance").tag("Maintenance")
                        Text("Salaries").tag("Salaries")
                        Text("Other").tag("Other")
                    }

                    TextField("Amount (₹) *", text: $amount)
                        .keyboardType(.decimalPad)

                    Picker("Payment Mode *", selection: $paymentMode) {
                        Text("Cash").tag("Cash")
                        Text("UPI").tag("UPI")
                        Text("Bank Transfer").tag("Bank Transfer")
                        Text("Card").tag("Card")
                        Text("Other").tag("Other")
                    }
                }

                Section(header: Text("Additional Information")) {
                    TextField("Paid To (Optional)", text: $paidTo)
                    TextEditor(text: $description)
                        .frame(minHeight: 80)
                }
            }
            .navigationTitle(expense == nil ? "Add Expense" : "Edit Expense")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    let amt = Double(amount) ?? 0.0
                    onSave(date, category, amt, paymentMode, paidTo, description)
                }.disabled(date.trimmingCharacters(in: .whitespaces).isEmpty || category.trimmingCharacters(in: .whitespaces).isEmpty || (Double(amount) ?? 0) <= 0)
            )
            .onAppear {
                if let e = expense {
                    date = e.date
                    category = e.category
                    amount = "\(Int(e.amount))"
                    paymentMode = e.paymentMode
                    paidTo = e.paidTo
                    description = e.description
                }
            }
        }
    }
}
