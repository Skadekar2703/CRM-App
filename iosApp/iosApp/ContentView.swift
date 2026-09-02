import SwiftUI

enum AuthScreenState {
    case login
    case signUp
}

struct ContentView: View {
    @StateObject private var client = SupabaseIOSClient.shared
    @State private var currentScreen: AuthScreenState = .login

    var body: some View {
        Group {
            if client.isInitialLoading {
                ZStack {
                    Color(red: 15/255, green: 23/255, blue: 42/255)
                        .ignoresSafeArea()
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                }
            } else if let session = client.currentSession {
                IOSDashboardView(session: session, onLogout: {
                    client.logout()
                    currentScreen = .login
                })
            } else {
                switch currentScreen {
                case .login:
                    LoginView(onNavigateToSignUp: {
                        withAnimation {
                            currentScreen = .signUp
                        }
                    })
                case .signUp:
                    SignUpView(onNavigateToLogin: {
                        withAnimation {
                            currentScreen = .login
                        }
                    })
                }
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}