// src/commands/music/stop.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { lavalinkService } from '../../bot';

export default {
  data: new SlashCommandBuilder().setName('stop').setDescription('Остановить воспроизведение и очистить очередь'),
  async execute(interaction: ChatInputCommandInteraction) {
	const player = lavalinkService.lavashark.players.get(interaction.guildId!);
    if (!player) {
      return interaction.reply({ content: 'Плеер не найден.', flags: MessageFlags.Ephemeral });
    }
  uipwbl-codex/fix-multiple-playback-errors
    lavalinkService.clearLeave(interaction.guildId!);
    player.destroy();

    player.destroy();
   main
    await interaction.reply('Воспроизведение остановлено и очередь очищена.');
  },
};
