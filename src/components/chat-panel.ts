// src/components/chat-panel.ts
import { IChatPanel } from '../interfaces.js';
import { md } from '../utils/markdown.js';

export class ChatPanel implements IChatPanel {
    constructor(private readonly element: HTMLElement) {}

    clear(): void {
        this.element.innerHTML = '';
    }

    addMessage(text: string, role: 'user' | 'assist' | 'assistant'): void {
        const msg = document.createElement('div');
        msg.className = `msg ${role}`;

        // Apply markdown formatting only for assistant messages
        if (role === 'assist' || role === 'assistant') {
            msg.innerHTML = md(text);
        } else {
            // For user messages, just use textContent to prevent any HTML injection
            msg.textContent = text;
        }

        this.element.appendChild(msg);
        this.scrollToBottom();
    }

    // Method to add a message widget
    addMessageWidget(widget: HTMLElement, role: 'user' | 'assist' | 'assistant'): void {
        // Copy classes to preserve ha-widget and others
        const classes = Array.from(widget.classList);
        // Add message classes
        widget.className = `msg ${role} ${classes.join(' ')}`;
        this.element.appendChild(widget);
        this.scrollToBottom();
    }

    private scrollToBottom(): void {
        this.element.scrollTop = this.element.scrollHeight;
    }

    getElement(): HTMLElement {
        return this.element;
    }
}