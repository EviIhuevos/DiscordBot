// src/commands/music/queue.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { lavalinkService } from '../../bot';

export default {
  data: new SlashCommandBuilder().setName('queue').setDescription('Показать очередь треков'),
  async execute(interaction: ChatInputCommandInteraction) {
    const player: any = lavalinkService.lavashark.players.get(interaction.guildId!);
    const tracks: any[] = player?.queue?.tracks ?? [];
    if (!player || tracks.length === 0) {
      return interaction.reply({ content: 'Очередь пуста.', ephemeral: true });
    }
    const list = tracks
      .map((track: any, i: number) => `${i + 1}. ${track.title}`)
      .slice(0, 10)
      .join('\n');
    const embed = new EmbedBuilder()
      .setTitle('Очередь')
      .setDescription(
        list + (tracks.length > 10 ? `\n...и ещё ${tracks.length - 10}` : '')
      );
    await interaction.reply({ embeds: [embed] });
  },
};
