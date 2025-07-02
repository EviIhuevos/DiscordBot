// src/types/index.ts
import { Client, Collection } from 'discord.js';
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

/**
 * Интерфейс команды для Discord-бота
 */
export interface Command {
  /** Данные slash-команды */
  data: SlashCommandBuilder;
  /** Функция выполнения команды */
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

/**
 * Расширенный клиент Discord-клиента с коллекцией команд
 */
export interface ClientExt extends Client {
  /** Коллекция зареганных команд */
  commands: Collection<string, Command>;
}
