
// 사용자 정보(프로필, 주소, 알람) 관련 CRUD를 처리하는 컨트롤러
// [의존] prisma

import { prisma } from '../config/prisma.js';

/**
 * 현재 로그인된 사용자의 프로필 정보를 조회함.
 * @param {object} req - Express 요청 객체 (req.user_id에 사용자 ID 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - Express next 미들웨어
 */
export async function get_my_profile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user_id },
      select: { id: true, email: true, lat: true, lon: true, created_at: true }
    });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없음.' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * 사용자의 위치(주소) 좌표를 설정(업데이트)함.
 * @param {object} req - Express 요청 객체 (body: { lat, lon })
 * @param {object} res - Express 응답 객체
 * @param {function} next - Express next 미들웨어
 */
export async function set_user_address(req, res, next) {
  try {
    const { lat, lon } = req.body;
    const updated_user = await prisma.user.update({
      where: { id: req.user_id },
      data: { lat, lon },
      select: { lat: true, lon: true }
    });
    res.json({ ok: true, ...updated_user });
  } catch (error) {
    next(error);
  }
}

/**
 * 사용자를 위한 새 알람을 추가함.
 * @param {object} req - Express 요청 객체 (body: { alarm_text })
 * @param {object} res - Express 응답 객체
 * @param {function} next - Express next 미들웨어
 */
export async function add_user_alarm(req, res, next) {
  try {
    const { alarm_text } = req.body;
    const new_alarm = await prisma.alarm.create({ 
      data: { user_id: req.user_id, text: alarm_text } 
    });
    res.status(201).json({ alarm_id: new_alarm.id });
  } catch (error) {
    next(error);
  }
}

/**
 * 현재 사용자의 모든 알람 목록을 조회함.
 * @param {object} req - Express 요청 객체
 * @param {object} res - Express 응답 객체
 * @param {function} next - Express next 미들웨어
 */
export async function list_user_alarms(req, res, next) {
  try {
    const alarms = await prisma.alarm.findMany({ 
      where: { user_id: req.user_id },
      orderBy: { id: 'asc' } // 생성 순서대로 정렬
    });
    res.json({ alarms });
  } catch (error) {
    next(error);
  }
}
