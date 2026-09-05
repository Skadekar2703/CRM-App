import SwiftUI

struct DashboardView: View {
    let session: UserSessionIOS
    var onLogout: () -> Void

    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = false

    private let deepNavy = Color(red: 15/255, green: 23/255, blue: 42/255)
    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255) }
    private var textMuted: Color { isDarkMode ? Color(red: 156/255, green: 163/255, blue: 175/255) : Color(red: 100/255, green: 116/255, blue: 139/255) }
    private var cardBg: Color { isDarkMode ? Color(red: 17/255, green: 24/255, blue: 39/255) : Color.white }

    var body: some View {
        ZStack {
            deepNavy.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: 20) {
                    CRMLogoView(size: 64, fontSize: 20)

                    Text("CRM Dashboard")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)

                    Text("Welcome back, \(session.username ?? session.email)!")
                        .font(.subheadline)
                        .foregroundColor(textMuted)

                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "envelope.fill")
                                .foregroundColor(primaryBlue)
                            Text("Email:")
                                .font(.footnote)
                                .fontWeight(.semibold)
                                .foregroundColor(textMuted)
                            Text(session.email)
                                .font(.footnote)
                                .foregroundColor(textPrimary)
                        }

                        if let username = session.username, !username.isEmpty {
                            HStack {
                                Image(systemName: "person.fill")
                                    .foregroundColor(primaryBlue)
                                Text("Username:")
                                    .font(.footnote)
                                    .fontWeight(.semibold)
                                    .foregroundColor(textMuted)
                                Text(username)
                                    .font(.footnote)
                                    .foregroundColor(textPrimary)
                            }
                        }

                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                            Text("Status:")
                                .font(.footnote)
                                .fontWeight(.semibold)
                                .foregroundColor(textMuted)
                            Text("Connected to Supabase Auth")
                                .font(.footnote)
                                .foregroundColor(.green)
                        }
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(red: 248/255, green: 250/255, blue: 252/255))
                    .cornerRadius(12)

                    Button(action: onLogout) {
                        HStack(spacing: 8) {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                            Text("Logout")
                                .font(.headline)
                                .fontWeight(.bold)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(Color(red: 220/255, green: 38/255, blue: 38/255))
                        .cornerRadius(12)
                    }
                    .padding(.top, 8)
                }
                .padding(28)
                .background(cardBg)
                .cornerRadius(20)
                .shadow(color: Color.black.opacity(0.15), radius: 12, x: 0, y: 4)
                .frame(maxWidth: 440)
                .padding(.horizontal, 16)

                Spacer()
            }
        }
    }
}
