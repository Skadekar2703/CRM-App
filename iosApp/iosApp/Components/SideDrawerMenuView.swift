import SwiftUI

struct SideDrawerMenuView: View {
    let activeSection: String
    var userRole: String = "STAFF"
    @AppStorage("crm_is_dark_mode") private var isDarkMode = false
    var onToggleTheme: () -> Void = {}
    var onLogout: () -> Void = {}
    var onSelectSection: (String) -> Void

    let allMenuItems: [(id: String, label: String, adminOnly: Bool)] = [
        ("Dashboard", "Dashboard", false),
        ("Customers", "Customers", false),
        ("Employees", "Employees", false),
        ("Categories", "Categories", false),
        ("Udhaari", "Udhaari", false),
        ("Profit & Loss", "Profit & Loss", false),
        ("Cheques", "Cheques", false),
        ("Cash Book", "Cash Book", false),
        ("Expenses", "Expenses", false),
        ("Areas", "Areas", false),
        ("Notepad", "Notepad", false),
        ("Reminders", "Reminders", false),
        ("Daag", "Daag", false),
        ("Users", "Users", true),
        ("Settings", "Settings", false),
        ("Dark Theme", "Dark Theme", false),
        ("Logout", "Logout", false)
    ]

    var visibleMenuItems: [(id: String, label: String, adminOnly: Bool)] {
        allMenuItems.filter { !$0.adminOnly || userRole.caseInsensitiveCompare("ADMIN") == .orderedSame }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // DRAWER HEADER
            HStack(spacing: 12) {
                Text("CRM")
                    .font(.title2)
                    .fontWeight(.black)
                    .foregroundColor(.blue)

                VStack(alignment: .leading, spacing: 2) {
                    Text(userRole.caseInsensitiveCompare("ADMIN") == .orderedSame ? "CRM Admin" : "CRM Staff")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    Text("Management Portal")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            .padding(.top, 40)
            .padding(.bottom, 8)

            Divider().background(Color.gray.opacity(0.3))

            // VERTICALLY SCROLLABLE MENU LIST
            ScrollView(showsIndicators: true) {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(visibleMenuItems, id: \.id) { item in
                        let isSelected = item.id.caseInsensitiveCompare(activeSection) == .orderedSame
                        let itemLabel = item.id == "Dark Theme" ? (isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode") : item.label
                        let isLogout = item.id == "Logout"

                        Button(action: {
                            if item.id == "Logout" {
                                onLogout()
                            } else if item.id == "Dark Theme" {
                                isDarkMode.toggle()
                                onToggleTheme()
                            } else {
                                onSelectSection(item.id)
                            }
                        }) {
                            HStack {
                                Text(itemLabel)
                                    .font(.subheadline)
                                    .fontWeight(isSelected || isLogout ? .bold : .medium)
                                    .foregroundColor(isLogout ? Color.red : (isSelected ? .white : Color(red: 148/255, green: 163/255, blue: 184/255)))
                                Spacer()
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(isSelected ? Color.blue : Color.clear)
                            .cornerRadius(8)
                        }
                    }
                }
                .padding(.bottom, 30)
            }
        }
        .padding(.horizontal, 16)
        .frame(width: 280)
        .frame(maxHeight: .infinity)
        .background(Color(red: 15/255, green: 23/255, blue: 42/255))
        .shadow(radius: 8)
    }
}
