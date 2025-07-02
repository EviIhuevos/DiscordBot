import { Events, VoiceState } from 'discord.js';
import xpService from '../services/xpService';

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState: VoiceState, newState: VoiceState) {
    await xpService.addXpForVoice(oldState, newState);
  }
};
