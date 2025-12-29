// src/main.ts
import { IChatPanel, ILLMClient, IWidget } from './interfaces.js';
import { ChatPanel } from './components/chat-panel.js';
import { ConfigView } from './components/widgets/config-view.js';
import { LLMClient } from './services/llm-client.js';
import { ChatHistoryWidget } from './components/widgets/chat-history-widget.js';
import { Message, Terminable } from './types.js';
import { appConfig } from './config/app-config.js';
import { ChatTfidfIndex } from './services/tfidf-index.js';
import { MessageWidget } from './components/widgets/message-widget.js';

class GPTOverAPIApp {
    private chatPanel: IChatPanel;
    private llmClient: ILLMClient;
    private configView: IWidget;
    private currentChatId: string | null = null;
    private abortController: AbortController | null = null;
    private isProcessing = false;
    private activeWidgets: Map<string, Terminable> = new Map();
    private currentChatMessages: Message[] = [];
    private tfidfIndex: ChatTfidfIndex = new ChatTfidfIndex();
    private contextPreviewDebounceTimer: number | null = null;
    private manualContextOverrides: Map<string, boolean> = new Map(); // messageId -> inContext

    constructor() {
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

        sendBtn.addEventListener('click', () => {
            if (this.isProcessing) {
                this.cancelCurrentRequest();
            } else {
                this.handleSendMessage();
            }
        });

        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                e.preventDefault();
                if (!this.isProcessing) {
                    this.handleSendMessage();
                }
            }
        });

        inputField.addEventListener('input', () => {
            this.updateContextHighlights(inputField.value.trim());
        });

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showWidget(this.configView);
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
                    (chatId) => this.loadChat(chatId),
                    () => this.startNewChat()
                );
                this.showWidget(chatHistoryWidget);
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
                this.manualContextOverrides.set(detail.messageId, detail.inContext);

                // Update context highlights immediately
                const inputField = document.getElementById('user-input') as HTMLInputElement;
                if (inputField) {
                    this.updateContextHighlights(inputField.value.trim());
                }
            }
        });
    }

    private updateContextHighlights(query: string): void {
        if (this.contextPreviewDebounceTimer) {
            clearTimeout(this.contextPreviewDebounceTimer);
        }

        this.contextPreviewDebounceTimer = window.setTimeout(() => {
            this.contextPreviewDebounceTimer = null;
            const contextMsgs = this.getContextMessages(query, this.currentChatMessages);
            const contextIds = new Set(contextMsgs.map(m => m.id));

            // Update visual state of all messages
            document.querySelectorAll('.msg').forEach(msgEl => {
                const messageId = (msgEl as HTMLElement).dataset.messageId;
                if (messageId) {
                    const inContext = contextIds.has(messageId);
                    msgEl.classList.toggle('in-context', inContext);

                    // Update context indicator text
                    const indicator = msgEl.querySelector('.context-indicator');
                    if (indicator) {
                        indicator.textContent = inContext ? 'in context' : '';
                    }
                }
            });
        }, 150); // Reduced debounce time for more responsive UI
    }

    private getContextMessages(query: string, allMessages: Message[]): Message[] {
        const N = appConfig.get(5, 'llm.context.lastMessages');
        const K = appConfig.get(3, 'llm.context.ragMessages');

        // Always include the last N messages
        const lastN = allMessages.slice(-N);
        const lastNIds = new Set(lastN.map(m => m.id));

        // Get relevant messages based on query
        const rawRelevant = this.tfidfIndex.findRelevant(query, N + K);

        // Filter out duplicates from lastN and take only K messages
        const trulyRelevant = rawRelevant
            .filter(msg => !lastNIds.has(msg.id))
            .slice(0, K);

        // Base context with chronologically sorted messages
        let contextMessages = [
            ...trulyRelevant,
            ...lastN
        ].sort((a, b) =>
            allMessages.findIndex(m => m.id === a.id) -
            allMessages.findIndex(m => m.id === b.id)
        );

        // Apply manual overrides from user interactions
        contextMessages = this.applyManualContextOverrides(contextMessages, allMessages);

        return contextMessages;
    }

    private applyManualContextOverrides(baseContext: Message[], allMessages: Message[]): Message[] {
        const result = [...baseContext];
        const contextIds = new Set(result.map(m => m.id));

        // Process manual overrides
        this.manualContextOverrides.forEach((inContext, messageId) => {
            const messageIndex = result.findIndex(m => m.id === messageId);

            // If message is in base context but user excluded it
            if (messageIndex !== -1 && !inContext) {
                result.splice(messageIndex, 1);
            }
            // If message is not in base context but user included it
            else if (messageIndex === -1 && inContext) {
                const messageToAdd = allMessages.find(m => m.id === messageId);
                if (messageToAdd) {
                    result.push(messageToAdd);
                }
            }
        });

        // Sort chronologically for better LLM understanding
        return result.sort((a, b) =>
            allMessages.findIndex(m => m.id === a.id) -
            allMessages.findIndex(m => m.id === b.id)
        );
    }

    private async handleSendMessage(): Promise<void> {
        const inputField = document.getElementById('user-input') as HTMLInputElement;
        const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
        if (!inputField) return;

        const message = inputField.value.trim();
        if (!message) return;

        inputField.disabled = true;
        sendBtn.textContent = 'Cancel';
        this.isProcessing = true;
        inputField.value = '';

        try {
            const userMessageId = this.generateId();
            const userMessage = { id: userMessageId, role: 'user' as const, content: message };

            // Добавляем сообщение в чат через виджет
            const userWidget = new MessageWidget(message, userMessageId);
            this.chatPanel.addMessageWidget(userWidget.getElement(), 'user');

            // Добавляем в контекст
            this.currentChatMessages.push(userMessage);

            // Обновляем индекс
            this.updateTfidfIndex();

            this.abortController = new AbortController();

            // Формируем контекст для отправки в LLM
            const contextMessages = this.getContextMessages(message, this.currentChatMessages);

            // Используем оригинальные сообщения (с id), LLMClient сам преобразует их для API
            const apiMessages = contextMessages;

            // Создаем виджет с загрузкой для ответа ассистента
            const assistantMessageId = this.generateId();
            const assistantWidget = new MessageWidget('', assistantMessageId); // Empty content to show loading
            this.chatPanel.addMessageWidget(assistantWidget.getElement(), 'assistant');

            // Получаем ответ
            const response = await this.llmClient.call(apiMessages, this.abortController.signal);

            if (response === 'API_KEY_NOT_CONFIGURED') {
                // Обновляем виджет с сообщением об ошибке
                assistantWidget.updateContent(appConfig.getText('messages.apiKeyNotConfigured', 'Please configure your LLM settings first.'));
                this.configView.show();
                // Удаляем только что добавленное сообщение из контекста
                this.currentChatMessages.pop();
                return;
            }

            // Обновляем виджет с ответом
            assistantWidget.updateContent(response);

            // Добавляем ответ ассистента в контекст
            const assistantMessage = {
                id: assistantMessageId,
                role: 'assistant' as const,
                content: response
            };

            this.currentChatMessages.push(assistantMessage);

            // Сохраняем в историю чата
            if (this.currentChatId) {
                this.saveMessageToChat(userMessage);
                this.saveMessageToChat(assistantMessage);
            }

            // Сброс галочек после отправки
            this.clearContextHighlights();

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                this.chatPanel.addMessage('Request cancelled.', 'assistant');
            } else {
                this.chatPanel.addMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'assistant');
            }
        } finally {
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
        this.chatPanel.clear();
        this.currentChatMessages = [];
        this.manualContextOverrides.clear(); // Reset context overrides

        // Add welcome message
        const welcomeId = this.generateId();
        const welcomeMessage = {
            id: welcomeId,
            role: 'assistant' as const,
            content: appConfig.getText('app.greeting', 'Hello! How can I help you today?')
        };

        const welcomeWidget = new MessageWidget(welcomeMessage.content, welcomeId);
        welcomeWidget.setInContext(true); // Welcome message is always in context
        this.chatPanel.addMessageWidget(welcomeWidget.getElement(), 'assistant');
        this.currentChatMessages.push(welcomeMessage);

        // Create new chat
        const newChatId = this.addChatToHistory(appConfig.getText('app.newChatTitle', 'New Chat'));
        this.currentChatId = newChatId;

        // Build index
        this.tfidfIndex.buildIndex(this.currentChatMessages);
        this.saveChatState();
    }

    private loadInitialChat(): void {
        const storedHistory = localStorage.getItem('gptOverApiChatHistory');
        if (storedHistory) {
            try {
                const history = JSON.parse(storedHistory);
                if (history.length > 0) {
                    this.loadChat(history[0].id);
                    return;
                }
            } catch (e) {
                console.error('Error loading initial chat:', e);
            }
        }
        this.startNewChat();
    }

    private loadChat(chatId: string): void {
        try {
            this.currentChatId = chatId;

            // Load messages
            const chatData = localStorage.getItem(`gptOverApiChat_${chatId}`);
            if (chatData) {
                const messages = JSON.parse(chatData).map((msg: any) => ({
                    ...msg,
                    id: msg.id || this.generateId()
                }));

                this.chatPanel.clear();
                this.currentChatMessages = [];

                // Create widgets for messages
                messages.forEach((msg: Message) => {
                    const displayRole = (msg.role as string) === 'assist' ? 'assistant' : msg.role;
                    const widget = new MessageWidget(msg.content, msg.id);
                    this.chatPanel.addMessageWidget(widget.getElement(), displayRole);

                    // Fix old message roles
                    if ((msg.role as string) === 'assist') {
                        (msg as any).role = 'assistant';
                    }

                    this.currentChatMessages.push(msg);
                });

                // Load manual context overrides
                this.manualContextOverrides.clear();
                const overridesData = localStorage.getItem(`gptOverApiChatContextOverrides_${chatId}`);
                if (overridesData) {
                    const overrides = JSON.parse(overridesData);
                    Object.entries(overrides).forEach(([messageId, inContext]) => {
                        this.manualContextOverrides.set(messageId, inContext as boolean);
                    });
                }

                // Restore or rebuild TF-IDF index
                const cachedIndex = localStorage.getItem(`gptOverApiChatIndex_${chatId}`);
                if (cachedIndex && this.tfidfIndex.deserialize(cachedIndex, this.currentChatMessages)) {
                    console.log('TF-IDF index restored from cache');
                } else {
                    this.tfidfIndex.buildIndex(this.currentChatMessages);
                }

                // Update context highlights
                const inputField = document.getElementById('user-input') as HTMLInputElement;
                if (inputField) {
                    this.updateContextHighlights(inputField.value.trim());
                }
            } else {
                this.startNewChat();
            }
        } catch (e) {
            console.error('Error loading chat:', e);
            this.startNewChat();
        }
    }


    private saveMessageToChat(message: Message): void {
        if (!this.currentChatId) return;

        try {
            let messages: Message[] = [];
            const stored = localStorage.getItem(`gptOverApiChat_${this.currentChatId}`);
            if (stored) {
                messages = JSON.parse(stored);
            }

            messages.push(message);
            localStorage.setItem(`gptOverApiChat_${this.currentChatId}`, JSON.stringify(messages));

            // Update chat title for first user message
            if (messages.length === 2 && message.role === 'user') {
                const title = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '');
                this.updateChatTitle(this.currentChatId, title);
            }

            // Update index
            this.updateTfidfIndex();
        } catch (e) {
            console.error('Error saving message to chat:', e);
        }
    }

    private saveChatState(): void {
        if (!this.currentChatId) return;

        try {
            // Save messages
            localStorage.setItem(
                `gptOverApiChat_${this.currentChatId}`,
                JSON.stringify(this.currentChatMessages)
            );

            // Save context overrides
            const overrides = Object.fromEntries(this.manualContextOverrides);
            localStorage.setItem(
                `gptOverApiChatContextOverrides_${this.currentChatId}`,
                JSON.stringify(overrides)
            );

            // Save TF-IDF index
            localStorage.setItem(
                `gptOverApiChatIndex_${this.currentChatId}`,
                this.tfidfIndex.serialize()
            );
        } catch (e) {
            console.error('Error saving chat state:', e);
        }
    }

    private updateTfidfIndex(): void {
        if (!this.currentChatId) return;

        this.tfidfIndex.buildIndex(this.currentChatMessages);
        localStorage.setItem(`gptOverApiChatIndex_${this.currentChatId}`, this.tfidfIndex.serialize());
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
            title: title.substring(0, 50),
            timestamp: Date.now()
        };

        try {
            let history = [];
            const stored = localStorage.getItem('gptOverApiChatHistory');
            if (stored) {
                history = JSON.parse(stored);
            }

            history.unshift(newChat);
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
        if (widget.getType) {
            const widgetType = widget.getType();
            if (widgetType) {
                const existingWidget = this.activeWidgets.get(widgetType);
                if (existingWidget) {
                    existingWidget.freeze();
                }

                const newWidget = widget.show();
                this.activeWidgets.set(widgetType, newWidget);
            } else {
                widget.show();
            }
        } else {
            widget.show();
        }
    }

    private clearContextHighlights(): void {
        document.querySelectorAll('.msg-checkbox').forEach(cb => {
            (cb as HTMLInputElement).checked = false;
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await appConfig.init();
    new GPTOverAPIApp();
    appConfig.updateTitleWithModel();
});