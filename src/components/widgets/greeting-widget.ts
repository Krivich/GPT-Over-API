// src/components/widgets/greeting-widget.ts
import { IWidget } from '../../interfaces.js';

export class GreetingWidget implements IWidget {
    private element: HTMLElement;
    private widgetId: string;

    constructor() {
        this.widgetId = `greeting-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        // Get the greeting widget template
        const templateEl = document.getElementById('greeting-widget-template');
        if (!(templateEl instanceof HTMLTemplateElement)) {
            throw new Error('Greeting widget template not found');
        }

        // Clone the template content
        const frag = document.importNode(templateEl.content, true);
        this.element = frag.firstElementChild as HTMLElement;
        if (!this.element) throw new Error('Greeting widget root element missing');
    }

    init(container: HTMLElement): void {
        // Add the greeting widget to the container
        container.appendChild(this.element);
    }

    update(data?: any): void {
        // Greeting widget doesn't need dynamic updates
    }

    destroy(): void {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    getElement(): HTMLElement {
        return this.element;
    }

    getId(): string {
        return this.widgetId;
    }

    getType(): string {
        return 'greeting';
    }
}