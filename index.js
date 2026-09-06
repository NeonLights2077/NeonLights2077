const { Client, GatewayIntentBits } = require("discord.js");
const http = require("http");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const DEBUG_CHANNEL_ID = "1400226748611825725";

client.on("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  console.log(`📊 Bot is in ${client.guilds.cache.size} guild(s)`);
  
  // Send test message
  const channel = client.channels.cache.get(DEBUG_CHANNEL_ID);
  if (channel) {
    channel.send("✅ Bot is online and working! (Test message)");
  }
});

client.on("error", (error) => {
  console.error("Error:", error);
});

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot is running");
});
server.listen(8080, '0.0.0.0');

if (!process.env.TOKEN) {
  console.error("❌ No token!");
  process.exit(1);
}

console.log("🔑 Logging in...");
client.login(process.env.TOKEN);
