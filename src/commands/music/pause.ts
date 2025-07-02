// src/commands/music/pause.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('pause').setDescription('Поставить паузу'),
  async execute(interaction: ChatInputCommandInteraction) {
    const clientAny = interaction.client as any;
    const player = clientAny.lavalink.manager.players.get(interaction.guildId!);
    if (!player || !player.playing) {
      return interaction.reply({ content: 'Нечего паузить.', ephemeral: true });
    }
    player.pause(true);
    await interaction.reply('Воспроизведение приостановлено.');
  },
};
