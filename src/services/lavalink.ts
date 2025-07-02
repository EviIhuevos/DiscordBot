diff --git a/src/services/lavalink.ts b/src/services/lavalink.ts
index 2c46ad6fe883ddb1ef45a161f5a01e47639ca975..9e585780c15ebf50ff5225b3f81c8313cbe3be93 100644
--- a/src/services/lavalink.ts
+++ b/src/services/lavalink.ts
@@ -1,64 +1,66 @@
 import { Client } from 'discord.js';
 import { LavaShark, Track, Player } from 'lavashark';
 import logger from '../utils/logger';
 import config from '../utils/config';
 
-class LavalinkService {
-  public lavashark: LavaShark;
+class LavalinkService {
+  public lavashark: LavaShark;
+  private connected = false;
 
   constructor(client: Client) {
     this.lavashark = new LavaShark({
       nodes: [
         {
           hostname: config.lavalink.host,
           port: config.lavalink.port,
           password: config.lavalink.password,
           secure: false,
         }
       ],
       sendWS: (guildId, payload) => {
         const guild = client.guilds.cache.get(guildId);
         if (guild) guild.shard.send(payload);
       }
     });
 
     this.registerEvents();
 
     client.once('ready', async () => {
       try {
         await this.lavashark.start(client.user!.id);
         logger.info('🚀 lavashark инициализирован и подключается к node...');
       } catch (err: any) {
         logger.error(`❌ Ошибка при инициализации lavashark: ${err.message}`);
       }
     });
   }
 
   private registerEvents() {
-    this.lavashark.on('nodeConnect', (node) => {
-      logger.info(`✅ Lavalink node connected: ${node.options.hostname}:${node.options.port}`);
-    });
-
-    this.lavashark.on('nodeDisconnect', (node, reason) => {
-      logger.warn(`❌ Lavalink node disconnected: ${node.options.hostname}:${node.options.port} | ${reason}`);
-    });
+    this.lavashark.on('nodeConnect', (node) => {
+      this.connected = true;
+      logger.info(`✅ Lavalink node connected: ${node.options.hostname}:${node.options.port}`);
+    });
+
+    this.lavashark.on('nodeDisconnect', (node, reason) => {
+      this.connected = false;
+      logger.warn(`❌ Lavalink node disconnected: ${node.options.hostname}:${node.options.port} | ${reason}`);
+    });
 
     this.lavashark.on('trackStart', (player: Player, track: Track) => {
       logger.info(`🎶 Трек начался в гильдии ${player.guildId}: ${track.title}`);
     });
 
     this.lavashark.on('trackEnd', (player: Player, track: Track) => {
       logger.info(`⏹ Трек завершён в гильдии ${player.guildId}: ${track.title}`);
     });
 
     this.lavashark.on('error', (node, err) => {
       logger.error(`❌ Ошибка в node ${node.options.hostname}: ${err.message}`);
     });
   }
 
-public isConnected(): boolean {
-  console.log('Node state:', this.lavashark.nodes[0]?.state);
-  return this.lavashark.nodes.some(node => (node as any).state === 0);
-}
-}
+  public isConnected(): boolean {
+    return this.connected;
+  }
+}
 export default LavalinkService;
