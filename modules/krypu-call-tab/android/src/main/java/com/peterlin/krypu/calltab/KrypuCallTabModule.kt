package com.peterlin.krypu.calltab

import android.content.ComponentName
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsCallback
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsIntent
import androidx.browser.customtabs.CustomTabsServiceConnection
import androidx.browser.customtabs.CustomTabsSession
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Opens a link (the FaceTime call) in a Chrome *partial* Custom Tab: a resizable panel docked at the bottom of the
// screen, with Krypu still visible and usable above it (person, notes). Chrome must be installed; partial tabs
// need a bound CustomTabsSession. Sends onTabEvent {event: "shown" | "hidden"} so Krypu knows when the call closes.
class KrypuCallTabModule : Module() {
  private val chrome = "com.android.chrome"
  private var connection: CustomTabsServiceConnection? = null
  private var session: CustomTabsSession? = null

  override fun definition() = ModuleDefinition {
    Name("KrypuCallTab")
    Events("onTabEvent")

    Function("isAvailable") {
      CustomTabsClient.getPackageName(requireNotNull(appContext.reactContext), listOf(chrome), true) == chrome
    }

    // heightFraction: share of the screen the call panel starts at (the user can drag it).
    AsyncFunction("open") { url: String, heightFraction: Double, toolbarColor: String, promise: Promise ->
      val activity = appContext.currentActivity
        ?: return@AsyncFunction promise.reject(CodedException("ERR_NO_ACTIVITY", "Krypu isn't in the foreground.", null))
      val launch = { s: CustomTabsSession? ->
        activity.runOnUiThread {
          try {
            val height = (activity.resources.displayMetrics.heightPixels * heightFraction).toInt()
            val tab = CustomTabsIntent.Builder(s)
              .setInitialActivityHeightPx(height, CustomTabsIntent.ACTIVITY_HEIGHT_ADJUSTABLE)
              .setToolbarCornerRadiusDp(16)
              .setBackgroundInteractionEnabled(true)
              .setDefaultColorSchemeParams(CustomTabColorSchemeParams.Builder().setToolbarColor(Color.parseColor(toolbarColor)).build())
              .setShowTitle(true)
              .build()
            tab.intent.setPackage(chrome)
            tab.launchUrl(activity, Uri.parse(url))
            promise.resolve(true)
          } catch (e: Exception) {
            promise.reject(CodedException("ERR_OPEN", e.message ?: "Couldn't open Chrome.", e))
          }
        }
      }
      session?.let { return@AsyncFunction launch(it) }
      val conn = object : CustomTabsServiceConnection() {
        override fun onCustomTabsServiceConnected(name: ComponentName, client: CustomTabsClient) {
          client.warmup(0)
          session = client.newSession(object : CustomTabsCallback() {
            override fun onNavigationEvent(navigationEvent: Int, extras: Bundle?) {
              when (navigationEvent) {
                TAB_SHOWN -> sendEvent("onTabEvent", mapOf("event" to "shown"))
                TAB_HIDDEN -> sendEvent("onTabEvent", mapOf("event" to "hidden"))
              }
            }
          })
          launch(session)
        }
        override fun onServiceDisconnected(name: ComponentName) { session = null; connection = null }
      }
      connection = conn
      if (!CustomTabsClient.bindCustomTabsService(activity, chrome, conn))
        promise.reject(CodedException("ERR_NO_CHROME", "Chrome isn't available.", null))
    }
  }
}
