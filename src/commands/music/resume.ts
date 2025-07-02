// src/commands/music/resume.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('resume').setDescription('Возобновить воспроизведение'),
  async execute(interaction: ChatInputCommandInteraction) {
    const clientAny = interaction.client as any;
    const player = clientAny.lavalink.manager.players.get(interaction.guildId!);
    if (!player || !player.paused) {
      return interaction.reply({ content: 'Нечего возобновлять.', ephemeral: true });
    }
    player.pause(false);
    await interaction.reply('Воспроизведение возобновлено.');
  },
};
