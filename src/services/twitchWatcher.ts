// src/services/twitchWatcher.ts
import { Client, TextChannel } from 'discord.js';
import axios from 'axios';
import { createPool, Pool, RowDataPacket } from 'mysql2/promise';
import config from '../utils/config';
import logger from '../utils/logger';

interface TwitchChannelRecord extends RowDataPacket {
  id: number;
  guild_id: string;
  channel_login: string;
  announce_channel_id: string;
  last_live: number; // 0 or 1
}

class TwitchWatcher {
  private pool: Pool;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private intervalMs = 60 * 1000; // 1 минута
  private client!: Client;

  constructor() {
    this.pool = createPool({
      host: config.mysql.host,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
    this.clientId = config.twitch.clientId;
    this.clientSecret = config.twitch.clientSecret;
  }

  public start(client: Client) {
    this.client = client;
    this.poll();
    setInterval(() => this.poll(), this.intervalMs);
    logger.info('TwitchWatcher started');
  }

  private async poll() {
    try {
      await this.ensureToken();
      const [rows] = await this.pool.query<TwitchChannelRecord[]>(
        'SELECT * FROM twitch_channels'
      );
      const channels = rows as TwitchChannelRecord[];
      if (channels.length === 0) return;

      // Группируем по guild
      const guildMap = new Map<string, TwitchChannelRecord[]>();
      for (const ch of channels) {
        const arr = guildMap.get(ch.guild_id) || [];
        arr.push(ch);
        guildMap.set(ch.guild_id, arr);
      }

      for (const [guildId, recs] of guildMap.entries()) {
        for (const rec of recs) {
          await this.checkChannel(rec);
        }
      }
    } catch (error) {
      logger.error('Error in TwitchWatcher.poll:', error);
    }
  }

  private async checkChannel(rec: TwitchChannelRecord) {
    try {
      const url = `https://api.twitch.tv/helix/streams?user_login=${rec.channel_login}`;
      const resp = await axios.get(url, {
        headers: {
          'Client-ID': this.clientId,
          Authorization: `Bearer ${this.accessToken}`
        }
      });
      const data = resp.data.data;
      const isLive = Array.isArray(data) && data.length > 0;
      if (isLive && rec.last_live === 0) {
        const stream = data[0];
        await this.notifyLive(rec, stream.title, stream.game_name, stream.thumbnail_url);
        await this.updateLastLive(rec.id, 1);
      } else if (!isLive && rec.last_live === 1) {
        await this.updateLastLive(rec.id, 0);
      }
    } catch (error) {
      logger.error('Error in TwitchWatcher.checkChannel:', error);
    }
  }

  private async notifyLive(rec: TwitchChannelRecord, title: string, game: string, thumbnail: string) {
    try {
      const guild = this.client.guilds.cache.get(rec.guild_id);
      if (!guild) return;
      const channel = guild.channels.cache.get(rec.announce_channel_id) as TextChannel;
      if (!channel?.isTextBased()) return;
      const streamUrl = `https://www.twitch.tv/${rec.channel_login}`;
      await channel.send({
        content: `🔴 **${rec.channel_login}** в эфире!
**${title}**
Игра: ${game}
${streamUrl}`
      });
      logger.info(`Notified live for ${rec.channel_login} in guild ${rec.guild_id}`);
    } catch (error) {
      logger.error('Error in TwitchWatcher.notifyLive:', error);
    }
  }

  private async updateLastLive(id: number, live: number) {
    try {
      await this.pool.query(
        'UPDATE twitch_channels SET last_live = ? WHERE id = ?',
        [live, id]
      );
    } catch (error) {
      logger.error('Error in TwitchWatcher.updateLastLive:', error);
    }
  }

  private async ensureToken() {
    const now = Math.floor(Date.now() / 1000);
    if (this.accessToken && now < this.tokenExpiry - 60) return;
    try {
      const resp = await axios.post(
        `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}` +
        `&client_secret=${this.clientSecret}&grant_type=client_credentials`
      );
      this.accessToken = resp.data.access_token;
      this.tokenExpiry = now + resp.data.expires_in;
      logger.info('Obtained new Twitch OAuth token');
    } catch (error) {
      logger.error('Error obtaining Twitch token:', error);
    }
  }
}

export default new TwitchWatcher();
