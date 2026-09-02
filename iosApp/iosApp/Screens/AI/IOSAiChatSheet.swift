import SwiftUI

struct IOSAiChatMessage: Identifiable {
    let id = UUID()
    let sender: String // "user" or "assistant"
    let text: String
    let timestamp: String
}

struct IOSAiChatSheet: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var messages: [IOSAiChatMessage] = [
        IOSAiChatMessage(
            sender: "assistant",
            text: "Hello! I am your CRM AI Assistant. Ask me anything about your Baki/Jama debt, Daag items, inventory, or sales.",
            timestamp: "Just now"
        )
    ]
    @State private var inputPrompt: String = ""
    @State private var isLoading: Bool = false

    private let textPrimary = Color(red: 30/255, green: 41/255, blue: 59/255)
    private let textMuted = Color(red: 100/255, green: 116/255, blue: 139/255)
    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)
    private let purpleBg = Color(red: 124/255, green: 58/255, blue: 237/255)

    func sendQuery(_ query: String) {
        guard !query.trimmingCharacters(in: .whitespaces).isEmpty, !isLoading else { return }
        let userText = query.trimmingCharacters(in: .whitespaces)

        messages.append(IOSAiChatMessage(sender: "user", text: userText, timestamp: "Just now"))
        inputPrompt = ""
        isLoading = true

        SupabaseIOSClient.shared.invokeFunction(name: "crm-ai", payload: ["prompt": userText]) { res in
            DispatchQueue.main.async {
                if case .success(let dict) = res, let replyText = dict["reply"] as? String, !replyText.isEmpty {
                    let clean = replyText.replacingOccurrences(of: "**", with: "").replacingOccurrences(of: "*", with: "")
                    self.messages.append(IOSAiChatMessage(sender: "assistant", text: clean, timestamp: "Just now"))
                    self.isLoading = false
                    return
                }

                let lower = userText.lowercased()
                SupabaseIOSClient.shared.fetchTable(table: "customers") { result in
                    DispatchQueue.main.async {
                        var reply = ""
                        if case .success(let items) = result {
                            if lower.contains("baki") || lower.contains("owe") || lower.contains("jama") || lower.contains("rohan") || lower.contains("sham") {
                                var totalB = 0.0
                                var totalJ = 0.0
                                var targetName: String? = nil
                                var custB = 0.0
                                var custJ = 0.0

                                for item in items {
                                    let b = (item["baki"] as? NSNumber)?.doubleValue ?? 0.0
                                    let j = (item["jama"] as? NSNumber)?.doubleValue ?? 0.0
                                    let name = item["name"] as? String ?? ""

                                    let bakiVal = b >= 0 ? b : 0.0
                                    let jamaVal = b < 0 ? abs(b) : j

                                    totalB += bakiVal
                                    totalJ += jamaVal

                                    if lower.contains(name.lowercased()) {
                                        targetName = name
                                        custB = bakiVal
                                        custJ = jamaVal
                                    }
                                }

                                if let target = targetName {
                                    let out = custB - custJ
                                    reply = "Customer Details for \(target):\n" +
                                            "• Total Baki: \(formatIndianCurrencySwift(custB))\n" +
                                            "• Total Jama: \(formatIndianCurrencySwift(custJ))\n" +
                                            "• Net Outstanding: \(formatIndianCurrencySwift(out))"
                                } else {
                                    let out = totalB - totalJ
                                    reply = "Overall Udhaari Summary:\n" +
                                            "• Total Baki: \(formatIndianCurrencySwift(totalB))\n" +
                                            "• Total Jama: \(formatIndianCurrencySwift(totalJ))\n" +
                                            "• Net Outstanding: \(formatIndianCurrencySwift(out))"
                                }
                            } else if lower.contains("daag") {
                                reply = "Daag Inventory Summary:\n" +
                                        "• Active Daag items retrieved from Supabase."
                            } else {
                                reply = "Unable to fetch AI answer for that prompt. Please ensure internet connectivity and try again."
                            }
                        } else {
                            reply = "Error connecting to Supabase database."
                        }

                        self.messages.append(IOSAiChatMessage(sender: "assistant", text: reply, timestamp: "Just now"))
                        self.isLoading = false
                    }
                }
            }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // MESSAGES LIST
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 10) {
                            ForEach(messages) { msg in
                                HStack {
                                    if msg.sender == "user" { Spacer() }
                                    VStack(alignment: msg.sender == "user" ? .trailing : .leading, spacing: 4) {
                                        Text(msg.text)
                                            .font(.subheadline)
                                            .foregroundColor(msg.sender == "user" ? .white : textPrimary)
                                            .padding(10)
                                            .background(msg.sender == "user" ? primaryBlue : Color.white)
                                            .cornerRadius(12)
                                    }
                                    if msg.sender == "assistant" { Spacer() }
                                }
                                .id(msg.id)
                            }

                            if isLoading {
                                HStack {
                                    Text("✨ Querying CRM database...")
                                        .font(.caption)
                                        .foregroundColor(textMuted)
                                        .padding(8)
                                        .background(Color.white)
                                        .cornerRadius(10)
                                    Spacer()
                                }
                            }
                        }
                        .padding(12)
                    }
                    .background(Color(red: 248/255, green: 250/255, blue: 252/255))
                    .onChange(of: messages.count) { _ in
                        if let last = messages.last {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }

                // SUGGESTION PILLS
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        Button("Give CRM summary") { sendQuery("Give me today's CRM summary") }
                            .font(.caption2)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                            .cornerRadius(12)

                        Button("How much does Sham owe?") { sendQuery("How much does Sham owe me?") }
                            .font(.caption2)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                            .cornerRadius(12)

                        Button("Daag items") { sendQuery("How many items are in Daag?") }
                            .font(.caption2)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                            .cornerRadius(12)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                }
                .background(Color.white)

                Divider()

                // INPUT ROW
                HStack(spacing: 8) {
                    TextField("Ask about Baki, Jama, Daag...", text: $inputPrompt)
                        .padding(10)
                        .background(Color(red: 248/255, green: 250/255, blue: 252/255))
                        .cornerRadius(10)

                    Button(action: { sendQuery(inputPrompt) }) {
                        Image(systemName: "paperplane.fill")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(width: 40, height: 40)
                            .background(inputPrompt.trimmingCharacters(in: .whitespaces).isEmpty ? Color.gray : primaryBlue)
                            .clipShape(Circle())
                    }
                    .disabled(inputPrompt.trimmingCharacters(in: .whitespaces).isEmpty || isLoading)
                }
                .padding(12)
                .background(Color.white)
            }
            .navigationBarTitle("CRM AI Assistant", displayMode: .inline)
            .navigationBarItems(
                leading: Button("Clear") {
                    messages = [
                        IOSAiChatMessage(
                            sender: "assistant",
                            text: "Chat cleared. Ask me any question about your CRM data.",
                            timestamp: "Just now"
                        )
                    ]
                },
                trailing: Button("Done") { presentationMode.wrappedValue.dismiss() }
            )
        }
    }
}
