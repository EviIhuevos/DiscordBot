// src/commands/moderation/warn.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
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
    .setName('warn')
    .setDescription('Выдать предупреждение пользователю')
    .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Причина').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);

    await pool.query(
      'INSERT INTO warnings (user_id, moderator_id, reason) VALUES (?, ?, ?)',
      [user.id, interaction.user.id, reason]
    );

    await interaction.reply(`Пользователю **${user.tag}** выдано предупреждение. Причина: ${reason}`);
  }
};
