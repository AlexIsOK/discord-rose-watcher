const Worker = require('discord-rose/worker');
const fetch = require("node-fetch");
const {inspect} = require("util");

const worker = new Worker();

const auth = require("./auth.json");

/**
 * Get the version of the middleware
 * @param name the name of the middleware
 */
async function getMiddlewareVersion(name) {
    return (await fetch("https://registry.npmjs.org/@discord-rose/" + name)
        .then(res => res.json()))["dist-tags"].latest;
}

const BASE_REGISTRY_URL = "https://registry.npmjs.com";

const ZERO_WIDTH_CHARACTER = "\u200E";

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
            "pings", "pong"
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
            let lastWeek = await fetch("https://api.npmjs.org/downloads/point/last-week/discord-rose").then(res => res.json());
            let lastYear = await fetch("https://api.npmjs.org/downloads/point/last-year/discord-rose").then(res => res.json());
            let lastDay = await fetch("https://api.npmjs.org/downloads/point/last-day/discord-rose").then(res => res.json());
            
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
    .add({
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
    });