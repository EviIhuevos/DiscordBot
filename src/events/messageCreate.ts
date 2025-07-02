import { Events, Message } from 'discord.js';
import xpService from '../services/xpService';

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.author.bot || !message.guild) return;
    await xpService.addXpForMessage(message);
  }
};
