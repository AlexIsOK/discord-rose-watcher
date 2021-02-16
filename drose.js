#!

const Master = require("discord-rose/master");
const path = require("path");

const token = process.env.token;

const master = new Master(path.resolve("./worker.js"), {
    token: token,
    shards: 1, //the bot will only be in 1 or 2 servers so sharding doesn't matter
    cache: {
        guilds: true,
        roles: true,
        channels: true,
        self: true, // caches own member object, good for permissions
        members: true, // be warned, these two options
        messages: false
    }
});

master.start().then(() => console.log("Started d-rose watcher."));

module.exports = {
    token
}