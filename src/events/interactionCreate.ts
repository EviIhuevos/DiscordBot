import { Events, Interaction, GuildMember } from 'discord.js';
import { canExecute } from '../services/acl';
import logger from '../utils/logger';
import { ClientExt } from '../types'; // Расширенный тип клиента с коллекцией commands

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    // Обрабатываем только slash-команды
    if (!interaction.isChatInputCommand()) return;

    const client = interaction.client as ClientExt;
    const commandName = interaction.commandName;
    const command = client.commands.get(commandName);

    if (!command) {
      logger.warn(`Команда ${commandName} не найдена`);
      return;
    }

    // Проверка прав
    const member = interaction.member as GuildMember;
    if (!canExecute(member, commandName)) {
      return interaction.reply({
        content: 'У вас нет прав для выполнения этой команды.',
        ephemeral: true
      });
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Ошибка при выполнении команды ${commandName}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Произошла ошибка при выполнении команды.',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'Произошла ошибка при выполнении команды.',
          ephemeral: true
        });
      }
    }
  }
};
