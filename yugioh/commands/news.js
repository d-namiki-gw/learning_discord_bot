const { SlashCommandBuilder } = require('discord.js');
const { getRssFeed } = require("../common/rss.js");
const { max } = require('lodash');

const url = "https://yugioh-starlight.com/archives/cat_408874.xml";

const maxArticles = 5;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('flying')
		.setDescription('フラゲ情報を取得します'),
	execute: async function(interaction) {
		await interaction.reply('フラゲ情報を取得するぜ☆');
		const feeds = await getRssFeed(url);
		await interaction.followUp(
			"最新フラゲ情報だぜ☆\n" + 
			feeds
			 	.slice(0, maxArticles)
				.map((v) => `${v.title}\n${v.link}`)
				.join("\n\n")
		);
	},
};
