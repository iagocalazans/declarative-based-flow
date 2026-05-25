/**
 * Fluent comparison helper produced by `Compare.is(value)`.
 *
 * Each operator returns a boolean, making comparators a natural fit for
 * `Split.case` predicates.
 */
export class Comparator {
  private constructor(private readonly value: any) {}

  /**
   * Wraps a value to compare against.
   *
   * @param value - The left-hand value of the comparison.
   * @returns A new comparator bound to the value.
   */
  static create(value: any) {
    return new Comparator(value);
  }

  /**
   * Strict equality (`===`).
   *
   * @param comparator - Value to compare against.
   */
  equal(comparator: any) {
    return this.value === comparator;
  }

  /**
   * Strict inequality (`!==`).
   *
   * @param comparator - Value to compare against.
   */
  notEqual(comparator: any) {
    return this.value !== comparator;
  }

  /**
   * Membership test against a list.
   *
   * @param comparator - Candidate values.
   */
  in(comparator: any[]) {
    return !!comparator.find((el) => el === this.value);
  }

  /**
   * Negated membership test against a list.
   *
   * @param comparator - Candidate values.
   */
  notIn(comparator: any[]) {
    return !comparator.find((el) => el === this.value);
  }

  /**
   * Greater-than comparison (`>`).
   *
   * @param comparator - Value to compare against.
   */
  greaterThan(comparator: any) {
    return this.value > comparator;
  }

  /**
   * Less-than comparison (`<`).
   *
   * @param comparator - Value to compare against.
   */
  lesserThan(comparator: any) {
    return this.value < comparator;
  }
}
