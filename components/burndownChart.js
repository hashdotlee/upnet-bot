const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const { AttachmentBuilder } = require("discord.js");

class BurndownChart {
  static async generateChart(sprintData) {
    const width = 800;
    const height = 400;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const configuration = {
      type: "line",
      data: {
        labels: sprintData.dates,
        datasets: [
          {
            label: "Ideal Burndown",
            data: sprintData.idealData,
            borderColor: "rgb(75, 192, 192)",
            borderDash: [5, 5],
            tension: 0.1,
          },
          {
            label: "Actual Burndown",
            data: sprintData.actualData,
            borderColor: "rgb(255, 99, 132)",
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Story Points",
            },
          },
          x: {
            title: {
              display: true,
              text: "Days",
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: `Sprint ${sprintData.sprintNumber} Burndown Chart`,
          },
        },
      },
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return new AttachmentBuilder(buffer, { name: "burndown-chart.png" });
  }
}

module.exports = BurndownChart;
