// 通用工具函数

/**
 * 清理过期的会话数据
 */
export function cleanupExpiredSessions<T extends { expiresAt: number }>(
  sessions: Map<string, T>,
  now: number = Date.now()
): void {
  for (const [key, data] of sessions) {
    if (now > data.expiresAt) {
      sessions.delete(key);
    }
  }
}
