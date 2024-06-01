const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');

const commands = [
    {
        name: 'decompile',
        description: 'Jar dosyasını decompile eder',
        options: [
            {
                name: 'file',
                description: 'Yüklenecek jar dosyası',
                type: 11, // 11 = File
                required: true
            }
        ]
    }
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Komutlar kaydediliyor...');
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        console.log('Komutlar başarıyla kaydedildi.');
    } catch (error) {
        console.error(error);
    }
})();
