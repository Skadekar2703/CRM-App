import SwiftUI

struct IOSSettingsView: View {
    @AppStorage("crm_is_dark_mode") private var isDarkMode = false

    private var pageBg: Color {
        isDarkMode ? Color(red: 11/255, green: 15/255, blue: 25/255) : Color(red: 248/255, green: 250/255, blue: 252/255)
    }

    private var cardBg: Color {
        isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color.white
    }

    private var cardSubBg: Color {
        isDarkMode ? Color(red: 30/255, green: 41/255, blue: 59/255) : Color(red: 241/255, green: 245/255, blue: 249/255)
    }

    private var textPrimary: Color {
        isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("App Settings & Master Preferences")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(textPrimary)

                VStack(alignment: .leading, spacing: 12) {
                    Text("🏢 Business & System Details")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Business ID: 00000000-0000-0000-0000-000000000001")
                            .font(.caption)
                            .fontDesign(.monospaced)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)

                        Text("RLS Tenant Security: Active")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.green)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(cardSubBg)
                    .cornerRadius(8)
                }
                .padding(16)
                .background(cardBg)
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.05), radius: 3)

                VStack(alignment: .leading, spacing: 12) {
                    Text("⚙️ Master Options")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)

                    HStack {
                        Image(systemName: "checkmark.square.fill")
                            .foregroundColor(.blue)
                        Text("3-Step confirmation for Admin deletions")
                            .font(.subheadline)
                            .foregroundColor(textPrimary)
                    }

                    HStack {
                        Image(systemName: "checkmark.square.fill")
                            .foregroundColor(.blue)
                        Text("Auto-generate 6-digit Customer IDs")
                            .font(.subheadline)
                            .foregroundColor(textPrimary)
                    }
                }
                .padding(16)
                .background(cardBg)
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.05), radius: 3)
            }
            .padding(16)
        }
        .background(pageBg)
    }
}
