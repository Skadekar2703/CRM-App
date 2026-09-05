import SwiftUI

struct IOSAgingReportView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Aging Report",
            onNavigateSection: onNavigateSection
        ) {
            IOSAgingReportContentView()
        }
    }
}

struct IOSAgingCustomerItem: Identifiable {
    let id: String
    var customerName: String
    var mobile: String
    var cibilStatus: String // "GOOD", "AVERAGE", "BAD"
    var balance: Double
    var ageDays: Int
    var agingBucket: String
}

struct IOSAgingReportContentView: View {
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }
    private var bgApp: Color { isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color(red: 248/255, green: 250/255, blue: 252/255) }
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 15/255, green: 23/255, blue: 42/255) }

    @State private var searchQuery = ""
    @State private var toastMsg: String? = nil

    @State private var customers: [IOSAgingCustomerItem] = [
        IOSAgingCustomerItem(
            id: "100028",
            customerName: "adil hasan",
            mobile: "9876543218",
            cibilStatus: "BAD",
            balance: 2800.0,
            ageDays: 76,
            agingBucket: "61–90 days"
        ),
        IOSAgingCustomerItem(
            id: "100029",
            customerName: "Adil",
            mobile: "9876543219",
            cibilStatus: "BAD",
            balance: 2000.0,
            ageDays: 75,
            agingBucket: "61–90 days"
        ),
        IOSAgingCustomerItem(
            id: "100015",
            customerName: "Rajesh Kumar",
            mobile: "9811223344",
            cibilStatus: "GOOD",
            balance: 4500.0,
            ageDays: 15,
            agingBucket: "0–30 days"
        ),
        IOSAgingCustomerItem(
            id: "100022",
            customerName: "Sultan Ahmed",
            mobile: "9822334455",
            cibilStatus: "AVERAGE",
            balance: 3200.0,
            ageDays: 45,
            agingBucket: "31–60 days"
        ),
        IOSAgingCustomerItem(
            id: "100035",
            customerName: "Preeti Verma",
            mobile: "9833445566",
            cibilStatus: "BAD",
            balance: 6800.0,
            ageDays: 105,
            agingBucket: "90+ days"
        )
    ]

    var filteredCustomers: [IOSAgingCustomerItem] {
        let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        if q.isEmpty { return customers }
        return customers.filter {
            $0.customerName.lowercased().contains(q) ||
            $0.id.lowercased().contains(q) ||
            $0.mobile.contains(q) ||
            $0.cibilStatus.lowercased().contains(q)
        }
    }

    var bucket0to30: Double {
        customers.filter { $0.ageDays <= 30 }.reduce(0) { $0 + $1.balance }
    }

    var bucket31to60: Double {
        customers.filter { $0.ageDays > 30 && $0.ageDays <= 60 }.reduce(0) { $0 + $1.balance }
    }

    var bucket61to90: Double {
        customers.filter { $0.ageDays > 60 && $0.ageDays <= 90 }.reduce(0) { $0 + $1.balance }
    }

    var bucket90Plus: Double {
        customers.filter { $0.ageDays > 90 }.reduce(0) { $0 + $1.balance }
    }

    var totalOutstanding: Double {
        customers.reduce(0) { $0 + $1.balance }
    }

    var body: some View {
        ZStack {
            bgApp.ignoresSafeArea()

            VStack(spacing: 14) {
                // TOTAL OUTSTANDING CARD
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("TOTAL BAKI")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("₹\(Int(totalOutstanding))")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                        Text("\(customers.count) customers with baki")
                            .font(.caption2)
                            .foregroundColor(.gray)
                    }
                    Spacer()
                }
                .padding(14)
                .background(cardBg)
                .cornerRadius(14)
                .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // SUMMARY BUCKETS GRID
                HStack(spacing: 8) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("0–30d")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("₹\(Int(bucket0to30))")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    }
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(cardBg)
                    .cornerRadius(10)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("31–60d")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("₹\(Int(bucket31to60))")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(cardBg)
                    .cornerRadius(10)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("61–90d")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("₹\(Int(bucket61to90))")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.orange)
                    }
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(cardBg)
                    .cornerRadius(10)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("90+ d")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("₹\(Int(bucket90Plus))")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                    }
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(cardBg)
                    .cornerRadius(10)
                }
                .padding(.horizontal, 16)

                // SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search customer, mobile or status...", text: $searchQuery)
                    if !searchQuery.isEmpty {
                        Button(action: { searchQuery = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding(10)
                .background(cardBg)
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                .padding(.horizontal, 16)

                // CUSTOMER RECEIVABLES AGING LIST
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(filteredCustomers) { cust in
                            IOSAgingCustomerCard(customer: cust)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 80)
                }
            }
        }
    }
}

struct IOSAgingCustomerCard: View {
    let customer: IOSAgingCustomerItem
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255) }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(customer.customerName)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)
                    Text("UID: #\(customer.id) | Mobile: \(customer.mobile)")
                        .font(.caption)
                        .foregroundColor(.gray)
                }

                Spacer()

                Text("CIBIL: \(customer.cibilStatus)")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(customer.cibilStatus == "GOOD" ? Color.green.opacity(0.12) : customer.cibilStatus == "AVERAGE" ? Color.orange.opacity(0.12) : Color.red.opacity(0.12))
                    .foregroundColor(customer.cibilStatus == "GOOD" ? .green : customer.cibilStatus == "AVERAGE" ? .orange : .red)
                    .cornerRadius(6)
            }

            Divider()

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("BALANCE")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                    Text("₹\(Int(customer.balance))")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("AGE: \(customer.ageDays) DAYS")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                    Text(customer.agingBucket)
                        .font(.caption2)
                        .fontWeight(.bold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(customer.ageDays <= 30 ? Color.blue.opacity(0.12) : customer.ageDays <= 60 ? Color.green.opacity(0.12) : customer.ageDays <= 90 ? Color.orange.opacity(0.12) : Color.red.opacity(0.12))
                        .foregroundColor(customer.ageDays <= 30 ? .blue : customer.ageDays <= 60 ? .green : customer.ageDays <= 90 ? .orange : .red)
                        .cornerRadius(6)
                }
            }
        }
        .padding(14)
        .background(cardBg)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}
