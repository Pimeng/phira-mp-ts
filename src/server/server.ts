import net from "node:net";
import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { newUuid } from "../common/uuid.js";
import { decodePacket, encodePacket } from "../common/binary.js";
import { decodeClientCommand, encodeServerCommand } from "../common/commands.js";
import { Stream } from "../common/stream.js";
import type { StreamCodec } from "../common/stream.js";
import type { ClientCommand, ServerCommand } from "../common/commands.js";
import { ServerState } from "./state.js";
import type { ServerConfig } from "./types.js";
import { Session } from "./session.js";
import { Logger } from "./logger.js";

export type StartServerOptions = { port: number; config?: ServerConfig };

export type RunningServer = {
  server: net.Server;
  state: ServerState;
  logger: Logger;
  close: () => Promise<void>;
  address: () => net.AddressInfo;
};

function loadConfig(): ServerConfig {
  try {
    const text = readFileSync("server_config.yml", "utf8");
    const v = yaml.load(text) as Partial<ServerConfig> | undefined;
    const monitors = Array.isArray(v?.monitors) ? v!.monitors.map((it) => Number(it)).filter((it) => Number.isInteger(it)) : [2];
    const server_name = typeof v?.server_name === "string" && v.server_name.trim().length > 0 ? v.server_name.trim() : undefined;
    return { monitors, server_name };
  } catch {
    return { monitors: [2] };
  }
}

const codec: StreamCodec<ServerCommand, ClientCommand> = {
  encodeSend: (payload) => encodePacket(payload, encodeServerCommand),
  decodeRecv: (payload) => decodePacket(payload, decodeClientCommand)
};

function formatListenHostPort(host: string, port: number): string {
  if (host.includes(":")) return `[${host}]:${port}`;
  return `${host}:${port}`;
}

function formatNodeVersion(v: string): string {
  return v.startsWith("v") ? v.slice(1) : v;
}

export async function startServer(options: StartServerOptions): Promise<RunningServer> {
  const logger = new Logger();
  const cfg = options.config ?? loadConfig();
  const serverName = process.env.SERVER_NAME?.trim() || cfg.server_name || "Phira MP";
  const state = new ServerState(cfg, logger, serverName);

  let version = "unknown";
  try {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version?: string };
    version = pkg.version ?? version;
  } catch {
    version = "unknown";
  }

  const server = net.createServer(async (socket) => {
    const id = newUuid();
    logger.mark(`收到新连接，连接ID：${id}，来源：${socket.remoteAddress ?? "unknown"}:${socket.remotePort ?? "unknown"}`);
    const session = new Session({ id, socket, state });
    state.sessions.set(id, session);

    const stream = await Stream.create<ServerCommand, ClientCommand>({
      socket,
      codec,
      handler: async (cmd) => {
        await session.onCommand(cmd);
      }
    });

    session.bindStream(stream);
    logger.mark(`连接握手完成，连接ID：${id}，协议版本：“${stream.version}”`);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen({ port: options.port, host: "::" }, () => resolve());
  });

  const addr = server.address() as net.AddressInfo;
  logger.mark(`服务端版本 ${version}`);
  logger.mark(`当前运行环境 ${process.platform}_${process.arch} node${formatNodeVersion(process.version)}`);
  logger.mark(`服务端运行在 ${formatListenHostPort(addr.address, addr.port)}`);
  logger.mark(`服务器名称 ${serverName}`);

  return {
    server,
    state,
    logger,
    address: () => server.address() as net.AddressInfo,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.mark("服务端已停止");
      logger.close();
    }
  };
}
