const cron = require("node-cron");
const { EmbedBuilder } = require("discord.js");
const { sendPostRequest } = require("./utils");

class NotificationSystem {
  constructor(client) {
    this.client = client;
    this.channels = {
      daily: process.env.DAILY_CHANNEL_ID,
      urgent: process.env.URGENT_CHANNEL_ID,
      general: process.env.GENERAL_CHANNEL_ID,
    };
  }

  async sendToChannel(channelType, embed) {
    const channel = this.client.channels.cache.get(this.channels[channelType]);
    if (channel) {
      await channel.send({ embeds: [embed] });
    }
  }

  init() {
    // Daily report at 9:00 AM
    cron.schedule("0 9 * * *", async () => {
      console.log("Running daily report task...");
      const result = await sendPostRequest("getDailyReport", {});

      if (result.success) {
        const embed = this.formatDailyReport(result.report);
        await this.sendToChannel("daily", embed);
      }
    });

    // Sprint health check at 11:00 AM
    cron.schedule("0 11 * * *", async () => {
      const result = await sendPostRequest("getDashboard", {});

      if (result.success) {
        const healthCheck = this.checkSprintHealth(result);
        if (healthCheck.needsAttention) {
          const embed = this.formatSprintHealthAlert(healthCheck);
          await this.sendToChannel("urgent", embed);
        }
      }
    });

    // Overdue task check every 6 hours
    cron.schedule("0 */6 * * *", async () => {
      const result = await sendPostRequest("getOverdueTasks", {});

      if (result.success && result.overdueTasks.length > 0) {
        const embed = this.formatOverdueTasksAlert(result.overdueTasks);
        await this.sendToChannel("urgent", embed);
      }
    });

    // Weekly sprint summary on Sunday at 18:00
    cron.schedule("0 18 * * 0", async () => {
      const result = await sendPostRequest("getDashboard", {});

      if (result.success) {
        const embed = this.formatWeeklySummary(result);
        await this.sendToChannel("general", embed);
      }
    });
  }

  formatDailyReport(report) {
    let description = "**📊 Daily Project Summary**\n\n";

    if (report.currentSprint) {
      description += `**Current Sprint #${report.currentSprint.sprintNumber}**\n`;
      description += `📌 Goal: ${report.currentSprint.goal}\n`;
      description += `📈 Progress: ${report.currentSprint.progress}\n`;
      description += `⏳ Days Remaining: ${report.currentSprint.remainingDays}\n\n`;
    }

    if (report.sprintHealth) {
      description += "**Sprint Health Check**\n";
      description += `${report.sprintHealth.schedule}\n`;
      description += `${report.sprintHealth.scope}\n`;
      description += `${report.sprintHealth.quality}\n`;
      description += `${report.sprintHealth.team}\n\n`;
    }

    if (report.teamWorkload && report.teamWorkload.length > 0) {
      description += "**Team Workload**\n";
      report.teamWorkload.forEach((member) => {
        description += `👤 ${member.name}: ${member.activeTasks} tasks (${member.totalHours}h)\n`;
      });
      description += "\n";
    }

    if (report.activeBugs && report.activeBugs.length > 0) {
      description += "**Active Bugs** 🐛\n";
      const highSeverityBugs = report.activeBugs.filter(
        (bug) => bug.severity === "High",
      );
      if (highSeverityBugs.length > 0) {
        description += `⚠️ High Severity: ${highSeverityBugs.length}\n`;
      }
      description += `Total: ${report.activeBugs.length}\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle("🌅 Daily Project Report")
      .setDescription(description)
      .setColor(0x00ff00)
      .setTimestamp()
      .setFooter({ text: "Project Management System" });

    return embed;
  }

  checkSprintHealth(dashboardData) {
    const currentSprint = dashboardData?.currentSprint;
    if (!currentSprint) return { needsAttention: false };

    const progressPercentage = parseFloat(currentSprint.progress);
    const daysRemaining = currentSprint.remainingDays;
    const issues = [];

    if (daysRemaining < 5 && progressPercentage < 70) {
      issues.push("Sprint progress is behind schedule");
    }

    if (dashboardData.sprintHealth?.schedule?.includes("⚠️")) {
      issues.push("Sprint schedule at risk");
    }

    if (
      dashboardData.activeBugs?.filter((bug) => bug.severity === "High")
        .length > 3
    ) {
      issues.push("Too many high-severity bugs");
    }

    return {
      needsAttention: issues.length > 0,
      issues: issues,
      sprint: currentSprint,
    };
  }

  formatSprintHealthAlert(healthCheck) {
    let description = "⚠️ **Sprint Health Alert**\n\n";
    description += `Sprint #${healthCheck.sprint.sprintNumber}\n\n`;
    description += "**Issues Detected:**\n";

    healthCheck.issues.forEach((issue) => {
      description += `🔴 ${issue}\n`;
    });

    description += "\nPlease review and take necessary actions.";

    const embed = new EmbedBuilder()
      .setTitle("🚨 Sprint Health Alert")
      .setDescription(description)
      .setColor(0xff0000)
      .setTimestamp();

    return embed;
  }

  formatOverdueTasksAlert(tasks) {
    let description = "**⚠️ Overdue Tasks Alert**\n\n";

    tasks.forEach((task) => {
      description += `**#${task.id}** ${task.taskName}\n`;
      description += `👤 ${task.assignedTo || "Unassigned"}\n`;
      description += `📅 Overdue by: ${task.overdueDays} days\n\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle("📋 Overdue Tasks")
      .setDescription(description)
      .setColor(0xff9900)
      .setTimestamp();

    return embed;
  }

  formatWeeklySummary(dashboardData) {
    let description = "**📊 Weekly Sprint Summary**\n\n";

    if (dashboardData.currentSprint) {
      const sprint = dashboardData.currentSprint;
      description += `**Sprint #${sprint.sprintNumber}**\n`;
      description += `Progress: ${sprint.progress}\n`;
      description += `Days remaining: ${sprint.remainingDays}\n\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle("📈 Weekly Summary")
      .setDescription(description)
      .setColor(0x4287f5)
      .setTimestamp();

    return embed;
  }
}

module.exports = NotificationSystem;
