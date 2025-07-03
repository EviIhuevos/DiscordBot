// src/commands/moderation/warnings.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { createPool } from 'mysql2/promise';
import config from '../../utils/config';

const pool = createPool({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database
});

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Показать предупреждения пользователя')
    .addUserOption(opt => opt.setName('user').setDescription('Пользователь')),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const [rows] = await pool.query<any[]>(
      'SELECT moderator_id, reason, timestamp FROM warnings WHERE user_id = ?',
      [target.id]
    );

    const embed = new EmbedBuilder()
      .setTitle(`Предупреждения — ${target.tag}`)
      .setColor('Orange')
      .setDescription(
        rows.length
          ? rows.map(r =>
              `• <@${r.moderator_id}>: ${r.reason} (${new Date(r.timestamp).toLocaleString()})`
            ).join('\n')
          : 'Нет предупреждений'
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
