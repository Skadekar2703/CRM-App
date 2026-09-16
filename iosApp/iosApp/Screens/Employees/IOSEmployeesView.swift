import SwiftUI
import PhotosUI

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

    @State private var employees: [IOSEmployeeItem] = []
    @State private var transactions: [IOSEmployeeTransactionItem] = []
    @State private var isLoading: Bool = true

    @State private var searchQuery = ""
    @State private var showFormSheet = false
    @State private var editingEmployee: IOSEmployeeItem? = nil
    @State private var deletingEmployee: IOSEmployeeItem? = nil
    @State private var selectedDetailEmployee: IOSEmployeeItem? = nil
    @State private var userRole: String = "STAFF"

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

    func fetchEmployees() {
        isLoading = true
        SupabaseIOSClient.shared.fetchTable(table: "employees") { result in
            DispatchQueue.main.async {
                self.isLoading = false
                switch result {
                case .success(let items):
                    var list: [IOSEmployeeItem] = []
                    let dateFormatter = DateFormatter()
                    dateFormatter.dateFormat = "yyyy-MM-dd"

                    for item in items {
                        let idStr = item["id"] as? String ?? ""
                        let uidStr = item["uid"] as? String ?? "EMP-101"
                        let nameStr = item["name"] as? String ?? "Staff Member"
                        let roleStr = item["role"] as? String ?? "Staff"
                        let mobileStr = item["mobile"] as? String ?? (item["phone"] as? String ?? "")
                        let emailStr = item["email"] as? String ?? ""
                        let addressStr = item["address"] as? String ?? ""
                        let bankNameStr = item["bank_name"] as? String ?? ""
                        let bankAccountStr = item["bank_account"] as? String ?? ""
                        let idNumberStr = item["id_number"] as? String ?? ""
                        let emergencyContactStr = item["emergency_contact"] as? String ?? ""

                        let joinedOnStr = item["joined_on"] as? String ?? ""
                        let joinedOnDate = dateFormatter.date(from: String(joinedOnStr.prefix(10))) ?? Date()

                        let leftOnStr = item["left_on"] as? String ?? ""
                        let leftOnDate = leftOnStr.isEmpty ? nil : dateFormatter.date(from: String(leftOnStr.prefix(10)))

                        let photoUrlStr = item["photo_url"] as? String ?? ""
                        let remarkStr = item["remark"] as? String ?? ""
                        let activeDaysInt = (item["active_days"] as? NSNumber)?.intValue ?? 0
                        let salaryDb = (item["salary"] as? NSNumber)?.doubleValue ?? 0.0
                        let salaryTypeStr = item["salary_type"] as? String ?? "Monthly"
                        let udhaarBalDb = (item["udhaar_balance"] as? NSNumber)?.doubleValue ?? 0.0
                        let ctcYtdDb = (item["ctc_ytd"] as? NSNumber)?.doubleValue ?? 0.0
                        let statusStr = item["status"] as? String ?? "Active"

                        list.append(IOSEmployeeItem(
                            id: idStr,
                            uid: uidStr,
                            name: nameStr,
                            role: roleStr,
                            mobile: mobileStr,
                            email: emailStr,
                            address: addressStr,
                            bankName: bankNameStr,
                            bankAccount: bankAccountStr,
                            idNumber: idNumberStr,
                            emergencyContact: emergencyContactStr,
                            joinedOn: joinedOnDate,
                            leftOn: leftOnDate,
                            photoUrl: photoUrlStr,
                            remark: remarkStr,
                            activeDays: activeDaysInt,
                            salary: salaryDb,
                            salaryType: salaryTypeStr,
                            udhaarBalance: udhaarBalDb,
                            ctcYtd: ctcYtdDb,
                            status: statusStr
                        ))
                    }
                    self.employees = list
                case .failure(let err):
                    self.toastMsg = "Failed to load employees: \(err.localizedDescription)"
                }
            }
        }
    }

    func fetchTransactions() {
        SupabaseIOSClient.shared.fetchTable(table: "employee_transactions") { result in
            DispatchQueue.main.async {
                if case .success(let items) = result {
                    var list: [IOSEmployeeTransactionItem] = []
                    let dateFormatter = DateFormatter()
                    dateFormatter.dateFormat = "yyyy-MM-dd"

                    for item in items {
                        let idStr = item["id"] as? String ?? ""
                        let empIdStr = item["employee_id"] as? String ?? ""
                        let typeStr = item["type"] as? String ?? "Gift"
                        let amt = (item["amount"] as? NSNumber)?.doubleValue ?? 0.0
                        let dateStr = item["date"] as? String ?? ""
                        let d = dateFormatter.date(from: String(dateStr.prefix(10))) ?? Date()
                        let noteStr = item["note"] as? String ?? ""

                        list.append(IOSEmployeeTransactionItem(
                            id: idStr,
                            employeeId: empIdStr,
                            type: typeStr,
                            amount: amt,
                            date: d,
                            note: noteStr
                        ))
                    }
                    self.transactions = list
                }
            }
        }
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
                if isLoading {
                    VStack {
                        Spacer()
                        ProgressView("Loading employees...")
                        Spacer()
                    }
                } else if filteredEmployees.isEmpty {
                    VStack {
                        Spacer()
                        Text("No staff members found.")
                            .font(.subheadline)
                            .foregroundColor(textMuted)
                        Spacer()
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 14) {
                            ForEach(filteredEmployees) { employee in
                                IOSEmployeeCard(
                                    employee: employee,
                                    userRole: userRole,
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
                                        if userRole.uppercased() == "ADMIN" {
                                            deletingEmployee = employee
                                        }
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
        .onAppear {
            self.userRole = SupabaseIOSClient.shared.userRole.uppercased()
            self.fetchEmployees()
            self.fetchTransactions()
        }
        .sheet(isPresented: $showFormSheet) {
            IOSEmployeeFormSheet(
                employee: editingEmployee,
                onSave: {
                    self.fetchEmployees()
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
                        let dateFormatter = DateFormatter()
                        dateFormatter.dateFormat = "yyyy-MM-dd"

                        let payload: [String: Any] = [
                            "employee_id": emp.id,
                            "employee_uid": emp.uid,
                            "type": type,
                            "amount": amount,
                            "date": dateFormatter.string(from: date),
                            "note": note
                        ]
                        SupabaseIOSClient.shared.insertRecord(table: "employee_transactions", payload: payload) { _ in
                            DispatchQueue.main.async {
                                self.toastMsg = "Recorded \(type) of ₹\(Int(amount))"
                                self.fetchEmployees()
                                self.fetchTransactions()
                                self.showTxSheet = false
                            }
                        }
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
        .sheet(item: $deletingEmployee) { target in
            IOSThreeStepDeleteSheet(
                itemName: "Employee: \(target.name)",
                itemDetails: "UID: \(target.uid) | Role: \(target.role)",
                userRole: userRole,
                onConfirmDelete: {
                    SupabaseIOSClient.shared.deleteRecord(table: "employees", id: target.id) { _ in
                        DispatchQueue.main.async {
                            toastMsg = "Employee '\(target.name)' deleted"
                            fetchEmployees()
                        }
                    }
                }
            )
        }
    }
}

struct IOSEmployeeCard: View {
    let employee: IOSEmployeeItem
    var userRole: String = "STAFF"
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
                if !employee.photoUrl.isEmpty, let url = URL(string: employee.photoUrl) {
                    AsyncImage(url: url) { phase in
                        if let image = phase.image {
                            image.resizable()
                                .scaledToFill()
                                .frame(width: 44, height: 44)
                                .clipShape(Circle())
                        } else {
                            ZStack {
                                Circle().fill(Color.blue.opacity(0.12)).frame(width: 44, height: 44)
                                Text(employee.initials).font(.subheadline).fontWeight(.bold).foregroundColor(.blue)
                            }
                        }
                    }
                } else {
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

                if userRole.uppercased() == "ADMIN" {
                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .font(.subheadline)
                            .foregroundColor(.red.opacity(0.8))
                    }
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
    var onSave: () -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var name = ""
    @State private var mobile = ""
    @State private var role = "Staff"
    @State private var status = "Active"
    @State private var salaryType = "Monthly"
    @State private var salaryStr = ""
    @State private var joinedOn = Date()
    @State private var hasLeft = false
    @State private var leftOn = Date()
    @State private var bankName = ""
    @State private var bankAccount = ""
    @State private var idNumber = ""
    @State private var emergencyContact = ""
    @State private var address = ""
    @State private var remark = ""
    @State private var photoUrl = ""

    @State private var selectedPhotoItem: PhotosPickerItem? = nil
    @State private var selectedPhotoImage: UIImage? = nil
    @State private var isUploadingPhoto = false
    @State private var errorMsg: String? = nil
    @State private var isSaving = false

    let roleOptions = ["Helper", "Labour", "Driver", "Staff", "Manager", "Operator"]
    let statusOptions = ["Active", "Inactive"]
    let salaryTypeOptions = ["Monthly", "Per Day"]

    var body: some View {
        NavigationView {
            Form {
                if let err = errorMsg {
                    Section {
                        Text("⚠️ \(err)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                    }
                }

                // 1. EMPLOYEE PHOTO
                Section(header: Text("EMPLOYEE PHOTO")) {
                    HStack(spacing: 14) {
                        PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                            HStack {
                                if let img = selectedPhotoImage {
                                    Image(uiImage: img)
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 56, height: 56)
                                        .clipShape(Circle())
                                        .overlay(Circle().stroke(Color.blue, lineWidth: 2))
                                } else if !photoUrl.isEmpty, let url = URL(string: photoUrl) {
                                    AsyncImage(url: url) { phase in
                                        if let image = phase.image {
                                            image.resizable().scaledToFill().frame(width: 56, height: 56).clipShape(Circle())
                                        } else {
                                            Image(systemName: "person.crop.circle.fill").resizable().frame(width: 56, height: 56).foregroundColor(.blue)
                                        }
                                    }
                                } else {
                                    Image(systemName: "camera.circle.fill")
                                        .resizable()
                                        .frame(width: 56, height: 56)
                                        .foregroundColor(.blue)
                                }

                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Employee Photo").font(.subheadline).bold()
                                    Text(isUploadingPhoto ? "Uploading..." : (!photoUrl.isEmpty || selectedPhotoImage != nil) ? "Tap to Replace Photo" : "Tap to Add Photo")
                                        .font(.caption)
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                        .onChange(of: selectedPhotoItem) { newItem in
                            Task {
                                if let data = try? await newItem?.loadTransferable(type: Data.self),
                                   let uiImage = UIImage(data: data) {
                                    await MainActor.run {
                                        self.selectedPhotoImage = uiImage
                                        self.isUploadingPhoto = true
                                        self.errorMsg = nil
                                    }
                                    let fileName = "emp_\(Int(Date().timeIntervalSince1970)).jpg"
                                    SupabaseIOSClient.shared.uploadEmployeePhoto(imageData: data, fileName: fileName) { result in
                                        DispatchQueue.main.async {
                                            self.isUploadingPhoto = false
                                            switch result {
                                            case .success(let publicUrl):
                                                self.photoUrl = publicUrl
                                            case .failure(let err):
                                                self.errorMsg = "Photo upload error: \(err.localizedDescription)"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // 2. FULL NAME * & 3. MOBILE NUMBER * & 4. ROLE & 5. STATUS
                Section(header: Text("BASIC DETAILS")) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Full Name *").font(.caption).bold().foregroundColor(.secondary)
                        TextField("e.g. Ravi Kumar", text: $name)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Mobile Number *").font(.caption).bold().foregroundColor(.secondary)
                        TextField("e.g. +91 98765 43210", text: $mobile)
                            .keyboardType(.phonePad)
                    }

                    Picker("Role / Designation", selection: $role) {
                        ForEach(roleOptions, id: \.self) { r in
                            Text(r).tag(r)
                        }
                    }

                    Picker("Status", selection: $status) {
                        ForEach(statusOptions, id: \.self) { st in
                            Text(st).tag(st)
                        }
                    }
                }

                // 6. SALARY TYPE & 7. SALARY / RATE
                Section(header: Text("SALARY & COMPENSATION")) {
                    Picker("Salary Type", selection: $salaryType) {
                        ForEach(salaryTypeOptions, id: \.self) { st in
                            Text(st).tag(st)
                        }
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Salary / Rate (₹)").font(.caption).bold().foregroundColor(.secondary)
                        TextField("e.g. 25000 or 850", text: $salaryStr)
                            .keyboardType(.decimalPad)
                    }
                }

                // 8. JOINED ON * & 9. LEFT ON
                Section(header: Text("EMPLOYMENT DATES")) {
                    DatePicker("Joined On *", selection: $joinedOn, displayedComponents: .date)

                    Toggle("Has Left Company", isOn: $hasLeft)
                    if hasLeft {
                        DatePicker("Left On (Optional)", selection: $leftOn, displayedComponents: .date)
                    }
                }

                // 10. BANK NAME & 11. BANK ACCOUNT & 12. ID NUMBER & 13. EMERGENCY CONTACT
                Section(header: Text("BANKING & IDENTITY")) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Bank Name").font(.caption).bold().foregroundColor(.secondary)
                        TextField("e.g. HDFC Bank", text: $bankName)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Bank Account / IBAN").font(.caption).bold().foregroundColor(.secondary)
                        TextField("e.g. 5010023456789", text: $bankAccount)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("ID / CNIC / Identity No").font(.caption).bold().foregroundColor(.secondary)
                        TextField("e.g. AADH-9876-1234", text: $idNumber)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Emergency Contact").font(.caption).bold().foregroundColor(.secondary)
                        TextField("e.g. +91 98111 22233", text: $emergencyContact)
                            .keyboardType(.phonePad)
                    }
                }

                // 14. ADDRESS & 15. REMARK / NOTES
                Section(header: Text("ADDRESS & NOTES")) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Address").font(.caption).bold().foregroundColor(.secondary)
                        TextField("e.g. House #45, Industrial Area, Sector 5", text: $address)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Remark / Notes").font(.caption).bold().foregroundColor(.secondary)
                        TextField("e.g. Skilled machine operator, shifts day/night", text: $remark)
                    }
                }
            }
            .navigationTitle(employee == nil ? "Add New Employee" : "Edit Employee Profile")
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                },
                trailing: Button(employee == nil ? "Add Employee" : "Save Changes") {
                    saveEmployee()
                }
                .font(.headline)
                .foregroundColor(.blue)
                .disabled(isSaving || isUploadingPhoto)
            )
            .onAppear {
                if let e = employee {
                    name = e.name
                    mobile = e.mobile
                    role = e.role
                    status = e.status
                    salaryType = e.salaryType
                    salaryStr = e.salary > 0 ? (e.salary.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(e.salary)) : String(e.salary)) : ""
                    joinedOn = e.joinedOn
                    if let l = e.leftOn {
                        hasLeft = true
                        leftOn = l
                    }
                    bankName = e.bankName
                    bankAccount = e.bankAccount
                    idNumber = e.idNumber
                    emergencyContact = e.emergencyContact
                    address = e.address
                    remark = e.remark
                    photoUrl = e.photoUrl
                }
            }
        }
    }

    private func saveEmployee() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let trimmedMobile = mobile.trimmingCharacters(in: .whitespaces)

        if trimmedName.isEmpty {
            errorMsg = "Full Name is required."
            return
        }
        if trimmedMobile.isEmpty {
            errorMsg = "Mobile Number is required."
            return
        }
        if isUploadingPhoto {
            errorMsg = "Photo is still uploading. Please wait..."
            return
        }

        isSaving = true
        errorMsg = nil

        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"

        var payload: [String: Any] = [
            "name": trimmedName,
            "mobile": trimmedMobile,
            "role": role.isEmpty ? "Staff" : role,
            "status": status,
            "salary_type": salaryType,
            "salary": Double(salaryStr) ?? 0.0,
            "joined_on": dateFormatter.string(from: joinedOn),
            "bank_name": bankName.trimmingCharacters(in: .whitespaces),
            "bank_account": bankAccount.trimmingCharacters(in: .whitespaces),
            "id_number": idNumber.trimmingCharacters(in: .whitespaces),
            "emergency_contact": emergencyContact.trimmingCharacters(in: .whitespaces),
            "address": address.trimmingCharacters(in: .whitespaces),
            "remark": remark.trimmingCharacters(in: .whitespaces)
        ]
        if !photoUrl.isEmpty {
            payload["photo_url"] = photoUrl
        }
        if hasLeft {
            payload["left_on"] = dateFormatter.string(from: leftOn)
        }

        if let target = employee {
            SupabaseIOSClient.shared.updateRecord(table: "employees", id: target.id, payload: payload) { result in
                DispatchQueue.main.async {
                    self.isSaving = false
                    switch result {
                    case .success:
                        self.onSave()
                        self.presentationMode.wrappedValue.dismiss()
                    case .failure(let err):
                        self.errorMsg = "Failed to update employee: \(err.localizedDescription)"
                    }
                }
            }
        } else {
            payload["uid"] = "EMP-\(Int.random(in: 1000...9999))"
            SupabaseIOSClient.shared.insertRecord(table: "employees", payload: payload) { result in
                DispatchQueue.main.async {
                    self.isSaving = false
                    switch result {
                    case .success:
                        self.onSave()
                        self.presentationMode.wrappedValue.dismiss()
                    case .failure(let err):
                        self.errorMsg = "Failed to add employee: \(err.localizedDescription)"
                    }
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
                        if !employee.photoUrl.isEmpty, let url = URL(string: employee.photoUrl) {
                            AsyncImage(url: url) { phase in
                                if let image = phase.image {
                                    image.resizable()
                                        .scaledToFill()
                                        .frame(width: 54, height: 54)
                                        .clipShape(Circle())
                                } else {
                                    ZStack {
                                        Circle().fill(Color.blue.opacity(0.12)).frame(width: 54, height: 54)
                                        Text(employee.initials).font(.title2).fontWeight(.bold).foregroundColor(.blue)
                                    }
                                }
                            }
                        } else {
                            ZStack {
                                Circle()
                                    .fill(Color.blue.opacity(0.12))
                                    .frame(width: 54, height: 54)
                                Text(employee.initials)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                            }
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
