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
    var uid: String
    var name: String
    var role: String
    var mobile: String
    var email: String
    var address: String
    var bankName: String
    var bankAccount: String
    var idNumber: String
    var emergencyContact: String
    var joinedOn: Date
    var leftOn: Date?
    var photoUrl: String
    var remark: String
    var activeDays: Int
    var salary: Double
    var salaryType: String
    var udhaarBalance: Double
    var ctcYtd: Double
    var status: String

    var initials: String {
        let parts = name.split(separator: " ").compactMap { $0.first }
        if parts.count >= 2 {
            return "\(parts[0])\(parts[1])".uppercased()
        } else if let first = parts.first {
            return String(first).uppercased()
        }
        return "E"
    }

    var joinedOnFormatted: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "dd MMM yyyy"
        return formatter.string(from: joinedOn)
    }

    var salaryDisplay: String {
        if salary > 0 {
            return salaryType.lowercased().contains("day") ? "₹\(Int(salary)) / day" : "₹\(Int(salary)) / mo"
        }
        return "Salary Not Set"
    }
}

struct IOSEmployeeTransactionItem: Identifiable {
    let id: String
    let employeeId: String
    let type: String
    let amount: Double
    let date: Date
    let note: String

    var dateFormatted: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "dd MMM yyyy"
        return formatter.string(from: date)
    }
}

struct IOSEmployeesContentView: View {
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }
    private var bgApp: Color { isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color(red: 248/255, green: 250/255, blue: 252/255) }
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 15/255, green: 23/255, blue: 42/255) }
    private var textMuted: Color { Color(red: 100/255, green: 116/255, blue: 139/255) }

    @State private var employees: [IOSEmployeeItem] = [
        IOSEmployeeItem(
            id: "1",
            uid: "EMP-101",
            name: "Ramesh Kumar",
            role: "Senior Sales Exec",
            mobile: "+91 98765 43210",
            email: "ramesh@crm.com",
            address: "Sector 14, Industrial Area",
            bankName: "HDFC Bank",
            bankAccount: "501002345678",
            idNumber: "AADH-9876-1234",
            emergencyContact: "+91 98111 22233",
            joinedOn: Calendar.current.date(byAdding: .month, value: -14, to: Date()) ?? Date(),
            leftOn: nil,
            photoUrl: "",
            remark: "Reliable team leader",
            activeDays: 420,
            salary: 35000.0,
            salaryType: "Monthly",
            udhaarBalance: 12500.0,
            ctcYtd: 420000.0,
            status: "Active"
        ),
        IOSEmployeeItem(
            id: "2",
            uid: "EMP-102",
            name: "Suresh Tiwari",
            role: "Delivery Partner",
            mobile: "+91 87654 32109",
            email: "suresh@crm.com",
            address: "Main Market Road",
            bankName: "SBI",
            bankAccount: "30291827364",
            idNumber: "CNIC-4433-2211",
            emergencyContact: "+91 87000 11122",
            joinedOn: Calendar.current.date(byAdding: .month, value: -6, to: Date()) ?? Date(),
            leftOn: nil,
            photoUrl: "",
            remark: "Shift driver",
            activeDays: 180,
            salary: 850.0,
            salaryType: "Per Day",
            udhaarBalance: 4200.0,
            ctcYtd: 180000.0,
            status: "Active"
        ),
        IOSEmployeeItem(
            id: "3",
            uid: "EMP-103",
            name: "Anita Desai",
            role: "Store Manager",
            mobile: "+91 76543 21098",
            email: "anita@crm.com",
            address: "Civil Lines",
            bankName: "ICICI Bank",
            bankAccount: "001122334455",
            idNumber: "PAN-ABCDE1234F",
            emergencyContact: "+91 99887 76655",
            joinedOn: Calendar.current.date(byAdding: .year, value: -2, to: Date()) ?? Date(),
            leftOn: nil,
            photoUrl: "",
            remark: "Operations head",
            activeDays: 730,
            salary: 50000.0,
            salaryType: "Monthly",
            udhaarBalance: 0.0,
            ctcYtd: 600000.0,
            status: "Active"
        )
    ]

    @State private var transactions: [IOSEmployeeTransactionItem] = []

    @State private var searchQuery = ""
    @State private var showFormSheet = false
    @State private var editingEmployee: IOSEmployeeItem? = nil
    @State private var deletingEmployee: IOSEmployeeItem? = nil
    @State private var selectedDetailEmployee: IOSEmployeeItem? = nil
    @State private var showDeleteAlert = false

    // Transaction Sheet
    @State private var showTxSheet = false
    @State private var txTargetEmployee: IOSEmployeeItem? = nil
    @State private var txType: String = "Gift"

    @State private var toastMsg: String? = nil

    var filteredEmployees: [IOSEmployeeItem] {
        employees.filter { e in
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            if q.isEmpty { return true }
            return e.uid.lowercased().contains(q) || e.name.lowercased().contains(q) || e.role.lowercased().contains(q) || e.mobile.lowercased().contains(q)
        }
    }

    var totalOutstanding: Double {
        employees.reduce(0) { $0 + $1.udhaarBalance }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            bgApp.ignoresSafeArea()

            VStack(spacing: 14) {
                // SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search employees by UID, Name, Role...", text: $searchQuery)
                    if !searchQuery.isEmpty {
                        Button(action: { searchQuery = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding(10)
                .background(cardBg)
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // TEAM SUMMARY SECTION
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Employee Roster")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(textPrimary)
                        Text("\(filteredEmployees.count) Staff Members")
                            .font(.caption)
                            .foregroundColor(textMuted)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        Text("Total Udhaar")
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .foregroundColor(textMuted)
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
                                onSelect: {
                                    selectedDetailEmployee = employee
                                },
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
                onSave: { newEmp in
                    if let target = editingEmployee, let idx = employees.firstIndex(where: { $0.id == target.id }) {
                        employees[idx] = newEmp
                        toastMsg = "Employee '\(newEmp.name)' updated"
                    } else {
                        employees.insert(newEmp, at: 0)
                        toastMsg = "Employee '\(newEmp.name)' added"
                    }
                    showFormSheet = false
                }
            )
        }
        .sheet(isPresented: $showTxSheet) {
            if let emp = txTargetEmployee {
                IOSEmployeeTxSheet(
                    employee: emp,
                    initialType: txType,
                    onSave: { type, amount, date, note in
                        let newTx = IOSEmployeeTransactionItem(
                            id: UUID().uuidString,
                            employeeId: emp.id,
                            type: type,
                            amount: amount,
                            date: date,
                            note: note
                        )
                        transactions.append(newTx)

                        // Update Udhaar balance
                        if let idx = employees.firstIndex(where: { $0.id == emp.id }) {
                            if type == "Employee Udhaar" {
                                employees[idx].udhaarBalance += amount
                            } else if type == "Udhaar Repayment" {
                                employees[idx].udhaarBalance = max(0, employees[idx].udhaarBalance - amount)
                            }
                        }

                        toastMsg = "Recorded \(type) of ₹\(Int(amount))"
                        showTxSheet = false
                    }
                )
            }
        }
        .sheet(item: $selectedDetailEmployee) { emp in
            IOSEmployeeDetailSheet(
                employee: emp,
                transactions: transactions.filter { $0.employeeId == emp.id },
                onAddTx: { type in
                    selectedDetailEmployee = nil
                    txTargetEmployee = emp
                    txType = type
                    showTxSheet = true
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
    var onSelect: () -> Void
    var onCall: () -> Void
    var onEdit: () -> Void
    var onDelete: () -> Void

    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255) }

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
                        .foregroundColor(textPrimary)
                    Text("\(employee.uid) • \(employee.role)")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.blue)
                }

                Spacer()

                Button(action: onDelete) {
                    Image(systemName: "trash")
                        .font(.subheadline)
                        .foregroundColor(.red.opacity(0.8))
                }
            }

            // MOBILE, SALARY & ACTIVE DAYS
            HStack {
                HStack(spacing: 4) {
                    Image(systemName: "phone.fill")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(employee.mobile.isEmpty ? "No Mobile" : employee.mobile)
                        .font(.subheadline)
                        .foregroundColor(textPrimary)
                }

                Spacer()

                Text(employee.salaryDisplay)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
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
            .background(isDarkMode ? Color(red: 30/255, green: 41/255, blue: 59/255) : Color(red: 248/255, green: 250/255, blue: 252/255))
            .cornerRadius(10)

            Divider()

            // ACTIONS: CALL, PROFILE, EDIT
            HStack(spacing: 8) {
                Button(action: onCall) {
                    HStack(spacing: 4) {
                        Image(systemName: "phone.fill")
                        Text("Call")
                    }
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
                    .frame(maxWidth: .infinity)
                    .frame(height: 34)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(8)
                }

                Button(action: onSelect) {
                    HStack(spacing: 4) {
                        Image(systemName: "person.text.rectangle")
                        Text("Profile")
                    }
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.purple)
                    .frame(maxWidth: .infinity)
                    .frame(height: 34)
                    .background(Color.purple.opacity(0.1))
                    .cornerRadius(8)
                }

                Button(action: onEdit) {
                    HStack(spacing: 4) {
                        Image(systemName: "pencil")
                        Text("Edit")
                    }
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(textPrimary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 34)
                    .background(isDarkMode ? Color(red: 30/255, green: 41/255, blue: 59/255) : Color(red: 241/255, green: 245/255, blue: 249/255))
                    .cornerRadius(8)
                }
            }
        }
        .padding(16)
        .background(cardBg)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

struct IOSEmployeeFormSheet: View {
    var employee: IOSEmployeeItem?
    var onSave: (IOSEmployeeItem) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var name = ""
    @State private var role = "Staff"
    @State private var mobile = ""
    @State private var email = ""
    @State private var salaryType = "Monthly"
    @State private var salaryStr = ""
    @State private var bankName = ""
    @State private var bankAccount = ""
    @State private var idNumber = ""
    @State private var emergencyContact = ""
    @State private var joinedOn = Date()
    @State private var remark = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Basic Information")) {
                    TextField("Full Name *", text: $name)
                    TextField("Role / Designation", text: $role)
                    TextField("Mobile Number *", text: $mobile)
                        .keyboardType(.phonePad)
                    TextField("Email Address", text: $email)
                        .keyboardType(.emailAddress)
                }

                Section(header: Text("Salary & Compensation")) {
                    Picker("Salary Type", selection: $salaryType) {
                        Text("Monthly").tag("Monthly")
                        Text("Per Day").tag("Per Day")
                    }
                    .pickerStyle(SegmentedPickerStyle())

                    TextField(salaryType == "Per Day" ? "Daily Rate (₹)" : "Monthly Salary (₹)", text: $salaryStr)
                        .keyboardType(.numberPad)
                }

                Section(header: Text("Dates (Joined On)")) {
                    DatePicker("Joined On Date", selection: $joinedOn, displayedComponents: .date)
                }

                Section(header: Text("Banking & Identity Details")) {
                    TextField("Bank Name", text: $bankName)
                    TextField("Bank Account Number", text: $bankAccount)
                        .keyboardType(.numberPad)
                    TextField("CNIC / ID Number", text: $idNumber)
                    TextField("Emergency Contact", text: $emergencyContact)
                        .keyboardType(.phonePad)
                }

                Section(header: Text("Remarks")) {
                    TextField("Remarks / Notes", text: $remark)
                }
            }
            .navigationTitle(employee == nil ? "Add Employee" : "Edit Employee Profile")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    let salVal = Double(salaryStr) ?? 0.0
                    let newEmp = IOSEmployeeItem(
                        id: employee?.id ?? UUID().uuidString,
                        uid: employee?.uid ?? "EMP-\(Int.random(in: 100...999))",
                        name: name.trimmingCharacters(in: .whitespaces),
                        role: role.isEmpty ? "Staff" : role,
                        mobile: mobile,
                        email: email,
                        address: employee?.address ?? "",
                        bankName: bankName,
                        bankAccount: bankAccount,
                        idNumber: idNumber,
                        emergencyContact: emergencyContact,
                        joinedOn: joinedOn,
                        leftOn: nil,
                        photoUrl: "",
                        remark: remark,
                        activeDays: employee?.activeDays ?? 1,
                        salary: salVal,
                        salaryType: salaryType,
                        udhaarBalance: employee?.udhaarBalance ?? 0.0,
                        ctcYtd: employee?.ctcYtd ?? 300000.0,
                        status: "Active"
                    )
                    onSave(newEmp)
                }.disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            )
            .onAppear {
                if let e = employee {
                    name = e.name
                    role = e.role
                    mobile = e.mobile
                    email = e.email
                    salaryType = e.salaryType
                    salaryStr = e.salary > 0 ? String(Int(e.salary)) : ""
                    bankName = e.bankName
                    bankAccount = e.bankAccount
                    idNumber = e.idNumber
                    emergencyContact = e.emergencyContact
                    joinedOn = e.joinedOn
                    remark = e.remark
                }
            }
        }
    }
}

struct IOSEmployeeTxSheet: View {
    let employee: IOSEmployeeItem
    let initialType: String
    var onSave: (String, Double, Date, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var type = "Gift"
    @State private var amountStr = ""
    @State private var date = Date()
    @State private var note = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Employee")) {
                    Text(employee.name)
                        .font(.headline)
                    Text("UID: \(employee.uid)")
                        .font(.caption)
                        .foregroundColor(.blue)
                }

                Section(header: Text("Transaction Type")) {
                    Picker("Type", selection: $type) {
                        Text("🎁 Gift").tag("Gift")
                        Text("⭐ Bonus").tag("Bonus")
                        Text("💸 Extra Payment").tag("Extra Payment")
                        Text("📉 Udhaar / Advance").tag("Employee Udhaar")
                        Text("📈 Repay Udhaar").tag("Udhaar Repayment")
                        Text("🛠️ Labour Expense").tag("Labour Expense")
                    }
                    .pickerStyle(MenuPickerStyle())
                }

                Section(header: Text("Amount & Date")) {
                    TextField("Amount (₹) *", text: $amountStr)
                        .keyboardType(.numberPad)
                    DatePicker("Transaction Date", selection: $date, displayedComponents: .date)
                }

                Section(header: Text("Note / Description")) {
                    TextField("Reason or details", text: $note)
                }
            }
            .navigationTitle("Record Entry")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    if let amt = Double(amountStr), amt > 0 {
                        onSave(type, amt, date, note)
                    }
                }.disabled((Double(amountStr) ?? 0) <= 0)
            )
            .onAppear {
                type = initialType
            }
        }
    }
}

struct IOSEmployeeDetailSheet: View {
    let employee: IOSEmployeeItem
    let transactions: [IOSEmployeeTransactionItem]
    var onAddTx: (String) -> Void

    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // HEADER
                    HStack(spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(Color.blue.opacity(0.12))
                                .frame(width: 54, height: 54)
                            Text(employee.initials)
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text(employee.name)
                                .font(.title3)
                                .fontWeight(.bold)
                            Text("\(employee.uid) • \(employee.role)")
                                .font(.subheadline)
                                .foregroundColor(.blue)
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 2) {
                            Text("Udhaar Bal")
                                .font(.caption2)
                                .foregroundColor(.gray)
                            Text("₹\(Int(employee.udhaarBalance))")
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(employee.udhaarBalance > 0 ? .red : .green)
                        }
                    }
                    .padding()
                    .background(Color.blue.opacity(0.05))
                    .cornerRadius(12)

                    // METRICS
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Employment Profile")
                            .font(.headline)
                        Group {
                            HStack {
                                Text("Joined On:")
                                Spacer()
                                Text(employee.joinedOnFormatted).fontWeight(.bold)
                            }
                            HStack {
                                Text("Active Days:")
                                Spacer()
                                Text("📅 \(employee.activeDays) Days").fontWeight(.bold)
                            }
                            HStack {
                                Text("Salary / Rate:")
                                Spacer()
                                Text(employee.salaryDisplay).fontWeight(.bold).foregroundColor(.blue)
                            }
                            if !employee.bankName.isEmpty {
                                HStack {
                                    Text("Bank Details:")
                                    Spacer()
                                    Text("\(employee.bankName) - \(employee.bankAccount)").fontWeight(.semibold)
                                }
                            }
                            if !employee.idNumber.isEmpty {
                                HStack {
                                    Text("CNIC / ID:")
                                    Spacer()
                                    Text(employee.idNumber).fontWeight(.semibold)
                                }
                            }
                        }
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    }

                    // QUICK ACTION BUTTONS
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Record Financial Entry")
                            .font(.headline)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                Button("+🎁 Gift") { onAddTx("Gift") }
                                    .padding(.horizontal, 12).padding(.vertical, 8)
                                    .background(Color.yellow.opacity(0.2)).cornerRadius(8)

                                Button("+⭐ Bonus") { onAddTx("Bonus") }
                                    .padding(.horizontal, 12).padding(.vertical, 8)
                                    .background(Color.green.opacity(0.2)).cornerRadius(8)

                                Button("+💸 Extra Pay") { onAddTx("Extra Payment") }
                                    .padding(.horizontal, 12).padding(.vertical, 8)
                                    .background(Color.blue.opacity(0.2)).cornerRadius(8)

                                Button("+📉 Udhaar") { onAddTx("Employee Udhaar") }
                                    .padding(.horizontal, 12).padding(.vertical, 8)
                                    .background(Color.red.opacity(0.2)).cornerRadius(8)
                            }
                            .font(.caption).fontWeight(.bold)
                        }
                    }

                    // TRANSACTION HISTORY
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Financial Log (\(transactions.count))")
                            .font(.headline)

                        if transactions.isEmpty {
                            Text("No transactions recorded.")
                                .font(.caption)
                                .foregroundColor(.gray)
                        } else {
                            ForEach(transactions) { tx in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(tx.type)
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                        Text(tx.dateFormatted)
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                    }
                                    Spacer()
                                    Text("₹\(Int(tx.amount))")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.blue)
                                }
                                .padding(10)
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(8)
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Employee Profile")
            .navigationBarItems(trailing: Button("Done") { presentationMode.wrappedValue.dismiss() })
        }
    }
}
