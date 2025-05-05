const { sendPostRequest } = require("../utils");
const { EmbedBuilder } = require("discord.js");

class SlashCommandHandler {
  // Utility method để handle defer và error
  static async deferAndHandleErrors(interaction, handler) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }
      await handler();
    } catch (error) {
      console.error("Command error:", error);

      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: "❌ Error processing command!",
          });
        } else if (!interaction.replied) {
          await interaction.reply({
            content: "❌ Error processing command!",
            ephemeral: true,
          });
        }
      } catch (err) {
        console.error("Failed to send error response:", err);
      }
    }
  }

  // Sprint Commands
  static async handleSprint(interaction) {
    await this.deferAndHandleErrors(interaction, async () => {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "create":
          await this.handleSprintCreate(interaction);
          break;
        case "status":
          await this.handleSprintStatus(interaction);
          break;
        case "update":
          await this.handleSprintUpdate(interaction);
          break;
      }
    });
  }

  static async handleSprintCreate(interaction) {
    const goal = interaction.options.getString("goal");
    const startDate = interaction.options.getString("start-date");
    const endDate = interaction.options.getString("end-date");
    const points = interaction.options.getInteger("points") || 0;

    const result = await sendPostRequest("createSprint", {
      goal,
      startDate,
      endDate,
      committedPoints: points,
    });

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle("Sprint Created Successfully")
        .setDescription(
          `Sprint #${result.sprintNumber} has been created.\n**Goal:** ${goal}`,
        )
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  static async handleSprintStatus(interaction) {
    const sprintNumber = interaction.options.getInteger("number");

    const result = await sendPostRequest("getSprintStatus", { sprintNumber });

    if (result.success) {
      const sprint = result.sprint;
      const embed = new EmbedBuilder()
        .setTitle(`Sprint #${sprint.sprintNumber} Status`)
        .setDescription(
          `**Goal:** ${sprint.goal}\n` +
            `**Period:** ${sprint.startDate} - ${sprint.endDate}\n` +
            `**Progress:** ${sprint.completedPoints}/${sprint.committedPoints} points\n` +
            `**Velocity:** ${sprint.velocity}\n` +
            `**Status:** ${sprint.status}\n` +
            `**Days Remaining:** ${sprint.remainingDays}`,
        )
        .setColor(0x4287f5)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  static async handleSprintUpdate(interaction) {
    const sprintNumber = interaction.options.getInteger("number");
    const completedPoints = interaction.options.getInteger("completed-points");

    const result = await sendPostRequest("updateSprint", {
      sprintNumber,
      completedPoints,
    });

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle("Sprint Updated")
        .setDescription(
          `Sprint #${sprintNumber} updated with ${completedPoints} completed points`,
        )
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  // Task Commands
  static async handleTask(interaction) {
    await this.deferAndHandleErrors(interaction, async () => {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "create":
          await this.handleTaskCreate(interaction);
          break;
        case "update":
          await this.handleTaskUpdate(interaction);
          break;
        case "list":
          await this.handleTaskList(interaction);
          break;
        case "assign":
          await this.handleTaskAssign(interaction);
          break;
      }
    });
  }

  static async handleTaskCreate(interaction) {
    const taskName = interaction.options.getString("name");
    const userStoryId = interaction.options.getInteger("story");
    const estimate = interaction.options.getString("estimate") || "0h";
    const assignedUser = interaction.options.getUser("assigned");
    const assignedTo = assignedUser ? assignedUser.username : "";

    const result = await sendPostRequest("createTask", {
      taskName,
      userStoryId,
      estimate,
      assignedTo,
    });

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle("Task Created")
        .setDescription(
          `Task #${result.taskId}: ${taskName}\nAssigned to: ${assignedTo || "Unassigned"}`,
        )
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  static async handleTaskUpdate(interaction) {
    const taskId = interaction.options.getInteger("id");
    const status = interaction.options.getString("status");
    const remaining = interaction.options.getInteger("remaining");

    const result = await sendPostRequest("updateTask", {
      taskId,
      status,
      remaining,
    });

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle("Task Updated")
        .setDescription(`Task #${taskId} updated to ${status}`)
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  static async handleTaskList(interaction) {
    const status = interaction.options.getString("status");
    const assignedUser = interaction.options.getUser("assigned");
    const assignedTo = assignedUser ? assignedUser.username : null;

    const result = await sendPostRequest("getTaskList", {
      status,
      assignedTo,
    });

    if (result.success) {
      let taskList = "";
      result.tasks.forEach((task) => {
        taskList += `**#${task.id}** ${task.taskName} [${task.status}]\n`;
        taskList += `  Assigned: ${task.assignedTo || "Unassigned"}\n`;
        taskList += `  Estimate: ${task.estimate}, Remaining: ${task.remaining}\n\n`;
      });

      const embed = new EmbedBuilder()
        .setTitle("Task List")
        .setDescription(taskList || "No tasks found")
        .setColor(0x4287f5)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  static async handleTaskAssign(interaction) {
    const taskId = interaction.options.getInteger("id");
    const assignedUser = interaction.options.getUser("user");
    const assignedTo = assignedUser.username;

    const result = await sendPostRequest("assignTask", {
      taskId,
      assignedTo,
    });

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle("Task Assigned")
        .setDescription(`Task #${taskId} assigned to ${assignedTo}`)
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  // Report Commands
  static async handleReport(interaction) {
    await this.deferAndHandleErrors(interaction, async () => {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "daily":
          await this.handleDailyReport(interaction);
          break;
        case "sprint":
          await this.handleSprintReport(interaction);
          break;
        case "team":
          await this.handleTeamReport(interaction);
          break;
        case "burndown":
          await this.handleBurndownReport(interaction);
          break;
      }
    });
  }

  static async handleDailyReport(interaction) {
    const result = await sendPostRequest("getDailyReport", {});

    if (result.success) {
      const report = result.report;
      let reportMsg = "**📊 Daily Report**\n\n";

      if (report.currentSprint) {
        reportMsg += `**Current Sprint #${report.currentSprint.sprintNumber}**\n`;
        reportMsg += `Goal: ${report.currentSprint.goal}\n`;
        reportMsg += `Progress: ${report.currentSprint.progress}\n`;
        reportMsg += `Days remaining: ${report.currentSprint.remainingDays}\n\n`;
      }

      if (report.overdueTasks && report.overdueTasks.length > 0) {
        reportMsg += "**⚠️ Overdue Tasks:**\n";
        report.overdueTasks.forEach((task) => {
          reportMsg += `- #${task.id}: ${task.taskName} (${task.overdueDays} days)\n`;
        });
        reportMsg += "\n";
      }

      if (report.sprintHealth) {
        reportMsg += "**Sprint Health:**\n";
        reportMsg += `Schedule: ${report.sprintHealth.schedule}\n`;
        reportMsg += `Scope: ${report.sprintHealth.scope}\n`;
        reportMsg += `Quality: ${report.sprintHealth.quality}\n\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle("Daily Report")
        .setDescription(reportMsg)
        .setColor(0x4287f5)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  static async handleSprintReport(interaction) {
    const sprintNumber = interaction.options.getInteger("number");

    const result = await sendPostRequest("getSprintReport", { sprintNumber });

    if (result.success) {
      const report = result.report;
      let reportMsg = `**Sprint #${report.sprint.sprintNumber} Report**\n\n`;
      reportMsg += `**Goal:** ${report.sprint.goal}\n`;
      reportMsg += `**Completion Rate:** ${report.summary.completionRate}\n`;
      reportMsg += `**Velocity:** ${report.summary.velocity}\n`;
      reportMsg += `**Remaining Work:** ${report.summary.remainingWork} points\n\n`;
      reportMsg += `**Tasks Summary:**\n`;

      const statusCounts = {};
      report.tasks.forEach((task) => {
        statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      });

      Object.entries(statusCounts).forEach(([status, count]) => {
        reportMsg += `- ${status}: ${count}\n`;
      });

      const embed = new EmbedBuilder()
        .setTitle("Sprint Report")
        .setDescription(reportMsg)
        .setColor(0x4287f5)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  static async handleTeamReport(interaction) {
    const result = await sendPostRequest("getTeamReport", {});

    if (result.success) {
      let reportMsg = "**👥 Team Report**\n\n";

      result.teamReport.forEach((member) => {
        reportMsg += `**${member.name}** (${member.role})\n`;
        reportMsg += `- Tasks: ${member.taskCount}\n`;
        reportMsg += `- Workload: ${member.workload}\n`;
        reportMsg += `- Capacity: ${member.capacity}\n\n`;
      });

      const embed = new EmbedBuilder()
        .setTitle("Team Report")
        .setDescription(reportMsg)
        .setColor(0x4287f5)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  static async handleBurndownReport(interaction) {
    const sprintNumber = interaction.options.getInteger("number");

    const result = await sendPostRequest("generateBurndownChart", sprintNumber);

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle(`Sprint ${sprintNumber} Burndown Chart`)
        .setDescription(`🔗 [View Chart](${result.chartUrl})`)
        .setColor(0x4287f5)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error generating chart` });
    }
  }

  // Bug Commands
  static async handleBug(interaction) {
    await this.deferAndHandleErrors(interaction, async () => {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "create":
          await this.handleBugCreate(interaction);
          break;
        case "update":
          await this.handleBugUpdate(interaction);
          break;
        case "list":
          await this.handleBugList(interaction);
          break;
      }
    });
  }

  static async handleBugCreate(interaction) {
    const title = interaction.options.getString("title");
    const severity = interaction.options.getString("severity");
    const description = interaction.options.getString("description");
    const storyId = interaction.options.getInteger("story");

    const result = await sendPostRequest("createBug", {
      title,
      description,
      reportedBy: interaction.user.username,
      severity,
      userStoryId: storyId,
    });

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle("Bug Created")
        .setDescription(`Bug #${result.bugId} created\n**Title:** ${title}`)
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  static async handleBugUpdate(interaction) {
    const bugId = interaction.options.getInteger("id");
    const status = interaction.options.getString("status");
    const assignedUser = interaction.options.getUser("assigned");
    const resolutionNotes = interaction.options.getString("notes");

    const params = {
      bugId,
      status,
      assignedTo: assignedUser ? assignedUser.username : null,
      resolutionNotes,
    };

    const result = await sendPostRequest("updateBug", params);

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle("Bug Updated")
        .setDescription(`Bug #${bugId} updated to ${status}`)
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  static async handleBugList(interaction) {
    const status = interaction.options.getString("status");
    const severity = interaction.options.getString("severity");

    const result = await sendPostRequest("getBugList", {
      status,
      severity,
    });

    if (result.success) {
      let bugList = "";
      result.bugs.forEach((bug) => {
        bugList += `**#${bug.id}** ${bug.title} [${bug.severity}]\n`;
        bugList += `  Status: ${bug.status}\n`;
        bugList += `  Assigned: ${bug.assignedTo || "Unassigned"}\n\n`;
      });

      const embed = new EmbedBuilder()
        .setTitle("Bug List")
        .setDescription(bugList || "No bugs found")
        .setColor(0x4287f5)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  // User Story Commands
  static async handleUserStory(interaction) {
    await this.deferAndHandleErrors(interaction, async () => {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "create":
          await this.handleUserStoryCreate(interaction);
          break;
        case "update":
          await this.handleUserStoryUpdate(interaction);
          break;
        case "backlog":
          await this.handleUserStoryBacklog(interaction);
          break;
      }
    });
  }

  static async handleUserStoryCreate(interaction) {
    const userStory = interaction.options.getString("description");
    const storyPoints = interaction.options.getInteger("points");
    const priority = interaction.options.getString("priority");

    const result = await sendPostRequest("createUserStory", {
      userStory,
      storyPoints,
      priority,
    });

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle("User Story Created")
        .setDescription(
          `Story #${result.storyId} created\n**Description:** ${userStory}`,
        )
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  static async handleUserStoryUpdate(interaction) {
    const storyId = interaction.options.getInteger("id");
    const status = interaction.options.getString("status");
    const sprint = interaction.options.getInteger("sprint");
    const priority = interaction.options.getString("priority");

    const params = {
      storyId,
      status,
      sprint,
      priority,
    };

    const result = await sendPostRequest("updateUserStory", params);

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle("User Story Updated")
        .setDescription(`Story #${storyId} updated`)
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  static async handleUserStoryBacklog(interaction) {
    const result = await sendPostRequest("getBacklog", {});

    if (result.success) {
      let backlogMsg = "";
      result.stories.forEach((story) => {
        backlogMsg += `**#${story.id}** ${story.userStory} [${story.priority}]\n`;
        backlogMsg += `  Points: ${story.storyPoints}\n`;
        backlogMsg += `  Status: ${story.status}\n`;
        backlogMsg += `  Sprint: ${story.sprint || "Unassigned"}\n\n`;
      });

      const embed = new EmbedBuilder()
        .setTitle("Product Backlog")
        .setDescription(backlogMsg || "No stories found")
        .setColor(0x4287f5)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: `❌ Error: ${result.message}` });
    }
  }

  // Help Command
  static async handleHelp(interaction) {
    await this.deferAndHandleErrors(interaction, async () => {
      const commandName = interaction.options.getString("command");

      if (commandName) {
        await this.handleCommandHelp(interaction, commandName);
      } else {
        await this.handleGeneralHelp(interaction);
      }
    });
  }

  static async handleGeneralHelp(interaction) {
    const helpEmbed = new EmbedBuilder()
      .setTitle("🤖 Project Management Bot Help")
      .setDescription(
        "This bot helps you manage your project with sprints, tasks, bugs, and user stories.",
      )
      .addFields(
        {
          name: "**Sprint Management**",
          value: "/sprint create, status, update",
          inline: true,
        },
        {
          name: "**Task Management**",
          value: "/task create, update, list, assign",
          inline: true,
        },
        {
          name: "**Bug Tracking**",
          value: "/bug create, update, list",
          inline: true,
        },
        {
          name: "**User Stories**",
          value: "/story create, update, backlog",
          inline: true,
        },
        {
          name: "**Reports**",
          value: "/report daily, sprint, team, burndown",
          inline: true,
        },
        {
          name: "**Help**",
          value: "/help [command] - Get help for specific command",
          inline: true,
        },
      )
      .setColor(0x00ff00)
      .setTimestamp()
      .setFooter({ text: "Use /help [command] for detailed information" });

    await interaction.editReply({ embeds: [helpEmbed] });
  }

  static async handleCommandHelp(interaction, commandName) {
    const helpContent = {
      sprint: {
        title: "📅 Sprint Commands",
        description: "Manage your development sprints.",
        fields: [
          {
            name: "Create Sprint",
            value:
              "/sprint create goal:string start-date:YYYY-MM-DD end-date:YYYY-MM-DD [points:number]",
          },
          { name: "Get Status", value: "/sprint status number:int" },
          {
            name: "Update Sprint",
            value: "/sprint update number:int completed-points:int",
          },
        ],
      },
      task: {
        title: "✅ Task Commands",
        description: "Manage your development tasks.",
        fields: [
          {
            name: "Create Task",
            value:
              "/task create name:string story:int [estimate:string] [assigned:user]",
          },
          {
            name: "Update Task",
            value: "/task update id:int status:string [remaining:int]",
          },
          {
            name: "List Tasks",
            value: "/task list [status:string] [assigned:user]",
          },
          { name: "Assign Task", value: "/task assign id:int user:user" },
        ],
      },
      bug: {
        title: "🐛 Bug Commands",
        description: "Track and manage bugs.",
        fields: [
          {
            name: "Report Bug",
            value:
              "/bug create title:string severity:string description:string [story:int]",
          },
          {
            name: "Update Bug",
            value:
              "/bug update id:int status:string [assigned:user] [notes:string]",
          },
          {
            name: "List Bugs",
            value: "/bug list [status:string] [severity:string]",
          },
        ],
      },
      story: {
        title: "📝 User Story Commands",
        description: "Manage user stories and product backlog.",
        fields: [
          {
            name: "Create Story",
            value:
              "/story create description:string [points:int] [priority:string]",
          },
          {
            name: "Update Story",
            value:
              "/story update id:int [status:string] [sprint:int] [priority:string]",
          },
          { name: "View Backlog", value: "/story backlog" },
        ],
      },
      report: {
        title: "📊 Report Commands",
        description: "Generate various project reports.",
        fields: [
          { name: "Daily Report", value: "/report daily" },
          { name: "Sprint Report", value: "/report sprint number:int" },
          { name: "Team Report", value: "/report team" },
          { name: "Burndown Chart", value: "/report burndown number:int" },
        ],
      },
    };

    const help = helpContent[commandName];
    if (!help) {
      await interaction.editReply({ content: "Command not found!" });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(help.title)
      .setDescription(help.description)
      .addFields(...help.fields)
      .setColor(0x00ff00)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}

module.exports = SlashCommandHandler;
