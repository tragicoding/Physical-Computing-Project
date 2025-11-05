
// MQTT를 통해 스피커 디바이스로 TTS(Text-to-Speech) 명령을 전송하는 서비스
// [의존] mqtt_client, logger

import { mqtt_client } from '../config/mqtt.js';
import { logger } from '../utils/logger.js';

/**
 * 특정 스피커 디바이스에 텍스트를 음성으로 변환하여 재생하도록 명령함.
 * 
 * @param {number} device_id - 명령을 보낼 스피커 디바이스의 ID
 * @param {string} text - 음성으로 변환할 텍스트
 */
export async function send_tts(device_id, text) {
  // 토픽 형식: speaker/{device_id}/cmd
  const topic = `speaker/${device_id}/cmd`;
  
  // 펌웨어에서 해석할 JSON 페이로드
  const payload = JSON.stringify({ 
    type: 'tts', 
    text: text 
  });

  // MQTT 브로커로 메시지 발행 (QoS 1: 최소 한 번 전달 보장)
  mqtt_client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      logger.error(`TTS 명령 전송 실패 (device: ${device_id}):`, err);
    } else {
      logger.info(`TTS 명령 전송 성공 (device: ${device_id})`);
    }
  });
}
