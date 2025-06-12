const COUNTDOWN_INTERVAL_MS = 1000;
const BEEP_INTERVAL_MS = 1300;
const BEEP_DURATION_S = 0.2;
const BEEP_FREQUENCY_HZ = 3000;

let globalAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!globalAudioContext) {
    try {
      globalAudioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser.", e);
      return null;
    }
  }
  // Attempt to resume context if it's suspended (e.g., due to autoplay policies)
  // This might need user interaction to succeed.
  if (globalAudioContext.state === "suspended") {
    globalAudioContext
      .resume()
      .catch((err) => console.error("Error resuming AudioContext:", err));
  }
  return globalAudioContext;
}

/**
 * Plays a short, high-pitched beep sound using the Web Audio API.
 */
function playBeepSound(): void {
  const context = getAudioContext();
  if (!context) {
    // console.warn("AudioContext not available. Cannot play beep sound."); // Optional: less console noise
    return;
  }

  try {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(BEEP_FREQUENCY_HZ, context.currentTime);
    oscillator.connect(context.destination);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + BEEP_DURATION_S);
  } catch (error) {
    console.error("Error playing beep sound:", error);
  }
}

/**
 * timer.ts
 * Handles the logic for starting, stopping, and managing countdown timers
 * associated with duration spans in the recipe view.
 */

interface TimerData {
  countdownIntervalId?: number; // Interval ID for the active countdown
  beepIntervalId?: number; // Interval ID for the "done" beep
  isDoneAndBeeping: boolean; // Flag to indicate if the timer is finished and beeping
  countdownDisplayElement?: HTMLElement; // Reference to the child span showing the countdown
}

// Map to store active timers, mapping the span element to its timer data
const activeTimers = new Map<HTMLElement, TimerData>();

/**
 * Formats seconds into a human-readable string (e.g., "1m 5s").
 * @param totalSeconds The total seconds to format.
 * @returns A string representing the formatted time.
 */
function formatCountdownTime(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let timeString = "";
  if (minutes > 0) {
    timeString += `${minutes}m `;
  }
  timeString += `${seconds}s`;
  return timeString.trim();
}

/**
 * Stops the beeping for a completed timer and resets its appearance.
 * @param span The duration span element.
 * @param timerData The active timer data for this span.
 */
function stopBeeping(span: HTMLElement, timerData: TimerData): void {
  if (timerData.beepIntervalId) {
    clearInterval(timerData.beepIntervalId);
  }
  if (timerData.countdownDisplayElement) {
    span.removeChild(timerData.countdownDisplayElement);
  }
  span.classList.remove("timer-done");
  span.classList.remove("timer-active"); // Ensure active is also removed
  activeTimers.delete(span);
}

/**
 * Stops an active countdown timer and resets its appearance.
 * @param span The duration span element.
 * @param timerData The active timer data for this span.
 */
function stopCountdown(span: HTMLElement, timerData: TimerData): void {
  if (timerData.countdownIntervalId) {
    clearInterval(timerData.countdownIntervalId);
  }
  if (timerData.countdownDisplayElement) {
    span.removeChild(timerData.countdownDisplayElement);
  }
  span.classList.remove("timer-active");
  span.classList.remove("timer-done"); // Ensure beeping is also removed
  activeTimers.delete(span);
}

/**
 * Starts a new countdown timer for the given duration span.
 * @param span The duration span element.
 */
function startCountdown(span: HTMLElement): void {
  const titleAttr = span.getAttribute("title");
  if (!titleAttr || !titleAttr.startsWith("SEC=")) {
    console.warn("Duration span is missing SEC= title attribute.", span);
    return;
  }

  const totalSeconds = parseInt(titleAttr.substring(4), 10);
  if (isNaN(totalSeconds) || totalSeconds <= 0) {
    console.warn("Invalid total seconds for timer:", titleAttr, span);
    return;
  }

  span.classList.remove("timer-done"); // Clear beeping if it was
  span.classList.add("timer-active");
  let currentRemainingSeconds = totalSeconds;

  // Find or create the countdown display child span
  let countdownDisplayElement =
    span.querySelector<HTMLElement>(".timer-countdown");
  if (!countdownDisplayElement) {
    countdownDisplayElement = document.createElement("span");
    countdownDisplayElement.className = "timer-countdown";
    // Add a space before the countdown span if the main span isn't empty
    if (span.textContent && span.textContent.trim() !== "") {
      span.appendChild(document.createTextNode(" "));
    }
    span.appendChild(countdownDisplayElement);
  }
  const finalCountdownDisplayElement = countdownDisplayElement; // To satisfy TS in closure

  const updateDisplay = () => {
    if (finalCountdownDisplayElement) {
      finalCountdownDisplayElement.textContent = `(${formatCountdownTime(currentRemainingSeconds)} left)`;
    }
  };
  updateDisplay(); // Show initial state immediately

  const countdownIntervalId = window.setInterval(() => {
    currentRemainingSeconds--;
    updateDisplay();

    const currentTimerData = activeTimers.get(span);

    if (currentRemainingSeconds <= 0) {
      if (currentTimerData && currentTimerData.countdownIntervalId) {
        clearInterval(currentTimerData.countdownIntervalId);
      }
      span.classList.remove("timer-active");
      span.classList.add("timer-done");
      if (finalCountdownDisplayElement) {
        finalCountdownDisplayElement.textContent = `(TIMER DONE)`;
      }

      // Play the first beep immediately
      playBeepSound();

      // Then set an interval for subsequent beeps
      const beepIntervalId = window.setInterval(() => {
        playBeepSound();
      }, BEEP_INTERVAL_MS); // Use constant, "Beep" every 0.8 seconds

      // Update the timer data to reflect the "done and beeping" state
      if (currentTimerData) {
        currentTimerData.isDoneAndBeeping = true;
        currentTimerData.beepIntervalId = beepIntervalId;
        currentTimerData.countdownIntervalId = undefined; // Countdown is finished
      } else {
        // This case should ideally not happen if startCountdown was called correctly
        activeTimers.set(span, {
          beepIntervalId,
          isDoneAndBeeping: true,
          countdownDisplayElement: finalCountdownDisplayElement,
        });
      }
    }
  }, COUNTDOWN_INTERVAL_MS); // Use constant

  // Store the new timer data
  activeTimers.set(span, {
    countdownIntervalId,
    isDoneAndBeeping: false,
    countdownDisplayElement: finalCountdownDisplayElement,
  });
}

/**
 * Initializes the timer functionality by attaching a click listener to the
 * specified view element. This listener will handle clicks on duration spans.
 * @param viewElement The HTML element (e.g., renderedRecipeView) that contains duration spans.
 */
export function initializeTimers(viewElement: HTMLElement): void {
  viewElement.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    // Check if the click was on a duration span or its child
    const durationSpan = target.classList.contains("duration")
      ? target
      : (target.closest(".duration") as HTMLElement | null);

    if (durationSpan) {
      const timerData = activeTimers.get(durationSpan);

      if (timerData) {
        if (timerData.isDoneAndBeeping) {
          // Timer is done and beeping: click dismisses it
          stopBeeping(durationSpan, timerData);
        } else if (timerData.countdownIntervalId) {
          // Timer is actively counting down: click stops it
          stopCountdown(durationSpan, timerData);
        } else {
          // Timer data exists but it's not counting or beeping (should not happen with current logic)
          // Treat as a new start, ensuring old state is cleared.
          console.warn(
            "Timer data in inconsistent state, restarting timer:",
            durationSpan,
            timerData,
          );
          startCountdown(durationSpan);
        }
      } else {
        // No active timer for this span: start a new one
        startCountdown(durationSpan);
      }
    }
  });
}
