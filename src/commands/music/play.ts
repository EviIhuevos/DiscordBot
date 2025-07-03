import { ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { lavalinkService } from '../../bot';
import logger from '../../utils/logger';

export default {
  data: {
    name: 'play',
    description: 'Воспроизводит трек',
    options: [
      {
        name: 'query',
        type: 3,
        description: 'YouTube ссылка или поисковой запрос',
        required: true,
      },
    ],
  },
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      if (!lavalinkService.isConnected()) {
        await interaction.reply({ content: '❌ Lavalink node не подключена. Попробуйте позже.', flags: MessageFlags.Ephemeral });
        return;
      }

      const query = interaction.options.getString('query', true);

      let searchQuery = query;
      if (!/^https?:\/\//i.test(query)) {
        // Если не ссылка, ищем на YouTube
        searchQuery = `ytsearch:${query}`;
      }

      const member = interaction.member as GuildMember;

      if (!member.voice.channel) {
        await interaction.reply({ content: '❌ Вы должны быть в голосовом канале!', flags: MessageFlags.Ephemeral });
        return;
      }


      const searchResult = await lavalinkService.lavashark.search(searchQuery);

      if (!searchResult || !Array.isArray(searchResult.tracks) || searchResult.tracks.length === 0) {
        await interaction.reply({ content: '❌ Трек не найден!', flags: MessageFlags.Ephemeral });
        return;
      }

      const track = searchResult.tracks[0];

        let player = lavalinkService.lavashark.players.get(interaction.guildId!);
        if (!player) {
                player = lavalinkService.lavashark.createPlayer({
                        guildId: interaction.guildId!,
                        voiceChannelId: member.voice.channel.id,
                        selfDeaf: true,
                });
        }

        // Ensure lavalink player is connected to the voice channel
        await player.connect();

        const wasEmpty = !player.playing && player.queue.tracks.length === 0;

        if (player.queue && typeof player.queue.add === 'function') {
                player.queue.add(track);
        }

        if (!player.playing) {
                await player.play();
        }

      const message = wasEmpty
        ? `▶️ Воспроизвожу: **${track.title}**`
        : `▶️ Добавлено в очередь: **${track.title}**`;
      await interaction.reply({ content: message });

    } catch (err: any) {
      logger.error('Ошибка при выполнении команды play:', err);
      if (interaction.replied) return;
      await interaction.reply({ content: '❌ Произошла ошибка при попытке воспроизвести трек.', flags: MessageFlags.Ephemeral });
    }
  },
};
