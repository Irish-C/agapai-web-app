import time
from threading import Timer
from gpiozero import OutputDevice, Button

class HardwareAlertSystem:
    def __init__(self, socketio):
        self.socketio = socketio
        
        # --- GPIO CONFIGURATION (Raspberry Pi 5) ---
        # Strobe: GPIO 17 | Siren: GPIO 24 | Button: GPIO 27
        # active_high=False is standard for Relay Modules. 
        # If your relay triggers immediately on boot, change to True.
        # self.strobe = OutputDevice(17, active_high=False, initial_value=False)
        # self.siren = OutputDevice(24, active_high=False, initial_value=False)
        
        # # Button: GPIO 27 (pull_up=True means connecting to GND triggers it)
        # self.ack_button = Button(27, pull_up=True, bounce_time=0.1)
        # self.ack_button.when_pressed = self.handle_button_press

        # --- STATE FLAGS ---
        self.is_alarming = False   # Is the siren currently loud?
        self.is_snoozed = False    # Are we in the 90-second timeout?
        self.snooze_duration = 90  # Seconds

    def trigger_alert(self, location="Unknown"):
        """
        Called when the Vision System detects a fall.
        """
        # 1. CHECK: Is the system currently snoozed?
        if self.is_snoozed:
            print(f"[HARDWARE] Fall detected at {location}, but system is SNOOZED (Patient being attended to).")
            return

        # # 2. CHECK: Is it already ringing?
        # if self.is_alarming:
        #     print(f"[HARDWARE] Fall detected at {location}, but system is ALREADY ALARMING.")
        #     return

        # 3. ACTIVATE ALARM
        print(f"[HARDWARE] 🚨 FALL DETECTED at {location}! Activating System.")
        self.is_alarming = True
        
        # # Turn ON Physical Hardware
        # self.strobe.on()
        # self.siren.on()

        # Emit WebSocket event to Frontend (Triggers the Red Popup)
        self.socketio.emit('incident_alert', {
            'type': 'Fall Detected',
            'location': location,
            'timestamp': int(time.time())
        })

    def handle_button_press(self):
        """
        Callback for when the physical button (GPIO 27) is pressed.
        """
        if self.is_alarming:
            print("[HARDWARE] ✅ Button Pressed. Silencing Alarm & Starting Snooze.")
            self.stop_alarm()
            self.start_snooze()
        else:
            print("[HARDWARE] Button pressed, but no active alarm.")

    def stop_alarm(self):
        """Turns off the physical sirens/strobes."""
        # self.strobe.off()
        # self.siren.off()
        self.is_alarming = False
        
        # Notify frontend to close the popup (optional, or let user close it manually)
        self.socketio.emit('alert_acknowledged', {'status': 'acknowledged'})

    def start_snooze(self):
        """Prevents new alarms for 90 seconds."""
        print(f"[HARDWARE] 💤 Snoozing alerts for {self.snooze_duration} seconds...")
        self.is_snoozed = True
        
        # Start a background timer to auto-rearm
        t = Timer(self.snooze_duration, self.rearm_system)
        t.start()

    def rearm_system(self):
        """Called automatically after snooze timer ends."""
        self.is_snoozed = False
        print("[HARDWARE] 🛡️ Snooze ended. System RE-ARMED and ready for detection.")