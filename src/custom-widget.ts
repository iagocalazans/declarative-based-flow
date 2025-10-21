import { Widget } from "./widget";

export class CustomWidget extends Widget {
  static create(name: string) {
    return new this(Symbol(name));
  }

  moveTo(widget: Widget) {
    super.success(widget);
    return this;
  }

  elseMoveTo(widget: Widget) {
    super.failed(widget);
    return this;
  }
}
