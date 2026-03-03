interface UseCommandHistoryOptions {
  maxSize?: number;
}

interface UseCommandHistoryReturn {
  currentCommand: Readonly<Ref<string>>;
  navigateUp: () => void;
  navigateDown: () => void;
  addCommandToHistory: (command: string) => void;
  onInputChange: (command: string) => void;
}

/**
 * Manages command-line style history navigation for a single input box.
 * @param options - Configuration options.
 * @param options.maxSize - Maximum number of history entries.
 * @returns APIs for reading current command, navigating history and updating input.
 */
export function useCommandHistory(options: UseCommandHistoryOptions = {}): UseCommandHistoryReturn {
  const { maxSize = 50 } = options;

  const history = ref<string[]>([]);
  const historyIndex = ref(0);
  const currentCommand = ref('');
  let draftCommand = '';

  /**
   * Navigate up (older commands).
   * Saves the current draft when leaving draft state for the first time.
   */
  const navigateUp = (): void => {
    if (historyIndex.value > 0) {
      if (historyIndex.value === history.value.length) {
        draftCommand = currentCommand.value;
      }
      historyIndex.value--;
      currentCommand.value = history.value[historyIndex.value];
    }
  };

  /**
   * Navigate down (newer commands or back to draft state).
   */
  const navigateDown = (): void => {
    if (historyIndex.value < history.value.length) {
      historyIndex.value++;
      if (historyIndex.value === history.value.length) {
        currentCommand.value = draftCommand;
      }
      else {
        currentCommand.value = history.value[historyIndex.value];
      }
    }
  };

  /**
   * Adds a confirmed command to history.
   * @param command - The command to add.
   */
  const addCommandToHistory = (command: string): void => {
    const trimmedCommand = command.trim();
    if (trimmedCommand && history.value[history.value.length - 1] !== trimmedCommand) {
      history.value.push(trimmedCommand);
      if (history.value.length > maxSize) {
        history.value.shift();
      }
    }

    historyIndex.value = history.value.length;
    draftCommand = '';
  };

  /**
   * Updates input content while user is typing in draft state.
   * @param command - Current input value.
   */
  const onInputChange = (command: string): void => {
    currentCommand.value = command;
    historyIndex.value = history.value.length;
    draftCommand = command;
  };

  return {
    currentCommand: readonly(currentCommand),
    navigateUp,
    navigateDown,
    addCommandToHistory,
    onInputChange,
  };
}
