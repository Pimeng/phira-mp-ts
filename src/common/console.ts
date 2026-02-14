// 通用终端日志输出工具函数

/**
 * 输出调试信息到终端（黄色）
 * @param message 调试消息
 * @param data 额外的数据对象
 */
export function debugLog(message: string, data?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";
  process.stdout.write(`\x1b[33m[${timestamp}] [DEBUG] ${message}${dataStr}\x1b[0m\n`);
}

/**
 * 输出信息到终端（绿色）
 * @param message 信息消息
 */
export function infoLog(message: string): void {
  const timestamp = new Date().toISOString();
  process.stdout.write(`\x1b[32m[${timestamp}] [INFO] ${message}\x1b[0m\n`);
}

/**
 * 输出警告到终端（黄色）
 * @param message 警告消息
 */
export function warnLog(message: string): void {
  const timestamp = new Date().toISOString();
  process.stdout.write(`\x1b[33m[${timestamp}] [WARN] ${message}\x1b[0m\n`);
}

/**
 * 输出错误到终端（红色）
 * @param message 错误消息
 */
export function errorLog(message: string): void {
  const timestamp = new Date().toISOString();
  process.stdout.write(`\x1b[31m[${timestamp}] [ERROR] ${message}\x1b[0m\n`);
}
