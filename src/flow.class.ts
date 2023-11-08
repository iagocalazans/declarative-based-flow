import { Widget } from "./widget";

export class Flow extends Widget {
    static create(name: string) {
        return new Flow(Symbol(name));
    }

    start(widget: Widget) {
        super.success(widget);

        return this;
    }

    end() {
        return this.process.bind(this);
    }
}