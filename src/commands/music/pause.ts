// src/commands/music/pause.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { lavalinkService } from '../../bot';

export default {
  data: new SlashCommandBuilder().setName('pause').setDescription('Поставить паузу'),
  async execute(interaction: ChatInputCommandInteraction) {
    const player = lavalinkService.lavashark.players.get(interaction.guildId!);
    if (!player || !player.playing) {
      return interaction.reply({ content: 'Нечего паузить.', flags: MessageFlags.Ephemeral });
    }
    player.pause(true);
    await interaction.reply('Воспроизведение приостановлено.');
  },
};
