#include "MQ7.h"
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>


#define SCL 1
#define SDA 2

#define MQ7PIN 4

#define DHT11PIN 2
#define DHTTYPE DHT11

#define Voltage_Resolution 3.3
#define ADC_Bit_Resolution 12
#define RatioMQ2CleanAir 9.83
#define MQ2PIN 3

#define PLACAMQ2 "ESP32-C3"
#define SENSOR_HUMO "MQ-2"

#define BUZZERPIN 5

LiquidCrystal_I2C lcd(0x27, 16, 2);

DHT dht11(DHT11PIN, DHTTYPE);

MQ7 mq7(MQ7PIN, 3.3);

MQUnifiedsensor MQ2(PLACAMQ2, Voltage_Resolution, ADC_Bit_Resolution, MQ2PIN, SENSOR_HUMO);

float ppm_a_mgm3(float ppm, float masaMolar, float tempCelsius) {
    float t = tempCelsius + 273.15;
    float R = 8.314;
    float mgm3 =  ppm * masaMolar / (R * t);
    return mgm3;
}

void setup() { 

    Serial.begin(115200);

    pinMode(BUZZERPIN, OUTPUT);

    // ANALOG READ PARA ESP32
    analogReadResolution(12);
    analogSetAttenuation(ADC_11db);
    //

    Wire.begin(SDA, SCL);

    // MQ2 CALIBRACIÓN E INICIALIZACIÓN
    MQ2.setRegressionMethod(1);
    MQ2.setA(574.25); MQ2.setB(-2.222);
    MQ2.init();
    float calcR0 = 0;
    for (int i = 1; i <= 10; i++) {
        MQ2.update();
        calcR0 += MQ2.calibrate(RatioMQ2CleanAir);
        Serial.print(".");
        delay(200);
    }
    MQ2.setR0(calcR0 / 10);
    Serial.println("MQ2 CALIBRADO");
    MQ2.serialDebug(true);
    //

    lcd.init();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("Hola ESP32-C3!");
}

void loop() {
    float humedad = dht11.readHumidity();
    float temperatura = dht11.readTemperature();

    MQ2.update();
    float medicionHumo = ppm_a_mgm3(MQ2.readSensor(false, 0.0), 44.0, temperatura);



    delay(50);
}
