import { Client, GatewayIntentBits } from 'discord.js';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import config from './config.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log('Bot hazır!');
});

const userProcessing = new Map();

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'decompile') {
        const userId = interaction.user.id;

        if (userProcessing.get(userId)) {
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply('Zaten bir decompile işlemi devam ediyor. Lütfen önceki işlemin bitmesini bekleyin.');
            return;
        }

        const file = interaction.options.getAttachment('file');
        const MAX_FILE_SIZE = 20 * 1024 * 1024;

        if (file.size > MAX_FILE_SIZE) {
            await interaction.deferReply({ ephemeral: true });
            await interaction.reply('Dosya boyutu 20MB sınırını aşıyor. Lütfen daha küçük bir dosya yükleyin.');
            return;
        }

        userProcessing.set(userId, true);

        const newFileName = `${userId}.jar`;
        const filePath = path.join(__dirname, 'uploads', newFileName);

        const fileStream = fs.createWriteStream(filePath);
        const response = await fetch(file.url);
        response.body.pipe(fileStream);

        fileStream.on('finish', async () => {
            const outputDir = path.join(__dirname, 'decompiled', userId);
            fs.mkdirSync(outputDir, { recursive: true });

            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply('Decompile ediliyor...');

            exec(`java -jar C:/Users/PC/Desktop/rp/fernflower.jar ${filePath} ${outputDir}`, async (error, stdout, stderr) => {

                if (error) {
                    console.error(`Hata: ${error.message}`);
                    await interaction.editReply('Decompile işlemi sırasında bir hata oluştu.');
                    return;
                }

                if (stderr) {
                    console.error(`Hata: ${stderr}`);
                    await interaction.editReply('Decompile işlemi sırasında bir hata oluştu.');
                    return;
                }

                console.log(`stdout: ${stdout}`);

                const decompiledFilePath = path.join(outputDir, `${userId}.jar`);
                const renamedFilePath = path.join(outputDir, `${userId}.zip`);
                fs.renameSync(decompiledFilePath, renamedFilePath);

                await interaction.editReply({ content: 'Decompile işlemi tamamlandı.', files: [renamedFilePath] });
                
                fs.unlinkSync(filePath);
                fs.rmdirSync(outputDir, { recursive: true });
                userProcessing.set(userId, false);
            });
        });

        fileStream.on('error', async (error) => {
            console.error(`Hata: ${error.message}`);
            userProcessing.set(userId, false);
            await interaction.reply('Dosya indirilemedi.');
        });
    }
});

client.login(config.token);