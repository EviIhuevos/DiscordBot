// src/commands/music/skip.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { lavalinkService } from '../../bot';

export default {
  data: new SlashCommandBuilder().setName('skip').setDescription('Пропустить текущий трек'),
  async execute(interaction: ChatInputCommandInteraction) {
    const player: any = lavalinkService.lavashark.players.get(interaction.guildId!);
    const current = player?.queue?.current;
    if (!player || !current) {
      return interaction.reply({ content: 'Нет трека для пропуска.', flags: MessageFlags.Ephemeral });
    }
    if (typeof player.stopTrack === 'function') {
      await player.stopTrack();
    } else if (typeof player.stop === 'function') {
      await player.stop();
    }
    if (player.queue.tracks.length > 0) {
      await player.play();
    }
    await interaction.reply(`Пропущен: **${current.title}**`);
  },
};
