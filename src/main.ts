// src/main.ts
import {
    IChatHistoryManager,
    IChatPanel,
    IChatService,
    ILLMClient,
    IMessageContextManager,
    IWidget,
    IWidgetManager
} from './interfaces.js';
import {ChatPanel} from './components/chat-panel.js';
import {ConfigView} from './components/widgets/config-view.js';
import {LLMClient} from './services/llm-client.js';
import {ChatHistoryWidget} from './components/widgets/chat-history-widget.js';
import {appConfig} from './config/app-config.js';
import {ChatService} from './services/chat-service.js';
import {MessageContextManager} from './services/message-context-manager.js';
import {ChatHistoryManager} from './services/chat-history-manager.js';
import {WidgetManager} from './services/widget-manager.js';


class GPTOverAPIApp {
    private chatPanel: IChatPanel;
    private llmClient: ILLMClient;
    private chatService: IChatService;
    private contextManager: IMessageContextManager;
    private historyManager: IChatHistoryManager;
    private widgetManager: IWidgetManager;
    private configView: IWidget;

    constructor() {
        const chatContainer = document.getElementById('chat-container');
        if (!chatContainer) {
            throw new Error('Required DOM elements not found');
        }
        this.chatPanel = new ChatPanel(chatContainer);
        this.llmClient = new LLMClient();
        this.contextManager = new MessageContextManager(appConfig);
        this.contextManager.setChatPanel(this.chatPanel); // Connect chat panel to context manager
        this.chatService = new ChatService(this.chatPanel, this.llmClient, this.contextManager);
        this.historyManager = new ChatHistoryManager(this.chatPanel, this.chatService, this.contextManager);
        this.widgetManager = new WidgetManager();
        this.configView = new ConfigView(this.chatPanel);

        this.setupEventHandlers();
        this.historyManager.loadInitialChat();
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

        sendBtn.addEventListener('click', () => {
            if (this.chatService.isProcessing()) {
                this.chatService.cancelCurrentRequest();
            } else {
                this.handleSendMessage();
            }
        });

        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                e.preventDefault();
                if (!this.chatService.isProcessing()) {
                    this.handleSendMessage();
                }
            }
        });

        inputField.addEventListener('input', () => {
            const allMessages = this.chatService.getCurrentChatMessages();
            this.contextManager.updateContextHighlights(inputField.value.trim(), allMessages);
        });

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.widgetManager.showWidget(this.configView);
            });
        }

        window.addEventListener('llmConfigChanged', () => {
            this.llmClient = new LLMClient();
            appConfig.updateTitleWithModel();
        });

        if (chatHistoryBtn) {
            chatHistoryBtn.addEventListener('click', () => {
                const chatHistoryWidget: IWidget = new ChatHistoryWidget(
                    this.chatPanel,
                    (chatId) => this.historyManager.loadChat(chatId),
                    () => this.startNewChat()
                );
                this.widgetManager.showWidget(chatHistoryWidget);
            });
        }

        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                this.startNewChat();
            });
        }
        document.addEventListener('messageContextToggle', (e) => {
            const event = e as CustomEvent;
            const detail = event.detail;

            if (detail.manualOverride) {
                this.contextManager.toggleMessageInContext(detail.messageId, detail.inContext);

                // Update context highlights immediately
                const inputField = document.getElementById('user-input') as HTMLInputElement;
                if (inputField) {
                    const allMessages = this.chatService.getCurrentChatMessages();
                    this.contextManager.updateContextHighlights(inputField.value.trim(), allMessages);
                }
            }
        });
    }

    private async handleSendMessage(): Promise<void> {
        const inputField = document.getElementById('user-input') as HTMLInputElement;
        const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
        if (!inputField) return;

        const message = inputField.value.trim();
        if (!message) return;

        inputField.disabled = true;
        sendBtn.textContent = 'Cancel';
        inputField.value = '';

        try {
            // Use the chat service to handle the message
            await this.chatService.sendMessage(message);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                this.chatPanel.addMessage('Request cancelled.', 'assistant');
            } else {
                this.chatPanel.addMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'assistant');
            }
        } finally {
            inputField.disabled = false;
            sendBtn.textContent = 'Send';
        }
    }

    private startNewChat(): void {
        this.historyManager.startNewChat();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await appConfig.init();
    new GPTOverAPIApp();
    appConfig.updateTitleWithModel();
});