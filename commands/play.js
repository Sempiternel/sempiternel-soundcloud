const { SlashCommandBuilder } = require('@discordjs/builders');
const {
	AudioPlayerStatus,
	StreamType,
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel,
	VoiceConnectionStatus,
} = require('@discordjs/voice');
const { MessageActionRow, MessageButton, MessageEmbed, Permissions } = require('discord.js');
const { FFmpeg, opus } = require('prism-media');
const scdl = require('soundcloud-downloader').create({ saveClientID: true });
const miniget = require('miniget');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);

const play = async guild => {
	guild.music.current = guild.music.queue.shift();
	const info = await scdl.getInfo(guild.music.current.url);
	const url = new URL(info.media.transcodings[0].url);
	url.searchParams.set('client_id', await scdl.getClientID());
	const body = await miniget(url.toString()).text();
	const media = JSON.parse(body);
	let options = [
		'-reconnect', '1',
		'-reconnect_streamed', '1',
		'-reconnect_delay_max', '5',
		'-ss', 0,
		'-i', media.url,
		'-analyzeduration', '0',
		'-loglevel', '0',
		'-f', 's16le',
		'-ar', '48000',
		'-ac', '2',
		'-vn',
	];
	if (guild.music.filter) options = options.concat(['-af', guild.music.filter]);
	const transcoder = new FFmpeg({ args: options });
	const stream = transcoder.pipe(new opus.Encoder({ rate: 48000, channels: 2, frameSize: 48 * 20 }));
	const resource = createAudioResource(stream, { inputType: StreamType.Opus });
	guild.music.player.play(resource);
	let nick = guild.music.current.title;
	if (nick.length > 32) nick = nick.substring(0, 32);
	if (guild.me.permissions.has(Permissions.FLAGS.CHANGE_NICKNAME)) guild.me.setNickname(nick);
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play a track on YouTube.')
		.addStringOption(option => option.setName('input').setDescription('The track to search on Youtube.').setRequired(true)),
	async execute(interaction) {
		if (!interaction.inGuild()) return interaction.reply({ content: 'You must be on a server to run this command.', ephemeral: true });
		await interaction.deferReply();

		const value = interaction.options.getString('input', true);
		const tracks = [];
		const row = new MessageActionRow();
		const embed = new MessageEmbed();

		if (scdl.isPlaylistURL(value)) {
			const info = await scdl.getSetInfo(value);
			row.addComponents(new MessageButton().setLabel('Playlist').setStyle('LINK').setURL(info.permalink_url));
			row.addComponents(new MessageButton().setLabel('User').setStyle('LINK').setURL(info.user.permalink_url));
			embed.setDescription(info.title).setThumbnail(info.artwork_url);
			for (const track of info.tracks) {
				if (track.streamable) {
					const artist = info.publisher_metadata && info.publisher_metadata.artist;
					tracks.push({ title: track.title, url: track.permalink_url, duration: Math.round(track.duration / 1000), artist });
				}
			}
			embed.addField('Tracks', tracks.length.toString());
		}
		else {
			let info;
			if (scdl.isValidUrl(value)) { info = await scdl.getInfo(value); }
			else {
				const result = await scdl.search({
					resourceType: 'tracks',
					query: value,
				});
				info = result.collection.find(item => item.duration == item.full_duration);
				if (!info) return interaction.editReply({ content: 'Could not find the track.', ephemeral: true });
			}
			row.addComponents(new MessageButton().setLabel('Track').setStyle('LINK').setURL(info.permalink_url));
			row.addComponents(new MessageButton().setLabel('User').setStyle('LINK').setURL(info.user.permalink_url));
			embed.setDescription(info.title).setThumbnail(info.artwork_url);
			const artist = info.publisher_metadata && info.publisher_metadata.artist;
			tracks.push({ title: info.title, url: info.permalink_url, duration: Math.round(info.duration / 1000), artist });
		}
		embed.addField('Duration', dayjs().second(tracks.reduce((previous, item) => previous + item.duration, 0)).fromNow(true));

		if (!interaction.guild.music) interaction.guild.music = {};
		if (!interaction.guild.music.queue) interaction.guild.music.queue = [];
		embed.setTitle(`Add in ${interaction.guild.music.queue.length + 1} position.`);

		const voiceChannel = interaction.member.voice.channel;
		if (!voiceChannel) return interaction.editReply({ content: 'You must be in a voice channel.', ephemeral: true });
		if (!voiceChannel.joinable) return interaction.editReply({ content: 'Unable to join this channel.', ephemeral: true });
		const botVoiceChannel = interaction.guild.me.voice.channel;
		if (botVoiceChannel && voiceChannel.id != botVoiceChannel.id) return interaction.editReply({ content: 'You must be in the same channel as the bot.', ephemeral: true });

		interaction.guild.music.queue = interaction.guild.music.queue.concat(tracks);
		if (interaction.guild.music.current) return interaction.editReply({ embeds: [embed], components: [row] });

		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: interaction.guild.id,
			adapterCreator: interaction.guild.voiceAdapterCreator,
		});
		connection.on(VoiceConnectionStatus.Disconnected, () => {
			connection.destroy();
			delete interaction.guild.music;
		});

		interaction.guild.music.player = createAudioPlayer();
		connection.subscribe(interaction.guild.music.player);
		interaction.guild.music.player.on(AudioPlayerStatus.Idle, () => {
			if (interaction.guild.music.loop) interaction.guild.music.queue.push(interaction.guild.music.current);
			if (interaction.guild.music && interaction.guild.music.queue && interaction.guild.music.queue.length) return play(interaction.guild);
			connection.disconnect();
		});
		play(interaction.guild);

		return interaction.editReply({ embeds: [embed.setTitle('Music playing')], components: [row] });
	},
};
