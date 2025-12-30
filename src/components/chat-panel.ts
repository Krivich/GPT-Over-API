// src/components/chat-panel.ts
import { IChatPanel } from '../interfaces.js';

export class ChatPanel implements IChatPanel {
    constructor(private readonly element: HTMLElement) {}

    clear(): void {
        this.element.innerHTML = '';
    }

    addMessage(text: string, role: 'user' | 'assistant'): void {
        const msg = document.createElement('div');
        msg.className = `msg ${role}`;
        msg.textContent = text;
        this.element.appendChild(msg);
        this.scrollToBottom();
    }

    addMessageWidget(widget: HTMLElement, role: 'user' | 'assistant'): void {
        // Add styling classes
        widget.classList.add('msg', role);
        this.element.appendChild(widget);
        this.scrollToBottom();
    }

    private scrollToBottom(): void {
        this.element.scrollTop = this.element.scrollHeight;
    }

    getElement(): HTMLElement {
        return this.element;
    }

    // Additional UI-focused methods
    setMessageInContext(messageId: string, inContext: boolean): void {
        const messageElement = this.element.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.classList.toggle('in-context', inContext);
        }
    }

    updateMessageContent(messageId: string, content: string): void {
        const messageElement = this.element.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.textContent = content;
        }
    }

    highlightMessage(messageId: string): void {
        const messageElement = this.element.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.classList.add('highlighted');
            setTimeout(() => {
                messageElement.classList.remove('highlighted');
            }, 2000); // Remove highlight after 2 seconds
        }
    }
}