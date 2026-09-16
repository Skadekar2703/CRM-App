import SwiftUI

struct CRMTheme {
    static func background(isDark: Bool) -> Color {
        isDark ? Color(red: 8/255, green: 13/255, blue: 26/255) : Color(red: 244/255, green: 247/255, blue: 251/255)
    }

    static func cardBackground(isDark: Bool) -> Color {
        isDark ? Color(red: 17/255, green: 26/255, blue: 46/255) : Color.white
    }

    static func elevatedCardBackground(isDark: Bool) -> Color {
        isDark ? Color(red: 23/255, green: 35/255, blue: 58/255) : Color(red: 248/255, green: 250/255, blue: 252/255)
    }

    static func textPrimary(isDark: Bool) -> Color {
        isDark ? Color(red: 248/255, green: 250/255, blue: 252/255) : Color(red: 15/255, green: 23/255, blue: 42/255)
    }

    static func textSecondary(isDark: Bool) -> Color {
        isDark ? Color(red: 203/255, green: 213/255, blue: 225/255) : Color(red: 71/255, green: 85/255, blue: 105/255)
    }

    static func textMuted(isDark: Bool) -> Color {
        isDark ? Color(red: 148/255, green: 163/255, blue: 184/255) : Color(red: 100/255, green: 116/255, blue: 139/255)
    }

    static func border(isDark: Bool) -> Color {
        isDark ? Color(red: 38/255, green: 53/255, blue: 79/255) : Color(red: 217/255, green: 226/255, blue: 239/255)
    }

    static let primaryBlue = Color(red: 59/255, green: 130/255, blue: 246/255)
    static let purpleAccent = Color(red: 139/255, green: 92/255, blue: 246/255)
    static let successGreen = Color(red: 34/255, green: 197/255, blue: 94/255)
    static let warningOrange = Color(red: 245/255, green: 158/255, blue: 11/255)
    static let dangerRed = Color(red: 239/255, green: 68/255, blue: 68/255)
}

struct CRMCardStyle: ViewModifier {
    var isDark: Bool
    var cornerRadius: CGFloat = 16
    var padding: CGFloat = 16

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(CRMTheme.cardBackground(isDark: isDark))
            .cornerRadius(cornerRadius)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(CRMTheme.border(isDark: isDark), lineWidth: 1)
            )
    }
}

extension View {
    func crmCardStyle(isDark: Bool, cornerRadius: CGFloat = 16, padding: CGFloat = 16) -> some View {
        self.modifier(CRMCardStyle(isDark: isDark, cornerRadius: cornerRadius, padding: padding))
    }
}
