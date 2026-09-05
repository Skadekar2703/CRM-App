import SwiftUI

struct IOSCustomersView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Customers",
            onNavigateSection: onNavigateSection
        ) {
            IOSCustomersContentView()
        }
    }
}

struct IOSCustomerItem: Identifiable {
    let id: String
    var customerId: String
    var customerCode: String
    var name: String
    var mobile: String
    var alternateMobile: String = ""
    var email: String = ""
    var idCncNo: String = ""
    var photoUrl: String?
    var cibilStatus: String = "Good"
    var cibilScore: Int = 750
    var category: String = "Customer"
    var creditLimit: Double = 50000.0
    var openingBalance: Double = 0.0
    var taxNo: String = ""
    var udharWapisiDin: Int = 30
    var address: String = ""
    var area: String = "Local Market"
    var remark: String = ""
    var guarantorName: String = ""
    var guarantorMobile: String = ""
    var baki: Double = 0.0
    var jama: Double = 0.0
    var status: String = "Active"
    var creditBlocked: Bool = false
    var transactions: [IOSCustomerTxn] = []

    var outstanding: Double {
        return baki - jama
    }

    var cibilColor: Color {
        switch cibilStatus.lowercased() {
        case "bad": return Color.red
        case "low": return Color.orange
        case "medium", "average": return Color.yellow
        default: return Color.green
        }
    }
}

struct IOSCustomerTxn: Identifiable {
    let id: String
    let date: String
    let type: String
    let amount: Double
    let notes: String
    var runningBalance: Double = 0.0
}

struct IOSCustomersContentView: View {
    @AppStorage("crm_is_dark_mode") private var isDarkMode = false

    private var bgApp: Color { isDarkMode ? Color(red: 11/255, green: 15/255, blue: 25/255) : Color(red: 241/255, green: 245/255, blue: 249/255) }
    private var cardBg: Color { isDarkMode ? Color(red: 30/255, green: 41/255, blue: 59/255) : Color.white }
    private var cardBorder: Color { isDarkMode ? Color(red: 51/255, green: 65/255, blue: 85/255) : Color(red: 226/255, green: 232/255, blue: 240/255) }
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 15/255, green: 23/255, blue: 42/255) }
    private var textMuted: Color { isDarkMode ? Color(red: 148/255, green: 163/255, blue: 184/255) : Color(red: 100/255, green: 116/255, blue: 139/255) }

    @State private var customers: [IOSCustomerItem] = []

    @State private var searchQuery = ""
    @State private var areaFilter = "All"
    @State private var cibilFilter = "All"
    @State private var statusFilter = "All"

    @State private var showFormSheet = false
    @State private var editingCustomer: IOSCustomerItem? = nil
    @State private var profileCustomer: IOSCustomerItem? = nil
    @State private var historyCustomer: IOSCustomerItem? = nil
    @State private var deleteCustomerTarget: IOSCustomerItem? = nil
    @State private var toastMsg: String? = nil
    @State private var userRole: String = "ADMIN"

    func fetchCustomersFromSupabase() {
        SupabaseIOSClient.shared.fetchTable(table: "customers") { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let items):
                    self.customers = items.compactMap { dict in
                        let id = dict["id"] as? String ?? ""
                        let cid = dict["customer_id"] as? String ?? "100001"
                        let ccode = dict["customer_code"] as? String ?? "Cd000000010001"
                        let name = dict["name"] as? String ?? "Customer"
                        let mobile = (dict["phone"] as? String) ?? (dict["mobile"] as? String) ?? ""
                        let altMobile = dict["alternate_mobile"] as? String ?? ""
                        let email = dict["email"] as? String ?? ""
                        let idCnc = dict["id_cnc_no"] as? String ?? ""
                        let photoUrl = dict["photo_url"] as? String
                        let cibilStatus = dict["cibil_status"] as? String ?? "Good"
                        let cibilScore = (dict["cibil_score"] as? Int) ?? 750
                        let category = dict["category"] as? String ?? "Customer"
                        let creditLimit = (dict["credit_limit"] as? Double) ?? 50000.0
                        let openingBal = (dict["opening_balance"] as? Double) ?? 0.0
                        let taxNo = dict["tax_no"] as? String ?? ""
                        let udharDin = (dict["udhar_wapisi_din"] as? Int) ?? 30
                        let address = dict["address"] as? String ?? ""
                        let area = dict["area"] as? String ?? "Local Market"
                        let remark = dict["remark"] as? String ?? ""
                        let gName = dict["guarantor_name"] as? String ?? ""
                        let gMobile = dict["guarantor_mobile"] as? String ?? ""
                        let rawBaki = (dict["baki"] as? Double) ?? 0.0
                        let jama = (dict["jama"] as? Double) ?? 0.0
                        let currentBaki = rawBaki - jama
                        let status = dict["status"] as? String ?? "Active"
                        let creditBlocked = (dict["credit_blocked"] as? Bool) ?? false

                        return IOSCustomerItem(
                            id: id,
                            customerId: cid,
                            customerCode: ccode,
                            name: name,
                            mobile: mobile,
                            alternateMobile: altMobile,
                            email: email,
                            idCncNo: idCnc,
                            photoUrl: photoUrl,
                            cibilStatus: cibilStatus,
                            cibilScore: cibilScore,
                            category: category,
                            creditLimit: creditLimit,
                            openingBalance: openingBal,
                            taxNo: taxNo,
                            udharWapisiDin: udharDin,
                            address: address,
                            area: area,
                            remark: remark,
                            guarantorName: gName,
                            guarantorMobile: gMobile,
                            baki: currentBaki,
                            jama: jama,
                            status: status,
                            creditBlocked: creditBlocked
                        )
                    }
                case .failure(let err):
                    self.toastMsg = "Failed to load customers: \(err.localizedDescription)"
                }
            }
        }
    }

    var filteredCustomers: [IOSCustomerItem] {
        customers.filter { c in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            let matchesQuery = q.isEmpty ||
                c.id.lowercased().contains(q) ||
                c.customerId.lowercased().contains(q) ||
                c.customerCode.lowercased().contains(q) ||
                c.name.lowercased().contains(q) ||
                c.mobile.lowercased().contains(q) ||
                c.area.lowercased().contains(q)

            let matchesArea = areaFilter == "All" || c.area.caseInsensitiveCompare(areaFilter) == .orderedSame
            let matchesCibil = cibilFilter == "All" || c.cibilStatus.caseInsensitiveCompare(cibilFilter) == .orderedSame
            let matchesStatus = statusFilter == "All" || c.status.caseInsensitiveCompare(statusFilter) == .orderedSame

            return matchesQuery && matchesArea && matchesCibil && matchesStatus
        }
    }

    var totalBaki: Double {
        customers.reduce(0) { $0 + $1.baki }
    }

    var activeCount: Int {
        customers.filter { $0.status == "Active" }.count
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            bgApp.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 14) {
                    // TOP SEARCH BAR
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(textMuted)
                        TextField("Search by ID, Name, Mobile, CD Code, Area...", text: $searchQuery)
                            .foregroundColor(textPrimary)
                        if !searchQuery.isEmpty {
                            Button(action: { searchQuery = "" }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(textMuted)
                            }
                        }
                    }
                    .padding(12)
                    .background(cardBg)
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(cardBorder, lineWidth: 1))
                    .padding(.horizontal, 16)
                    .padding(.top, 12)

                    // TOP 3 SUMMARY CARDS
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            IOSCustomerSummaryCard(
                                title: "TOTAL CUSTOMERS",
                                value: "\(customers.count)",
                                subText: "Registered",
                                accentColor: Color.blue
                            )
                            IOSCustomerSummaryCard(
                                title: "ACTIVE CUSTOMERS",
                                value: "\(activeCount)",
                                subText: "In Good Standing",
                                accentColor: Color.green
                            )
                            IOSCustomerSummaryCard(
                                title: "TOTAL BAKI",
                                value: "₹\(Int(totalBaki))",
                                subText: "Total Receivable",
                                accentColor: Color.red
                            )
                        }
                        .padding(.horizontal, 16)
                    }

                    if let msg = toastMsg {
                        Text("✓ \(msg)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(Color.cyan)
                            .padding(10)
                            .frame(maxWidth: .infinity)
                            .background(Color(red: 30/255, green: 41/255, blue: 59/255))
                            .cornerRadius(8)
                            .padding(.horizontal, 16)
                    }

                    // CUSTOMERS LIST
                    LazyVStack(spacing: 14) {
                        ForEach(filteredCustomers) { customer in
                            IOSCustomerCard(
                                customer: customer,
                                onProfile: {
                                    profileCustomer = customer
                                },
                                onHistory: {
                                    historyCustomer = customer
                                },
                                onEdit: {
                                    if userRole == "ADMIN" {
                                        editingCustomer = customer
                                        showFormSheet = true
                                    } else {
                                        toastMsg = "Only Admin can edit customer details."
                                    }
                                },
                                onDelete: {
                                    if userRole == "ADMIN" {
                                        deleteCustomerTarget = customer
                                    } else {
                                        toastMsg = "Only Admin can delete customer details."
                                    }
                                }
                            )
                        }
                    }
                    .padding(.horizontal, 16)
                }
                .padding(.bottom, 90)
            }

            // FAB ADD BUTTON
            Button(action: {
                editingCustomer = nil
                showFormSheet = true
            }) {
                HStack {
                    Image(systemName: "plus")
                    Text("Add Customer")
                        .font(.subheadline)
                        .fontWeight(.bold)
                }
                .foregroundColor(.white)
                .padding(.horizontal, 18)
                .padding(.vertical, 14)
                .background(Color.blue)
                .cornerRadius(28)
                .shadow(radius: 4)
            }
            .padding(20)
        }
        .sheet(isPresented: $showFormSheet) {
            IOSCustomerFormSheet(
                customer: editingCustomer,
                userRole: userRole,
                onSave: { updated in
                    if let target = editingCustomer {
                        var payload: [String: Any] = [
                            "name": updated.name,
                            "phone": updated.mobile,
                            "alternate_mobile": updated.alternateMobile,
                            "email": updated.email,
                            "id_cnc_no": updated.idCncNo,
                            "customer_code": updated.customerCode,
                            "cibil_status": updated.cibilStatus,
                            "cibil_score": updated.cibilScore,
                            "category": updated.category,
                            "credit_limit": updated.creditLimit,
                            "opening_balance": updated.openingBalance,
                            "tax_no": updated.taxNo,
                            "udhar_wapisi_din": updated.udharWapisiDin,
                            "address": updated.address,
                            "area": updated.area,
                            "remark": updated.remark,
                            "guarantor_name": updated.guarantorName,
                            "guarantor_mobile": updated.guarantorMobile,
                            "status": updated.status,
                            "credit_blocked": updated.creditBlocked
                        ]
                        if let photo = updated.photoUrl, !photo.isEmpty { payload["photo_url"] = photo }

                        SupabaseIOSClient.shared.updateRecord(table: "customers", id: target.id, payload: payload) { res in
                            DispatchQueue.main.async {
                                switch res {
                                case .success:
                                    self.toastMsg = "Customer '\(updated.name)' updated successfully"
                                    self.fetchCustomersFromSupabase()
                                case .failure(let err):
                                    self.toastMsg = err.localizedDescription
                                }
                            }
                        }
                    } else {
                        var payload: [String: Any] = [
                            "p_business_id": "00000000-0000-0000-0000-000000000001",
                            "p_customer_id": updated.customerId,
                            "p_customer_code": updated.customerCode,
                            "p_name": updated.name,
                            "p_phone": updated.mobile,
                            "p_alternate_mobile": updated.alternateMobile,
                            "p_email": updated.email,
                            "p_id_cnc_no": updated.idCncNo,
                            "p_cibil_status": updated.cibilStatus,
                            "p_cibil_score": updated.cibilScore,
                            "p_category": updated.category,
                            "p_credit_limit": updated.creditLimit,
                            "p_opening_balance": updated.openingBalance,
                            "p_tax_no": updated.taxNo,
                            "p_udhar_wapisi_din": updated.udharWapisiDin,
                            "p_address": updated.address,
                            "p_area": updated.area,
                            "p_remark": updated.remark,
                            "p_guarantor_name": updated.guarantorName,
                            "p_guarantor_mobile": updated.guarantorMobile,
                            "p_status": updated.status,
                            "p_credit_blocked": updated.creditBlocked
                        ]
                        if let photo = updated.photoUrl, !photo.isEmpty { payload["p_photo_url"] = photo }

                        SupabaseIOSClient.shared.invokeRPC(name: "create_customer_v2", payload: payload) { res in
                            DispatchQueue.main.async {
                                switch res {
                                case .success:
                                    self.toastMsg = "Customer '\(updated.name)' created successfully"
                                    self.fetchCustomersFromSupabase()
                                case .failure(let err):
                                    self.toastMsg = err.localizedDescription
                                }
                            }
                        }
                    }
                    showFormSheet = false
                }
            )
        }
        .sheet(item: $profileCustomer) { customer in
            IOSCustomerProfileSheet(
                customer: customer,
                onEdit: {
                    profileCustomer = nil
                    if userRole == "ADMIN" {
                        editingCustomer = customer
                        showFormSheet = true
                    } else {
                        toastMsg = "Only Admin can edit customer details."
                    }
                },
                onHistory: {
                    profileCustomer = nil
                    historyCustomer = customer
                }
            )
        }
        .sheet(item: $historyCustomer) { customer in
            IOSCustomerHistorySheet(
                customer: customer,
                onAddTx: { type, amount, notes in
                    if let idx = customers.firstIndex(where: { $0.id == customer.id }) {
                        var target = customers[idx]
                        if type == "Baki" {
                            if target.creditBlocked {
                                toastMsg = "Credit is blocked for this customer."
                                return
                            }
                            let currentOut = target.baki - target.jama
                            if currentOut + amount > target.creditLimit {
                                toastMsg = "Udhar exceeds the customer's credit limit."
                                return
                            }
                        }

                        let payload: [String: Any] = [
                            "p_customer_id": target.id,
                            "p_type": type,
                            "p_amount": amount,
                            "p_notes": notes.isEmpty ? "\(type) payment" : notes
                        ]
                        SupabaseIOSClient.shared.invokeFunction(name: "add_udhaari_transaction", payload: payload) { res in
                            DispatchQueue.main.async {
                                switch res {
                                case .success:
                                    self.toastMsg = "\(type) of ₹\(Int(amount)) recorded."
                                    self.fetchCustomersFromSupabase()
                                case .failure(let err):
                                    self.toastMsg = err.localizedDescription
                                }
                            }
                        }
                    }
                }
            )
        }
        .sheet(item: $deleteCustomerTarget) { customer in
            IOSCustomerDeleteSheet(
                customer: customer,
                userRole: userRole,
                onConfirmDelete: {
                    SupabaseIOSClient.shared.deleteRecord(table: "customers", id: customer.id) { res in
                        DispatchQueue.main.async {
                            switch res {
                            case .success:
                                self.toastMsg = "Customer permanently deleted."
                                self.fetchCustomersFromSupabase()
                            case .failure(let err):
                                self.toastMsg = err.localizedDescription
                            }
                        }
                    }
                    deleteCustomerTarget = nil
                }
            )
        }
        .onAppear {
            fetchCustomersFromSupabase()
        }
    }
}

struct IOSCustomerSummaryCard: View {
    let title: String
    let value: String
    let subText: String
    let accentColor: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(Color.gray)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.white)

            HStack(spacing: 4) {
                Circle()
                    .fill(accentColor)
                    .frame(width: 6, height: 6)
                Text(subText)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(accentColor)
            }
        }
        .padding(12)
        .frame(width: 155, height: 90, alignment: .leading)
        .background(Color(red: 30/255, green: 41/255, blue: 59/255))
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(red: 51/255, green: 65/255, blue: 85/255), lineWidth: 1))
    }
}

struct IOSCustomerCard: View {
    let customer: IOSCustomerItem
    var onProfile: () -> Void
    var onHistory: () -> Void
    var onEdit: () -> Void
    var onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // HEADER: PHOTO + NAME + ID + MOBILE + AREA
            HStack(spacing: 12) {
                if let photoStr = customer.photoUrl, let photoUrl = URL(string: photoStr) {
                    AsyncImage(url: photoUrl) { phase in
                        switch phase {
                        case .success(let img):
                            img
                                .resizable()
                                .scaledToFill()
                                .frame(width: 44, height: 44)
                                .clipShape(Circle())
                                .overlay(Circle().stroke(Color.blue, lineWidth: 1.5))
                        case .failure, .empty:
                            Circle()
                                .fill(Color.blue)
                                .frame(width: 44, height: 44)
                                .overlay(
                                    Text(customer.name.prefix(2).uppercased())
                                        .font(.headline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                )
                        @unknown default:
                            Circle()
                                .fill(Color.blue)
                                .frame(width: 44, height: 44)
                        }
                    }
                } else {
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 44, height: 44)
                        .overlay(
                            Text(customer.name.prefix(2).uppercased())
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        )
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(customer.name)
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)

                        Text(customer.category)
                            .font(.caption2)
                            .fontWeight(.bold)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.blue.opacity(0.18))
                            .foregroundColor(.cyan)
                            .cornerRadius(6)
                    }

                    Text("ID: \(customer.customerId) • \(customer.mobile)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.cyan)

                    Text("Area: \(customer.area)")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }

                Spacer()
            }

            Divider().background(Color(red: 51/255, green: 65/255, blue: 85/255))

            // SINGLE LINE CIBIL & CREDIT LIMIT
            HStack {
                HStack(spacing: 6) {
                    Circle()
                        .fill(customer.cibilColor)
                        .frame(width: 8, height: 8)
                    Text("CIBIL: \(customer.cibilStatus)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(customer.cibilColor)
                }

                Spacer()

                Text("Limit: ₹\(Int(customer.creditLimit))")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }

            // BAKI & JAMA BALANCES
            HStack(spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("BAKI")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                    Text("₹\(Int(customer.baki))")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                }
                .padding(8)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(red: 15/255, green: 23/255, blue: 42/255))
                .cornerRadius(8)

                VStack(alignment: .leading, spacing: 2) {
                    Text("JAMA")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                    Text("₹\(Int(customer.jama))")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }
                .padding(8)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(red: 15/255, green: 23/255, blue: 42/255))
                .cornerRadius(8)
            }

            // STATUS & CREDIT BLOCK
            HStack {
                HStack(spacing: 4) {
                    Circle()
                        .fill(customer.status == "Active" ? Color.green : Color.gray)
                        .frame(width: 6, height: 6)
                    Text("Status: \(customer.status)")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(customer.status == "Active" ? .green : .gray)
                }

                Spacer()

                if customer.creditBlocked {
                    Text("🔒 CREDIT BLOCKED")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                }
            }

            // 4 ACTION BUTTONS
            HStack(spacing: 6) {
                Button(action: onProfile) {
                    Text("Profile")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color(red: 51/255, green: 65/255, blue: 85/255))
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }

                Button(action: onHistory) {
                    Text("History")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.purple)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }

                Button(action: onEdit) {
                    Text("Edit")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }

                Button(action: onDelete) {
                    Text("Delete")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.red.opacity(0.2))
                        .foregroundColor(.red)
                        .cornerRadius(8)
                }
            }
        }
        .padding(16)
        .background(Color(red: 30/255, green: 41/255, blue: 59/255))
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color(red: 51/255, green: 65/255, blue: 85/255), lineWidth: 1))
    }
}

// PROFILE SHEET
struct IOSCustomerProfileSheet: View {
    let customer: IOSCustomerItem
    var onEdit: () -> Void
    var onHistory: () -> Void
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 15/255, green: 23/255, blue: 42/255).ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        // HEADER: PHOTO + NAME + ID
                        HStack(spacing: 14) {
                            if let photoStr = customer.photoUrl, let photoUrl = URL(string: photoStr) {
                                AsyncImage(url: photoUrl) { phase in
                                    switch phase {
                                    case .success(let img):
                                        img
                                            .resizable()
                                            .scaledToFill()
                                            .frame(width: 60, height: 60)
                                            .clipShape(Circle())
                                            .overlay(Circle().stroke(Color.blue, lineWidth: 2))
                                    case .failure, .empty:
                                        Circle()
                                            .fill(Color.blue)
                                            .frame(width: 60, height: 60)
                                            .overlay(Text(customer.name.prefix(2).uppercased()).font(.title2).bold().foregroundColor(.white))
                                    @unknown default:
                                        Circle().fill(Color.blue).frame(width: 60, height: 60)
                                    }
                                }
                            } else {
                                Circle()
                                    .fill(Color.blue)
                                    .frame(width: 60, height: 60)
                                    .overlay(Text(customer.name.prefix(2).uppercased()).font(.title2).bold().foregroundColor(.white))
                            }

                            VStack(alignment: .leading, spacing: 4) {
                                Text(customer.name).font(.title2).bold().foregroundColor(.white)
                                Text("ID: \(customer.customerId) • \(customer.customerCode)").font(.caption).bold().foregroundColor(.cyan)
                                Text("Mobile: \(customer.mobile)").font(.caption).foregroundColor(.gray)
                            }
                        }

                        // QUICK ACTION BUTTONS (CALL, WHATSAPP, HISTORY, EDIT)
                        HStack(spacing: 10) {
                            if let url = URL(string: "tel:\(customer.mobile)") {
                                Link(destination: url) {
                                    Text("Call")
                                        .font(.caption).bold()
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 8)
                                        .background(Color(red: 51/255, green: 65/255, blue: 85/255))
                                        .foregroundColor(.white)
                                        .cornerRadius(8)
                                }
                            }
                            if let waUrl = URL(string: "https://api.whatsapp.com/send?phone=91\(customer.mobile)") {
                                Link(destination: waUrl) {
                                    Text("WhatsApp")
                                        .font(.caption).bold()
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 8)
                                        .background(Color.green)
                                        .foregroundColor(.white)
                                        .cornerRadius(8)
                                }
                            }
                            Button(action: onHistory) {
                                Text("History")
                                    .font(.caption).bold()
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 8)
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(8)
                            }
                            Button(action: onEdit) {
                                Text("Edit")
                                    .font(.caption).bold()
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 8)
                                    .background(Color.purple)
                                    .foregroundColor(.white)
                                    .cornerRadius(8)
                            }
                        }

                        Divider().background(Color.gray)

                        // FINANCIAL OVERVIEW
                        HStack(spacing: 8) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("BAKI").font(.caption2).bold().foregroundColor(.red)
                                Text("₹\(Int(customer.baki))").font(.headline).bold().foregroundColor(.red)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(red: 30/255, green: 41/255, blue: 59/255))
                            .cornerRadius(10)

                            VStack(alignment: .leading, spacing: 4) {
                                Text("JAMA").font(.caption2).bold().foregroundColor(.green)
                                Text("₹\(Int(customer.jama))").font(.headline).bold().foregroundColor(.green)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(red: 30/255, green: 41/255, blue: 59/255))
                            .cornerRadius(10)

                            VStack(alignment: .leading, spacing: 4) {
                                Text("LIMIT").font(.caption2).bold().foregroundColor(.cyan)
                                Text("₹\(Int(customer.creditLimit))").font(.headline).bold().foregroundColor(.cyan)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(red: 30/255, green: 41/255, blue: 59/255))
                            .cornerRadius(10)
                        }

                        // 1. PERSONAL INFORMATION
                        VStack(alignment: .leading, spacing: 6) {
                            Text("PERSONAL INFORMATION").font(.caption).bold().foregroundColor(.cyan)
                            IOSDetailRow(label: "Full Name", value: customer.name)
                            IOSDetailRow(label: "Customer ID", value: customer.customerId)
                            IOSDetailRow(label: "Customer Code", value: customer.customerCode)
                            IOSDetailRow(label: "Mobile Number", value: customer.mobile)
                            IOSDetailRow(label: "Alternate Mobile", value: customer.alternateMobile.isEmpty ? "N/A" : customer.alternateMobile)
                            IOSDetailRow(label: "Email Address", value: customer.email.isEmpty ? "N/A" : customer.email)
                        }
                        .padding().background(Color(red: 30/255, green: 41/255, blue: 59/255)).cornerRadius(12)

                        // 2. CREDIT & ACCOUNT INFORMATION
                        VStack(alignment: .leading, spacing: 6) {
                            Text("CREDIT & ACCOUNT INFORMATION").font(.caption).bold().foregroundColor(.cyan)
                            IOSDetailRow(label: "ID / CNC Number", value: customer.idCncNo.isEmpty ? "N/A" : customer.idCncNo)
                            IOSDetailRow(label: "CIBIL Status", value: "\(customer.cibilStatus) (\(customer.cibilScore))")
                            IOSDetailRow(label: "Category", value: customer.category)
                            IOSDetailRow(label: "Credit Limit", value: "₹\(Int(customer.creditLimit))")
                            IOSDetailRow(label: "Opening Balance", value: "₹\(Int(customer.openingBalance))")
                            IOSDetailRow(label: "Tax Number", value: customer.taxNo.isEmpty ? "N/A" : customer.taxNo)
                            IOSDetailRow(label: "Udhar Return Days", value: "\(customer.udharWapisiDin) Days")
                            IOSDetailRow(label: "Account Status", value: customer.status)
                            IOSDetailRow(label: "Credit Blocked", value: customer.creditBlocked ? "YES (BLOCKED)" : "NO")
                        }
                        .padding().background(Color(red: 30/255, green: 41/255, blue: 59/255)).cornerRadius(12)

                        // 3. ADDRESS & LOCATION
                        VStack(alignment: .leading, spacing: 6) {
                            Text("ADDRESS & LOCATION").font(.caption).bold().foregroundColor(.cyan)
                            IOSDetailRow(label: "Area / Location", value: customer.area)
                            IOSDetailRow(label: "Full Address", value: customer.address.isEmpty ? "N/A" : customer.address)
                        }
                        .padding().background(Color(red: 30/255, green: 41/255, blue: 59/255)).cornerRadius(12)

                        // 4. GUARANTOR & REMARK
                        VStack(alignment: .leading, spacing: 6) {
                            Text("GUARANTOR & REMARK").font(.caption).bold().foregroundColor(.cyan)
                            IOSDetailRow(label: "Guarantor Name", value: customer.guarantorName.isEmpty ? "N/A" : customer.guarantorName)
                            IOSDetailRow(label: "Guarantor Mobile", value: customer.guarantorMobile.isEmpty ? "N/A" : customer.guarantorMobile)
                            IOSDetailRow(label: "Remark / Notes", value: customer.remark.isEmpty ? "N/A" : customer.remark)
                        }
                        .padding().background(Color(red: 30/255, green: 41/255, blue: 59/255)).cornerRadius(12)

                        // 5. CUSTOMER QR REFERENCE
                        VStack(spacing: 8) {
                            Text("CUSTOMER QR REFERENCE").font(.caption).bold().foregroundColor(.cyan)
                            VStack(spacing: 4) {
                                Text("QR").font(.title).bold().foregroundColor(.black)
                                Text(customer.customerId).font(.caption).bold().foregroundColor(.black)
                            }
                            .frame(width: 100, height: 100)
                            .background(Color.white)
                            .cornerRadius(8)

                            Text(customer.customerCode).font(.caption2).foregroundColor(.gray)
                        }
                        .frame(maxWidth: .infinity)
                        .padding().background(Color(red: 30/255, green: 41/255, blue: 59/255)).cornerRadius(12)
                    }
                    .padding()
                }
            }
            .navigationTitle("Customer Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }
}

struct IOSDetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label).font(.caption).foregroundColor(.gray)
            Spacer()
            Text(value).font(.caption).bold().foregroundColor(.white)
        }
    }
}

// HISTORY SHEET
struct IOSCustomerHistorySheet: View {
    let customer: IOSCustomerItem
    var onAddTx: (String, Double, String) -> Void
    @Environment(\.dismiss) var dismiss

    @State private var amountText = ""
    @State private var notesText = ""
    @State private var filterType = "All"

    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 15/255, green: 23/255, blue: 42/255).ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("\(customer.name) — Statement History")
                            .font(.headline).bold().foregroundColor(.white)
                        Text("ID: \(customer.customerId) • Credit Limit: ₹\(Int(customer.creditLimit))")
                            .font(.caption).bold().foregroundColor(.cyan)

                        HStack(spacing: 8) {
                            VStack { Text("BAKI").font(.caption2).bold().foregroundColor(.red); Text("₹\(Int(customer.baki))").bold().foregroundColor(.red) }
                                .frame(maxWidth: .infinity).padding(8).background(Color(red: 30/255, green: 41/255, blue: 59/255)).cornerRadius(8)
                            VStack { Text("JAMA").font(.caption2).bold().foregroundColor(.green); Text("₹\(Int(customer.jama))").bold().foregroundColor(.green) }
                                .frame(maxWidth: .infinity).padding(8).background(Color(red: 30/255, green: 41/255, blue: 59/255)).cornerRadius(8)
                            VStack { Text("LIMIT").font(.caption2).bold().foregroundColor(.cyan); Text("₹\(Int(customer.creditLimit))").bold().foregroundColor(.cyan) }
                                .frame(maxWidth: .infinity).padding(8).background(Color(red: 30/255, green: 41/255, blue: 59/255)).cornerRadius(8)
                        }

                        // RECORD TRANSACTION
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Record Transaction").font(.subheadline).bold().foregroundColor(.white)
                            TextField("Amount (₹)", text: $amountText)
                                .textFieldStyle(.roundedBorder)
                            TextField("Notes / Description", text: $notesText)
                                .textFieldStyle(.roundedBorder)

                            HStack(spacing: 10) {
                                Button(action: {
                                    if let amt = Double(amountText), amt > 0 {
                                        onAddTx("Baki", amt, notesText)
                                        amountText = ""
                                        notesText = ""
                                    }
                                }) {
                                    Text("+ Baki").font(.subheadline).bold().frame(maxWidth: .infinity).padding(8).background(Color.red).foregroundColor(.white).cornerRadius(8)
                                }

                                Button(action: {
                                    if let amt = Double(amountText), amt > 0 {
                                        onAddTx("Jama", amt, notesText)
                                        amountText = ""
                                        notesText = ""
                                    }
                                }) {
                                    Text("+ Jama").font(.subheadline).bold().frame(maxWidth: .infinity).padding(8).background(Color.green).foregroundColor(.white).cornerRadius(8)
                                }
                            }
                        }
                        .padding().background(Color(red: 30/255, green: 41/255, blue: 59/255)).cornerRadius(12)
                    }
                    .padding()
                }
            }
            .navigationTitle("Transaction History")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }
}

// FORM SHEET
struct IOSCustomerFormSheet: View {
    let customer: IOSCustomerItem?
    var userRole: String
    var onSave: (IOSCustomerItem) -> Void
    @Environment(\.dismiss) var dismiss

    @State private var customerId = "100001"
    @State private var name = ""
    @State private var mobile = ""
    @State private var cdCode = ""
    @State private var category = ""
    @State private var area = ""
    @State private var creditLimitText = "50000"
    @State private var creditBlocked = false
    @State private var dbCategories: [String] = []
    @State private var dbAreas: [String] = []
    @State private var errorMsg: String? = nil

    func fetchDbCategories() {
        SupabaseIOSClient.shared.fetchTable(table: "categories") { res in
            DispatchQueue.main.async {
                if case .success(let items) = res {
                    self.dbCategories = Array(Set(items.compactMap { $0["name"] as? String })).sorted()
                }
            }
        }
    }

    func fetchDbAreas() {
        SupabaseIOSClient.shared.fetchTable(table: "areas") { res in
            DispatchQueue.main.async {
                if case .success(let items) = res {
                    self.dbAreas = Array(Set(items.compactMap { $0["name"] as? String })).sorted()
                }
            }
        }
    }

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

                Section(header: Text("Customer Details")) {
                    HStack {
                        Text("UID").foregroundColor(.gray)
                        Spacer()
                        Text(customerId).bold().foregroundColor(.cyan)
                    }
                    TextField("Full Name *", text: $name)
                    TextField("Mobile Number (10 Digits) *", text: $mobile)
                        .keyboardType(.numberPad)
                    TextField("CD Code * (e.g. cd08, ABC123, 12345)", text: $cdCode)
                }

                Section(header: Text("Category *")) {
                    Picker("Category *", selection: $category) {
                        Text("-- Select Category --").tag("")
                        ForEach(dbCategories, id: \.self) { cat in
                            Text(cat).tag(cat)
                        }
                    }

                    if dbCategories.isEmpty {
                        Text("No customer categories found in database.")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }

                Section(header: Text("Credit & Grade")) {
                    TextField("Credit Limit (₹) *", text: $creditLimitText)
                        .keyboardType(.numberPad)
                    Toggle("Credit Blocked", isOn: $creditBlocked)
                }

                Section(header: Text("Address & Area *")) {
                    Picker("Area / Location *", selection: $area) {
                        Text("-- Select Area --").tag("")
                        ForEach(dbAreas, id: \.self) { aName in
                            Text(aName).tag(aName)
                        }
                    }
                    TextField("Area Name", text: $area)
                }
            }
            .navigationTitle(customer != nil ? "Edit Customer (\(customerId))" : "Add Customer")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        if name.trimmingCharacters(in: .whitespaces).isEmpty {
                            errorMsg = "Customer name is required."
                            return
                        }
                        if mobile.trimmingCharacters(in: .whitespaces).isEmpty {
                            errorMsg = "Mobile number is required."
                            return
                        }
                        if category.trimmingCharacters(in: .whitespaces).isEmpty {
                            errorMsg = "Please select a customer category."
                            return
                        }

                        let limit = Double(creditLimitText) ?? 50000.0
                        var item = customer ?? IOSCustomerItem(
                            id: UUID().uuidString,
                            customerId: customerId,
                            customerCode: cdCode,
                            name: name,
                            mobile: mobile
                        )
                        item.customerId = customerId
                        item.name = name
                        item.mobile = mobile
                        item.customerCode = cdCode
                        item.category = category
                        item.area = area
                        item.creditLimit = limit
                        item.creditBlocked = creditBlocked
                        onSave(item)
                    }
                    .bold()
                }
            }
            .onAppear {
                fetchDbCategories()
                fetchDbAreas()
                if let c = customer {
                    customerId = c.customerId
                    name = c.name
                    mobile = c.mobile
                    cdCode = c.customerCode
                    category = c.category
                    area = c.area
                    creditLimitText = "\(Int(c.creditLimit))"
                    creditBlocked = c.creditBlocked
                } else {
                    SupabaseIOSClient.shared.generateNextCustomerIdRPC(businessId: "00000000-0000-0000-0000-000000000001") { nextId in
                        DispatchQueue.main.async {
                            self.customerId = nextId
                            if self.cdCode.isEmpty {
                                self.cdCode = nextId
                            }
                        }
                    }
                }
            }
        }
    }
}

// DELETE SHEET
struct IOSCustomerDeleteSheet: View {
    let customer: IOSCustomerItem
    var userRole: String
    var onConfirmDelete: () -> Void
    @Environment(\.dismiss) var dismiss

    @State private var step = 1

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                if userRole != "ADMIN" {
                    Text("🔒 Only Admin can delete customer details.")
                        .foregroundColor(.red)
                        .fontWeight(.bold)
                } else {
                    Text(step == 1 ? "Delete customer?" : step == 2 ? "This will remove the customer from active CRM records. Continue?" : "Final confirmation: permanently delete this customer?")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)

                    Text("Customer: \(customer.name) (\(customer.customerId))")
                        .font(.subheadline)
                        .foregroundColor(.gray)

                    Spacer()

                    Button(action: {
                        if step < 3 {
                            step += 1
                        } else {
                            onConfirmDelete()
                            dismiss()
                        }
                    }) {
                        Text(step < 3 ? "Continue" : "DELETE PERMANENTLY")
                            .font(.headline)
                            .bold()
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                }
            }
            .padding()
            .navigationTitle("Confirm Delete")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
