// src/components/widgets/message-widget.ts
export class MessageWidget {
    private element: HTMLElement;
    private checkboxEl: HTMLInputElement | null = null;
    private contentEl: HTMLElement | null = null;
    private loadingEl: HTMLElement | null = null;
    public readonly messageId: string;

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
        const checkboxContainer = this.element.querySelector('.msg-checkbox-container');

        // Generate a unique message ID if not provided
        this.messageId = messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        if (checkboxContainer) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'msg-checkbox';
            checkbox.disabled = true; // Только для отображения, не для взаимодействия
            checkbox.dataset.messageId = this.messageId;
            this.checkboxEl = checkbox;
            checkboxContainer.appendChild(checkbox);
        }

        if (content) {
            this.updateContent(content);
        } else {
            this.showLoading();
        }
    }

    updateContent(content: string): void {
        if (this.contentEl && this.loadingEl) {
            this.contentEl.innerHTML = content;
            this.contentEl.style.display = 'block';
            this.loadingEl.style.display = 'none';
        }
    }

    showLoading(): void {
        if (this.contentEl && this.loadingEl) {
            this.contentEl.style.display = 'none';
            this.loadingEl.style.display = 'block';
        }
    }

    getElement(): HTMLElement {
        return this.element;
    }

    setInContext(inContext: boolean): void {
        if (this.checkboxEl) {
            this.checkboxEl.checked = inContext;
        }
    }

    getContent(): string {
        return this.contentEl?.innerHTML || '';
    }
}