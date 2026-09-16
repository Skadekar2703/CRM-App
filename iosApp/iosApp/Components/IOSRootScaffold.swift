import SwiftUI

struct IOSRootScaffold<Content: View>: View {
    let activeSection: String
    var onNavigateSection: (String) -> Void
    var userSession: UserSessionIOS? = nil
    var onLogout: () -> Void = {}
    @ViewBuilder let content: () -> Content

    @State private var showSideDrawer = false
    @State private var showProfileMenu = false

    @AppStorage("crm_is_dark_mode") private var isDarkMode = false

    private var textPrimary: Color {
        isDarkMode ? Color.white : Color(red: 30/255, green: 41/255, blue: 59/255)
    }
    private var textMuted = Color(red: 100/255, green: 116/255, blue: 139/255)
    private var primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)
    private var bgLight: Color {
        isDarkMode ? Color(red: 11/255, green: 15/255, blue: 25/255) : Color(red: 248/255, green: 250/255, blue: 252/255)
    }

    var body: some View {
        ZStack(alignment: .leading) {
            VStack(spacing: 0) {
                // UNIFIED TOP APP BAR ON EVERY SINGLE IOS SCREEN
                HStack {
                    Button(action: {
                        withAnimation { showSideDrawer.toggle() }
                    }) {
                        Image(systemName: "line.3.horizontal")
                            .font(.title3)
                            .foregroundColor(textPrimary)
                    }

                    Text("CRM")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(primaryBlue)

                    Text("•")
                        .foregroundColor(textMuted)

                    Text(activeSection)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(textPrimary)

                    Spacer()

                    Button(action: { showProfileMenu.toggle() }) {
                        Image(systemName: "person.circle.fill")
                            .font(.title2)
                            .foregroundColor(primaryBlue)
                    }
                    .popover(isPresented: $showProfileMenu) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(userSession?.displayName ?? "User")
                                .font(.headline)
                            if let email = userSession?.email {
                                Text(email)
                                    .font(.caption)
                                    .foregroundColor(textMuted)
                            }
                            Divider()
                            Button("Sign Out") {
                                showProfileMenu = false
                                onLogout()
                            }
                            .foregroundColor(.red)
                            .fontWeight(.bold)
                        }
                        .padding()
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color.white)
                .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 2)

                // SCREEN CONTENT PLACED STRICTLY BELOW TOP BAR
                ZStack(alignment: .topLeading) {
                    bgLight.ignoresSafeArea()
                    content()
                }

                // BOTTOM NAVIGATION BAR (FIXED AT BOTTOM FOR ALL SCREENS)
                IOSBottomNavigationBar(
                    activeSection: activeSection,
                    onNavigateSection: onNavigateSection
                )
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
    }
}
