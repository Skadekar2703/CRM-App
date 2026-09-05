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

struct IOSUserManagementContentView: View {
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
    private var cardSubBg: Color {
        isDarkMode ? Color(red: 30/255, green: 41/255, blue: 59/255) : Color(red: 241/255, green: 245/255, blue: 249/255)
    }

    @State private var searchQuery = ""
    @State private var selectedRoleFilter = "All Roles"
    @State private var users: [IOSUserItem] = []
    @State private var isLoading = true
    @State private var errorMessage: String? = nil
    @State private var toastMsg: String? = nil

    // DIALOG STATES
    @State private var passwordTargetUser: IOSUserItem? = nil
    @State private var newPasswordInput = ""
    @State private var confirmPasswordInput = ""
    @State private var passwordDialogError: String? = nil
    @State private var isSubmitting = false

    @State private var statusTargetUser: IOSUserItem? = nil
    @State private var showStatusAlert = false

    private var currentUserRole: String {
        SupabaseIOSClient.shared.userRole.uppercased()
    }

    func loadUsers() {
        isLoading = true
        errorMessage = nil
        SupabaseIOSClient.shared.fetchBusinessMembers { result in
            isLoading = false
            switch result {
            case .success(let items):
                self.users = items
            case .failure(let err):
                self.errorMessage = err.localizedDescription
            }
        }
    }

    var filteredUsers: [IOSUserItem] {
        let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        return users.filter { u in
            let matchesQ = q.isEmpty ||
                u.id.lowercased().contains(q) ||
                u.username.lowercased().contains(q) ||
                u.email.lowercased().contains(q) ||
                u.role.lowercased().contains(q) ||
                u.status.lowercased().contains(q)

            let matchesRole = selectedRoleFilter == "All Roles" || u.role.caseInsensitiveCompare(selectedRoleFilter) == .orderedSame
            return matchesQ && matchesRole
        }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            bgApp.ignoresSafeArea()

            VStack(spacing: 14) {
                // HEADER
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("User Management")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(textPrimary)
                        Text("Manage business staff accounts & passwords")
                            .font(.caption2)
                            .foregroundColor(textMuted)
                    }

                    Spacer()

                    Button(action: { loadUsers() }) {
                        Image(systemName: "arrow.clockwise")
                            .font(.caption)
                            .fontWeight(.bold)
                            .padding(8)
                            .background(cardSubBg)
                            .foregroundColor(textPrimary)
                            .cornerRadius(8)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // ROLE FILTER SEGMENTS
                Picker("Role", selection: $selectedRoleFilter) {
                    Text("All Roles").tag("All Roles")
                    Text("ADMIN").tag("ADMIN")
                    Text("STAFF").tag("STAFF")
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal, 16)

                // SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(textMuted)
                    TextField("Search by username, role or status...", text: $searchQuery)
                        .foregroundColor(textPrimary)
                    if !searchQuery.isEmpty {
                        Button(action: { searchQuery = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(textMuted)
                        }
                    }
                }
                .padding(10)
                .background(cardSubBg)
                .cornerRadius(10)
                .padding(.horizontal, 16)

                // TOAST MESSAGE
                if let msg = toastMsg {
                    Text("✓ \(msg)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(Color(red: 22/255, green: 163/255, blue: 74/255))
                        .padding(10)
                        .frame(maxWidth: .infinity)
                        .background(Color(red: 240/255, green: 253/255, blue: 244/255))
                        .cornerRadius(8)
                        .padding(.horizontal, 16)
                }

                // ERROR DISPLAY
                if let err = errorMessage {
                    HStack {
                        Text("⚠️ \(err)")
                            .font(.caption)
                            .foregroundColor(.red)
                        Spacer()
                        Button("Retry") { loadUsers() }
                            .font(.caption)
                            .fontWeight(.bold)
                    }
                    .padding(10)
                    .background(Color(red: 254/255, green: 242/255, blue: 242/255))
                    .cornerRadius(8)
                    .padding(.horizontal, 16)
                }

                // USERS LIST
                if isLoading {
                    Spacer()
                    ProgressView("Loading business users...")
                        .foregroundColor(textMuted)
                    Spacer()
                } else if filteredUsers.isEmpty {
                    Spacer()
                    Text("No user accounts found.")
                        .font(.subheadline)
                        .foregroundColor(textMuted)
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredUsers) { user in
                                userCardView(user: user)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 20)
                    }
                }
            }
        }
        .onAppear { loadUsers() }
        .sheet(item: $passwordTargetUser) { target in
            changePasswordSheet(target: target)
        }
        .alert(isPresented: $showStatusAlert) {
            guard let target = statusTargetUser else {
                return Alert(title: Text("Error"))
            }
            let willDisable = target.status.caseInsensitiveCompare("Active") == .orderedSame
            let nextStatus = willDisable ? "Disabled" : "Active"

            return Alert(
                title: Text(willDisable ? "Disable Staff Account?" : "Enable Staff Account?"),
                message: Text(willDisable ?
                    "Disabling '\(target.username)' will block CRM login access immediately. Customer data remains safe." :
                    "Enabling '\(target.username)' will restore login access."),
                primaryButton: .destructive(Text(willDisable ? "Disable" : "Enable")) {
                    isSubmitting = true
                    SupabaseIOSClient.shared.toggleStaffStatus(targetUserId: target.id, newStatus: nextStatus) { res in
                        isSubmitting = false
                        switch res {
                        case .success:
                            toastMsg = "Staff account '\(target.username)' \(nextStatus.lowercased()) successfully."
                            loadUsers()
                        case .failure(let err):
                            toastMsg = "Error: \(err.localizedDescription)"
                        }
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }

    @ViewBuilder
    private func userCardView(user: IOSUserItem) -> some View {
        let isAdmin = user.role.uppercased() == "ADMIN"
        let isStaff = user.role.uppercased() == "STAFF"
        let isActive = user.status.caseInsensitiveCompare("Active") == .orderedSame

        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(user.username)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)
                    Text(user.email)
                        .font(.caption2)
                        .foregroundColor(textMuted)
                }

                Spacer()

                HStack(spacing: 6) {
                    // ROLE BADGE
                    Text(isAdmin ? "ADMIN" : "STAFF")
                        .font(.system(size: 10, weight: .bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(isAdmin ? Color.blue.opacity(0.12) : cardSubBg)
                        .foregroundColor(isAdmin ? .blue : textMuted)
                        .cornerRadius(6)

                    // STATUS BADGE
                    Text(isActive ? "Active" : "Disabled")
                        .font(.system(size: 10, weight: .bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(isActive ? Color.green.opacity(0.15) : Color.red.opacity(0.15))
                        .foregroundColor(isActive ? .green : .red)
                        .cornerRadius(6)
                }
            }

            Divider()
                .background(cardSubBg)

            HStack {
                Text("Created: \(user.createdAt)")
                    .font(.caption2)
                    .foregroundColor(textMuted)

                Spacer()

                if isAdmin {
                    Text("Admin Account")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(cardSubBg)
                        .foregroundColor(textMuted)
                        .cornerRadius(6)
                } else if currentUserRole == "ADMIN" && isStaff {
                    HStack(spacing: 8) {
                        Button(action: {
                            newPasswordInput = ""
                            confirmPasswordInput = ""
                            passwordDialogError = nil
                            passwordTargetUser = user
                        }) {
                            Text("Password")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.blue, lineWidth: 1))
                                .foregroundColor(.blue)
                        }

                        Button(action: {
                            statusTargetUser = user
                            showStatusAlert = true
                        }) {
                            Text(isActive ? "Disable" : "Enable")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(isActive ? Color.red : Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(6)
                        }
                    }
                }
            }
        }
        .padding(14)
        .background(cardBg)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(isDarkMode ? 0.3 : 0.05), radius: 4, x: 0, y: 2)
    }

    @ViewBuilder
    private func changePasswordSheet(target: IOSUserItem) -> some View {
        VStack(spacing: 16) {
            Text("Change Staff Password")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(textPrimary)

            Text("Set a new password for staff '\(target.username)'")
                .font(.caption)
                .foregroundColor(textMuted)

            if let err = passwordDialogError {
                Text("⚠️ \(err)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.red)
            }

            SecureField("New Password (min 6 chars)", text: $newPasswordInput)
                .padding(10)
                .background(cardSubBg)
                .cornerRadius(8)

            SecureField("Confirm New Password", text: $confirmPasswordInput)
                .padding(10)
                .background(cardSubBg)
                .cornerRadius(8)

            HStack {
                Button("Cancel") {
                    passwordTargetUser = nil
                }
                .font(.subheadline)
                .foregroundColor(textMuted)

                Spacer()

                Button(action: {
                    if newPasswordInput.count < 6 {
                        passwordDialogError = "Password must be at least 6 characters."
                    } else if newPasswordInput != confirmPasswordInput {
                        passwordDialogError = "Passwords do not match."
                    } else {
                        isSubmitting = true
                        SupabaseIOSClient.shared.changeStaffPassword(targetUserId: target.id, newPassword: newPasswordInput) { res in
                            isSubmitting = false
                            switch res {
                            case .success:
                                toastMsg = "Password updated for '\(target.username)'."
                                passwordTargetUser = nil
                                loadUsers()
                            case .failure(let err):
                                passwordDialogError = err.localizedDescription
                            }
                        }
                    }
                }) {
                    Text("Update Password")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
            }
            .padding(.top, 10)
        }
        .padding(20)
        .background(cardBg)
    }
}
