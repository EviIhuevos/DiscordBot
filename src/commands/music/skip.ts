// src/commands/music/skip.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('skip').setDescription('Пропустить текущий трек'),
  async execute(interaction: ChatInputCommandInteraction) {
    const clientAny = interaction.client as any;
    const player = clientAny.lavalink.manager.players.get(interaction.guildId!);
    if (!player || !player.queue.current) {
      return interaction.reply({ content: 'Нет трека для пропуска.', ephemeral: true });
    }
    const current = player.queue.current;
    player.stop();
    await interaction.reply(`Пропущен: **${current.title}**`);
  },
};
