// src/components/widgets/message-widget.ts
import { IWidget } from '../../interfaces.js';
import { md } from '../../utils/markdown.js';

export class MessageWidget implements IWidget {
    private element: HTMLElement;
    private contentEl: HTMLElement | null = null;
    private loadingEl: HTMLElement | null = null;
    private contextIndicator: HTMLElement;
    public readonly messageId: string;
    private inContext: boolean = false;
    private isProcessing: boolean = false;
    private container: HTMLElement | null = null;
    private content: string = '';

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

        this.content = content;
        if (content) {
            this.updateContent(content);
        } else {
            this.showLoading();
        }
    }

    init(container: HTMLElement): void {
        this.container = container;
        // Add styling classes when initializing - we'll set the role correctly when added to chat panel
        this.element.classList.add('msg');
    }

    update(data?: any): void {
        if (data && typeof data === 'object') {
            if ('content' in data) {
                this.updateContent(data.content);
            }
            if ('role' in data) {
                // Update role classes
                this.element.classList.remove('user', 'assistant');
                this.element.classList.add(data.role);
            }
            if ('inContext' in data) {
                this.setInContext(data.inContext);
            }
        }
    }

    destroy(): void {
        // Clean up event listeners and references
        this.element.removeEventListener('click', this.element.onclick as any);
        if (this.container && this.element.parentNode === this.container) {
            this.container.removeChild(this.element);
        }
        this.container = null;
    }

    getElement(): HTMLElement {
        return this.element;
    }

    getId(): string {
        return this.messageId;
    }

    getType(): string {
        return 'message';
    }

    updateContent(content: string): void {
        if (this.contentEl && this.loadingEl) {
            // Format the content using markdown before setting it
            this.contentEl.innerHTML = md(content);
            this.contentEl.style.display = 'block';
            this.loadingEl.style.display = 'none';
            this.isProcessing = false;
            this.content = content;
        }
    }

    showLoading(): void {
        if (this.contentEl && this.loadingEl) {
            this.contentEl.style.display = 'none';
            this.loadingEl.style.display = 'block';
            this.isProcessing = true;
        }
    }

    setInContext(inContext: boolean): void {
        this.inContext = inContext;
        this.element.classList.toggle('in-context', inContext);
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
        return this.content;
    }

    getMessageId(): string {
        return this.messageId;
    }
}