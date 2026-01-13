// src/components/chat-panel.ts
import { IChatPanel, IWidget } from '../interfaces.js';
import { Message } from '../types.js';
import { MessageWidget } from './widgets/message-widget.js';
import { CollapsedMessagesWidget } from './widgets/collapsed-messages-widget.js';

export class ChatPanel implements IChatPanel {
    private widgets: Map<string, { widget: IWidget, element: HTMLElement, role: 'user' | 'assistant' }> = new Map();
    private visibleWidgets: Set<string> = new Set();
    private allWidgetIds: string[] = [];
    private messageElements: Map<string, HTMLElement> = new Map(); // Track message elements by ID

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
        this.messageElements.set(widgetId, widgetElement);
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

    /**
     * Collapse sequences of messages that are not in context
     * @param messageIds Array of all message IDs in order
     * @param inContextMessageIds Set of message IDs that are in context
     * @param minSequenceLength Minimum length of sequence to collapse (default: 3)
     */
    collapseNonContextSequences(messageIds: string[], inContextMessageIds: Set<string>, minSequenceLength: number = 3): void {
        // First, remove any existing collapsed widgets to prevent duplicates
        this.removeAllCollapsedWidgets();

        // Make all messages visible again
        messageIds.forEach(id => {
            const element = this.messageElements.get(id);
            if (element) {
                element.style.display = 'block';
            }
        });

        // Find sequences of consecutive messages not in context
        const sequencesToCollapse: { start: number, end: number, count: number }[] = [];
        let currentSequenceStart = -1;
        let currentSequenceCount = 0;

        for (let i = 0; i < messageIds.length; i++) {
            const messageId = messageIds[i];
            const isInContext = inContextMessageIds.has(messageId);

            if (!isInContext) {
                // This message is not in context
                if (currentSequenceStart === -1) {
                    // Start a new sequence
                    currentSequenceStart = i;
                    currentSequenceCount = 1;
                } else {
                    // Continue the current sequence
                    currentSequenceCount++;
                }
            } else {
                // This message is in context
                if (currentSequenceStart !== -1 && currentSequenceCount >= minSequenceLength) {
                    // End the current sequence and record it if it meets minimum length
                    sequencesToCollapse.push({
                        start: currentSequenceStart,
                        end: i - 1,
                        count: currentSequenceCount
                    });
                }
                // Reset sequence tracking
                currentSequenceStart = -1;
                currentSequenceCount = 0;
            }
        }

        // Handle sequence that extends to the end
        if (currentSequenceStart !== -1 && currentSequenceCount >= minSequenceLength) {
            sequencesToCollapse.push({
                start: currentSequenceStart,
                end: messageIds.length - 1,
                count: currentSequenceCount
            });
        }

        // Replace each sequence with a collapsed widget
        sequencesToCollapse.reverse(); // Reverse to process from end to start to avoid index shifting issues

        sequencesToCollapse.forEach(sequence => {
            this.replaceSequenceWithCollapsedWidget(
                messageIds,
                sequence.start,
                sequence.end,
                sequence.count
            );
        });
    }

    private removeAllCollapsedWidgets(): void {
        // Find all collapsed widget IDs
        const collapsedWidgetIds = Array.from(this.widgets.keys()).filter(id =>
            id.startsWith('collapsed-')
        );

        // Remove each collapsed widget
        collapsedWidgetIds.forEach(widgetId => {
            this.removeWidget(widgetId);
        });
    }

    private replaceSequenceWithCollapsedWidget(
        messageIds: string[],
        startIdx: number,
        endIdx: number,
        count: number
    ): void {
        // Get the elements to hide
        const elementsToHide: HTMLElement[] = [];
        const messageIdsToCollapse: string[] = [];
        for (let i = startIdx; i <= endIdx; i++) {
            const messageId = messageIds[i];
            const element = this.messageElements.get(messageId);
            if (element) {
                elementsToHide.push(element);
                messageIdsToCollapse.push(messageId);
            }
        }

        // Create the collapsed widget with message IDs and elements map
        const allMessageElements = Array.from(this.element.children) as HTMLElement[];
        const collapsedWidget = new CollapsedMessagesWidget(count, messageIdsToCollapse, allMessageElements, this.messageElements);
        const widgetElement = collapsedWidget.getElement();

        // Position the collapsed widget in the right place
        if (elementsToHide.length > 0) {
            // Insert the collapsed widget BEFORE the first element in the sequence
            // This will replace the sequence visually
            const firstElement = elementsToHide[0];
            const parent = firstElement.parentNode;
            if (parent) {
                parent.insertBefore(widgetElement, firstElement);

                // Hide all elements in the sequence
                elementsToHide.forEach(el => {
                    el.style.display = 'none';
                });
            }
        } else {
            // If no elements found, just append to the end
            this.element.appendChild(widgetElement);
        }

        // Store the collapsed widget in our widgets map
        const widgetId = collapsedWidget.getId();
        this.widgets.set(widgetId, {
            widget: collapsedWidget,
            element: widgetElement,
            role: 'assistant' as const
        });
        this.allWidgetIds.push(widgetId);
        this.visibleWidgets.add(widgetId);
    }
}