import SwiftUI

struct IOSSuppliersView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Suppliers",
            onNavigateSection: onNavigateSection
        ) {
            IOSSuppliersContentView()
        }
    }
}

struct IOSSupplierItem: Identifiable {
    let id: String
    var partyName: String
    var contactPerson: String
    var mobile: String
    var email: String
    var address: String
    var status: String
}

struct IOSSuppliersContentView: View {
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var bgApp: Color {
        isDarkMode ? Color(red: 11/255, green: 18/255, blue: 32/255) : Color(red: 248/255, green: 250/255, blue: 252/255)
    }
    private var cardBg: Color {
        isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white
    }
    private var textPrimary: Color {
        isDarkMode ? Color(red: 248/255, green: 250/255, blue: 252/255) : Color(red: 30/255, green: 41/255, blue: 59/255)
    }
    private var textMuted: Color {
        isDarkMode ? Color(red: 148/255, green: 163/255, blue: 184/255) : Color(red: 100/255, green: 116/255, blue: 139/255)
    }

    @State private var suppliers: [IOSSupplierItem] = [
        IOSSupplierItem(id: "SUP-001", partyName: "Acme Global Supplies", contactPerson: "Jane Doe", mobile: "+1 (555) 123-4567", email: "jane@acmeglobal.com", address: "Industrial Area, Phase 2", status: "Active"),
        IOSSupplierItem(id: "SUP-002", partyName: "Nexus Logistics Inc.", contactPerson: "Michael Chen", mobile: "+1 (555) 987-6543", email: "mchen@nexuslogistics.com", address: "Central Freight Terminal, Bay 4", status: "Inactive"),
        IOSSupplierItem(id: "SUP-003", partyName: "Vardhman Textiles Ltd.", contactPerson: "Rajesh Sharma", mobile: "+91 98765 43210", email: "rajesh@vardhman.com", address: "Ring Road, Surat", status: "Active"),
        IOSSupplierItem(id: "SUP-004", partyName: "Supreme Hardware Co.", contactPerson: "Anil Verma", mobile: "+91 98111 22334", email: "contact@supremehardware.in", address: "GIDC Market, Ahmedabad", status: "Active"),
        IOSSupplierItem(id: "SUP-005", partyName: "Apex Packaging Solutions", contactPerson: "Sarah Jenkins", mobile: "+1 (555) 456-7890", email: "sarah@apexpack.com", address: "Logistics Hub, Block B", status: "Inactive"),
        IOSSupplierItem(id: "SUP-006", partyName: "Global Polymers & Fibers", contactPerson: "Vikram Patel", mobile: "+91 97654 32109", email: "vikram@globalpolymers.com", address: "MIDC Industrial Estate, Mumbai", status: "Active")
    ]

    @State private var searchQuery = ""
    @State private var selectedStatusFilter = "All"
    @State private var showFilterSheet = false
    @State private var showFormSheet = false
    @State private var editingSupplier: IOSSupplierItem? = nil
    @State private var deletingSupplier: IOSSupplierItem? = nil
    @State private var showDeleteAlert = false
    @State private var toastMsg: String? = nil

    var filteredSuppliers: [IOSSupplierItem] {
        suppliers.filter { s in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            let matchesQuery = q.isEmpty || s.id.lowercased().contains(q) || s.partyName.lowercased().contains(q) || s.contactPerson.lowercased().contains(q) || s.mobile.lowercased().contains(q) || s.address.lowercased().contains(q)
            let matchesStatus = selectedStatusFilter.caseInsensitiveCompare("All") == .orderedSame || s.status.caseInsensitiveCompare(selectedStatusFilter) == .orderedSame
            return matchesQuery && matchesStatus
        }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            bgApp.ignoresSafeArea()

            VStack(spacing: 14) {
                // SEARCH & FILTER BUTTON ROW
                HStack(spacing: 10) {
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(textMuted)
                        TextField("Search suppliers...", text: $searchQuery)
                            .foregroundColor(textPrimary)
                        if !searchQuery.isEmpty {
                            Button(action: { searchQuery = "" }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(textMuted)
                            }
                        }
                    }
                    .padding(10)
                    .background(cardBg)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)

                    Button(action: { showFilterSheet = true }) {
                        Image(systemName: "slider.horizontal.3")
                            .font(.body)
                            .fontWeight(.bold)
                            .foregroundColor(selectedStatusFilter != "All" ? .white : textPrimary)
                            .frame(width: 44, height: 44)
                            .background(selectedStatusFilter != "All" ? Color.blue : cardBg)
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(selectedStatusFilter != "All" ? Color.blue : textMuted.opacity(0.3), lineWidth: 1))
                            .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // SECTION HEADING WITH TOTAL COUNT
                HStack {
                    Text("Supplier List")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)

                    Spacer()

                    Text("\(filteredSuppliers.count) Total")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(textMuted)
                }
                .padding(.horizontal, 16)

                if let msg = toastMsg {
                    Text("✓ \(msg)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(Color.green)
                        .padding(10)
                        .frame(maxWidth: .infinity)
                        .background(Color.green.opacity(0.15))
                        .cornerRadius(8)
                        .padding(.horizontal, 16)
                }

                // SUPPLIER CARDS LIST
                ScrollView {
                    LazyVStack(spacing: 14) {
                        ForEach(filteredSuppliers) { supplier in
                            IOSSupplierCard(
                                supplier: supplier,
                                onCall: {
                                    if let url = URL(string: "tel://\(supplier.mobile.replacingOccurrences(of: " ", with: "").replacingOccurrences(of: "-", with: ""))") {
                                        UIApplication.shared.open(url)
                                    }
                                },
                                onEdit: {
                                    editingSupplier = supplier
                                    showFormSheet = true
                                },
                                onDelete: {
                                    deletingSupplier = supplier
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
                editingSupplier = nil
                showFormSheet = true
            }) {
                Image(systemName: "plus")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(Color.blue)
                    .clipShape(Circle())
                    .shadow(color: Color.blue.opacity(0.35), radius: 6, x: 0, y: 3)
            }
            .padding(.trailing, 20)
            .padding(.bottom, 20)
        }
        .sheet(isPresented: $showFilterSheet) {
            IOSSupplierFilterSheet(
                selectedStatus: $selectedStatusFilter,
                onApply: { showFilterSheet = false }
            )
        }
        .sheet(isPresented: $showFormSheet) {
            IOSSupplierFormSheet(
                supplier: editingSupplier,
                onSave: { party, contact, mob, em, addr, st in
                    if let target = editingSupplier {
                        if let idx = suppliers.firstIndex(where: { $0.id == target.id }) {
                            suppliers[idx].partyName = party
                            suppliers[idx].contactPerson = contact
                            suppliers[idx].mobile = mob
                            suppliers[idx].email = em
                            suppliers[idx].address = addr
                            suppliers[idx].status = st
                        }
                        toastMsg = "Supplier '\(party)' updated."
                    } else {
                        let newSup = IOSSupplierItem(
                            id: "SUP-00\(suppliers.count + 1)",
                            partyName: party,
                            contactPerson: contact,
                            mobile: mob,
                            email: em,
                            address: addr,
                            status: st
                        )
                        suppliers.insert(newSup, at: 0)
                        toastMsg = "New supplier '\(party)' added."
                    }
                    showFormSheet = false
                }
            )
        }
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Delete Supplier"),
                message: Text("Are you sure you want to delete '\(deletingSupplier?.partyName ?? "")'?"),
                primaryButton: .destructive(Text("Delete")) {
                    if let target = deletingSupplier {
                        suppliers.removeAll(where: { $0.id == target.id })
                        toastMsg = "Supplier deleted"
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSSupplierCard: View {
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var cardBg: Color {
        isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white
    }
    private var textPrimary: Color {
        isDarkMode ? Color(red: 248/255, green: 250/255, blue: 252/255) : Color(red: 30/255, green: 41/255, blue: 59/255)
    }
    private var textMuted: Color {
        isDarkMode ? Color(red: 148/255, green: 163/255, blue: 184/255) : Color(red: 100/255, green: 116/255, blue: 139/255)
    }
    private var cardSubBg: Color {
        isDarkMode ? Color(red: 30/255, green: 41/255, blue: 59/255) : Color(red: 241/255, green: 245/255, blue: 249/255)
    }

    let supplier: IOSSupplierItem
    var onCall: () -> Void
    var onEdit: () -> Void
    var onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(supplier.partyName)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)

                    HStack(spacing: 8) {
                        Text(supplier.id)
                            .font(.caption2)
                            .fontWeight(.bold)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.blue.opacity(0.12))
                            .foregroundColor(.blue)
                            .cornerRadius(4)

                        Text("•")
                            .font(.caption)
                            .foregroundColor(textMuted)

                        Text(supplier.contactPerson)
                            .font(.caption)
                            .foregroundColor(textMuted)
                    }
                }

                Spacer()

                Text(supplier.status)
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(supplier.status == "Active" ? Color.green.opacity(0.15) : Color.red.opacity(0.15))
                    .foregroundColor(supplier.status == "Active" ? .green : .red)
                    .cornerRadius(12)
            }

            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.caption)
                        .foregroundColor(textMuted)
                    Text(supplier.address)
                        .font(.caption)
                        .foregroundColor(textMuted)
                        .lineLimit(1)
                }

                HStack(spacing: 6) {
                    Image(systemName: "envelope.fill")
                        .font(.caption2)
                        .foregroundColor(textMuted)
                    Text(supplier.email)
                        .font(.caption2)
                        .foregroundColor(textMuted)
                }
            }

            Divider()

            HStack {
                Button(action: onCall) {
                    HStack(spacing: 6) {
                        Image(systemName: "phone.fill")
                        Text(supplier.mobile)
                    }
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.blue.opacity(0.12))
                    .foregroundColor(.blue)
                    .cornerRadius(8)
                }

                Spacer()

                HStack(spacing: 10) {
                    Button(action: onEdit) {
                        HStack(spacing: 4) {
                            Image(systemName: "pencil")
                            Text("Edit")
                        }
                        .font(.caption)
                        .fontWeight(.bold)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(cardSubBg)
                        .foregroundColor(textPrimary)
                        .cornerRadius(8)
                    }

                    Button(action: onDelete) {
                        HStack(spacing: 4) {
                            Image(systemName: "trash.fill")
                            Text("Delete")
                        }
                        .font(.caption)
                        .fontWeight(.bold)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Color.red.opacity(0.1))
                        .foregroundColor(.red)
                        .cornerRadius(8)
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

struct IOSSupplierFilterSheet: View {
    @Binding var selectedStatus: String
    var onApply: () -> Void

    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Filter by Status")) {
                    Picker("Status", selection: $selectedStatus) {
                        Text("All").tag("All")
                        Text("Active").tag("Active")
                        Text("Inactive").tag("Inactive")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
            }
            .navigationTitle("Filter Suppliers")
            .navigationBarItems(
                trailing: Button("Done") {
                    onApply()
                    presentationMode.wrappedValue.dismiss()
                }
            )
        }
    }
}

struct IOSSupplierFormSheet: View {
    var supplier: IOSSupplierItem?
    var onSave: (String, String, String, String, String, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var partyName = ""
    @State private var contactPerson = ""
    @State private var mobile = ""
    @State private var email = ""
    @State private var address = ""
    @State private var status = "Active"

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Supplier Info")) {
                    TextField("Party / Company Name *", text: $partyName)
                    TextField("Contact Person Name", text: $contactPerson)
                    TextField("Mobile Number", text: $mobile)
                        .keyboardType(.phonePad)
                    TextField("Email Address", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    TextField("Business Address", text: $address)

                    Picker("Status", selection: $status) {
                        Text("Active").tag("Active")
                        Text("Inactive").tag("Inactive")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
            }
            .navigationTitle(supplier == nil ? "Add Supplier" : "Edit Supplier")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    onSave(partyName, contactPerson, mobile, email, address, status)
                }.disabled(partyName.trimmingCharacters(in: .whitespaces).isEmpty)
            )
            .onAppear {
                if let s = supplier {
                    partyName = s.partyName
                    contactPerson = s.contactPerson
                    mobile = s.mobile
                    email = s.email
                    address = s.address
                    status = s.status
                }
            }
        }
    }
}
