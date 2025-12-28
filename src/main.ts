// src/main.ts
import { IChatPanel, ILLMClient, IWidget } from './interfaces.js';
import { ChatPanel } from './components/chat-panel.js';
import { ConfigView } from './components/widgets/config-view.js';
import { LLMClient } from './services/llm-client.js';
import { ChatHistoryWidget } from './components/widgets/chat-history-widget.js';
import { Message, Terminable } from './types.js';
import { appConfig } from './config/app-config.js';

class GPTOverAPIApp {
    private chatPanel: IChatPanel;
    private llmClient: ILLMClient;
    private configView: IWidget;
    private currentChatId: string | null = null;
    private abortController: AbortController | null = null;
    private isProcessing = false;
    private activeWidgets: Map<string, Terminable> = new Map(); // Track active widgets by type
    private currentChatMessages: Message[] = []; // Store the actual message history for context

    constructor() {
        // Initialize components
        const chatContainer = document.getElementById('chat-container');
        
        if (!chatContainer) {
            throw new Error('Required DOM elements not found');
        }
        
        this.chatPanel = new ChatPanel(chatContainer);
        this.llmClient = new LLMClient();
        this.configView = new ConfigView(this.chatPanel);
        
        this.setupEventHandlers();
        this.loadInitialChat();
    }

    private setupEventHandlers(): void {
        const inputField = document.getElementById('user-input') as HTMLInputElement;
        const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
        const settingsBtn = document.getElementById('settings-btn');
        const chatHistoryBtn = document.getElementById('chat-history-btn');
        const newChatBtn = document.getElementById('new-chat-btn');

        if (!inputField || !sendBtn) {
            throw new Error('Input elements not found');
        }

        // Send button click handler
        sendBtn.addEventListener('click', () => {
            if (this.isProcessing) {
                this.cancelCurrentRequest();
            } else {
                this.handleSendMessage();
            }
        });

        // Enter key handler
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                e.preventDefault();
                if (!this.isProcessing) {
                    this.handleSendMessage();
                }
            }
        });

        // Settings button
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showWidget(this.configView);
            });
        }

        // Listen for LLM config changes to recreate client with new settings
        window.addEventListener('llmConfigChanged', () => {
            // Recreate the LLM client to pick up new settings
            this.llmClient = new LLMClient();
            // Update the title to reflect the new model
            appConfig.updateTitleWithModel();
        });

        // Chat history button
        if (chatHistoryBtn) {
            chatHistoryBtn.addEventListener('click', () => {
                const chatHistoryWidget: IWidget = new ChatHistoryWidget(
                    this.chatPanel,
                    (chatId) => this.loadChat(chatId),
                    () => this.startNewChat()
                );
                this.showWidget(chatHistoryWidget);
            });
        }

        // New chat button (if it exists in the chat history widget template)
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                this.startNewChat();
            });
        }
    }

    private async handleSendMessage(): Promise<void> {
        const inputField = document.getElementById('user-input') as HTMLInputElement;
        const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
        
        if (!inputField) return;
        
        const message = inputField.value.trim();
        if (!message) return;
        
        // Disable input and change button to cancel
        inputField.disabled = true;
        sendBtn.textContent = 'Cancel';
        this.isProcessing = true;
        
        // Clear input
        inputField.value = '';
        
        try {
            // Add user message to chat
            this.chatPanel.addMessage(message, 'user');
            
            // Add user message to context history
            this.currentChatMessages.push({ role: 'user', content: message });
            
            // Create abort controller for this request
            this.abortController = new AbortController();

            // Prepare messages for API call - include full chat history
            const messages: Message[] = [...this.currentChatMessages]; // Copy existing messages
            
            // Add the new user message
            messages.push({ role: 'user', content: message });

            // Get response from LLM
            const response = await this.llmClient.call(messages, this.abortController.signal);

            // Check if the response indicates API configuration is needed
            if (response === 'API_KEY_NOT_CONFIGURED') {
                // Show the config widget automatically and inform the user
                this.chatPanel.addMessage(appConfig.getText('messages.apiKeyNotConfigured', 'Please configure your LLM settings first.'), 'assist');
                this.configView.show();
                // Remove the user message from context history since we're not proceeding
                this.currentChatMessages.pop();
                return; // Exit early since we don't want to save this interaction
            }

            // Add assistant response to chat
            this.chatPanel.addMessage(response, 'assist');

            // Add assistant response to context history
            this.currentChatMessages.push({ role: 'assistant', content: response });

            // Save message to current chat history
            this.saveMessageToChat(message, 'user');
            this.saveMessageToChat(response, 'assistant');

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                this.chatPanel.addMessage('Request cancelled.', 'assist');
            } else {
                this.chatPanel.addMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'assist');
            }
        } finally {
            // Re-enable input and restore button
            inputField.disabled = false;
            sendBtn.textContent = 'Send';
            this.isProcessing = false;
            this.abortController = null;
        }
    }

    private cancelCurrentRequest(): void {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    private startNewChat(): void {
        // Clear current chat
        this.chatPanel.clear();
        this.chatPanel.addMessage('Hello! How can I help you today?', 'assist');

        // Initialize context for new chat
        this.currentChatMessages = [{ role: 'assistant', content: 'Hello! How can I help you today?' }];

        // Create new chat in sidebar
        const newChatId = this.addChatToHistory('New Chat');
        this.currentChatId = newChatId;

        // Store empty chat history
        this.saveChatHistory(newChatId, []);
    }

    private loadInitialChat(): void {
        // Check if there are existing chats
        const storedHistory = localStorage.getItem('gptOverApiChatHistory');
        if (storedHistory) {
            try {
                const history = JSON.parse(storedHistory);
                if (history.length > 0) {
                    // Load the most recent chat
                    this.loadChat(history[0].id);
                    return;
                }
            } catch (e) {
                console.error('Error loading initial chat:', e);
            }
        }

        // If no existing chats, start a new one
        this.startNewChat();
    }

    private loadChat(chatId: string): void {
        try {
            const chatData = localStorage.getItem(`gptOverApiChat_${chatId}`);
            if (chatData) {
                const messages = JSON.parse(chatData);

                // Clear current chat panel
                this.chatPanel.clear();

                // Clear current chat messages context
                this.currentChatMessages = [];

                // Add all messages to the chat panel and context
                messages.forEach((msg: Message) => {
                    this.chatPanel.addMessage(msg.content, msg.role);
                    this.currentChatMessages.push(msg);
                });
            } else {
                // If no data found, start with a greeting
                this.chatPanel.clear();
                this.chatPanel.addMessage('Hello! How can I help you today?', 'assist');
                // Initialize context for new chat
                this.currentChatMessages = [{ role: 'assistant', content: 'Hello! How can I help you today?' }];
            }

            this.currentChatId = chatId;
        } catch (e) {
            console.error('Error loading chat:', e);
            this.chatPanel.clear();
            this.chatPanel.addMessage('Error loading chat. Starting a new conversation.', 'assist');
            // Initialize context on error
            this.currentChatMessages = [{ role: 'assistant', content: 'Error loading chat. Starting a new conversation.' }];
            this.startNewChat();
        }
    }

    private saveMessageToChat(content: string, role: 'user' | 'assistant' | 'assist'): void {
        if (!this.currentChatId) return;

        try {
            // Load existing messages
            let messages: Message[] = [];
            const stored = localStorage.getItem(`gptOverApiChat_${this.currentChatId}`);
            if (stored) {
                messages = JSON.parse(stored);
            }

            // Add new message
            messages.push({ role, content });

            // Save updated messages
            localStorage.setItem(`gptOverApiChat_${this.currentChatId}`, JSON.stringify(messages));

            // Update chat title if it's the first message
            if (messages.length === 1 && role === 'user') {
                this.updateChatTitle(this.currentChatId, content.substring(0, 30) + (content.length > 30 ? '...' : ''));
            }
        } catch (e) {
            console.error('Error saving message to chat:', e);
        }
    }

    private saveChatHistory(chatId: string, messages: Message[]): void {
        try {
            localStorage.setItem(`gptOverApiChat_${chatId}`, JSON.stringify(messages));
        } catch (e) {
            console.error('Error saving chat history:', e);
        }
    }

    private updateChatTitle(chatId: string, title: string): void {
        try {
            const stored = localStorage.getItem('gptOverApiChatHistory');
            if (stored) {
                const history = JSON.parse(stored);
                const chat = history.find((c: any) => c.id === chatId);
                if (chat) {
                    chat.title = title;
                    localStorage.setItem('gptOverApiChatHistory', JSON.stringify(history));
                }
            }
        } catch (e) {
            console.error('Error updating chat title:', e);
        }
    }

    private addChatToHistory(title: string): string {
        const id = this.generateId();
        const newChat = {
            id,
            title: title.substring(0, 50), // Limit title length
            timestamp: Date.now()
        };

        try {
            // Load existing history
            let history = [];
            const stored = localStorage.getItem('gptOverApiChatHistory');
            if (stored) {
                history = JSON.parse(stored);
            }

            // Add new chat to beginning
            history.unshift(newChat);

            // Save updated history
            localStorage.setItem('gptOverApiChatHistory', JSON.stringify(history));

            return id;
        } catch (e) {
            console.error('Error adding chat to history:', e);
            return id;
        }
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    private showWidget(widget: IWidget): void {
        // If the widget has a type, deactivate any existing widget of the same type
        if (widget.getType) {
            const widgetType = widget.getType();
            if (widgetType) {
                const existingWidget = this.activeWidgets.get(widgetType);
                if (existingWidget) {
                    existingWidget.freeze();
                }

                // Show the new widget and track it
                const newWidget = widget.show();
                this.activeWidgets.set(widgetType, newWidget);
            } else {
                // If no type, just show the widget without tracking
                widget.show();
            }
        } else {
            // If no getType method, just show the widget
            widget.show();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await appConfig.init();
    new GPTOverAPIApp();
    // Update the title to show the current model
    appConfig.updateTitleWithModel();
});