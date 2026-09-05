import SwiftUI

struct IOSSalesScreen: View {
    @State private var selectedTab = 0
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }
    private var bgApp: Color { isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color(red: 248/255, green: 250/255, blue: 252/255) }

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

    private let categories = ["All", "Textiles", "Hardware", "Electronics", "General"]

    private let products = [
        IOSProduct(id: "p1", name: "Cotton Suit Fabric 5m", sku: "TEX-001", category: "Textiles", price: 1850, stock: 45),
        IOSProduct(id: "p2", name: "Denim Jeans Material Roll", sku: "TEX-002", category: "Textiles", price: 4200, stock: 12),
        IOSProduct(id: "p3", name: "Silk Sarees Wholesale Pack", sku: "TEX-003", category: "Textiles", price: 12500, stock: 8)
    ]

    var filteredProducts: [IOSProduct] {
        products.filter { p in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            let matchesSearch = q.isEmpty || p.name.lowercased().contains(q) || p.sku.lowercased().contains(q)
            let matchesCat = selectedCategory == "All" || p.category == selectedCategory
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

                // PRODUCT GRID
                ScrollView {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        ForEach(filteredProducts) { product in
                            VStack(alignment: .leading, spacing: 6) {
                                Text(product.name)
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                    .lineLimit(2)

                                Text(product.stock <= 0 ? "Stock Khatam" : "Stock: \(product.stock)")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(product.stock <= 0 ? .red : .green)

                                Spacer()

                                HStack {
                                    Text("₹\(Int(product.price))")
                                        .font(.subheadline)
                                        .fontWeight(.bold)

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
                            .background(Color.white)
                            .cornerRadius(12)
                            .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
                        }
                    }
                    .padding(16)
                }
            }

            // FLOATING CART BUTTON
            if totalCartCount > 0 {
                Button(action: { showCartSheet = true }) {
                    HStack(spacing: 8) {
                        Image(systemName: "cart.fill")
                        Text("\(totalCartCount) Items • ₹\(Int(subtotal))")
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
        .sheet(isPresented: $showCartSheet) {
            VStack(spacing: 16) {
                HStack {
                    Text("Cart Summary").font(.headline).fontWeight(.bold)
                    Spacer()
                    Button("Close") { showCartSheet = false }
                }
                .padding(.top, 16)

                Divider()

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
                    Text("₹\(Int(subtotal))").font(.title3).fontWeight(.bold).foregroundColor(.blue)
                }

                Button(action: {
                    cart.removeAll()
                    showCartSheet = false
                    successMsg = "Sale completed successfully!"
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
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                HStack {
                    Text("Recent Transactions").font(.headline).fontWeight(.bold)
                    Spacer()
                }

                VStack(spacing: 10) {
                    IOSInvoiceRow(inv: "INV-2026-001", customer: "Ramesh Textiles", date: "Today, 02:30 PM", amount: "₹3,780", mode: "UPI")
                    IOSInvoiceRow(inv: "INV-2026-002", customer: "Sharma Hardware", date: "Today, 11:15 AM", amount: "₹1,995", mode: "Cash")
                    IOSInvoiceRow(inv: "INV-2026-003", customer: "Walk-in Customer", date: "Yesterday, 04:45 PM", amount: "₹997", mode: "Card")
                }
            }
            .padding(16)
        }
        .background(Color(red: 248/255, green: 250/255, blue: 252/255))
    }
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
