// src/services/roleService.ts
import { MessageReaction, User } from 'discord.js';
import { createPool, Pool, RowDataPacket } from 'mysql2/promise';
import config from '../utils/config';
import logger from '../utils/logger';

interface ReactionRoleRecord extends RowDataPacket {
  id: number;
  message_id: string;
  emoji: string;
  role_id: string;
}

class RoleService {
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
   * Обрабатывает добавление реакции: если есть привязка, добавляет роль
   */
  public async handleReactionAdd(reaction: MessageReaction, user: User) {
    try {
      const message = reaction.message;
      if (!message.guild) return;
      const emojiKey = reaction.emoji.id ?? reaction.emoji.name;
      const [rows] = await this.pool.query<RowDataPacket[]>(
        'SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?',
        [message.id, emojiKey]
      );
      const recs = rows as ReactionRoleRecord[];
      if (recs.length === 0) return;
      const { role_id } = recs[0];
      const member = await message.guild.members.fetch(user.id);
      if (!member) return;
      if (!member.roles.cache.has(role_id)) {
        await member.roles.add(role_id);
        logger.info(`Added role ${role_id} to user ${user.id} for reaction ${emojiKey}`);
      }
    } catch (error) {
      logger.error('Error in RoleService.handleReactionAdd:', error);
    }
  }

  /**
   * Обрабатывает удаление реакции: если есть привязка, удаляет роль
   */
  public async handleReactionRemove(reaction: MessageReaction, user: User) {
    try {
      const message = reaction.message;
      if (!message.guild) return;
      const emojiKey = reaction.emoji.id ?? reaction.emoji.name;
      const [rows] = await this.pool.query<RowDataPacket[]>(
        'SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?',
        [message.id, emojiKey]
      );
      const recs = rows as ReactionRoleRecord[];
      if (recs.length === 0) return;
      const { role_id } = recs[0];
      const member = await message.guild.members.fetch(user.id);
      if (!member) return;
      if (member.roles.cache.has(role_id)) {
        await member.roles.remove(role_id);
        logger.info(`Removed role ${role_id} from user ${user.id} for removed reaction ${emojiKey}`);
      }
    } catch (error) {
      logger.error('Error in RoleService.handleReactionRemove:', error);
    }
  }

  /**
   * Создает привязку реакции к роли
   */
  public async createReactionRole(messageId: string, emoji: string, roleId: string) {
    try {
      await this.pool.query(
        'INSERT INTO reaction_roles (message_id, emoji, role_id) VALUES (?, ?, ?)',
        [messageId, emoji, roleId]
      );
      logger.info(`Created reaction role binding for message ${messageId}, emoji ${emoji}, role ${roleId}`);
    } catch (error) {
      logger.error('Error in RoleService.createReactionRole:', error);
      throw error;
    }
  }
}

export default new RoleService();
