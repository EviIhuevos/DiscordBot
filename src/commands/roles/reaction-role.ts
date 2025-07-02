// src/commands/roles/reaction-role.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import roleService from '../../services/roleService';
import logger from '../../utils/logger';

export default {
  data: new SlashCommandBuilder()
    .setName('reaction-role')
    .setDescription('Настройка выдачи роли по реакции')
    .addStringOption(opt =>
      opt.setName('message_id')
        .setDescription('ID сообщения, на котором будет роль')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('emoji')
        .setDescription('Emoji (символ или ID) для реакции')
        .setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName('role')
        .setDescription('Роль, которая выдается')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const messageId = interaction.options.getString('message_id', true);
    const emoji = interaction.options.getString('emoji', true);
    const role = interaction.options.getRole('role', true);

    try {
      await roleService.createReactionRole(messageId, emoji, role.id);
      await interaction.reply({
        content: `Привязка реакции ${emoji} к роли ${role.name} на сообщении ${messageId} создана. 🤖`,
        ephemeral: true,
      });
    } catch (error) {
      logger.error('Error in reaction-role command:', error);
      await interaction.reply({
        content: 'Не удалось создать привязку реакции к роли.',
        ephemeral: true,
      });
    }
  }
};
