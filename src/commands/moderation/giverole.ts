// src/commands/moderation/giverole.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('giverole')
    .setDescription('Выдать роль пользователю')
    .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(true))
    .addRoleOption(opt => opt.setName('role').setDescription('Роль').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const role = interaction.options.getRole('role', true);
    const member = await interaction.guild!.members.fetch(user.id);

    if (member.roles.cache.has(role.id)) {
      return interaction.reply({ content: 'У пользователя уже есть эта роль.', ephemeral: true });
    }

    await member.roles.add(role.id);
    await interaction.reply(`Роль **${role.name}** выдана пользователю **${user.tag}**.`);
  }
};
