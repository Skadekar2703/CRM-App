import SwiftUI

struct CRMLogoView: View {
    var size: CGFloat = 72
    var fontSize: CGFloat = 22

    var body: some View {
        ZStack {
            Circle()
                .fill(Color.white)
                .frame(width: size, height: size)
                .overlay(
                    Circle()
                        .stroke(Color(red: 226/255, green: 232/255, blue: 240/255), lineWidth: 1)
                )

            Text("CRM")
                .font(.system(size: fontSize, weight: .heavy))
                .foregroundColor(Color(red: 30/255, green: 41/255, blue: 59/255))
                .tracking(1)
        }
    }
}

struct CRMLogoView_Previews: PreviewProvider {
    static var previews: some View {
        CRMLogoView()
            .padding()
            .background(Color.gray)
    }
}
