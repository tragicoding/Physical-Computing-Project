import { Router } from 'express';
import Joi from 'joi';
import { validate } from '../middleware/validate.js';
import { add_device, record_heartbeat } from '../controllers/device_ctrl.js';
import { user_auth } from '../middleware/auth.js';

const router = Router();

// 디바이스 등록 (사용자 인증 필요)
router.post('/', user_auth, validate('body', Joi.object({
  user_id: Joi.number().integer().required(),
  type: Joi.string().valid('DOOR_SENSOR', 'UMBRELLA_BIN', 'SPEAKER').required(),
  name: Joi.string().max(50).required(),
  secret: Joi.string().max(100).required(), // 디바이스별 고유 시크릿
})), add_device);

// 디바이스 하트비트
router.post('/:device_id/heartbeat', validate('params', Joi.object({
  device_id: Joi.number().integer().required(),
})), record_heartbeat);

export default router;