// src/commands/moderation/kick.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Кикнуть пользователя')
    .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Причина')),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'Не указана';
    const member = await interaction.guild!.members.fetch(user.id);

    if (!member.kickable) {
      return interaction.reply({ content: 'Не могу кикнуть этого пользователя.', ephemeral: true });
    }

    await member.kick(reason);
    await interaction.reply(`Пользователь **${user.tag}** был кикнут. Причина: ${reason}`);
  }
};
