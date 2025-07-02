// src/commands/moderation/removerole.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Снять роль с пользователя')
    .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(true))
    .addRoleOption(opt => opt.setName('role').setDescription('Роль').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const role = interaction.options.getRole('role', true);
    const member = await interaction.guild!.members.fetch(user.id);

    if (!member.roles.cache.has(role.id)) {
      return interaction.reply({ content: 'У пользователя нет этой роли.', ephemeral: true });
    }

    await member.roles.remove(role.id);
    await interaction.reply(`Роль **${role.name}** удалена у пользователя **${user.tag}**.`);
  }
};
