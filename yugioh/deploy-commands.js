const { REST, Routes } = require('discord.js');

const {commands} = require('./commands.js');

const { applicationId, guildId, token } = require('./config.json');
const rest = new REST({ version: '10' }).setToken(token);

// Discordサーバーにコマンドを登録
(async () => {
    try {
        const commandsJson = commands.map(command => command.data.toJSON());
        await rest.put(
            Routes.applicationGuildCommands(applicationId, guildId),
            { body: commandsJson },
        );
        console.log('サーバー固有のコマンドが登録されました！');
    } catch (error) {
        console.error('コマンドの登録中にエラーが発生しました:', error);
    }
})();
