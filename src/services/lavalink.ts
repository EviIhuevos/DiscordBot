import { Client } from 'discord.js';
import { LavaShark, Track, Player } from 'lavashark';
import logger from '../utils/logger';
import config from '../utils/config';

class LavalinkService {
  public lavashark: LavaShark;
  private connected = false;
  private leaveTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(client: Client) {
    this.lavashark = new LavaShark({
      nodes: [
        {
          hostname: config.lavalink.host,
          port: config.lavalink.port,
          password: config.lavalink.password,
          secure: false,
        }
      ],
      sendWS: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
      }
    });

    this.registerEvents();

    client.once('ready', async () => {
      try {
        await this.lavashark.start(client.user!.id);
        logger.info('🚀 lavashark инициализирован и подключается к node...');
      } catch (err: any) {
        logger.error(`❌ Ошибка при инициализации lavashark: ${err.message}`);
      }
    });
  }

  private registerEvents() {
    this.lavashark.on('nodeConnect', (node) => {
      this.connected = true;
      logger.info(`✅ Lavalink node connected: ${node.options.hostname}:${node.options.port}`);
    });

    this.lavashark.on('nodeDisconnect', (node, reason) => {
      this.connected = false;
      logger.warn(`❌ Lavalink node disconnected: ${node.options.hostname}:${node.options.port} | ${reason}`);
    });

    this.lavashark.on('trackStart', (player: Player, track: Track) => {
      logger.info(`🎶 Трек начался в гильдии ${player.guildId}: ${track.title}`);
    });

    this.lavashark.on('trackEnd', (player: Player, track: Track) => {
      logger.info(`⏹ Трек завершён в гильдии ${player.guildId}: ${track.title}`);
    });

    this.lavashark.on('error', (node, err) => {
      logger.error(`❌ Ошибка в node ${node.options.hostname}: ${err.message}`);
    });

    // Типы lavashark не содержат события playerError, поэтому приводим к any
    this.lavashark.on('playerError' as any, (player: Player, err: any) => {
      logger.error(`❌ Ошибка плеера в гильдии ${player.guildId}: ${err.message}`);
    });

    this.lavashark.on('queueEnd', (player: Player) => {
      this.scheduleLeave(player.guildId);
    });
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public scheduleLeave(guildId: string) {
    this.clearLeave(guildId);
    const timeout = setTimeout(() => {
      const player = this.lavashark.players.get(guildId);
      if (player && !player.playing && player.queue.tracks.length === 0) {
        player.destroy();
      }
    }, 60_000);
    this.leaveTimers.set(guildId, timeout);
  }

  public clearLeave(guildId: string) {
    const t = this.leaveTimers.get(guildId);
    if (t) {
      clearTimeout(t);
      this.leaveTimers.delete(guildId);
    }
  }
}
export default LavalinkService;
