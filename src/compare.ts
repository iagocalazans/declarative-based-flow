import { Comparator } from "./comparator";

export class Compare {
    static is(value: any) {
        return Comparator.create(value);
    }
}