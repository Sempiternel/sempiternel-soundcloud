const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip the current track.'),
	async execute(interaction) {
		if (!interaction.inGuild()) return interaction.reply({ content: 'You must be on a server to run this command.', ephemeral: true });
		if (!interaction.guild.music) return interaction.reply({ content: 'No track is playing.', ephemeral: true });
		interaction.guild.music.player.emit(AudioPlayerStatus.Idle);
		return interaction.reply('The track has been skipped.');
	},
};
