// src/events/ready.ts
import { Events, Client } from 'discord.js';
import logger from '../utils/logger';
import twitchWatcher from '../services/twitchWatcher';
import youtubeWatcher from '../services/youtubeWatcher';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    logger.info(`Бот запущен как ${client.user?.tag}`);

    // ▶️ Запускаем мониторинг Twitch и YouTube
    twitchWatcher.start(client);
    youtubeWatcher.start(client);
  }
};
