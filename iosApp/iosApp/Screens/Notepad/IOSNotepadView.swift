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
    @State private var notes: [IOSNoteItem] = []

    @State private var searchQuery = ""
    @State private var showFormSheet = false
    @State private var editingNote: IOSNoteItem? = nil
    @State private var deletingNote: IOSNoteItem? = nil
    @State private var showDeleteAlert = false
    @State private var toastMsg: String? = nil
    @State private var isLoading = true
    @State private var errorMessage: String? = nil

    @AppStorage("crm_is_dark_mode") private var isDarkMode = false

    private var cardBg: Color {
        isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color.white
    }

    private var pageBg: Color {
        isDarkMode ? Color(red: 11/255, green: 15/255, blue: 25/255) : Color(red: 248/255, green: 250/255, blue: 252/255)
    }

    private var textPrimary: Color {
        isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255)
    }

    private var textMuted: Color {
        isDarkMode ? Color(red: 148/255, green: 163/255, blue: 184/255) : Color(red: 100/255, green: 116/255, blue: 139/255)
    }

    func fetchNotesFromSupabase() {
        isLoading = true
        errorMessage = nil
        SupabaseIOSClient.shared.fetchTable(table: "notes") { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let items):
                    var nList: [IOSNoteItem] = []
                    for item in items {
                        let id = "\(item["id"] ?? UUID().uuidString)"
                        let title = item["title"] as? String ?? "Untitled Note"
                        let content = item["content"] as? String ?? ""
                        let priority = item["priority"] as? String ?? "Normal"
                        let isUrgent = priority == "High" || (item["is_urgent"] as? Bool ?? false)
                        let isPinned = item["is_pinned"] as? Bool ?? false
                        let createdAt = item["created_at"] as? String ?? "Recent"

                        nList.append(
                            IOSNoteItem(
                                id: id,
                                title: title,
                                content: content,
                                isUrgent: isUrgent,
                                isPinned: isPinned,
                                createdAt: createdAt
                            )
                        )
                    }
                    self.notes = nList
                    self.isLoading = false
                case .failure(let err):
                    self.errorMessage = err.localizedDescription
                    self.notes = []
                    self.isLoading = false
                }
            }
        }
    }

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
            pageBg.ignoresSafeArea()

            VStack(spacing: 14) {
                // SEARCH BAR
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(textMuted)
                    TextField("Search notes...", text: $searchQuery)
                        .foregroundColor(textPrimary)
                    if !searchQuery.isEmpty {
                        Button(action: { searchQuery = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(textMuted)
                        }
                    }
                }
                .padding(12)
                .background(cardBg)
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.03), radius: 2)

                // TOAST MESSAGE
                if let msg = toastMsg {
                    let isError = msg.contains("Unable") || msg.contains("Failed")
                    HStack {
                        Text(isError ? "⚠️ \(msg)" : "✓ \(msg)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(isError ? .red : .green)
                        Spacer()
                    }
                    .padding(12)
                    .background(isError ? Color.red.opacity(0.1) : Color.green.opacity(0.1))
                    .cornerRadius(10)
                }

                // ERROR STATE
                if let err = errorMessage {
                    VStack(spacing: 8) {
                        Text("⚠️ \(err)")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                        Button(action: fetchNotesFromSupabase) {
                            Text("Retry Loading Notes")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.blue)
                                .cornerRadius(8)
                        }
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity)
                    .background(cardBg)
                    .cornerRadius(12)
                }

                // NOTES LIST / LOADING / EMPTY STATE
                if isLoading {
                    VStack {
                        ProgressView()
                        Text("Loading notes...")
                            .font(.caption)
                            .foregroundColor(textMuted)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if filteredNotes.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "square.and.pencil")
                            .font(.system(size: 40))
                            .foregroundColor(textMuted)
                        Text("No notes available")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(textPrimary)
                        Text(searchQuery.isEmpty ? "Create your first note to get started!" : "No notes matching '\(searchQuery)'")
                            .font(.caption)
                            .foregroundColor(textMuted)

                        Button(action: {
                            editingNote = nil
                            showFormSheet = true
                        }) {
                            Text("+ Add Note")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 10)
                                .background(Color.blue)
                                .cornerRadius(10)
                        }
                        .padding(.top, 8)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(40)
                    .background(cardBg)
                    .cornerRadius(16)
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            // PINNED SECTION
                            if !pinnedNotes.isEmpty {
                                VStack(alignment: .leading, spacing: 10) {
                                    Text("📌 PINNED NOTES (\(pinnedNotes.count))")
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundColor(.blue)

                                    ForEach(pinnedNotes) { note in
                                        IOSNoteCardRow(
                                            note: note,
                                            onEdit: {
                                                editingNote = note
                                                showFormSheet = true
                                            },
                                            onDelete: {
                                                deletingNote = note
                                                showDeleteAlert = true
                                            }
                                        )
                                    }
                                }
                            }

                            // OTHER NOTES SECTION
                            if !otherNotes.isEmpty {
                                VStack(alignment: .leading, spacing: 10) {
                                    Text(!pinnedNotes.isEmpty ? "OTHER NOTES (\(otherNotes.count))" : "ALL NOTES (\(otherNotes.count))")
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundColor(textMuted)

                                    ForEach(otherNotes) { note in
                                        IOSNoteCardRow(
                                            note: note,
                                            onEdit: {
                                                editingNote = note
                                                showFormSheet = true
                                            },
                                            onDelete: {
                                                deletingNote = note
                                                showDeleteAlert = true
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .padding(16)

            // FLOATING ACTION BUTTON (+ ADD NOTE)
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
                    .shadow(color: Color.blue.opacity(0.3), radius: 6, x: 0, y: 3)
            }
            .padding(20)
        }
        .onAppear {
            fetchNotesFromSupabase()
        }
        .sheet(isPresented: $showFormSheet) {
            IOSNoteFormSheet(
                editingNote: editingNote,
                onSave: { title, content, isUrgent, isPinned in
                    let record: [String: Any] = [
                        "title": title.trimmingCharacters(in: .whitespacesAndNewlines),
                        "content": content.trimmingCharacters(in: .whitespacesAndNewlines),
                        "priority": isUrgent ? "High" : "Normal",
                        "is_pinned": isPinned
                    ]

                    if let noteToEdit = editingNote {
                        SupabaseIOSClient.shared.updateRecord(table: "notes", id: noteToEdit.id, record: record) { result in
                            DispatchQueue.main.async {
                                showFormSheet = false
                                if case .success = result {
                                    toastMsg = "Note updated successfully"
                                    fetchNotesFromSupabase()
                                } else {
                                    toastMsg = "Unable to save note. Please try again."
                                }
                            }
                        }
                    } else {
                        SupabaseIOSClient.shared.insertRecord(table: "notes", record: record) { result in
                            DispatchQueue.main.async {
                                showFormSheet = false
                                if case .success = result {
                                    toastMsg = "Note saved successfully"
                                    fetchNotesFromSupabase()
                                } else {
                                    toastMsg = "Unable to save note. Please try again."
                                }
                            }
                        }
                    }
                }
            )
        }
        .alert("Delete Note", isPresented: $showDeleteAlert, presenting: deletingNote) { target in
            Button("Delete", role: .destructive) {
                SupabaseIOSClient.shared.deleteRecord(table: "notes", id: target.id) { result in
                    DispatchQueue.main.async {
                        if case .success = result {
                            toastMsg = "Note deleted"
                            fetchNotesFromSupabase()
                        } else {
                            toastMsg = "Unable to delete note. Please try again."
                        }
                    }
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: { target in
            Text("Are you sure you want to delete '\(target.title)'? This action cannot be undone.")
        }
    }
}

struct IOSNoteCardRow: View {
    let note: IOSNoteItem
    var onEdit: () -> Void
    var onDelete: () -> Void

    @AppStorage("crm_is_dark_mode") private var isDarkMode = false

    private var cardBg: Color {
        isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color.white
    }
    private var textPrimary: Color {
        isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255)
    }
    private var textMuted: Color {
        isDarkMode ? Color(red: 148/255, green: 163/255, blue: 184/255) : Color(red: 100/255, green: 116/255, blue: 139/255)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(note.title)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(textPrimary)
                Spacer()
                if note.isPinned {
                    Text("📌")
                        .font(.caption)
                }
                if note.isUrgent {
                    Text("🔴")
                        .font(.caption)
                }
            }

            if !note.content.isEmpty {
                Text(note.content)
                    .font(.caption)
                    .foregroundColor(textMuted)
                    .lineLimit(3)
            }

            Divider()

            HStack {
                Text(note.createdAt)
                    .font(.caption2)
                    .foregroundColor(textMuted)
                Spacer()
                Button(action: onEdit) {
                    Text("Edit")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                }
                Button(action: onDelete) {
                    Text("Delete")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                }
                .padding(.leading, 8)
            }
        }
        .padding(14)
        .background(cardBg)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.03), radius: 2)
    }
}

struct IOSNoteFormSheet: View {
    let editingNote: IOSNoteItem?
    var onSave: (String, String, Bool, Bool) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var title: String = ""
    @State private var content: String = ""
    @State private var isUrgent: Bool = false
    @State private var isPinned: Bool = false

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Note Details")) {
                    TextField("Title", text: $title)
                    TextEditor(text: $content)
                        .frame(height: 100)
                }

                Section(header: Text("Options")) {
                    Toggle("Mark as High Priority / Urgent", isOn: $isUrgent)
                    Toggle("Pin to Top", isOn: $isPinned)
                }
            }
            .navigationTitle(editingNote != null ? "Edit Note" : "New Note")
            .navigationBarItems(
                leading: Button("Cancel") { dismiss() },
                trailing: Button("Save") {
                    if !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        onSave(title, content, isUrgent, isPinned)
                    }
                }
                .fontWeight(.bold)
            )
            .onAppear {
                if let note = editingNote {
                    title = note.title
                    content = note.content
                    isUrgent = note.isUrgent
                    isPinned = note.isPinned
                }
            }
        }
    }
}
