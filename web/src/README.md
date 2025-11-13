변수명 / 함수명 규칙

네이밍은 전부 스네이크케이스(user_id, sensor_id, rain_time, voice_msg)


메서드 엔드 포인트 (프런트앤드-백앤드)
| 메서드/경로              | 요청           | 응답             | 설명       
| ------------------------ | -------------- | ---------------- | -------- 
| `POST /api/auth/signup`  | `{email, pw}`  | `{user_id}`      | 회원가입     
| `POST /api/auth/login`   | `{email, pw}`  | `{token}`        | 로그인(JWT) 
| `GET /api/users/me`      | (JWT)          | 사용자 프로필    | 내 정보     
| `PUT /api/users/address` | `{lat, lon}`   | `{ok, lat, lon}` | 좌표 저장    
| `POST /api/users/alarms` | `{alarm_text}` | `{alarm_id}`     | 알람 추가    
| `GET /api/users/alarms`  | -              | `{alarms:[...]}` | 알람 목록    
| `GET /api/bins/status`   | `?device_id=`  | `{bin}`          | 우산함 상태   


인증·보안 관련
| 변수명             | 타입         | 어디서→어디로         | 용도/설명                      |
| --------------- | ---------- | --------------- | -------------------------- |
| `token`         | string     | 프런트 → 백엔드(헤더)   | JWT 액세스 토큰                 |
| `Authorization` | string(헤더) | 프런트 → 백엔드       | `Bearer ${token}` 형태       |
| `secret`        | string     | 프런트/ESP32 → 백엔드 | 디바이스/개발 단계 공유키(운영 시 대체 권장) |
| `email`         | string     | 프런트 → 백엔드       | 회원가입/로그인                   |
| `pw`            | string     | 프런트 → 백엔드       | 회원가입/로그인                   |


 REST(프런트 ↔ 백엔드) 요청/응답 변수

요청 바디/쿼리 (프런트 → 백엔드)
| 엔드포인트                              | 필드                                                |
| ---------------------------------- | ------------------------------------------------- |
| `POST /api/auth/signup`            | `email`, `pw`                                     |
| `POST /api/auth/login`             | `email`, `pw`                                     |
| `PUT /api/users/address`           | `lat`, `lon`                                      |
| `POST /api/users/alarms`           | `alarm_text`                                      |
| `POST /api/devices`                | `user_id`, `type`, `name`, `secret`               |
| `POST /api/bins/update` *(테스트/시뮬)* | `device_id`, `remain`, `cap`, `is_open`, `secret` |
| `GET /api/bins/status`             | `device_id` *(query)*                             |




응답(백엔드 → 프런트)
| 상황      | 필드(예시)                                                |
| ------- | ----------------------------------------------------- |
| 로그인     | `token`                                               |
| 내 정보    | `id`, `email`, `lat`, `lon`                           |
| 알람 목록   | `alarms: [{id, user_id, text}, ...]`                  |
| 우산함 상태  | `bin: { device_id, remain, cap, is_open, updatedAt }` |
| 디바이스 생성 | `device_id`                                           |
| 공통      | `message`, `ok`                                       |


공통 키(도메인/DB 스키마 기반)
| 변수명          | 타입           | 어디서→어디로                 | 용도/설명                                           |
| ------------ | ------------ | ----------------------- | ----------------------------------------------- |
| `user_id`    | int          | 프런트/ESP32 → 백엔드         | 사용자 식별자(권한/좌표/알람 조회)                            |
| `device_id`  | int          | 프런트/ESP32 ↔ 백엔드         | 디바이스 식별자(우산함/스피커 등 공통)                          |
| `sensor_id`  | int          | ESP32(door) → 백엔드       | 도어/근접 센서 식별자                                    |
| `lat`        | number       | 프런트 → 백엔드               | 사용자 주소 위도(기상조회 입력)                              |
| `lon`        | number       | 프런트 → 백엔드               | 사용자 주소 경도(기상조회 입력)                              |
| `remain`     | int          | ESP32(bin) → 백엔드        | 우산함 남은 우산 개수                                    |
| `cap`        | int          | ESP32(bin) → 백엔드        | 우산함 최대 수용량                                      |
| `is_open`    | boolean      | ESP32(bin) → 백엔드        | 우산함 문 열림 상태(센서 보고값)                             |
| `alarm_text` | string       | 프런트 → 백엔드               | 개인화 알람 항목 텍스트(예: “차키”)                          |
| `name`       | string       | 프런트 → 백엔드               | 디바이스 표시 이름                                      |
| `type`       | string(enum) | 프런트 → 백엔드 / 백엔드 → ESP32 | 디바이스 타입: `DOOR_SENSOR` `UMBRELLA_BIN` `SPEAKER` |