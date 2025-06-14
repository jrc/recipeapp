/**
 * wakelock.ts
 * Handles logic related to the Screen Wake Lock API.
 */

let wakeLockSentinel: WakeLockSentinel | null = null;

/**
 * Requests a screen wake lock if the API is supported and no lock is currently active.
 * This function is idempotent - calling it multiple times without releasing won't cause issues.
 * It will only request a new lock if wakeLockSentinel is null.
 */
export const acquireWakeLock = async () => {
  // Check if the Wake Lock API is supported and if we don't already have a lock
  if ("wakeLock" in navigator && !wakeLockSentinel) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request("screen");
      console.log("Wake lock acquired.");

      // Add a listener to the sentinel for when it's released by the system
      // This happens, for example, if the tab is minimized or the screen turns off manually.
      wakeLockSentinel.addEventListener("release", () => {
        // Set the sentinel to null when released
        wakeLockSentinel = null;
        console.log("Wake lock released.");
        // Note: We don't automatically re-acquire here.
        // The visibilitychange listener or a tab switch handled by ui.ts will request it again if needed
        // if the page becomes visible again while the 'View' tab is active.
      });
    } catch (err: any) {
      // The wake lock request failed - usually the user denied it temporarily.
      console.error(`${err.name}: ${err.message}`);
      // Ensure the sentinel is null on failure
      wakeLockSentinel = null;
    }
  }
};

/**
 * Releases the current screen wake lock if one is active.
 */
export const releaseWakeLock = async () => {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
      // Set the sentinel to null after successful release
      wakeLockSentinel = null;
    } catch (err: any) {
      console.error(`Error releasing wake lock: ${err.name}, ${err.message}`);
      // In case of an error during release, still try to clear the sentinel
      wakeLockSentinel = null;
    }
  }
};

/**
 * Handles document visibility changes. Attempts to re-acquire the wake lock
 * if the document becomes visible. This is important because the system
 * automatically releases wake locks when the document becomes hidden.
 *
 * Note: This listener doesn't know *which* tab was active when the document
 * became hidden. ui.ts is responsible for calling acquireWakeLock() only
 * when the 'view' tab is the one becoming active/visible. However, adding
 * a redundant acquire attempt here on visibility change (if a sentinel *was*
 * active) can help robustness if the 'view' tab *was* active when hidden.
 * The acquireWakeLock() function itself checks if a lock already exists.
 */
const handleVisibilityChange = () => {
  // If the document becomes visible and we previously had a wake lock (wakeLockSentinel is not null),
  // try to re-acquire it.
  if (wakeLockSentinel !== null && document.visibilityState === "visible") {
    acquireWakeLock(); // This call is safe; it won't request if a lock is already active.
  } else if (document.visibilityState === "hidden") {
    // The 'release' event listener on the sentinel (if it exists) will handle
    // setting wakeLockSentinel to null when the system releases it.
  }
};

// Add the visibility change listener as soon as the script loads
document.addEventListener("visibilitychange", handleVisibilityChange);

// It's also good practice to release the lock when the page is unloaded.
// This listener is added by the initializeUI function in ui.ts.
