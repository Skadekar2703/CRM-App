import SwiftUI

struct IOSNotepadView: View {
    var onNavigateSection: (String) -> Void = { _ in }

    var body: some View {
        IOSRootScaffold(
            activeSection: "Notepad",
            onNavigateSection: onNavigateSection
        ) {
            IOSNotepadContentView()
        }
    }
}

struct IOSNoteItem: Identifiable {
    let id: String
    var title: String
    var content: String
    var isUrgent: Bool
    var isPinned: Bool
    var createdAt: String
}

struct IOSNotepadContentView: View {
    @State private var notes: [IOSNoteItem] = [
        IOSNoteItem(
            id: "NOTE-101",
            title: "Urgent: Payment Clearance Needed",
            content: "Contact Ramesh Textiles regarding overdue payment of ₹1,80,000 before Friday.",
            isUrgent: true,
            isPinned: true,
            createdAt: "Aug 28, 2026"
        ),
        IOSNoteItem(
            id: "NOTE-102",
            title: "Stock Inspection - Basmati Rice",
            content: "Check batch #TRX-98234 for moisture and packaging quality at main warehouse.",
            isUrgent: false,
            isPinned: true,
            createdAt: "Aug 26, 2026"
        ),
        IOSNoteItem(
            id: "NOTE-103",
            title: "Weekly Sales Review Agenda",
            content: "Discuss Madurai area sales targets, new customer onboarding & discount limits.",
            isUrgent: false,
            isPinned: false,
            createdAt: "Aug 24, 2026"
        ),
        IOSNoteItem(
            id: "NOTE-104",
            title: "Transport Vendor Agreement",
            content: "Review freight rates with VRL Logistics for bulk delivery in North Zone.",
            isUrgent: true,
            isPinned: false,
            createdAt: "Aug 20, 2026"
        )
    ]

    @State private var searchQuery = ""
    @State private var showFormSheet = false
    @State private var editingNote: IOSNoteItem? = nil
    @State private var deletingNote: IOSNoteItem? = nil
    @State private var showDeleteAlert = false
    @State private var toastMsg: String? = nil

    var filteredNotes: [IOSNoteItem] {
        let q = searchQuery.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        if q.isEmpty { return notes }
        return notes.filter { n in
            n.title.lowercased().contains(q) || n.content.lowercased().contains(q)
        }
    }

    var pinnedNotes: [IOSNoteItem] {
        filteredNotes.filter { $0.isPinned }
    }

    var otherNotes: [IOSNoteItem] {
        filteredNotes.filter { !$0.isPinned }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Color(red: 248/255, green: 250/255, blue: 252/255).ignoresSafeArea()

            VStack(spacing: 14) {
                // SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search notes...", text: $searchQuery)
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

                // NOTES LIST
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        // PINNED NOTES SECTION
                        if !pinnedNotes.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("📌 PINNED NOTES (\(pinnedNotes.count))")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)

                                ForEach(pinnedNotes) { note in
                                    IOSNoteCard(
                                        note: note,
                                        onEdit: {
                                            editingNote = note
                                            showFormSheet = true
                                        },
                                        onDelete: {
                                            deletingNote = note
                                            showDeleteAlert = true
                                        },
                                        onTogglePin: {
                                            if let idx = notes.firstIndex(where: { $0.id == note.id }) {
                                                notes[idx].isPinned.toggle()
                                                toastMsg = notes[idx].isPinned ? "Note pinned" : "Note unpinned"
                                            }
                                        },
                                        onToggleUrgent: {
                                            if let idx = notes.firstIndex(where: { $0.id == note.id }) {
                                                notes[idx].isUrgent.toggle()
                                                toastMsg = notes[idx].isUrgent ? "Marked Urgent" : "Marked Normal"
                                            }
                                        }
                                    )
                                }
                            }
                        }

                        // OTHER NOTES SECTION
                        if !otherNotes.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                Text(pinnedNotes.isEmpty ? "ALL NOTES (\(otherNotes.count))" : "OTHER NOTES (\(otherNotes.count))")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.gray)

                                ForEach(otherNotes) { note in
                                    IOSNoteCard(
                                        note: note,
                                        onEdit: {
                                            editingNote = note
                                            showFormSheet = true
                                        },
                                        onDelete: {
                                            deletingNote = note
                                            showDeleteAlert = true
                                        },
                                        onTogglePin: {
                                            if let idx = notes.firstIndex(where: { $0.id == note.id }) {
                                                notes[idx].isPinned.toggle()
                                                toastMsg = notes[idx].isPinned ? "Note pinned" : "Note unpinned"
                                            }
                                        },
                                        onToggleUrgent: {
                                            if let idx = notes.firstIndex(where: { $0.id == note.id }) {
                                                notes[idx].isUrgent.toggle()
                                                toastMsg = notes[idx].isUrgent ? "Marked Urgent" : "Marked Normal"
                                            }
                                        }
                                    )
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 80)
                }
            }

            // FAB ADD BUTTON
            Button(action: {
                editingNote = nil
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
            IOSNoteFormSheet(
                note: editingNote,
                onSave: { title, content, isUrgent, isPinned in
                    if let target = editingNote, let idx = notes.firstIndex(where: { $0.id == target.id }) {
                        notes[idx].title = title
                        notes[idx].content = content
                        notes[idx].isUrgent = isUrgent
                        notes[idx].isPinned = isPinned
                        toastMsg = "Note '\(title)' updated"
                    } else {
                        let newN = IOSNoteItem(
                            id: "NOTE-\(100 + notes.count + 1)",
                            title: title,
                            content: content,
                            isUrgent: isUrgent,
                            isPinned: isPinned,
                            createdAt: "Just now"
                        )
                        notes.insert(newN, at: 0)
                        toastMsg = "Note '\(title)' created"
                    }
                    showFormSheet = false
                }
            )
        }
        .alert(isPresented: $showDeleteAlert) {
            Alert(
                title: Text("Delete Note"),
                message: Text("Are you sure you want to delete note '\(deletingNote?.title ?? "")'?"),
                primaryButton: .destructive(Text("Delete")) {
                    if let target = deletingNote {
                        notes.removeAll { $0.id == target.id }
                        toastMsg = "Note '\(target.title)' deleted"
                    }
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct IOSNoteCard: View {
    let note: IOSNoteItem
    var onEdit: () -> Void
    var onDelete: () -> Void
    var onTogglePin: () -> Void
    var onToggleUrgent: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // TITLE & PIN BUTTON
            HStack(alignment: .top) {
                Text(note.title)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                    .fixedSize(horizontal: false, vertical: true)

                Spacer()

                Button(action: onTogglePin) {
                    Image(systemName: note.isPinned ? "pin.fill" : "pin")
                        .foregroundColor(note.isPinned ? .blue : .gray.opacity(0.5))
                }
            }

            // URGENT BADGE
            if note.isUrgent {
                HStack(spacing: 4) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.caption2)
                    Text("URGENT")
                        .font(.caption2)
                        .fontWeight(.bold)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(Color.red.opacity(0.12))
                .foregroundColor(.red)
                .cornerRadius(6)
            }

            // CONTENT
            Text(note.content)
                .font(.subheadline)
                .foregroundColor(Color(red: 71/255, green: 85/255, blue: 105/255))
                .fixedSize(horizontal: false, vertical: true)

            Divider()

            // FOOTER & ACTIONS
            HStack {
                Text(note.createdAt)
                    .font(.caption2)
                    .foregroundColor(.gray)

                Spacer()

                HStack(spacing: 8) {
                    Button(action: onToggleUrgent) {
                        Text(note.isUrgent ? "Urgent" : "Make Urgent")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(note.isUrgent ? Color.red.opacity(0.15) : Color(red: 241/255, green: 245/255, blue: 249/255))
                            .foregroundColor(note.isUrgent ? .red : .gray)
                            .cornerRadius(6)
                    }

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
        .padding(16)
        .background(Color.white)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(note.isUrgent ? Color.red.opacity(0.4) : Color.clear, lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

struct IOSNoteFormSheet: View {
    var note: IOSNoteItem?
    var onSave: (String, String, Bool, Bool) -> Void

    @Environment(\.presentationMode) var presentationMode
    @State private var title = ""
    @State private var content = ""
    @State private var isUrgent = false
    @State private var isPinned = false

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Note Details")) {
                    TextField("Note Title *", text: $title)
                    TextEditor(text: $content)
                        .frame(minHeight: 120)
                }

                Section(header: Text("Options")) {
                    Toggle("Mark as Urgent", isOn: $isUrgent)
                        .toggleStyle(SwitchToggleStyle(tint: .red))
                    Toggle("Pin to Top", isOn: $isPinned)
                        .toggleStyle(SwitchToggleStyle(tint: .blue))
                }
            }
            .navigationTitle(note == nil ? "Add Note" : "Edit Note")
            .navigationBarItems(
                leading: Button("Cancel") { presentationMode.wrappedValue.dismiss() },
                trailing: Button("Save") {
                    onSave(title, content, isUrgent, isPinned)
                }.disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || content.trimmingCharacters(in: .whitespaces).isEmpty)
            )
            .onAppear {
                if let n = note {
                    title = n.title
                    content = n.content
                    isUrgent = n.isUrgent
                    isPinned = n.isPinned
                }
            }
        }
    }
}
