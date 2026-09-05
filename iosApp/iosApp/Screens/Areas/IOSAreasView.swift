import SwiftUI

struct IOSAreasView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Areas",
            onNavigateSection: onNavigateSection
        ) {
            IOSAreasContentView()
        }
    }
}

struct IOSAreasContentView: View {
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

    @State private var areas: [IOSArea] = []
    @State private var searchQuery = ""
    @State private var selectedStatusFilter = "All"
    @State private var showFormSheet = false
    @State private var editingArea: IOSArea? = nil
    @State private var deleteTargetArea: IOSArea? = nil
    @State private var showDeleteAlert = false
    @State private var toastMsg: String? = nil

    func fetchAreas() {
        SupabaseIOSClient.shared.fetchTable(table: "areas") { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let items):
                    self.areas = items.map { item in
                        IOSArea(
                            id: item["id"] as? String ?? UUID().uuidString,
                            name: item["name"] as? String ?? "Area",
                            status: item["status"] as? String ?? "Active",
                            createdDate: "Recent",
                            locationCount: 0
                        )
                    }
                case .failure:
                    self.areas = []
                }
            }
        }
    }

    var filteredAreas: [IOSArea] {
        areas.filter { a in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            let matchesQuery = q.isEmpty || a.id.lowercased().contains(q) || a.name.lowercased().contains(q) || a.status.lowercased().contains(q)
            let matchesStatus = selectedStatusFilter == "All" || a.status.caseInsensitiveCompare(selectedStatusFilter) == .orderedSame
            return matchesQuery && matchesStatus
        }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            bgApp.ignoresSafeArea()

            VStack(spacing: 12) {
                // TOP SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(textMuted)
                    TextField("Search areas...", text: $searchQuery)
                        .foregroundColor(textPrimary)
                }
                .padding(10)
                .background(cardBg)
                .cornerRadius(10)
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // FILTER CHIPS
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(["All", "Active", "Inactive"], id: \.self) { filter in
                            let isSelected = selectedStatusFilter == filter
                            Button(action: { selectedStatusFilter = filter }) {
                                Text(filter)
                                    .font(.caption)
                                    .fontWeight(isSelected ? .bold : .medium)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(isSelected ? Color.blue : cardBg)
                                    .foregroundColor(isSelected ? .white : textPrimary)
                                    .cornerRadius(20)
                                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(isSelected ? Color.blue : textMuted.opacity(0.3), lineWidth: 1))
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                }

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

                // AREAS LIST
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(filteredAreas) { area in
                            IOSAreaCard(
                                area: area,
                                onEdit: {
                                    editingArea = area
                                    showFormSheet = true
                                },
                                onDelete: {
                                    deleteTargetArea = area
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
                editingArea = nil
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
            fetchAreas()
        }
        .sheet(isPresented: $showFormSheet) {
            IOSAreaFormSheet(
                area: editingArea,
                onSave: { name, status in
                    if let target = editingArea {
                        SupabaseIOSClient.shared.insertRecord(table: "areas", payload: ["id": target.id, "name": name]) { result in
                            DispatchQueue.main.async {
                                switch result {
                                case .success:
                                    self.toastMsg = "Area '\(name)' updated."
                                    self.fetchAreas()
                                case .failure(let err):
                                    let msg = err.localizedDescription
                                    if msg.contains("23505") || msg.contains("unique") || msg.contains("duplicate") {
                                        self.toastMsg = "An area named '\(name)' already exists in your account."
                                    } else {
                                        self.toastMsg = "Failed to update area: \(msg)"
                                    }
                                }
                            }
                        }
                    } else {
                        SupabaseIOSClient.shared.insertRecord(table: "areas", payload: ["name": name]) { result in
                            DispatchQueue.main.async {
                                switch result {
                                case .success:
                                    self.toastMsg = "New Area '\(name)' added."
                                    self.fetchAreas()
                                case .failure(let err):
                                    let msg = err.localizedDescription
                                    if msg.contains("23505") || msg.contains("unique") || msg.contains("duplicate") {
                                        self.toastMsg = "An area named '\(name)' already exists in your account."
                                    } else {
                                        self.toastMsg = "Failed to add area: \(msg)"
                                    }
                                }
                            }
                        }
                    }
                    showFormSheet = false
                }
            )
        }
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Delete Area"),
                message: Text("Are you sure you want to delete '\(deleteTargetArea?.name ?? "")'?"),
                primaryButton: .destructive(Text("Delete")) {
                    if let target = deleteTargetArea {
                        SupabaseIOSClient.shared.deleteRecord(table: "areas", id: target.id) { _ in
                            self.fetchAreas()
                        }
                        toastMsg = "Area deleted"
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSArea: Identifiable {
    let id: String
    var name: String
    var status: String
    var createdDate: String
    var locationCount: Int
}

struct IOSAreaCard: View {
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

    let area: IOSArea
    var onEdit: () -> Void
    var onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(area.name)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)
                    Text(area.id)
                        .font(.caption)
                        .foregroundColor(textMuted)
                }

                Spacer()

                Text(area.status)
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(area.status == "Active" ? Color.green.opacity(0.15) : Color.red.opacity(0.15))
                    .foregroundColor(area.status == "Active" ? .green : .red)
                    .cornerRadius(12)
            }

            Divider()

            HStack {
                Label("\(area.locationCount) Locations", systemImage: "mappin.circle.fill")
                    .font(.caption)
                    .foregroundColor(textMuted)

                Spacer()

                Text("Added \(area.createdDate)")
                    .font(.caption2)
                    .foregroundColor(textMuted)

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
                .padding(.leading, 8)
            }
        }
        .padding(14)
        .background(cardBg)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }
}

struct IOSAreaFormSheet: View {
    var area: IOSArea?
    var onSave: (String, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var name = ""
    @State private var status = "Active"

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Area Details")) {
                    TextField("Area Name", text: $name)

                    Picker("Status", selection: $status) {
                        Text("Active").tag("Active")
                        Text("Inactive").tag("Inactive")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
            }
            .navigationTitle(area == nil ? "Add Area" : "Edit Area")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    onSave(name, status)
                }.disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            )
            .onAppear {
                if let area = area {
                    name = area.name
                    status = area.status
                }
            }
        }
    }
}
