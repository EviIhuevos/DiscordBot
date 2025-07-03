import { ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { lavalinkService } from '../../bot';
import logger from '../../utils/logger';

export default {
  data: {
    name: 'play',
    description: 'Воспроизводит трек или выводит текущий',
    options: [
      {
        name: 'query',
        type: 3,
        description: 'Название, ссылка или плейлист YouTube',
        required: false,
      },
    ],
  },
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      if (!lavalinkService.isConnected()) {
        await interaction.reply({ content: '❌ Lavalink node не подключена. Попробуйте позже.', flags: MessageFlags.Ephemeral });
        return;
      }

      const query = interaction.options.getString('query');

      const member = interaction.member as GuildMember;

      if (!member.voice.channel) {
        await interaction.reply({ content: '❌ Вы должны быть в голосовом канале!', flags: MessageFlags.Ephemeral });
        return;
      }

      if (!query) {
        const player: any = lavalinkService.lavashark.players.get(interaction.guildId!);
        const current = player?.queue?.current;
        if (!player || !current) {
          await interaction.reply({ content: 'Сейчас ничего не играет.', flags: MessageFlags.Ephemeral });
          return;
        }
        await interaction.reply({ content: `🎶 Сейчас играет: **${current.title}**` });
        return;
      }

      let searchQuery = query;
      if (!/^https?:\/\//i.test(query)) {
        // Если не ссылка, ищем на YouTube
        searchQuery = `ytsearch:${query}`;
      }


      const searchResult = await lavalinkService.lavashark.search(searchQuery).catch(() => null);

      if (!searchResult || !Array.isArray(searchResult.tracks) || searchResult.tracks.length === 0) {
        await interaction.reply({ content: '❌ Трек не найден!', flags: MessageFlags.Ephemeral });
        return;
      }

      let player: any = lavalinkService.lavashark.players.get(interaction.guildId!);
      if (!player) {
        player = lavalinkService.lavashark.createPlayer({
          guildId: interaction.guildId!,
          voiceChannelId: member.voice.channel.id,
          selfDeaf: true,
        });
      }

      await player.connect();
      lavalinkService.clearLeave(interaction.guildId!);

      const wasEmpty = !player.playing && player.queue.tracks.length === 0;
      let message: string;

      if (searchResult.playlistInfo && searchResult.tracks.length > 1) {
        for (const t of searchResult.tracks) {
          player.queue.add(t);
        }
        if (!player.playing) {
          await player.play();
        }
        message = `▶️ Добавлен плейлист: **${searchResult.playlistInfo.name}** (${searchResult.tracks.length} треков)`;
      } else {
        const track = searchResult.tracks[0];

        player.queue.add(track);

        if (!player.playing) {
          await player.play();
        }

        message = wasEmpty
          ? `▶️ Воспроизвожу: **${track.title}**`
          : `▶️ Добавлено в очередь: **${track.title}**`;
      }

      await interaction.reply({ content: message });

    } catch (err: any) {
      logger.error('Ошибка при выполнении команды play:', err);
      if (interaction.replied) return;
      await interaction.reply({ content: '❌ Произошла ошибка при попытке воспроизвести трек.', flags: MessageFlags.Ephemeral });
    }
  },
};
