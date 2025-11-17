
// 센서 이벤트 수신 시 날씨, 우산, 알람 정보를 종합하여 음성 안내를 제공하는 컨트롤러
// [의존] prisma, weather_svc, tts_svc

import { prisma } from '../config/prisma.js';
import { get_rain_info } from '../services/weather_svc.js';
import { send_tts } from '../services/tts_svc.js';
