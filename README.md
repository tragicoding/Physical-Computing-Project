# Physical-Computing-Project

A collaborative code space for physical computing project developers.

**Chung-Ang University, Art and Technology**
**Final Project for Physical Computing**

- Hwang Ha-rin (황하린)
- Kim Jin-seo (김진서)
- Kim Kang-ryun (김강륜)

---

### **Team Roles**

- **Kim Kang-ryun (김강륜):** Front-end Developer / UI Architect
- **Kim Jin-seo (김진서):** Back-end Developer / Software Architect
- **Hwang Ha-rin (황하린):** Hardware Engineer / Model Architect

---

### **Git Branch Strategy**

- `main`: Final version for deployment.
- `staging`: Pre-release version for demonstration.
- `dev`: Integration branch for developed features.
- `jinseo`: Backend development branch.
- `kangryun`: Frontend development branch.
- `harin`: Hardware development branch.

#### **How to connect to Git:**
```bash
# 1. Clone the repository
git clone https://github.com/tragicoding/Physical-Computing-Project.git

# 2. Navigate to the project directory
cd Physical-Computing-Project

# 3. Fetch all branches
git fetch

# 4. Check out your personal branch (e.g., kangryun or harin)
git checkout kangryun
```
> **Note:** Please work on your personal branch. I will merge changes into `dev`. Pull from `dev` to get the latest integrated updates. **Do not push directly to `main`**.

---

### **Project Guidelines**

- **Commit Messages:** When pushing or committing, please write clear and descriptive commit messages detailing your changes.
- **Dependencies:** If you add new libraries or packages for frontend, backend, or Arduino, please share the updates with the team.
- **Directory Structure:** The directory structure is flexible. Feel free to create files and folders within your designated part of the project.
- **API Documentation:** Refer to `docs/API.md` for all API endpoints.
- **Setup Guide:** See `docs/SETUP.md` for development environment setup and instructions.
- **Terminal:** On Windows, `npm` commands may be blocked by PowerShell's security policy. It is recommended to use **CMD** or **Git Bash**.
- **Installation:** To install dependencies, run `npm install` in the relevant directory (e.g., `/server`).
- **Part-specific READMEs:** Check the `README.md` files in `/web`, `/server`, and `/firmware` for specific details on variables and endpoints.
- **`.gitignore`:** `node_modules` and `.env` files are ignored. `.env` configurations should be coordinated personally. `node_modules` is excluded due to its size and can be regenerated with `npm install`.

---

### **Developer Workflow**

1.  **Clone Repository:**
    ```bash
    git clone https://github.com/tragicoding/Physical-Computing-Project.git
    ```
2.  **Install NPM Modules:**
    ```bash
    cd server
    npm install
    ```
3.  **Run the Server:**
    ```bash
    npm run dev
    ```

### **Docker**
The project uses Docker for `mysql` and `mqtt`. The current implementation with port forwarding might have security/stability risks that need to be addressed later.

---

## **1. System Architecture**

```
Physical-Computing-Project/
├─ server/                                      # Backend Root (Express App)
│  ├─ prisma/
│  │  └─ schema.prisma                          # DB Schema (User, Device, UmbrellaBin, Alarm, etc.)
│  ├─ src/
│  │  ├─ config/
│  │  │  ├─ prisma.js                           # PrismaClient singleton
│  │  │  └─ mqtt.js                             # MQTT Client (connect, subscribe, publish)
│  │  ├─ middleware/
│  │  │  ├─ auth.js                             # JWT and device secret key authentication
│  │  │  ├─ validate.js                         # Joi validation middleware
│  │  │  └─ error_handler.js                    # Global error handler
│  │  ├─ controllers/
│  │  │  ├─ auth_ctrl.js                        # Signup/Login (JWT issuance)
│  │  │  ├─ user_ctrl.js                        # User info, coordinates, alarm CRUD
│  │  │  ├─ device_ctrl.js                      # Device registration/heartbeat
│  │  │  ├─ bin_ctrl.js                         # Umbrella bin state upsert/query
│  │  │  └─ weather_ctrl.js                     # Door sensor event -> Weather forecast -> TTS/Door command
│  │  ├─ services/
│  │  │  ├─ weather_svc.js                      # Weather API integration
│  │  │  └─ tts_svc.js                          # Send commands to speaker (MQTT publish)
│  │  ├─ routes/
│  │  │  ├─ auth_routes.js                      # /api/auth/*
│  │  │  ├─ user_routes.js                      # /api/users/*
│  │  │  ├─ device_routes.js                    # /api/devices/*
│  │  │  ├─ bin_routes.js                       # /api/bins/*
│  │  │  └─ weather_routes.js                   # /api/weather/*
│  │  └─ utils/
│  │     └─ logger.js                           # Winston logger
│  ├─ .env                                      # PORT, DB_URL, JWT_SECRET, etc.
│  ├─ package.json                              # Dependencies and scripts
│  └─ server.js                                 # App entry point
│
├─ web/                                         # Frontend (React/Vite)
│  └─ src/
│     └─ app.tsx                                # Example of backend REST calls
│
├─ firmware/                                    # ESP32 (Arduino)
│  ├─ door_sensor/door_sensor.ino               # MQTT publish
│  ├─ umbrella_bin/umbrella_bin.ino             # MQTT publish
│  └─ speaker_tts/speaker_tts.ino               # MQTT subscribe
│  
├─ deploy/
│  └─ docker-compose.yml                        # MySQL, Mosquitto, Adminer containers
│
└─ docs/
   ├─ API.md                                    # REST API specifications
   └─ SETUP.md                                  # Local setup guide
```

## **2. Architecture Overview**

This is a hybrid, event-driven system combining a traditional web architecture (React, Node.js, MySQL) with IoT devices (ESP32/Arduino) and an MQTT broker.

-   **Frontend ↔ Backend:** REST (HTTP/JSON)
-   **Device ↔ Backend:** MQTT (pub/sub)
-   **Backend ↔ DB:** Prisma ORM (MySQL)

## **3. Data Flow**

```
[React App]  <-- REST -->  [Node.js / Express]  <-- ORM -->  [MySQL]
                                  |
                            (MQTT Client)
                                  |
                                  v
                       [MQTT Broker (Mosquitto)]
                         /         |         \\
                        /          |          \\
[ESP32 door_sensor]  [ESP32 bin]  [ESP32 speaker]
     (publish)        (publish)      (subscribe)
```

-   **React:** Handles UI for login, dashboard, and alarm management.
-   **Express:** Manages authentication, business logic, weather data integration, and device command publishing.
-   **MySQL:** Persists user, device, umbrella bin, and alarm data.
-   **Mosquitto:** Collects device events and delivers commands with low latency.
-   **ESP32:** Publishes sensor events, reports umbrella bin status, and subscribes to speaker commands.

| Path           | Protocol        | Payload      | Purpose                            |
| :------------- | :-------------- | :----------- | :--------------------------------- |
| React ↔ Node   | REST(HTTP/JSON) | JWT, JSON    | Login, settings, status queries    |
| Node ↔ MySQL   | Prisma (ORM)    | SQL abstract | Data persistence                   |
| ESP32 ↔ Broker | MQTT (TCP/IP)   | JSON message | Publish events, subscribe to commands |
| Node ↔ Broker  | MQTT Client     | JSON message | Receive events, publish commands   |

## **4. Service Execution Example**

```
1. ESP32(door_sensor) --(publish: door/{sensor_id}/sensed {user_id, ...})--> MQTT Broker
2. MQTT Client(Node)  --(subscribe: door/+/sensed)----------------------> Receives event
3. Node(Decision)     -- Fetches user coordinates & bin status -> get_rain_time(lat, lon)
                      -- Creates voice_msg ("Rain expected at HH:MM...")
4. Node → ESP32(speaker) --(publish: speaker/{device_id}/cmd {type:'tts', ...})
5. Node → (Optional) ESP32(bin) --(publish: box/{device_id}/cmd {act:'open', ...})
6. React(App)         --(REST: GET /api/bins/status)-------------------> Reflects current status
```

## **5. API Endpoints (Frontend-Backend)**

| Method/Path              | Request Body   | Response         | Description        |
| :----------------------- | :------------- | :--------------- | :----------------- |
| `POST /api/auth/signup`  | `{email, pw}`  | `{user_id}`      | User Signup        |
| `POST /api/auth/login`   | `{email, pw}`  | `{token}`        | User Login (JWT)   |
| `GET /api/users/me`      | (JWT)          | User Profile     | Get My Info        |
| `PUT /api/users/address` | `{lat, lon}`   | `{ok, lat, lon}` | Save Coordinates   |
| `POST /api/users/alarms` | `{alarm_text}` | `{alarm_id}`     | Add Alarm          |
| `GET /api/users/alarms`  | -              | `{alarms:[...]}` | List Alarms        |
| `GET /api/bins/status`   | `?device_id=`  | `{bin}`          | Get Bin Status     |

## **6. MQTT Topics (Arduino-Backend)**

| Direction  | Topic                     | Payload (JSON)                        | Description                |
| :--------- | :------------------------ | :------------------------------------ | :------------------------- |
| ESP → Node | `door/{sensor_id}/sensed` | `{ user_id, sensor_id, ts }`          | Proximity/door sensor event|
| ESP → Node | `bin/{device_id}/status`  | `{ device_id, remain, cap, is_open }` | Umbrella bin status        |
| Node → ESP | `speaker/{device_id}/cmd` | `{ type: 'tts', text: voice_msg }`    | Voice notification command |
| Node → ESP | `box/{device_id}/cmd`     | `{ act: 'open', close_in: 10000 }`    | Open/close door command    |

## **7. File Dependencies (Summary)**

```
routes/*  ->  controllers/*  ->  services/*  ->  config/prisma.js (DB)
                                           ->  config/mqtt.js   (MQTT)
middleware/* - (Validation, Auth, Error Handling)
server.js  - (Bootstrap all modules)
```

## **8. Naming Conventions**

All naming follows **snake_case** (e.g., `user_id`, `rain_time`).

#### **A) Common Keys**
| Variable       | Type         | From → To                     | Description                               |
| :------------- | :----------- | :---------------------------- | :---------------------------------------- |
| `user_id`      | int          | Frontend/ESP32 → Backend      | User identifier                           |
| `device_id`    | int          | Frontend/ESP32 ↔ Backend      | Device identifier (bin, speaker, etc.)    |
| `sensor_id`    | int          | ESP32(door) → Backend         | Door/proximity sensor identifier          |
| `lat`, `lon`   | number       | Frontend → Backend            | User address coordinates for weather      |
| `remain`, `cap`| int          | ESP32(bin) → Backend          | Bin's remaining/capacity of umbrellas     |
| `is_open`      | boolean      | ESP32(bin) → Backend          | Bin's door status                         |
| `alarm_text`   | string       | Frontend → Backend            | Personalized alarm text (e.g., "Car keys")|
| `name`         | string       | Frontend → Backend            | Device display name                       |
| `type`         | string(enum) | Frontend → Backend/Node → ESP | `DOOR_SENSOR`, `UMBRELLA_BIN`, `SPEAKER`  |

#### **B) Auth & Security**
| Variable        | Type         | From → To              | Description                               |
| :-------------- | :----------- | :--------------------- | :---------------------------------------- |
| `token`         | string       | Frontend → Backend(Header) | JWT access token                          |
| `Authorization` | string(Header) | Frontend → Backend     | `Bearer ${token}` format                  |
| `secret`        | string       | Frontend/ESP32 → Backend | Shared secret for devices (dev stage)     |
| `email`, `pw`   | string       | Frontend → Backend     | Credentials for signup/login              |

#### **C) REST Request/Response Variables**
**Request Body/Query (Frontend → Backend)**
| Endpoint                   | Fields                                            |
| :------------------------- | :------------------------------------------------ |
| `POST /api/auth/signup`    | `email`, `pw`                                     |
| `POST /api/auth/login`     | `email`, `pw`                                     |
| `PUT /api/users/address`   | `lat`, `lon`                                      |
| `POST /api/users/alarms`   | `alarm_text`                                      |
| `POST /api/devices`        | `user_id`, `type`, `name`, `secret`               |
| `POST /api/bins/update`    | `device_id`, `remain`, `cap`, `is_open`, `secret` |
| `GET /api/bins/status`     | `device_id` (query)                               |

**Response (Backend → Frontend)**
| Context       | Example Fields                                        |
| :------------ | :---------------------------------------------------- |
| Login         | `token`                                               |
| My Info       | `id`, `email`, `lat`, `lon`                           |
| Alarm List    | `alarms: [{id, user_id, text}, ...]`                  |
| Bin Status    | `bin: { device_id, remain, cap, is_open, updatedAt }` |
| Device Create | `device_id`                                           |
| Common        | `message`, `ok`                                       |

#### **D) MQTT Payload/Topic Variables**
**ESP32 → Backend (Publish)**
| Topic                     | Payload (JSON)                                | Description         |
| :------------------------ | :-------------------------------------------- | :------------------ |
| `door/{sensor_id}/sensed` | `{ "user_id", "sensor_id", "ts" }`            | Sensor trigger event|
| `bin/{device_id}/status`  | `{ "device_id", "remain", "cap", "is_open" }` | Bin status report   |

**Backend → ESP32 (Publish)**
| Topic                        | Payload (JSON)                             | Description             |
| :--------------------------- | :----------------------------------------- | :---------------------- |
| `speaker/{device_id}/cmd`    | `{ "type": "tts", "text": voice_msg }`     | Speaker TTS command     |
| `box/{device_id}/cmd` (optional) | `{ "act": "open", "close_in": 10000 }` | Bin door open/close cmd |

#### **E) Internally Generated Variables**
| Variable    | Type         | Generated In          | Used For                                  |
| :---------- | :----------- | :-------------------- | :---------------------------------------- |
| `rain_time` | string\|null | `services/weather_svc`| Frontend response, TTS message generation |
| `voice_msg` | string       | `controllers/weather_ctrl`| ESP32 Speaker (`speaker/{...}/cmd`)       |
| `alarms`    | string[]     | `controllers/user_ctrl` | Frontend response, TTS message suffix     |

#### **F) Environment Variables (.env)**
| Variable        | Purpose                                            |
| :-------------- | :------------------------------------------------- |
| `PORT`          | Backend port                                       |
| `CORS_ORIGIN`   | Allowed frontend domain                            |
| `DATABASE_URL`  | MySQL connection URL                               |
| `JWT_SECRET`    | JWT signing secret                                 |
| `DEVICE_SECRET` | Shared device secret (for development)             |
| `MQTT_HOST`     | MQTT broker address (`mqtt://...` or `mqtts://...`)|

## **9. Arduino/ESP32 (MQTT Connection Example)**

```c++
// In firmware/.../main.ino

// #include <WiFi.h>
// #include <PubSubClient.h>

// Variables used: user_id, sensor_id, device_id, remain, cap, is_open, ts
// Broker/Topics: MQTT_HOST, door/{sensor_id}/sensed, bin/{device_id}/status, etc.
```

## **10. Local Execution Order**

```bash
# 1. Start services (MySQL, Mosquitto, Adminer)
docker compose up -d

# 2. Start the backend server
cd server && npm i && npx prisma migrate dev && npm run dev

# 3. Create user, save coordinates, and register devices via API

# 4. Connect ESP32 to Wi-Fi, connect to MQTT broker (PC's IP), and publish sensor events

# 5. Backend subscribes, processes, and publishes commands to the speaker/bin
```
