import { Mutex } from "./mutex.js";
import type { RoomId } from "../common/roomId.js";
import type { ServerConfig } from "./types.js";
import type { Room } from "./room.js";
import type { Session } from "./session.js";
import type { User } from "./user.js";
import type { Logger } from "./logger.js";

export class ServerState {
  readonly mutex = new Mutex();
  readonly config: ServerConfig;
  readonly logger: Logger;
  readonly serverName: string;

  readonly sessions = new Map<string, Session>();
  readonly users = new Map<number, User>();
  readonly rooms = new Map<RoomId, Room>();

  constructor(config: ServerConfig, logger: Logger, serverName: string) {
    this.config = config;
    this.logger = logger;
    this.serverName = serverName;
  }
}
