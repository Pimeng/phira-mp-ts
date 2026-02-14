export function encodeLengthPrefixU32(len: number): Buffer {
  if (!Number.isInteger(len) || len < 0) {
    throw new Error("frame-invalid-length");
  }
  
  // 优化：预分配最大可能大小（5字节）
  const out = Buffer.allocUnsafe(5);
  let x = len >>> 0;
  let n = 0;
  
  // 优化：展开循环以减少分支预测失败
  if (x < 0x80) {
    out[0] = x;
    return out.subarray(0, 1);
  }
  
  out[n++] = (x & 0x7f) | 0x80;
  x >>>= 7;
  
  if (x < 0x80) {
    out[n++] = x;
    return out.subarray(0, n);
  }
  
  out[n++] = (x & 0x7f) | 0x80;
  x >>>= 7;
  
  if (x < 0x80) {
    out[n++] = x;
    return out.subarray(0, n);
  }
  
  out[n++] = (x & 0x7f) | 0x80;
  x >>>= 7;
  
  if (x < 0x80) {
    out[n++] = x;
    return out.subarray(0, n);
  }
  
  out[n++] = (x & 0x7f) | 0x80;
  x >>>= 7;
  out[n++] = x;
  
  return out.subarray(0, n);
}

export type DecodeFrameResult =
  | { type: "need_more" }
  | { type: "frame"; payload: Buffer; remaining: Buffer }
  | { type: "error"; error: Error };

export function tryDecodeFrame(buffer: Buffer, maxPayloadBytes = 2 * 1024 * 1024): DecodeFrameResult {
  // 优化：快速路径检查
  if (buffer.length === 0) return { type: "need_more" };
  
  let len = 0;
  let pos = 0;
  let offset = 0;

  // 优化：展开前几次循环以减少分支
  if (offset >= buffer.length) return { type: "need_more" };
  let byte = buffer[offset++];
  len = byte & 0x7f;
  if ((byte & 0x80) === 0) {
    // 单字节长度（最常见情况）
    if (len > maxPayloadBytes) return { type: "error", error: new Error("frame-payload-too-large") };
    if (buffer.length - offset < len) return { type: "need_more" };
    const payload = buffer.subarray(offset, offset + len);
    const remaining = buffer.subarray(offset + len);
    return { type: "frame", payload, remaining };
  }
  
  pos = 7;
  
  // 第二字节
  if (offset >= buffer.length) return { type: "need_more" };
  byte = buffer[offset++];
  len |= (byte & 0x7f) << pos;
  if ((byte & 0x80) === 0) {
    if (len > maxPayloadBytes) return { type: "error", error: new Error("frame-payload-too-large") };
    if (buffer.length - offset < len) return { type: "need_more" };
    const payload = buffer.subarray(offset, offset + len);
    const remaining = buffer.subarray(offset + len);
    return { type: "frame", payload, remaining };
  }
  
  pos += 7;
  
  // 第三字节
  if (offset >= buffer.length) return { type: "need_more" };
  byte = buffer[offset++];
  len |= (byte & 0x7f) << pos;
  if ((byte & 0x80) === 0) {
    if (len > maxPayloadBytes) return { type: "error", error: new Error("frame-payload-too-large") };
    if (buffer.length - offset < len) return { type: "need_more" };
    const payload = buffer.subarray(offset, offset + len);
    const remaining = buffer.subarray(offset + len);
    return { type: "frame", payload, remaining };
  }
  
  pos += 7;
  
  // 第四字节
  if (offset >= buffer.length) return { type: "need_more" };
  byte = buffer[offset++];
  len |= (byte & 0x7f) << pos;
  if ((byte & 0x80) === 0) {
    if (len > maxPayloadBytes) return { type: "error", error: new Error("frame-payload-too-large") };
    if (buffer.length - offset < len) return { type: "need_more" };
    const payload = buffer.subarray(offset, offset + len);
    const remaining = buffer.subarray(offset + len);
    return { type: "frame", payload, remaining };
  }
  
  pos += 7;
  
  // 第五字节（最后一个）
  if (offset >= buffer.length) return { type: "need_more" };
  byte = buffer[offset++];
  if ((byte & 0x80) !== 0) return { type: "error", error: new Error("frame-invalid-length-prefix") };
  len |= (byte & 0x7f) << pos;

  if (len > maxPayloadBytes) return { type: "error", error: new Error("frame-payload-too-large") };
  if (buffer.length - offset < len) return { type: "need_more" };

  const payload = buffer.subarray(offset, offset + len);
  const remaining = buffer.subarray(offset + len);
  return { type: "frame", payload, remaining };
}
