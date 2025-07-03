// src/commands/music/resume.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { lavalinkService } from '../../bot';

export default {
  data: new SlashCommandBuilder().setName('resume').setDescription('Возобновить воспроизведение'),
  async execute(interaction: ChatInputCommandInteraction) {
	const player = lavalinkService.lavashark.players.get(interaction.guildId!);
    if (!player || !player.paused) {
      return interaction.reply({ content: 'Нечего возобновлять.', flags: MessageFlags.Ephemeral });
    }
    player.pause(false);
    await interaction.reply('Воспроизведение возобновлено.');
  },
};
