// src/commands/moderation/ban.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Забанить пользователя')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Пользователь для бана')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Причина бана')),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'Не указана';
    const member = await interaction.guild!.members.fetch(user.id);

    if (!member.bannable) {
      return interaction.reply({ content: 'Не могу забанить этого пользователя.', ephemeral: true });
    }

    await member.ban({ reason });
    await interaction.reply(`Пользователь **${user.tag}** был забанен. Причина: ${reason}`);
  }
};
