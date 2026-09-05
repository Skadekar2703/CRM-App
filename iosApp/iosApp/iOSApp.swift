import SwiftUI

@main
struct iOSApp: App {
    @AppStorage("crm_is_dark_mode") private var isDarkMode = false

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(isDarkMode ? .dark : .light)
        }
    }
}