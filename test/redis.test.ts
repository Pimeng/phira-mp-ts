/**
 * Redis 分布式状态层测试（需 Redis，默认 127.0.0.1:6379 数据库 0）
 * beforeAll 中探测连接；可用则跑用例，不可用则各用例内 return 通过（Vitest 的 skipIf 在收集阶段求值，无法用运行时结果）。
 */
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { RedisService } from "../src/server/redis.js";
import { parseRoomId } from "../src/common/roomId.js";
import type { Logger } from "../src/server/logger.js";

const REDIS_HOST = process.env.REDIS_HOST ?? "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT ?? "6379");
const REDIS_DB = Number(process.env.REDIS_DB ?? "0");

const mockLogger = {
  debug: (msg: string, meta?: Record<string, unknown>) => console.log("[DEBUG]", msg, meta ?? ""),
  info: (msg: string, meta?: Record<string, unknown>) => console.log("[INFO]", msg, meta ?? ""),
  mark: (msg: string, meta?: Record<string, unknown>) => console.log("[MARK]", msg, meta ?? ""),
  warn: (msg: string, meta?: Record<string, unknown>) => console.log("[WARN]", msg, meta ?? ""),
  error: (msg: string, meta?: Record<string, unknown>) => console.log("[ERROR]", msg, meta ?? ""),
  close: () => {}
} as unknown as Logger;

let redis: RedisService | undefined;
/** 仅在 Redis 连接可用时为 true，用于决定是否执行测试或跳过 */
let redisAvailable = false;
const testRoomId = parseRoomId("redis-test-room");

const REDIS_READY_MS = 5000;

beforeAll(async () => {
  try {
    redis = new RedisService({
      host: REDIS_HOST,
      port: REDIS_PORT,
      db: REDIS_DB,
      serverId: "test-server",
      logger: mockLogger
    });
    await Promise.race([
      redis.waitReady(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error(`Redis 未在 ${REDIS_READY_MS}ms 内就绪`)), REDIS_READY_MS)
      )
    ]);
    await redis.setPlayerSession({ uid: 0, roomId: null, name: "", isMonitor: false });
    await redis.deletePlayerSession(0);
    redisAvailable = true;
  } catch (e) {
    redisAvailable = false;
    const err = e as Error;
    console.warn("[redis.test] Redis 连接不可用，跳过本组测试:", err?.message ?? e);
    if (err?.stack) console.warn(err.stack);
  }
});

afterAll(async () => {
  if (redis) await redis.close();
});

describe("Redis 分布式状态层", () => {
  test("setPlayerSession / updatePlayerLastSeen / deletePlayerSession", async () => {
    if (!redisAvailable) return;
    const r = redis!;
    const uid = 9001;
    await r.setPlayerSession({
      uid,
      roomId: null,
      name: "TestUser",
      isMonitor: false
    });
    await r.updatePlayerLastSeen(uid);
    await r.deletePlayerSession(uid);
    // 无抛错即通过
  });

  test("initRoom / setRoomInfo / tryAddRoomPlayer / removeRoomPlayer / deleteRoom", async () => {
    if (!redisAvailable) return;
    const r = redis!;
    await r.initRoom(testRoomId, 100, 8);
    await r.setRoomInfo({
      rid: testRoomId,
      hostId: 100,
      state: 0,
      chartId: 123,
      isLocked: false,
      isCycle: true
    });
    const added = await r.tryAddRoomPlayer(testRoomId, 200, 8);
    expect(added).toBe(true);
    const addedAgain = await r.tryAddRoomPlayer(testRoomId, 201, 8);
    expect(addedAgain).toBe(true);
    await r.removeRoomPlayer(testRoomId, 200);
    await r.removeRoomPlayer(testRoomId, 201);
    await r.deleteRoom(testRoomId);
  });

  test("Lua 原子加入：房间满时 tryAddRoomPlayer 返回 false", async () => {
    if (!redisAvailable) return;
    const r = redis!;
    const rid = parseRoomId("redis-full-room");
    await r.initRoom(rid, 1, 2);
    expect(await r.tryAddRoomPlayer(rid, 1, 2)).toBe(true);
    expect(await r.tryAddRoomPlayer(rid, 2, 2)).toBe(true);
    expect(await r.tryAddRoomPlayer(rid, 3, 2)).toBe(false);
    await r.deleteRoom(rid);
  });

  test("publishEvent 与 subscribe 收包", async () => {
    if (!redisAvailable) return;
    const r = redis!;
    const received: unknown[] = [];
    await r.subscribe((payload) => {
      received.push(payload);
    });
    await r.publishEvent({
      event: "STATE_CHANGE",
      room_id: "pubsub-test",
      data: { new_state: 1, chart_id: 456 }
    });
    await new Promise((r) => setTimeout(r, 200));
    expect(received.length).toBeGreaterThanOrEqual(1);
    expect((received[0] as { event: string }).event).toBe("STATE_CHANGE");
    expect((received[0] as { room_id: string }).room_id).toBe("pubsub-test");
  });
});
