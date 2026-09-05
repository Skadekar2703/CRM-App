import SwiftUI

struct IOSCategoriesView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Categories",
            onNavigateSection: onNavigateSection
        ) {
            IOSCategoriesContentView()
        }
    }
}

struct IOSCategoriesContentView: View {
    @State private var categories: [IOSCategory] = []
    @State private var searchQuery = ""
    @State private var selectedFilter = "All"
    @State private var showFormSheet = false
    @State private var editingCategory: IOSCategory? = nil
    @State private var deleteTargetCategory: IOSCategory? = nil
    @State private var showDeleteAlert = false
    @State private var toastMsg: String? = nil
    @State private var errorToastMsg: String? = nil

    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var bgApp: Color { isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color(red: 248/255, green: 250/255, blue: 252/255) }
    private var cardBg: Color { isDarkMode ? Color(red: 30/255, green: 41/255, blue: 59/255) : Color.white }
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255) }
    private var textMuted: Color { isDarkMode ? Color(red: 148/255, green: 163/255, blue: 184/255) : Color(red: 100/255, green: 116/255, blue: 139/255) }

    func fetchCategories() {
        SupabaseIOSClient.shared.fetchTable(table: "categories") { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let items):
                    self.categories = items.map { item in
                        IOSCategory(
                            id: item["id"] as? String ?? UUID().uuidString,
                            name: item["name"] as? String ?? "Customer Category",
                            status: item["status"] as? String ?? "Active",
                            createdDate: "Recent"
                        )
                    }
                case .failure:
                    self.categories = []
                }
            }
        }
    }

    var filteredCategories: [IOSCategory] {
        categories.filter { cat in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            let matchesQuery = q.isEmpty || cat.id.lowercased().contains(q) || cat.name.lowercased().contains(q) || cat.status.lowercased().contains(q)

            let matchesFilter: Bool
            switch selectedFilter {
            case "Active":
                matchesFilter = cat.status.caseInsensitiveCompare("Active") == .orderedSame
            default:
                matchesFilter = true
            }

            return matchesQuery && matchesFilter
        }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            bgApp.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    // HEADER TITLE
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Customer Categories")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(textPrimary)
                            Text("Manage categories used for customer classification.")
                                .font(.caption)
                                .foregroundColor(textMuted)
                        }
                        Spacer()
                    }
                    .padding(.top, 8)

                    // SEARCH BAR
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(textMuted)
                        TextField("Search customer categories...", text: $searchQuery)
                            .foregroundColor(textPrimary)
                    }
                    .padding(10)
                    .background(cardBg)
                    .cornerRadius(10)

                    // FILTER CHIPS
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(["All", "Active"], id: \.self) { filter in
                                let isSelected = selectedFilter == filter
                                Button(action: { selectedFilter = filter }) {
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
                    }

                    if let msg = toastMsg {
                        Text("✓ \(msg)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(Color.green)
                            .padding(10)
                            .frame(maxWidth: .infinity)
                            .background(Color.green.opacity(0.12))
                            .cornerRadius(8)
                    }

                    if let err = errorToastMsg {
                        Text("⚠️ \(err)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(Color.red)
                            .padding(10)
                            .frame(maxWidth: .infinity)
                            .background(Color.red.opacity(0.12))
                            .cornerRadius(8)
                    }

                    // CATEGORIES LIST
                    if filteredCategories.isEmpty {
                        VStack(spacing: 12) {
                            Text("No customer categories found.")
                                .font(.subheadline)
                                .foregroundColor(textMuted)
                                .padding(.top, 40)
                        }
                    } else {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredCategories) { cat in
                                IOSCategoryCard(
                                    category: cat,
                                    onEdit: {
                                        editingCategory = cat
                                        showFormSheet = true
                                    },
                                    onDelete: {
                                        deleteTargetCategory = cat
                                        showDeleteAlert = true
                                    }
                                )
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 90)
            }

            // FAB ADD BUTTON
            Button(action: {
                editingCategory = nil
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
        .onAppear {
            fetchCategories()
        }
        .sheet(isPresented: $showFormSheet) {
            IOSCategoryFormSheet(
                category: editingCategory,
                existingCategories: categories,
                onSave: { name, status in
                    let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
                    if let cat = editingCategory {
                        SupabaseIOSClient.shared.insertRecord(table: "categories", payload: ["id": cat.id, "name": trimmed, "status": status]) { _ in
                            self.fetchCategories()
                        }
                        toastMsg = "Customer category updated"
                    } else {
                        SupabaseIOSClient.shared.insertRecord(table: "categories", payload: ["name": trimmed, "status": status]) { _ in
                            self.fetchCategories()
                        }
                        toastMsg = "New customer category added"
                    }
                    showFormSheet = false
                }
            )
        }
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Delete Category"),
                message: Text("Are you sure you want to delete '\(deleteTargetCategory?.name ?? "")'?"),
                primaryButton: .destructive(Text("Delete")) {
                    if let target = deleteTargetCategory {
                        // Delete safety check against customers table
                        SupabaseIOSClient.shared.fetchTable(table: "customers") { custRes in
                            var isAssigned = false
                            if case .success(let items) = custRes {
                                for item in items {
                                    let cCat = item["category"] as? String ?? ""
                                    let cCatId = item["category_id"] as? String ?? ""
                                    if cCat.caseInsensitiveCompare(target.name) == .orderedSame || cCatId == target.id {
                                        isAssigned = true
                                        break
                                    }
                                }
                            }

                            DispatchQueue.main.async {
                                if isAssigned {
                                    self.errorToastMsg = "This category is assigned to customers and cannot be deleted."
                                } else {
                                    SupabaseIOSClient.shared.deleteRecord(table: "categories", id: target.id) { _ in
                                        self.fetchCategories()
                                    }
                                    self.toastMsg = "Category deleted"
                                }
                            }
                        }
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSCategory: Identifiable {
    let id: String
    var name: String
    var status: String
    var createdDate: String
}

struct IOSCategoryCard: View {
    let category: IOSCategory
    var onEdit: () -> Void
    var onDelete: () -> Void

    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var cardBg: Color { isDarkMode ? Color(red: 30/255, green: 41/255, blue: 59/255) : Color.white }
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255) }
    private var textMuted: Color { isDarkMode ? Color(red: 148/255, green: 163/255, blue: 184/255) : Color(red: 100/255, green: 116/255, blue: 139/255) }

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Color.green.opacity(0.15))
                .frame(width: 42, height: 42)
                .overlay(
                    Image(systemName: "person.2.fill")
                        .font(.subheadline)
                        .foregroundColor(.green)
                )

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(category.name)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)

                    Text(category.status)
                        .font(.caption2)
                        .fontWeight(.bold)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(category.status == "Active" ? Color.green.opacity(0.12) : Color.gray.opacity(0.12))
                        .foregroundColor(category.status == "Active" ? .green : .gray)
                        .cornerRadius(4)
                }

                Text("Customer Category")
                    .font(.caption)
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
            .padding(.leading, 8)
        }
        .padding(14)
        .background(cardBg)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }
}

struct IOSCategoryFormSheet: View {
    var category: IOSCategory?
    var existingCategories: [IOSCategory]
    var onSave: (String, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var name = ""
    @State private var status = "Active"
    @State private var errorMsg: String? = nil

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Category Details")) {
                    if let err = errorMsg {
                        Text("⚠️ \(err)")
                            .font(.caption)
                            .foregroundColor(.red)
                    }

                    TextField("Category Name *", text: $name)
                        .onChange(of: name) { _ in errorMsg = nil }

                    Picker("Status", selection: $status) {
                        Text("Active").tag("Active")
                        Text("Inactive").tag("Inactive")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
            }
            .navigationTitle(category == nil ? "Add Category" : "Edit Category")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
                    let isDup = existingCategories.contains { c in
                        c.name.caseInsensitiveCompare(trimmed) == .orderedSame && c.id != category?.id
                    }

                    if isDup {
                        errorMsg = "Category '\(trimmed)' already exists."
                    } else {
                        onSave(trimmed, status)
                    }
                }.disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            )
            .onAppear {
                if let cat = category {
                    name = cat.name
                    status = cat.status
                }
            }
        }
    }
}
