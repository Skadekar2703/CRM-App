import Foundation

struct UserSessionIOS: Identifiable {
    let id: String
    let email: String
    let username: String?
    let accessToken: String?
}

class SupabaseIOSClient: ObservableObject {
    static let shared = SupabaseIOSClient()

    @Published var currentSession: UserSessionIOS? = nil
    @Published var isLoading = false
    @Published var isInitialLoading = true
    @Published var errorMessage: String? = nil
    @Published var successMessage: String? = nil

    private var baseURL: String {
        let url = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        return url.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }

    private var anonKey: String {
        return Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String ?? ""
    }

    private let defaults = UserDefaults.standard
    private let sessionKey = "crm_supabase_session"

    init() {
        restoreSession()
    }

    func restoreSession() {
        guard let token = defaults.string(forKey: "\(sessionKey)_token"),
              let userId = defaults.string(forKey: "\(sessionKey)_id"),
              let email = defaults.string(forKey: "\(sessionKey)_email") else {
            DispatchQueue.main.async {
                self.isInitialLoading = false
            }
            return
        }

        let username = defaults.string(forKey: "\(sessionKey)_username")
        let session = UserSessionIOS(id: userId, email: email, username: username, accessToken: token)
        
        DispatchQueue.main.async {
            self.currentSession = session
        }

        // Verify session with backend
        guard let url = URL(string: "\(baseURL)/auth/v1/user") else {
            DispatchQueue.main.async {
                self.isInitialLoading = false
            }
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue(anonKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let httpResp = response as? HTTPURLResponse, httpResp.statusCode == 401 {
                    self.logout()
                } else {
                    // Fetch or sync public.profiles row
                    self.fetchOrEnsureProfile(userId: userId, email: email, username: username, token: token)
                }
                self.isInitialLoading = false
            }
        }.resume()
    }

    func signUp(username: String, email: String, password: String) {
        guard let url = URL(string: "\(baseURL)/auth/v1/signup") else { return }

        let payload: [String: Any] = [
            "email": email.trimmingCharacters(in: .whitespaces),
            "password": password,
            "data": ["username": username.trimmingCharacters(in: .whitespaces)]
        ]

        performAuthRequest(url: url, payload: payload, fallbackUsername: username)
    }

    func login(email: String, password: String) {
        guard let url = URL(string: "\(baseURL)/auth/v1/token?grant_type=password") else { return }

        let payload: [String: Any] = [
            "email": email.trimmingCharacters(in: .whitespaces),
            "password": password
        ]

        performAuthRequest(url: url, payload: payload, fallbackUsername: nil)
    }

    func resetPassword(email: String) {
        guard let url = URL(string: "\(baseURL)/auth/v1/recover") else { return }

        let payload: [String: Any] = [
            "email": email.trimmingCharacters(in: .whitespaces)
        ]

        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
            self.successMessage = nil
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue(anonKey, forHTTPHeaderField: "apikey")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        } catch {
            DispatchQueue.main.async {
                self.isLoading = false
                self.errorMessage = "Failed to prepare request."
            }
            return
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                self.isLoading = false
                if let _ = error {
                    self.errorMessage = "Network error. Please check your internet connection."
                    return
                }

                if let httpResp = response as? HTTPURLResponse, httpResp.statusCode >= 400 {
                    self.errorMessage = "Failed to send reset email. Please try again."
                    return
                }

                self.successMessage = "Password reset instructions sent to \(email)."
            }
        }.resume()
    }

    func logout() {
        defaults.removeObject(forKey: "\(sessionKey)_token")
        defaults.removeObject(forKey: "\(sessionKey)_id")
        defaults.removeObject(forKey: "\(sessionKey)_email")
        defaults.removeObject(forKey: "\(sessionKey)_username")
        self.currentSession = nil
        self.errorMessage = nil
        self.successMessage = nil
    }

    private func performAuthRequest(url: URL, payload: [String: Any], fallbackUsername: String?) {
        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
            self.successMessage = nil
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue(anonKey, forHTTPHeaderField: "apikey")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        } catch {
            DispatchQueue.main.async {
                self.isLoading = false
                self.errorMessage = "Failed to serialize request data."
            }
            return
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                self.isLoading = false

                if let _ = error {
                    self.errorMessage = "Network error. Please check your connection."
                    return
                }

                guard let data = data,
                      let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
                    self.errorMessage = "Invalid server response."
                    return
                }

                if let httpResp = response as? HTTPURLResponse, httpResp.statusCode >= 400 {
                    self.errorMessage = self.mapError(json: json, statusCode: httpResp.statusCode)
                    return
                }

                let accessToken = json["access_token"] as? String ?? ""
                let refreshToken = json["refresh_token"] as? String ?? ""
                let userObj = json["user"] as? [String: Any] ?? json
                let userId = userObj["id"] as? String ?? ""
                let userEmail = userObj["email"] as? String ?? ""

                let metadata = userObj["user_metadata"] as? [String: Any]
                let username = (metadata?["username"] as? String) ?? fallbackUsername

                let session = UserSessionIOS(id: userId, email: userEmail, username: username, accessToken: accessToken)

                // Insert/Create profile in public.profiles table using auth.users(id) UUID
                if !userId.isEmpty {
                    if let profUrl = URL(string: "\(self.baseURL)/rest/v1/profiles") {
                        var profReq = URLRequest(url: profUrl)
                        profReq.httpMethod = "POST"
                        profReq.addValue(self.anonKey, forHTTPHeaderField: "apikey")
                        profReq.addValue("Bearer \(accessToken.isEmpty ? self.anonKey : accessToken)", forHTTPHeaderField: "Authorization")
                        profReq.addValue("application/json", forHTTPHeaderField: "Content-Type")
                        profReq.addValue("resolution=merge-duplicates", forHTTPHeaderField: "Prefer")

                        let profPayload: [String: Any] = [
                            "id": userId,
                            "username": username ?? fallbackUsername ?? "",
                            "email": userEmail,
                            "role": "user"
                        ]
                        profReq.httpBody = try? JSONSerialization.data(withJSONObject: profPayload)
                        URLSession.shared.dataTask(with: profReq).resume()
                    }
                }

                // Save session
                self.defaults.set(accessToken, forKey: "\(self.sessionKey)_token")
                if !refreshToken.isEmpty {
                    self.defaults.set(refreshToken, forKey: "\(self.sessionKey)_refresh_token")
                }
                self.defaults.set(userId, forKey: "\(self.sessionKey)_id")
                self.defaults.set(userEmail, forKey: "\(self.sessionKey)_email")
                if let username = username {
                    self.defaults.set(username, forKey: "\(self.sessionKey)_username")
                }

                self.currentSession = session
            }
        }.resume()
    }

    private func fetchOrEnsureProfile(userId: String, email: String, username: String?, token: String?) {
        guard !userId.isEmpty, let url = URL(string: "\(baseURL)/rest/v1/profiles?id=eq.\(userId)&select=*") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue(anonKey, forHTTPHeaderField: "apikey")
        if let token = token, !token.isEmpty {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        URLSession.shared.dataTask(with: request) { data, response, _ in
            if let data = data,
               let array = (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]],
               let first = array.first {
                if let profUsername = first["username"] as? String, !profUsername.isEmpty {
                    DispatchQueue.main.async {
                        if let current = self.currentSession, current.id == userId {
                            self.currentSession = UserSessionIOS(id: current.id, email: current.email, username: profUsername, accessToken: current.accessToken)
                            self.defaults.set(profUsername, forKey: "\(self.sessionKey)_username")
                        }
                    }
                    return
                }
            }
            
            // Profile missing: auto create safe profile row
            self.ensureProfile(userId: userId, email: email, username: username, token: token)
        }.resume()
    }

    private func ensureProfile(userId: String, email: String, username: String?, token: String?) {
        guard !userId.isEmpty, let profUrl = URL(string: "\(self.baseURL)/rest/v1/profiles") else { return }
        var profReq = URLRequest(url: profUrl)
        profReq.httpMethod = "POST"
        profReq.addValue(self.anonKey, forHTTPHeaderField: "apikey")
        if let token = token, !token.isEmpty {
            profReq.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        profReq.addValue("application/json", forHTTPHeaderField: "Content-Type")
        profReq.addValue("resolution=merge-duplicates", forHTTPHeaderField: "Prefer")

        let finalUsername = (username?.isEmpty == false) ? username! : String(email.split(separator: "@").first ?? "user")
        let profPayload: [String: Any] = [
            "id": userId,
            "username": finalUsername,
            "email": email,
            "role": "user"
        ]
        profReq.httpBody = try? JSONSerialization.data(withJSONObject: profPayload)
        URLSession.shared.dataTask(with: profReq).resume()
    }

    // ==========================================
    // ITEMS & SALES SUPABASE HELPERS FOR IOS
    // ==========================================

    func fetchItems(completion: @escaping (Result<[[String: Any]], Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/rest/v1/items?select=*&order=created_at.desc") else {
            completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue(anonKey, forHTTPHeaderField: "apikey")
        if let token = defaults.string(forKey: "\(sessionKey)_token") {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data,
                  let items = (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]] else {
                completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to parse items"])))
                return
            }
            completion(.success(items))
        }.resume()
    }

    func completeSaleRPC(customerId: String?, customerName: String, subtotal: Double, discount: Double, tax: Double, total: Double, paymentMethod: String, cartItems: [[String: Any]], completion: @escaping (Result<[String: Any], Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/rest/v1/rpc/complete_sale") else {
            completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid RPC URL"])))
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue(anonKey, forHTTPHeaderField: "apikey")
        if let token = defaults.string(forKey: "\(sessionKey)_token") {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "p_customer_id": customerId ?? NSNull(),
            "p_customer_name": customerName,
            "p_subtotal": subtotal,
            "p_discount": discount,
            "p_tax": tax,
            "p_total": total,
            "p_payment_method": paymentMethod,
            "p_items": cartItems
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        } catch {
            completion(.failure(error))
            return
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data,
                  let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
                completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "RPC execution failed"])))
                return
            }
            completion(.success(json))
        }.resume()
    }

    func fetchTable(table: String, select: String = "*", order: String = "created_at.desc", completion: @escaping (Result<[[String: Any]], Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/rest/v1/\(table)?select=\(select)&order=\(order)") else {
            completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue(anonKey, forHTTPHeaderField: "apikey")
        if let token = defaults.string(forKey: "\(sessionKey)_token") {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data,
                  let items = (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]] else {
                completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to parse records"])))
                return
            }
            completion(.success(items))
        }.resume()
    }

    func insertRecord(table: String, payload: [String: Any], completion: @escaping (Result<[String: Any], Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/rest/v1/\(table)") else {
            completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        var mutablePayload = payload
        if let userId = defaults.string(forKey: "\(sessionKey)_id"), mutablePayload["user_id"] == nil {
            mutablePayload["user_id"] = userId
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue(anonKey, forHTTPHeaderField: "apikey")
        if let token = defaults.string(forKey: "\(sessionKey)_token") {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("return=representation", forHTTPHeaderField: "Prefer")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: mutablePayload)
        } catch {
            completion(.failure(error))
            return
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data,
                  let array = (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]],
                  let created = array.first else {
                completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to create record"])))
                return
            }
            completion(.success(created))
        }.resume()
    }

    func invokeFunction(name: String, payload: [String: Any], completion: @escaping (Result<[String: Any], Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/functions/v1/\(name)") else {
            completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue(anonKey, forHTTPHeaderField: "apikey")
        if let token = defaults.string(forKey: "\(sessionKey)_token") {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        } catch {
            completion(.failure(error))
            return
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data,
                  let dict = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
                completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to parse function response"])))
                return
            }
            completion(.success(dict))
        }.resume()
    }

    private func mapError(json: [String: Any], statusCode: Int) -> String {
        let msg = (json["msg"] as? String) ?? (json["error_description"] as? String) ?? (json["message"] as? String) ?? ""

        if msg.localizedCaseInsensitiveContains("invalid") || msg.localizedCaseInsensitiveContains("credentials") {
            return "Invalid email or password. Please try again."
        }
        if msg.localizedCaseInsensitiveContains("already registered") || msg.localizedCaseInsensitiveContains("already exists") {
            return "An account with this email address already exists."
        }
        if msg.localizedCaseInsensitiveContains("6 characters") {
            return "Password must be at least 6 characters."
        }
        if !msg.isEmpty {
            return msg
        }
        if statusCode == 400 {
            return "Invalid login credentials."
        }
        return "Authentication failed. Please try again."
    }
}
