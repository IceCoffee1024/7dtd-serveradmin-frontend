import type { Ref } from 'vue';
import { readonly, ref } from 'vue';

interface UseLatestAsyncOptions<T> {
  /** Initial value restored by `reset()`. */
  initialValue?: T;
  /** Called when the latest task fails. */
  onError?: (error: unknown) => void;
}

interface UseLatestAsyncReturn<T> {
  /** Latest resolved value from the most recent task. */
  data: Readonly<Ref<T | undefined>>;
  /** Whether the latest task is still running. */
  pending: Readonly<Ref<boolean>>;
  /** Error captured from the latest task. */
  error: Readonly<Ref<unknown | undefined>>;
  /**
   * Runs a task and stores its result only if it is still the latest request.
   * @param task - Async task to execute.
   * @returns Resolved value when the task is current; otherwise `undefined`.
   */
  execute: (task: () => Promise<T>) => Promise<T | undefined>;
  /** Resets state and invalidates all in-flight tasks. */
  reset: () => void;
}

/**
 * Keeps only the latest async result and ignores stale responses.
 * @param options - Composable configuration.
 * @returns Latest-request state helpers.
 */
export function useLatestAsync<T>(options: UseLatestAsyncOptions<T> = {}): UseLatestAsyncReturn<T> {
  const data = ref<T | undefined>(options.initialValue);
  const pending = ref(false);
  const error = ref<unknown>();
  const requestVersion = ref(0);

  /** Invalidates the current request and clears cached state. */
  function reset(): void {
    requestVersion.value += 1;
    data.value = options.initialValue;
    error.value = undefined;
    pending.value = false;
  }

  /**
   * Executes a task and commits its result only if it is still current.
   * @param task - Async task to execute.
   * @returns Resolved value when current; otherwise `undefined`.
   */
  async function execute(task: () => Promise<T>): Promise<T | undefined> {
    const version = ++requestVersion.value;
    pending.value = true;
    error.value = undefined;

    try {
      const result = await task();

      if (version !== requestVersion.value)
        return undefined;

      data.value = result;
      return result;
    }
    catch (taskError) {
      if (version !== requestVersion.value)
        return undefined;

      error.value = taskError;
      options.onError?.(taskError);
      return undefined;
    }
    finally {
      if (version === requestVersion.value)
        pending.value = false;
    }
  }

  return {
    data: readonly(data) as Readonly<Ref<T | undefined>>,
    pending: readonly(pending) as Readonly<Ref<boolean>>,
    error: readonly(error) as Readonly<Ref<unknown | undefined>>,
    execute,
    reset,
  };
}
