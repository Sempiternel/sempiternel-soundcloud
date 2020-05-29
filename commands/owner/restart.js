/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   restart.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ahallain <ahallain@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2020/04/21 05:37:01 by ahallain          #+#    #+#             */
/*   Updated: 2020/05/22 17:24:33 by ahallain         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const utils = require('../../utils.js');
const config = require('../../config.json');

module.exports = {
	name: 'restart',
	aliases: ['reboot', 'rb', 'reload', 'rl'],
	description: 'Restart the bot.',
	message: async (message, object) => {
		if (!config.owners.includes(message.author.id)) {
			utils.sendMessage(message.channel, object.dictionary, 'error_not_owner');
			return;
		}
		await utils.sendMessage(message.channel, object.dictionary, 'restart_success');
		message.client.emit('exit', 2);
	}
};