import SwiftUI

struct IOSThreeStepDeleteSheet: View {
    let itemName: String
    let itemDetails: String
    let userRole: String
    var onConfirmDelete: () -> Void

    @Environment(\.dismiss) var dismiss
    @State private var step: Int = 1

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Spacer().frame(height: 10)

                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.red)

                if userRole.uppercased() != "ADMIN" {
                    Text("🔒 Access Denied")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.red)

                    Text("Only Admin users are authorized to perform delete operations.")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)

                    Spacer()

                    Button(action: { dismiss() }) {
                        Text("Close")
                            .font(.headline)
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.gray.opacity(0.2))
                            .foregroundColor(.primary)
                            .cornerRadius(12)
                    }
                } else {
                    VStack(spacing: 8) {
                        Text(step == 1 ? "⚠️ Delete \(itemName)?" : step == 2 ? "⚠️ Confirm Delete" : "⚠️ Final Confirmation")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)

                        Text("(Confirmation \(step) of 3)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                    }

                    Text(step == 1 ? "Are you sure you want to delete this item? This action will mark it for removal." :
                         step == 2 ? "This operation cannot be undone easily. All linked history and details will be affected. Continue?" :
                         "PERMANENT DELETE WARNING: This item will be permanently erased from the CRM database. Are you absolutely certain?")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 16)

                    VStack(spacing: 4) {
                        Text("Item: \(itemName)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)

                        if !itemDetails.isEmpty {
                            Text(itemDetails)
                                .font(.caption2)
                                .foregroundColor(.gray)
                        }
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity)
                    .background(Color.red.opacity(0.08))
                    .cornerRadius(8)

                    Spacer()

                    VStack(spacing: 10) {
                        Button(action: {
                            if step < 3 {
                                step += 1
                            } else {
                                onConfirmDelete()
                                dismiss()
                            }
                        }) {
                            Text(step < 3 ? "Continue →" : "DELETE PERMANENTLY")
                                .font(.headline)
                                .fontWeight(.bold)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.red)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }

                        Button(action: { dismiss() }) {
                            Text("Cancel")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.gray)
                        }
                    }
                }
            }
            .padding(20)
            .navigationTitle("Confirm Delete")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
