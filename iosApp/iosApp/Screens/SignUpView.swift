import SwiftUI

struct SignUpView: View {
    var onNavigateToLogin: () -> Void

    @StateObject private var client = SupabaseIOSClient.shared

    @State private var username = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""

    @State private var isPasswordVisible = false
    @State private var isConfirmPasswordVisible = false

    @State private var usernameError: String? = nil
    @State private var emailError: String? = nil
    @State private var passwordError: String? = nil
    @State private var confirmPasswordError: String? = nil

    private let deepNavy = Color(red: 15/255, green: 23/255, blue: 42/255)
    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)
    private let borderLight = Color(red: 226/255, green: 232/255, blue: 240/255)
    private let textPrimary = Color(red: 30/255, green: 41/255, blue: 59/255)
    private let textMuted = Color(red: 100/255, green: 116/255, blue: 139/255)
    private let inputBg = Color(red: 248/255, green: 250/255, blue: 252/255)
    private let errorRed = Color(red: 220/255, green: 38/255, blue: 38/255)

    private func validateForm() -> Bool {
        var isValid = true

        if username.trimmingCharacters(in: .whitespaces).isEmpty {
            usernameError = "Username is required"
            isValid = false
        } else {
            usernameError = nil
        }

        let trimmedEmail = email.trimmingCharacters(in: .whitespaces)
        if trimmedEmail.isEmpty {
            emailError = "Email is required"
            isValid = false
        } else if !trimmedEmail.contains("@") || !trimmedEmail.contains(".") {
            emailError = "Please enter a valid email address"
            isValid = false
        } else {
            emailError = nil
        }

        if password.isEmpty {
            passwordError = "Password is required"
            isValid = false
        } else if password.count < 6 {
            passwordError = "Password must be at least 6 characters"
            isValid = false
        } else {
            passwordError = nil
        }

        if confirmPassword.isEmpty {
            confirmPasswordError = "Please confirm your password"
            isValid = false
        } else if password != confirmPassword {
            confirmPasswordError = "Passwords do not match"
            isValid = false
        } else {
            confirmPasswordError = nil
        }

        return isValid
    }

    var body: some View {
        ZStack {
            deepNavy.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    Spacer(minLength: 40)

                    // Auth Card
                    VStack(spacing: 16) {
                        CRMLogoView(size: 72, fontSize: 22)
                            .padding(.top, 8)

                        Text("Create Account")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(textPrimary)

                        // Global Error Banner
                        if let error = client.errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(errorRed)
                                .padding(10)
                                .frame(maxWidth: .infinity)
                                .background(errorRed.opacity(0.1))
                                .cornerRadius(8)
                        }

                        // Username Field
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Username")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(textPrimary)

                            HStack(spacing: 12) {
                                Image(systemName: "person.fill")
                                    .foregroundColor(textMuted)
                                TextField("Choose a username", text: $username)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                                    .onChange(of: username) { _ in usernameError = nil }
                            }
                            .padding()
                            .background(inputBg)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(usernameError != nil ? errorRed : borderLight, lineWidth: 1)
                            )

                            if let error = usernameError {
                                Text(error)
                                    .font(.caption)
                                    .foregroundColor(errorRed)
                            }
                        }

                        // Email Field
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Email")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(textPrimary)

                            HStack(spacing: 12) {
                                Image(systemName: "envelope.fill")
                                    .foregroundColor(textMuted)
                                TextField("Enter your email", text: $email)
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                                    .onChange(of: email) { _ in emailError = nil }
                            }
                            .padding()
                            .background(inputBg)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(emailError != nil ? errorRed : borderLight, lineWidth: 1)
                            )

                            if let error = emailError {
                                Text(error)
                                    .font(.caption)
                                    .foregroundColor(errorRed)
                            }
                        }

                        // Password Field
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Password")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(textPrimary)

                            HStack(spacing: 12) {
                                Image(systemName: "lock.fill")
                                    .foregroundColor(textMuted)

                                if isPasswordVisible {
                                    TextField("Minimum 6 characters", text: $password)
                                        .autocapitalization(.none)
                                        .disableAutocorrection(true)
                                        .onChange(of: password) { _ in passwordError = nil }
                                } else {
                                    SecureField("Minimum 6 characters", text: $password)
                                        .onChange(of: password) { _ in passwordError = nil }
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
                                    .stroke(passwordError != nil ? errorRed : borderLight, lineWidth: 1)
                            )

                            if let error = passwordError {
                                Text(error)
                                    .font(.caption)
                                    .foregroundColor(errorRed)
                            }
                        }

                        // Confirm Password Field
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Confirm Password")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(textPrimary)

                            HStack(spacing: 12) {
                                Image(systemName: "lock.fill")
                                    .foregroundColor(textMuted)

                                if isConfirmPasswordVisible {
                                    TextField("Confirm your password", text: $confirmPassword)
                                        .autocapitalization(.none)
                                        .disableAutocorrection(true)
                                        .onChange(of: confirmPassword) { _ in confirmPasswordError = nil }
                                } else {
                                    SecureField("Confirm your password", text: $confirmPassword)
                                        .onChange(of: confirmPassword) { _ in confirmPasswordError = nil }
                                }

                                Button(action: {
                                    isConfirmPasswordVisible.toggle()
                                }) {
                                    Image(systemName: isConfirmPasswordVisible ? "eye.slash.fill" : "eye.fill")
                                        .foregroundColor(textMuted)
                                }
                            }
                            .padding()
                            .background(inputBg)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(confirmPasswordError != nil ? errorRed : borderLight, lineWidth: 1)
                            )

                            if let error = confirmPasswordError {
                                Text(error)
                                    .font(.caption)
                                    .foregroundColor(errorRed)
                            }
                        }

                        // Sign Up Button
                        Button(action: {
                            if validateForm() {
                                client.signUp(username: username, email: email, password: password)
                            }
                        }) {
                            ZStack {
                                if client.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    HStack(spacing: 8) {
                                        Image(systemName: "person.badge.plus")
                                        Text("Sign Up")
                                            .font(.headline)
                                            .fontWeight(.bold)
                                    }
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

                        // Login Navigation Link
                        HStack(spacing: 4) {
                            Text("Already have an account?")
                                .font(.subheadline)
                                .foregroundColor(textMuted)
                            Button(action: onNavigateToLogin) {
                                Text("Login here")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                    .foregroundColor(primaryBlue)
                            }
                            .disabled(client.isLoading)
                        }
                        .padding(.top, 4)
                        .padding(.bottom, 8)
                    }
                    .padding(28)
                    .background(Color.white)
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
