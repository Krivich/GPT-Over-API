import { IChatPanel, ILLMClient, IChatService, IMessageContextManager } from '../interfaces.js';
import { Message } from '../types.js';
import { appConfig } from '../config/app-config.js';
import { MessageWidget } from '../components/widgets/message-widget.js';

export class ChatService implements IChatService {
    private abortController: AbortController | null = null;
    private isProcessingValue = false;
    private currentChatMessages: Message[] = [];
    
    constructor(
        private readonly chatPanel: IChatPanel,
        private readonly llmClient: ILLMClient,
        private readonly contextManager: IMessageContextManager
    ) {}

    async sendMessage(content: string): Promise<void> {
        if (!content.trim()) return;

        this.isProcessingValue = true;

        try {
            const userMessageId = this.generateId();
            const userMessage = { id: userMessageId, role: 'user' as const, content };

            // Add user message to UI
            const userWidget = new MessageWidget(content, userMessageId);
            this.chatPanel.addMessageWidget(userWidget.getElement(), 'user');

            // Add to context
            this.addToCurrentChat(userMessage);

            // Update TF-IDF index
            this.contextManager.updateTfidfIndex(this.currentChatMessages);

            this.abortController = new AbortController();

            // Form context for LLM
            const contextMessages = this.contextManager.getContextMessages(content, this.currentChatMessages);

            // Create widget for assistant response
            const assistantMessageId = this.generateId();
            const assistantWidget = new MessageWidget('', assistantMessageId); // Empty content to show loading
            this.chatPanel.addMessageWidget(assistantWidget.getElement(), 'assistant');

            // Get response
            const response = await this.llmClient.call(contextMessages, this.abortController.signal);

            if (response === 'API_KEY_NOT_CONFIGURED') {
                const messageText = appConfig.get('Please configure your LLM settings first.', 'ui.[lang].texts.messages.apiKeyNotConfigured');
                assistantWidget.updateContent(messageText);
                return;
            }

            // Update widget with response
            assistantWidget.updateContent(response);

            // Add assistant response to context
            const assistantMessage = {
                id: assistantMessageId,
                role: 'assistant' as const,
                content: response
            };

            this.addToCurrentChat(assistantMessage);

            // Update TF-IDF index with the new message
            this.contextManager.updateTfidfIndex(this.currentChatMessages);

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                this.chatPanel.addMessage('Request cancelled.', 'assistant');
            } else {
                this.chatPanel.addMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'assistant');
            }
        } finally {
            this.isProcessingValue = false;
            this.abortController = null;
        }
    }

    cancelCurrentRequest(): void {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    isProcessing(): boolean {
        return this.isProcessingValue;
    }

    getCurrentChatMessages(): Message[] {
        return this.currentChatMessages;
    }

    addToCurrentChat(message: Message): void {
        this.currentChatMessages.push(message);
        // Update the TF-IDF index when a new message is added
        this.contextManager.updateTfidfIndex(this.currentChatMessages);
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
}