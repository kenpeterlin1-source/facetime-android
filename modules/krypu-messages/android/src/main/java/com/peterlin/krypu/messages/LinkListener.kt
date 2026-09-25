package com.peterlin.krypu.messages

import android.app.Notification
import android.os.Build
import android.os.Bundle
import android.os.Parcelable
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

// Sees message notifications (Google Messages, Samsung Messages) and keeps any video-call links in them.
// Everything else in the notification is ignored and nothing is stored except sender name + link.
class LinkListener : NotificationListenerService() {
  private val messagingApps = setOf("com.google.android.apps.messaging", "com.samsung.android.messaging")

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    if (sbn.packageName !in messagingApps) return
    val extras = sbn.notification.extras ?: return
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
    // MessagingStyle keeps each message with its sender; fall back to the plain text fields
    val messages = messagesOf(extras)
    if (messages.isNotEmpty()) {
      for ((sender, text) in messages) for (url in Links.find(text)) Links.remember(this, sender ?: title, url, sbn.postTime)
    } else {
      val text = extras.getCharSequence(Notification.EXTRA_BIG_TEXT) ?: extras.getCharSequence(Notification.EXTRA_TEXT)
      for (url in Links.find(text)) Links.remember(this, title, url, sbn.postTime)
    }
  }

  private fun messagesOf(extras: Bundle): List<Pair<String?, CharSequence?>> {
    val raw: Array<Parcelable>? = if (Build.VERSION.SDK_INT >= 33)
      extras.getParcelableArray(Notification.EXTRA_MESSAGES, Parcelable::class.java)
    else @Suppress("DEPRECATION") extras.getParcelableArray(Notification.EXTRA_MESSAGES)
    return raw.orEmpty().mapNotNull { (it as? Bundle) }.map { b ->
      val person = if (Build.VERSION.SDK_INT >= 28) {
        if (Build.VERSION.SDK_INT >= 33) b.getParcelable("sender_person", android.app.Person::class.java)?.name?.toString()
        else @Suppress("DEPRECATION") (b.getParcelable<android.app.Person>("sender_person"))?.name?.toString()
      } else null
      (person ?: b.getCharSequence("sender")?.toString()) to b.getCharSequence("text")
    }
  }
}
