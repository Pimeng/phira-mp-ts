// 标准响应构建工具

/**
 * 标准错误响应
 */
export type ErrorResponse = { ok: false; error: string };

/**
 * 标准成功响应
 */
export type SuccessResponse<T = Record<string, unknown>> = { ok: true } & T;

/**
 * 标准响应类型
 */
export type ApiResponse<T = Record<string, unknown>> = ErrorResponse | SuccessResponse<T>;

/**
 * 创建错误响应
 */
export function errorResponse(error: string): ErrorResponse {
  return { ok: false, error };
}

/**
 * 创建成功响应
 */
export function successResponse<T extends Record<string, unknown>>(data?: T): SuccessResponse<T> {
  return { ok: true, ...(data || {}) } as SuccessResponse<T>;
}
