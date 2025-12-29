// src/components/widgets/message-widget.ts
import { md } from '../../utils/markdown.js';

export class MessageWidget {
    private element: HTMLElement;
    private contentEl: HTMLElement | null = null;
    private loadingEl: HTMLElement | null = null;
    private contextIndicator: HTMLElement;
    public readonly messageId: string;
    private inContext: boolean = false;
    private isProcessing: boolean = false;

    constructor(content: string = '', messageId?: string) {
        const templateEl = document.getElementById('message-widget-template');
        if (!(templateEl instanceof HTMLTemplateElement)) {
            throw new Error('Message widget template not found');
        }
        const frag = document.importNode(templateEl.content, true);
        this.element = frag.firstElementChild as HTMLElement;
        if (!this.element) throw new Error('Message widget root element missing');

        this.contentEl = this.element.querySelector('.message-content');
        this.loadingEl = this.element.querySelector('.message-loading');
        this.contextIndicator = this.element.querySelector('.context-indicator') as HTMLElement;

        // Generate a unique message ID if not provided
        this.messageId = messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        // Set message ID as a data attribute for easy lookup
        this.element.dataset.messageId = this.messageId;

        // Add click handler for context toggling
        this.element.addEventListener('click', (e) => {
            // Ignore clicks on links and buttons inside the message
            if ((e.target as HTMLElement).closest('a, button, code, pre')) {
                return;
            }

            // Prevent handling clicks on the loading spinner
            if (this.isProcessing) {
                return;
            }

            e.stopPropagation();
            this.toggleInContext();
        });

        if (content) {
            this.updateContent(content);
        } else {
            this.showLoading();
        }
    }

    updateContent(content: string): void {
        if (this.contentEl && this.loadingEl) {
            // Format the content using markdown before setting it
            this.contentEl.innerHTML = md(content);
            this.contentEl.style.display = 'block';
            this.loadingEl.style.display = 'none';
            this.isProcessing = false;
        }
    }

    showLoading(): void {
        if (this.contentEl && this.loadingEl) {
            this.contentEl.style.display = 'none';
            this.loadingEl.style.display = 'block';
            this.isProcessing = true;
        }
    }

    getElement(): HTMLElement {
        return this.element;
    }

    setInContext(inContext: boolean): void {
        this.inContext = inContext;
        this.element.classList.toggle('in-context', inContext);

        // Update indicator text
        if (inContext) {
            this.contextIndicator.textContent = 'in context';
        } else {
            this.contextIndicator.textContent = '';
        }
    }

    toggleInContext(): void {
        this.setInContext(!this.inContext);
        // Dispatch custom event for the main app to handle
        const event = new CustomEvent('messageContextToggle', {
            detail: {
                messageId: this.messageId,
                inContext: this.inContext,
                manualOverride: true
            },
            bubbles: true,
            cancelable: true
        });
        this.element.dispatchEvent(event);
    }

    isInContext(): boolean {
        return this.inContext;
    }

    getContent(): string {
        return this.contentEl?.innerHTML || '';
    }

    getMessageId(): string {
        return this.messageId;
    }
}