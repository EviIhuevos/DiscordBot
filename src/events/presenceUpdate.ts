import { Events, Presence } from 'discord.js';
import streamService from '../services/streamService';

export default {
  name: Events.PresenceUpdate,
  async execute(oldPresence: Presence | null, newPresence: Presence) {
    await streamService.handlePresenceUpdate(oldPresence, newPresence);
  }
};
