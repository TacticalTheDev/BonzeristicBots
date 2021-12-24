const Discord = require('discord.js');
const client = new Discord.Client({partials: ["MESSAGE", "USER", "REACTION"]});
const enmap = require('enmap');
const {token, prefix} = require('./config.json');

const settings = new enmap({
    name: "settings",
    autoFetch: true,
    cloneLevel: "deep",
    fetchAll: true
});

client.on('ready', () => {
    console.log('ready')
});

client.on('message', async message => {
    if(message.author.bot) return;
    if(message.content.indexOf(prefix) !== 0) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command == "setup") {
        // setup #channel

        let channel = message.mentions.channels.first();
        if(!channel) return message.reply("Command Usage: `-setup #channel`");

        let sent = await channel.send(new Discord.MessageEmbed()
            .setTitle("Open a thread!")
            .setDescription("To create a thread, please press the '🎫' reaction!")
            .setFooter("Ticket System 》Powered by Bonzeristic (https://discord.gg/vcNRVRmvjN)")
            .setColor("#354A2F")
        );

        sent.react('🎫');
        settings.set(`${message.guild.id}-ticket`, sent.id);

        message.channel.send("Successfully set up ticket system.")
    }

    if(command == "close") {
        if(!message.channel.name.includes("ticket-")) return message.channel.send("You cannot use that here!")
        message.channel.delete();
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if(user.partial) await user.fetch();
    if(reaction.partial) await reaction.fetch();
    if(reaction.message.partial) await reaction.message.fetch();

    if(user.bot) return;

    let ticketid = await settings.get(`${reaction.message.guild.id}-ticket`);

    if(!ticketid) return;

    if(reaction.message.id == ticketid && reaction.emoji.name == '🎫') {
        reaction.users.remove(user);

        reaction.message.guild.channels.create(`ticket-${user.username}`, {
            permissionOverwrites: [
                {
                    id: user.id,
                    allow: ["SEND_MESSAGES", "VIEW_CHANNEL"]
                },
                {
                    id: reaction.message.guild.roles.everyone,
                    deny: ["VIEW_CHANNEL"]
                }
            ],
            type: 'text'
        }).then(async channel => {
            channel.send(`<@${user.id}>`, new Discord.MessageEmbed().setTitle("Server Support").setDescription("Our team will be with you shortly. Please allow up to 12 hours for a response. If you opened a ticket by mistake, please run **-close**.").setColor("#4D5D53"))
        })
    }
});

client.login(token);