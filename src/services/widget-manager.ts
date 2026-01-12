import { IWidget, IWidgetManager } from '../interfaces.js';
import { Terminable } from '../types.js';

export class WidgetManager implements IWidgetManager {
    private activeWidgets: Map<string, Terminable> = new Map();

    showWidget(widget: IWidget): void {
        if (widget.getType) {
            const widgetType = widget.getType();
            if (widgetType) {
                const existingWidget = this.activeWidgets.get(widgetType);
                if (existingWidget) {
                    existingWidget.freeze();
                }

                const newWidget = widget.show();
                this.activeWidgets.set(widgetType, newWidget);
            } else {
                widget.show();
            }
        } else {
            widget.show();
        }
    }

    hideWidget(widgetType: string): void {
        const existingWidget = this.activeWidgets.get(widgetType);
        if (existingWidget) {
            existingWidget.freeze();
            this.activeWidgets.delete(widgetType);
        }
    }
}