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
    @State private var suppliers: [IOSSupplierItem] = [
        IOSSupplierItem(
            id: "SUP-001",
            partyName: "Acme Global Supplies",
            contactPerson: "Jane Doe",
            mobile: "+1 (555) 123-4567",
            email: "jane@acmeglobal.com",
            address: "Industrial Area, Phase 2",
            status: "Active"
        ),
        IOSSupplierItem(
            id: "SUP-002",
            partyName: "Nexus Logistics Inc.",
            contactPerson: "Michael Chen",
            mobile: "+1 (555) 987-6543",
            email: "mchen@nexuslogistics.com",
            address: "Central Freight Terminal, Bay 4",
            status: "Inactive"
        ),
        IOSSupplierItem(
            id: "SUP-003",
            partyName: "Vardhman Textiles Ltd.",
            contactPerson: "Rajesh Sharma",
            mobile: "+91 98765 43210",
            email: "rajesh@vardhman.com",
            address: "Ring Road, Surat",
            status: "Active"
        ),
        IOSSupplierItem(
            id: "SUP-004",
            partyName: "Supreme Hardware Co.",
            contactPerson: "Anil Verma",
            mobile: "+91 98111 22334",
            email: "contact@supremehardware.in",
            address: "GIDC Market, Ahmedabad",
            status: "Active"
        ),
        IOSSupplierItem(
            id: "SUP-005",
            partyName: "Apex Packaging Solutions",
            contactPerson: "Sarah Jenkins",
            mobile: "+1 (555) 456-7890",
            email: "sarah@apexpack.com",
            address: "Logistics Hub, Block B",
            status: "Inactive"
        ),
        IOSSupplierItem(
            id: "SUP-006",
            partyName: "Global Polymers & Fibers",
            contactPerson: "Vikram Patel",
            mobile: "+91 97654 32109",
            email: "vikram@globalpolymers.com",
            address: "MIDC Industrial Estate, Mumbai",
            status: "Active"
        )
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
            Color(red: 248/255, green: 250/255, blue: 252/255).ignoresSafeArea()

            VStack(spacing: 14) {
                // SEARCH & FILTER BUTTON ROW
                HStack(spacing: 10) {
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.gray)
                        TextField("Search suppliers...", text: $searchQuery)
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

                    Button(action: { showFilterSheet = true }) {
                        Image(systemName: "slider.horizontal.3")
                            .font(.body)
                            .fontWeight(.bold)
                            .foregroundColor(selectedStatusFilter != "All" ? .white : Color(red: 30/255, green: 41/255, blue: 59/255))
                            .frame(width: 44, height: 44)
                            .background(selectedStatusFilter != "All" ? Color.blue : Color.white)
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(selectedStatusFilter != "All" ? Color.blue : Color(red: 203/255, green: 213/255, blue: 225/255), lineWidth: 1))
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
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))

                    Spacer()

                    Text("\(filteredSuppliers.count) Total")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
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
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(Color.blue)
                    .clipShape(Circle())
                    .shadow(radius: 4)
            }
            .padding(20)
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
                onSave: { partyName, contactPerson, mobile, email, address, status in
                    if let target = editingSupplier, let idx = suppliers.firstIndex(where: { $0.id == target.id }) {
                        suppliers[idx].partyName = partyName
                        suppliers[idx].contactPerson = contactPerson
                        suppliers[idx].mobile = mobile
                        suppliers[idx].email = email
                        suppliers[idx].address = address
                        suppliers[idx].status = status
                        toastMsg = "Supplier '\(partyName)' updated"
                    } else {
                        let newS = IOSSupplierItem(
                            id: "SUP-00\(suppliers.count + 1)",
                            partyName: partyName,
                            contactPerson: contactPerson.isEmpty ? "Contact Person" : contactPerson,
                            mobile: mobile,
                            email: email,
                            address: address,
                            status: status
                        )
                        suppliers.insert(newS, at: 0)
                        toastMsg = "Supplier '\(partyName)' added"
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
                        suppliers.removeAll { $0.id == target.id }
                        toastMsg = "Supplier '\(target.partyName)' deleted"
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSSupplierCard: View {
    let supplier: IOSSupplierItem
    var onCall: () -> Void
    var onEdit: () -> Void
    var onDelete: () -> Void

    var isActive: Bool {
        supplier.status.caseInsensitiveCompare("Active") == .orderedSame
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // PARTY NAME & STATUS BADGE
            HStack(alignment: .top) {
                Text(supplier.partyName)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                    .fixedSize(horizontal: false, vertical: true)

                Spacer()

                Text(supplier.status)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(isActive ? Color.green.opacity(0.15) : Color.gray.opacity(0.15))
                    .foregroundColor(isActive ? .green : Color(red: 100/255, green: 116/255, blue: 139/255))
                    .cornerRadius(12)
            }

            // CONTACT PERSON
            HStack(spacing: 6) {
                Image(systemName: "person.fill")
                    .font(.caption)
                    .foregroundColor(.gray)
                Text(supplier.contactPerson)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
            }

            // MOBILE NUMBER
            HStack(spacing: 6) {
                Image(systemName: "phone.fill")
                    .font(.caption)
                    .foregroundColor(.gray)
                Text(supplier.mobile)
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }

            // ADDRESS (IF AVAILABLE)
            if !supplier.address.isEmpty {
                HStack(spacing: 6) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(supplier.address)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }

            Divider()

            // ACTIONS: CALL, EDIT, DELETE
            HStack {
                Button(action: onCall) {
                    HStack(spacing: 4) {
                        Image(systemName: "phone.fill")
                        Text("Call")
                    }
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.blue.opacity(0.1))
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
                        .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
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
        .background(Color.white)
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
                leading: Button("Reset") {
                    selectedStatus = "All"
                },
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
                Section(header: Text("Supplier Details")) {
                    TextField("Supplier / Party Name *", text: $partyName)
                    TextField("Contact Person", text: $contactPerson)
                    TextField("Mobile Number", text: $mobile)
                        .keyboardType(.phonePad)
                    TextField("Email Address", text: $email)
                        .keyboardType(.emailAddress)
                    TextField("Address / Location", text: $address)
                }

                Section(header: Text("Status")) {
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
