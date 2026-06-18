export type CommandResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

export type QueryResult<T> = { ok: true; data: T } | { ok: false; error: string };

export interface CommandHandler<TInput, TOutput = void> {
  readonly name: string;
  execute(input: TInput): Promise<CommandResult<TOutput>>;
}

export interface QueryHandler<TInput, TOutput> {
  readonly name: string;
  execute(input: TInput): Promise<QueryResult<TOutput>>;
}
