import SwiftUI

struct LoginView: View {
    var onNavigateToSignUp: () -> Void

    @StateObject private var client = SupabaseIOSClient.shared
    @AppStorage("crm_is_dark_mode") private var isDarkMode: Bool = true

    @State private var selectedRole = "ADMIN"
    @State private var username = ""
    @State private var password = ""
    @State private var rememberMe = false
    @State private var isPasswordVisible = false
    @State private var localError: String? = nil

    private let deepNavy = Color(red: 15/255, green: 23/255, blue: 42/255)
    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)
    private let borderLight = Color(red: 51/255, green: 65/255, blue: 85/255)
    private var textPrimary: Color { isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255) }
    private var textMuted: Color { isDarkMode ? Color(red: 148/255, green: 163/255, blue: 184/255) : Color(red: 100/255, green: 116/255, blue: 139/255) }
    private var inputBg: Color { isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color(red: 248/255, green: 250/255, blue: 252/255) }
    private var cardBg: Color { isDarkMode ? Color(red: 30/255, green: 41/255, blue: 59/255) : Color.white }
    private let errorRed = Color(red: 220/255, green: 38/255, blue: 38/255)

    var body: some View {
        ZStack {
            deepNavy.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    Spacer(minLength: 40)

                    // Auth Card
                    VStack(spacing: 20) {
                        // CRM Logo
                        CRMLogoView(size: 72, fontSize: 22)
                            .padding(.top, 8)

                        Text("Business Login")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(textPrimary)

                        // Role Selector Tabs
                        HStack(spacing: 0) {
                            Button(action: {
                                selectedRole = "ADMIN"
                                localError = nil
                            }) {
                                Text("ADMIN LOGIN")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(selectedRole == "ADMIN" ? primaryBlue : Color.clear)
                                    .foregroundColor(selectedRole == "ADMIN" ? .white : textMuted)
                                    .cornerRadius(8)
                            }

                            Button(action: {
                                selectedRole = "STAFF"
                                localError = null
                            }) {
                                Text("STAFF LOGIN")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(selectedRole == "STAFF" ? primaryBlue : Color.clear)
                                    .foregroundColor(selectedRole == "STAFF" ? .white : textMuted)
                                    .cornerRadius(8)
                            }
                        }
                        .padding(4)
                        .background(Color(red: 241/255, green: 245/255, blue: 249/255))
                        .cornerRadius(10)

                        // Error Banner
                        if let error = client.errorMessage ?? localError {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(errorRed)
                                .padding(10)
                                .frame(maxWidth: .infinity)
                                .background(errorRed.opacity(0.1))
                                .cornerRadius(8)
                        }

                        // Success Banner
                        if let success = client.successMessage {
                            Text(success)
                                .font(.caption)
                                .foregroundColor(.green)
                                .padding(10)
                                .frame(maxWidth: .infinity)
                                .background(Color.green.opacity(0.1))
                                .cornerRadius(8)
                        }

                        // Username field
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Username")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(textPrimary)

                            HStack(spacing: 12) {
                                Image(systemName: "person.fill")
                                    .foregroundColor(textMuted)
                                TextField(selectedRole == "ADMIN" ? "admin1" : "staff01", text: $username)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                                    .onChange(of: username) { _ in localError = nil }
                            }
                            .padding()
                            .background(inputBg)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(borderLight, lineWidth: 1)
                            )
                        }

                        // Password field
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Password")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(textPrimary)

                            HStack(spacing: 12) {
                                Image(systemName: "lock.fill")
                                    .foregroundColor(textMuted)

                                if isPasswordVisible {
                                    TextField("Enter your password", text: $password)
                                        .autocapitalization(.none)
                                        .disableAutocorrection(true)
                                        .onChange(of: password) { _ in localError = nil }
                                } else {
                                    SecureField("Enter your password", text: $password)
                                        .onChange(of: password) { _ in localError = nil }
                                }

                                Button(action: {
                                    isPasswordVisible.toggle()
                                }) {
                                    Image(systemName: isPasswordVisible ? "eye.slash.fill" : "eye.fill")
                                        .foregroundColor(textMuted)
                                }
                            }
                            .padding()
                            .background(inputBg)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(borderLight, lineWidth: 1)
                            )
                        }

                        // Remember Me & Admin Forgot Password Row
                        HStack {
                            Button(action: {
                                rememberMe.toggle()
                            }) {
                                HStack(spacing: 8) {
                                    Image(systemName: rememberMe ? "checkmark.square.fill" : "square")
                                        .foregroundColor(rememberMe ? primaryBlue : textMuted)
                                    Text("Remember Me")
                                        .font(.footnote)
                                        .foregroundColor(textPrimary)
                                }
                            }

                            Spacer()

                            if selectedRole == "ADMIN" {
                                Button(action: {
                                    let cleanName = username.trimmingCharacters(in: .whitespaces).lowercased()
                                    if cleanName.isEmpty {
                                        localError = "Please enter your admin username to reset password."
                                    } else {
                                        localError = nil
                                        client.resetPassword(email: "\(cleanName)@business.crm")
                                    }
                                }) {
                                    Text("Forgot Password?")
                                        .font(.footnote)
                                        .fontWeight(.semibold)
                                        .foregroundColor(primaryBlue)
                                }
                            }
                        }
                        .padding(.top, 4)

                        // Login Button
                        Button(action: {
                            let cleanName = username.trimmingCharacters(in: .whitespaces).lowercased()
                            if cleanName.isEmpty {
                                localError = "Username is required."
                            } else if password.isEmpty {
                                localError = "Password is required."
                            } else {
                                localError = nil
                                client.loginByUsername(username: cleanName, password: password, role: selectedRole)
                            }
                        }) {
                            ZStack {
                                if client.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Text("Login as \(selectedRole)")
                                        .font(.headline)
                                        .fontWeight(.bold)
                                }
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(deepNavy)
                            .cornerRadius(12)
                        }
                        .disabled(client.isLoading)
                        .padding(.top, 8)
                    }
                    .padding(28)
                    .background(cardBg)
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.15), radius: 12, x: 0, y: 4)
                    .frame(maxWidth: 440)
                    .padding(.horizontal, 16)

                    Spacer(minLength: 32)

                    // Footer
                    Text("© 2026 Dashboard System. All rights reserved.")
                        .font(.caption)
                        .foregroundColor(Color.white.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.bottom, 24)
                }
            }
        }
    }
}
