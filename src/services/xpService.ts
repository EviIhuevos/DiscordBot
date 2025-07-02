// src/services/xpService.ts
import { Message, VoiceState } from 'discord.js';
import { createPool, Pool, RowDataPacket } from 'mysql2/promise';
import config from '../utils/config';
import logger from '../utils/logger';

// Интервалы и награды XP
const MESSAGE_COOLDOWN = 60 * 1000; // 1 минута
const MESSAGE_XP = 10;
const VOICE_XP_PER_MINUTE = 5;

// Для трекинга cooldown сообщений
const lastMessageTimestamps = new Map<string, number>();
// Для трекинга подключения к голосу
const voiceJoinTimestamps = new Map<string, number>();

interface UserRecord {
  user_id: string;
  xp: number;
  level: number;
  is_blacklisted: number;
}

class XPService {
  private pool: Pool;

  constructor() {
    this.pool = createPool({
      host: config.mysql.host,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  public async addXpForMessage(message: Message) {
    const userId = message.author.id;
    const now = Date.now();
    const last = lastMessageTimestamps.get(userId) || 0;
    if (now - last < MESSAGE_COOLDOWN) return;
    lastMessageTimestamps.set(userId, now);
    await this.addXp(userId, MESSAGE_XP, 'Сообщение');
  }

  public async addXpForVoice(oldState: VoiceState, newState: VoiceState) {
    const userId = newState.id;
    if (!oldState.channel && newState.channel) {
      voiceJoinTimestamps.set(userId, Date.now());
    }
    if (oldState.channel && (!newState.channel || oldState.channelId !== newState.channelId)) {
      const joinTime = voiceJoinTimestamps.get(userId);
      if (joinTime) {
        const minutes = Math.floor((Date.now() - joinTime) / (60 * 1000));
        if (minutes > 0) {
          await this.addXp(userId, minutes * VOICE_XP_PER_MINUTE, `Voice: ${minutes} мин`);
        }
      }
      voiceJoinTimestamps.delete(userId);
    }
  }

  public async addXp(userId: string, amount: number, reason: string) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query<RowDataPacket[]>(
        'SELECT * FROM users WHERE user_id = ?', [userId]
      );
      let user: UserRecord;
      if (rows.length === 0) {
        await conn.query(
          'INSERT INTO users (user_id, xp, level, is_blacklisted) VALUES (?, 0, 0, 0)', [userId]
        );
        user = { user_id: userId, xp: 0, level: 0, is_blacklisted: 0 };
      } else {
        user = rows[0] as UserRecord;
      }
      if (amount > 0 && user.is_blacklisted) {
        await conn.commit();
        return;
      }
      const newXp = Math.max(0, user.xp + amount);
      const newLevel = Math.floor(0.1 * Math.sqrt(newXp));
      await conn.query(
        'UPDATE users SET xp = ?, level = ? WHERE user_id = ?',
        [newXp, newLevel, userId]
      );
      await conn.query(
        'INSERT INTO xp_logs (user_id, delta, reason) VALUES (?, ?, ?)',
        [userId, amount, reason]
      );
      await conn.commit();
      logger.info(`XP updated: ${userId} ${amount >= 0 ? '+' : ''}${amount} xp=${newXp}, level=${newLevel}`);
    } catch (error) {
      await conn.rollback();
      logger.error('Error in XPService.addXp:', error);
    } finally {
      conn.release();
    }
  }

  public async removeXp(userId: string, amount: number, reason: string) {
    await this.addXp(userId, -Math.abs(amount), reason);
  }

  public async setLevel(userId: string, level: number) {
    const conn = await this.pool.getConnection();
    try {
      await conn.query('UPDATE users SET level = ? WHERE user_id = ?', [level, userId]);
      logger.info(`Level set: ${userId} => level=${level}`);
    } catch (error) {
      logger.error('Error in XPService.setLevel:', error);
    } finally {
      conn.release();
    }
  }

  public async blacklistUser(userId: string) {
    const conn = await this.pool.getConnection();
    try {
      await conn.query('UPDATE users SET is_blacklisted = 1 WHERE user_id = ?', [userId]);
      logger.info(`User blacklisted: ${userId}`);
    } catch (error) {
      logger.error('Error in XPService.blacklistUser:', error);
    } finally {
      conn.release();
    }
  }

  public async unblacklistUser(userId: string) {
    const conn = await this.pool.getConnection();
    try {
      await conn.query('UPDATE users SET is_blacklisted = 0 WHERE user_id = ?', [userId]);
      logger.info(`User unblacklisted: ${userId}`);
    } catch (error) {
      logger.error('Error in XPService.unblacklistUser:', error);
    } finally {
      conn.release();
    }
  }

  public async getInfo(userId: string): Promise<UserRecord | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE user_id = ?', [userId]
    );
    return rows.length ? (rows[0] as UserRecord) : null;
  }
}

export default new XPService();
