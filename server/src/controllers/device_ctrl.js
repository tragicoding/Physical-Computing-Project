
// 사용자의 디바이스(장치) 등록 및 상태 관리를 위한 컨트롤러
// [의존] prisma

import { prisma } from '../config/prisma.js';

/**
 * 새로운 디바이스를 시스템에 등록함.
 * @param {object} req - Express 요청 객체 (body: { user_id, type, name, secret })
 * @param {object} res - Express 응답 객체
 * @param {function} next - Express next 미들웨어
 */
export async function add_device(req, res, next) {
  try {
    const { user_id, type, name, secret } = req.body;
    const new_device = await prisma.device.create({ 
      data: { user_id, type, name, secret } 
    });
    res.status(201).json({ device_id: new_device.id });
  } catch (error) {
    next(error);
  }
}

/**
 * 디바이스의 마지막 접속 시간을 갱신함 (하트비트).
 * @param {object} req - Express 요청 객체 (params: { device_id })
 * @param {object} res - Express 응답 객체
 * @param {function} next - Express next 미들웨어
 */
export async function record_heartbeat(req, res, next) {
  try {
    const { device_id } = req.params;
    await prisma.device.update({ 
      where: { id: Number(device_id) }, 
      data: { last_seen: new Date() } 
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
