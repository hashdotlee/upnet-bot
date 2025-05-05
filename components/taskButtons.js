const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

class TaskComponents {
    static createTaskButtons(taskId) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`task_update_${taskId}_todo`)
                    .setLabel('To Do')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`task_update_${taskId}_inprogress`)
                    .setLabel('In Progress')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`task_update_${taskId}_done`)
                    .setLabel('Done')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`task_update_${taskId}_blocked`)
                    .setLabel('Blocked')
                    .setStyle(ButtonStyle.Danger)
            );

        return row;
    }

    static createAssignmentMenu(taskId, teamMembers) {
        const options = teamMembers.map(member => ({
            label: member.name,
            value: `assign_${taskId}_${member.name}`,
            description: member.role
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`task_assign_${taskId}`)
            .setPlaceholder('Assign to a team member')
            .addOptions(options);

        return new ActionRowBuilder().addComponents(selectMenu);
    }
}

module.exports = TaskComponents;
