export default {
  ["light"]: {
    base: "vs",
    inherit: true,
    rules: [
      {
        foreground: "7285b2aa",
        token: "comment",
      },
      {
        foreground: "155dfc",
        token: "string",
      },
      {
        foreground: "000000",
        token: "number",
      },
      {
        foreground: "000000",
        token: "variable",
      },
      {
        foreground: "000000",
        fontStyle: "bold",
        token: "keyword",
      },
      {
        foreground: "000000",
        token: "constant",
      },
      {
        foreground: "000000",
        token: "type",
        fontStyle: "bold",
      },
      {
        foreground: "ff0000",
        token: "boolean",
      },
    ],
    colors: {
      "editor.foreground": "#000000",
      "editor.background": "#ffffff",
      "editor.selectionBackground": "#00000015",
      "editor.lineHighlightBackground": "#00000015",
      "editorCursor.foreground": "#000000",
      "editorWhitespace.foreground": "#d1d5da55",
      "editorIndentGuide.background": "#e1e4e8",
      "editor.selectionHighlightBorder": "#b6d6ff",
    },
  },
  ["dark"]: {
    base: "vs-dark",
    inherit: true,
    rules: [
      {
        foreground: "7285b2aa",
        token: "comment",
      },
      {
        foreground: "addb67",
        token: "string",
      },
      {
        foreground: "f78c6c",
        token: "number",
      },
      {
        foreground: "addb67",
        token: "variable",
      },
      {
        foreground: "c792ea",
        fontStyle: "bold",
        token: "keyword",
      },
      {
        foreground: "40c8ae",
        token: "type",
      },
      {
        foreground: "ff5874",
        token: "boolean",
      },
    ],
    colors: {
      "editor.foreground": "#d6deeb",
      "editor.background": "#0c1428",
      "editor.selectionBackground": "#5f7e9779",
      "editor.lineHighlightBackground": "#010E17",
      "editorCursor.foreground": "#80a4c2",
      "editorWhitespace.foreground": "#2e2040",
      "editorIndentGuide.background": "#5e81ce52",
      "editor.selectionHighlightBorder": "#122d42",
    },
  },
};
