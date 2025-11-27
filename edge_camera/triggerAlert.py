import time
import sys
import atexit
from gpiozero import LED, Button, Device
# Ensure the dependency is installed on the system (see updated instructions)
from gpiozero.pins.pigpio import PiGPIOFactory 
from signal import pause

# --- Configuration Notes ---
# 1. BCM Pin Numbering: We use the BCM (Broadcom) numbering scheme.
# 2. Relay Logic: Active-Low (HIGH/3.3V = OFF, LOW/0V = ON).
# 3. Button Logic: Internal Pull-up resistor is used (standard wiring).

# Configure gpiozero to use the pigpio daemon for best stability on Pi 5.
try:
    # This line requires the 'pigpiod' daemon to be installed and running on the system.
    Device.pin_factory = PiGPIOFactory()
    print("Using PiGPIOFactory for stable GPIO control.")
except Exception as e:
    # This Warning will still appear if 'pigpiod' is not installed or running.
    print(f"Warning: Could not connect to pigpio daemon. Falling back to default pin factory. Error: {e}")

# --- GPIO Pin Definitions (BCM numbering) ---
STROBE_PIN = 17 # IN1 on Relay -> GPIO 17 (Strobe)
SIREN_PIN = 27  # IN2 on Relay -> GPIO 27 (Siren)
ACKNOWLEDGE_PIN = 24 # Button -> GPIO 24

# --- Initialize Relays and Button ---
try:
    # Relays: active_high=False makes .on() send a LOW signal (0V) to activate.
    strobe_relay = LED(STROBE_PIN, active_high=False)
    siren_relay = LED(SIREN_PIN, active_high=False)
    
    # Button: pull_up=True ensures the pin is HIGH when not pressed, 
    # and LOW when pressed (connected to GND).
    acknowledge_button = Button(ACKNOWLEDGE_PIN, pull_up=True)
    
    # Ensure relays start OFF (sends HIGH signal to both pins)
    strobe_relay.off()
    siren_relay.off()
    
    print("Initialized Hardware: Relays (17, 27) and Acknowledge Button (24).")

except Exception as e:
    print(f"!!! CRITICAL ERROR: Failed to initialize hardware. Check wiring or 'pigpiod' status.")
    print(f"Error details: {e}")
    sys.exit(1)


def deactivate_alert():
    """Stops the strobe and siren and exits the program."""
    print("\n--- Acknowledge Button Pressed ---")
    strobe_relay.off()
    siren_relay.off()
    print("Siren and Strobe DEACTIVATED.")
    return
    
    # Cleanup will run automatically via atexit, but we can call sys.exit() 
    # to stop the main loop immediately.
    # sys.exit(0)
    # return


def cleanup():
    """Ensures all relays are turned OFF and resources are released on exit."""
    print("\n--- Cleaning up resources ---")
    try:
        if 'strobe_relay' in globals() and strobe_relay.is_active:
            strobe_relay.off()
            strobe_relay.close()
        
        if 'siren_relay' in globals() and siren_relay.is_active:
            siren_relay.off()
            siren_relay.close()
            
        if 'acknowledge_button' in globals():
            acknowledge_button.close()
            
        print("GPIO resources safely closed.")
            
    except Exception as e:
        print(f"Error during cleanup: {e}")

# Register the cleanup function to run automatically when the script exits
# atexit.register(cleanup)


def main_alert_loop():
    """
    Starts the alert immediately and waits for the button press.
    """
    print("\n=================================================================")
    print("     AGAPAI Alert System Initialized - ALERT TRIGGERED           ")
    print("=================================================================")
    
    # 1. Automatic Trigger (Strobe and Siren ON)
    strobe_relay.on() 
    siren_relay.on()
    print("!!! SIREN AND STROBE ACTIVATED !!!")
    print(f"Waiting for Acknowledge Button (GPIO {ACKNOWLEDGE_PIN}) press to stop...")

    # 2. Set up Button Listener
    # When the button is pressed (pin goes LOW), call the deactivate_alert function.
    acknowledge_button.when_pressed = deactivate_alert

    # 3. Pause
    # The 'pause()' function keeps the script alive indefinitely, allowing
    # the gpiozero event handler (when_pressed) to wait for input.
    try:
        # pause()
        return
    except Exception as e:
        # Handles any general exception during the pause state
        print(f"An error occurred in the main loop: {e}")


if __name__ == "__main__":
    try:
        main_alert_loop()
    except SystemExit:
        # Expected exit when deactivate_alert is called
        pass
    except KeyboardInterrupt:
        # Handles CTRL+C termination
        print("\nProgram manually terminated by user (Ctrl+C).")
    # Cleanup is guaranteed to run via atexit.