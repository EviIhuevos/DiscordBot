// src/commands/moderation/mute.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import logger from '../../utils/logger';

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Замьютить пользователя (роль Muted должна быть создана заранее)')
    .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(true))
    .addIntegerOption(opt => opt.setName('duration').setDescription('Длительность в минутах')),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const duration = interaction.options.getInteger('duration');
    const member = await interaction.guild!.members.fetch(user.id);

    const muteRole = interaction.guild!.roles.cache.find(r => r.name.toLowerCase() === 'muted');
    if (!muteRole) {
      return interaction.reply({ content: 'Роль **Muted** не найдена на сервере.', ephemeral: true });
    }

    if (member.roles.cache.has(muteRole.id)) {
      return interaction.reply({ content: 'Пользователь уже замьючен.', ephemeral: true });
    }

    await member.roles.add(muteRole.id);
    await interaction.reply(`Пользователь **${user.tag}** замьючен${duration ? ` на ${duration} мин.` : ''}.`);

    if (duration && duration > 0) {
      setTimeout(async () => {
        const refreshed = await interaction.guild!.members.fetch(user.id);
        if (refreshed.roles.cache.has(muteRole.id)) {
          await refreshed.roles.remove(muteRole.id);
          logger.info(`Auto-unmute: ${user.id}`);
        }
      }, duration * 60 * 1000);
    }
  }
};
