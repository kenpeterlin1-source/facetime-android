package com.peterlin.krypu.messages

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

// Video-call links Krypu cares about (same platforms as src/platforms.js) and a small on-phone store of links
// found in message notifications, waiting for the app to pick them up.
object Links {
  val PATTERN = Regex(
    """https://(facetime\.apple\.com/join#\S+|call\.whatsapp\.com/\S+|([a-z0-9-]+\.)?zoom\.us/j/\S+|meet\.google\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}\S*|teams\.live\.com/meet/\S+|teams\.microsoft\.com/l/(meetup-join|call)/\S+|app\.slack\.com/huddle/\S+|meet\.jit\.si/\S+)""",
    RegexOption.IGNORE_CASE
  )

  fun find(text: CharSequence?): List<String> =
    if (text == null) emptyList() else PATTERN.findAll(text).map { it.value.trimEnd('.', ',', ')', '!', '?') }.toList()

  private const val PREFS = "krypu_found_links"
  private const val KEY = "found"

  @Synchronized
  fun remember(context: Context, sender: String?, url: String, at: Long) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val list = JSONArray(prefs.getString(KEY, "[]"))
    for (i in 0 until list.length()) if (list.getJSONObject(i).optString("url") == url) return
    list.put(JSONObject().put("sender", sender ?: "").put("url", url).put("at", at))
    prefs.edit().putString(KEY, list.toString()).apply()
  }

  @Synchronized
  fun take(context: Context): List<Map<String, Any>> {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val list = JSONArray(prefs.getString(KEY, "[]"))
    prefs.edit().putString(KEY, "[]").apply()
    return (0 until list.length()).map { i ->
      val o = list.getJSONObject(i)
      mapOf("sender" to o.optString("sender"), "url" to o.optString("url"), "at" to o.optLong("at"))
    }
  }
}
