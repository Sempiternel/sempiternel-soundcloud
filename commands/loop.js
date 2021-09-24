const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('loop')
		.setDescription('Toggle the current playlist loop.'),
	async execute(interaction) {
		if (!interaction.inGuild()) return interaction.reply({ content: 'You must be on a server to run this command.', ephemeral: true });
		if (!interaction.guild.music) return interaction.reply({ content: 'No track is playing.', ephemeral: true });
		interaction.guild.music.loop = !interaction.guild.music.loop;
		if (interaction.guild.music.loop) return interaction.reply('The playlist is now looping.');
		return interaction.reply('The playlist is no longer looping.');
	},
};
