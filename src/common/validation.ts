// 通用验证工具函数

import type { RoomId } from "./roomId.js";
import { parseRoomId } from "./roomId.js";

/**
 * 验证结果类型
 */
export type ValidationResult<T> = 
  | { valid: true; value: T }
  | { valid: false; error: string };

/**
 * 验证会话 token
 */
export function validateSessionToken(token: unknown): ValidationResult<string> {
  if (typeof token !== "string" || !token.trim()) {
    return { valid: false, error: "bad-token" };
  }
  return { valid: true, value: token.trim() };
}

/**
 * 验证谱面 ID
 */
export function validateChartId(chartId: unknown): ValidationResult<number> {
  const id = Number(chartId);
  if (!Number.isInteger(id) || id < 0) {
    return { valid: false, error: "bad-chart-id" };
  }
  return { valid: true, value: id };
}

/**
 * 验证时间戳
 */
export function validateTimestamp(timestamp: unknown): ValidationResult<number> {
  const ts = Number(timestamp);
  if (!Number.isInteger(ts) || ts <= 0) {
    return { valid: false, error: "bad-timestamp" };
  }
  return { valid: true, value: ts };
}

/**
 * 验证用户 ID
 */
export function validateUserId(userId: unknown): ValidationResult<number> {
  const id = Number(userId);
  if (!Number.isInteger(id)) {
    return { valid: false, error: "bad-user-id" };
  }
  return { valid: true, value: id };
}

/**
 * 验证房间 ID
 */
export function validateRoomId(roomIdText: unknown): ValidationResult<RoomId> {
  if (typeof roomIdText !== "string") {
    return { valid: false, error: "bad-room-id" };
  }
  try {
    const rid = parseRoomId(roomIdText);
    return { valid: true, value: rid };
  } catch {
    return { valid: false, error: "bad-room-id" };
  }
}

/**
 * 验证消息内容
 */
export function validateMessage(message: unknown, maxLength: number = 200): ValidationResult<string> {
  if (typeof message !== "string" || !message.trim()) {
    return { valid: false, error: "bad-message" };
  }
  const trimmed = message.trim();
  if (trimmed.length > maxLength) {
    return { valid: false, error: "message-too-long" };
  }
  return { valid: true, value: trimmed };
}

/**
 * 验证房间最大用户数
 */
export function validateMaxUsers(maxUsers: unknown): ValidationResult<number> {
  const num = Number(maxUsers);
  if (!Number.isInteger(num) || num < 1 || num > 64) {
    return { valid: false, error: "bad-max-users" };
  }
  return { valid: true, value: num };
}

/**
 * 验证用户 ID 数组
 */
export function validateUserIdArray(userIds: unknown): ValidationResult<number[]> {
  if (!Array.isArray(userIds)) {
    return { valid: false, error: "bad-user-ids" };
  }
  const validIds = userIds
    .map((it) => Number(it))
    .filter((n) => Number.isInteger(n));
  
  if (validIds.length === 0) {
    return { valid: false, error: "bad-user-ids" };
  }
  return { valid: true, value: validIds };
}

/**
 * 验证 IP 地址格式（简单验证）
 */
export function validateIp(ip: unknown): ValidationResult<string> {
  if (typeof ip !== "string" || !ip.trim()) {
    return { valid: false, error: "bad-ip" };
  }
  return { valid: true, value: ip.trim() };
}

/**
 * 批量验证参数
 * 返回第一个验证失败的错误，或所有验证通过
 */
export function validateAll(...validations: ValidationResult<any>[]): ValidationResult<void> {
  for (const validation of validations) {
    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }
  }
  return { valid: true, value: undefined };
}

/**
 * 验证请求参数是否为有效整数
 */
export function isValidInteger(value: unknown, min?: number, max?: number): value is number {
  const num = Number(value);
  if (!Number.isInteger(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

/**
 * 验证字符串参数
 */
export function isValidString(value: unknown, maxLength?: number): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (maxLength !== undefined && trimmed.length > maxLength) return false;
  return true;
}

/**
 * 安全地从字符串中提取整数
 */
export function safeParseInt(value: unknown, defaultValue: number = 0): number {
  const num = Number(value);
  return Number.isInteger(num) ? num : defaultValue;
}
