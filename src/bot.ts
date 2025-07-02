import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import {
  Client,
  GatewayIntentBits,
  Events,
  Interaction,
  MessageReaction,
  User,
} from 'discord.js';
import config from './utils/config';
import logger from './utils/logger';
import { loadCommands } from './commands';
import interactionCreateEvent from './events/interactionCreate';
import readyEvent from './events/ready';
import messageCreateEvent from './events/messageCreate';
import voiceStateUpdateEvent from './events/voiceStateUpdate';
import messageReactionAddEvent from './events/messageReactionAdd';
import presenceUpdateEvent from './events/presenceUpdate';
import LavalinkService from './services/lavalink';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
  ],
});

const lavalinkService = new LavalinkService(client);

// Raw events для lavashark (голосовые изменения)
client.on('raw', (packet) => {
  lavalinkService.lavashark.handleVoiceUpdate(packet);
});

async function main() {
  const commands = loadCommands();
  (client as any).commands = commands;

  const rest = new REST({ version: '10' }).setToken(config.botToken);
  const commandData = commands.map((cmd) => cmd.data);

  client.once(Events.ClientReady, async () => {
    logger.info(`Бот запущен как ${client.user?.tag}`);
    try {
      await rest.put(
        Routes.applicationCommands(client.user!.id),
        { body: commandData }
      );
      logger.info('Команды успешно зарегистрированы');
    } catch (err) {
      logger.error('Ошибка при регистрации команд:', err);
    }
    await readyEvent.execute(client);
  });

  client.on(Events.InteractionCreate, (i: Interaction) =>
    interactionCreateEvent.execute(i)
  );
  client.on(Events.MessageCreate, messageCreateEvent.execute);
  client.on(Events.VoiceStateUpdate, voiceStateUpdateEvent.execute);
  client.on(Events.MessageReactionAdd, (reaction, user) =>
    messageReactionAddEvent.execute(reaction as MessageReaction, user as User)
  );
  client.on(Events.PresenceUpdate, presenceUpdateEvent.execute);

  client.login(config.botToken).catch((err) =>
    logger.error('Ошибка при логине бота:', err)
  );
}

main().catch((err) => logger.error('Fatal error при запуске:', err));

// экспортируем для других модулей
export { client, lavalinkService };
