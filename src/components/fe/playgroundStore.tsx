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

function createPlaygroundStore(initialCode: string) {
  const runner: InternalRunner = {
    program: null,
    execState: null,
    generator: null,
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
        highlight: { line: null, column: null },
        variables: [],
        frames: [],
        output: [],
      });
    };

    const ensureStarted = (): boolean => {
      if (runner.generator) return true;
      const { code } = get();
      try {
        const program = parse(code);
        const execState = createInitialState(program);
        runner.program = program;
        runner.execState = execState;
        runner.generator = runFromState(program, execState);
        set({
          status: "paused",
          parseError: null,
          runtimeError: null,
          highlight: { line: null, column: null },
          variables: snapshotVariables(execState),
          frames: snapshotFrames(execState),
          output: [],
        });
        return true;
      } catch (e) {
        if (e instanceof PseudoLexError || e instanceof PseudoParseError) {
          set({
            status: "parseError",
            parseError: e,
            runtimeError: null,
            highlight: { line: e.pos.line, column: e.pos.column },
            variables: [],
            frames: [],
            output: [],
          });
        }
        return false;
      }
    };

    const commitEvent = (event: StepEvent, execState: ExecutionState) => {
      if (event.type === "error") {
        set({
          status: "runtimeError",
          runtimeError: event.error,
          highlight: {
            line: event.error.pos.line,
            column: event.error.pos.column,
          },
          variables: snapshotVariables(execState),
          frames: snapshotFrames(execState),
        });
        return;
      }
      if (event.type === "output") {
        set((s) => ({
          output: [...s.output, { text: event.text, line: event.pos.line }],
        }));
        return;
      }
      if (event.type === "before-stmt") {
        set({
          highlight: {
            line: event.node.pos.line,
            column: event.node.pos.column,
          },
          variables: snapshotVariables(execState),
          frames: snapshotFrames(execState),
        });
        return;
      }
      if (event.type === "after-stmt") {
        set({
          variables: snapshotVariables(execState),
          frames: snapshotFrames(execState),
        });
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
      highlight: { line: null, column: null },
      variables: [],
      frames: [],
      output: [],

      reset: () => doReset(),

      step: () => {
        if (!ensureStarted()) return;
        const gen = runner.generator!;
        const execState = runner.execState!;
        const st = get().status;
        if (st === "finished" || st === "runtimeError") return;
        // Advance until we reach a "before-stmt" event (natural stop point)
        // or the generator ends. This makes each Step land on the next
        // executable line rather than pausing between before/after.
        let safety = 1000;
        while (safety-- > 0) {
          const result = gen.next();
          if (result.done) {
            set({
              status: "finished",
              highlight: { line: null, column: null },
              variables: snapshotVariables(execState),
              frames: snapshotFrames(execState),
            });
            return;
          }
          commitEvent(result.value, execState);
          if (result.value.type === "error") return;
          if (result.value.type === "before-stmt") return;
        }
      },

      run: () => {
        if (!ensureStarted()) return;
        const gen = runner.generator!;
        const execState = runner.execState!;
        let safety = 1_000_000;
        while (safety-- > 0) {
          const result = gen.next();
          if (result.done) {
            set({
              status: "finished",
              highlight: { line: null, column: null },
              variables: snapshotVariables(execState),
              frames: snapshotFrames(execState),
            });
            return;
          }
          commitEvent(result.value, execState);
          if (result.value.type === "error") return;
        }
      },
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
