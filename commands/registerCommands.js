const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { SlashCommandBuilder } = require("@discordjs/builders");

const commands = [
  new SlashCommandBuilder()
    .setName("sprint")
    .setDescription("Sprint management")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a new sprint")
        .addStringOption((option) =>
          option
            .setName("goal")
            .setDescription("Sprint goal")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("start-date")
            .setDescription("Start date (YYYY-MM-DD)")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("end-date")
            .setDescription("End date (YYYY-MM-DD)")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("points")
            .setDescription("Committed story points")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Get sprint status")
        .addIntegerOption((option) =>
          option
            .setName("number")
            .setDescription("Sprint number")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update")
        .setDescription("Update sprint progress")
        .addIntegerOption((option) =>
          option
            .setName("number")
            .setDescription("Sprint number")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("completed-points")
            .setDescription("Completed story points")
            .setRequired(true),
        ),
    ),

  new SlashCommandBuilder()
    .setName("task")
    .setDescription("Task management")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a new task")
        .addStringOption((option) =>
          option.setName("name").setDescription("Task name").setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("story")
            .setDescription("User story ID")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("estimate")
            .setDescription("Time estimate (e.g., 4h)")
            .setRequired(false),
        )
        .addUserOption((option) =>
          option
            .setName("assigned")
            .setDescription("Assign to user")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update")
        .setDescription("Update task status")
        .addIntegerOption((option) =>
          option.setName("id").setDescription("Task ID").setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("New status")
            .setRequired(true)
            .addChoices(
              { name: "To Do", value: "To Do" },
              { name: "In Progress", value: "In Progress" },
              { name: "Done", value: "Done" },
              { name: "Blocked", value: "Blocked" },
            ),
        )
        .addIntegerOption((option) =>
          option
            .setName("remaining")
            .setDescription("Remaining hours")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List tasks")
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("Filter by status")
            .setRequired(false)
            .addChoices(
              { name: "To Do", value: "To Do" },
              { name: "In Progress", value: "In Progress" },
              { name: "Done", value: "Done" },
              { name: "Blocked", value: "Blocked" },
            ),
        )
        .addUserOption((option) =>
          option
            .setName("assigned")
            .setDescription("Filter by assigned user")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("assign")
        .setDescription("Assign task to user")
        .addIntegerOption((option) =>
          option.setName("id").setDescription("Task ID").setRequired(true),
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to assign")
            .setRequired(true),
        ),
    ),

  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Generate reports")
    .addSubcommand((subcommand) =>
      subcommand.setName("daily").setDescription("Get daily status report"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("sprint")
        .setDescription("Get sprint report")
        .addIntegerOption((option) =>
          option
            .setName("number")
            .setDescription("Sprint number")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("team").setDescription("Get team workload report"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("burndown")
        .setDescription("Get burndown chart")
        .addIntegerOption((option) =>
          option
            .setName("number")
            .setDescription("Sprint number")
            .setRequired(true),
        ),
    ),

  new SlashCommandBuilder()
    .setName("bug")
    .setDescription("Bug tracking")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Report a new bug")
        .addStringOption((option) =>
          option.setName("title").setDescription("Bug title").setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("severity")
            .setDescription("Bug severity")
            .setRequired(true)
            .addChoices(
              { name: "High", value: "High" },
              { name: "Medium", value: "Medium" },
              { name: "Low", value: "Low" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("Bug description")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("story")
            .setDescription("Related user story ID")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update")
        .setDescription("Update bug status")
        .addIntegerOption((option) =>
          option.setName("id").setDescription("Bug ID").setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("New status")
            .setRequired(true)
            .addChoices(
              { name: "New", value: "New" },
              { name: "In Progress", value: "In Progress" },
              { name: "Fixed", value: "Fixed" },
              { name: "Closed", value: "Closed" },
            ),
        )
        .addUserOption((option) =>
          option
            .setName("assigned")
            .setDescription("Assign to user")
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName("notes")
            .setDescription("Resolution notes")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List bugs")
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("Filter by status")
            .setRequired(false)
            .addChoices(
              { name: "New", value: "New" },
              { name: "In Progress", value: "In Progress" },
              { name: "Fixed", value: "Fixed" },
              { name: "Closed", value: "Closed" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("severity")
            .setDescription("Filter by severity")
            .setRequired(false)
            .addChoices(
              { name: "High", value: "High" },
              { name: "Medium", value: "Medium" },
              { name: "Low", value: "Low" },
            ),
        ),
    ),

  new SlashCommandBuilder()
    .setName("story")
    .setDescription("User story management")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a new user story")
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("User story description")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("points")
            .setDescription("Story points")
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName("priority")
            .setDescription("Priority level")
            .setRequired(false)
            .addChoices(
              { name: "High", value: "High" },
              { name: "Medium", value: "Medium" },
              { name: "Low", value: "Low" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update")
        .setDescription("Update user story")
        .addIntegerOption((option) =>
          option.setName("id").setDescription("Story ID").setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("Status")
            .setRequired(false)
            .addChoices(
              { name: "Ready", value: "Ready" },
              { name: "In Progress", value: "In Progress" },
              { name: "Testing", value: "Testing" },
              { name: "Done", value: "Done" },
            ),
        )
        .addIntegerOption((option) =>
          option
            .setName("sprint")
            .setDescription("Assign to sprint")
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName("priority")
            .setDescription("Priority level")
            .setRequired(false)
            .addChoices(
              { name: "High", value: "High" },
              { name: "Medium", value: "Medium" },
              { name: "Low", value: "Low" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("backlog").setDescription("View product backlog"),
    ),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show help menu")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("Get help for specific command")
        .setRequired(false)
        .addChoices(
          { name: "sprint", value: "sprint" },
          { name: "task", value: "task" },
          { name: "bug", value: "bug" },
          { name: "story", value: "story" },
          { name: "report", value: "report" },
        ),
    ),
].map((command) => command.toJSON());

module.exports = async function registerCommands(token, clientId) {
  const rest = new REST({ version: "10" }).setToken(token);

  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
};
