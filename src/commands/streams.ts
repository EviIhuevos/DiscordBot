// src/commands/streams.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, CacheType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { createPool } from 'mysql2/promise';
import config from '../utils/config';
import logger from '../utils/logger';
import streamService from '../services/streamService';

// Настройка подключения к БД
const pool = createPool({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

export default {
  data: new SlashCommandBuilder()
    .setName('streams')
    .setDescription('Управление настройками стримов')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommandGroup(group =>
      group
        .setName('twitch')
        .setDescription('Управление Twitch-каналами')
        .addSubcommand(cmd =>
          cmd
            .setName('add')
            .setDescription('Добавить Twitch-канал для отслеживания')
            .addStringOption(opt => opt.setName('login').setDescription('Логин канала').setRequired(true))
            .addChannelOption(opt => opt.setName('announce_channel').setDescription('Канал для уведомлений').setRequired(true))
        )
        .addSubcommand(cmd =>
          cmd
            .setName('remove')
            .setDescription('Удалить Twitch-канал из отслеживания')
            .addStringOption(opt => opt.setName('login').setDescription('Логин канала').setRequired(true))
        )
    )
    .addSubcommandGroup(group =>
      group
        .setName('youtube')
        .setDescription('Управление YouTube-каналами')
        .addSubcommand(cmd =>
          cmd
            .setName('add')
            .setDescription('Добавить YouTube-канал для отслеживания')
            .addStringOption(opt => opt.setName('channel_id').setDescription('ID YouTube-канала').setRequired(true))
            .addChannelOption(opt => opt.setName('announce_channel').setDescription('Канал для уведомлений').setRequired(true))
        )
        .addSubcommand(cmd =>
          cmd
            .setName('remove')
            .setDescription('Удалить YouTube-канал из отслеживания')
            .addStringOption(opt => opt.setName('channel_id').setDescription('ID YouTube-канала').setRequired(true))
        )
    )
    .addSubcommand(cmd =>
      cmd
        .setName('setrole')
        .setDescription('Установить роль для пользователя при стриме')
        .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Роль, выдаваемая при стриме').setRequired(true))
    )
    .addSubcommand(cmd =>
      cmd
        .setName('list')
        .setDescription('Показать текущие настройки стримов')
    ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    await interaction.deferReply({ ephemeral: true });

    try {
      if (group === 'twitch') {
        const login = interaction.options.getString('login', true);
        if (sub === 'add') {
          const announceChannel = interaction.options.getChannel('announce_channel', true);
          await pool.query(
            'INSERT INTO twitch_channels (guild_id, channel_login, announce_channel_id) VALUES (?, ?, ?)',
            [interaction.guildId, login.toLowerCase(), announceChannel.id]
          );
          await interaction.editReply(`Twitch-канал **${login}** добавлен для отслеживания.`);
        } else if (sub === 'remove') {
          await pool.query(
            'DELETE FROM twitch_channels WHERE guild_id = ? AND channel_login = ?',
            [interaction.guildId, login.toLowerCase()]
          );
          await interaction.editReply(`Twitch-канал **${login}** удалён из отслеживания.`);
        }
      } else if (group === 'youtube') {
        const channelId = interaction.options.getString('channel_id', true);
        if (sub === 'add') {
          const announceChannel = interaction.options.getChannel('announce_channel', true);
          await pool.query(
            'INSERT INTO youtube_channels (guild_id, channel_id, announce_channel_id) VALUES (?, ?, ?)',
            [interaction.guildId, channelId, announceChannel.id]
          );
          await interaction.editReply(`YouTube-канал **${channelId}** добавлен для отслеживания.`);
        } else if (sub === 'remove') {
          await pool.query(
            'DELETE FROM youtube_channels WHERE guild_id = ? AND channel_id = ?',
            [interaction.guildId, channelId]
          );
          await interaction.editReply(`YouTube-канал **${channelId}** удалён из отслеживания.`);
        }
      } else if (!group && sub === 'setrole') {
        const user = interaction.options.getUser('user', true);
        const role = interaction.options.getRole('role', true);
        await streamService.setUserStreamRole(user.id, role.id);
        await interaction.editReply(`Роль **${role.name}** будет выдаваться **${user.tag}** при стриме.`);
      } else if (!group && sub === 'list') {
        const [twitchRows] = await pool.query<any[]>(
          'SELECT channel_login, announce_channel_id FROM twitch_channels WHERE guild_id = ?',
          [interaction.guildId]
        );
        const [ytRows] = await pool.query<any[]>(
          'SELECT channel_id, announce_channel_id FROM youtube_channels WHERE guild_id = ?',
          [interaction.guildId]
        );
        const embed = new EmbedBuilder()
          .setTitle('Настройки стримов')
          .addFields(
            { name: 'Twitch каналы', value: twitchRows.length > 0 ? twitchRows.map(r => r.channel_login).join('\n') : 'Не добавлены', inline: true },
            { name: 'YouTube каналы', value: ytRows.length > 0 ? ytRows.map(r => r.channel_id).join('\n') : 'Не добавлены', inline: true }
          );
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply('Неверная команда.');
      }
    } catch (error) {
      logger.error('Error in streams command:', error);
      await interaction.editReply('Произошла ошибка при обработке команды.');
    }
  }
};
