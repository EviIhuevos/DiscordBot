// src/commands/help.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  CacheType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags
} from 'discord.js';
import { canExecute } from '../services/acl';
import { Command } from '../types';

// Размер страницы
const PAGE_SIZE = 6;

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Показать список доступных команд'),

  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const client = interaction.client as any;
    const commands: Command[] = Array.from((client.commands as Map<string, Command>).values());
    const member = interaction.member;

    // Фильтрация команд по правам
    const available = commands.filter(cmd => {
      try {
        return canExecute(interaction.member as any, cmd.data.name);
      } catch {
        return false;
      }
    });

    // Формируем список строк
    const entries = available.map(cmd => `**/${cmd.data.name}** — ${cmd.data.description}`);
    if (entries.length === 0) {
      return interaction.editReply('У вас нет доступных команд.');
    }

    // Разбиваем на страницы
    const pages: string[][] = [];
    for (let i = 0; i < entries.length; i += PAGE_SIZE) {
      pages.push(entries.slice(i, i + PAGE_SIZE));
    }
    let pageIndex = 0;

    // Функция для создания embed страницы
    const generateEmbed = (index: number) => {
      return new EmbedBuilder()
        .setTitle('Справка по командам')
        .setDescription(pages[index].join('\n'))
        .setFooter({ text: `Страница ${index + 1} из ${pages.length}` });
    };

    // Создаем кнопки
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◀️ Назад')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Вперед ▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pages.length === 1)
      );

    // Посылаем сообщение
    const message = await interaction.editReply({
      embeds: [generateEmbed(pageIndex)],
      components: [row]
    });

    // Собираем клики
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    collector.on('collect', async btn => {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({ content: 'Это сообщение не для вас.', flags: MessageFlags.Ephemeral });
      }
      // Обновляем индекс
      if (btn.customId === 'prev' && pageIndex > 0) pageIndex--;
      if (btn.customId === 'next' && pageIndex < pages.length - 1) pageIndex++;

      // Обновляем состояние кнопок
      row.components[0].setDisabled(pageIndex === 0);
      row.components[1].setDisabled(pageIndex === pages.length - 1);

      await btn.update({
        embeds: [generateEmbed(pageIndex)],
        components: [row]
      });
    });

    collector.on('end', async () => {
      // Убираем кнопки после таймаута
      await interaction.editReply({ components: [] });
    });
  }
};
