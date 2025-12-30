// src/components/widgets/collapsed-messages-widget.ts
import { Message } from '../../types.js';

export class CollapsedMessagesWidget {
    private element!: HTMLElement;
    private messages: Message[];
    private isExpanded = false;
    private readonly onToggle: (expanded: boolean, messageId?: string) => void;
    private readonly onMessageClick: (messageId: string) => void;

    constructor(
        messages: Message[],
        onToggle: (expanded: boolean, messageId?: string) => void,
        onMessageClick: (messageId: string) => void
    ) {
        this.messages = messages;
        this.onToggle = onToggle;
        this.onMessageClick = onMessageClick;
        this.createElement();

        // Initially set overflow to hidden since widget starts collapsed
        this.element.style.overflow = 'hidden';
    }

    private createElement() {
        // Get the template element
        const templateEl = document.getElementById('collapsed-messages-widget-template');
        if (!(templateEl instanceof HTMLTemplateElement)) {
            throw new Error('Collapsed messages widget template not found');
        }

        // Clone the template content
        const frag = document.importNode(templateEl.content, true);
        this.element = frag.firstElementChild as HTMLElement;
        if (!this.element) throw new Error('Collapsed messages widget root element missing');

        // Set the count as a data attribute
        this.element.dataset.count = this.messages.length.toString();

        // Set up the initial content
        const messageCount = this.messages.length;
        const firstMessage = this.messages[0].content.substring(0, 30) + '...';
        const lastMessage = this.messages[this.messages.length - 1].content.substring(0, 30) + '...';

        // Update the collapse trigger text
        const countEl = this.element.querySelector('.collapse-count') as HTMLElement;
        const previewEl = this.element.querySelector('.collapse-preview') as HTMLElement;

        if (countEl) {
            countEl.textContent = `${messageCount} сообщений пропущено`;
        }

        if (previewEl) {
            previewEl.textContent = `${firstMessage} → ${lastMessage}`;
        }

        // Add click handler
        const triggerEl = this.element.querySelector('.collapse-trigger');
        if (triggerEl) {
            triggerEl.addEventListener('click', () => {
                this.toggle();
            });
        }

        // Render messages
        this.renderMessages();
    }

    private renderMessages() {
        const container = this.element.querySelector('.messages-container') as HTMLElement;
        if (!container) return;

        // Clear existing messages
        container.innerHTML = '';

        this.messages.forEach(msg => {
            // Get the message item template
            const templateEl = document.getElementById('collapsed-message-item-template');
            if (!(templateEl instanceof HTMLTemplateElement)) {
                throw new Error('Collapsed message item template not found');
            }

            // Clone the template content
            const frag = document.importNode(templateEl.content, true);
            const msgEl = frag.firstElementChild as HTMLElement;
            if (!msgEl) throw new Error('Collapsed message item element missing');

            // Set the message role class
            msgEl.classList.add(msg.role);
            msgEl.dataset.messageId = msg.id;

            // Format message content with truncated preview
            const previewContent = msg.content.length > 150
                ? msg.content.substring(0, 150) + '...'
                : msg.content;

            // Set the content
            const contentEl = msgEl.querySelector('.message-content') as HTMLElement;
            if (contentEl) {
                contentEl.textContent = previewContent;
            }

            // Add click handler for individual messages
            msgEl.addEventListener('click', (e) => {
                e.stopPropagation();
                // Dispatch a custom event to notify the main app about the context toggle
                const event = new CustomEvent('messageContextToggle', {
                    detail: {
                        messageId: msg.id,
                        inContext: !this.isInContext(msg.id), // Toggle the current state
                        manualOverride: true
                    },
                    bubbles: true,
                    cancelable: true
                });
                document.dispatchEvent(event);
            });

            container.appendChild(msgEl);
        });
    }

    toggle() {
        if (this.isExpanded) {
            this.collapse();
        } else {
            this.expand();
        }
    }

    private expand() {
        this.isExpanded = true;

        // Temporarily remove overflow: hidden to allow content to show
        this.element.style.overflow = 'visible';

        const contentEl = this.element.querySelector('.collapsed-content') as HTMLElement;

        if (contentEl) {
            // Show content first
            contentEl.style.display = 'block';

            // Force reflow
            void contentEl.offsetHeight;

            // Animate expansion
            contentEl.style.transition = 'opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
            contentEl.style.opacity = '1';
            contentEl.style.transform = 'translateY(0)';

            // Update trigger text
            const countEl = this.element.querySelector('.collapse-count');
            if (countEl) {
                countEl.textContent = 'нажмите еще раз для скрытия';
            }
        }

        this.onToggle(true, this.messages[0]?.id);
    }

    private collapse() {
        this.isExpanded = false;
        const contentEl = this.element.querySelector('.collapsed-content') as HTMLElement;

        if (contentEl) {
            // Animate collapse
            contentEl.style.transition = 'opacity 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)';
            contentEl.style.opacity = '0';
            contentEl.style.transform = 'translateY(-5px)';

            // Hide after animation
            setTimeout(() => {
                contentEl.style.display = 'none';
                contentEl.style.transition = '';

                // Restore overflow: hidden when collapsed
                this.element.style.overflow = 'hidden';
            }, 200);

            // Update trigger text
            const countEl = this.element.querySelector('.collapse-count');
            if (countEl) {
                countEl.textContent = `${this.messages.length} сообщений пропущено`;
            }
        } else {
            // If there's no content element, still restore overflow when collapsing
            this.element.style.overflow = 'hidden';
        }

        this.onToggle(false);
    }

    getElement(): HTMLElement {
        return this.element;
    }

    updateMessages(messages: Message[]) {
        this.messages = messages;
        this.element.dataset.count = messages.length.toString();

        // Preserve expanded state
        const wasExpanded = this.isExpanded;

        // Rebuild the element
        this.createElement();

        // Restore expanded state if needed
        if (wasExpanded) {
            this.expand();
        }
    }

    isCurrentlyExpanded(): boolean {
        return this.isExpanded;
    }

    private isInContext(messageId: string): boolean {
        // Check if the message is currently in context by looking at the UI
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            return messageElement.classList.contains('in-context');
        }
        return false;
    }
}