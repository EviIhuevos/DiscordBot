// src/commands/music/stop.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('stop').setDescription('Остановить воспроизведение и очистить очередь'),
  async execute(interaction: ChatInputCommandInteraction) {
    const clientAny = interaction.client as any;
    const player = clientAny.lavalink.manager.players.get(interaction.guildId!);
    if (!player) {
      return interaction.reply({ content: 'Плеер не найден.', ephemeral: true });
    }
    player.destroy();
    await interaction.reply('Воспроизведение остановлено и очередь очищена.');
  },
};
