from gpiozero import OutputDevice, Button
import time

class HardwareAlertSystem:
    def __init__(self, socketio):
        self.socketio = socketio
        
        # --- GPIO CONFIGURATION (Raspberry Pi 5) ---
        # Strobe: GPIO 17 
        # Siren:  GPIO 24 (CHANGED from 27 to avoid conflict with Button)
        # Button: GPIO 27
        
        # active_high=False is standard for Relay Modules. 
        # If your relay triggers immediately on boot (reverse logic), change to True.
        self.strobe = OutputDevice(17, active_high=False, initial_value=False)
        self.siren = OutputDevice(24, active_high=False, initial_value=False)
        
        # Button: GPIO 27 (pull_up=True means connecting Pin 27 to GND triggers it)
        self.ack_button = Button(27, pull_up=True, bounce_time=0.1)
        self.ack_button.when_pressed = self.handle_button_press
        
        print(f"✅ Hardware Manager Initialized: Strobe(17), Siren(24), Button(27)")

        # --- STATE FLAGS ---
        self.is_alarming = False   # Is the siren currently loud?
        self.is_snoozed = False    # Are we in the 90-second timeout?
        self.snooze_duration = 90  # Seconds

    def trigger_alert(self, location="Unknown"):
        """
        Called when the Vision System (Camera Script) sends a POST request.
        """
        # 1. CHECK: Is the system currently snoozed?
        if self.is_snoozed:
            print(f"[HARDWARE] 💤 Fall detected at {location}, but system is SNOOZED.")
            return

        # 2. CHECK: Is it already ringing?
        if self.is_alarming:
            print(f"[HARDWARE] ⚠️ Fall detected at {location}, but system is ALREADY ALARMING.")
            return

        # 3. ACTIVATE ALARM
        print(f"[HARDWARE] 🚨 FALL DETECTED at {location}! Activating Physical Alarm.")
        self.is_alarming = True
        
        # Turn ON Physical Hardware
        self.strobe.on()
        self.siren.on()

        # Emit WebSocket event to Frontend (Triggers the Red Popup on Dashboard)
        self.socketio.emit('incident_alert', {
            'type': 'Fall Detected',
            'location': location,
            'timestamp': int(time.time())
        })

    def handle_button_press(self):
        """
        Callback for when the PHYSICAL button (GPIO 27) is pressed.
        """
        if self.is_alarming:
            print("[HARDWARE] 🔘 Physical Button Pressed. Silencing Alarm.")
            self._execute_silence_sequence()
        else:
            print("[HARDWARE] 🔘 Button pressed, but no active alarm (Test/Ignored).")

    def handle_remote_silence(self):
        """
        Called when the WEB DASHBOARD 'Acknowledge' button is clicked.
        """
        if self.is_alarming:
            print("[HARDWARE] 💻 Web Interface Requested Silence.")
            self._execute_silence_sequence()
            return True
        else:
            print("[HARDWARE] 💻 Web Silence requested, but alarm was not active.")
            return False

    def _execute_silence_sequence(self):
        """
        Internal helper: Stops hardware AND starts the snooze timer.
        Shared by both Physical Button and Web Interface.
        """
        # 1. Stop the Noise/Light immediately
        self.stop_alarm()
        
        # 2. Notify frontend that alarm is cleared
        self.socketio.emit('alert_acknowledged', {'status': 'acknowledged'})
        
        # 3. Start the safe snooze timer (Background Task)
        self.socketio.start_background_task(self.start_snooze_timer)

    def stop_alarm(self):
        """Turns off the physical sirens/strobes."""
        self.strobe.off()
        self.siren.off()
        self.is_alarming = False

    def start_snooze_timer(self):
        """
        Runs in a background thread managed by SocketIO/Eventlet.
        Safely sleeps for 90 seconds, then re-arms the system.
        """
        print(f"[HARDWARE] 💤 Snoozing alerts for {self.snooze_duration} seconds...")
        self.is_snoozed = True
        
        # Use socketio.sleep() which is non-blocking for the server
        self.socketio.sleep(self.snooze_duration)
        
        self.is_snoozed = False
        print("[HARDWARE] 🛡️ Snooze ended. System RE-ARMED and ready for detection.")