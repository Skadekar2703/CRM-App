import SwiftUI

struct IOSPlaceholderView: View {
    let title: String

    var body: some View {
        ZStack {
            Color(red: 248/255, green: 250/255, blue: 252/255).ignoresSafeArea()

            VStack(spacing: 8) {
                Text(title)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))

                Text("Module coming soon...")
                    .font(.subheadline)
                    .foregroundColor(Color(red: 100/255, green: 116/255, blue: 139/255))
            }
        }
    }
}
