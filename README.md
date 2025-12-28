# LocalAIWaves: Your Local, Zero-Server Chat Client

> **Formerly known as GPT Over API** — Thank you to everyone who starred this repository over the past few years. We're evolving to better reflect our core values and capabilities.

## 🔍 What Is This?

A **single HTML file** that lets you chat with any LLM that has an OpenAI-compatible API endpoint. No servers. No accounts. No data leaving your browser. Just open the file and start talking to your favorite model - whether it's running locally on your machine or hosted in the cloud.

## ✨ Core Philosophy

This isn't just another chat UI. It's an **experimental architecture** exploring how we can:
- Keep UIs **simple yet powerful** through widget composition
- Handle **long conversations intelligently** without sending everything to the model
- Give users **transparent control** over what context is used
- Build **progressively enhanced experiences** that start minimal but can grow sophisticated

Everything runs in your browser. Your conversations, API keys, and context management stay on your device.

## 🛠️ Current Features

### As a Simple Chat Client:
- Connect to **any OpenAI-compatible API** (OpenAI, OpenRouter, LMStudio, Ollama, vLLM, etc.)
- Save and load **multiple chat histories** in your browser's localStorage
- Switch between models instantly without reloading
- Clean, responsive interface that works on mobile and desktop

### As an Experimental Context Manager:
- **Context-aware messaging**: Instead of sending the entire chat history to the LLM, the app intelligently selects relevant messages using TF-IDF indexing
- **Visual context indicators**: See exactly which messages are included in the context with intuitive checkboxes
- **Real-time context preview**: Watch context selections update as you type your query
- **Widget-based architecture**: The foundation is built for easy extension with custom UI components

## 🌐 How to Use

### Option 1: Use the live demo (easiest)
Just visit **[https://krivich.github.io/GPT-Over-API/](https://krivich.github.io/GPT-Over-API/)** in any modern browser and start chatting.

### Option 2: Run locally (for tinkerers)
1. Download or clone this repository
2. Open `index.html` directly in your browser (no server needed!)
3. Configure your LLM settings:
    - API endpoint (e.g., `http://localhost:1234/v1/chat/completions` for local models)
    - API key (leave empty if not required)
    - Model name (e.g., `gpt-3.5-turbo`, `mistral`, `phi-3`)
4. Start chatting - your conversations are saved automatically in your browser

No installation. No servers. No configuration files beyond what's in the UI.

## 🧪 Experimental Architecture

This project explores a component-based architecture with two key innovations:

### Widget-Oriented UI
Every UI element is a self-contained widget that:
- Can be shown/hidden without breaking the interface
- Manages its own state and DOM
- Communicates through explicit contracts, not global state
- Can be composed to create complex interactions

```html
<!-- Example: Settings widget template is already in HTML -->
<template id="config-widget-template">
    <div class="ha-widget">
        <!-- Widget content -->
    </div>
</template>
```

### Context-Aware Communication
Instead of naively sending all chat history to the LLM:
1. The system builds a **TF-IDF index** of your conversation
2. As you type, it finds the **most relevant past messages**
3. Only those messages (plus recent exchanges) are included in the context
4. You can **see and modify** what's included via checkboxes

This approach:
- Respects token limits while preserving relevant context
- Makes context selection transparent rather than hidden
- Gives users control over what the AI "remembers"
- Scales to thousands of messages without performance issues

## 🚀 Technical Highlights

- **Zero dependencies**: Pure HTML/CSS/JS that works offline
- **Component architecture**: Clean separation of concerns with explicit interfaces
- **Progressive enhancement**: Core chat works immediately; advanced features layer on top
- **Privacy-focused**: Your API keys and conversations never leave your browser
- **Adaptable tokenizer**: Works with multiple languages and technical content

## 🔜 What's Next (Roadmap)

This is a living experiment. Current development focuses on:
- **Message queue** for sending multiple requests without waiting
- **Dynamic chat collapsing** to focus on relevant conversation segments
- **Cross-chat context retrieval** to pull relevant information from your entire chat history
- **Project-based organization** to group related conversations

## 🧩 For Developers

The code is intentionally minimal and readable:
- Core logic fits in ~500 lines in `main.ts`
- Clear interfaces define component contracts
- Configuration is centralized but overridable
- Architecture prioritizes readability over cleverness

```bash
npm install
npm run build  # Creates the self-contained index.html
```

## ⚠️ Important Notes

- **This is experimental software** - features may change or break
- **API keys are stored in localStorage** - use caution on shared computers
- **Context selection is heuristic** - you may need to manually adjust which messages are included
- **Performance scales with conversation length** - extremely long chats (>1000 messages) may slow down indexing

---

**LocalAIWaves is not just a chat client—it's a research vehicle for rethinking how humans interact with LLMs when we treat context as a first-class citizen rather than an afterthought.** Everything stays in your browser. You own your conversations. You control the context.