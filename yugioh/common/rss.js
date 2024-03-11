const Parser = require("rss-parser");
module.exports = {
    getRssFeed: async (url) => {
        const parser = new Parser();
        const feeds = await parser.parseURL(url);
        return feeds.items;
    }
};

