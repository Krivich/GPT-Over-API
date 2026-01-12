import { IAppConfig, IChatPanel, IMessageContextManager } from '../interfaces.js';
import { Message } from '../types.js';
import { appConfig } from '../config/app-config.js';
import { ChatTfidfIndex } from './tfidf-index.js';

export class MessageContextManager implements IMessageContextManager {
    private tfidfIndex: ChatTfidfIndex = new ChatTfidfIndex();
    private contextPreviewDebounceTimer: number | null = null;
    private manualContextOverrides: Map<string, boolean> = new Map(); // messageId -> inContext
    private chatPanel: IChatPanel | null = null;
    private config: IAppConfig;

    constructor(config?: IAppConfig) {
        this.config = config || (window as any).appConfig || appConfig;
    }

    setChatPanel(chatPanel: IChatPanel): void {
        this.chatPanel = chatPanel;
    }

    getContextMessages(query: string, allMessages: Message[]): Message[] {
        const N = appConfig.get(3, 'llm.context.lastMessages');
        const K = appConfig.get(2, 'llm.context.ragMessages');

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

    updateContextHighlights(query: string, allMessages: Message[]): void {
        if (this.contextPreviewDebounceTimer) {
            clearTimeout(this.contextPreviewDebounceTimer);
        }

        this.contextPreviewDebounceTimer = window.setTimeout(() => {
            this.contextPreviewDebounceTimer = null;

            if (!this.chatPanel) return;

            // Get messages for context
            const contextMsgs = this.getContextMessages(query, allMessages);
            const contextIds = new Set(contextMsgs.map(m => m.id));

            // Update visual state of messages
            this.updateMessageContextStates(contextIds);
        }, 100); // Reduced debounce for more responsive UI
    }


    private updateMessageContextStates(contextIds: Set<string>): void {
        if (!this.chatPanel) return;

        // Update context state for all messages
        document.querySelectorAll('.msg[data-message-id]').forEach(msgEl => {
            const messageId = msgEl.getAttribute('data-message-id');
            if (!messageId) return;

            const isInContext = contextIds.has(messageId);
            msgEl.classList.toggle('in-context', isInContext);

            // Update context indicator
            let indicator = msgEl.querySelector('.context-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'context-indicator';
                msgEl.appendChild(indicator);
            }
            indicator.textContent = isInContext ?
                this.config.get('in context', 'ui.[lang].texts.context.inContext') :
                '';
        });
    }

    applyManualContextOverrides(baseContext: Message[], allMessages: Message[]): Message[] {
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

    toggleMessageInContext(messageId: string, inContext: boolean): void {
        this.manualContextOverrides.set(messageId, inContext);
    }

    clearContextHighlights(): void {
        // Reset context overrides
        this.manualContextOverrides.clear();
    }

    // Additional methods for managing the TF-IDF index
    updateTfidfIndex(messages: Message[]): void {
        this.tfidfIndex.buildIndex(messages);
    }

    serializeTfidfIndex(): string {
        return this.tfidfIndex.serialize();
    }

    deserializeTfidfIndex(serialized: string, messages: Message[]): boolean {
        return this.tfidfIndex.deserialize(serialized, messages);
    }
}