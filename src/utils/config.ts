import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  botToken: string;
  lavalink: {
    host: string;
    port: number;
    password: string;
  };
  twitch: {
    clientId: string;
    clientSecret: string;
  };
  youtube: {
    apiKey: string;
  };
  mysql: {
    host: string;
    user: string;
    password: string;
    database: string;
  };
  adminRoleId: string;
}

const config: Config = {
  botToken: process.env.BOT_TOKEN as string,
  lavalink: {
    host: process.env.LAVALINK_HOST as string,
    port: Number(process.env.LAVALINK_PORT),
    password: process.env.LAVALINK_PASSWORD as string,
  },
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID as string,
    clientSecret: process.env.TWITCH_CLIENT_SECRET as string,
  },
  youtube: {
    apiKey: process.env.YT_API_KEY as string,
  },
  mysql: {
    host: process.env.MYSQL_HOST as string,
    user: process.env.MYSQL_USER as string,
    password: process.env.MYSQL_PASSWORD as string,
    database: process.env.MYSQL_DATABASE as string,
  },
  adminRoleId: process.env.ADMIN_ROLE_ID as string,
};

// Валидация обязательных полей
for (const [key, value] of Object.entries(config)) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Configuration error: Missing environment variable for '${key}'`);
  }
}

export default config;
