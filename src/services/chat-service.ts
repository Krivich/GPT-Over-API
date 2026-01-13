import { IChatPanel, ILLMClient, IChatService, IMessageContextManager, IChatHistoryManager } from '../interfaces.js';
import { Message } from '../types.js';
import { appConfig } from '../config/app-config.js';
import { MessageWidget } from '../components/widgets/message-widget.js';

export class ChatService implements IChatService {
    private abortController: AbortController | null = null;
    private isProcessingValue = false;
    private currentChatMessages: Message[] = [];
    private pendingMessage: string | null = null;

    private historyManager: IChatHistoryManager | null = null;

    constructor(
        private readonly chatPanel: IChatPanel,
        private readonly llmClient: ILLMClient,
        private readonly contextManager: IMessageContextManager,
        private readonly onApiKeyNotConfigured?: () => void
    ) {}

    public setHistoryManager(historyManager: IChatHistoryManager): void {
        this.historyManager = historyManager;
    }

    async sendMessage(content: string): Promise<void> {
        if (!content.trim()) return;

        this.isProcessingValue = true;

        let assistantWidget: MessageWidget | null = null;

        try {
            const userMessageId = this.generateId();
            const userMessage = { id: userMessageId, role: 'user' as const, content };

            // Add user message to UI
            const userWidget = new MessageWidget(content, userMessageId);
            this.chatPanel.addWidget(userWidget, 'user');

            // Add to context
            this.addToCurrentChat(userMessage);

            // Update TF-IDF index
            this.contextManager.updateTfidfIndex(this.currentChatMessages);

            // Save user message to chat history
            if (this.historyManager) {
                this.historyManager.saveMessageToChat(userMessage);
            }

            this.abortController = new AbortController();

            // Form context for LLM
            const contextMessages = this.contextManager.getContextMessages(content, this.currentChatMessages);

            // Create widget for assistant response
            const assistantMessageId = this.generateId();
            assistantWidget = new MessageWidget('', assistantMessageId); // Empty content to show loading
            this.chatPanel.addWidget(assistantWidget, 'assistant');

            // Get response
            const response = await this.llmClient.call(contextMessages, this.abortController.signal);

            if (response === 'API_KEY_NOT_CONFIGURED') {
                // Store the pending message
                this.pendingMessage = content;

                // Show a message that LLM is not configured
                assistantWidget.update({
                    content: appConfig.get('LLM is not configured. Please set up your API settings.', 'ui.[lang].texts.messages.apiNotConfiguredMessage')
                });

                // Open the settings widget after a short delay
                setTimeout(() => {
                    if (this.onApiKeyNotConfigured) {
                        this.onApiKeyNotConfigured();
                    }
                }, 1000); // Delay to allow the message to be seen

                return;
            }

            // Update widget with response
            assistantWidget.update({ content: response });

            // Add assistant response to context
            const assistantMessage = {
                id: assistantMessageId,
                role: 'assistant' as const,
                content: response
            };

            this.addToCurrentChat(assistantMessage);

            // Save assistant message to chat history
            if (this.historyManager) {
                this.historyManager.saveMessageToChat(assistantMessage);
            }

            // Update TF-IDF index with the new message
            this.contextManager.updateTfidfIndex(this.currentChatMessages);

        } catch (error) {
            if (assistantWidget) {
                let errorMessage = '';
                if (error instanceof Error && error.name === 'AbortError') {
                    errorMessage = appConfig.get('Request cancelled.', 'ui.[lang].texts.messages.requestCancelled');
                } else {
                    errorMessage = appConfig.get('Error: ', 'ui.[lang].texts.messages.errorPrefix') + (error instanceof Error ? error.message : 'Unknown error');
                }

                // Update the assistant widget with the error/cancellation message
                assistantWidget.update({ content: errorMessage });

                // Add the error/cancellation message to chat history as well
                const assistantMessage = {
                    id: assistantWidget.getId(),
                    role: 'assistant' as const,
                    content: errorMessage
                };

                this.addToCurrentChat(assistantMessage);

                // Save error/cancellation message to chat history
                if (this.historyManager) {
                    this.historyManager.saveMessageToChat(assistantMessage);
                }
            } else {
                // If assistant widget wasn't created, add a message directly to the chat panel
                if (error instanceof Error && error.name === 'AbortError') {
                    this.chatPanel.addMessage(appConfig.get('Request cancelled.', 'ui.[lang].texts.messages.requestCancelled'), 'assistant');
                } else {
                    this.chatPanel.addMessage(appConfig.get('Error: ', 'ui.[lang].texts.messages.errorPrefix') + (error instanceof Error ? error.message : 'Unknown error'), 'assistant');
                }
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

    // Method to send pending message after configuration
    public async sendPendingMessage(): Promise<void> {
        if (this.pendingMessage) {
            const messageToSend = this.pendingMessage;
            this.pendingMessage = null; // Clear the pending message
            // Re-send the original message
            await this.sendMessage(messageToSend);
        }
    }

    // Method to check if there's a pending message
    public hasPendingMessage(): boolean {
        return this.pendingMessage !== null;
    }
}