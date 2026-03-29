# How to Connect the ESP32 to NILETRON

The ESP32 and the web app talk through your **backend API**. The ESP32 polls the API every 2 seconds and sets its GPIO pins (lights, fan) to match what you set in the app.

---

## What you need

- ESP32 dev board (with WiFi)
- USB cable
- **Same Wi‑Fi network** for: your PC (running the backend), your phone/browser (web app), and the ESP32
- Optional: DC light + relay/MOSFET, DC fan (for a real demo)

---

## Step 1: Run the backend on your PC

The ESP32 will call your backend by **IP address**, not `localhost`.

```bash
cd backend
npm install
npm run dev
```

Backend runs at **http://localhost:4000**. Leave it running.

---

## Step 2: Get your PC’s IP address

The ESP32 must use your computer’s local IP so it can reach the API.

- **Windows:** `ipconfig` → look for “IPv4 Address” (e.g. `192.168.1.100`)
- **Mac/Linux:** `ifconfig` or “System Settings → Network” (e.g. `192.168.1.100`)

Use this IP in the next step (example: `http://192.168.1.100:4000`).

---

## Step 3: Register the board in the web app

1. Open the web app (e.g. http://localhost:3000).
2. Log in as **admin** (`admin@niletron.local` / `admin123`).
3. Go to **Admin → Boards**.
4. Click **Register board**.
5. Enter a **Board ID** (e.g. `ESP32_LIVING`). This name must match what you will put in the ESP32 code.
6. Enter a **Name** (e.g. “Living room board”) and save.
7. **Copy the secret key** that appears (you’ll use it once; the app may not show it again). Save it somewhere safe.

You now have:
- **Board ID:** e.g. `ESP32_LIVING`
- **Secret key:** long hex string

---

## Step 4: Configure the ESP32

1. Open **`esp32/include/config.h`** in your editor.

2. Set these to your own values:

| Setting          | What to put |
|------------------|-------------|
| `WIFI_SSID`      | Your Wi‑Fi name (2.4 GHz works best) |
| `WIFI_PASSWORD`  | Your Wi‑Fi password |
| `API_BASE_URL`   | `http://YOUR_PC_IP:4000` (e.g. `http://192.168.1.100:4000`) – **no** trailing slash |
| `BOARD_ID`       | **Exactly** the same as in the app (e.g. `ESP32_LIVING`) |
| `SECRET_KEY`     | The secret key you copied from Admin → Boards |

Example:

```c
#define WIFI_SSID     "MyHomeWiFi"
#define WIFI_PASSWORD "mypassword123"
#define API_BASE_URL  "http://192.168.1.100:4000"
#define BOARD_ID      "ESP32_LIVING"
#define SECRET_KEY    "a1b2c3d4e5f6..."
```

3. Save the file.

---

## Step 5: Add a room and devices in the app

1. **Admin → Rooms** → **Add room** (e.g. “Living room”).
2. **Admin → Devices** → **Add device** for each output:
   - **Name:** e.g. “Living room light”
   - **Room:** the room you created
   - **Board:** the board you registered (e.g. “Living room board”)
   - **GPIO Pin:** must be one of **2, 4, 5, 12, 13, 14** (defined in the ESP32 code)
   - **Type:** Light or Fan

Example:

| Name            | Room        | Board            | Pin | Type  |
|-----------------|-------------|------------------|-----|-------|
| Living room light | Living room | Living room board | 2   | Light |
| Living room fan   | Living room | Living room board | 5   | Fan   |

The **Pin** number is the GPIO you will wire to your light/fan (or relay).

---

## Step 6: Flash the ESP32

1. Install **PlatformIO** (VS Code extension: “PlatformIO IDE”, or CLI: `pip install platformio`).
2. Connect the ESP32 with USB.
3. In a terminal:

```bash
cd esp32
pio run -t upload
```

4. Open the serial monitor to see logs (and confirm WiFi + API):

```bash
pio device monitor -b 115200
```

You should see “Connecting to WiFi”, then “IP: 192.168.x.x”, and no “API error” if the URL and secret are correct.

---

## Step 7: Test from the app

1. In the web app, open **Dashboard** → open the room you created.
2. Toggle the **light** (ON/OFF) and move the **fan** slider.
3. The ESP32 polls the API every 2 seconds and updates the GPIOs. Your light/fan should follow the app (if wired to the correct pins).

---

## Wiring (optional, for real hardware)

- **Light:** GPIO → resistor → base of transistor (or gate of MOSFET); relay or transistor switches the DC light.
- **Fan:** GPIO (PWM) → same idea; PWM controls fan speed (e.g. 0 = off, 255 = full).

Use the **same GPIO numbers** you set in Admin → Devices (e.g. 2 for light, 5 for fan). Pins 2, 4, 5, 12, 13, 14 are set up for output in the code.

---

## Troubleshooting

| Problem | What to check |
|--------|----------------|
| **Upload: “Failed to communicate with the flash chip” / “The chip stopped responding”** | 1) Use a **short USB cable** and a direct USB port (no hub). 2) Put the ESP32 in **boot mode**: hold **BOOT** (or **IO0**), press **EN** (reset), release **EN**, then release **BOOT** after upload starts. 3) Erase flash then upload: `pio run -t erase` then `pio run -t upload`. 4) If it still fails, try another cable or USB port; some boards have a weak flash or power issue. |
| “WiFi failed” | SSID/password in `config.h`; use 2.4 GHz network. |
| “API error: -1” or no response | ESP32 can’t reach the PC: same Wi‑Fi, correct `API_BASE_URL` (PC’s IP, port 4000), backend running, firewall allows port 4000. |
| “API error: 401” | Wrong `BOARD_ID` or `SECRET_KEY`; must match Admin → Boards exactly. |
| No change on GPIO | In the app, device must be on the **same board** and **same pin** as in the code; wait ~2 seconds for next poll. |
| Backend not reachable from ESP32 | On PC, allow port 4000 in firewall, or temporarily disable firewall for testing. |

---

## Summary

1. Backend running on PC.
2. Get PC IP; use `http://PC_IP:4000` in ESP32 `config.h`.
3. In app: Admin → Boards → register board, copy secret key.
4. In `config.h`: WiFi, `API_BASE_URL`, `BOARD_ID`, `SECRET_KEY`.
5. In app: Admin → Rooms and Devices (board + pin 2, 4, 5, 12, 13, or 14).
6. Flash ESP32 with PlatformIO; open serial monitor.
7. Control the room in the app; ESP32 follows within ~2 seconds.
