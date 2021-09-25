const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

require('dotenv').config();
const { DISCORD_TOKEN } = process.env;

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(DISCORD_TOKEN);

(async () => {
	try {
		await rest.put(Routes.applicationCommands('705376114540806174'), { body: commands });
		console.log('Successfully registered application commands.');
	}
	catch (error) { console.error(error); }
})();
