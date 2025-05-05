require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const NotificationSystem = require("./notifications");
const SlashCommandHandler = require("./commands/handler");
const registerCommands = require("./commands/registerCommands");
const TaskComponents = require("./components/taskButtons");
const { sendPostRequest, createEmbed } = require("./utils");

// Initialize client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Initialize notification system
const notifications = new NotificationSystem(client);

// Store for managing cooldowns
const cooldowns = new Collection();

// Bot startup event
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Register slash commands
  await registerCommands(process.env.DISCORD_TOKEN, client.user.id);

  // Initialize notifications
  notifications.init();

  // Set bot status
  client.user.setActivity("Managing Projects", { type: "WATCHING" });

  console.log("Bot is ready!");
});

// Handle slash commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    // Log command usage
    console.log(`Command used: /${commandName} by ${interaction.user.tag}`);

    switch (commandName) {
      case "sprint":
        await SlashCommandHandler.handleSprint(interaction);
        break;
      case "task":
        await SlashCommandHandler.handleTask(interaction);
        break;
      case "report":
        await SlashCommandHandler.handleReport(interaction);
        break;
      case "bug":
        await SlashCommandHandler.handleBug(interaction);
        break;
      case "story":
        await SlashCommandHandler.handleUserStory(interaction);
        break;
      case "help":
        await SlashCommandHandler.handleHelp(interaction);
        break;
      default:
        await interaction.reply({
          content: "Unknown command!",
          ephemeral: true,
        });
    }
  } catch (error) {
    console.error("Slash command error:", error);

    // Error handling for different types of errors
    if (error.code === 40060) {
      await interaction.reply({
        content: "This interaction has already been acknowledged.",
        ephemeral: true,
      });
    } else if (error.code === 10062) {
      console.log("Interaction has expired.");
    } else {
      await interaction.reply({
        content: "❌ There was an error executing this command!",
        ephemeral: true,
      });
    }
  }
});

// Handle button interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  try {
    if (customId.startsWith("task_update_")) {
      const [_, __, taskId, status] = customId.split("_");
      const statusMap = {
        todo: "To Do",
        inprogress: "In Progress",
        done: "Done",
        blocked: "Blocked",
      };

      const result = await sendPostRequest("updateTask", {
        taskId: parseInt(taskId),
        status: statusMap[status],
      });

      if (result.success) {
        await interaction.reply({
          content: `✅ Task #${taskId} updated to ${statusMap[status]}`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `❌ Failed to update task: ${result.message}`,
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error("Button interaction error:", error);
    await interaction.reply({
      content: "❌ Error processing button click",
      ephemeral: true,
    });
  }
});

// Handle select menu interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  try {
    if (interaction.customId.startsWith("task_assign_")) {
      const taskId = interaction.customId.split("_")[2];
      const selectedValue = interaction.values[0];
      const [_, __, assignedTo] = selectedValue.split("_");

      const result = await sendPostRequest("assignTask", {
        taskId: parseInt(taskId),
        assignedTo: assignedTo,
      });

      if (result.success) {
        await interaction.reply({
          content: `✅ Task #${taskId} assigned to ${assignedTo}`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `❌ Failed to assign task: ${result.message}`,
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error("Select menu interaction error:", error);
    await interaction.reply({
      content: "❌ Error processing select menu",
      ephemeral: true,
    });
  }
});

// Handle text commands (for backward compatibility and special features)
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.toLowerCase().split(" ");
  const command = args[0];

  try {
    // Basic commands
    if (command === "!ping") {
      const latency = Date.now() - message.createdTimestamp;
      message.reply(`🏓 Pong! Latency: ${latency}ms`);
    } else if (command === "!setup") {
      const embed = createEmbed(
        "Project Management Bot",
        "**Available Commands:**\n\n" +
          "**Slash Commands:**\n" +
          "`/sprint` - Sprint management\n" +
          "`/task` - Task management\n" +
          "`/bug` - Bug tracking\n" +
          "`/story` - User story management\n" +
          "`/report` - Generate reports\n" +
          "`/help` - Show help menu\n\n" +
          "**Interactive Features:**\n" +
          "• Task status updates with buttons\n" +
          "• Task assignment with dropdown\n" +
          "• Automatic sprint health reports\n" +
          "• Daily notifications\n\n" +
          "**Text Commands:**\n" +
          "`!ping` - Test bot response\n" +
          "`!setup` - Show this information\n" +
          "`!task interactive <task_id>` - Interactive task management\n" +
          "`!chart <sprint_number>` - Generate burndown chart\n\n" +
          "To get started, try `/help` or `/sprint create`",
        0x00ff00,
      );
      message.reply({ embeds: [embed] });
    }

    // Interactive task management
    else if (command === "!task" && args[1] === "interactive") {
      const taskId = parseInt(args[2]);

      if (!taskId) {
        message.reply(
          "❌ Please provide a task ID. Usage: `!task interactive <task_id>`",
        );
        return;
      }

      const taskButtons = TaskComponents.createTaskButtons(taskId);
      const teamResult = await sendPostRequest("getTeamReport", {});

      if (teamResult.success) {
        const teamMembers = teamResult.teamReport;
        const assignMenu = TaskComponents.createAssignmentMenu(
          taskId,
          teamMembers,
        );

        const embed = createEmbed(
          `Task #${taskId} Management`,
          "Use the buttons below to update task status or assign to team members.",
          0x4287f5,
        );

        await message.reply({
          embeds: [embed],
          components: [taskButtons, assignMenu],
        });
      } else {
        message.reply("❌ Failed to load team data");
      }
    }

    // Generate burndown chart
    else if (command === "!chart") {
      const sprintNumber = parseInt(args[1]);

      if (!sprintNumber) {
        message.reply(
          "❌ Please provide a sprint number. Usage: `!chart <sprint_number>`",
        );
        return;
      }

      message.reply("📊 Generating burndown chart...");

      const result = await sendPostRequest(
        "generateBurndownChart",
        sprintNumber,
      );

      if (result.success) {
        const embed = createEmbed(
          `Sprint ${sprintNumber} Burndown Chart`,
          `[View Chart](${result.chartUrl})\n\nThe burndown chart shows the sprint progress with ideal vs actual work completed.`,
          0x4287f5,
        ).setImage(result.chartUrl);

        message.reply({ embeds: [embed] });
      } else {
        message.reply("❌ Failed to generate burndown chart");
      }
    }

    // Dashboard command
    else if (command === "!dashboard") {
      const result = await sendPostRequest("getDashboard", {});

      if (result.success) {
        const dashboard = result;
        let dashboardMsg = "**📊 Project Dashboard**\n\n";

        if (dashboard.currentSprint) {
          dashboardMsg += `**Active Sprint:** #${dashboard.currentSprint.sprintNumber}\n`;
          dashboardMsg += `Progress: ${dashboard.currentSprint.progress}\n`;
          dashboardMsg += `Days left: ${dashboard.currentSprint.remainingDays}\n\n`;
        }

        if (dashboard.teamWorkload) {
          dashboardMsg += "**Team Workload:**\n";
          dashboard.teamWorkload.forEach((member) => {
            dashboardMsg += `${member.name}: ${member.activeTasks} tasks\n`;
          });
        }

        const embed = createEmbed("Project Dashboard", dashboardMsg);
        message.reply({ embeds: [embed] });
      }
    }

    // Quick commands for common operations
    else if (command === "!quick") {
      const action = args[1];

      switch (action) {
        case "overdue":
          const overdueResult = await sendPostRequest("getOverdueTasks", {});
          if (overdueResult.success && overdueResult.overdueTasks.length > 0) {
            let overdueMsg = "**⚠️ Overdue Tasks:**\n\n";
            overdueResult.overdueTasks.forEach((task) => {
              overdueMsg += `#${task.id}: ${task.taskName}\n`;
              overdueMsg += `Assigned: ${task.assignedTo}\n`;
              overdueMsg += `Overdue by: ${task.overdueDays} days\n\n`;
            });

            const embed = createEmbed("Overdue Tasks", overdueMsg, 0xff0000);
            message.reply({ embeds: [embed] });
          } else {
            message.reply("✅ No overdue tasks!");
          }
          break;

        case "bugs":
          const bugResult = await sendPostRequest("getBugList", {
            status: "New",
          });
          if (bugResult.success && bugResult.bugs.length > 0) {
            let bugMsg = "**🐛 New Bugs:**\n\n";
            bugResult.bugs.forEach((bug) => {
              bugMsg += `#${bug.id}: ${bug.title} [${bug.severity}]\n`;
            });

            const embed = createEmbed("New Bugs", bugMsg, 0xff9900);
            message.reply({ embeds: [embed] });
          } else {
            message.reply("✅ No new bugs!");
          }
          break;

        default:
          message.reply(
            "Available quick commands: `!quick overdue`, `!quick bugs`",
          );
      }
    }
  } catch (error) {
    console.error("Command error:", error);
    message.reply("❌ An error occurred while processing your command.");
  }
});

// Error handling for the client
client.on("error", (error) => {
  console.error("Client error:", error);
});

// Handling uncaught exceptions and unhandled rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Bot is shutting down...");
  client.destroy();
  process.exit();
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

// Helper functions for text commands
async function showSprintStatus(message, sprintNumber) {
  const result = await sendPostRequest("getSprintStatus", { sprintNumber });

  if (result.success) {
    const sprint = result.sprint;
    const embed = createEmbed(
      `Sprint #${sprint.sprintNumber} Quick Status`,
      `**Goal:** ${sprint.goal}\n` +
        `**Progress:** ${sprint.completedPoints}/${sprint.committedPoints} points\n` +
        `**Velocity:** ${sprint.velocity}\n` +
        `**Days Remaining:** ${sprint.remainingDays}`,
      0x4287f5,
    );
    message.reply({ embeds: [embed] });
  } else {
    message.reply(`❌ Sprint #${sprintNumber} not found`);
  }
}

// Export client for testing
module.exports = client;
