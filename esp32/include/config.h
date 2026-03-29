#ifndef CONFIG_H
#define CONFIG_H

// WiFi
#define WIFI_SSID     "MTN_4G_C378B4"
#define WIFI_PASSWORD "18914264"

// API: base URL of your backend (no trailing slash). Render in production; use LAN IP for offline dev.
#define API_BASE_URL  "https://niletron1-0.onrender.com"

// Board identity: must match the board_id and secret_key registered in the web app (Admin → Boards).
#define BOARD_ID      "NILE_SEN_020"
#define SECRET_KEY    "41b54ce01fc4ba3e6f50d8488eea1a270614e7e980ea2ca4"

// How often to poll the API for device state (milliseconds).
#define POLL_INTERVAL_MS  2000

#endif
