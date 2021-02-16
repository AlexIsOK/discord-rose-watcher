const Worker = require('discord-rose/worker');
const fetch = require("node-fetch");
const {inspect} = require("util");

const worker = new Worker();

const auth = require("./drose").token;

/**
 * Get the latest version of a specific middleware
 * @param name the name of the middleware
 * @return {Promise<String>} the version of the middleware
 */
async function getMiddlewareVersion(name) {
    return (await fetch("https://registry.npmjs.org/@discord-rose/" + name)
        .then(res => res.json()))["dist-tags"].latest;
}

/**
 * Get the GitHub repository of the middleware
 * @param name the name of the middleware
 * @returns {Promise<string>} the URL of the repo with a trailing `.git`
 */
async function getMiddlewareGithub(name) {
    return (await fetch("https://registry.npmjs.org/@discord-rose/" + name)
        .then(res => res.json())).repository.url.substr(4); //starts with `git+`
}

/**
 * Get the maintainers of the package as an array
 * @param name the name of the middleware
 * @returns {Promise<Array>} the array of maintainers
 */
async function getMiddlewareMaintainers(name) {
    const maintainersRaw = (await fetch("https://registry.npmjs.org/@discord-rose/" + name)
        .then(res => res.json())).maintainers;
    
    return maintainersRaw.map(m => m.name);
}

//the base registry url for api requests
const BASE_REGISTRY_URL = "https://registry.npmjs.com";

//base for middleware packages
const BASE_MW = "https://www.npmjs.com/package/@discord-rose";

//zero width characters for embeds
const ZERO_WIDTH_CHARACTER = "\u200E";

//the middlewares as a map (YES, A MAP, NOT AN OBJECT XYOYU)
const MIDDLEWARES = {
    "cooldown": "cooldown-middleware",
    "permission": "permissions-middleware",
    "admin": "admin-middleware",
    "flag": "flags-middleware"
}

//add commands
worker.commands
    .setPrefix("=")
    .add({ //get the current version of d-rose and middleware
        command: 'version',
        aliases: [
            "versions"
        ],
        exec: (async ctx => {
            //base version for d-rose
            let dRoseBase = (await fetch(`${BASE_REGISTRY_URL}/discord-rose`).then(res => res.json()))["dist-tags"].latest;
            
            //middleware versions
            let cooldown = await getMiddlewareVersion("cooldown-middleware");
            let permissions = await getMiddlewareVersion("permissions-middleware");
            let admin = await getMiddlewareVersion("admin-middleware");
            let flags = await getMiddlewareVersion("flags-middleware");
            
            //remove a leading s from the arg if it has one
            if(ctx.args[0] && ctx.args[0].toLowerCase().endsWith("s"))
                ctx.args[0] = ctx.args[0].substr(0, ctx.args[0].length - 1)
            
            //check if the user is checking for a specific package
            //this will do something else if the package exists
            if(ctx.args[0] && MIDDLEWARES[ctx.args[0].toLowerCase()]) {
                const name = ctx.args[0].toLowerCase();
                
                //info for the embeds
                const maintainers = await getMiddlewareMaintainers(MIDDLEWARES[name]);
                const version = `[${await getMiddlewareVersion(MIDDLEWARES[name])}](${BASE_MW}/${MIDDLEWARES[name]})`;
                const github = await getMiddlewareGithub(MIDDLEWARES[name]);
                
                //send the thingy so people can see the lastest version i guess
                await ctx.embed
                    .title(ctx.args[0])
                    .description(`**__${name.charAt(0).toUpperCase()}${name.slice(1)}__**`) //capitalize first letter
                    .field("Version", version, true)
                    .field("Repository", `[GitHub](${github})`, true)
                    .field("Maintainers", `${maintainers.join(", ")}`, true)
                    .color(0x00FF00)
                    .send(true);
                return;
            }
            
            //post the latest versions of the packages along with
            //a link to the package for convenience
            await ctx.embed
                .title("Latest Versions")
                .field("Discord Rose",`[${dRoseBase}](https://www.npmjs.com/package/discord-rose)`, false)
                .field(ZERO_WIDTH_CHARACTER, "**__Middlewares__**", false)
                .field("Cooldown", `[${cooldown}](https://www.npmjs.com/package/@discord-rose/cooldown-middleware)`, true)
                .field("Permissions", `[${permissions}](https://www.npmjs.com/package/@discord-rose/permissions-middleware)`, true)
                .field("Admin", `[${admin}](https://www.npmjs.com/package/@discord-rose/admin-middleware)`, true)
                .field("Flags", `[${flags}](https://www.npmjs.com/package/@discord-rose/flags-middleware)`, true)
                .color(0x00FF00)
                .send(true);
        })
    })
    .add({ //get the ping of the bot
        command: 'ping',
        aliases: [
            "pings", "pong", "pongs"
        ],
        exec: (async ctx => {
            let ping = worker.shards.first().ping;
            
            await ctx.embed
                .title("Pong!")
                .description(`Current ping is ${ping}ms.`)
                .thumbnail(ping < 20 ? "https://media.discordapp.net/attachments/696529468247769151/811006605827113000/unknown.png" : null)
                .color(0x00FF00)
                .send(true);
        })
    })
    .add({ //get the daily, weekly, and yearly downloads for d-rose
        command: 'downloads',
        aliases: [
            "download"
        ],
        exec: (async ctx => {
            
            //downloads object
            let lastDay = await fetch("https://api.npmjs.org/downloads/point/last-day/discord-rose").then(res => res.json());
            let lastWeek = await fetch("https://api.npmjs.org/downloads/point/last-week/discord-rose").then(res => res.json());
            let lastYear = await fetch("https://api.npmjs.org/downloads/point/last-year/discord-rose").then(res => res.json());
            
            //display the downloads
            await ctx.embed.title("Downloads for Discord Rose")
                .description("```\n" +
                    "Last day:  " + lastDay.downloads + "\n" +
                    "Last week: " + lastWeek.downloads + "\n" +
                    "Last year: " + lastYear.downloads + "\n" +
                    "```")
                .color(0x00FF00)
                .send(true);
        })
    })
    .add({ //eval command (why bother documenting this)
        command: 'eval',
        exec: (async ctx => {
            console.log(ctx.member.user.id);
            if(ctx.member.user.id === "541763812676861952") {
                try {
                    let e = await eval(ctx.args.join(" "));
                    let inspected = inspect(e);
                    inspected = inspected.replace(new RegExp(auth.token, 'g'), "bruh").slice(0, 1990)
                    await console.log(inspected);
                    await ctx.reply("```\n" + inspected + "\n```");
                } catch(e) {
                    await console.error(e);
                    await ctx.reply("bruh fix this:\n```\n" + e + "\n```");
                }
            } else {
                await ctx.reply("cringe");
            }
        })
    })
    .add({ //help command
        command: 'help',
        exec: (async ctx => {
            ctx.embed
                .title("Discord Rose Watcher")
                .description("The following commands are available for Discord Rose Watcher\n" +
                    "```\n" +
                    "=downloads - get the amount of downloads for d-rose.\n" +
                    "=versions [middleware] - get the current versions for d-rose and middleware.\n" +
                    "=ping - get the ping of the bot.\n" +
                    "=help - get the commands for the bot.\n" +
                    "```\n" +
                    "Commands also have non-plural versions to avoid confusion.")
        })
    });
