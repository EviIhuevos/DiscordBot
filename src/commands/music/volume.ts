// src/commands/music/volume.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { lavalinkService } from '../../bot';

export default {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Установить громкость (0-100)')
    .addIntegerOption(opt => opt.setName('level').setDescription('Уровень громкости').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
	const vol = interaction.options.getInteger('level', true);
    if (vol < 0 || vol > 100) {
      return interaction.reply({ content: 'Громкость должна быть от 0 до 100.', flags: MessageFlags.Ephemeral });
    }
    const player: any = lavalinkService.lavashark.players.get(interaction.guildId!);
    if (!player) {
      return interaction.reply({ content: 'Плеер не найден.', flags: MessageFlags.Ephemeral });
    }
    // lavashark typings may not expose setVolume, but it exists at runtime
    if (typeof player.setVolume === 'function') {
      await player.setVolume(vol);
    } else {
      (player as any).setVolume?.(vol);
    }
    await interaction.reply(`Громкость установлена: **${vol}%**`);
  },
};
