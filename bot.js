const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const { DISCORD_TOKEN } = process.env;
const winston = require('winston');

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
	ws: {
		properties: {
			$os: 'Android',
			$browser: 'Discord Android',
		},
	},
});

client.logger = winston.createLogger({
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: 'log' }),
	],
	format: winston.format.printf(log => `[${log.level.toUpperCase()}] - ${log.message}`),
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) client.once(event.name, (...args) => event.execute(...args));
	else client.on(event.name, (...args) => event.execute(...args));
}

client.on('debug', m => client.logger.log('debug', m));
client.on('warn', m => client.logger.log('warn', m));
client.on('error', m => client.logger.log('error', m));

client.on('shardReady', id => client.user.setPresence({
	activities: [{
		name: `shard ${id}`,
		type: 'WATCHING',
	}],
}));

process.on('uncaughtException', error => client.logger.log('error', error));

process.on('exit', () => client.destroy());

process.on('SIGINT', () => process.exit());
process.on('SIGUSR1', () => process.exit());
process.on('SIGUSR2', () => process.exit());

client.login(DISCORD_TOKEN);
