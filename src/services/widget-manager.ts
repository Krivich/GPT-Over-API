import { IWidget, IWidgetManager, IChatPanel } from '../interfaces.js';

export class WidgetManager implements IWidgetManager {
    private activeWidgets: Map<string, IWidget> = new Map();

    showWidget(widget: IWidget): void {
        const widgetType = widget.getType();

        if (widgetType) {
            const existingWidget = this.activeWidgets.get(widgetType);
            if (existingWidget) {
                // Destroy the existing widget
                existingWidget.destroy();
            }

            // Initialize the new widget
            const container = document.getElementById('chat-container');
            if (container) {
                widget.init(container);
                this.chatPanel.addWidget(widget, 'assistant');
            }

            this.activeWidgets.set(widgetType, widget);
        }
    }

    hideWidget(widgetType: string): void {
        const existingWidget = this.activeWidgets.get(widgetType);
        if (existingWidget) {
            // Destroy the widget
            existingWidget.destroy();
            this.activeWidgets.delete(widgetType);
        }
    }

    constructor(private chatPanel: IChatPanel) {}
}