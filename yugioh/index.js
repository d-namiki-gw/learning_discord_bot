const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const {commands} = require('./commands.js');
//const newsCommand = require('./commands/news.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, c => {
	console.log(` ${c.user.tag}でログイン`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    commands.forEach(async command => {
        if (interaction.commandName === command.data.name) {
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'エラーが発生しました', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'error', ephemeral: true });
                }
            }
        }
    });
});

client.login(token);