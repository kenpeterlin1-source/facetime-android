package com.peterlin.krypu.messages

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Finds video-call links in texts: scanSms() reads old SMS/MMS (needs READ_SMS), the LinkListener service catches
// new messages from notifications (needs Notification access), takeFound() hands those to the app.
class KrypuMessagesModule : Module() {
  private val context get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("KrypuMessages")

    Function("hasSmsPermission") {
      context.checkSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED
    }

    // Received texts containing a video-call link: [{address, url, at}] newest first.
    AsyncFunction("scanSms") {
      if (context.checkSelfPermission(Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED)
        throw CodedException("ERR_NO_SMS_PERMISSION", "Krypu isn't allowed to read texts.", null)
      val found = mutableListOf<Map<String, Any>>()
      val hosts = listOf("facetime.apple.com", "zoom.us/j", "meet.google.com", "teams.live.com", "teams.microsoft.com",
                         "call.whatsapp.com", "app.slack.com/huddle", "meet.jit.si")
      val where = hosts.joinToString(" OR ") { "body LIKE ?" }
      context.contentResolver.query(Uri.parse("content://sms/inbox"), arrayOf("address", "body", "date"), where,
                                    hosts.map { "%$it%" }.toTypedArray(), "date DESC")?.use { c ->
        while (c.moveToNext()) {
          val address = c.getString(0) ?: continue
          for (url in Links.find(c.getString(1))) found.add(mapOf("address" to address, "url" to url, "at" to c.getLong(2)))
        }
      }
      found
    }

    Function("isWatching") {
      // the system keeps enabled listeners as "pkg/Class:pkg/Class"
      (Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners") ?: "")
        .split(':').any { it.startsWith(context.packageName + "/") }
    }

    Function("openWatchSettings") {
      context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    // Links seen in message notifications since the last call: [{sender, url, at}]. Clears the list.
    Function("takeFound") { Links.take(context) }
  }
}
