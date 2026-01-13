// src/components/chat-panel.ts
import { IChatPanel, IWidget } from '../interfaces.js';

export class ChatPanel implements IChatPanel {
    private widgets: Map<string, { widget: IWidget, element: HTMLElement, role: 'user' | 'assistant' }> = new Map();
    private visibleWidgets: Set<string> = new Set();
    private allWidgetIds: string[] = [];

    constructor(private readonly element: HTMLElement) {}

    clear(): void {
        // Destroy all widgets before clearing
        this.widgets.forEach(({ widget }) => {
            widget.destroy();
        });
        this.widgets.clear();
        this.visibleWidgets.clear();
        this.allWidgetIds = [];
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

    addWidget(widget: IWidget, role: 'user' | 'assistant'): void {
        // Initialize the widget with the chat container
        widget.init(this.element);

        // Store widget reference
        const widgetId = widget.getId();
        const widgetElement = widget.getElement();

        // Add styling classes
        widgetElement.classList.add('msg', role);

        this.widgets.set(widgetId, { widget, element: widgetElement, role });
        this.allWidgetIds.push(widgetId);

        // Initially show the widget if it should be visible
        this.visibleWidgets.add(widgetId);
        this.element.appendChild(widgetElement);
        this.scrollToBottom();
    }

    removeWidget(widgetId: string): void {
        const widgetData = this.widgets.get(widgetId);
        if (widgetData) {
            // Remove from DOM
            if (widgetData.element.parentNode === this.element) {
                this.element.removeChild(widgetData.element);
            }

            // Remove from collections
            this.widgets.delete(widgetId);
            this.visibleWidgets.delete(widgetId);
            this.allWidgetIds = this.allWidgetIds.filter(id => id !== widgetId);

            // Destroy the widget
            widgetData.widget.destroy();
        }
    }

    updateWidget(widgetId: string, data?: any): void {
        const widgetData = this.widgets.get(widgetId);
        if (widgetData) {
            widgetData.widget.update(data);
        }
    }

    private scrollToBottom(): void {
        this.element.scrollTop = this.element.scrollHeight;
    }

    getElement(): HTMLElement {
        return this.element;
    }

    // Method to control which widgets are visible in the viewport
    setVisibleRange(startIndex: number, endIndex: number): void {
        // Hide all widgets first
        this.visibleWidgets.clear();

        // Show only widgets in the specified range
        for (let i = startIndex; i <= endIndex && i < this.allWidgetIds.length; i++) {
            const widgetId = this.allWidgetIds[i];
            this.visibleWidgets.add(widgetId);

            const widgetData = this.widgets.get(widgetId);
            if (widgetData) {
                widgetData.element.style.display = 'block';
            }
        }

        // Hide widgets outside the range
        for (const [widgetId, widgetData] of this.widgets) {
            if (!this.visibleWidgets.has(widgetId)) {
                widgetData.element.style.display = 'none';
            }
        }
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