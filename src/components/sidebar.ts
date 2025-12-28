// src/components/sidebar.ts
import { ChatHistoryItem } from '../types.js';

export class Sidebar {
    private chatHistory: ChatHistoryItem[] = [];
    private currentChatId: string | null = null;
    private onChatSelect: ((chatId: string) => void) | null = null;
    private onNewChat: (() => void) | null = null;

    constructor(
        private readonly element: HTMLElement,
        private readonly historyContainer: HTMLElement
    ) {
        this.loadChatHistory();
        this.renderChatHistory();
        this.bindEvents();
    }

    private bindEvents(): void {
        const newChatBtn = this.element.querySelector('#new-chat-btn');
        const settingsBtn = this.element.querySelector('#settings-btn');
        
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                if (this.onNewChat) {
                    this.onNewChat();
                }
            });
        }
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                // This will be handled in main.ts when settings button is clicked
            });
        }
    }

    setOnChatSelect(handler: (chatId: string) => void): void {
        this.onChatSelect = handler;
    }

    setOnNewChat(handler: () => void): void {
        this.onNewChat = handler;
    }

    addChat(title: string): string {
        const id = this.generateId();
        const newChat: ChatHistoryItem = {
            id,
            title: title.substring(0, 50), // Limit title length
            timestamp: Date.now()
        };
        
        this.chatHistory.unshift(newChat); // Add to beginning
        this.saveChatHistory();
        this.renderChatHistory();
        
        return id;
    }

    setCurrentChat(chatId: string): void {
        this.currentChatId = chatId;
        this.renderChatHistory();
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    private loadChatHistory(): void {
        const stored = localStorage.getItem('gptOverApiChatHistory');
        if (stored) {
            try {
                this.chatHistory = JSON.parse(stored);
            } catch (e) {
                console.error('Error loading chat history:', e);
                this.chatHistory = [];
            }
        }
    }

    private saveChatHistory(): void {
        localStorage.setItem('gptOverApiChatHistory', JSON.stringify(this.chatHistory));
    }

    public renderChatHistory(): void {
        this.historyContainer.innerHTML = '';
        
        if (this.chatHistory.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'chat-item';
            emptyMsg.textContent = 'No chats yet';
            emptyMsg.style.fontStyle = 'italic';
            emptyMsg.style.color = 'var(--ha-color-text-secondary)';
            this.historyContainer.appendChild(emptyMsg);
            return;
        }

        this.chatHistory.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${this.currentChatId === chat.id ? 'active' : ''}`;
            chatItem.textContent = chat.title;
            chatItem.title = new Date(chat.timestamp).toLocaleString();
            
            chatItem.addEventListener('click', () => {
                if (this.onChatSelect) {
                    this.onChatSelect(chat.id);
                }
            });
            
            this.historyContainer.appendChild(chatItem);
        });
    }
}