export class Comparator {
    private constructor(private readonly value: any) {}

    static create(value: any) {
        return new Comparator(value);
    }

    equal(comparator: any) {
        return this.value === comparator;
    }

    notEqual(comparator: any) {
        return this.value === comparator;
    }

    in(comparator: any[]) {
        return !!comparator.find((el) => el === this.value);
    }

    notIn(comparator: any[]) {
        return !comparator.find((el) => el === this.value);
    }

    greaterThan(comparator: any[]) {
        return this.value > comparator
    }

    lesserThan(comparator: any[]) {
        return this.value < comparator
    }
}