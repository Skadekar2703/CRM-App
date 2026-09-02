import SwiftUI

struct IOSUserManagementView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Users",
            onNavigateSection: onNavigateSection
        ) {
            IOSUserManagementContentView()
        }
    }
}

struct IOSUserItem: Identifiable {
    let id: String
    var username: String
    var email: String
    var role: String // "Admin" or "User"
    var createdAt: String
}

struct IOSUserManagementContentView: View {
    @State private var searchQuery = ""
    @State private var selectedRoleFilter = "All Roles"
    @State private var showFormSheet = false
    @State private var editingUser: IOSUserItem? = nil
    @State private var deletingUser: IOSUserItem? = nil
    @State private var showDeleteAlert = false
    @State private var toastMsg: String? = nil

    @State private var users: [IOSUserItem] = [
        IOSUserItem(id: "4", username: "aloo", email: "aloo1@gmail.com", role: "User", createdAt: "Jul 26, 2026"),
        IOSUserItem(id: "3", username: "Shakir", email: "sk@gmail.com", role: "User", createdAt: "Jun 15, 2026"),
        IOSUserItem(id: "2", username: "User", email: "abc1@gmail.com", role: "User", createdAt: "Jun 12, 2026"),
        IOSUserItem(id: "1", username: "admin", email: "admin@example.com", role: "Admin", createdAt: "Jun 12, 2026")
    ]

    var filteredUsers: [IOSUserItem] {
        let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        return users.filter { u in
            let matchesQ = q.isEmpty || u.id.lowercased().contains(q) || u.username.lowercased().contains(q) || u.email.lowercased().contains(q) || u.role.lowercased().contains(q)
            let matchesRole = selectedRoleFilter == "All Roles" || u.role == selectedRoleFilter
            return matchesQ && matchesRole
        }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Color(red: 248/255, green: 250/255, blue: 252/255).ignoresSafeArea()

            VStack(spacing: 14) {
                // HEADER & CLEAR ALL
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("User Management")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                        Text("Manage system user accounts & roles")
                            .font(.caption2)
                            .foregroundColor(.gray)
                    }

                    Spacer()

                    Button(action: {
                        searchQuery = ""
                        selectedRoleFilter = "All Roles"
                        toastMsg = "Filters reset"
                    }) {
                        Text("Clear All")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                            .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                            .cornerRadius(8)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // ROLE FILTER PICKER
                Picker("Role", selection: $selectedRoleFilter) {
                    Text("All Roles").tag("All Roles")
                    Text("Admin").tag("Admin")
                    Text("User").tag("User")
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal, 16)

                // SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search by ID, username, email or role...", text: $searchQuery)
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

                // USER CARDS LIST
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(filteredUsers) { user in
                            IOSUserCard(
                                user: user,
                                onEdit: {
                                    editingUser = user
                                    showFormSheet = true
                                },
                                onDelete: {
                                    deletingUser = user
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
                editingUser = nil
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
        .sheet(isPresented: $showFormSheet) {
            IOSUserFormSheet(
                user: editingUser,
                onSave: { username, email, role in
                    if let target = editingUser, let idx = users.firstIndex(where: { $0.id == target.id }) {
                        users[idx].username = username
                        users[idx].email = email
                        users[idx].role = role
                        toastMsg = "User '\(username)' updated"
                    } else {
                        let newU = IOSUserItem(
                            id: "\(users.count + 1)",
                            username: username,
                            email: email,
                            role: role,
                            createdAt: "29 Aug 2026"
                        )
                        users.insert(newU, at: 0)
                        toastMsg = "User '\(username)' created"
                    }
                    showFormSheet = false
                }
            )
        }
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Delete User Account"),
                message: Text("Are you sure you want to delete user account '\(deletingUser?.username ?? "")' (\(deletingUser?.email ?? ""))?"),
                primaryButton: .destructive(Text("Delete")) {
                    if let target = deletingUser {
                        users.removeAll { $0.id == target.id }
                        toastMsg = "User account deleted"
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSUserCard: View {
    let user: IOSUserItem
    var onEdit: () -> Void
    var onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(user.username)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                    Text("ID: #\(user.id) | \(user.email)")
                        .font(.caption)
                        .foregroundColor(.gray)
                }

                Spacer()

                Text(user.role)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(user.role == "Admin" ? Color.green.opacity(0.12) : Color.blue.opacity(0.12))
                    .foregroundColor(user.role == "Admin" ? .green : .blue)
                    .cornerRadius(6)
            }

            Divider()

            HStack {
                Text("Created: \(user.createdAt)")
                    .font(.caption2)
                    .foregroundColor(.gray)

                Spacer()

                HStack(spacing: 8) {
                    Button(action: onEdit) {
                        Image(systemName: "pencil")
                            .font(.caption)
                            .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                            .padding(6)
                            .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                            .cornerRadius(6)
                    }

                    Button(action: onDelete) {
                        Image(systemName: "trash.fill")
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding(6)
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(6)
                    }
                }
            }
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

struct IOSUserFormSheet: View {
    var user: IOSUserItem?
    var onSave: (String, String, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var username = ""
    @State private var email = ""
    @State private var role = "User"
    @State private var password = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Account Credentials")) {
                    TextField("Username / Full Name *", text: $username)
                    TextField("Email Address *", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)

                    Picker("Role *", selection: $role) {
                        Text("User").tag("User")
                        Text("Admin").tag("Admin")
                    }

                    if user == nil {
                        SecureField("Password *", text: $password)
                    }
                }
            }
            .navigationTitle(user == nil ? "Add User Account" : "Edit User Account")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    onSave(username, email, role)
                }.disabled(username.trimmingCharacters(in: .whitespaces).isEmpty || email.trimmingCharacters(in: .whitespaces).isEmpty)
            )
            .onAppear {
                if let u = user {
                    username = u.username
                    email = u.email
                    role = u.role
                }
            }
        }
    }
}
