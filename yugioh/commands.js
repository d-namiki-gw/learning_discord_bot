const newsCommand = require('./commands/news.js');
const searchCommand = require('./commands/search.js');

module.exports = {
    commands: [newsCommand, searchCommand],
};

