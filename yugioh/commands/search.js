const { SlashCommandBuilder, ButtonBuilder, ButtonStyle,ActionRowBuilder } = require('discord.js');
const puppeteer = require('puppeteer');
const _ = require( 'lodash' );

// ランク/レベルは0があるため0～13
const maxLevel = 14;
const maxAttr = 7;
const maxChunck = 5;

const baseUrl = "https://www.db.yugioh-card.com";

const searchOption = (command =>{
	[...Array(maxAttr).keys()].forEach(n => 
		command.addStringOption(addAttr(n + 1))
	);
	[...Array(maxLevel).keys()].forEach(n => 
		command.addIntegerOption(addLevel(n + 1))
	);
	return command;
});

const addLevel = (n) => (option) =>
	option.setName(`level_rank${n}`)
		.setDescription(`レベル ランク指定${n}`)
		.addChoices(
				{ name: `レベル0 ランク0`, value: 0},
				{ name: `レベル1 ランク1`, value: 1},
				{ name: `レベル2 ランク2`, value: 2},
				{ name: `レベル3 ランク3`, value: 3},
				{ name: `レベル4 ランク4`, value: 4},
				{ name: `レベル5 ランク5`, value: 5},
				{ name: `レベル6 ランク6`, value: 6},
				{ name: `レベル7 ランク7`, value: 7},
				{ name: `レベル8 ランク8`, value: 8},
				{ name: `レベル9 ランク9`, value: 9},
				{ name: `レベル10 ランク10`, value: 10},
				{ name: `レベル11 ランク11`, value: 11},
				{ name: `レベル12 ランク12`, value: 12},
				{ name: `レベル13 ランク13`, value: 13},
		);

const addAttr = (n) => (option) =>
	option
	.setName(`attr${n}`)
	.setDescription(`属性${n}`)
	.addChoices(
			{ name: '炎', value: "14"},
			{ name: '水', value: "13"},
			{ name: '風', value: "16"},
			{ name: '地', value: "15"},
			{ name: '光', value: "11"},
			{ name: '闇', value: "12"},
			{ name: '神', value: "17"},
	);


module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('公式DBでカードを検索します')
		.addSubcommand(subcommand => {
			subcommand
				.setName('cardname')
				.setDescription('カード名で検索します')
				.addStringOption(option =>
					option
					.setName('keyword')
					.setDescription('キーワード')
				)
			return searchOption(subcommand)
		})
		.addSubcommand(subcommand => {
			subcommand
				.setName('cardtext')
				.setDescription('カードテキストで検索します')
				.addStringOption(option =>
					option
					.setName('keyword')
					.setDescription('キーワード')
				)
			return searchOption(subcommand)
		}),
	execute: async function(interaction) {
		console.log(interaction.options);
		const url = createURL(interaction.options);
		await interaction.reply(`検索するぜ☆\nURL: ${url}`);
		const cardDatas = await scraping(url);
		const buttons = cardDatas.map(v => createButton(v.name, v.path));
		const chunk = _.chunk(buttons, maxChunck).map(v => new ActionRowBuilder().addComponents(...v));
		/*
		 NOTE
		 1回の投稿で最大5グループしか表示できないが現状は問題無い
		 もしそれ以上の内容を返したくなった場合はその分だけfollowUpする
		*/
		await interaction.followUp({
			content: `検索結果がでたぜ☆\n`,
			components: chunk.slice(0, 5)
		});
	},
};

const createButton = (label, path) => 
	new ButtonBuilder()
		.setLabel(label)
		.setURL(`${baseUrl}${path}`)
		.setStyle(ButtonStyle.Link);

const createURL = (options) => {
	const params = [];
	if (options.getSubcommand() === 'cardname') params.push('stype=1');
	else if (options.getSubcommand() === 'cardtext') params.push('stype=2');
	const keyword = options.getString('keyword');
	if (keyword) params.push(`keyword=${keyword}`);

	[...Array(maxAttr).keys()].forEach(v => {
		const n = v + 1;
		const attr = options.getString(`attr${n}`);
		if (attr) params.push(`attr=${attr}`);
	});
	[...Array(maxLevel).keys()].forEach(v => {
		const attr = options.getInteger(`level_rank${v}`);
		if (attr != null) params.push(`level${attr}=on`);
	});

	const searchBase = '/yugiohdb/card_search.action?ope=1&sess=1&request_locale=ja&sort=21&';
	return `${baseUrl}${searchBase}` + params.join('&');
};

const scraping = async (url) => {
	const browser = await puppeteer.launch({headless: "new"});
	const page = await browser.newPage();
	await page.goto(url);
	
	const cardDatas = await page.$$eval('div#card_list > div.t_row ', el => 
		el.map(v => {
			const name = v.querySelector("dl.flex_1 > .box_card_name > .card_name").innerHTML;
			const path = v.querySelector("input.link_value").getAttribute("value");
			return {name, path};
		})
	);

	await page.close();
	return cardDatas;
};
