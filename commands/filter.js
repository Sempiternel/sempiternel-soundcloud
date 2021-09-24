const { SlashCommandBuilder } = require('@discordjs/builders');

const filters = {
	'8D': 'apulsator=hz=0.08',
	bassboost: 'bass=g=10,dynaudnorm=f=150',
	vaporwave: 'aresample=48000,asetrate=48000*0.8',
	nightcore: 'aresample=48000,asetrate=48000*1.25',
	asetrate: 'asetrate',
	deesser: 'deesser=i=1',
	phaser: 'aphaser=in_gain=0.4',
	treble: 'treble=g=5',
	tremolo: 'tremolo',
	normalizer: 'dynaudnorm=f=200',
	vibrato: 'vibrato=f=6.5',
	karaoke: 'stereotools=mlev=0.1',
	reverse: 'areverse',
	gate: 'agate',
	mcompand: 'mcompand',
	echo: 'aecho=0.8:0.9:1000:0.3',
	earwax: 'earwax',
	surround: 'surround',
	haas: 'haas',
	mono: 'pan=mono|c0=.5*c0+.5*c1',
	clear: 'clear',
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('filter')
		.setDescription('Add a filter to the track.')
		.addStringOption(option => option.setName('input').setDescription('The filter you want.').setRequired(true).addChoices(Object.keys(filters).map(name => [name, filters[name]]))),
	async execute(interaction) {
		if (!interaction.inGuild()) return interaction.reply({ content: 'You must be on a server to run this command.', ephemeral: true });
		if (!interaction.guild.music) return interaction.reply({ content: 'No track is playing.', ephemeral: true });
		const value = interaction.options.getString('input', true);
		if (value == filters.clear) delete interaction.guild.music.filter;
		else interaction.guild.music.filter = value;
		return interaction.reply('The filter has been applied.\nNote: The filter will only apply from the next track.');
	},
};
