import SwiftUI

struct IOSTransportsView: View {
    var userRole: String = "ADMIN"
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Transports",
            onNavigateSection: onNavigateSection
        ) {
            IOSTransportsContentView(userRole: userRole)
        }
    }
}

struct IOSTransportsContentView: View {
    var userRole: String = "ADMIN"

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

    @State private var transports: [IOSTransport] = []
    @State private var searchQuery = ""
    @State private var showFormSheet = false
    @State private var editingTransport: IOSTransport? = nil
    @State private var deleteTargetTransport: IOSTransport? = nil
    @State private var showDeleteSheet = false
    @State private var toastMsg: String? = nil
    @State private var isLoading = true

    private var isAdmin: Bool {
        userRole.caseInsensitiveCompare("ADMIN") == .orderedSame
    }

    func fetchTransportsFromSupabase() {
        isLoading = true
        SupabaseIOSClient.shared.fetchTable(table: "transports") { result in
            DispatchQueue.main.async {
                self.isLoading = false
                switch result {
                case .success(let items):
                    self.transports = items.map { dict in
                        IOSTransport(
                            id: "\(dict["id"] ?? UUID().uuidString)",
                            transportName: dict["name"] as? String ?? dict["transportName"] as? String ?? "Transport",
                            mobile: dict["phone"] as? String ?? dict["mobile"] as? String ?? "",
                            contactPerson: dict["driver_name"] as? String ?? dict["contactPerson"] as? String ?? "Driver",
                            vehicleNumber: dict["vehicle_number"] as? String ?? dict["vehicleNumber"] as? String ?? "N/A",
                            status: dict["status"] as? String ?? "Active",
                            createdDate: "Active"
                        )
                    }
                case .failure(let err):
                    print("Fetch transports error:", err)
                    self.transports = []
                }
            }
        }
    }

    var filteredTransports: [IOSTransport] {
        transports.filter { t in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            return q.isEmpty || t.id.lowercased().contains(q) || t.transportName.lowercased().contains(q) || t.mobile.lowercased().contains(q) || t.contactPerson.lowercased().contains(q) || t.vehicleNumber.lowercased().contains(q)
        }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            bgApp.ignoresSafeArea()

            VStack(spacing: 14) {
                // PAGE TITLE & SEARCH BAR
                VStack(alignment: .leading, spacing: 12) {
                    Text("Transports")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)

                    HStack(spacing: 10) {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(textMuted)
                            TextField("Search transports...", text: $searchQuery)
                                .foregroundColor(textPrimary)
                        }
                        .padding(10)
                        .background(cardBg)
                        .cornerRadius(10)

                        Button(action: {
                            fetchTransportsFromSupabase()
                        }) {
                            HStack(spacing: 4) {
                                Image(systemName: "arrow.clockwise")
                                Text("Refresh")
                                    .fontWeight(.bold)
                            }
                            .font(.caption)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)

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

                // TRANSPORTS CARDS LIST
                ScrollView {
                    if isLoading {
                        ProgressView("Loading Transports...")
                            .padding(40)
                    } else if filteredTransports.isEmpty {
                        VStack(spacing: 8) {
                            Spacer().frame(height: 40)
                            Text("No transports found.")
                                .foregroundColor(textMuted)
                                .font(.subheadline)
                        }
                        .frame(maxWidth: .infinity)
                    } else {
                        LazyVStack(spacing: 14) {
                            ForEach(filteredTransports) { t in
                                IOSTransportCard(
                                    transport: t,
                                    isAdmin: isAdmin,
                                    onEdit: {
                                        editingTransport = t
                                        showFormSheet = true
                                    },
                                    onDelete: {
                                        deleteTargetTransport = t
                                        showDeleteSheet = true
                                    }
                                )
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 80)
                    }
                }
            }

            // FAB ADD BUTTON
            Button(action: {
                editingTransport = nil
                showFormSheet = true
            }) {
                Image(systemName: "plus")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(Color.blue)
                    .clipShape(Circle())
                    .shadow(color: Color.blue.opacity(0.4), radius: 6, x: 0, y: 3)
            }
            .padding(20)
        }
        .onAppear {
            fetchTransportsFromSupabase()
        }
        .sheet(isPresented: $showFormSheet) {
            IOSTransportFormSheet(transport: editingTransport) { name, mobile, person, vehicle, status in
                let payload: [String: Any] = [
                    "name": name,
                    "phone": mobile,
                    "driver_name": person,
                    "vehicle_number": vehicle,
                    "status": status
                ]

                if let t = editingTransport {
                    SupabaseIOSClient.shared.updateRecord(table: "transports", id: t.id, payload: payload) { _ in
                        DispatchQueue.main.async {
                            toastMsg = "Transport updated"
                            fetchTransportsFromSupabase()
                        }
                    }
                } else {
                    SupabaseIOSClient.shared.insertRecord(table: "transports", payload: payload) { _ in
                        DispatchQueue.main.async {
                            toastMsg = "Transport created"
                            fetchTransportsFromSupabase()
                        }
                    }
                }
                showFormSheet = false
            }
        }
        .sheet(isPresented: $showDeleteSheet) {
            if let target = deleteTargetTransport {
                IOSThreeStepDeleteSheet(
                    itemName: "Transport: \(target.transportName)",
                    itemDetails: "Phone: \(target.mobile), Vehicle: \(target.vehicleNumber)",
                    onClose: { showDeleteSheet = false },
                    onConfirmDelete: {
                        SupabaseIOSClient.shared.deleteRecord(table: "transports", id: target.id) { _ in
                            DispatchQueue.main.async {
                                toastMsg = "Transport deleted"
                                fetchTransportsFromSupabase()
                            }
                        }
                        showDeleteSheet = false
                    }
                )
            }
        }
    }
}

struct IOSTransport: Identifiable {
    let id: String
    let transportName: String
    let mobile: String
    let contactPerson: String
    let vehicleNumber: String
    let status: String
    let createdDate: String
}

struct IOSTransportCard: View {
    let transport: IOSTransport
    var isAdmin: Bool = true
    var onEdit: () -> Void
    var onDelete: () -> Void

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

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(transport.transportName)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)
                    Text("Vehicle: \(transport.vehicleNumber)")
                        .font(.caption)
                        .foregroundColor(textMuted)
                }

                Spacer()

                Text(transport.status)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(transport.status == "Active" ? Color.green.opacity(0.12) : Color.gray.opacity(0.12))
                    .foregroundColor(transport.status == "Active" ? .green : .gray)
                    .cornerRadius(6)
            }

            Divider()

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Label(transport.contactPerson, systemImage: "person.fill")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(textPrimary)
                    Label(transport.mobile, systemImage: "phone.fill")
                        .font(.caption2)
                        .foregroundColor(textMuted)
                }

                Spacer()

                HStack(spacing: 12) {
                    Button(action: onEdit) {
                        Image(systemName: "pencil")
                            .foregroundColor(.blue)
                    }
                    if isAdmin {
                        Button(action: onDelete) {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
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

struct IOSTransportFormSheet: View {
    var transport: IOSTransport?
    var onSave: (String, String, String, String, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var transportName = ""
    @State private var mobile = ""
    @State private var contactPerson = ""
    @State private var vehicleNumber = ""
    @State private var status = "Active"

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Transport Details")) {
                    TextField("Transport Name *", text: $transportName)
                    TextField("Contact Person", text: $contactPerson)
                    TextField("Mobile Number", text: $mobile)
                    TextField("Vehicle Number", text: $vehicleNumber)

                    Picker("Status", selection: $status) {
                        Text("Active").tag("Active")
                        Text("Inactive").tag("Inactive")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
            }
            .navigationTitle(transport == nil ? "Add Transport" : "Edit Transport")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    onSave(transportName, mobile, contactPerson, vehicleNumber, status)
                }.disabled(transportName.trimmingCharacters(in: .whitespaces).isEmpty)
            )
            .onAppear {
                if let t = transport {
                    transportName = t.transportName
                    mobile = t.mobile
                    contactPerson = t.contactPerson
                    vehicleNumber = t.vehicleNumber
                    status = t.status
                }
            }
        }
    }
}
