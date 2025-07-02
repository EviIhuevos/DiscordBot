// src/commands/index.ts
import fs from 'fs';
import path from 'path';
import { Collection } from 'discord.js';
import { Command } from '../types';

/**
 * Загружает все команды из папок внутри src/commands
 * @returns Collection<commandName, Command>
 */
export function loadCommands(): Collection<string, Command> {
  const commands = new Collection<string, Command>();
  const commandsPath = path.resolve(__dirname);

  // Загружаем команды из корня директории
  const rootFiles = fs
    .readdirSync(commandsPath)
    .filter(
      (f) =>
        (f.endsWith('.ts') || f.endsWith('.js')) &&
        f !== 'index.ts' &&
        f !== 'index.js'
    );
  for (const file of rootFiles) {
    const filePath = path.join(commandsPath, file);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const command: Command = require(filePath).default;
    if ('data' in command && 'execute' in command) {
      commands.set(command.data.name, command);
    }
  }

  // Проходим по всем папкам в src/commands
  fs.readdirSync(commandsPath).forEach(folder => {
    const folderPath = path.join(commandsPath, folder);
    const stats = fs.statSync(folderPath);

    if (stats.isDirectory()) {
      // Загружаем файлы .ts/.js
      const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const command: Command = require(filePath).default;
        if ('data' in command && 'execute' in command) {
          commands.set(command.data.name, command);
        }
      }
    }
  });

  return commands;
}
