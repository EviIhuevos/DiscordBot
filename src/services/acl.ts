import { GuildMember } from 'discord.js';
import config from '../utils/config';
import { ROLE_GROUPS, COMMAND_PERMISSIONS } from '../config/default';

/**
 * Проверяет, может ли участник выполнять указанную команду
 * @param member GuildMember
 * @param commandName Имя команды (без префикса)
 */
export function canExecute(member: GuildMember, commandName: string): boolean {
  // Если участник — бот, запрещаем
  if (member.user.bot) return false;

  // Админ всегда может
  const adminRoleId = config.adminRoleId;
  if (member.roles.cache.has(adminRoleId)) {
    return true;
  }

  // Получаем группы для команды
  const groups = COMMAND_PERMISSIONS[commandName];
  if (!groups) {
    // Если команда не прописана — запрещаем
    return false;
  }

  // Команда доступна всем
  if (groups.length === 0) {
    return true;
  }

  // Проходим по группам и проверяем роли
  for (const group of groups) {
    const allowedRoles = ROLE_GROUPS[group];
    if (!allowedRoles) continue;
    for (const roleId of allowedRoles) {
      if (member.roles.cache.has(roleId)) {
        return true;
      }
    }
  }

  return false;
}
