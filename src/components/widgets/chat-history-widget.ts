// src/components/widgets/chat-history-widget.ts
import { IChatPanel } from '../../interfaces.js';
import { Terminable } from '../../types.js';
import { appConfig } from '../../config/app-config.js';

export class ChatHistoryWidget {
    constructor(
        private chatPanel: IChatPanel,
        private onChatSelect: (chatId: string) => void,
        private onNewChat: () => void
    ) {}

    getType(): string {
        return 'chat-history';
    }

    show(): Terminable {
        const templateEl = document.getElementById('chat-history-widget-template');
        if (!(templateEl instanceof HTMLTemplateElement)) {
            throw new Error('Chat history widget template not found');
        }

        const frag = document.importNode(templateEl.content, true);
        const widget = frag.firstElementChild as HTMLElement;
        if (!widget) throw new Error('Chat history widget root element missing');

        const historyList = widget.querySelector('.chat-history-list');
        const newChatBtn = widget.querySelector('#new-chat-btn');
        const searchInput = widget.querySelector('#chat-search-input');

        if (!historyList || !newChatBtn) {
            throw new Error('Chat history widget elements missing');
        }

        // Load and display chat history
        this.renderChatHistory(historyList);

        // Setup search functionality
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
                this.renderChatHistory(historyList, searchTerm);
            });
        }

        // Setup new chat button
        newChatBtn.addEventListener('click', () => {
            this.onNewChat();
        });

        // Freeze function for external management
        const freeze = () => {
            widget.querySelectorAll('button, input').forEach(el => {
                if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) {
                    el.disabled = true;
                }
            });
            widget.classList.add('frozen');
        };

        this.chatPanel.addMessageWidget(widget, 'assistant');

        return { freeze };
    }

    private renderChatHistory(container: Element, searchTerm: string = ''): void {
        container.innerHTML = '';

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
            container.appendChild(emptyMsg);
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
            container.appendChild(chatItem);
        });
    }
}