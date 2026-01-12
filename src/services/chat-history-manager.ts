import { IChatHistoryManager, IChatPanel, IChatService, IMessageContextManager } from '../interfaces.js';
import { Message } from '../types.js';
import { appConfig } from '../config/app-config.js';
import { MessageWidget } from '../components/widgets/message-widget.js';

export class ChatHistoryManager implements IChatHistoryManager {
    private currentChatId: string | null = null;
    private onChatSelectHandler: ((chatId: string) => void) | null = null;
    private onNewChatHandler: (() => void) | null = null;

    constructor(
        private readonly chatPanel: IChatPanel,
        private readonly chatService: IChatService,
        private readonly contextManager: IMessageContextManager
    ) {}

    addChat(title: string): string {
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

    setCurrentChat(chatId: string): void {
        this.currentChatId = chatId;
    }

    setOnChatSelect(handler: (chatId: string) => void): void {
        this.onChatSelectHandler = handler;
    }

    setOnNewChat(handler: () => void): void {
        this.onNewChatHandler = handler;
    }

    renderChatHistory(): void {
        // Implementation for rendering chat history UI
        // This would typically populate a sidebar or dropdown with chat history
    }

    // Additional methods for managing chat history
    loadInitialChat(): void {
        const storedHistory = localStorage.getItem('gptOverApiChatHistory');
        if (storedHistory) {
            try {
                const history = JSON.parse(storedHistory);
                if (history.length > 0 && this.onChatSelectHandler) {
                    this.onChatSelectHandler(history[0].id);
                    return;
                }
            } catch (e) {
                console.error('Error loading initial chat:', e);
            }
        }

        if (this.onNewChatHandler) {
            this.onNewChatHandler();
        }
    }

    loadChat(chatId: string): void {
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

                // Create widgets for messages and add to chat service
                messages.forEach((msg: Message) => {
                    const displayRole = (msg.role as string) === 'assist' ? 'assistant' : msg.role;
                    const widget = new MessageWidget(msg.content, msg.id);
                    this.chatPanel.addMessageWidget(widget.getElement(), displayRole);

                    // Fix old message roles
                    if ((msg.role as string) === 'assist') {
                        (msg as any).role = 'assistant';
                    }

                    // Add to chat service's current messages
                    this.chatService.addToCurrentChat(msg);
                });

                if (this.onChatSelectHandler) {
                    this.onChatSelectHandler(chatId);
                }
            } else {
                if (this.onNewChatHandler) {
                    this.onNewChatHandler();
                }
            }
        } catch (e) {
            console.error('Error loading chat:', e);
            if (this.onNewChatHandler) {
                this.onNewChatHandler();
            }
        }
    }

    startNewChat(): void {
        // Clear context highlights and manual overrides
        this.contextManager.clearContextHighlights();

        this.chatPanel.clear();

        // Add welcome message
        const welcomeId = this.generateId();
        const welcomeMessage = {
            id: welcomeId,
            role: 'assistant' as const,
            content: appConfig.get('Hello! How can I help you today?', 'ui.[lang].texts.app.greeting')
        };

        const welcomeWidget = new MessageWidget(welcomeMessage.content, welcomeId);
        welcomeWidget.setInContext(true); // Welcome message is always in context
        this.chatPanel.addMessageWidget(welcomeWidget.getElement(), 'assistant');

        // Add to chat service's current messages
        this.chatService.addToCurrentChat(welcomeMessage);

        // Create new chat
        const newChatTitle = appConfig.get('New Chat', 'ui.[lang].texts.app.newChatTitle');
        const newChatId = this.addChat(newChatTitle);
        this.currentChatId = newChatId;
    }

    saveMessageToChat(message: Message): void {
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
        } catch (e) {
            console.error('Error saving message to chat:', e);
        }
    }

    saveChatState(messages: Message[]): void {
        if (!this.currentChatId) return;

        try {
            // Save messages
            localStorage.setItem(
                `gptOverApiChat_${this.currentChatId}`,
                JSON.stringify(messages)
            );
        } catch (e) {
            console.error('Error saving chat state:', e);
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

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
}