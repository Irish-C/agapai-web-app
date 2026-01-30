import RPi.GPIO as GPIO
import time

# --- Pin assignments (BCM numbering) ---
STROBE_PIN = 17   # GPIO drives MOSFET GATE (through gate resistor)
ACK_PIN    = 24   # Momentary push button to GND (acknowledge)

# --- GPIO setup ---
GPIO.setmode(GPIO.BCM)

# Ensure the MOSFET gate starts LOW (safe)
GPIO.setup(STROBE_PIN, GPIO.OUT, initial=GPIO.LOW)

# ACK button uses internal pull-up; button connects GPIO24 -> GND when pressed
GPIO.setup(ACK_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

print("Alert System Initialized (MOSFET low-side switch).")
print("Ensure the 12V Power Switch is ON for the strobe to receive power.")

try:
    # --- Activate Alert: drive MOSFET gate HIGH to turn strobe ON ---
    GPIO.output(STROBE_PIN, GPIO.HIGH)
    print("🚨 ALERT ACTIVE: Strobe Light is ON (MOSFET gate HIGH).")

    # --- Wait for Acknowledge Button Press (edge detection with debounce) ---
    print("Waiting for Acknowledge Button Press...")
    GPIO.wait_for_edge(ACK_PIN, GPIO.FALLING, bouncetime=300)

    # --- Button pressed: turn strobe OFF ---
    print("✅ Alert Acknowledged by User.")
    GPIO.output(STROBE_PIN, GPIO.LOW)
    print("Strobe Light Turned OFF.")
    print("You may now switch OFF the 12V power if desired.")

except KeyboardInterrupt:
    print("\nProgram interrupted by user.")

finally:
    # Ensure MOSFET gate low and cleanup
    GPIO.output(STROBE_PIN, GPIO.LOW)
    GPIO.cleanup()
    print("GPIO cleanup complete. Program terminated.")