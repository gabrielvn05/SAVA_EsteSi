import type { CommandHandler, CommandResult, QueryHandler, QueryResult } from "@/lib/cqrs/types";
import { logEvent } from "@/lib/logging/logger";

export async function dispatchCommand<TInput, TOutput>(
  handler: CommandHandler<TInput, TOutput>,
  input: TInput
): Promise<CommandResult<TOutput>> {
  logEvent("db", "info", `Command: ${handler.name}`, { handler: handler.name });
  return handler.execute(input);
}

export async function dispatchQuery<TInput, TOutput>(
  handler: QueryHandler<TInput, TOutput>,
  input: TInput
): Promise<QueryResult<TOutput>> {
  logEvent("db", "debug", `Query: ${handler.name}`, { handler: handler.name });
  return handler.execute(input);
}
