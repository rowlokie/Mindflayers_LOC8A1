# 🗝️ How to Set Up Your Gemini API Key (Step-by-Step)

To make the AI features (Chatbot, Automated Outreach, Trade Insights) work perfectly with a single free key, follow these steps:

### 1. Get your API Key from Google AI Studio
1.  Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2.  Sign in with your Google Account.
3.  Click on the **"Create API key"** button.
4.  Copy the generated key (it will look like `AIzaSy...`).

---

### 2. Add the Key to your Project
1.  Open your project folder: `TradePulse-AI`.
2.  Go to the **`backend/`** directory.
3.  Open the **`.env`** file.
4.  Add a new line at the bottom:
    ```env
    GEMINI_API_KEY=YOUR_COPIED_KEY_HERE
    ```
5.  *(Optional but recommended)* If you have an `OPENROUTER_API_KEY`, you can keep it, but the system will now prioritize your **Gemini API Key**.

---

### 3. Verify the AI is Working
1.  Restart your backend server (or let it auto-restart).
2.  Go to the **Connections** tab in the app.
3.  Select a partner and click the **✨ Zap (AI)** icon next to the message box.
4.  The system should now use **Gemini 2.0 Flash** directly to generate a perfect trade outreach or response.

---

### 🛠️ Why this is better:
- **Zero Cost**: Gemini 2.0 Flash is free in AI Studio for most regions.
- **Ultra-Fast**: Native Google API is significantly faster than going through OpenRouter.
- **Single Key**: One key handles the Chatbot, the Outreach agent, and the Insight generator.
- **Multimodal**: This key supports advanced reasoning for trade data.

---
### **TradePulse AI: Autonomous Trade, Scientific Matching.**
