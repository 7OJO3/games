const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const Jimp = require('jimp');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const players = new Map();
let gameParticipants = [];
let isShopOpen = true;
let game = { players: [], phase: 'waiting', started: false };
let activeGame = { word: '', startTime: 0, channelId: '' };

const IMAGES = {
    MAIN: 'https://cdn.discordapp.com/attachments/1501300022808023351/1524351573088665660/IMG_8672.jpg?ex=6a4f6e88&is=6a4e1d08&hm=5b9c9cf90b182a9bdcebf3a824691bee96362a510cbca4c17da599e6b7b460d9&',
    MAFIA: 'https://cdn.discordapp.com/attachments/1501300022808023351/1524351587596767293/IMG_8661.jpg?ex=6a4f6e8b&is=6a4e1d0b&hm=ce60e1aa498a99c687de48962836c7381fcc006b99cade14249664e9daf26f7a&',
    POLICE: 'https://cdn.discordapp.com/attachments/1501300022808023351/1524351607570038905/IMG_8651.jpg?ex=6a4f6e90&is=6a4e1d10&hm=c34f11bf4b94e8e4663906c5b71090aaac2b56b9bac201dc5c18d7ac4a0b52c7&',
    DOCTOR: 'https://cdn.discordapp.com/attachments/1501300022808023351/1524351599940472893/IMG_8653.jpg?ex=6a4f6e8e&is=6a4e1d0e&hm=d76c1c8eced1d5fb94094d978899f81c1faf27aadb46b5117206a8a90bb95f66&',
    CITIZEN: 'https://cdn.discordapp.com/attachments/1501300022808023351/1524351613328818336/IMG_8662.jpg?ex=6a4f6e91&is=6a4e1d11&hm=3a349140a1f71a393b75766aef4cf305cfa49cf587e2f661cd58cfad75645a17&',
    BOOM: 'https://cdn.discordapp.com/attachments/1501300022808023351/1524397454731251873/IMG_8664.jpg?ex=6a4f9943&is=6a4e47c3&hm=d48b4b84aa544a61499d9abb65587b5bc074d29b7244e017568eb83022757b33&'
};
const wordList = [
    "فجر", "رهف", "زياد", "خالد", "خالد طارق", "صالح", "رسيل", "لولو", 
    "قهوه", "شاي", "مدرسة", "رزدنت ايفل", "اسد", "خالد يحب نارين بيوتي", 
    "المملكه العربيه السعوديه", "الكويت", "البحرين", "مصر ام الدونيا", 
    "اناناس", "هالف مديون", "اويلاه كليجه", "وخزياه", "المثقف مايعرف يسولف", 
    "انا مو نحميا", "ساطور", "مستذئب", "حمار", "غزال", "انا جدع", "رهيب", 
    "راجع جدا", "جميل", "ونبيس عمك", "ريال مدريد", "برشلونه", "هالاند", 
    "ميسي", "رونالدو", "ريدبول", "كرواتيا", "سرواليموفيتش", "ابراهيموفيتش", 
    "مودريتش", "ميلاف", "امبابي", "لامين سروال", "بيبي"
];

client.on('messageCreate', async message => {
    if (message.content === '!روليت') {
        gameParticipants = [];
        isShopOpen = true;
        const embed = new EmbedBuilder().setImage('https://cdn.discordapp.com/attachments/1501300022808023351/1524396477940764762/IMG_8626.png?ex=6a4f985a&is=6a4e46da&hm=60da20c229ef96b6f3a1fc38d911a81125eb0ab3e1386fe35d7ab2b2f293dbc6&');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('join').setLabel('انضمام').setStyle(ButtonStyle.Secondary).setEmoji('1524283748860952676'),
            new ButtonBuilder().setCustomId('shop').setLabel('متجر').setStyle(ButtonStyle.Secondary).setEmoji('1524283688228229180')
        );
        message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content.startsWith('!نقاط')) {
        const member = message.mentions.members.first();
        if (member) {
            const p = players.get(member.id) || { points: 0 };
            message.reply(`نقاط ${member.user.username}: ${p.points}`);
        }
    }

    if (message.content === '!مافيا') {
        game = { players: [], phase: 'waiting', started: false };
        const embed = new EmbedBuilder().setImage(IMAGES.MAIN);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('join_mafia').setLabel('انضمام').setStyle(ButtonStyle.Secondary).setEmoji('1524283748860952676')
        );
        message.channel.send({ embeds: [embed], components: [row] });
    }

    // داخل أمر !اسرع
if (message.content === '!اسرع') {
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    activeGame = { word: randomWord, startTime: Date.now(), channelId: message.channel.id };

    const embed = new EmbedBuilder()
        .setTitle('أسرع من يكتب الكلمة!')
        .setDescription(`اكتب الكلمة التالية بسرعة: **${randomWord}**`)
        .setImage('https://cdn.discordapp.com/attachments/1501300022808023351/1524422302006116474/IMG_8696.png?ex=6a4fb067&is=6a4e5ee7&hm=a8b08ee8d9d3e5d677c7f4da92b4e3b36b8e3c4b80c2ec32423d602a8b829c1f')
        .setColor(0x0099FF);

    message.channel.send({ embeds: [embed] });
}

    

    if (activeGame.channelId === message.channel.id && message.content === activeGame.word) {
        const timeTaken = ((Date.now() - activeGame.startTime) / 1000).toFixed(2);
        message.reply(`مبروك! فزت في ${timeTaken} ثانية.`);
        activeGame = { word: '', startTime: 0, channelId: '' };
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'join') {
        if (!gameParticipants.includes(interaction.user.id)) {
            gameParticipants.push(interaction.user.id);
            interaction.reply({ content: 'تم انضمامك!', ephemeral: true });
        }
    }
    if (interaction.customId === 'join_mafia' && !game.started) {
        if (!game.players.find(p => p.id === interaction.user.id)) {
            game.players.push({ id: interaction.user.id, role: '', alive: true });
            interaction.reply({ content: `تم انضمامك! العدد: ${game.players.length}`, ephemeral: true });
        }
        if (game.players.length >= 5) startMafiaGame(interaction.channel);
    }
});

async function startMafiaGame(channel) {
    game.started = true;
    const roles = ['Mafia', 'Police', 'Doctor', 'Boom', 'Citizen'];
    game.players.forEach((p, i) => {
        p.role = roles[i];
        client.users.send(p.id, { content: `دورك: ${p.role}`, files: [IMAGES[p.role.toUpperCase()]] }).catch(() => {});
    });
    channel.send('تم توزيع الأدوار.');
}

client.login(process.env.TOKEN);
