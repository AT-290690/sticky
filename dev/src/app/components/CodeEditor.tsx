import React, { useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "../components/ui/button.js";
import theme from "../theme.js";
// import {} from "../components/ui/dialog.js";
import { Play } from "lucide-react";
import init, {
  //   exec,
  //   comp,
  //   cons,
  // run,
  evaluate,
  get_output_len,
} from "../pkg/web/fez_rs.js";
import { standardLibrary } from "../standardLibrary.js";
import { Que, QueConf } from "../que.js";
// @ts-ignore
let wasm;
init().then((w) => (wasm = w));
const serialise = (arg) => {
  if (typeof arg === "number") return arg.toString();
  else if (typeof arg === "string") return `"${arg.toString()}"`;
  else if (Array.isArray(arg))
    return arg.length ? `[${arg.map((a) => serialise(a)).join(" ")}]` : "[]";
  else if (arg === true || arg === false) return arg.toString();
  else return "Function";
};
const serialiseHandledStrings = (arg) => {
  if (typeof arg === "number") return arg.toString();
  else if (typeof arg === "string") return `${arg.toString()}`;
  else if (Array.isArray(arg))
    return arg.length
      ? `[${arg.map((a) => serialiseHandledStrings(a)).join(" ")}]`
      : "[]";
  else if (arg === true || arg === false) return arg.toString();
  else return "Function";
};
const charCodesToString = (codes) => {
  if (Array.isArray(codes)) {
    if (typeof codes[0] === "number")
      return codes.map((x) => String.fromCharCode(x)).join("");
    else return codes.map(charCodesToString);
  } else return codes;
};
const charCodeToChar = (code) => `'${String.fromCharCode(code)}'`;
const readWasmString = (ptr, len) =>
  new TextDecoder().decode(new Uint8Array(wasm.memory.buffer, ptr, len));
// Use these
// const typeCheck = (program) => readWasmString(check(program), get_output_len());
// const compileJs = (program) => readWasmString(js(program), get_output_len());
// const compileBiteCode = (program) =>
//   readWasmString(comp(program), get_output_len());
// const execBiteCode = (program) =>
//   readWasmString(exec(program), get_output_len());
const typeCheckAndRun = (program) =>
  readWasmString(evaluate(program), get_output_len());
// const uncheckRun = (program) => readWasmString(run(program), get_output_len());
// const concatenateBiteCode = (a, b) =>
//   readWasmString(cons(a, b), get_output_len());
const formatType = (typ) => typ.replaceAll(new RegExp(/\d/g), "");
// const reduceErrorNoise = (err) => {
//   if (err.length > 100) {
//     const arr = [...err];
//     const lastLine = err.split("\n").pop();
//     return `${arr.slice(0, 97).join("")}...\n${lastLine}`;
//   }
//   return err;
// };
const compile = (value: string) => {
  const out = typeCheckAndRun(value);
  // To debug memory leaks
  // console.log(wasm.memory.buffer);
  if (out[0] !== "0") {
    return {
      // reduceErrorNoise()
      err: out.slice(2).replaceAll("Error! ", "").trim(),
      typ: null,
      res: null,
    };
  } else {
    const [_, typ, res] = out.split("\n");
    return { err: null, typ: formatType(typ), res };
  }
};
// const fastCompile = (value: string) => {
//   try {
//     const comp = compileJs(value);
//     if (comp.includes("return var ")) {
//       return {
//         err: null,
//         typ: "()",
//         res: 0,
//       };
//     }
//     return {
//       err: null,
//       typ: "()",
//       res: new Function(`return ${compileJs(value)}`)(),
//     };
//   } catch (err) {
//     return {
//       err: `Something went horribly wrong executing JavaScript!\n${err}`,
//       typ: "()",
//       res: null,
//     };
//   }
// };

interface TerminalLine {
  type: "output" | "error";
  content: string;
}
const handleError = (res) => {
  try {
    return JSON.parse(
      res.trim().split("\n").at(-1)?.replaceAll(" ", ",") ?? res
    );
  } catch (err) {
    return err;
  }
};

function formatTuple(type, res) {
  // Helper: split top-level space-separated tokens while respecting nested brackets
  function splitTopLevel(str) {
    const parts: string[] = [];
    let depth = 0,
      current = "";
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (c === "{" || c === "[") depth++;
      if (c === "}" || c === "]") depth--;
      if (c === " " && depth === 0) {
        if (current.trim()) parts.push(current.trim());
        current = "";
      } else current += c;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  // Parse the result structure into nested arrays/numbers
  function parseValue(input) {
    input = input.trim();
    if (input.startsWith("[") && input.endsWith("]")) {
      const inner = input.slice(1, -1).trim();
      if (!inner) return [];
      return splitTopLevel(inner).map(parseValue);
    }
    if (input.startsWith("{") && input.endsWith("}")) {
      const inner = input.slice(1, -1).trim();
      const parts = splitTopLevel(inner);
      return parts.map(parseValue);
    }
    if (/^\d+$/.test(input)) return Number(input);
    if (input === "true") return true;
    if (input === "false") return false;
    return input;
  }

  // Parse type structure to decide how to format chars
  function formatWithType(typeDesc, val) {
    typeDesc = typeDesc.trim();

    if (Array.isArray(val)) {
      // Handle array types
      if (typeDesc.startsWith("[") && typeDesc.endsWith("]")) {
        const innerType = typeDesc.slice(1, -1).trim();
        // Special case: [Char]
        if (innerType === "Char") {
          return `"${String.fromCharCode(...val)}"`;
        }
        return val.map((v) => formatWithType(innerType, v));
      }

      // Handle tuple {A * B}
      if (typeDesc.includes("*")) {
        const [leftType, rightType] = typeDesc
          .replace(/[{}]/g, "")
          .split("*")
          .map((t) => t.trim());
        return [
          formatWithType(leftType, val[0]),
          formatWithType(rightType, val[1]),
        ];
      }
    }

    // Char case
    if (typeDesc === "Char") {
      return `'${String.fromCharCode(val)}'`;
    }

    // Primitive passthrough
    return val;
  }

  const parsedRes = parseValue(res);
  return formatWithType(type, parsedRes);
}

export default function CodeEditor(props) {
  const initial = props.initial;
  const input = `(let INPUT "${props.input}")`;
  const setCode = props.setCode;
  const editorRef = useRef<any>(null);

  // if (!monaco) return;
  //   const [editor, setEditor] = useState(null);
  // const editorRef = useRef(null);
  const [terminalLines, setTerminalLines] = useState({
    content: "",
    type: "output",
  });
  const [typeInfo, setTypeInfo] = useState("()");

  //   useEffect(() => {
  //     if (!monaco) return;
  //     const editorInit = monaco.editorRef.current.getEditors()[0];
  //     if (!editorInit) return;
  //     setEditor(editorInit);

  //     // Cleanup provider
  //     return () => {
  //       completionProvider.dispose();
  //     };
  //   }, [monaco]); // runs once when monaco becomes available
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    console.log(monaco.__init);
    if (monaco.__init === true) return;
    // defineTheme is idempotent but avoid re-defining unnecessarily
    try {
      const themeName = "my";
      monaco.editor.defineTheme(themeName, theme["dark"] as any);
      monaco.editor.setTheme(themeName);
      // Register a new language
      monaco.languages.register({ id: "que" });
      // Register a tokens provider for the language
      monaco.languages.setMonarchTokensProvider("que", Que as any);
      monaco.languages.setLanguageConfiguration("que", QueConf as any);
      monaco.languages.registerCompletionItemProvider("que", {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const suggestions = standardLibrary.map(({ name, signature }) => ({
            label: name,
            kind: monaco.languages.CompletionItemKind.Function,
            // documentation: signature,
            detail: signature,
            insertText: name,
            range: range,
          }));

          return { suggestions: suggestions };
        },
      });
    } catch (e) {
      // ignore if it's already defined (optional)
    }

    // completionProvider.dispose();
  };
  const handleRun = (source: string = "") => {
    const { err, typ, res } = compile(`${input} ${source}`);
    if (err != null) {
      setTypeInfo("()");
      return setTerminalLines({ type: "error", content: err });
    }
    if (typ) {
      if (typ.includes("*")) {
        setTerminalLines({
          type: "output",
          content: serialiseHandledStrings(formatTuple(typ, res)),
        });
      } else
        setTerminalLines({
          type: "output",
          content:
            typ === "Char"
              ? charCodeToChar(res)
              : typ.includes("[Char]")
              ? serialise(charCodesToString(handleError(res)))
              : res,
        });
      // setTerminalLines({
      //   type: "output",
      //   content:
      //     typ === "Char"
      //       ? charCodeToChar(res)
      //       : !typ.includes("*") && typ.includes("[Char]")
      //       ? serialise(charCodesToString(handleError(res)))
      //       : res,
      // });
      setTypeInfo(formatType(typ));
    }
  };
  // const handleFastRun = (source: string = "") => {
  //   const { err, res } = fastCompile(source);
  //   setTypeInfo("()");
  //   if (err != null) {
  //     return setTerminalLines({ type: "error", content: err });
  //   }
  //   setTerminalLines({
  //     type: "output",
  //     content: serialise(res),
  //   });
  // };

  // // Keyboard shortcut: Ctrl/Cmd+S to run code
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.key.toLowerCase() === "s" && (e.ctrlKey || e.metaKey)) {
  //       e.preventDefault();
  //       e.stopPropagation();
  //       handleRun(editorRef.current.getValue());
  //     }
  //   };

  //   document.addEventListener("keydown", handleKeyDown);

  //   return () => {
  //     document.removeEventListener("keydown", handleKeyDown);
  //   };
  // }, [handleRun, handleFastRun]);

  // const getCursorPosition = () => {
  //   const pos = editor?.getPosition(); // { lineNumber, column } or null
  //   return pos;
  // };

  // const handleChange = (value) => {
  //   setCode(value || "");
  // };

  return (
    <div className="flex flex-col h-[300px] bg-slate-950 border border-white/40">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Code Editor Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <Editor
              defaultLanguage="que"
              language="que"
              theme="my"
              defaultValue={initial}
              onMount={handleEditorDidMount}
              onChange={(value) => {
                setCode(value);
              }}
              options={{
                fontFamily: "JetBrains Mono",
                fontSize: 10,
                bracketPairColorization: { enabled: true },
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontLigatures: true,
                lineNumbers: "off",
                tabSize: 2,
                automaticLayout: true,
                renderWhitespace: "boundary",
                guides: {
                  indentation: false,
                  bracketPairs: true,
                  bracketPairsHorizontal: true,
                  highlightActiveBracketPair: true,
                  highlightActiveIndentation: true,
                },
              }}
            />
          </div>
        </div>

        {/* Terminal Section */}
        <div className="h-25 flex flex-col bg-slate-950 border-t border-slate-800">
          <div className="flex items-center justify-between px-6 py-2 bg-slate-950 border-b border-slate-800">
            {/* <span className="text-slate-400 text-sm">
              Terminal
            </span> */}
            {/* Type Display */}
            <textarea
              value={typeInfo}
              className="h-3 text-emerald-400 text-sm"
              style={{
                resize: "none",
                width: "100%",
                fontSize: "10px",
                fontFamily: '"JetBrains Mono", monospace',
              }}
            ></textarea>

            <div className="flex gap-2">
              {/* {displayButtons.j && (
                <Button
                  onClick={() => handleFastRun(editorRef.current.getValue())}
                  className="bg-yellow-600 hover:bg-slate-700 text-white cursor-pointer"
                >
                  <Zap className="w-4 h-4 mr-1 " />
                </Button>
              )} */}

              <Button
                onClick={() => handleRun(editorRef.current.getValue())}
                className="bg-slate-800 hover:bg-slate-700 active:bg-emerald-700 text-white cursor-pointer"
              >
                <Play className="w-4 h-4" />
                {/* Run */}
              </Button>
            </div>
          </div>
          {/* <ScrollArea className="flex-1 px-6 py-2"> */}
          <div
            className="px-6 py-2 text-sm space-y-1 overflow-hidden"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            <textarea
              value={terminalLines.content}
              style={{ fontSize: "10px", resize: "none", width: "100%" }}
              className={
                terminalLines.type === "error"
                  ? "text-red-400"
                  : "text-slate-300"
              }
            ></textarea>
          </div>
          {/* </ScrollArea> */}
        </div>
      </div>
    </div>
  );
}
