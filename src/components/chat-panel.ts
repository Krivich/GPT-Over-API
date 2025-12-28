// src/components/chat-panel.ts
import { IChatPanel } from '../interfaces.js';
import { md } from '../utils/markdown.js';

export class ChatPanel implements IChatPanel {
    constructor(private readonly element: HTMLElement) {}

    clear(): void {
        this.element.innerHTML = '';
    }

    addMessage(text: string, role: 'user' | 'assistant'): void {
        const msg = document.createElement('div');
        msg.className = `msg ${role}`;

        if (role === 'assistant') {
            msg.innerHTML = md(text);
        } else {
            msg.textContent = text;
        }

        this.element.appendChild(msg);
        this.scrollToBottom();
    }

    addMessageWidget(widget: HTMLElement, role: 'user' | 'assistant'): void {
        // Добавляем классы для стилизации
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
}