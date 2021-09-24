const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Show track queue.')
		.addIntegerOption(option => option.setName('page').setDescription('The queue page.')),
	async execute(interaction) {
		if (!interaction.inGuild()) return interaction.reply({ content: 'You must be on a server to run this command.', ephemeral: true });
		if (!interaction.guild.music) return interaction.reply({ content: 'No track is playing.', ephemeral: true });
		const embed = new MessageEmbed();
		const current = interaction.guild.music.current;
		embed.addField('Now Playing', `[${current.title}](${current.url}) \`${dayjs().second(current.duration).fromNow(true)}\``);
		if (interaction.guild.music.queue && interaction.guild.music.queue.length) {
			let page = interaction.options.getInteger('page');
			if (!page) page = 1;
			if (page < 1) page = 1;
			const page_max = Math.ceil(interaction.guild.music.queue.length / 15);
			if (page > page_max) page = page_max;
			let index = (page - 1) * 15;
			const items = interaction.guild.music.queue.slice(index, page * 15);
			embed.setDescription(`Up Next:\n${items.map(item => `\`${++index}.\` [${item.title}](${item.url}) \`${dayjs().second(item.duration).fromNow(true)}\``).join('\n')}`);
			embed.setFooter(`Page: ${page}/${page_max} | ${dayjs().second(interaction.guild.music.queue.reduce((previous, item) => previous + item.duration, 0)).fromNow(true)}`);
		}
		return interaction.reply({ embeds: [embed], ephemeral: true });
	},
};
