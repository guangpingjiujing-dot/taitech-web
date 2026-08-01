import { StreamLanguage } from "@codemirror/language";

const ENGLISH_KEYWORDS = new Set([
  "if",
  "then",
  "elseif",
  "else",
  "endif",
  "while",
  "endwhile",
  "for",
  "endfor",
  "return",
  "and",
  "or",
  "not",
  "mod",
]);

const ATOMS = new Set(["true", "false"]);

const JP_KEYWORDS: [RegExp, string][] = [
  [/^未定義の値/, "atom"],
  [/^整数型|^実数型|^文字列型|^論理型/, "type"],
  [/^の配列/, "type"],
  [/^増やす|^減らす/, "keyword"],
  [/^から|^まで|^ずつ|^を/, "keyword"],
];

export const pseudoLanguage = StreamLanguage.define({
  name: "pseudo",
  startState() {
    return {};
  },
  token(stream) {
    if (stream.eatSpace()) return null;

    // Comments
    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match("/*")) {
      while (!stream.eol()) {
        if (stream.match("*/")) return "comment";
        stream.next();
      }
      return "comment";
    }

    // Strings
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return "string";

    // Numbers
    if (stream.match(/^\d+(\.\d+)?/)) return "number";

    // Japanese keywords (multi-char)
    for (const [re, cls] of JP_KEYWORDS) {
      if (stream.match(re)) return cls;
    }

    // Full-width operators
    if (stream.match(/^[←≠≦≧○]/)) return "operator";

    // Half-width multi-char operators
    if (stream.match("<-")) return "operator";
    if (stream.match("!=")) return "operator";
    if (stream.match("<=")) return "operator";
    if (stream.match(">=")) return "operator";

    // Symbols
    if (stream.match(/^[+\-*/=<>()[\]{},:：]/)) return "operator";

    // English identifiers / keywords
    if (stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)) {
      const text = stream.current();
      if (ENGLISH_KEYWORDS.has(text)) return "keyword";
      if (ATOMS.has(text)) return "atom";
      return "variableName";
    }

    // Japanese identifiers (kanji or katakana)
    if (
      stream.match(/^[一-鿿゠-ヿ][一-鿿゠-ヿ0-9]*/)
    ) {
      return "variableName";
    }

    stream.next();
    return null;
  },
  tokenTable: {},
  languageData: {
    commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
  },
});
