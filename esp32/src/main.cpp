/**
 * NILETRON - ESP32 Smart Home Controller
 * Polls the backend API for device state and drives GPIO (lights + fan PWM).
 * DC lights: GPIO HIGH/LOW or PWM for dimming.
 * DC fan: PWM 0-255 for speed.
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#include "config.h"

// Output pins (must be before fetchAndApplyState)
const int kOutputPins[] = { 2, 4, 5, 12, 13, 14 };
const int kOutputPinCount = sizeof(kOutputPins) / sizeof(kOutputPins[0]);

// ---------------------------------------------------------------------------
// WiFi
// ---------------------------------------------------------------------------
void setupWiFi() {
  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  delay(200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting");
  int attempts = 0;
  const int maxAttempts = 80;  // 80 * 500ms = 40 seconds
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    int st = WiFi.status();
    Serial.printf("WiFi failed. status=%d ", st);
    // WL_NO_SSID_AVAIL=1 (no network with this name), WL_CONNECT_FAILED=4 (e.g. wrong password)
    if (st == 1) Serial.println("(SSID not found - check name, use 2.4GHz)");
    else if (st == 4) Serial.println("(connect failed - wrong password or router rejected)");
    else Serial.println("(check SSID/password, 2.4GHz only)");
    return;
  }
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// ---------------------------------------------------------------------------
// API: GET /api/boards/state?board_id=...&secret_key=...
// Response: { "2": { "type": "light", "value": 255 }, "5": { "type": "fan", "value": 128 } }
// ---------------------------------------------------------------------------
void fetchAndApplyState() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/boards/state?board_id=" + String(BOARD_ID) + "&secret_key=" + String(SECRET_KEY);
  http.begin(url);
  int code = http.GET();

  if (code != 200) {
    Serial.printf("API error: %d\n", code);
    http.end();
    return;
  }

  String payload = http.getString();
  http.end();

  DynamicJsonDocument doc(1024);
  DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    Serial.printf("JSON error: %s\n", err.c_str());
    return;
  }

  JsonObject root = doc.as<JsonObject>();
  for (JsonPair kv : root) {
    int pin = atoi(kv.key().c_str());
    if (pin < 0 || pin > 39) continue;

    // Find channel for this pin (must be in kOutputPins)
    int ch = -1;
    for (int i = 0; i < kOutputPinCount; i++) {
      if (kOutputPins[i] == pin) { ch = i; break; }
    }
    if (ch < 0) continue;

    JsonObject obj = kv.value().as<JsonObject>();
    int value = obj["value"] | 0;
    value = constrain(value, 0, 255);
    ledcWrite(ch, value);
  }
}

// ---------------------------------------------------------------------------
// Output pins: lights and fan both use PWM (LEDC). Pins defined above.
// ---------------------------------------------------------------------------
void setupPins() {
  for (int i = 0; i < kOutputPinCount; i++) {
    int pin = kOutputPins[i];
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    ledcSetup(i, 5000, 8);   // channel 0..5, 5 kHz, 8-bit
    ledcAttachPin(pin, i);
    ledcWrite(i, 0);
  }
}

// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("NILETRON ESP32");

  setupPins();
  setupWiFi();
}

unsigned long lastPoll = 0;

void loop() {
  if (millis() - lastPoll >= POLL_INTERVAL_MS) {
    lastPoll = millis();
    fetchAndApplyState();
  }
  delay(50);
}
