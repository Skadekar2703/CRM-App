import SwiftUI

struct IOSDaagView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Daag",
            onNavigateSection: onNavigateSection
        ) {
            IOSDaagContentView()
        }
    }
}

struct IOSStockMovementItem: Identifiable {
    let id: String
    var date: String
    var direction: String // "IN" or "OUT"
    var item: String
    var quantity: String
    var amount: Double
    var supplier: String
    var transport: String
    var status: String // "Complete", "Pending", "In Transit", "Cancelled"
}

struct IOSDaagContentView: View {
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }
    private var bgApp: Color { isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color(red: 248/255, green: 250/255, blue: 252/255) }
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 15/255, green: 23/255, blue: 42/255) }

    @State private var movements: [IOSStockMovementItem] = []

    @State private var searchQuery = ""
    @State private var selectedFilterChip = "All Movements" // "All Movements", "Received", "Dispatched"
    @State private var showFormSheet = false
    @State private var editingMovement: IOSStockMovementItem? = nil
    @State private var deletingMovement: IOSStockMovementItem? = nil
    @State private var showDeleteAlert = false
    @State private var toastMsg: String? = nil

    func fetchMovements() {
        SupabaseIOSClient.shared.fetchTable(table: "stock_movements") { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let items):
                    self.movements = items.map { item in
                        IOSStockMovementItem(
                            id: item["id"] as? String ?? UUID().uuidString,
                            date: item["date"] as? String ?? item["created_at"] as? String ?? "Recent",
                            direction: item["direction"] as? String ?? "IN",
                            item: item["item_name"] as? String ?? "Item",
                            quantity: item["quantity"] as? String ?? "1 qty",
                            amount: (item["amount"] as? NSNumber)?.doubleValue ?? 0.0,
                            supplier: item["supplier"] as? String ?? "—",
                            transport: item["transport"] as? String ?? "—",
                            status: item["status"] as? String ?? "Complete"
                        )
                    }
                case .failure:
                    self.movements = []
                }
            }
        }
    }

    var filteredMovements: [IOSStockMovementItem] {
        movements.filter { m in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            let matchesQuery = q.isEmpty || m.id.lowercased().contains(q) || m.item.lowercased().contains(q) || m.supplier.lowercased().contains(q) || m.transport.lowercased().contains(q)

            let matchesChip: Bool
            switch selectedFilterChip {
            case "Received":
                matchesChip = m.direction.caseInsensitiveCompare("IN") == .orderedSame
            case "Dispatched":
                matchesChip = m.direction.caseInsensitiveCompare("OUT") == .orderedSame
            default:
                matchesChip = true
            }

            return matchesQuery && matchesChip
        }
    }

    var totalIn: Int {
        movements.filter { $0.direction.caseInsensitiveCompare("IN") == .orderedSame }.count
    }

    var totalOut: Int {
        movements.filter { $0.direction.caseInsensitiveCompare("OUT") == .orderedSame }.count
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Color(red: 248/255, green: 250/255, blue: 252/255).ignoresSafeArea()

            VStack(spacing: 14) {
                // TOP SUMMARY CARDS: TOTAL IN & TOTAL OUT
                HStack(spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Total In")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.gray)
                            Text("\(totalIn) Received")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.green)
                        }
                        Spacer()
                        ZStack {
                            Circle()
                                .fill(Color.green.opacity(0.15))
                                .frame(width: 36, height: 36)
                            Text("↓")
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(.green)
                        }
                    }
                    .padding(12)
                    .background(cardBg)
                    .cornerRadius(14)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)

                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Total Out")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.gray)
                            Text("\(totalOut) Dispatched")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                        }
                        Spacer()
                        ZStack {
                            Circle()
                                .fill(Color.blue.opacity(0.15))
                                .frame(width: 36, height: 36)
                            Text("↑")
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                        }
                    }
                    .padding(12)
                    .background(cardBg)
                    .cornerRadius(14)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)

                // SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search movements...", text: $searchQuery)
                }
                .padding(10)
                .background(cardBg)
                .cornerRadius(10)
                .padding(.horizontal, 16)

                // FILTER CHIPS ROW
                HStack(spacing: 8) {
                    ForEach(["All Movements", "Received", "Dispatched"], id: \.self) { chip in
                        let isSelected = selectedFilterChip == chip
                        Text(chip)
                            .font(.caption)
                            .fontWeight(isSelected ? .bold : .medium)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 7)
                            .background(isSelected ? Color.blue : Color.white)
                            .foregroundColor(isSelected ? .white : Color(red: 30/255, green: 41/255, blue: 59/255))
                            .cornerRadius(20)
                            .overlay(
                                RoundedRectangle(cornerRadius: 20)
                                    .stroke(isSelected ? Color.blue : Color(red: 203/255, green: 213/255, blue: 225/255), lineWidth: 1)
                            )
                            .onTapGesture {
                                selectedFilterChip = chip
                            }
                    }
                    Spacer()
                }
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

                // MOVEMENT CARDS LIST
                ScrollView {
                    LazyVStack(spacing: 14) {
                        ForEach(filteredMovements) { movement in
                            IOSStockMovementCard(
                                movement: movement,
                                onEdit: {
                                    editingMovement = movement
                                    showFormSheet = true
                                },
                                onDelete: {
                                    deletingMovement = movement
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
                editingMovement = nil
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
        .onAppear {
            fetchMovements()
        }
        .sheet(isPresented: $showFormSheet) {
            IOSMovementFormSheet(
                movement: editingMovement,
                onSave: { direction, item, quantity, amount, supplier, transport, status, date in
                    let payload: [String: Any] = [
                        "direction": direction,
                        "item_name": item,
                        "quantity": quantity,
                        "amount": amount,
                        "supplier": supplier,
                        "transport": transport,
                        "status": status,
                        "date": date
                    ]
                    if let target = editingMovement {
                        SupabaseIOSClient.shared.insertRecord(table: "stock_movements", payload: payload) { _ in
                            self.fetchMovements()
                        }
                        toastMsg = "Movement updated"
                    } else {
                        SupabaseIOSClient.shared.insertRecord(table: "stock_movements", payload: payload) { _ in
                            self.fetchMovements()
                        }
                        toastMsg = "Movement recorded"
                    }
                    showFormSheet = false
                }
            )
        }
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Delete Movement"),
                message: Text("Are you sure you want to delete movement '\(deletingMovement?.id ?? "")'?"),
                primaryButton: .destructive(Text("Delete")) {
                    if let target = deletingMovement {
                        SupabaseIOSClient.shared.deleteRecord(table: "stock_movements", id: target.id) { _ in
                            self.fetchMovements()
                        }
                        toastMsg = "Movement deleted"
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSStockMovementCard: View {
    let movement: IOSStockMovementItem
    var onEdit: () -> Void
    var onDelete: () -> Void

    var isIn: Bool {
        movement.direction.caseInsensitiveCompare("IN") == .orderedSame
    }

    var statusColors: (bg: Color, text: Color) {
        switch movement.status {
        case "Complete":
            return (Color.green.opacity(0.15), Color.green)
        case "Pending":
            return (Color.orange.opacity(0.15), Color.orange)
        case "In Transit":
            return (Color.blue.opacity(0.15), Color.blue)
        default:
            return (Color.gray.opacity(0.15), Color.gray)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // ITEM NAME, ID, DIRECTION BADGE
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(movement.item)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                    Text(movement.id)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.gray)
                }

                Spacer()

                Text(isIn ? "IN (Received)" : "OUT (Dispatched)")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(isIn ? Color.green.opacity(0.15) : Color.blue.opacity(0.15))
                    .foregroundColor(isIn ? .green : .blue)
                    .cornerRadius(8)
            }

            // QTY, AMOUNT, STATUS, DATE
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Qty: \(movement.quantity)")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                    if movement.amount > 0 {
                        Text("Amount: ₹\(Int(movement.amount))")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(movement.status)
                        .font(.caption2)
                        .fontWeight(.bold)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(statusColors.bg)
                        .foregroundColor(statusColors.text)
                        .cornerRadius(12)

                    Text(movement.date)
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
            }

            // SUPPLIER & TRANSPORT
            if movement.supplier != "—" || movement.transport != "—" {
                Divider()
                HStack {
                    if movement.supplier != "—" {
                        Label(movement.supplier, systemImage: "building.2")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    Spacer()
                    if movement.transport != "—" {
                        Label(movement.transport, systemImage: "shippingbox")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
            }

            Divider()

            // ACTIONS: EDIT & DELETE
            HStack {
                Spacer()

                HStack(spacing: 8) {
                    Button(action: onEdit) {
                        HStack(spacing: 4) {
                            Image(systemName: "pencil")
                            Text("Edit")
                        Image(systemName: "pencil")
                            .font(.caption)
                            .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                            .padding(6)
                            .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                            .cornerRadius(6)
                    }

                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding(6)
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(6)
                    }
                }
            }
        }
        .padding(16)
        .background(cardBg)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

struct IOSMovementFormSheet: View {
    var movement: IOSStockMovementItem?
    var onSave: (String, String, String, Double, String, String, String, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var direction = "IN"
    @State private var item = ""
    @State private var quantity = ""
    @State private var amount = "0"
    @State private var supplier = ""
    @State private var transport = ""
    @State private var status = "Pending"
    @State private var date = "Today"

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Movement Direction")) {
                    Picker("Direction", selection: $direction) {
                        Text("IN (Received)").tag("IN")
                        Text("OUT (Dispatched)").tag("OUT")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }

                Section(header: Text("Movement Details")) {
                    TextField("Item Name *", text: $item)
                    TextField("Quantity (e.g. 2 bora)", text: $quantity)
                    TextField("Amount (₹)", text: $amount)
                        .keyboardType(.numberPad)
                    TextField("Supplier (Optional)", text: $supplier)
                    TextField("Transport (Optional)", text: $transport)
                    TextField("Date", text: $date)
                }

                Section(header: Text("Status")) {
                    Picker("Status", selection: $status) {
                        Text("Complete").tag("Complete")
                        Text("Pending").tag("Pending")
                        Text("In Transit").tag("In Transit")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
            }
            .navigationTitle(movement == nil ? "Add Movement" : "Edit Movement")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    let amt = Double(amount) ?? 0.0
                    onSave(direction, item, quantity, amt, supplier, transport, status, date)
                }.disabled(item.trimmingCharacters(in: .whitespaces).isEmpty)
            )
            .onAppear {
                if let m = movement {
                    direction = m.direction
                    item = m.item
                    quantity = m.quantity
                    amount = "\(Int(m.amount))"
                    supplier = m.supplier == "—" ? "" : m.supplier
                    transport = m.transport == "—" ? "" : m.transport
                    status = m.status
                    date = m.date
                }
            }
        }
    }
}
