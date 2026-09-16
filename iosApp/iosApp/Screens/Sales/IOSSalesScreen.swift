import SwiftUI

struct IOSSalesScreen: View {
    @State private var selectedTab = 0
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }

    var body: some View {
        VStack(spacing: 0) {
            Picker("Sales Section", selection: $selectedTab) {
                Text("NEW SALE (POS)").tag(0)
                Text("SALES HISTORY").tag(1)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(cardBg)

            Divider()

            if selectedTab == 0 {
                IOSPosView()
            } else {
                IOSSalesHistoryView()
            }
        }
    }
}

struct IOSCustomerOption: Identifiable {
    let id: String
    let name: String
}

struct IOSPosView: View {
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }
    private var bgApp: Color { isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color(red: 248/255, green: 250/255, blue: 252/255) }
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 15/255, green: 23/255, blue: 42/255) }

    @State private var searchQuery = ""
    @State private var selectedCategory = "All"
    @State private var cart: [IOSCartItem] = []
    @State private var paymentMethod = "Cash"
    @State private var showCartSheet = false
    @State private var successMsg: String? = nil
    @State private var errorMsg: String? = nil
    @State private var products: [IOSProduct] = []
    @State private var customers: [IOSCustomerOption] = []
    @State private var selectedCustomerId: String = ""
    @State private var categories: [String] = ["All"]
    @State private var isLoading = true

    func loadCatalogData() {
        isLoading = true
        SupabaseIOSClient.shared.fetchItems { result in
            DispatchQueue.main.async {
                self.isLoading = false
                if case .success(let items) = result {
                    self.products = items.map { dict in
                        IOSProduct(
                            id: dict["id"] as? String ?? UUID().uuidString,
                            name: dict["name"] as? String ?? "Product",
                            sku: dict["sku"] as? String ?? dict["code"] as? String ?? "SKU",
                            category: dict["category"] as? String ?? "General",
                            price: (dict["price"] as? NSNumber)?.doubleValue ?? 0.0,
                            stock: (dict["stock_quantity"] as? NSNumber)?.intValue ?? 0
                        )
                    }
                    let cats = Set(self.products.map { $0.category })
                    self.categories = ["All"] + Array(cats).sorted()
                }
            }
        }

        SupabaseIOSClient.shared.fetchTable(table: "customers") { result in
            DispatchQueue.main.async {
                if case .success(let custs) = result {
                    self.customers = custs.map { c in
                        IOSCustomerOption(id: "\(c["id"] ?? "")", name: c["name"] as? String ?? "Customer")
                    }
                    if let first = self.customers.first {
                        self.selectedCustomerId = first.id
                    }
                }
            }
        }
    }

    var filteredProducts: [IOSProduct] {
        products.filter { p in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            let matchesSearch = q.isEmpty || p.name.lowercased().contains(q) || p.sku.lowercased().contains(q)
            let matchesCat = selectedCategory == "All" || p.category.caseInsensitiveCompare(selectedCategory) == .orderedSame
            return matchesSearch && matchesCat
        }
    }

    var totalCartCount: Int {
        cart.reduce(0) { $0 + $1.quantity }
    }

    var totalCartAmount: Double {
        cart.reduce(0) { $0 + ($1.product.price * Double($1.quantity)) }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            bgApp.ignoresSafeArea()

            VStack(spacing: 12) {
                // SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search items by name...", text: $searchQuery)
                        .foregroundColor(textPrimary)
                }
                .padding(10)
                .background(cardBg)
                .cornerRadius(10)
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // CATEGORIES
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(categories, id: \.self) { cat in
                            Button(action: { selectedCategory = cat }) {
                                Text(cat)
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(selectedCategory == cat ? Color.blue : cardBg)
                                    .foregroundColor(selectedCategory == cat ? .white : textPrimary)
                                    .cornerRadius(20)
                                    .overlay(Capsule().stroke(Color.gray.opacity(0.3), lineWidth: 1))
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                }

                if let msg = successMsg {
                    Text("✓ \(msg)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(Color.green)
                        .padding(10)
                        .frame(maxWidth: .infinity)
                        .background(Color.green.opacity(0.1))
                        .cornerRadius(8)
                        .padding(.horizontal, 16)
                }

                if let err = errorMsg {
                    Text("⚠️ \(err)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(Color.red)
                        .padding(10)
                        .frame(maxWidth: .infinity)
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(8)
                        .padding(.horizontal, 16)
                }

                // PRODUCT GRID
                ScrollView {
                    if isLoading {
                        ProgressView("Loading Products...")
                            .padding(40)
                    } else if filteredProducts.isEmpty {
                        VStack(spacing: 8) {
                            Spacer().frame(height: 40)
                            Text("No items found.")
                                .foregroundColor(.gray)
                                .font(.subheadline)
                        }
                        .frame(maxWidth: .infinity)
                    } else {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            ForEach(filteredProducts) { product in
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(product.name)
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .lineLimit(2)
                                        .foregroundColor(textPrimary)

                                    Text(product.stock <= 0 ? "Out of stock" : "Stock: \(product.stock)")
                                        .font(.caption2)
                                        .fontWeight(.bold)
                                        .foregroundColor(product.stock <= 0 ? .red : .green)

                                    Spacer()

                                    HStack {
                                        Text("₹\(Int(product.price))")
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(textPrimary)

                                        Spacer()

                                        Button(action: {
                                            if product.stock > 0 {
                                                if let idx = cart.firstIndex(where: { $0.product.id == product.id }) {
                                                    cart[idx].quantity += 1
                                                } else {
                                                    cart.append(IOSCartItem(product: product, quantity: 1))
                                                }
                                            }
                                        }) {
                                            Text("+ Add")
                                                .font(.caption)
                                                .fontWeight(.bold)
                                                .padding(.horizontal, 10)
                                                .padding(.vertical, 6)
                                                .background(product.stock <= 0 ? Color.gray.opacity(0.3) : Color.blue)
                                                .foregroundColor(.white)
                                                .cornerRadius(6)
                                        }
                                        .disabled(product.stock <= 0)
                                    }
                                }
                                .padding(12)
                                .background(cardBg)
                                .cornerRadius(12)
                                .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
                            }
                        }
                        .padding(16)
                    }
                }
            }

            // FLOATING CART BUTTON
            if totalCartCount > 0 {
                Button(action: { showCartSheet = true }) {
                    HStack(spacing: 8) {
                        Image(systemName: "cart.fill")
                        Text("\(totalCartCount) Items • ₹\(Int(totalCartAmount))")
                            .fontWeight(.bold)
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 14)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(30)
                    .shadow(radius: 6)
                }
                .padding(20)
            }
        }
        .onAppear {
            loadCatalogData()
        }
        .sheet(isPresented: $showCartSheet) {
            VStack(spacing: 16) {
                HStack {
                    Text("Cart Summary").font(.headline).fontWeight(.bold)
                    Spacer()
                    Button("Close") { showCartSheet = false }
                }
                .padding(.top, 16)

                Divider()

                if !customers.isEmpty {
                    Picker("Select Customer", selection: $selectedCustomerId) {
                        ForEach(customers) { c in
                            Text(c.name).tag(c.id)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }

                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(cart.indices, id: \.self) { idx in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(cart[idx].product.name).fontWeight(.bold).font(.subheadline)
                                    Text("₹\(Int(cart[idx].product.price)) × \(cart[idx].quantity)")
                                        .font(.caption).foregroundColor(.secondary)
                                }
                                Spacer()
                                HStack {
                                    Button("-") {
                                        if cart[idx].quantity > 1 {
                                            cart[idx].quantity -= 1
                                        } else {
                                            cart.remove(at: idx)
                                        }
                                    }
                                    .frame(width: 28, height: 28)
                                    .background(Color.gray.opacity(0.1))
                                    .cornerRadius(6)

                                    Text("\(cart[idx].quantity)").fontWeight(.bold)

                                    Button("+") {
                                        cart[idx].quantity += 1
                                    }
                                    .frame(width: 28, height: 28)
                                    .background(Color.gray.opacity(0.1))
                                    .cornerRadius(6)
                                }
                            }
                        }
                    }
                }

                Divider()

                HStack {
                    Text("Total Payable").fontWeight(.bold)
                    Spacer()
                    Text("₹\(Int(totalCartAmount))").font(.title3).fontWeight(.bold).foregroundColor(.blue)
                }

                Button(action: {
                    let customerObj = customers.first(where: { $0.id == selectedCustomerId })
                    let custName = customerObj?.name ?? "Walk-in Customer"

                    let cartItemsPayload: [[String: Any]] = cart.map { item in
                        let isUuid = UUID(uuidString: item.product.id) != nil
                        return [
                            "item_id": isUuid ? item.product.id : NSNull(),
                            "item_name": item.product.name,
                            "sku": item.product.sku,
                            "quantity": item.quantity,
                            "unit_price": item.product.price,
                            "subtotal": item.product.price * Double(item.quantity)
                        ]
                    }

                    SupabaseIOSClient.shared.completeSaleRPC(
                        customerId: selectedCustomerId.isEmpty ? nil : selectedCustomerId,
                        customerName: custName,
                        subtotal: totalCartAmount,
                        discount: 0,
                        tax: 0,
                        total: totalCartAmount,
                        paymentMethod: paymentMethod,
                        cartItems: cartItemsPayload
                    ) { result in
                        DispatchQueue.main.async {
                            switch result {
                            case .success(let resDict):
                                let invNo = resDict["invoice_number"] as? String ?? "INV-\(Int.random(in: 1000...9999))"
                                self.cart.removeAll()
                                self.showCartSheet = false
                                self.successMsg = "Sale completed! Invoice #\(invNo)"
                                self.loadCatalogData()
                            case .failure(let err):
                                self.errorMsg = err.localizedDescription
                            }
                        }
                    }
                }) {
                    Text("Complete Sale")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .cornerRadius(12)
                }
            }
            .padding(20)
        }
    }
}

struct IOSSalesHistoryView: View {
    @State private var salesHistory: [IOSInvoiceRowModel] = []
    @State private var isLoading = true

    func fetchSalesHistory() {
        isLoading = true
        SupabaseIOSClient.shared.fetchTable(table: "sales") { result in
            DispatchQueue.main.async {
                self.isLoading = false
                if case .success(let items) = result {
                    self.salesHistory = items.map { dict in
                        IOSInvoiceRowModel(
                            id: "\(dict["id"] ?? "")",
                            inv: dict["invoice_number"] as? String ?? "INV-\(dict["id"] ?? "")",
                            customer: dict["customer_name"] as? String ?? "Customer",
                            date: dict["created_at"] as? String ?? "Recent",
                            amount: "₹\(Int((dict["total_amount"] as? NSNumber)?.doubleValue ?? 0.0))",
                            mode: dict["payment_method"] as? String ?? "Cash"
                        )
                    }
                }
            }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                HStack {
                    Text("Recent Transactions").font(.headline).fontWeight(.bold)
                    Spacer()
                }

                if isLoading {
                    ProgressView("Loading Sales History...").padding(30)
                } else if salesHistory.isEmpty {
                    Text("No sales history records.").foregroundColor(.secondary).padding(30)
                } else {
                    VStack(spacing: 10) {
                        ForEach(salesHistory) { row in
                            IOSInvoiceRow(inv: row.inv, customer: row.customer, date: row.date, amount: row.amount, mode: row.mode)
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(Color(red: 248/255, green: 250/255, blue: 252/255))
        .onAppear {
            fetchSalesHistory()
        }
    }
}

struct IOSInvoiceRowModel: Identifiable {
    let id: String
    let inv: String
    let customer: String
    let date: String
    let amount: String
    let mode: String
}

struct IOSInvoiceRow: View {
    let inv: String
    let customer: String
    let date: String
    let amount: String
    let mode: String

    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255) }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(inv).font(.subheadline).fontWeight(.bold).foregroundColor(.blue)
                Text(customer).font(.subheadline).fontWeight(.semibold).foregroundColor(textPrimary)
                Text(date).font(.caption).foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(amount).font(.headline).fontWeight(.bold).foregroundColor(textPrimary)
                Text(mode)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.green.opacity(0.12))
                    .foregroundColor(.green)
                    .cornerRadius(4)
            }
        }
        .padding(14)
        .background(cardBg)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }
}

struct IOSProduct: Identifiable {
    let id: String
    let name: String
    let sku: String
    let category: String
    let price: Double
    let stock: Int
}

struct IOSCartItem: Identifiable {
    var id: String { product.id }
    let product: IOSProduct
    var quantity: Int
}
