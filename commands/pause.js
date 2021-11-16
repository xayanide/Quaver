const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { checks } = require('../enums.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('Pause Quaver.'),
	checks: [checks.GUILD_ONLY, checks.ACTIVE_SESSION, checks.IN_VOICE, checks.IN_SESSION_VOICE],
	permissions: {
		user: [],
		bot: [],
	},
	async execute(interaction) {
		const player = interaction.client.music.players.get(interaction.guildId);
		if (player.paused) {
			await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setDescription('The player is already paused.')
						.setColor('DARK_RED'),
				],
				ephemeral: true,
			});
			return;
		}
		player.pause(true);
		await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setDescription('The player has been paused.')
					.setColor('#f39bff'),
			],
		});
	},
};