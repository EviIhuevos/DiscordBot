import { Events, MessageReaction, User } from 'discord.js';
import roleService from '../services/roleService';

export default {
  name: Events.MessageReactionAdd,
  async execute(reaction: MessageReaction, user: User) {
    if (user.bot) return;
    await roleService.handleReactionAdd(reaction, user);
  }
};
