import SwiftUI

struct IOSBottomNavItem {
    let id: String
    let label: String
    let iconName: String
}

struct IOSBottomNavigationBar: View {
    let activeSection: String
    var onNavigateSection: (String) -> Void

    @AppStorage("crm_is_dark_mode") private var isDarkMode = false

    private let primaryBlue = Color(red: 37/255, green: 99/255, blue: 235/255)
    private var bgSurface: Color {
        isDarkMode ? Color(red: 15/255, green: 23/255, blue: 42/255) : Color.white
    }
    private var textUnselected: Color {
        isDarkMode ? Color(red: 148/255, green: 163/255, blue: 184/255) : Color(red: 100/255, green: 116/255, blue: 139/255)
    }

    private let items: [IOSBottomNavItem] = [
        IOSBottomNavItem(id: "Dashboard", label: "Dashboard", iconName: "square.grid.2x2.fill"),
        IOSBottomNavItem(id: "Udhaari", label: "Udhaari", iconName: "banknote.fill"),
        IOSBottomNavItem(id: "Employees", label: "Employee", iconName: "person.2.fill"),
        IOSBottomNavItem(id: "Daag", label: "Daag", iconName: "shippingbox.fill"),
        IOSBottomNavItem(id: "Notepad", label: "Notepad", iconName: "square.and.pencil")
    ]

    var body: some View {
        VStack(spacing: 0) {
            Divider()
                .background(isDarkMode ? Color.white.opacity(0.12) : Color.black.opacity(0.08))

            HStack(spacing: 0) {
                ForEach(items, id: \.id) { item in
                    let isSelected: Bool = {
                        switch item.id {
                        case "Dashboard":
                            return activeSection.caseInsensitiveCompare("Dashboard") == .orderedSame || activeSection.caseInsensitiveCompare("Home") == .orderedSame
                        case "Udhaari":
                            return activeSection.caseInsensitiveCompare("Udhaari") == .orderedSame
                        case "Employees":
                            return activeSection.caseInsensitiveCompare("Employees") == .orderedSame || activeSection.caseInsensitiveCompare("Employee") == .orderedSame
                        case "Daag":
                            return activeSection.caseInsensitiveCompare("Daag") == .orderedSame
                        case "Notepad":
                            return activeSection.caseInsensitiveCompare("Notepad") == .orderedSame || activeSection.caseInsensitiveCompare("Notes") == .orderedSame
                        default:
                            return false
                        }
                    }()

                    let currentColor = isSelected ? primaryBlue : textUnselected

                    Button(action: {
                        onNavigateSection(item.id)
                    }) {
                        VStack(spacing: 3) {
                            Image(systemName: item.iconName)
                                .font(.system(size: 18, weight: isSelected ? .bold : .regular))
                                .foregroundColor(currentColor)

                            Text(item.label)
                                .font(.system(size: 10, weight: isSelected ? .bold : .medium))
                                .foregroundColor(currentColor)
                                .lineLimit(1)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                        .background(
                            isSelected ? primaryBlue.opacity(0.12) : Color.clear
                        )
                        .cornerRadius(10)
                        .padding(.horizontal, 4)
                    }
                }
            }
            .padding(.horizontal, 6)
            .padding(.top, 4)
            .padding(.bottom, 2)
        }
        .background(bgSurface.ignoresSafeArea(edges: .bottom))
    }
}
