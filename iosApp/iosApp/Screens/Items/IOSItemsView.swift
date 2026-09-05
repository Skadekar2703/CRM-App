import SwiftUI

struct IOSItemsView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Items",
            onNavigateSection: onNavigateSection
        ) {
            IOSItemsContentView()
        }
    }
}

struct IOSItemsContentView: View {
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    @State private var itemsList: [ItemModelIOS] = []

    @State private var searchQuery: String = ""
    @State private var selectedCategory: String = "All"
    @State private var showFormSheet: Bool = false
    @State private var editingItem: ItemModelIOS? = nil
    @State private var deletingItem: ItemModelIOS? = nil

    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255) }
    private var textMuted: Color { isDarkMode ? Color(red: 156/255, green: 163/255, blue: 175/255) : Color(red: 100/255, green: 116/255, blue: 139/255) }
    private var bgLight: Color { isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color(red: 248/255, green: 250/255, blue: 252/255) }
    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }
    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)
    private let errorRed = Color(red: 220/255, green: 38/255, blue: 38/255)

    func fetchItemsFromSupabase() {
        SupabaseIOSClient.shared.fetchItems { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let items):
                    self.itemsList = items.map { dict in
                        ItemModelIOS(
                            id: dict["id"] as? String ?? UUID().uuidString,
                            name: dict["name"] as? String ?? "Product",
                            brand: dict["brand"] as? String ?? "Generic",
                            code: dict["sku"] as? String ?? dict["code"] as? String ?? "SKU-001",
                            category: dict["category"] as? String ?? "General",
                            rate: (dict["price"] as? NSNumber)?.doubleValue ?? 0.0,
                            unit: dict["unit"] as? String ?? "Pcs",
                            stockQuantity: (dict["stock_quantity"] as? NSNumber)?.doubleValue ?? 0.0
                        )
                    }
                case .failure:
                    self.itemsList = []
                }
            }
        }
    }

    var filteredItems: [ItemModelIOS] {
        itemsList.filter { item in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespaces)
            let matchesQuery = q.isEmpty ||
                item.id.lowercased().contains(q) ||
                item.name.lowercased().contains(q) ||
                item.brand.lowercased().contains(q) ||
                item.code.lowercased().contains(q) ||
                item.category.lowercased().contains(q)

            let matchesCat = selectedCategory == "All" || item.category.caseInsensitiveCompare(selectedCategory) == .orderedSame

            return matchesQuery && matchesCat
        }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // SEARCH BAR
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(textMuted)
                        TextField("Search items...", text: $searchQuery)
                    }
                    .padding(12)
                    .background(cardBg)
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(red: 226/255, green: 232/255, blue: 240/255), lineWidth: 1))

                    // ITEMS LIST
                    if filteredItems.isEmpty {
                        VStack(spacing: 8) {
                            Spacer().frame(height: 40)
                            Text("No items found.")
                                .foregroundColor(textMuted)
                                .font(.subheadline)
                        }
                        .frame(maxWidth: .infinity)
                    } else {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredItems) { item in
                                IOSItemCard(
                                    item: item,
                                    onEdit: {
                                        editingItem = item
                                        showFormSheet = true
                                    },
                                    onDelete: {
                                        deletingItem = item
                                    }
                                )
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(bgLight)

            // FAB (+)
            Button(action: {
                editingItem = nil
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
        .onAppear {
            fetchItemsFromSupabase()
        }
        .sheet(isPresented: $showFormSheet) {
            IOSItemFormSheet(
                editingItem: editingItem,
                onSave: { name, brand, code, category, rate, unit, stock in
                    let payload: [String: Any] = [
                        "name": name,
                        "brand": brand,
                        "sku": code,
                        "category": category,
                        "price": rate,
                        "unit": unit,
                        "stock_quantity": stock
                    ]
                    if let existing = editingItem {
                        SupabaseIOSClient.shared.insertRecord(table: "items", payload: payload) { _ in
                            self.fetchItemsFromSupabase()
                        }
                    } else {
                        SupabaseIOSClient.shared.insertRecord(table: "items", payload: payload) { _ in
                            self.fetchItemsFromSupabase()
                        }
                    }
                    showFormSheet = false
                }
            )
        }
        .alert(item: $deletingItem) { target in
            Alert(
                title: Text("Delete Item?"),
                message: Text("Are you sure you want to delete '\(target.name)' (\(target.code))?"),
                primaryButton: .destructive(Text("Delete")) {
                    SupabaseIOSClient.shared.deleteRecord(table: "items", id: target.id) { _ in
                        self.fetchItemsFromSupabase()
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct ItemModelIOS: Identifiable {
    let id: String
    var name: String
    var brand: String
    var code: String
    var category: String
    var rate: Double
    var unit: String
    var stockQuantity: Double
}

struct IOSItemRowCard: View {
    let item: ItemModelIOS
    var onEdit: () -> Void
    var onDelete: () -> Void

    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255) }
    private var textMuted: Color { isDarkMode ? Color(red: 156/255, green: 163/255, blue: 175/255) : Color(red: 100/255, green: 116/255, blue: 139/255) }
    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }
    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)
    private let borderLight = Color(red: 226/255, green: 232/255, blue: 240/255)
    private let errorRed = Color(red: 220/255, green: 38/255, blue: 38/255)

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            ZStack {
                Circle()
                    .fill(primaryBlue.opacity(0.12))
                    .frame(width: 44, height: 44)
                Image(systemName: "shippingbox.fill")
                    .font(.headline)
                    .foregroundColor(primaryBlue)
            }

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(item.name)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)

                    Spacer()

                    Text("₹\(Int(item.rate))/\(item.unit)")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(primaryBlue)
                }

                HStack {
                    Text("\(item.brand) • SKU: \(item.code)")
                        .font(.caption)
                        .foregroundColor(textMuted)

                    Spacer()

                    Text(item.category)
                        .font(.caption2)
                        .fontWeight(.bold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(primaryBlue.opacity(0.12))
                        .foregroundColor(primaryBlue)
                        .cornerRadius(6)
                }

                HStack {
                    Text("Stock: \(Int(item.stockQuantity)) \(item.unit)")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(item.stockQuantity > 10 ? .green : .orange)

                    Spacer()

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
            }
        }
        .padding(16)
        .background(cardBg)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }
}

struct IOSItemFormSheet: View {
    var editingItem: ItemModelIOS?
    var onSave: (String, String, String, String, Double, String, Double) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var name: String = ""
    @State private var brand: String = ""
    @State private var code: String = ""
    @State private var category: String = "Apparel"
    @State private var rate: String = ""
    @State private var unit: String = "Pcs"
    @State private var stock: String = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Item Details")) {
                    TextField("Item Name *", text: $name)
                    TextField("Brand", text: $brand)
                    TextField("Item Code", text: $code)
                    TextField("Category", text: $category)
                }

                Section(header: Text("Pricing & Inventory")) {
                    TextField("Rate (₹) *", text: $rate)
                        .keyboardType(.decimalPad)
                    TextField("Unit (Pcs/Kg)", text: $unit)
                    TextField("Initial Stock Quantity", text: $stock)
                        .keyboardType(.decimalPad)
                }
            }
            .navigationBarTitle(editingItem != null ? "Edit Item" : "Add New Item", displayMode: .inline)
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    let rNum = Double(rate) ?? 500.0
                    let sNum = Double(stock) ?? 50.0
                    onSave(name.isEmpty ? "Item" : name, brand, code, category, rNum, unit.isEmpty ? "Pcs" : unit, sNum)
                }
            )
            .onAppear {
                if let i = editingItem {
                    name = i.name
                    brand = i.brand
                    code = i.code
                    category = i.category
                    rate = String(i.rate)
                    unit = i.unit
                    stock = String(i.stockQuantity)
                }
            }
        }
    }
}
