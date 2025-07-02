// src/commands/xp/xp.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  CacheType,
  AttachmentBuilder
} from 'discord.js';
import xpService from '../../services/xpService';
import { createCanvas, loadImage, registerFont } from 'canvas';
import config from '../../utils/config';

// Регистрируем шрифт для корректного отображения текста
registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', {
  family: 'DejaVu Sans'
});

// Регистрация команд
export default {
  data: new SlashCommandBuilder()
    .setName('xp')
    .setDescription('Управление и информация по XP')
    // Группа админских команд
    .addSubcommandGroup(group =>
      group
        .setName('admin')
        .setDescription('Административные команды XP')
        .addSubcommand(cmd =>
          cmd
            .setName('add')
            .setDescription('Добавить XP пользователю')
            .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(true))
            .addIntegerOption(opt => opt.setName('amount').setDescription('Количество XP').setRequired(true))
            .addStringOption(opt => opt.setName('reason').setDescription('Причина'))
        )
        .addSubcommand(cmd =>
          cmd
            .setName('remove')
            .setDescription('Убрать XP у пользователя')
            .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(true))
            .addIntegerOption(opt => opt.setName('amount').setDescription('Количество XP').setRequired(true))
            .addStringOption(opt => opt.setName('reason').setDescription('Причина'))
        )
        .addSubcommand(cmd =>
          cmd
            .setName('setlevel')
            .setDescription('Установить уровень пользователю')
            .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(true))
            .addIntegerOption(opt => opt.setName('level').setDescription('Новый уровень').setRequired(true))
        )
        .addSubcommand(cmd =>
          cmd
            .setName('blacklist-add')
            .setDescription('Добавить пользователя в чёрный список XP')
            .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(true))
        )
        .addSubcommand(cmd =>
          cmd
            .setName('blacklist-remove')
            .setDescription('Убрать пользователя из чёрного списка XP')
            .addUserOption(opt => opt.setName('user').setDescription('Пользователь').setRequired(true))
        )
    )
    // Информация для всех
    .addSubcommand(cmd =>
      cmd
        .setName('info')
        .setDescription('Показать XP и уровень пользователя')
        .addUserOption(opt => opt.setName('user').setDescription('Пользователь (по умолчанию вы)'))
    ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();
    // Админ-команды
    if (group === 'admin') {
      await interaction.deferReply({ ephemeral: true });
      const user = interaction.options.getUser('user', true);
      const userId = user.id;
      const reason = interaction.options.getString('reason') || 'Не указана';
      try {
        if (sub === 'add') {
          const amount = interaction.options.getInteger('amount', true);
          await xpService.addXp(userId, amount, `Admin: ${reason}`);
          await interaction.editReply(`Добавлено ${amount} XP пользователю **${user.tag}**.`);
        } else if (sub === 'remove') {
          const amount = interaction.options.getInteger('amount', true);
          await xpService.removeXp(userId, amount, `Admin: ${reason}`);
          await interaction.editReply(`Убрано ${amount} XP у пользователя **${user.tag}**.`);
        } else if (sub === 'setlevel') {
          const level = interaction.options.getInteger('level', true);
          await xpService.setLevel(userId, level);
          await interaction.editReply(`Установлен уровень ${level} для пользователя **${user.tag}**.`);
        } else if (sub === 'blacklist-add') {
          await xpService.blacklistUser(userId);
          await interaction.editReply(`Пользователь **${user.tag}** добавлен в черный список XP.`);
        } else if (sub === 'blacklist-remove') {
          await xpService.unblacklistUser(userId);
          await interaction.editReply(`Пользователь **${user.tag}** удален из черного списка XP.`);
        } else {
          await interaction.editReply('Неизвестная команда.');
        }
      } catch (error) {
        console.error(error);
        await interaction.editReply('Произошла ошибка при выполнении команды.');
      }
      return;
    }

    // Команда info
    if (sub === 'info') {
      await interaction.deferReply();
      const target = interaction.options.getUser('user') || interaction.user;
      const info = await xpService.getInfo(target.id);
      const xp = info?.xp ?? 0;
      const level = info?.level ?? 0;
      // Вычисление прогресса
      const currentThreshold = 100 * level * level;
      const nextThreshold = 100 * (level + 1) * (level + 1);
      const xpInLevel = xp - currentThreshold;
      const xpForNext = nextThreshold - currentThreshold;

      // Создаем канву
      const width = 400;
      const height = 180;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Фон
      ctx.fillStyle = '#2f3136';
      ctx.fillRect(0, 0, width, height);

      // Аватар
      const avatarURL = target.displayAvatarURL({ extension: 'png', size: 128 });
      const avatar = await loadImage(avatarURL);
      const avatarSize = 80;
      ctx.save();
      ctx.beginPath();
      ctx.arc(90, 90, avatarSize / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 50, 50, avatarSize, avatarSize);
      ctx.restore();

      // Текст
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "DejaVu Sans"';
      ctx.fillText(`${target.tag}`, 160, 70);
      ctx.font = '16px "DejaVu Sans"';
      ctx.fillText(`XP: ${xp}`, 160, 100);
      ctx.fillText(`Level: ${level}`, 160, 120);

      // Прогресс-бар
      const barX = 160;
      const barY = 130;
      const barWidth = 200;
      const barHeight = 20;
      // Фон бара
      ctx.fillStyle = '#40444b';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      // Заполненная часть
      const percent = xpInLevel / xpForNext;
      ctx.fillStyle = '#43b581';
      ctx.fillRect(barX, barY, barWidth * percent, barHeight);
      // Текст прогресса
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px "DejaVu Sans"';
      ctx.fillText(`${xpInLevel} / ${xpForNext}`, barX + barWidth / 2 - 30, barY + barHeight - 4);

      // Отправка изображения
      const buffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(buffer, { name: 'xp-card.png' });
      await interaction.editReply({ files: [attachment] });
    }
  }
};
