const fs = require('fs');
const prism = require('prism-media');
const { MessageEmbed } = require('discord.js');
const Cache = require('./cache.js');
const webhook = require('./commands/configuration/webhook.js');

const loadedFiles = new Cache();
const dictionaries = {};

if (fs.existsSync('dictionaries'))
	for (const folder of fs.readdirSync('dictionaries')) {
		dictionaries[folder] = {};
		for (const file of fs.readdirSync(`dictionaries/${folder}`)) {
			const dictionary = require(`./dictionaries/${folder}/${file}`);
			Object.assign(dictionaries[folder], dictionary);
		}
	}

class Utils {
	constructor(client) {
		this.client = client;
		this.path = `data/${this.client.user.id}`;
	}
	savFile(path, object) {
		if (!object)
			throw 'object undefined';
		if (loadedFiles.get(path) == object)
			return object;
		path = `${this.path}/${path}`;
		if (!fs.existsSync(path))
			fs.mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
		fs.writeFileSync(path, JSON.stringify(object));
		loadedFiles.set(path, object);
		return object;
	}
	readFile(path) {
		path = `${this.path}/${path}`;
		if (loadedFiles.get(path))
			return loadedFiles.get(path);
		if (fs.existsSync(path)) {
			const parsed = JSON.parse(fs.readFileSync(path));
			loadedFiles.set(path, parsed);
			return parsed;
		}
		return {};
	}
	deleteFile(path) {
		path = `${this.path}/${path}`;
		if (!fs.statSync(path).isDirectory()) {
			fs.unlinkSync(path);
			return;
		}
		for (const filename of fs.readdirSync(path))
			this.deleteFile(`${path}/${filename}`);
		fs.rmdirSync(path);
	}
	createEmbed(description) {
		const embed = new MessageEmbed();
		if (description)
			embed.setDescription(description);
		embed.setColor(this.client.config.color);
		return embed;
	}
	getDictionary(object) {
		let dictionary = object.dictionary;
		if (!dictionary) {
			let language = object.language;
			if (!language)
				language = this.client.config.language;
			dictionary = dictionaries[language];
			object.dictionary = dictionary;
		}
		Object.assign(dictionary, dictionaries.errors);
		return dictionary;
	}
	getMessage(channel, key, object = {}) {
		let dictionary;
		if (channel.type == 'dm')
			dictionary = this.getDictionary(channel.recipient);
		else
			dictionary = this.getDictionary(channel.guild);
		let message = dictionary[key];
		if (!message) {
			message = dictionary.error_no_message;
			object = { key };
		}
		for (const key of Object.keys(object))
			message = `${message}`.replace(new RegExp(`<${key}>`, 'g'), object[key]);
		if (message.length > 2048)
			return (this.getMessage(channel, 'error_too_large_message'));
		return message;
	}
	async sendEmbed(channel, embed, force = false) {
		if (channel.type != 'dm' && !channel.permissionsFor(channel.guild.me).has('EMBED_LINKS')) {
			const description = channel.client.utils.getMessage(channel, 'error_bot_no_permission', { permission: 'EMBED_LINKS' });
			channel.send(description);
			return;
		}
		if (embed.author && embed.author.iconURL && !embed.author.url)
			embed.author.url = embed.author.iconURL;
		if (!force && channel.type != 'dm' && channel.guild.webhook) {
			try {
				if (channel.guild.webhook.channelID != channel.id)
					await channel.guild.webhook.edit({ channel });
				const message = await channel.guild.webhook.send(embed);
				return message;
			} catch {
				delete channel.guild.webhook;
			}
		}
		return await channel.send(embed);
	}
	sendMessage(channel, key, object, force) {
		const description = this.getMessage(channel, key, object);
		const embed = this.createEmbed(description);
		return this.sendEmbed(channel, embed, force);
	}
	replaceEmbed(message, embed) {
		if (message.channel.type != 'dm' && !message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS')) {
			const description = message.client.utils.getMessage(message.channel, 'error_bot_no_permission', { permission: 'EMBED_LINKS' });
			message.edit(description);
			return;
		}
		if (embed.author && embed.author.iconURL && !embed.author.url)
			embed.author.url = embed.author.iconURL;
		return message.edit(embed);
	}
	replaceMessage(message, key, object) {
		const description = this.getMessage(message.channel, key, object);
		const embed = this.createEmbed(description);
		return this.replaceEmbed(message, embed);
	}
	generateTranscoder(url, { start = 0, args } = {}) {
		let options = [
			'-reconnect', '1',
			'-reconnect_streamed', '1',
			'-reconnect_delay_max', '5',
			'-ss', start,
			'-i', url,
			'-analyzeduration', '0',
			'-loglevel', '0',
			'-f', 's16le',
			'-ar', '48000',
			'-ac', '2'
		];
		if (args)
			options = options.concat(args);
		return new prism.FFmpeg({ args: options });
	}
	playeTranscoder(player, trancoder) {
		const opus = trancoder.pipe(new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 48 * 20 }));
		const dispatcher = player.createDispatcher({
			type: 'opus',
			bitrate: 48
		}, { opus });
		opus.pipe(dispatcher);
		return dispatcher;
	}
	getUserFromMention(mention) {
		const matches = mention.match(/^<@!?(\d+)>$/);
		if (!matches)
			return this.client.users.fetch(mention).catch(() => { });
		const id = matches[1];
		return this.client.users.fetch(id);
	}
	createCache(limit) {
		return new Cache(limit);
	}
}

module.exports = Utils;