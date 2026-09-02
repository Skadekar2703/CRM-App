package com.example.crm_app_kmp.data

import android.content.Context
import android.content.SharedPreferences
import com.example.crm_app_kmp.BuildConfig
import com.example.crm_app_kmp.auth.UserSession
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

class SupabaseAndroidClient(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("crm_supabase_session", Context.MODE_PRIVATE)

    private val httpClient = OkHttpClient()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    private val baseUrl: String = BuildConfig.SUPABASE_URL.trimEnd('/')
    private val anonKey: String = BuildConfig.SUPABASE_ANON_KEY

    suspend fun signUp(
        username: String,
        email: String,
        password: String
    ): Result<UserSession> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/auth/v1/signup"
            val payload = JSONObject().apply {
                put("email", email.trim())
                put("password", password)
                put("data", JSONObject().apply {
                    put("username", username.trim())
                })
            }

            val request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Content-Type", "application/json")
                .post(payload.toString().toRequestBody(jsonMediaType))
                .build()

            httpClient.newCall(request).execute().use { response ->
                val bodyString = response.body?.string() ?: ""
                if (!response.isSuccessful) {
                    val friendlyError = parseError(bodyString, response.code)
                    return@withContext Result.failure(Exception(friendlyError))
                }

                val json = JSONObject(bodyString)
                var session = parseUserSession(json, username)

                // Insert/Create profile in public.profiles using auth.users(id)
                if (session.id.isNotEmpty()) {
                    ensureProfile(
                        userId = session.id,
                        username = username.ifBlank { session.username ?: email.substringBefore("@") },
                        email = email,
                        accessToken = session.accessToken
                    )
                }

                saveSession(session)
                Result.success(session)
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun login(
        email: String,
        password: String
    ): Result<UserSession> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/auth/v1/token?grant_type=password"
            val payload = JSONObject().apply {
                put("email", email.trim())
                put("password", password)
            }

            val request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Content-Type", "application/json")
                .post(payload.toString().toRequestBody(jsonMediaType))
                .build()

            httpClient.newCall(request).execute().use { response ->
                val bodyString = response.body?.string() ?: ""
                if (!response.isSuccessful) {
                    val friendlyError = parseError(bodyString, response.code)
                    return@withContext Result.failure(Exception(friendlyError))
                }

                val json = JSONObject(bodyString)
                var session = parseUserSession(json, null)

                // Fetch or safely create missing profile in public.profiles
                val fetchedProfile = fetchOrEnsureProfile(
                    userId = session.id,
                    fallbackEmail = session.email,
                    fallbackUsername = session.username ?: email.substringBefore("@"),
                    accessToken = session.accessToken
                )

                if (fetchedProfile != null && fetchedProfile.has("username")) {
                    session = session.copy(username = fetchedProfile.optString("username"))
                }

                saveSession(session)
                Result.success(session)
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun resetPassword(email: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/auth/v1/recover"
            val payload = JSONObject().apply {
                put("email", email.trim())
            }

            val request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Content-Type", "application/json")
                .post(payload.toString().toRequestBody(jsonMediaType))
                .build()

            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val bodyString = response.body?.string() ?: ""
                    val friendlyError = parseError(bodyString, response.code)
                    return@withContext Result.failure(Exception(friendlyError))
                }
                Result.success(Unit)
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun refreshSession(): UserSession? = withContext(Dispatchers.IO) {
        val refreshToken = prefs.getString("refresh_token", null)
        if (refreshToken.isNullOrEmpty()) return@withContext null

        try {
            val url = "$baseUrl/auth/v1/token?grant_type=refresh_token"
            val payload = JSONObject().apply {
                put("refresh_token", refreshToken)
            }

            val request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Content-Type", "application/json")
                .post(payload.toString().toRequestBody(jsonMediaType))
                .build()

            httpClient.newCall(request).execute().use { response ->
                val bodyString = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    val json = JSONObject(bodyString)
                    val session = parseUserSession(json, prefs.getString("user_username", null))
                    if (session.accessToken.isNullOrEmpty()) {
                        clearSession()
                        return@withContext null
                    }
                    saveSession(session)
                    println("[SupabaseAndroidClient] Session successfully auto-refreshed for user ${session.id}")
                    session
                } else {
                    println("[SupabaseAndroidClient] Token refresh failed (HTTP ${response.code}). Clearing session.")
                    clearSession()
                    null
                }
            }
        } catch (e: Exception) {
            println("[SupabaseAndroidClient] Offline or network error during token refresh: ${e.message}")
            val userId = prefs.getString("user_id", null) ?: return@withContext null
            val email = prefs.getString("user_email", null) ?: return@withContext null
            val token = prefs.getString("access_token", null) ?: return@withContext null
            val username = prefs.getString("user_username", null)
            UserSession(id = userId, email = email, username = username, accessToken = token, refreshToken = refreshToken)
        }
    }

    suspend fun restoreSession(): UserSession? = withContext(Dispatchers.IO) {
        val token = prefs.getString("access_token", null)
        val userId = prefs.getString("user_id", null)
        val email = prefs.getString("user_email", null)
        val username = prefs.getString("user_username", null)
        val refreshToken = prefs.getString("refresh_token", null)

        if (token.isNullOrEmpty() || userId.isNullOrEmpty() || email.isNullOrEmpty()) {
            return@withContext null
        }

        try {
            val url = "$baseUrl/auth/v1/user"
            val request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()

            httpClient.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    println("[SupabaseAndroidClient] Session verified for user $userId")
                    UserSession(id = userId, email = email, username = username, accessToken = token, refreshToken = refreshToken)
                } else if (response.code == 401) {
                    println("[SupabaseAndroidClient] Access token expired on startup (401). Attempting refresh...")
                    return@use refreshSession()
                } else {
                    UserSession(id = userId, email = email, username = username, accessToken = token, refreshToken = refreshToken)
                }
            }
        } catch (e: Exception) {
            // Keep local session if offline
            println("[SupabaseAndroidClient] Offline restore for user $userId: ${e.message}")
            UserSession(id = userId, email = email, username = username, accessToken = token, refreshToken = refreshToken)
        }
    }

    fun logout() {
        val token = prefs.getString("access_token", null)
        if (!token.isNullOrEmpty()) {
            try {
                val url = "$baseUrl/auth/v1/logout"
                val request = Request.Builder()
                    .url(url)
                    .addHeader("apikey", anonKey)
                    .addHeader("Authorization", "Bearer $token")
                    .post("".toRequestBody(null))
                    .build()
                httpClient.newCall(request).execute().close()
            } catch (_: Exception) {}
        }
        clearSession()
    }

    private fun fetchOrEnsureProfile(
        userId: String,
        fallbackEmail: String,
        fallbackUsername: String,
        accessToken: String?
    ): JSONObject? {
        if (userId.isBlank()) return null
        try {
            val profileUrl = "$baseUrl/rest/v1/profiles?id=eq.$userId&select=*"
            val request = Request.Builder()
                .url(profileUrl)
                .addHeader("apikey", anonKey)
                .apply {
                    if (!accessToken.isNullOrEmpty()) {
                        addHeader("Authorization", "Bearer $accessToken")
                    } else {
                        addHeader("Authorization", "Bearer $anonKey")
                    }
                }
                .get()
                .build()

            httpClient.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val bodyString = response.body?.string() ?: ""
                    val array = org.json.JSONArray(bodyString)
                    if (array.length() > 0) {
                        return array.getJSONObject(0)
                    }
                }
            }
            ensureProfile(userId, fallbackUsername, fallbackEmail, accessToken)
        } catch (e: Exception) {
            println("[SupabaseAndroidClient] fetchOrEnsureProfile log: ${e.message}")
        }
        return null
    }

    private fun ensureProfile(
        userId: String,
        username: String,
        email: String,
        accessToken: String?
    ) {
        if (userId.isBlank()) return
        try {
            val profileUrl = "$baseUrl/rest/v1/profiles"
            val profilePayload = JSONObject().apply {
                put("id", userId)
                put("username", username.ifBlank { email.substringBefore("@") })
                put("email", email)
                put("role", "user")
            }
            val profileRequest = Request.Builder()
                .url(profileUrl)
                .addHeader("apikey", anonKey)
                .apply {
                    if (!accessToken.isNullOrEmpty()) {
                        addHeader("Authorization", "Bearer $accessToken")
                    } else {
                        addHeader("Authorization", "Bearer $anonKey")
                    }
                }
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "resolution=merge-duplicates")
                .post(profilePayload.toString().toRequestBody(jsonMediaType))
                .build()

            httpClient.newCall(profileRequest).execute().close()
        } catch (e: Exception) {
            println("[SupabaseAndroidClient] ensureProfile log: ${e.message}")
        }
    }

    private fun saveSession(session: UserSession) {
        prefs.edit()
            .putString("access_token", session.accessToken)
            .apply {
                if (!session.refreshToken.isNullOrEmpty()) {
                    putString("refresh_token", session.refreshToken)
                }
            }
            .putString("user_id", session.id)
            .putString("user_email", session.email)
            .putString("user_username", session.username)
            .commit() // Synchronous commit to prevent race conditions across composable views
    }

    private fun clearSession() {
        prefs.edit().clear().commit()
    }

    private fun parseUserSession(json: JSONObject, fallbackUsername: String?): UserSession {
        val accessToken = json.optString("access_token", "")
        val refreshToken = json.optString("refresh_token", "")
        val userObj = json.optJSONObject("user") ?: json
        val id = userObj.optString("id", "")
        val email = userObj.optString("email", "")

        val metadata = userObj.optJSONObject("user_metadata")
        val username = if (metadata != null && metadata.has("username")) metadata.optString("username") else fallbackUsername

        return UserSession(
            id = id,
            email = email,
            username = username,
            accessToken = accessToken,
            refreshToken = refreshToken
        )
    }

    private fun getActiveToken(): String {
        return prefs.getString("access_token", null) ?: anonKey
    }

    fun getActiveUserId(): String? {
        return prefs.getString("user_id", null)
    }

    // ==========================================
    // ITEMS MODULE - SUPABASE INTEGRATION
    // ==========================================

    suspend fun fetchItems(): Result<List<com.example.crm_app_kmp.items.ItemModel>> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/items?select=*&order=created_at.desc"
            var activeToken = getActiveToken()

            var request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $activeToken")
                .get()
                .build()

            var response = httpClient.newCall(request).execute()
            var bodyString = response.body?.string() ?: ""

            // Handle 401 Unauthorized (Expired JWT token): Try auto refresh
            if (response.code == 401) {
                println("[SupabaseAndroidClient] GET /rest/v1/items returned 401. Attempting token refresh...")
                response.close()
                val refreshed = refreshSession()
                if (refreshed != null && !refreshed.accessToken.isNullOrEmpty()) {
                    activeToken = refreshed.accessToken!!
                    request = Request.Builder()
                        .url(url)
                        .addHeader("apikey", anonKey)
                        .addHeader("Authorization", "Bearer $activeToken")
                        .get()
                        .build()
                    response = httpClient.newCall(request).execute()
                    bodyString = response.body?.string() ?: ""
                }
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    println("[SupabaseAndroidClient] GET /rest/v1/items FAILED with HTTP ${resp.code}. Body: $bodyString")
                    val userMsg = if (resp.code == 401) "Unable to load items. Please sign in again." else "Unable to load items (HTTP ${resp.code})."
                    return@withContext Result.failure(Exception(userMsg))
                }
                println("[SupabaseAndroidClient] GET /rest/v1/items SUCCESS (HTTP 200).")
                val array = org.json.JSONArray(bodyString)
                val list = mutableListOf<com.example.crm_app_kmp.items.ItemModel>()
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val stock = obj.optInt("stock_quantity", 0)
                    val alert = obj.optInt("low_stock_alert", 5)
                    val statusCalc = when {
                        stock <= 0 -> "Out of Stock"
                        stock <= alert -> "Low Stock"
                        else -> obj.optString("status", "Active")
                    }
                    list.add(
                        com.example.crm_app_kmp.items.ItemModel(
                            id = obj.optString("id", ""),
                            name = obj.optString("name", ""),
                            brand = obj.optString("brand", "Generic"),
                            code = obj.optString("sku", ""),
                            category = obj.optString("category", "General"),
                            unit = obj.optString("unit", "Pcs"),
                            stockQuantity = stock,
                            lowStockAlert = alert,
                            salePrice = obj.optDouble("price", 0.0),
                            status = statusCalc,
                            createdDate = obj.optString("created_at", "").take(10)
                        )
                    )
                }
                Result.success(list)
            }
        } catch (e: Exception) {
            println("[SupabaseAndroidClient] Exception in fetchItems: ${e.message}")
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun addItem(
        name: String,
        brand: String,
        code: String,
        category: String,
        unit: String,
        stockQuantity: Int,
        lowStockAlert: Int,
        salePrice: Double,
        status: String
    ): Result<com.example.crm_app_kmp.items.ItemModel> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/items"
            var activeToken = getActiveToken()
            val activeUserId = getActiveUserId()
            val payload = JSONObject().apply {
                put("name", name.trim())
                put("brand", brand.ifBlank { "Generic" })
                put("sku", if (code.isBlank()) "SKU-${System.currentTimeMillis().toString().takeLast(6)}" else code.trim())
                put("category", category.ifBlank { "General" })
                put("unit", unit.ifBlank { "Pcs" })
                put("stock_quantity", stockQuantity)
                put("low_stock_alert", lowStockAlert)
                put("price", salePrice)
                put("status", status.ifBlank { "Active" })
                if (!activeUserId.isNullOrEmpty()) {
                    put("user_id", activeUserId)
                }
            }

            var request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $activeToken")
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=representation")
                .post(payload.toString().toRequestBody(jsonMediaType))
                .build()

            var response = httpClient.newCall(request).execute()
            var bodyString = response.body?.string() ?: ""

            if (response.code == 401) {
                response.close()
                val refreshed = refreshSession()
                if (refreshed != null && !refreshed.accessToken.isNullOrEmpty()) {
                    activeToken = refreshed.accessToken!!
                    request = Request.Builder()
                        .url(url)
                        .addHeader("apikey", anonKey)
                        .addHeader("Authorization", "Bearer $activeToken")
                        .addHeader("Content-Type", "application/json")
                        .addHeader("Prefer", "return=representation")
                        .post(payload.toString().toRequestBody(jsonMediaType))
                        .build()
                    response = httpClient.newCall(request).execute()
                    bodyString = response.body?.string() ?: ""
                }
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    return@withContext Result.failure(Exception(parseError(bodyString, resp.code)))
                }
                val array = org.json.JSONArray(bodyString)
                val obj = array.getJSONObject(0)
                Result.success(
                    com.example.crm_app_kmp.items.ItemModel(
                        id = obj.optString("id", ""),
                        name = obj.optString("name", ""),
                        brand = obj.optString("brand", "Generic"),
                        code = obj.optString("sku", ""),
                        category = obj.optString("category", "General"),
                        unit = obj.optString("unit", "Pcs"),
                        stockQuantity = obj.optInt("stock_quantity", stockQuantity),
                        lowStockAlert = obj.optInt("low_stock_alert", lowStockAlert),
                        salePrice = obj.optDouble("price", salePrice),
                        status = obj.optString("status", status),
                        createdDate = "Just now"
                    )
                )
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun fetchCategories(): Result<List<String>> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/categories?select=name&order=name.asc"
            var activeToken = getActiveToken()

            var request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $activeToken")
                .get()
                .build()

            var response = httpClient.newCall(request).execute()
            var bodyString = response.body?.string() ?: ""

            if (response.code == 401) {
                response.close()
                val refreshed = refreshSession()
                if (refreshed != null && !refreshed.accessToken.isNullOrEmpty()) {
                    activeToken = refreshed.accessToken!!
                    request = Request.Builder()
                        .url(url)
                        .addHeader("apikey", anonKey)
                        .addHeader("Authorization", "Bearer $activeToken")
                        .get()
                        .build()
                    response = httpClient.newCall(request).execute()
                    bodyString = response.body?.string() ?: ""
                }
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    val friendlyError = parseError(bodyString, resp.code)
                    return@withContext Result.failure(Exception(friendlyError))
                }
                val array = org.json.JSONArray(bodyString)
                val list = mutableListOf<String>()
                for (i in 0 until array.length()) {
                    val catName = array.getJSONObject(i).optString("name", "")
                    if (catName.isNotBlank() && !list.contains(catName)) {
                        list.add(catName)
                    }
                }
                Result.success(list)
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun updateItem(
        id: String,
        name: String,
        brand: String,
        code: String,
        category: String,
        unit: String,
        stockQuantity: Int,
        lowStockAlert: Int,
        salePrice: Double,
        status: String
    ): Result<com.example.crm_app_kmp.items.ItemModel> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/items?id=eq.$id"
            var activeToken = getActiveToken()
            val payload = JSONObject().apply {
                put("name", name.trim())
                put("brand", brand.ifBlank { "Generic" })
                put("sku", code.trim())
                put("category", category.ifBlank { "General" })
                put("unit", unit.ifBlank { "Pcs" })
                put("stock_quantity", stockQuantity)
                put("low_stock_alert", lowStockAlert)
                put("price", salePrice)
                put("status", status.ifBlank { "Active" })
                put("updated_at", "now()")
            }

            var request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $activeToken")
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=representation")
                .patch(payload.toString().toRequestBody(jsonMediaType))
                .build()

            var response = httpClient.newCall(request).execute()
            var bodyString = response.body?.string() ?: ""

            if (response.code == 401) {
                response.close()
                val refreshed = refreshSession()
                if (refreshed != null && !refreshed.accessToken.isNullOrEmpty()) {
                    activeToken = refreshed.accessToken!!
                    request = Request.Builder()
                        .url(url)
                        .addHeader("apikey", anonKey)
                        .addHeader("Authorization", "Bearer $activeToken")
                        .addHeader("Content-Type", "application/json")
                        .addHeader("Prefer", "return=representation")
                        .patch(payload.toString().toRequestBody(jsonMediaType))
                        .build()
                    response = httpClient.newCall(request).execute()
                    bodyString = response.body?.string() ?: ""
                }
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    return@withContext Result.failure(Exception(parseError(bodyString, resp.code)))
                }
                val array = org.json.JSONArray(bodyString)
                val obj = array.getJSONObject(0)
                Result.success(
                    com.example.crm_app_kmp.items.ItemModel(
                        id = obj.optString("id", id),
                        name = obj.optString("name", name),
                        brand = obj.optString("brand", brand),
                        code = obj.optString("sku", code),
                        category = obj.optString("category", category),
                        unit = obj.optString("unit", unit),
                        stockQuantity = obj.optInt("stock_quantity", stockQuantity),
                        lowStockAlert = obj.optInt("low_stock_alert", lowStockAlert),
                        salePrice = obj.optDouble("price", salePrice),
                        status = obj.optString("status", status),
                        createdDate = "Updated"
                    )
                )
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun deleteItem(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/items?id=eq.$id"
            var activeToken = getActiveToken()
            var request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $activeToken")
                .delete()
                .build()

            var response = httpClient.newCall(request).execute()

            if (response.code == 401) {
                response.close()
                val refreshed = refreshSession()
                if (refreshed != null && !refreshed.accessToken.isNullOrEmpty()) {
                    activeToken = refreshed.accessToken!!
                    request = Request.Builder()
                        .url(url)
                        .addHeader("apikey", anonKey)
                        .addHeader("Authorization", "Bearer $activeToken")
                        .delete()
                        .build()
                    response = httpClient.newCall(request).execute()
                }
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    val bodyString = resp.body?.string() ?: ""
                    return@withContext Result.failure(Exception(parseError(bodyString, resp.code)))
                }
                Result.success(Unit)
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    // ==========================================
    // SALES MODULE - ATOMIC RPC COMPLETE SALE
    // ==========================================

    suspend fun completeSaleAtomic(
        customerId: String?,
        customerName: String,
        subtotal: Double,
        discount: Double,
        tax: Double,
        total: Double,
        paymentMethod: String,
        cartItems: List<com.example.crm_app_kmp.sales.CartItem>
    ): Result<JSONObject> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/rpc/complete_sale"
            var activeToken = getActiveToken()

            val jsonItems = org.json.JSONArray()
            for (item in cartItems) {
                jsonItems.put(JSONObject().apply {
                    val isUuid = try { java.util.UUID.fromString(item.product.id); true } catch (_: Exception) { false }
                    if (isUuid) {
                        put("item_id", item.product.id)
                    } else {
                        put("item_id", JSONObject.NULL)
                    }
                    put("item_name", item.product.name)
                    put("sku", item.product.sku)
                    put("quantity", item.quantity)
                    put("unit_price", item.product.price)
                    put("subtotal", item.total)
                })
            }

            val payload = JSONObject().apply {
                val isCustUuid = try { if (customerId != null) { java.util.UUID.fromString(customerId); true } else false } catch (_: Exception) { false }
                if (isCustUuid) {
                    put("p_customer_id", customerId)
                } else {
                    put("p_customer_id", JSONObject.NULL)
                }
                put("p_customer_name", customerName)
                put("p_subtotal", subtotal)
                put("p_discount", discount)
                put("p_tax", tax)
                put("p_total", total)
                put("p_payment_method", paymentMethod)
                put("p_items", jsonItems)
            }

            var request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $activeToken")
                .addHeader("Content-Type", "application/json")
                .post(payload.toString().toRequestBody(jsonMediaType))
                .build()

            var response = httpClient.newCall(request).execute()
            var bodyString = response.body?.string() ?: ""

            if (response.code == 401) {
                response.close()
                val refreshed = refreshSession()
                if (refreshed != null && !refreshed.accessToken.isNullOrEmpty()) {
                    activeToken = refreshed.accessToken!!
                    request = Request.Builder()
                        .url(url)
                        .addHeader("apikey", anonKey)
                        .addHeader("Authorization", "Bearer $activeToken")
                        .addHeader("Content-Type", "application/json")
                        .post(payload.toString().toRequestBody(jsonMediaType))
                        .build()
                    response = httpClient.newCall(request).execute()
                    bodyString = response.body?.string() ?: ""
                }
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    val friendlyMsg = parseError(bodyString, resp.code)
                    return@withContext Result.failure(Exception(friendlyMsg))
                }
                val json = JSONObject(bodyString)
                Result.success(json)
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun fetchSalesHistory(): Result<List<com.example.crm_app_kmp.sales.SaleTransaction>> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/sales?select=*,sale_items(*)&order=created_at.desc"
            var activeToken = getActiveToken()

            var request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $activeToken")
                .get()
                .build()

            var response = httpClient.newCall(request).execute()
            var bodyString = response.body?.string() ?: ""

            if (response.code == 401) {
                response.close()
                val refreshed = refreshSession()
                if (refreshed != null && !refreshed.accessToken.isNullOrEmpty()) {
                    activeToken = refreshed.accessToken!!
                    request = Request.Builder()
                        .url(url)
                        .addHeader("apikey", anonKey)
                        .addHeader("Authorization", "Bearer $activeToken")
                        .get()
                        .build()
                    response = httpClient.newCall(request).execute()
                    bodyString = response.body?.string() ?: ""
                }
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    val friendlyError = parseError(bodyString, resp.code)
                    return@withContext Result.failure(Exception(friendlyError))
                }

                val array = org.json.JSONArray(bodyString)
                val list = mutableListOf<com.example.crm_app_kmp.sales.SaleTransaction>()

                for (i in 0 until array.length()) {
                    val s = array.getJSONObject(i)
                    val rawItems = s.optJSONArray("sale_items") ?: org.json.JSONArray()
                    val lineItems = mutableListOf<com.example.crm_app_kmp.sales.SaleLineItem>()

                    for (j in 0 until rawItems.length()) {
                        val li = rawItems.getJSONObject(j)
                        lineItems.add(
                            com.example.crm_app_kmp.sales.SaleLineItem(
                                id = li.optString("id", ""),
                                itemId = li.optString("item_id", ""),
                                itemName = li.optString("item_name", "Item"),
                                quantity = li.optInt("quantity", 1),
                                unitPrice = li.optDouble("unit_price", 0.0),
                                total = li.optDouble("subtotal", li.optDouble("total", 0.0))
                            )
                        )
                    }

                    val dateStr = s.optString("created_at", s.optString("sale_date", ""))
                    val formattedDate = if (dateStr.length >= 10) dateStr.take(10) else "Today"

                    list.add(
                        com.example.crm_app_kmp.sales.SaleTransaction(
                            id = s.optString("id", ""),
                            invoiceNumber = s.optString("invoice_number", ""),
                            customerId = s.optString("customer_id", ""),
                            customerName = s.optString("customer_name", "Walk-in Customer"),
                            saleDate = formattedDate,
                            subtotal = s.optDouble("subtotal", 0.0),
                            discount = s.optDouble("discount", 0.0),
                            tax = s.optDouble("tax", 0.0),
                            total = s.optDouble("total", 0.0),
                            paymentMethod = s.optString("payment_method", "Cash"),
                            status = s.optString("status", "Completed"),
                            items = lineItems
                        )
                    )
                }
                Result.success(list)
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun fetchCustomers(): Result<List<com.example.crm_app_kmp.sales.CustomerModel>> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/customers?select=*&order=name.asc"
            var activeToken = getActiveToken()

            var request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $activeToken")
                .get()
                .build()

            var response = httpClient.newCall(request).execute()
            var bodyString = response.body?.string() ?: ""

            if (response.code == 401) {
                response.close()
                val refreshed = refreshSession()
                if (refreshed != null && !refreshed.accessToken.isNullOrEmpty()) {
                    activeToken = refreshed.accessToken!!
                    request = Request.Builder()
                        .url(url)
                        .addHeader("apikey", anonKey)
                        .addHeader("Authorization", "Bearer $activeToken")
                        .get()
                        .build()
                    response = httpClient.newCall(request).execute()
                    bodyString = response.body?.string() ?: ""
                }
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    val friendlyError = parseError(bodyString, resp.code)
                    return@withContext Result.failure(Exception(friendlyError))
                }

                val array = org.json.JSONArray(bodyString)
                val list = mutableListOf<com.example.crm_app_kmp.sales.CustomerModel>()

                for (i in 0 until array.length()) {
                    val c = array.getJSONObject(i)
                    list.add(
                        com.example.crm_app_kmp.sales.CustomerModel(
                            id = c.optString("id", ""),
                            name = c.optString("name", ""),
                            phone = c.optString("phone", ""),
                            email = c.optString("email", ""),
                            area = c.optString("area", "")
                        )
                    )
                }

                Result.success(list)
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun addCustomer(
        name: String,
        phone: String = "",
        email: String = "",
        area: String = ""
    ): Result<com.example.crm_app_kmp.sales.CustomerModel> = withContext(Dispatchers.IO) {
        val payload = JSONObject().apply {
            put("name", name.trim())
            put("phone", phone.trim())
            put("email", email.trim())
            put("area", area.trim())
        }
        insertRecord("customers", payload).map { obj ->
            com.example.crm_app_kmp.sales.CustomerModel(
                id = obj.optString("id", ""),
                name = obj.optString("name", name),
                phone = obj.optString("phone", phone),
                email = obj.optString("email", email),
                area = obj.optString("area", area)
            )
        }
    }

    suspend fun updateCustomer(
        id: String,
        name: String,
        phone: String = "",
        email: String = "",
        area: String = ""
    ): Result<Unit> = withContext(Dispatchers.IO) {
        val payload = JSONObject().apply {
            put("name", name.trim())
            put("phone", phone.trim())
            put("email", email.trim())
            put("area", area.trim())
            put("updated_at", "now()")
        }
        updateRecord("customers", id, payload)
    }

    suspend fun deleteCustomer(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        deleteRecord("customers", id)
    }

    // ==========================================
    // TRANSPORTS HELPERS
    // ==========================================

    suspend fun fetchTransports(): Result<List<com.example.crm_app_kmp.transports.TransportModel>> = withContext(Dispatchers.IO) {
        fetchTable("transports", select = "*", order = "created_at.desc").map { jsonArray ->
            val list = mutableListOf<com.example.crm_app_kmp.transports.TransportModel>()
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                list.add(
                    com.example.crm_app_kmp.transports.TransportModel(
                        id = obj.optString("id", ""),
                        transportName = obj.optString("name", obj.optString("transport_name", "Transport")),
                        mobile = obj.optString("phone", obj.optString("mobile", "")),
                        contactPerson = obj.optString("driver_name", obj.optString("contact_person", "N/A")),
                        vehicleNumber = obj.optString("vehicle_number", "N/A"),
                        status = obj.optString("status", "Active"),
                        createdDate = obj.optString("created_at", "Today")
                    )
                )
            }
            list
        }
    }

    suspend fun addTransport(
        name: String,
        mobile: String = "",
        contactPerson: String = "",
        vehicleNumber: String = "",
        status: String = "Active"
    ): Result<com.example.crm_app_kmp.transports.TransportModel> = withContext(Dispatchers.IO) {
        val payload = JSONObject().apply {
            put("name", name.trim())
            put("phone", mobile.trim())
            put("driver_name", contactPerson.trim())
            put("vehicle_number", vehicleNumber.trim())
            put("status", status)
        }
        insertRecord("transports", payload).map { obj ->
            com.example.crm_app_kmp.transports.TransportModel(
                id = obj.optString("id", ""),
                transportName = obj.optString("name", name),
                mobile = obj.optString("phone", mobile),
                contactPerson = obj.optString("driver_name", contactPerson),
                vehicleNumber = obj.optString("vehicle_number", vehicleNumber),
                status = obj.optString("status", status),
                createdDate = obj.optString("created_at", "Today")
            )
        }
    }

    suspend fun updateTransport(
        id: String,
        name: String,
        mobile: String = "",
        contactPerson: String = "",
        vehicleNumber: String = "",
        status: String = "Active"
    ): Result<Unit> = withContext(Dispatchers.IO) {
        val payload = JSONObject().apply {
            put("name", name.trim())
            put("phone", mobile.trim())
            put("driver_name", contactPerson.trim())
            put("vehicle_number", vehicleNumber.trim())
            put("status", status)
            put("updated_at", "now()")
        }
        updateRecord("transports", id, payload)
    }

    suspend fun deleteTransport(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        deleteRecord("transports", id)
    }

    // ==========================================
    // GENERIC POSTGREST CRUD HELPERS
    // ==========================================

    suspend fun fetchTable(
        table: String,
        select: String = "*",
        order: String = "created_at.desc"
    ): Result<org.json.JSONArray> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/$table?select=$select&order=$order"
            var activeToken = getActiveToken()

            var request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $activeToken")
                .get()
                .build()

            var response = httpClient.newCall(request).execute()
            var bodyString = response.body?.string() ?: ""

            if (response.code == 401) {
                response.close()
                val refreshed = refreshSession()
                if (refreshed != null && !refreshed.accessToken.isNullOrEmpty()) {
                    activeToken = refreshed.accessToken!!
                    request = Request.Builder()
                        .url(url)
                        .addHeader("apikey", anonKey)
                        .addHeader("Authorization", "Bearer $activeToken")
                        .get()
                        .build()
                    response = httpClient.newCall(request).execute()
                    bodyString = response.body?.string() ?: ""
                }
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    val friendlyError = parseError(bodyString, resp.code)
                    return@withContext Result.failure(Exception(friendlyError))
                }
                val array = org.json.JSONArray(bodyString)
                Result.success(array)
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun insertRecord(
        table: String,
        payload: JSONObject
    ): Result<JSONObject> = withContext(Dispatchers.IO) {
        try {
            val activeUserId = getActiveUserId()
            if (!activeUserId.isNullOrEmpty() && !payload.has("user_id")) {
                payload.put("user_id", activeUserId)
            }
            val url = "$baseUrl/rest/v1/$table"
            var activeToken = getActiveToken()

            var request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $activeToken")
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=representation")
                .post(payload.toString().toRequestBody(jsonMediaType))
                .build()

            var response = httpClient.newCall(request).execute()
            var bodyString = response.body?.string() ?: ""

            if (response.code == 401) {
                response.close()
                val refreshed = refreshSession()
                if (refreshed != null && !refreshed.accessToken.isNullOrEmpty()) {
                    activeToken = refreshed.accessToken!!
                    request = Request.Builder()
                        .url(url)
                        .addHeader("apikey", anonKey)
                        .addHeader("Authorization", "Bearer $activeToken")
                        .addHeader("Content-Type", "application/json")
                        .addHeader("Prefer", "return=representation")
                        .post(payload.toString().toRequestBody(jsonMediaType))
                        .build()
                    response = httpClient.newCall(request).execute()
                    bodyString = response.body?.string() ?: ""
                }
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    val friendlyError = parseError(bodyString, resp.code)
                    return@withContext Result.failure(Exception(friendlyError))
                }
                val array = org.json.JSONArray(bodyString)
                val createdObj = if (array.length() > 0) array.getJSONObject(0) else JSONObject()
                Result.success(createdObj)
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun updateRecord(
        table: String,
        id: String,
        payload: JSONObject
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/$table?id=eq.$id"
            var activeToken = getActiveToken()

            var request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $activeToken")
                .addHeader("Content-Type", "application/json")
                .patch(payload.toString().toRequestBody(jsonMediaType))
                .build()

            var response = httpClient.newCall(request).execute()
            var bodyString = response.body?.string() ?: ""

            if (response.code == 401) {
                response.close()
                val refreshed = refreshSession()
                if (refreshed != null && !refreshed.accessToken.isNullOrEmpty()) {
                    activeToken = refreshed.accessToken!!
                    request = Request.Builder()
                        .url(url)
                        .addHeader("apikey", anonKey)
                        .addHeader("Authorization", "Bearer $activeToken")
                        .addHeader("Content-Type", "application/json")
                        .patch(payload.toString().toRequestBody(jsonMediaType))
                        .build()
                    response = httpClient.newCall(request).execute()
                    bodyString = response.body?.string() ?: ""
                }
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    val friendlyError = parseError(bodyString, resp.code)
                    return@withContext Result.failure(Exception(friendlyError))
                }
                Result.success(Unit)
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun deleteRecord(
        table: String,
        id: String
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/rest/v1/$table?id=eq.$id"
            var activeToken = getActiveToken()

            var request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $activeToken")
                .delete()
                .build()

            var response = httpClient.newCall(request).execute()
            var bodyString = response.body?.string() ?: ""

            if (response.code == 401) {
                response.close()
                val refreshed = refreshSession()
                if (refreshed != null && !refreshed.accessToken.isNullOrEmpty()) {
                    activeToken = refreshed.accessToken!!
                    request = Request.Builder()
                        .url(url)
                        .addHeader("apikey", anonKey)
                        .addHeader("Authorization", "Bearer $activeToken")
                        .delete()
                        .build()
                    response = httpClient.newCall(request).execute()
                    bodyString = response.body?.string() ?: ""
                }
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    val friendlyError = parseError(bodyString, resp.code)
                    return@withContext Result.failure(Exception(friendlyError))
                }
                Result.success(Unit)
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    suspend fun invokeEdgeFunction(
        functionName: String,
        payload: JSONObject
    ): Result<JSONObject> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/functions/v1/$functionName"
            var activeToken = getActiveToken()

            var request = Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer $activeToken")
                .addHeader("Content-Type", "application/json")
                .post(payload.toString().toRequestBody(jsonMediaType))
                .build()

            var response = httpClient.newCall(request).execute()
            var bodyString = response.body?.string() ?: ""

            if (response.code == 401) {
                response.close()
                val refreshed = refreshSession()
                if (refreshed != null && !refreshed.accessToken.isNullOrEmpty()) {
                    activeToken = refreshed.accessToken!!
                    request = Request.Builder()
                        .url(url)
                        .addHeader("apikey", anonKey)
                        .addHeader("Authorization", "Bearer $activeToken")
                        .addHeader("Content-Type", "application/json")
                        .post(payload.toString().toRequestBody(jsonMediaType))
                        .build()
                    response = httpClient.newCall(request).execute()
                    bodyString = response.body?.string() ?: ""
                }
            }

            response.use { resp ->
                if (!resp.isSuccessful) {
                    val friendlyError = parseError(bodyString, resp.code)
                    return@withContext Result.failure(Exception(friendlyError))
                }
                val obj = JSONObject(bodyString)
                Result.success(obj)
            }
        } catch (e: Exception) {
            Result.failure(Exception(mapException(e)))
        }
    }

    private fun parseError(bodyString: String, statusCode: Int): String {
        return try {
            val json = JSONObject(bodyString)
            val msg = json.optString("msg", json.optString("error_description", json.optString("message", json.optString("hint", ""))))
            when {
                msg.contains("Insufficient stock", ignoreCase = true) -> msg
                msg.contains("invalid", ignoreCase = true) || msg.contains("credentials", ignoreCase = true) ->
                    "Invalid email or password. Please try again."
                msg.contains("already registered", ignoreCase = true) || msg.contains("user_already_exists", ignoreCase = true) ->
                    "An account with this email address already exists."
                msg.contains("at least 6 characters", ignoreCase = true) || msg.contains("password", ignoreCase = true) ->
                    "Password must be at least 6 characters."
                msg.isNotEmpty() -> msg
                statusCode == 401 -> "Authentication required or session expired (401). Please log in again."
                statusCode == 403 -> "Permission denied (403). You do not have authorization for this action."
                statusCode == 404 -> "Requested endpoint or record not found (404)."
                statusCode == 400 -> "Bad request. Please check input values."
                statusCode == 422 -> "Unprocessable entry. Please check your details."
                else -> "Operation failed (HTTP $statusCode). Please try again."
            }
        } catch (e: Exception) {
            when (statusCode) {
                401 -> "Authentication required or session expired (401). Please log in again."
                403 -> "Permission denied (403). You do not have authorization for this action."
                else -> "Operation failed (HTTP $statusCode). Please try again."
            }
        }
    }

    private fun mapException(e: Exception): String {
        return when (e) {
            is IOException -> "Network error. Please check your internet connection and try again."
            else -> e.message ?: "An unexpected error occurred. Please try again."
        }
    }
}
