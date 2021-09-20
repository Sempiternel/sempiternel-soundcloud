const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Clear the current playlist.'),
	async execute(interaction) {
		if (interaction.guild.music && interaction.guild.music.queue && interaction.guild.music.queue.length) {
			delete interaction.guild.music.queue;
			return interaction.reply('The current playlist is deleted.');
		}
		return interaction.reply({ content: 'The playlist is empty.', ephemeral: true });
	},
};
