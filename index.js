// File: index.js
// Discord Bot cập nhật tương tác với Google Apps Script Web App

require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");
const axios = require("axios");

// Khởi tạo Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Cấu hình từ .env
// DISCORD_TOKEN, CLIENT_ID, GUILD_ID, NOTIFICATION_CHANNEL_ID
// WEB_APP_URL: URL Web App Apps Script (doPost endpoint)
// WEBHOOK_SECRET: secret shared với Apps Script
const WEB_APP_URL = process.env.WEB_APP_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Định nghĩa slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Kiểm tra bot có hoạt động không"),
  new SlashCommandBuilder()
    .setName("resolve")
    .setDescription("Đánh dấu task đã hoàn thành")
    .addStringOption((option) =>
      option
        .setName("task_id")
        .setDescription("ID của task cần đánh dấu")
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Cập nhật trạng thái của task")
    .addStringOption((option) =>
      option
        .setName("task_id")
        .setDescription("ID của task cần cập nhật")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("status")
        .setDescription("Trạng thái mới")
        .setRequired(true)
        .addChoices(
          { name: "To Do", value: "To Do" },
          { name: "In Progress", value: "In Progress" },
          { name: "Review", value: "Review" },
          { name: "Done", value: "Done" },
        ),
    ),
];

// Đăng ký slash commands
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
(async () => {
  try {
    console.log("Đang đăng ký slash commands...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("Slash commands đã được đăng ký!");
  } catch (err) {
    console.error("Lỗi khi đăng ký commands:", err);
  }
})();

// Hàm gọi Apps Script web app
async function callAppScript(command, params = {}) {
  try {
    const payload = {
      secret: WEBHOOK_SECRET,
      command,
      ...params,
    };
    const resp = await axios.post(WEB_APP_URL, payload);
    if (resp.data && resp.data.success) {
      return resp.data;
    } else {
      throw new Error(resp.data.error || "Unknown error");
    }
  } catch (error) {
    console.error(`Error calling Apps Script [${command}]:`, error.toString());
    return { success: false, error: error.toString() };
  }
}

// Bot ready event
client.once("ready", () => {
  console.log(`Bot đã sẵn sàng: ${client.user.tag}`);
});

// Xử lý slash commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;

  if (commandName === "ping") {
    await interaction.reply("Pong! 🏓");
  } else if (commandName === "resolve") {
    const taskId = interaction.options.getString("task_id");
    await interaction.deferReply();
    const result = await callAppScript("updateStatus", {
      taskId,
      status: "Done",
    });
    if (result.success) {
      await interaction.editReply(result.data.message);
      // Gửi notification channel
      const channel = client.channels.cache.get(
        process.env.NOTIFICATION_CHANNEL_ID,
      );
      if (channel) {
        channel.send(
          `🎉 Task **${taskId}** đã được hoàn thành bởi ${interaction.user.username}`,
        );
      }
    } else {
      await interaction.editReply(`❌ ${result.error}`);
    }
  } else if (commandName === "status") {
    const taskId = interaction.options.getString("task_id");
    const status = interaction.options.getString("status");
    await interaction.deferReply();
    const result = await callAppScript("updateStatus", { taskId, status });
    if (result.success) {
      await interaction.editReply(result.data.message);
      const channel = client.channels.cache.get(
        process.env.NOTIFICATION_CHANNEL_ID,
      );
      if (channel) {
        channel.send(
          `📝 Task **${taskId}** đã được cập nhật thành **${status}** bởi ${interaction.user.username}`,
        );
      }
    } else {
      await interaction.editReply(`❌ ${result.error}`);
    }
  }
});

// Handle Discord messages for GitLab notifications
client.on("messageCreate", async (message) => {
  // Ignore messages from bots and messages not in the notification channel
  if (
    message.author.bot ||
    message.channelId !== process.env.NOTIFICATION_CHANNEL_ID
  )
    return;

  // Parse GitLab notifications from message content
  const content = message.content;

  let command, params;

  // Parse Issue notifications
  const issueOpenMatch = content.match(/opened issue #(\d+)/i);
  const issueCloseMatch = content.match(/closed issue #(\d+)/i);

  // Parse Merge Request notifications
  const mrOpenMatch = content.match(/opened merge request #(\d+)/i);
  const mrMergeMatch = content.match(/merged merge request #(\d+)/i);

  if (issueOpenMatch) {
    command = "updateStatus";
    params = { taskId: `TASK-${issueOpenMatch[1]}`, status: "To Do" };
  } else if (issueCloseMatch) {
    command = "updateStatus";
    params = { taskId: `TASK-${issueCloseMatch[1]}`, status: "Done" };
  } else if (mrOpenMatch) {
    command = "updateStatus";
    params = { taskId: `TASK-${mrOpenMatch[1]}`, status: "Review" };
  } else if (mrMergeMatch) {
    command = "updateStatus";
    params = { taskId: `TASK-${mrMergeMatch[1]}`, status: "Done" };
  } else {
    return; // Not a GitLab notification we care about
  }

  // Call Apps Script to update status
  const result = await callAppScript(command, params);
  if (result.success) {
    await message.reply(result.data.message);
  } else {
    console.error("Lỗi cập nhật từ thông báo GitLab:", result.error);
    await message.reply(`❌ Lỗi khi cập nhật task: ${result.error}`);
  }
});

client.login(process.env.DISCORD_TOKEN);
