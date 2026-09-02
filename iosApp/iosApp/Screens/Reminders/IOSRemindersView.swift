import SwiftUI

struct IOSRemindersView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Reminders",
            onNavigateSection: onNavigateSection
        ) {
            IOSRemindersContentView()
        }
    }
}

struct IOSReminderItem: Identifiable {
    let id: String
    var customerId: String
    var customerName: String
    var mobile: String
    var scheduledAt: String
    var type: String
    var priority: String
    var status: String
    var notes: String
    var isOverdue: Bool
}

struct IOSRemindersContentView: View {
    @State private var reminders: [IOSReminderItem] = [
        IOSReminderItem(
            id: "REM-1001",
            customerId: "100023",
            customerName: "Imran Sheikh",
            mobile: "9821345678",
            scheduledAt: "22 May 2026, 09:00 AM",
            type: "Call",
            priority: "Normal",
            status: "Done",
            notes: "Confirm payment clearance for invoice #INV-992.",
            isOverdue: false
        ),
        IOSReminderItem(
            id: "REM-1002",
            customerId: "100024",
            customerName: "Ramesh Textiles",
            mobile: "9876543210",
            scheduledAt: "29 Aug 2026, 02:30 PM",
            type: "Payment Follow-up",
            priority: "Urgent",
            status: "Pending",
            notes: "Follow up regarding pending cheque of ₹1,80,000.",
            isOverdue: true
        ),
        IOSReminderItem(
            id: "REM-1003",
            customerId: "100025",
            customerName: "Vardhman Fabrics",
            mobile: "9988776655",
            scheduledAt: "31 Aug 2026, 11:00 AM",
            type: "WhatsApp",
            priority: "High",
            status: "Pending",
            notes: "Send cotton fabric catalogue and wholesale price list.",
            isOverdue: false
        ),
        IOSReminderItem(
            id: "REM-1004",
            customerId: "100026",
            customerName: "Sharma Wholesale",
            mobile: "9811223344",
            scheduledAt: "02 Sep 2026, 04:00 PM",
            type: "Visit",
            priority: "Normal",
            status: "Snoozed",
            notes: "Store visit for inventory stock audit.",
            isOverdue: false
        )
    ]

    @State private var searchQuery = ""
    @State private var selectedStatusChip = "All"
    @State private var showFormSheet = false
    @State private var editingReminder: IOSReminderItem? = nil
    @State private var snoozingReminder: IOSReminderItem? = nil
    @State private var deletingReminder: IOSReminderItem? = nil
    @State private var showDeleteAlert = false
    @State private var toastMsg: String? = nil

    var filteredReminders: [IOSReminderItem] {
        let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        return reminders.filter { r in
            let matchesQuery = q.isEmpty ||
                r.customerName.lowercased().contains(q) ||
                r.mobile.contains(q) ||
                r.type.lowercased().contains(q) ||
                r.notes.lowercased().contains(q)

            let matchesStatus: Bool
            switch selectedStatusChip {
            case "Pending":
                matchesStatus = r.status.caseInsensitiveCompare("Pending") == .orderedSame
            case "Done":
                matchesStatus = r.status.caseInsensitiveCompare("Done") == .orderedSame
            case "Snoozed":
                matchesStatus = r.status.caseInsensitiveCompare("Snoozed") == .orderedSame
            default:
                matchesStatus = true
            }

            return matchesQuery && matchesStatus
        }
    }

    var todaysCount: Int {
        reminders.filter { ($0.status == "Pending" || $0.status == "Snoozed") && ($0.scheduledAt.contains("29 Aug") || $0.isOverdue) }.count
    }

    var thisWeekCount: Int {
        reminders.filter { $0.status == "Pending" || $0.status == "Snoozed" }.count
    }

    var totalPendingCount: Int {
        reminders.filter { $0.status == "Pending" || $0.status == "Snoozed" }.count
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Color(red: 248/255, green: 250/255, blue: 252/255).ignoresSafeArea()

            VStack(spacing: 14) {
                // SUMMARY CARDS ROW
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Today's")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("\(todaysCount)")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("This Week")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("\(thisWeekCount)")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Total Open")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("\(totalPendingCount)")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.orange)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 2)
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search customer, mobile or type...", text: $searchQuery)
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

                // FILTER CHIPS ROW
                HStack(spacing: 8) {
                    ForEach(["All", "Pending", "Done", "Snoozed"], id: \.self) { chip in
                        let isSelected = selectedStatusChip == chip
                        Text(chip)
                            .font(.caption)
                            .fontWeight(isSelected ? .bold : .medium)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(isSelected ? Color.blue : Color.white)
                            .foregroundColor(isSelected ? .white : Color(red: 30/255, green: 41/255, blue: 59/255))
                            .cornerRadius(20)
                            .overlay(
                                RoundedRectangle(cornerRadius: 20)
                                    .stroke(isSelected ? Color.blue : Color(red: 203/255, green: 213/255, blue: 225/255), lineWidth: 1)
                            )
                            .onTapGesture {
                                selectedStatusChip = chip
                            }
                    }
                    Spacer()
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

                // LIST OF REMINDERS
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(filteredReminders) { reminder in
                            IOSReminderCard(
                                reminder: reminder,
                                onDone: {
                                    if let idx = reminders.firstIndex(where: { $0.id == reminder.id }) {
                                        reminders[idx].status = "Done"
                                        reminders[idx].isOverdue = false
                                        toastMsg = "Reminder for '\(reminder.customerName)' marked DONE"
                                    }
                                },
                                onSnooze: {
                                    snoozingReminder = reminder
                                },
                                onEdit: {
                                    editingReminder = reminder
                                    showFormSheet = true
                                },
                                onDelete: {
                                    deletingReminder = reminder
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
                editingReminder = nil
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
            IOSReminderFormSheet(
                reminder: editingReminder,
                onSave: { name, mobile, sched, type, prio, stat, notes, custId in
                    if let target = editingReminder, let idx = reminders.firstIndex(where: { $0.id == target.id }) {
                        reminders[idx].customerName = name
                        reminders[idx].mobile = mobile
                        reminders[idx].scheduledAt = sched
                        reminders[idx].type = type
                        reminders[idx].priority = prio
                        reminders[idx].status = stat
                        reminders[idx].notes = notes
                        toastMsg = "Reminder for '\(name)' updated"
                    } else {
                        let newR = IOSReminderItem(
                            id: "REM-\(1000 + reminders.count + 1)",
                            customerId: custId.isEmpty ? "100027" : custId,
                            customerName: name,
                            mobile: mobile,
                            scheduledAt: sched,
                            type: type,
                            priority: prio,
                            status: stat,
                            notes: notes,
                            isOverdue: false
                        )
                        reminders.insert(newR, at: 0)
                        toastMsg = "Reminder for '\(name)' created"
                    }
                    showFormSheet = false
                }
            )
        }
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Delete Reminder"),
                message: Text("Are you sure you want to delete the reminder for '\(deletingReminder?.customerName ?? "")'?"),
                primaryButton: .destructive(Text("Delete")) {
                    if let target = deletingReminder {
                        reminders.removeAll { $0.id == target.id }
                        toastMsg = "Reminder for '\(target.customerName)' deleted"
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSReminderCard: View {
    let reminder: IOSReminderItem
    var onDone: () -> Void
    var onSnooze: () -> Void
    var onEdit: () -> Void
    var onDelete: () -> Void

    var isDone: Bool {
        reminder.status.caseInsensitiveCompare("Done") == .orderedSame
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(reminder.customerName)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                    Text("Mobile: \(reminder.mobile)")
                        .font(.caption)
                        .foregroundColor(.gray)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text(reminder.scheduledAt)
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                    if reminder.isOverdue && !isDone {
                        Text("⚠️ OVERDUE")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                    }
                }
            }

            HStack(spacing: 6) {
                Text(reminder.type)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.blue.opacity(0.12))
                    .foregroundColor(.blue)
                    .cornerRadius(6)

                Text(reminder.priority)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(reminder.priority == "Urgent" ? Color.red.opacity(0.12) : Color.gray.opacity(0.12))
                    .foregroundColor(reminder.priority == "Urgent" ? .red : .gray)
                    .cornerRadius(6)

                Text(reminder.status)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(isDone ? Color.green.opacity(0.12) : Color.orange.opacity(0.12))
                    .foregroundColor(isDone ? .green : .orange)
                    .cornerRadius(6)
            }

            if !reminder.notes.isEmpty {
                Text("\"\(reminder.notes)\"")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .italic()
            }

            Divider()

            HStack {
                HStack(spacing: 6) {
                    if !isDone {
                        Button(action: onDone) {
                            Text("✓ Done")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(6)
                        }

                        Button(action: onSnooze) {
                            Text("🕒 Snooze")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.orange)
                                .foregroundColor(.white)
                                .cornerRadius(6)
                        }
                    }

                    if let url = URL(string: "tel://\(reminder.mobile)") {
                        Link("📞 Call", destination: url)
                            .font(.caption2)
                            .fontWeight(.bold)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.blue.opacity(0.15))
                            .foregroundColor(.blue)
                            .cornerRadius(6)
                    }

                    if let waUrl = URL(string: "https://wa.me/\(reminder.mobile.replacingOccurrences(of: " ", with: ""))") {
                        Link("💬 WA", destination: waUrl)
                            .font(.caption2)
                            .fontWeight(.bold)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.green.opacity(0.15))
                            .foregroundColor(.green)
                            .cornerRadius(6)
                    }
                }

                Spacer()

                HStack(spacing: 6) {
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

struct IOSReminderFormSheet: View {
    var reminder: IOSReminderItem?
    var onSave: (String, String, String, String, String, String, String, String) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var customerName = ""
    @State private var mobile = ""
    @State private var scheduledAt = "2026-08-29 10:00 AM"
    @State private var type = "Call"
    @State private var priority = "Normal"
    @State private var status = "Pending"
    @State private var notes = ""
    @State private var customerId = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Customer Information")) {
                    TextField("Customer Name *", text: $customerName)
                    TextField("Mobile Number *", text: $mobile)
                    TextField("Customer ID (Optional)", text: $customerId)
                }

                Section(header: Text("Reminder Details")) {
                    TextField("Scheduled Date & Time *", text: $scheduledAt)

                    Picker("Type", selection: $type) {
                        Text("Call").tag("Call")
                        Text("WhatsApp").tag("WhatsApp")
                        Text("Visit").tag("Visit")
                        Text("Payment Follow-up").tag("Payment Follow-up")
                        Text("Meeting").tag("Meeting")
                    }

                    Picker("Priority", selection: $priority) {
                        Text("Low").tag("Low")
                        Text("Normal").tag("Normal")
                        Text("High").tag("High")
                        Text("Urgent").tag("Urgent")
                    }

                    Picker("Status", selection: $status) {
                        Text("Pending").tag("Pending")
                        Text("Done").tag("Done")
                        Text("Snoozed").tag("Snoozed")
                    }

                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                }
            }
            .navigationTitle(reminder == nil ? "Add Reminder" : "Edit Reminder")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    onSave(customerName, mobile, scheduledAt, type, priority, status, notes, customerId)
                }.disabled(customerName.trimmingCharacters(in: .whitespaces).isEmpty || mobile.trimmingCharacters(in: .whitespaces).isEmpty)
            )
            .onAppear {
                if let r = reminder {
                    customerName = r.customerName
                    mobile = r.mobile
                    scheduledAt = r.scheduledAt
                    type = r.type
                    priority = r.priority
                    status = r.status
                    notes = r.notes
                    customerId = r.customerId
                }
            }
        }
    }
}
