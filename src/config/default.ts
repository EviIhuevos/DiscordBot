export const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID || 'YOUR_ADMIN_ROLE_ID';

// Группы ролей: ключ — имя группы, значение — массив Discord Role IDs
export const ROLE_GROUPS: Record<string, string[]> = {
  moderators: ['MOD_ROLE_ID_1', 'MOD_ROLE_ID_2'],
  music: ['DJ_ROLE_ID'],
  streams: ['STREAMS_ROLE_ID'],
  xpAdmins: ['XP_ADMIN_ROLE_ID'],
  // Добавляйте свои группы ролей
};

// Разрешения на команды: ключ — имя команды (без префикса), значение — массив групп
export const COMMAND_PERMISSIONS: Record<string, string[]> = {
  // Модерация
  ban: ['moderators'],
  kick: ['moderators'],
  mute: ['moderators'],
  warn: ['moderators'],
  giverole: ['moderators'],
  removerole: ['moderators'],

  // Музыка
  play: ['music'],
  stop: ['music'],
  pause: ['music'],
  skip: ['music'],
  queue: ['music'],
  volume: ['music'],

  // Reaction Roles
  reactionRoleCreate: ['moderators'],

  // Потоки
  streamsAdd: ['streams'],
  streamsRemove: ['streams'],
  streamsSetRole: ['streams'],

  // XP/левелинг
  xpAdd: ['xpAdmins'],
  xpRemove: ['xpAdmins'],
  xpSetLevel: ['xpAdmins'],
  xpBlacklist: ['xpAdmins'],
  xpInfo: [], // доступно всем

  // Помощь
  help: [], // доступно всем
};
