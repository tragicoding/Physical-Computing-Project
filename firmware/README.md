 변수명 / 함수명 규칙

네이밍은 전부 스네이크케이스(user_id, sensor_id, rain_time, voice_msg)
 
 
 메서드 앤드 포인트 (아두이노-백앤드)

| 방향       | 토픽                      | 페이로드(JSON)                        | 설명           
| ---------- | ------------------------- | ------------------------------------- | ------------ 
| ESP → Node | `door/{sensor_id}/sensed` | `{ user_id, sensor_id, ts }`          | 근접/도어 감지 이벤트 
| ESP → Node | `bin/{device_id}/status`  | `{ device_id, remain, cap, is_open }` | 우산함 상태       
| Node → ESP | `speaker/{device_id}/cmd` | `{ type: 'tts', text: voice_msg }`    | 음성 안내        
| Node → ESP | `box/{device_id}/cmd`     | `{ act: 'open', close_in: 10000 }`    | 문 개폐 명령(선택)  
 
 
 
 MQTT(ESP32 ↔ 브로커 ↔ 백엔드) 페이로드/토픽 변수

ESP32 → 백엔드 (Publish)
| 토픽                        | 페이로드(JSON)                                    | 설명         
| ------------------------- | --------------------------------------------- | ---------- 
| `door/{sensor_id}/sensed` | `{ "user_id", "sensor_id", "ts" }`            | 센서 트리거 이벤트 
| `bin/{device_id}/status`  | `{ "device_id", "remain", "cap", "is_open" }` | 우산함 상태 보고  


백엔드 → ESP32 (Publish)
| 토픽                           | 페이로드(JSON)                             | 설명                
| ---------------------------- | -------------------------------------- | ----------------- 
| `speaker/{device_id}/cmd`    | `{ "type": "tts", "text": voice_msg }` | 스피커 TTS 명령        
| `box/{device_id}/cmd` *(옵션)* | `{ "act": "open", "close_in": 10000 }` | 우산함 문 개폐/자동 닫힘 예약 



백엔드 내부에서 계산/생성되어 외부로 전달되는 변수
| 변수명         | 타입          | 어디서 생성            | 어디에 전달                               
| ----------- | ----------- | ----------------- | ------------------------------------ 
| `rain_time` | string|null | 백엔드(weather_svc)  | 프런트 응답, TTS 문구 생성에 사용                
| `voice_msg` | string      | 백엔드(weather_ctrl) | ESP32 스피커(`speaker/{device_id}/cmd`) 
| `alarms`    | string[]    | 백엔드(user_ctrl)    | 프런트 응답 / TTS 문구 꼬리말용                 


환경변수(.env)
| 변수명             | 용도                                                 
| --------------- | -------------------------------------------------- 
| `PORT`          | 백엔드 포트                                             
| `CORS_ORIGIN`   | 프런트 도메인 허용                                         
| `DATABASE_URL`  | MySQL 접속 URL                                       
| `JWT_SECRET`    | JWT 서명 시크릿                                         
| `DEVICE_SECRET` | 디바이스 공유키(개발 단계)                                    
| `MQTT_HOST`     | MQTT 브로커 주소(`mqtt://host:1883` 또는 `mqtts://:8883`) 

아두이노/ESP32 (MQTT 연결—예시)
// firmware/.../main.ino
// #include <WiFi.h>
// #include <PubSubClient.h>
// 사용 변수: user_id, sensor_id, device_id, remain, cap, is_open, ts
// 브로커/토픽: MQTT_HOST, door/{sensor_id}/sensed, bin/{device_id}/status, speaker/{device_id}/cmd, box/{device_id}/cmd



공통 키(도메인/DB 스키마 기반)
| 변수명          | 타입           | 어디서→어디로                 | 용도/설명                                           
| ------------ | ------------ | ----------------------- | ----------------------------------------------- |
| `user_id`    | int          | 프런트/ESP32 → 백엔드         | 사용자 식별자(권한/좌표/알람 조회)                            
| `device_id`  | int          | 프런트/ESP32 ↔ 백엔드         | 디바이스 식별자(우산함/스피커 등 공통)                          
| `sensor_id`  | int          | ESP32(door) → 백엔드       | 도어/근접 센서 식별자                                    
| `lat`        | number       | 프런트 → 백엔드               | 사용자 주소 위도(기상조회 입력)                              
| `lon`        | number       | 프런트 → 백엔드               | 사용자 주소 경도(기상조회 입력)                              
| `remain`     | int          | ESP32(bin) → 백엔드        | 우산함 남은 우산 개수                                    
| `cap`        | int          | ESP32(bin) → 백엔드        | 우산함 최대 수용량                                      
| `is_open`    | boolean      | ESP32(bin) → 백엔드        | 우산함 문 열림 상태(센서 보고값)                             
| `alarm_text` | string       | 프런트 → 백엔드               | 개인화 알람 항목 텍스트(예: “차키”)                          
| `name`       | string       | 프런트 → 백엔드               | 디바이스 표시 이름                                      
| `type`       | string(enum) | 프런트 → 백엔드 / 백엔드 → ESP32 | 디바이스 타입: `DOOR_SENSOR` `UMBRELLA_BIN` `SPEAKER` 