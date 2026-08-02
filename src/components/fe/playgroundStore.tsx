"use client";

import { createStore, useStore } from "zustand";
import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import {
  createInitialState,
  parse,
  runFromState,
  PseudoLexError,
  PseudoParseError,
  PseudoRuntimeError,
  type ExecutionState,
  type Program,
  type StepEvent,
  type Value,
} from "@/lib/pseudo";

export interface OutputLine {
  text: string;
  line: number;
}

export interface HighlightState {
  line: number | null;
  column: number | null;
  /** Incremented on every state update so the editor effect always re-fires,
   * even when the target line is identical to the previous highlight. */
  version: number;
}

export type PlaygroundStatus =
  | "idle"
  | "parseError"
  | "running"
  | "paused"
  | "finished"
  | "runtimeError";

export interface VarSnapshot {
  frame: string;
  name: string;
  typeLabel: string;
  displayValue: string;
}

export interface FrameSnapshot {
  funcName: string;
  line: number | null;
}

export interface PlaygroundState {
  code: string;
  setCode: (code: string) => void;

  status: PlaygroundStatus;
  parseError: PseudoLexError | PseudoParseError | null;
  runtimeError: PseudoRuntimeError | null;

  highlight: HighlightState;
  variables: VarSnapshot[];
  frames: FrameSnapshot[];
  output: OutputLine[];

  reset: () => void;
  step: () => void;
  run: () => void;
  insertText: (text: string) => void;
  editorInsertRef: { current: ((text: string) => void) | null };
}

interface InternalRunner {
  program: Program | null;
  execState: ExecutionState | null;
  generator: Generator<StepEvent, void, void> | null;
}

const DEFAULT_CODE = `整数型: n ← 5
整数型: 合計 ← 0
for (i を 1 から n まで 1 ずつ増やす)
  合計 ← 合計 + i
endfor
print(合計)
`;

function typeLabel(v: Value): string {
  switch (v.type) {
    case "int":
      return "整数";
    case "float":
      return "実数";
    case "string":
      return "文字列";
    case "bool":
      return "論理";
    case "undefined":
      return "未定義";
    case "array":
      return `配列(${v.base})`;
  }
}

function formatValue(v: Value): string {
  switch (v.type) {
    case "int":
    case "float":
      return String(v.value);
    case "string":
      return `"${v.value}"`;
    case "bool":
      return v.value ? "true" : "false";
    case "undefined":
      return "未定義";
    case "array":
      return `{${v.elements.map(formatValue).join(", ")}}`;
  }
}

function snapshotVariables(state: ExecutionState): VarSnapshot[] {
  const out: VarSnapshot[] = [];
  state.callStack.forEach((frame) => {
    for (const [name, value] of frame.variables) {
      out.push({
        frame: frame.funcName,
        name,
        typeLabel: typeLabel(value),
        displayValue: formatValue(value),
      });
    }
  });
  return out;
}

function snapshotFrames(state: ExecutionState): FrameSnapshot[] {
  return state.callStack.map((f) => ({
    funcName: f.funcName,
    line: state.currentNode?.pos.line ?? null,
  }));
}

const EMPTY_HIGHLIGHT: HighlightState = {
  line: null,
  column: null,
  version: 0,
};

function createPlaygroundStore(initialCode: string) {
  const runner: InternalRunner = {
    program: null,
    execState: null,
    generator: null,
  };
  // Version counter for highlight updates. Incremented on every commit so
  // the editor's effect fires reliably even when the target line is unchanged.
  let highlightVersion = 0;
  const nextHighlight = (
    line: number | null,
    column: number | null,
  ): HighlightState => {
    highlightVersion += 1;
    return { line, column, version: highlightVersion };
  };

  const editorInsertRef: { current: ((text: string) => void) | null } = {
    current: null,
  };

  return createStore<PlaygroundState>()((set, get) => {
    const doReset = () => {
      runner.program = null;
      runner.execState = null;
      runner.generator = null;
      set({
        status: "idle",
        parseError: null,
        runtimeError: null,
        highlight: nextHighlight(null, null),
        variables: [],
        frames: [],
        output: [],
      });
    };

    /** Set up the runner if not started. On parse error, set state and
     *  return false. On success returns true and does NOT call set() — the
     *  caller commits a single atomic update per user action. */
    const ensureStarted = (): boolean => {
      if (runner.generator) return true;
      const { code } = get();
      try {
        const program = parse(code);
        const execState = createInitialState(program);
        runner.program = program;
        runner.execState = execState;
        runner.generator = runFromState(program, execState);
        return true;
      } catch (e) {
        if (e instanceof PseudoLexError || e instanceof PseudoParseError) {
          set({
            status: "parseError",
            parseError: e,
            runtimeError: null,
            highlight: nextHighlight(e.pos.line, e.pos.column),
            variables: [],
            frames: [],
            output: [],
          });
        }
        return false;
      }
    };

    return {
      code: initialCode,
      setCode: (code: string) => {
        set({ code });
        doReset();
      },

      status: "idle",
      parseError: null,
      runtimeError: null,
      highlight: EMPTY_HIGHLIGHT,
      variables: [],
      frames: [],
      output: [],

      reset: () => doReset(),

      step: () => {
        const st = get().status;
        if (st === "parseError") return;
        // On terminal states, clear the runner so ensureStarted() creates a
        // fresh one. Display (output/variables) is preserved until the new
        // run's first event overwrites it via set() below.
        if (st === "finished" || st === "runtimeError") {
          runner.program = null;
          runner.execState = null;
          runner.generator = null;
        }
        if (!ensureStarted()) return;
        const gen = runner.generator!;
        const execState = runner.execState!;

        // If we're starting a fresh run (previous state was finished/runtime
        // error), reset the accumulated output — it belongs to the previous
        // run and should not carry over.
        const startingFresh = st === "finished" || st === "runtimeError";

        const outputAppended: OutputLine[] = [];
        let latestBefore: { line: number; column: number } | null = null;
        let done = false;
        let runtimeError: PseudoRuntimeError | null = null;

        let safety = 5000;
        while (safety-- > 0) {
          const result = gen.next();
          if (result.done) {
            done = true;
            break;
          }
          const ev = result.value;
          if (ev.type === "error") {
            runtimeError = ev.error;
            break;
          }
          if (ev.type === "output") {
            outputAppended.push({ text: ev.text, line: ev.pos.line });
            continue;
          }
          if (ev.type === "before-stmt") {
            latestBefore = {
              line: ev.node.pos.line,
              column: ev.node.pos.column,
            };
            break;
          }
          // after-stmt / call-enter / call-exit: skip
        }

        set((s) => {
          const priorOutput = startingFresh ? [] : s.output;
          const output =
            outputAppended.length > 0
              ? [...priorOutput, ...outputAppended]
              : priorOutput;
          if (runtimeError) {
            return {
              status: "runtimeError" as const,
              runtimeError,
              highlight: nextHighlight(
                runtimeError.pos.line,
                runtimeError.pos.column,
              ),
              variables: snapshotVariables(execState),
              frames: snapshotFrames(execState),
              output,
            };
          }
          if (done) {
            return {
              status: "finished" as const,
              highlight: nextHighlight(null, null),
              variables: snapshotVariables(execState),
              frames: snapshotFrames(execState),
              output,
            };
          }
          if (latestBefore) {
            return {
              status: "paused" as const,
              highlight: nextHighlight(
                latestBefore.line,
                latestBefore.column,
              ),
              variables: snapshotVariables(execState),
              frames: snapshotFrames(execState),
              output,
            };
          }
          return { output };
        });
      },

      run: () => {
        const st = get().status;
        if (st === "parseError") return;
        // Same implicit-reset behaviour as step(): terminal states can be
        // re-run without an explicit ⟲リセット press.
        if (st === "finished" || st === "runtimeError") {
          runner.program = null;
          runner.execState = null;
          runner.generator = null;
        }
        if (!ensureStarted()) return;
        const gen = runner.generator!;
        const execState = runner.execState!;

        const startingFresh = st === "finished" || st === "runtimeError";
        const outputAppended: OutputLine[] = [];
        let runtimeError: PseudoRuntimeError | null = null;

        let safety = 1_000_000;
        while (safety-- > 0) {
          const result = gen.next();
          if (result.done) break;
          const ev = result.value;
          if (ev.type === "error") {
            runtimeError = ev.error;
            break;
          }
          if (ev.type === "output") {
            outputAppended.push({ text: ev.text, line: ev.pos.line });
          }
        }

        set((s) => {
          const priorOutput = startingFresh ? [] : s.output;
          const output =
            outputAppended.length > 0
              ? [...priorOutput, ...outputAppended]
              : priorOutput;
          if (runtimeError) {
            return {
              status: "runtimeError" as const,
              runtimeError,
              highlight: nextHighlight(
                runtimeError.pos.line,
                runtimeError.pos.column,
              ),
              variables: snapshotVariables(execState),
              frames: snapshotFrames(execState),
              output,
            };
          }
          return {
            status: "finished" as const,
            highlight: nextHighlight(null, null),
            variables: snapshotVariables(execState),
            frames: snapshotFrames(execState),
            output,
          };
        });
      },

      insertText: (text: string) => {
        editorInsertRef.current?.(text);
      },

      editorInsertRef,
    };
  });
}

const PlaygroundStoreContext = createContext<ReturnType<
  typeof createPlaygroundStore
> | null>(null);

export function PlaygroundStoreProvider({
  children,
  initialCode,
}: {
  children: ReactNode;
  initialCode?: string;
}) {
  const storeRef = useRef<ReturnType<typeof createPlaygroundStore> | null>(
    null,
  );
  if (!storeRef.current) {
    storeRef.current = createPlaygroundStore(initialCode ?? DEFAULT_CODE);
  }
  return (
    <PlaygroundStoreContext.Provider value={storeRef.current}>
      {children}
    </PlaygroundStoreContext.Provider>
  );
}

export function usePlayground<T>(selector: (s: PlaygroundState) => T): T {
  const store = useContext(PlaygroundStoreContext);
  if (!store) {
    throw new Error("usePlayground must be used within PlaygroundStoreProvider");
  }
  return useStore(store, selector);
}

export { DEFAULT_CODE };
