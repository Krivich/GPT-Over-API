import { IWidget } from '../../interfaces.js';
import { appConfig } from '../../config/app-config.js';

export class CollapsedMessagesWidget implements IWidget {
    private element: HTMLElement;
    private isExpanded: boolean = false;
    private messagesToCollapse: HTMLElement[] = [];
    private parentContainer: HTMLElement | null = null;

    constructor(
        private count: number,
        private messageIds: string[], // Array of message IDs to collapse
        private allMessageElements: HTMLElement[],
        private messageElementsMap: Map<string, HTMLElement> // Map of message ID to DOM element
    ) {
        this.element = this.createWidgetElement();
    }

    private createWidgetElement(): HTMLElement {
        const templateEl = document.getElementById('collapsed-messages-widget-template');
        if (!(templateEl instanceof HTMLTemplateElement)) {
            throw new Error('Collapsed messages widget template not found');
        }
        const frag = document.importNode(templateEl.content, true);
        const div = frag.firstElementChild as HTMLElement;
        if (!div) throw new Error('Collapsed messages widget root element missing');

        // Set the initial text
        const countSpan = div.querySelector('.collapse-count');
        if (countSpan) {
            countSpan.textContent = `${this.count} ${this.getPluralForm()}`;
        }

        // Add click handler to expand/collapse
        div.addEventListener('click', () => this.toggle());

        return div;
    }

    private getPluralForm(): string {
        // Use appConfig for localization
        if (this.count === 1) {
            return appConfig.get('message skipped', 'ui.[lang].texts.collapsedMessages.messageSkipped');
        } else {
            return appConfig.get('messages skipped', 'ui.[lang].texts.collapsedMessages.messagesSkipped');
        }
    }

    public getId(): string {
        const firstId = this.messageIds[0] || 'unknown';
        const lastId = this.messageIds[this.messageIds.length - 1] || 'unknown';
        return `collapsed-${firstId}-${lastId}`;
    }

    public getType(): string {
        return 'collapsed-messages';
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public update(data: any): void {
        // This widget doesn't need dynamic updates
    }

    public init(container?: HTMLElement): void {
        // Store the parent container for later use
        this.parentContainer = container || null;
    }

    public destroy(): void {
        // Cleanup logic if needed
    }

    public toggle(): void {
        if (this.isExpanded) {
            this.collapse();
        } else {
            this.expand();
        }
    }

    public expand(): void {
        if (this.isExpanded) return;

        this.isExpanded = true;

        // Show the messages based on their IDs
        for (const messageId of this.messageIds) {
            const messageElement = this.messageElementsMap.get(messageId);
            if (messageElement) {
                messageElement.style.display = 'block';
            }
        }

        // Update the widget text
        const countSpan = this.element.querySelector('.collapse-count');
        if (countSpan) {
            const lang = localStorage.getItem('preferred_language') || navigator.language.split('-')[0];

            if (lang === 'ru' || lang === 'ru-RU') {
                countSpan.textContent = this.getPluralFormReverse();
            } else {
                countSpan.textContent = this.count === 1 ?
                    'click again to hide message' :
                    'click again to hide messages';
            }
        }
    }

    private getPluralFormReverse(): string {
        // Use appConfig for localization
        if (this.count === 1) {
            return appConfig.get('click again to hide message', 'ui.[lang].texts.collapsedMessages.clickToHideSingular');
        } else {
            return appConfig.get('click again to hide messages', 'ui.[lang].texts.collapsedMessages.clickToHide');
        }
    }

    public collapse(): void {
        if (!this.isExpanded) return;

        this.isExpanded = false;

        // Hide the messages again based on their IDs
        for (const messageId of this.messageIds) {
            const messageElement = this.messageElementsMap.get(messageId);
            if (messageElement) {
                messageElement.style.display = 'none';
            }
        }

        // Update the widget text back to original
        const countSpan = this.element.querySelector('.collapse-count');
        if (countSpan) {
            const messageText = this.count === 1
                ? appConfig.get('message skipped', 'ui.[lang].texts.collapsedMessages.messageSkipped')
                : appConfig.get('messages skipped', 'ui.[lang].texts.collapsedMessages.messagesSkipped');
            countSpan.textContent = `${this.count} ${messageText}`;
        }
    }
}