# TradePulse AI 🚀
### *The World's First Autonomous B2B Trade Matchmaking Agent*

TradePulse AI is a next-generation MERN-stack platform designed to revolutionize global commerce. By integrating a deep firmographic dataset of **5,000+ global trade leads** with advanced LLMs and a custom-built scoring engine, we eliminate the friction in finding and starting trade relationships.

---

## 🌟 Key Presentation Points (For Judges)

### 1. **Pure Dataset-Driven Discovery**
Unlike traditional platforms that rely on a small pool of active users, TradePulse AI leverages a massive **CSV-based lead database**. 
- **Scale**: Instant access to 5,000+ verified importers and exporters.
- **Hydration**: The system dynamically "hydrates" connection data, making static CSV records feel like live platform participants.

### 2. **TradeCupid™ Matching Engine**
At the heart of the platform is the **TradeCupid Engine**, a hybrid scoring algorithm (originally ported from Python) that calculates a **Match Score (0-100)** based on:
- **Geo-Fit**: Proximity and trade route feasibility.
- **Industry Alignment**: Deep taxonomic matching of products and categories.
- **Scale-Match**: Ensuring buyers and sellers are at compatible operation levels.
- **Risk-Sensitivity**: Scoring based on historical reliability and certification requirements.

### 3. **Autonomous Outreach Agent**
TradePulse isn't just a dashboard; it's an **Active Agent**.
- **Instant Outreach**: When an "Interested" action (Like) is triggered, the AI immediately analyzes the synergy and generates a precision outreach message.
- **Natural Language Chat**: A persistent AI Chatbot (powered by Gemini 2.0) that knows your company profile and can guide you through trade regulations, certification prep, and matching strategy.

### 4. **Enterprise-Grade Execution**
- **Smart Meetings**: Integrated HD video conferencing (via Jitsi) for digital trade delegations.
- **Insight Hub**: AI-powered "Trade Insights" that perform a SWOT analysis on potential partners in real-time.
- **Visual Excellence**: A premium, motion-heavy glassmorphic UI built for speed and engagement.

---

## 🛠️ Technical Architecture

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React, Framer Motion, Lucide | Premium, Interactive UX |
| **Backend** | Node.js, Express | Scalable API Orchestration |
| **Intelligence** | OpenRouter (Gemini 2.0 Flash) | Natural Language Generation & Analytics |
| **Logic** | TradeCupid Engine (JS/Python ported) | Multi-Dimension Match Scoring |
| **Database** | MongoDB & CSV | Hybrid storage for User Auth + Global Lead Data |

---

## 🚀 The Future of Trade

**TradePulse AI** transforms the passive "search and wait" model of current trade platforms into an **active, autonomous cycle**:
1. **Discover**: AI surfaces high-synergy partners from the 5k+ dataset.
2. **Qualify**: Match scores and AI insights validate the partnership.
3. **Connect**: Autonomous outreach starts the conversation instantly.
4. **Close**: High-definition video calls via the Trade Calendar finalize the deal.

---

## 📂 Project Structure

- **`/backend`**: Express server, AI microservices, and TradeCupid implementation.
- **`/frontend`**: React dashboard, Trade Calendar, and Match Hunter UI.
- **`/backend/utils/csvHelper.js`**: Data hydration logic for the 5,000+ leads.
- **`/backend/services/tradeCupidEngine.js`**: Core scoring algorithm.
- **`matchmaker.py`**: Original Python proof-of-concept for the scoring model.

---

## 🧠 Technical Deep-Dive (Model & Logic)

### 1. The TradeCupid™ Hybrid Scoring Engine
Unlike simple keyword matching, our engine uses a **9-Dimensional Weighted Vector Model** to determine compatibility. Each match score (0-100) is a derivation of:

| Dimension | Weight | logic |
| :--- | :--- | :--- |
| **Demand Fit** | 18% | Log-ratio analysis of manufacturing capacity vs. average order size. |
| **Geo-Fit** | 15% | Uses established **Trade Corridors** (e.g., Solar-Australia) to favor historically stable routes. |
| **Behavioral Fit** | 17% | Calculates `Intent_Score` and `Response_Probability` using behavioral firmographics. |
| **Reliability** | 15% | Jaccard Similarity on certifications (ISO, FDA, GMP) + payment history analysis. |
| **Scale Fit** | 12% | Euclidean distance between revenue size and team headcount. |
| **Safety/Risk** | 10% | **Industry Risk Mapping**: Real-time integration of a "Global News" dataset to penalize sectors with high war risk or tariff fluctuations. |

### 2. Dynamic Data Hydration (CSV to MongoDB)
We solve the "Cold Start" problem of trade platforms by using a **Dataset-First Architecture**.
- **The Core**: A dataset of **5,000+ verified importers/exporters** stored in optimized CSV assets.
- **Hydration**: The `csvHelper` dynamically parses these firmographics and "hydrates" them into our Node.js environment.
- **Hybrid IDs**: Our backend uses a custom resolution logic to treat `String-based Dataset IDs` (e.g., `BUY_123`) and `MongoDB ObjectIDs` as first-class citizens, enabling seamless AI Chat and Messaging with static leads.

### 3. Autonomous Agent Workflow (Gemini 2.0 Integration)
The agent operates on a **Closed-Loop Intelligence** cycle:
- **Observation**: Monitor user "likes" on the Swipe/Discover queue.
- **Reasoning**: The `generateOutreachMessage` utility sends the Sender's full trade profile + Receiver's firmographics to Gemini 2.0 Flash with a "Matchmaker Personal" prompt.
- **Action**: The AI writes a context-aware message, creates a `Connection` record, and injects the message into the chat history autonomously.

### 4. Interactive Simulation (Algorithm Lab)
We are the first platform to include an **Algorithm Lab**. This allows judges to:
- See the raw scoring vectors for any match.
- Understand the decision-making process of the TradeCupid engine.
- Verify the "AI Reason" provided for every recommended lead.

---

### **"TradePulse AI doesn't just find leads—it builds trade bridges autonomously."**
