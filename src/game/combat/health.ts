export class Health {
  private value: number;
  private maximum: number;

  public constructor(maximum: number) {
    this.maximum = maximum;
    this.value = maximum;
  }

  public get current(): number {
    return this.value;
  }

  public get max(): number {
    return this.maximum;
  }

  public get ratio(): number {
    return this.maximum === 0 ? 0 : this.value / this.maximum;
  }

  public isAlive(): boolean {
    return this.value > 0;
  }

  public takeDamage(amount: number): boolean {
    if (!this.isAlive() || amount <= 0) {
      return false;
    }

    this.value = Math.max(0, this.value - amount);
    return !this.isAlive();
  }

  public increaseMaximum(amount: number, healAmount = amount): void {
    if (amount <= 0) {
      return;
    }

    this.maximum += amount;
    this.value = Math.min(this.maximum, this.value + Math.max(healAmount, 0));
  }
}
