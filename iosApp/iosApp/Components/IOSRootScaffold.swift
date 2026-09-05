import SwiftUI

struct IOSRootScaffold<Content: View>: View {
    let activeSection: String
    var onNavigateSection: (String) -> Void
    var userSession: UserSessionIOS? = nil
    var onLogout: () -> Void = {}
    @ViewBuilder let content: () -> Content

    @State private var showSideDrawer = false
    @State private var showProfileMenu = false
    @State private var showAiSheet = false

    @AppStorage("crm_is_dark_mode") private var isDarkMode = false

    private var textPrimary: Color {
        isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255)
    }
    private var textMuted = Color(red: 100/255, green: 116/255, blue: 139/255)
    private var primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)
    private var purpleBg = Color(red: 124/255, green: 58/255, blue: 237/255)
    private var bgLight: Color {
        isDarkMode ? Color(red: 11/255, green: 15/255, blue: 25/255) : Color(red: 248/255, green: 250/255, blue: 252/255)
    }

    var body: some View {
        ZStack(alignment: .leading) {
            VStack(spacing: 0) {
                // UNIFIED TOP APP BAR ON EVERY SINGLE IOS SCREEN
                HStack {
                    // TOP LEFT: HAMBURGER MENU BUTTON
                    Button(action: {
                        withAnimation { showSideDrawer.toggle() }
                    }) {
                        Image(systemName: "line.3.horizontal")
                            .font(.title3)
                            .foregroundColor(textPrimary)
                    }

                    CRMLogoView(size: 34, fontSize: 12)
                        .padding(.leading, 4)

                    Text(activeSection == "Dashboard" ? "CRM Dashboard" : activeSection)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(textPrimary)
                        .padding(.leading, 4)

                    Spacer()

                    // TOP RIGHT: NOTIFICATION BELL & PROFILE AVATAR
                    Image(systemName: "bell.fill")
                        .font(.subheadline)
                        .foregroundColor(textMuted)

                    Menu {
                        Text(userSession?.username ?? "Admin User")
                            .font(.headline)
                        if let email = userSession?.email {
                            Text(email)
                                .font(.caption)
                        }
                        Divider()
                        Button(role: .destructive, action: onLogout) {
                            Label("Logout", systemImage: "rectangle.portrait.and.arrow.right")
                        }
                    } label: {
                        ZStack {
                            Circle()
                                .fill(primaryBlue.opacity(0.12))
                                .frame(width: 36, height: 36)
                                .overlay(Circle().stroke(primaryBlue.opacity(0.3), lineWidth: 1))

                            Text(String((userSession?.username ?? userSession?.email ?? "Admin").prefix(1)).uppercased())
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(primaryBlue)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color.white)
                .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 2)

                // SCREEN CONTENT PLACED STRICTLY BELOW TOP BAR
                ZStack(alignment: .bottomTrailing) {
                    bgLight.ignoresSafeArea()
                    content()

                    // GLOBAL FLOATING BOTTOM-RIGHT AI ASSISTANT BUTTON ON EVERY IOS SCREEN
                    Button(action: { showAiSheet = true }) {
                        HStack(spacing: 6) {
                            Image(systemName: "sparkles")
                                .font(.subheadline)
                            Text("AI Assistant")
                                .font(.subheadline)
                                .fontWeight(.bold)
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(purpleBg)
                        .clipShape(Capsule())
                        .shadow(color: purpleBg.opacity(0.4), radius: 6, x: 0, y: 3)
                    }
                    .padding(20)
                }
            }

            // SIDE DRAWER OVERLAY FOR ALL CRM MODULES
            if showSideDrawer {
                Color.black.opacity(0.4)
                    .ignoresSafeArea()
                    .onTapGesture {
                        withAnimation { showSideDrawer = false }
                    }

                SideDrawerMenuView(
                    activeSection: activeSection,
                    userRole: userSession?.role ?? "STAFF",
                    onLogout: {
                        withAnimation { showSideDrawer = false }
                        onLogout()
                    },
                    onSelectSection: { section in
                        withAnimation { showSideDrawer = false }
                        if section == "Sign Out" || section == "Logout" {
                            onLogout()
                        } else {
                            onNavigateSection(section)
                        }
                    }
                )
                .transition(.move(edge: .leading))
            }
        }
        .sheet(isPresented: $showAiSheet) {
            IOSAiChatSheet()
        }
    }
}
