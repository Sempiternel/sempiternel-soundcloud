const { ShardingManager } = require('discord.js');

require('dotenv').config();
const { DISCORD_TOKEN } = process.env;


const manager = new ShardingManager('./bot.js', { token: DISCORD_TOKEN });

manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));

manager.spawn();