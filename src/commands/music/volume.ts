// src/commands/music/volume.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Установить громкость (0-100)')
    .addIntegerOption(opt => opt.setName('level').setDescription('Уровень громкости').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const clientAny = interaction.client as any;
    const vol = interaction.options.getInteger('level', true);
    if (vol < 0 || vol > 100) {
      return interaction.reply({ content: 'Громкость должна быть от 0 до 100.', ephemeral: true });
    }
    const player = clientAny.lavalink.manager.players.get(interaction.guildId!);
    if (!player) {
      return interaction.reply({ content: 'Плеер не найден.', ephemeral: true });
    }
    player.setVolume(vol);
    await interaction.reply(`Громкость установлена: **${vol}%**`);
  },
};
