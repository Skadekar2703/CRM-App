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

    func fetchCategories() {
        SupabaseIOSClient.shared.fetchTable(table: "categories") { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let items):
                    self.categories = items.map { item in
                        IOSCategory(
                            id: item["id"] as? String ?? UUID().uuidString,
                            name: item["name"] as? String ?? "Category",
                            type: item["type"] as? String ?? "Item Category",
                            status: item["status"] as? String ?? "Active",
                            createdDate: "Recent",
                            usageCount: 0
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
            let matchesQuery = q.isEmpty || cat.id.lowercased().contains(q) || cat.name.lowercased().contains(q) || cat.type.lowercased().contains(q) || cat.status.lowercased().contains(q)

            let matchesFilter: Bool
            switch selectedFilter {
            case "Items":
                matchesFilter = cat.type.lowercased().contains("item")
            case "Customers":
                matchesFilter = cat.type.lowercased().contains("customer")
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
            Color(red: 248/255, green: 250/255, blue: 252/255).ignoresSafeArea()

            VStack(spacing: 12) {
                // TOP SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search categories...", text: $searchQuery)
                }
                .padding(10)
                .background(Color.white)
                .cornerRadius(10)
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // FILTER CHIPS
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(["All", "Items", "Customers", "Active"], id: \.self) { filter in
                            let isSelected = selectedFilter == filter
                            Button(action: { selectedFilter = filter }) {
                                Text(filter)
                                    .font(.caption)
                                    .fontWeight(isSelected ? .bold : .medium)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(isSelected ? Color.blue : Color.white)
                                    .foregroundColor(isSelected ? .white : Color(red: 30/255, green: 41/255, blue: 59/255))
                                    .cornerRadius(20)
                                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(isSelected ? Color.blue : Color(red: 203/255, green: 213/255, blue: 225/255), lineWidth: 1))
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
                        .background(Color(red: 240/255, green: 253/255, blue: 244/255))
                        .cornerRadius(8)
                        .padding(.horizontal, 16)
                }

                // CATEGORIES LIST
                ScrollView {
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
                    .padding(.horizontal, 16)
                    .padding(.bottom, 80)
                }
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
                onSave: { name, type, status in
                    if let cat = editingCategory {
                        SupabaseIOSClient.shared.insertRecord(table: "categories", payload: ["id": cat.id, "name": name, "type": type, "status": status]) { _ in
                            self.fetchCategories()
                        }
                        toastMsg = "Category updated"
                    } else {
                        SupabaseIOSClient.shared.insertRecord(table: "categories", payload: ["name": name, "type": type, "status": status]) { _ in
                            self.fetchCategories()
                        }
                        toastMsg = "New category added"
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
                        SupabaseIOSClient.shared.deleteRecord(table: "categories", id: target.id) { _ in
                            self.fetchCategories()
                        }
                        toastMsg = "Category deleted"
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
    var type: String
    var status: String
    var createdDate: String
    var usageCount: Int
}

struct IOSCategoryCard: View {
    let category: IOSCategory
    var onEdit: () -> Void
    var onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                HStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(category.type.contains("Item") ? Color.blue.opacity(0.12) : Color.green.opacity(0.12))
                            .frame(width: 38, height: 38)
                        Image(systemName: category.type.contains("Item") ? "shippingbox.fill" : "person.2.fill")
                            .font(.caption)
                            .foregroundColor(category.type.contains("Item") ? .blue : .green)
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(category.name)
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                        Text("\(category.type) • \(category.id)")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }

                Spacer()

                Text(category.status)
                    .font(.caption)
                    .fontWeight(.bold)
                    .lineLimit(1)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(category.status == "Active" ? Color.green.opacity(0.15) : Color.red.opacity(0.15))
                    .foregroundColor(category.status == "Active" ? .green : .red)
                    .cornerRadius(12)
            }

            Divider()

            HStack {
                Text("Created \(category.createdDate)")
                    .font(.caption2)
                    .foregroundColor(.gray)

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
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }
}

struct IOSCategoryFormSheet: View {
    var category: IOSCategory?
    var onSave: (String, String, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var name = ""
    @State private var type = "Item Category"
    @State private var status = "Active"

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Category Details")) {
                    TextField("Category Name", text: $name)

                    Picker("Type", selection: $type) {
                        Text("Item Category").tag("Item Category")
                        Text("Customer Category").tag("Customer Category")
                    }

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
                    onSave(name, type, status)
                }.disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            )
            .onAppear {
                if let cat = category {
                    name = cat.name
                    type = cat.type
                    status = cat.status
                }
            }
        }
    }
}


