class Analytics {
    static calculateTeamEfficiency(teamReport, sprintData) {
        const efficiency = {};
        
        teamReport.forEach(member => {
            const velocity = member.completedPoints / member.capacity * 100;
            efficiency[member.name] = {
                velocity: velocity.toFixed(1) + '%',
                taskCompletionRate: (member.completedTasks / member.totalTasks * 100).toFixed(1) + '%',
                averageTaskTime: member.averageTaskTime
            };
        });
        
        return efficiency;
    }

    static generateSprintVelocityChart(sprintHistory) {
        const sprintNumbers = sprintHistory.map(s => s.sprintNumber);
        const velocities = sprintHistory.map(s => s.velocity);
        const commitments = sprintHistory.map(s => s.committedPoints);
        
        return {
            labels: sprintNumbers,
            datasets: [
                {
                    label: 'Velocity',
                    data: velocities,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: 'Commitment',
                    data: commitments,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }
            ]
        };
    }
}

module.exports = Analytics;
