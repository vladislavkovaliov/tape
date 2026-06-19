export abstract class Command<T> {
  abstract execute(state: T): Promise<T>
  abstract undo(state: T): Promise<T>

  protected sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }
}

export class CommandStack<T> {
  private history: T[] = []

  constructor(private state: T) {
    this.history.push(state)
  }

  async execute(cmd: Command<T>): Promise<T> {
    this.state = await cmd.execute(this.state)
    this.history.push(this.state)
    return this.state
  }

  getState(): T {
    return this.state
  }
}
