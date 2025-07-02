// src/services/youtubeWatcher.ts
import { Client, TextChannel } from 'discord.js';
import axios from 'axios';
import { createPool, Pool, RowDataPacket } from 'mysql2/promise';
import config from '../utils/config';
import logger from '../utils/logger';

// Структура записи из БД
interface YouTubeChannelRecord extends RowDataPacket {
  id: number;
  guild_id: string;
  channel_id: string;
  announce_channel_id: string;
  last_video_id: string | null;
}

class YouTubeWatcher {
  private pool: Pool;
  private apiKey: string;
  private intervalMs = 5 * 60 * 1000; // 5 минут
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
    this.apiKey = config.youtube.apiKey;
  }

  public start(client: Client) {
    this.client = client;
    this.poll();
    setInterval(() => this.poll(), this.intervalMs);
    logger.info('YouTubeWatcher started');
  }

  private async poll() {
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM youtube_channels');
      const channels = rows as YouTubeChannelRecord[];
      for (const rec of channels) {
        await this.checkChannel(rec);
      }
    } catch (error) {
      logger.error('Error in YouTubeWatcher.poll:', error);
    }
  }

  private async checkChannel(rec: YouTubeChannelRecord) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?key=${this.apiKey}` +
        `&channelId=${rec.channel_id}&part=snippet,id&order=date&maxResults=1&type=video`;
      const resp = await axios.get(url);
      const items = resp.data.items;
      if (!Array.isArray(items) || items.length === 0) return;
      const latest = items[0];
      const videoId = latest.id.videoId;
      if (rec.last_video_id !== videoId) {
        await this.notifyNewVideo(rec, latest.snippet.title, videoId);
        await this.updateLastVideo(rec.id, videoId);
      }
    } catch (error) {
      logger.error('Error in YouTubeWatcher.checkChannel:', error);
    }
  }

  private async notifyNewVideo(rec: YouTubeChannelRecord, title: string, videoId: string) {
    try {
      const guild = this.client.guilds.cache.get(rec.guild_id);
      if (!guild) return;
      const channel = guild.channels.cache.get(rec.announce_channel_id) as TextChannel;
      if (!channel?.isTextBased()) return;
      const videoUrl = `https://youtu.be/${videoId}`;
      await channel.send({
        content: `📢 **Новый ролик от канала!**
**${title}**
${videoUrl}`
      });
      logger.info(`Notified new YouTube video ${videoId} in guild ${rec.guild_id}`);
    } catch (error) {
      logger.error('Error in YouTubeWatcher.notifyNewVideo:', error);
    }
  }

  private async updateLastVideo(id: number, videoId: string) {
    try {
      await this.pool.query(
        'UPDATE youtube_channels SET last_video_id = ? WHERE id = ?',
        [videoId, id]
      );
    } catch (error) {
      logger.error('Error in YouTubeWatcher.updateLastVideo:', error);
    }
  }
}

export default new YouTubeWatcher();
