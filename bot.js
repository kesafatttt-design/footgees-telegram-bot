const { Telegraf, Markup } = require("telegraf");
const { TonClient, Address, JettonMaster, JettonWallet } = require("@ton/ton");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");
require("dotenv/config");

const BOT_TOKEN = "9228066003:AAEFFStQYNLQ-touN3pTdlJ_709LSRU3Is0";
const JETTON_MASTER = "EQAsvPtrunihEHCmp42a63dTQEYzscpNxcq4b3oNZB17NZWZ";
const FOOTBALL_API_KEY = "c415a4f93e91467a9737f0a354e1185b";

const bot = new Telegraf(BOT_TOKEN);

const client = new TonClient({
    endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
    apiKey: "b6ff1a02b95caf3cc59de99aeee29061cf73fb7580d6893ba90286593506c8cf"
});

const db = new sqlite3.Database("./bot_database.db");
db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS predictions (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, matchId TEXT, prediction TEXT, points INTEGER DEFAULT 0, processed INTEGER DEFAULT 0)");
});

const userWallets = {};

// ÊÇÈÚ ÈÑÇí ˜ ˜ÑÏä äÊÇíÌ æ ÏÇÏä ÇãÊíÇÒ ÎæÏ˜ÇÑ
async function checkResultsAndAward() {
    console.log("Checking results from API...");
    try {
        const response = await fetch("https://api.football-data.org/v4/competitions/PL/matches", {
            headers: { "X-Auth-Token": FOOTBALL_API_KEY }
        });
        const data = await response.json();
        
        if (!data.matches) return;

        data.matches.forEach(match => {
            if (match.status === "FINISHED") {
                let winner = "draw";
                if (match.score.fullTime.home > match.score.fullTime.away) winner = "home";
                else if (match.score.fullTime.home < match.score.fullTime.away) winner = "away";

                db.all("SELECT id FROM predictions WHERE matchId = ? AND prediction = ? AND processed = 0", [match.id.toString(), winner], function(err, rows) {
                    if (err) return;
                    if (rows.length > 0) {
                        db.run("UPDATE predictions SET points = 10, processed = 1 WHERE matchId = ? AND prediction = ?", [match.id.toString(), winner]);
                        console.log("Awarded 10 points to " + rows.length + " users for match " + match.id);
                    }
                });
            }
        });
    } catch (e) {
        console.log("Error in auto-award:", e.message);
    }
}

setInterval(checkResultsAndAward, 10 * 60 * 1000);

function getMenu() {
    return Markup.keyboard([
        ["Predict Matches", "Leaderboard"],
        ["My Token Balance", "Set Wallet"],
        ["Help"]
    ]).resize();
}

bot.start((ctx) => {
    ctx.reply("Salam " + ctx.from.first_name + "!\n\nBe Footgess Bot khosh amadi.", getMenu());
});

bot.hears("Help", (ctx) => {
    ctx.reply("Baraye didan mojoodi, avval 'Set Wallet' bezan va address khod ra befrest.", getMenu());
});

bot.hears("Set Wallet", (ctx) => {
    ctx.reply("Lotfan address wallet TON khod ra befrest:", getMenu());
});

bot.hears(/^(EQ|UQ|kQ).+/, (ctx) => {
    userWallets[ctx.from.id] = ctx.message.text;
    ctx.reply("Wallet address shoma zakhire shod!", getMenu());
});

bot.hears("My Token Balance", async (ctx) => {
    const userWalletStr = userWallets[ctx.from.id];
    if (!userWalletStr) {
        return ctx.reply("Shoma hanuz wallet khod ra set nakardid.", getMenu());
    }
    try {
        ctx.reply("Dar hal check kardan mojoodi az network...");
        const userAddress = Address.parse(userWalletStr);
        const jettonMaster = client.open(JettonMaster.create(Address.parse(JETTON_MASTER)));
        const userJettonWalletAddress = await jettonMaster.getWalletAddress(userAddress);
        const jettonWallet = client.open(JettonWallet.create(userJettonWalletAddress));
        const balance = await jettonWallet.getBalance();
        const formattedBalance = Number(balance) / 1e9;
        ctx.reply("Address shoma: " + userWalletStr + "\n\nMojoodi shoma: " + formattedBalance + " FOGS", getMenu());
    } catch (error) {
        ctx.reply("Khata dar khandan mojoodi.", getMenu());
    }
});
// ÑÝÊä ãÓÇÈÞÇÊ ÇÒ API
bot.hears("Predict Matches", async (ctx) => {
    ctx.reply("Dar hal daryaft mosabeght az API...");
    try {
        const response = await fetch("https://api.football-data.org/v4/competitions/PL/matches", {
            headers: { "X-Auth-Token": FOOTBALL_API_KEY }
        });
        const data = await response.json();
        
        const upcomingMatches = data.matches.filter(m => m.status === "SCHEDULED" || m.status === "TIMED").slice(0, 5);
        
        if (upcomingMatches.length === 0) {
            return ctx.reply("Hich mosabegheyi baraye pishbini vojood nadarad.");
        }

        const buttons = upcomingMatches.map(match => {
            const matchText = match.homeTeam.name + " vs " + match.awayTeam.name;
            const callbackData = "predict_api_" + match.id + "_" + match.homeTeam.name + "_" + match.awayTeam.name;
            return [Markup.button.callback(matchText, callbackData)];
        });

        ctx.reply("Lotfan yeki az mosabeght ra entekhab konid:", Markup.inlineKeyboard(buttons));
    } catch (e) {
        ctx.reply("Khata dar daryaft mosabeght.");
    }
});

// ÇäÊÎÇÈ Êíã ÈÑÇí ãÓÇÈÞå API
bot.action(/^predict_api_(\d+)_(.+)_(.+)$/, (ctx) => {
    const matchId = ctx.match[1];
    const homeTeam = ctx.match[2];
    const awayTeam = ctx.match[3];
    
    ctx.answerCbQuery().catch(() => {});
    
    ctx.reply("Kodum tim barande mishe?", Markup.inlineKeyboard([
        [Markup.button.callback(homeTeam, "save_predict_" + matchId + "_home")],
        [Markup.button.callback(awayTeam, "save_predict_" + matchId + "_away")]
    ]));
});

// ÐÎíÑå íÔÈíäí
bot.action(/^save_predict_(\d+)_(home|away)$/, (ctx) => {
    const matchId = ctx.match[1];
    const prediction = ctx.match[2];
    const userId = ctx.from.id;

    ctx.answerCbQuery().catch(() => {});

    db.run("INSERT INTO predictions (userId, matchId, prediction) VALUES (?, ?, ?)", [userId, matchId, prediction], function(err) {
        if (err) return ctx.reply("Khata dar zakhire pishbini.");
        ctx.reply("Pishbini shoma baraye match " + matchId + " (" + prediction + ") sabt shod!", getMenu());
    });
});

bot.hears("/check_now", async (ctx) => {
    ctx.reply("Dar hal check kardan dasti...");
    await checkResultsAndAward();
    ctx.reply("Check tamoom shod. CMD ra check konid.");
});

bot.hears("Leaderboard", (ctx) => {
    db.all("SELECT userId, SUM(points) as total FROM predictions GROUP BY userId ORDER BY total DESC LIMIT 5", [], function(err, rows) {
        if (err) return ctx.reply("Khata dar khandan leaderboard.");
        if (rows.length === 0) return ctx.reply("Hanooz hich emtiyazi sabt nashode ast.", getMenu());
        
        let text = "Leaderboard:\n\n";
        rows.forEach(function(row, index) {
            text += (index + 1) + ". User " + row.userId + " - " + (row.total || 0) + " pts\n";
        });
        ctx.reply(text, getMenu());
    });
});

async function startBot() {
    try {
        await bot.launch();
        console.log("Bot started successfully!");
        console.log("Auto-award system is active.");
    } catch (error) {
        console.log("Connection failed, retrying in 5 seconds...");
        setTimeout(startBot, 5000);
    }
}

startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));