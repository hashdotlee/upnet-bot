const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

// Tạo instance axios với retry đơn giản
const axiosWithRetry = axios.create();

axiosWithRetry.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Nếu không có config hoặc đã retry quá nhiều lần
    if (!config || !config.retry) config.retry = 0;
    if (config.retry >= 3) {
      return Promise.reject(error);
    }

    // Tăng số lần retry
    config.retry += 1;

    // Chờ một chút trước khi retry
    await new Promise((resolve) => setTimeout(resolve, 1000 * config.retry));

    return axiosWithRetry(config);
  },
);

async function sendPostRequest(action, params) {
  try {
    const response = await axiosWithRetry.post(
      process.env.GOOGLE_APPS_SCRIPT_URL,
      {
        action: action,
        params: params,
      },
    );
	console.log(response);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: error.message };
  }
}

function createEmbed(title, description, color = 0x00ff00) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

module.exports = {
  sendPostRequest,
  createEmbed,
};
