const process = require('process');

module.exports = {
	name: 'restart',
	private: true,
	permissions: ['MANAGE_ROLES'],
	description: 'description_restart',
	command: async object => {
		process.nextTick(() => object.client.emit('exit', 1));
		return object.client.utils.getMessage(object.channel, 'reboot_success');
	},
	checkPermission: object => {
		if (object.client.config.owners.includes(object.user.id))
			return true;
		return false;
	}
};