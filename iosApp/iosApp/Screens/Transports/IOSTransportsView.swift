import SwiftUI

struct IOSTransportsView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Transports",
            onNavigateSection: onNavigateSection
        ) {
            IOSTransportsContentView()
        }
    }
}

struct IOSTransportsContentView: View {
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

    @State private var transports: [IOSTransport] = [
        IOSTransport(id: "1042", transportName: "Alpha Logistics Pvt Ltd", mobile: "+1 (555) 123-4567", contactPerson: "John Doe", vehicleNumber: "Fleet: 12 Vehicles", status: "Active", createdDate: "Oct 24, 2023"),
        IOSTransport(id: "1043", transportName: "Express Cargo Co.", mobile: "+1 (555) 987-6543", contactPerson: "Sarah Smith", vehicleNumber: "Fleet: 5 Vehicles", status: "Inactive", createdDate: "Oct 25, 2023"),
        IOSTransport(id: "1044", transportName: "Global Transit", mobile: "+1 (555) 456-7890", contactPerson: "Mike Johnson", vehicleNumber: "Fleet: 28 Vehicles", status: "Active", createdDate: "Nov 02, 2023"),
        IOSTransport(id: "1045", transportName: "BlueDart Express Ltd", mobile: "+91 98111 22334", contactPerson: "Vikram Singh", vehicleNumber: "KA 02 EF 5678", status: "Active", createdDate: "Nov 15, 2023"),
        IOSTransport(id: "1046", transportName: "VRL Logistics Services", mobile: "+91 94444 55555", contactPerson: "Ramesh Patil", vehicleNumber: "KA 25 M 9900", status: "Active", createdDate: "Nov 20, 2023")
    ]

    @State private var searchQuery = ""
    @State private var showFormSheet = false
    @State private var editingTransport: IOSTransport? = nil
    @State private var deleteTargetTransport: IOSTransport? = nil
    @State private var showDeleteAlert = false
    @State private var toastMsg: String? = nil

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

                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(textMuted)
                        TextField("Search transports...", text: $searchQuery)
                            .foregroundColor(textPrimary)
                    }
                    .padding(10)
                    .background(cardBg)
                    .cornerRadius(10)
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
                    LazyVStack(spacing: 14) {
                        ForEach(filteredTransports) { t in
                            IOSTransportCard(
                                transport: t,
                                onEdit: {
                                    editingTransport = t
                                    showFormSheet = true
                                },
                                onDelete: {
                                    deleteTargetTransport = t
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
                editingTransport = nil
                showFormSheet = true
            }) {
                Image(systemName: "plus")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(Color.blue)
                    .clipShape(Circle())
                    .shadow(color: Color.blue.opacity(0.3), radius: 6, x: 0, y: 3)
            }
            .padding(.trailing, 20)
            .padding(.bottom, 20)
        }
        .onAppear {
            // loaded
        }
        .sheet(isPresented: $showFormSheet) {
            IOSTransportFormSheet(
                transport: editingTransport,
                onSave: { name, mobile, contact, vehicle, status in
                    if let target = editingTransport {
                        if let idx = transports.firstIndex(where: { $0.id == target.id }) {
                            transports[idx].transportName = name
                            transports[idx].mobile = mobile
                            transports[idx].contactPerson = contact
                            transports[idx].vehicleNumber = vehicle
                            transports[idx].status = status
                        }
                        toastMsg = "Transport updated"
                    } else {
                        let newT = IOSTransport(
                            id: "\(1000 + transports.count + 1)",
                            transportName: name,
                            mobile: mobile,
                            contactPerson: contact,
                            vehicleNumber: vehicle,
                            status: status,
                            createdDate: "Today"
                        )
                        transports.insert(newT, at: 0)
                        toastMsg = "New transport added"
                    }
                    showFormSheet = false
                }
            )
        }
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Delete Transport"),
                message: Text("Are you sure you want to delete '\(deleteTargetTransport?.transportName ?? "")'?"),
                primaryButton: .destructive(Text("Delete")) {
                    if let target = deleteTargetTransport {
                        transports.removeAll(where: { $0.id == target.id })
                        toastMsg = "Transport deleted"
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSTransport: Identifiable {
    let id: String
    var transportName: String
    var mobile: String
    var contactPerson: String
    var vehicleNumber: String
    var status: String
    var createdDate: String
}

struct IOSTransportCard: View {
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

    let transport: IOSTransport
    var onEdit: () -> Void
    var onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                HStack(spacing: 12) {
                    Image(systemName: "shippingbox.fill")
                        .font(.title3)
                        .foregroundColor(.blue)
                        .frame(width: 42, height: 42)
                        .background(Color.blue.opacity(0.12))
                        .cornerRadius(10)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(transport.transportName)
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(textPrimary)
                        Text(transport.vehicleNumber)
                            .font(.caption)
                            .foregroundColor(textMuted)
                    }
                }

                Spacer()

                Text(transport.status)
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(transport.status == "Active" ? Color.green.opacity(0.15) : Color.red.opacity(0.15))
                    .foregroundColor(transport.status == "Active" ? .green : .red)
                    .cornerRadius(12)
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
                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .foregroundColor(.red)
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
