/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   8ball.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ahallain <ahallain@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2020/04/24 17:32:55 by ahallain          #+#    #+#             */
/*   Updated: 2020/06/11 20:35:19 by ahallain         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const utils = require('../../utils.js');

module.exports = {
	name: '8ball',
	aliases: ['answer', 'ball'],
	description: 'Answer a question.',
	privateMessage: true,
	message: (message, object) => {
		if (!object.args.length) {
			utils.sendMessage(message.channel, object.dictionary, 'error_invalid_format', {
				format: `${object.prefix}8ball <question...>`
			});
			return;
		}
		let question = '';
		for (const word of object.args) {
			if (question.length)
				question += ' ';
			question += word;
		}
		const score = utils.getUserScore(message.author) % 100 + utils.getStringScore(question);
		utils.sendMessage(message.channel, object.dictionary, score % 2 ? 'yes' : 'no');
	}
};