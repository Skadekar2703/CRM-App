import SwiftUI

struct IOSEmployeesView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Employees",
            onNavigateSection: onNavigateSection
        ) {
            IOSEmployeesContentView()
        }
    }
}

struct IOSEmployeeItem: Identifiable {
    let id: String
    var name: String
    var role: String
    var mobile: String
    var email: String
    var udhaarBalance: Double

    var initials: String {
        let parts = name.split(separator: " ").compactMap { $0.first }
        if parts.count >= 2 {
            return "\(parts[0])\(parts[1])".uppercased()
        } else if let first = parts.first {
            return String(first).uppercased()
        }
        return "E"
    }
}

struct IOSEmployeesContentView: View {
    @State private var employees: [IOSEmployeeItem] = [
        IOSEmployeeItem(
            id: "EMP-001",
            name: "Ramesh Kumar",
            role: "Senior Sales Exec",
            mobile: "+91 98765 43210",
            email: "ramesh@crm.com",
            udhaarBalance: 12500.0
        ),
        IOSEmployeeItem(
            id: "EMP-002",
            name: "Suresh Tiwari",
            role: "Delivery Partner",
            mobile: "+91 87654 32109",
            email: "suresh@crm.com",
            udhaarBalance: 4200.0
        ),
        IOSEmployeeItem(
            id: "EMP-003",
            name: "Anita Desai",
            role: "Store Manager",
            mobile: "+91 76543 21098",
            email: "anita@crm.com",
            udhaarBalance: 0.0
        ),
        IOSEmployeeItem(
            id: "EMP-004",
            name: "Vikas Gupta",
            role: "Field Executive",
            mobile: "+91 91234 56789",
            email: "vikas@crm.com",
            udhaarBalance: 8900.0
        )
    ]

    @State private var searchQuery = ""
    @State private var showFormSheet = false
    @State private var editingEmployee: IOSEmployeeItem? = nil
    @State private var deletingEmployee: IOSEmployeeItem? = nil
    @State private var showDeleteAlert = false
    @State private var toastMsg: String? = nil

    var filteredEmployees: [IOSEmployeeItem] {
        employees.filter { e in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            if q.isEmpty { return true }
            return e.id.lowercased().contains(q) || e.name.lowercased().contains(q) || e.role.lowercased().contains(q) || e.mobile.lowercased().contains(q)
        }
    }

    var totalOutstanding: Double {
        employees.reduce(0) { $0 + $1.udhaarBalance }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Color(red: 248/255, green: 250/255, blue: 252/255).ignoresSafeArea()

            VStack(spacing: 14) {
                // SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search employees...", text: $searchQuery)
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
                .padding(.top, 8)

                // TEAM SUMMARY SECTION
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Team Roster")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                        Text("\(filteredEmployees.count) Staff Members")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        Text("Total Outstanding")
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .foregroundColor(.gray)
                        Text("₹\(Int(totalOutstanding))")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                    }
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

                // EMPLOYEE CARDS LIST
                ScrollView {
                    LazyVStack(spacing: 14) {
                        ForEach(filteredEmployees) { employee in
                            IOSEmployeeCard(
                                employee: employee,
                                onCall: {
                                    if let url = URL(string: "tel://\(employee.mobile.replacingOccurrences(of: " ", with: "").replacingOccurrences(of: "-", with: ""))") {
                                        UIApplication.shared.open(url)
                                    }
                                },
                                onEdit: {
                                    editingEmployee = employee
                                    showFormSheet = true
                                },
                                onDelete: {
                                    deletingEmployee = employee
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
                editingEmployee = nil
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
            IOSEmployeeFormSheet(
                employee: editingEmployee,
                onSave: { name, role, mobile, email, udhaarBal in
                    if let target = editingEmployee, let idx = employees.firstIndex(where: { $0.id == target.id }) {
                        employees[idx].name = name
                        employees[idx].role = role
                        employees[idx].mobile = mobile
                        employees[idx].email = email
                        employees[idx].udhaarBalance = udhaarBal
                        toastMsg = "Employee '\(name)' updated"
                    } else {
                        let newE = IOSEmployeeItem(
                            id: "EMP-00\(employees.count + 1)",
                            name: name,
                            role: role.isEmpty ? "Staff" : role,
                            mobile: mobile,
                            email: email,
                            udhaarBalance: udhaarBal
                        )
                        employees.insert(newE, at: 0)
                        toastMsg = "Employee '\(name)' added"
                    }
                    showFormSheet = false
                }
            )
        }
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Delete Employee"),
                message: Text("Are you sure you want to delete '\(deletingEmployee?.name ?? "")' (\(deletingEmployee?.role ?? ""))?"),
                primaryButton: .destructive(Text("Delete")) {
                    if let target = deletingEmployee {
                        employees.removeAll { $0.id == target.id }
                        toastMsg = "Employee '\(target.name)' deleted"
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSEmployeeCard: View {
    let employee: IOSEmployeeItem
    var onCall: () -> Void
    var onEdit: () -> Void
    var onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // AVATAR, NAME, ROLE, DELETE ICON
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Color.blue.opacity(0.12))
                        .frame(width: 44, height: 44)
                        .overlay(Circle().stroke(Color.blue.opacity(0.3), lineWidth: 1))
                    Text(employee.initials)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(employee.name)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                    Text(employee.role)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }

                Spacer()

                Button(action: onDelete) {
                    Image(systemName: "trash")
                        .font(.subheadline)
                        .foregroundColor(.red.opacity(0.8))
                }
            }

            // MOBILE NUMBER
            HStack(spacing: 6) {
                Image(systemName: "phone.fill")
                    .font(.caption)
                    .foregroundColor(.gray)
                Text(employee.mobile)
                    .font(.subheadline)
                    .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
            }

            // UDHAAR BAL ROW
            HStack {
                Text("Udhaar Bal:")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.gray)

                Spacer()

                Text("₹\(Int(employee.udhaarBalance))")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(employee.udhaarBalance > 0 ? .red : .green)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color(red: 248/255, green: 250/255, blue: 252/255))
            .cornerRadius(10)

            Divider()

            // ACTIONS: CALL, EDIT
            HStack(spacing: 10) {
                Button(action: onCall) {
                    HStack(spacing: 6) {
                        Image(systemName: "phone.fill")
                        Text("Call")
                    }
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
                    .frame(maxWidth: .infinity)
                    .frame(height: 38)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(10)
                }

                Button(action: onEdit) {
                    HStack(spacing: 6) {
                        Image(systemName: "pencil")
                        Text("Edit")
                    }
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                    .frame(maxWidth: .infinity)
                    .frame(height: 38)
                    .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                    .cornerRadius(10)
                }
            }
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

struct IOSEmployeeFormSheet: View {
    var employee: IOSEmployeeItem?
    var onSave: (String, String, String, String, Double) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var name = ""
    @State private var role = ""
    @State private var mobile = ""
    @State private var email = ""
    @State private var udhaarBalance = "0"

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Employee Details")) {
                    TextField("Employee Name *", text: $name)
                    TextField("Role / Designation (e.g. Sales Exec)", text: $role)
                    TextField("Mobile Number", text: $mobile)
                        .keyboardType(.phonePad)
                    TextField("Email Address", text: $email)
                        .keyboardType(.emailAddress)
                }

                Section(header: Text("Udhaar Balance")) {
                    TextField("Udhaar Balance (₹)", text: $udhaarBalance)
                        .keyboardType(.numberPad)
                }
            }
            .navigationTitle(employee == nil ? "Add Employee" : "Edit Employee")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    let bal = Double(udhaarBalance) ?? 0.0
                    onSave(name, role, mobile, email, bal)
                }.disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            )
            .onAppear {
                if let e = employee {
                    name = e.name
                    role = e.role
                    mobile = e.mobile
                    email = e.email
                    udhaarBalance = "\(Int(e.udhaarBalance))"
                }
            }
        }
    }
}
