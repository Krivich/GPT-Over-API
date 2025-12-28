// src/MessageWidget.ts
export class MessageWidget {
    private element: HTMLElement;

    constructor(content: string) {
        const templateEl = document.getElementById('message-widget-template');
        if (!(templateEl instanceof HTMLTemplateElement)) {
            throw new Error('Message widget template not found');
        }

        const frag = document.importNode(templateEl.content, true);
        this.element = frag.firstElementChild as HTMLElement;
        if (!this.element) throw new Error('Message widget root element missing');

        const contentEl = this.element.querySelector('.message-content');
        if (contentEl) {
            contentEl.textContent = content;
        }
    }

    getElement(): HTMLElement {
        return this.element;
    }
}