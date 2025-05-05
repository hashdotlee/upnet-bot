const { OpenAI } = require("openai");

class AIAssistant {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  async suggestTaskBreakdown(userStoryDescription) {
    const prompt = `Break down this user story into development tasks:
        "${userStoryDescription}"
        
        Format the response as:
        1. Task name - estimate in hours
        2. Task name - estimate in hours
		Return only the task list, no additional text.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("OpenAI API error:", error);
      return null;
    }
  }

  async generateSprintGoal(projectContext, upcomingFeatures) {
    const prompt = `Generate a sprint goal based on:
       Project: ${projectContext}
       Upcoming features: ${upcomingFeatures.join(", ")}
       
       Keep it concise and focused.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 100,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("OpenAI API error:", error);
      return null;
    }
  }

  async suggestBugSolution(bugDescription, errorLogs) {
    const prompt = `Suggest a solution for this bug:
       Bug: ${bugDescription}
       Error logs: ${errorLogs}
       
       Provide a concise troubleshooting guide.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("OpenAI API error:", error);
      return null;
    }
  }
}

module.exports = AIAssistant;
