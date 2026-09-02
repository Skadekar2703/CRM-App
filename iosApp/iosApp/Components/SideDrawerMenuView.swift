import SwiftUI

struct SideDrawerMenuView: View {
    let activeSection: String
    var onSelectSection: (String) -> Void

    let menuItems: [(id: String, label: String)] = [
        ("Dashboard", "Dashboard"),
        ("Sales", "Sales"),
        ("Areas", "Areas"),
        ("Categories", "Categories"),
        ("Items", "Items"),
        ("Transports", "Transports"),
        ("Udhaari", "Udhaari"),
        ("Cheques", "Cheques"),
        ("Customers", "Customers"),
        ("Suppliers", "Suppliers"),
        ("Employees", "Employees"),
        ("Daag", "Daag"),
        ("Notepad", "Notepad"),
        ("Reminders", "Reminders"),
        ("Expenses", "Expenses"),
        ("Supplier Ledger", "Supplier Ledger"),
        ("Cash Book", "Cash Book"),
        ("Profit & Loss", "Profit & Loss"),
        ("Aging Report", "Aging Report"),
        ("Users", "Users"),
        ("Settings", "Settings"),
        ("Sign Out", "Logout")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // DRAWER HEADER
            HStack(spacing: 12) {
                Text("CRM")
                    .font(.title2)
                    .fontWeight(.black)
                    .foregroundColor(.blue)

                VStack(alignment: .leading, spacing: 2) {
                    Text("CRM Admin")
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
                    ForEach(menuItems, id: \.id) { item in
                        let isSelected = item.id.caseInsensitiveCompare(activeSection) == .orderedSame
                        Button(action: { onSelectSection(item.id) }) {
                            HStack {
                                Text(item.label)
                                    .font(.subheadline)
                                    .fontWeight(isSelected ? .bold : .medium)
                                    .foregroundColor(isSelected ? .white : Color(red: 148/255, green: 163/255, blue: 184/255))
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
