// src/services/streamService.ts
import { Presence, Client, ActivityType, TextChannel } from 'discord.js';
import { createPool, Pool, RowDataPacket } from 'mysql2/promise';
import config from '../utils/config';
import logger from '../utils/logger';

interface StreamRoleRecord {
  id: number;
  user_id: string;
  role_id: string;
}

class StreamService {
  private pool: Pool;

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
  }

  /**
   * Обработчик изменения статуса присутствия для выдачи/снятия роли при стриминге
   */
  public async handlePresenceUpdate(oldPresence: Presence | null, newPresence: Presence) {
    try {
      const member = newPresence.member;
      if (!member || !newPresence.guild) return;

      // Получаем запись из БД
      const [rows] = await this.pool.query<RowDataPacket[]>(
        'SELECT * FROM user_stream_roles WHERE user_id = ?',
        [member.id]
      );
      const recs = rows as StreamRoleRecord[];
      if (recs.length === 0) return;
      const roleId = recs[0].role_id;

      // Проверяем streaming активность
      const wasStreaming = oldPresence?.activities.some(act => act.type === ActivityType.Streaming) ?? false;
      const isStreaming = newPresence.activities.some(act => act.type === ActivityType.Streaming);

      // Начало стрима
      if (!wasStreaming && isStreaming) {
        if (!member.roles.cache.has(roleId)) {
          await member.roles.add(roleId);
          logger.info(`Granted stream role ${roleId} to user ${member.id}`);
        }
      }
      // Конец стрима
      if (wasStreaming && !isStreaming) {
        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(roleId);
          logger.info(`Removed stream role ${roleId} from user ${member.id}`);
        }
      }
    } catch (error) {
      logger.error('Error in StreamService.handlePresenceUpdate:', error);
    }
  }

  /**
   * Назначает роль для пользователя при стриме
   */
  public async setUserStreamRole(userId: string, roleId: string) {
    try {
      await this.pool.query(
        `INSERT INTO user_stream_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id = ?`,
        [userId, roleId, roleId]
      );
      logger.info(`Set stream role ${roleId} for user ${userId}`);
    } catch (error) {
      logger.error('Error in StreamService.setUserStreamRole:', error);
      throw error;
    }
  }

  /**
   * Удаляет назначенную роль для пользователя
   */
  public async removeUserStreamRole(userId: string) {
    try {
      await this.pool.query(
        'DELETE FROM user_stream_roles WHERE user_id = ?',
        [userId]
      );
      logger.info(`Removed stream role binding for user ${userId}`);
    } catch (error) {
      logger.error('Error in StreamService.removeUserStreamRole:', error);
      throw error;
    }
  }

  /**
   * Получает назначенную роль для пользователя
   */
  public async getUserStreamRole(userId: string): Promise<string | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT role_id FROM user_stream_roles WHERE user_id = ?',
      [userId]
    );
    const recs = rows as StreamRoleRecord[];
    return recs.length > 0 ? recs[0].role_id : null;
  }
}

export default new StreamService();
