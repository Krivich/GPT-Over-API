// src/components/widgets/chat-history-widget.ts
import { IWidget, IChatPanel } from '../../interfaces.js';
import { appConfig } from '../../config/app-config.js';

export class ChatHistoryWidget implements IWidget {
    private element: HTMLElement | null = null;
    private widgetId: string;
    private historyList: Element | null = null;
    private newChatBtn: HTMLElement | null = null;
    private searchInput: HTMLInputElement | null = null;

    constructor(
        private chatPanel: IChatPanel,
        private onChatSelect: (chatId: string) => void,
        private onNewChat: () => void
    ) {
        this.widgetId = `chat-history-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }

    init(container: HTMLElement): void {
        const templateEl = document.getElementById('chat-history-widget-template');
        if (!(templateEl instanceof HTMLTemplateElement)) {
            throw new Error('Chat history widget template not found');
        }

        const frag = document.importNode(templateEl.content, true);
        this.element = frag.firstElementChild as HTMLElement;
        if (!this.element) throw new Error('Chat history widget root element missing');

        this.historyList = this.element.querySelector('.chat-history-list');
        this.newChatBtn = this.element.querySelector('#new-chat-btn') as HTMLElement;
        this.searchInput = this.element.querySelector('#chat-search-input') as HTMLInputElement;

        // Find and setup close button
        const closeBtn = this.element.querySelector('.close-btn') as HTMLElement;

        if (!this.historyList || !this.newChatBtn) {
            throw new Error('Chat history widget elements missing');
        }

        // Load and display chat history
        this.renderChatHistory();

        // Setup search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.handleSearch.bind(this));
        }

        // Setup new chat button
        this.newChatBtn.addEventListener('click', this.handleNewChatClick.bind(this));

        // Setup close button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.destroy(); // Close the widget when close button is clicked
            });
        }
    }

    update(data?: any): void {
        if (data && typeof data === 'object') {
            if ('refresh' in data && data.refresh === true) {
                this.renderChatHistory();
            }
        }
    }

    destroy(): void {
        // Remove event listeners to prevent memory leaks
        if (this.searchInput) {
            this.searchInput.removeEventListener('input', this.handleSearch.bind(this));
        }
        if (this.newChatBtn) {
            this.newChatBtn.removeEventListener('click', this.handleNewChatClick.bind(this));
        }

        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.historyList = null;
        this.newChatBtn = null;
        this.searchInput = null;
    }

    getElement(): HTMLElement {
        if (!this.element) {
            throw new Error('ChatHistoryWidget not initialized');
        }
        return this.element;
    }

    getId(): string {
        return this.widgetId;
    }

    getType(): string {
        return 'chat-history';
    }

    private handleSearch(e: Event): void {
        const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
        this.renderChatHistory(searchTerm);
    }

    private handleNewChatClick(): void {
        this.onNewChat();
    }

    private renderChatHistory(searchTerm: string = ''): void {
        if (!this.historyList) return;

        this.historyList.innerHTML = '';

        const storedHistory = localStorage.getItem('gptOverApiChatHistory');
        let chatHistory = [];

        if (storedHistory) {
            try {
                chatHistory = JSON.parse(storedHistory);
            } catch (e) {
                console.error('Error loading chat history:', e);
            }
        }

        // Filter chats based on search term
        if (searchTerm) {
            chatHistory = chatHistory.filter((chat: { id: string; title: string; timestamp: number }) =>
                chat.title.toLowerCase().includes(searchTerm) ||
                new Date(chat.timestamp).toLocaleString().toLowerCase().includes(searchTerm)
            );
        }

        if (chatHistory.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'chat-history-item';
            // Use appConfig to get the localized text
            emptyMsg.textContent = searchTerm ?
                appConfig.get('No matching chats', 'ui.[lang].texts.sidebar.noMatchingChats') :
                appConfig.get('No chats yet', 'ui.[lang].texts.sidebar.noChats');
            emptyMsg.style.fontStyle = 'italic';
            emptyMsg.style.color = 'var(--ha-color-text-secondary)';
            this.historyList.appendChild(emptyMsg);
            return;
        }

        chatHistory.forEach((chat: { id: string; title: string; timestamp: number }) => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-history-item';
            chatItem.textContent = chat.title;
            chatItem.title = new Date(chat.timestamp).toLocaleString();
            chatItem.addEventListener('click', () => {
                this.onChatSelect(chat.id);
            });
            this.historyList!.appendChild(chatItem);
        });
    }
}