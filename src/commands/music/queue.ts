// src/commands/music/queue.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { lavalinkService } from '../../bot';

export default {
  data: new SlashCommandBuilder().setName('queue').setDescription('Показать очередь треков'),
  async execute(interaction: ChatInputCommandInteraction) {
    const player: any = lavalinkService.lavashark.players.get(interaction.guildId!);
    if (!player || !player.queue?.length) {
      return interaction.reply({ content: 'Очередь пуста.', ephemeral: true });
    }
    const list = (player.queue as any[])
      .map((track: any, i: any) => `${i + 1}. ${track.title}`)
      .slice(0, 10)
      .join('\n');
    const embed = new EmbedBuilder()
      .setTitle('Очередь')
      .setDescription(list + (player.queue.length > 10 ? `\n...и ещё ${player.queue.length - 10}` : ''));
    await interaction.reply({ embeds: [embed] });
  },
};
