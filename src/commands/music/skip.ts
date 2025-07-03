// src/commands/music/skip.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { lavalinkService } from '../../bot';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Пропустить трек')
    .addStringOption((opt) =>
      opt
        .setName('target')
        .setDescription('Номер трека в очереди или all для всех')
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const player: any = lavalinkService.lavashark.players.get(interaction.guildId!);
    if (!player) {
      return interaction.reply({ content: 'Плеер не найден.', flags: MessageFlags.Ephemeral });
    }

    lavalinkService.clearLeave(interaction.guildId!);

    const target = interaction.options.getString('target');
    const queue: any[] = player.queue?.tracks ?? [];
    const current = player.queue?.current;

    if (target === 'all') {
      queue.splice(0, queue.length);
      if (typeof player.stopTrack === 'function') {
        await player.stopTrack();
      } else if (typeof player.stop === 'function') {
        await player.stop();
      }
      lavalinkService.scheduleLeave(interaction.guildId!);
      return interaction.reply('Очередь очищена. Ожидаю новых треков 60 секунд.');
    }

    if (!target) {
      if (!current) {
        return interaction.reply({ content: 'Нет трека для пропуска.', flags: MessageFlags.Ephemeral });
      }
      if (typeof player.stopTrack === 'function') {
        await player.stopTrack();
      } else if (typeof player.stop === 'function') {
        await player.stop();
      }
      if (queue.length > 0) {
        await player.play();
      }
      return interaction.reply(`Пропущен: **${current.title}**`);
    }

    const index = parseInt(target, 10);
    if (isNaN(index) || index < 1 || index > queue.length) {
      return interaction.reply({ content: 'Неверный номер трека.', flags: MessageFlags.Ephemeral });
    }
    const removed = queue.splice(index - 1, 1)[0];
    return interaction.reply(`Удалён из очереди: **${removed.title}**`);

  }
};
