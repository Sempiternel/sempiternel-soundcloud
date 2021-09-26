const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const lyricsFinder = require('lyrics-finder');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lyrics')
		.setDescription('Find the lyrics of the current track.'),
	async execute(interaction) {
		if (!interaction.inGuild()) return interaction.reply({ content: 'You must be on a server to run this command.', ephemeral: true });
		if (!interaction.guild.music) return interaction.reply({ content: 'No track is playing.', ephemeral: true });
		await interaction.deferReply();
		const current = interaction.guild.music.current;
		return lyricsFinder(current.artist ? current.artist : '', current.title)
			.then(lyrics => {
				const lyricsArray = lyrics.match(/(.|[\r\n]){1,4096}/g);
				const embeds = lyricsArray.map(data => new MessageEmbed().setDescription(data));
				interaction.editReply({ embeds: [embeds.shift()] });
				for (const embed of embeds) interaction.followUp({ embeds: [embed] });
			}).catch(() => interaction.editReply({ content: 'Could not find the lyrics.', ephemeral: true }));
	},
};
