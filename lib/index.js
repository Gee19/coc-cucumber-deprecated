var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
var __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
};

// src/index.ts
__markAsModule(exports);
__export(exports, {
  activate: () => activate,
  fullDocumentRange: () => fullDocumentRange2
});
var import_coc3 = __toModule(require("coc.nvim"));

// src/format.ts
var import_coc2 = __toModule(require("coc.nvim"));

// src/formatter/feature.ts
var import_coc = __toModule(require("coc.nvim"));
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "$&");
}
var FORMAT_CONF = {
  Ability: 0,
  "Business Need": 0,
  "Feature:": 0,
  "Rule:": 1,
  "Scenario:": 1,
  "Example:": 1,
  "Background:": 1,
  "Scenario Outline:": 1,
  "Examples:": 2,
  Given: 2,
  When: 2,
  Then: 2,
  And: 2,
  But: 2,
  "\\*": 2,
  "\\|": 3,
  '"""': 3,
  "#": "relative",
  "@": "relative"
};
var cjkRegex = /[\u3000-\u9fff\uac00-\ud7af\uff01-\uff60]/g;
function stringBytesLen(str) {
  return str.length + (str.match(cjkRegex) || []).length;
}
function findIndentation(line) {
  const format2 = findFormat(line);
  return format2 ? format2.value : null;
}
function findFormat(line) {
  const extensionConfig = import_coc.workspace.getConfiguration("cucumber");
  const settingsFormatConf = extensionConfig.get("cucumber.autocomplete.formatConfOverride", {});
  const fnFormatFinder = (conf) => {
    const symbol = Object.keys(conf).find((key) => !!~line.search(new RegExp(escapeRegExp("^\\s*" + key))));
    return symbol ? {symbol, value: conf[symbol]} : null;
  };
  const settingsFormat = fnFormatFinder(settingsFormatConf);
  const presetFormat = fnFormatFinder(FORMAT_CONF);
  return settingsFormat === null ? presetFormat : settingsFormat;
}
function correctIndents(text, indent) {
  const extensionConfig = import_coc.workspace.getConfiguration("cucumber");
  const skipDocStringsFormat = extensionConfig.get("cucumber.autocomplete.skipDocStringsFormat");
  let commentsMode = false;
  const defaultIndentation = 0;
  let insideRule = false;
  const ruleValue = findFormat("Rule:").value;
  const ruleIndentation = typeof ruleValue === "number" ? ruleValue : 0;
  return text.split(/\r?\n/g).map((line, i, textArr) => {
    if (skipDocStringsFormat) {
      if (~line.search(/^\s*'''\s*/) || ~line.search(/^\s*"""\s*/)) {
        commentsMode = !commentsMode;
      } else {
        if (commentsMode === true)
          return line;
      }
    }
    const format2 = findFormat(line);
    if (format2 && format2.symbol === "Rule:") {
      insideRule = true;
    }
    let indentCount;
    if (~line.search(/^\s*$/)) {
      indentCount = 0;
    } else if (format2 && typeof format2.value === "number") {
      indentCount = format2.value + (insideRule && format2.symbol !== "Rule:" ? ruleIndentation : 0);
    } else {
      const nextLine = textArr.slice(i + 1).find((l) => typeof findIndentation(l) === "number");
      if (nextLine) {
        const nextLineIndentation = findIndentation(nextLine);
        indentCount = nextLineIndentation === null ? defaultIndentation : nextLineIndentation;
      } else {
        indentCount = defaultIndentation;
      }
      indentCount += insideRule ? ruleIndentation : 0;
    }
    return line.replace(/^\s*/, indent.repeat(indentCount));
  }).join("\r\n");
}
function getIndent(options) {
  const {insertSpaces, tabSize} = options;
  return insertSpaces ? " ".repeat(tabSize || 0) : "	";
}
async function format(context, outputChannel, document, range) {
  const formatOptions = await import_coc.workspace.getFormatOptions(document.uri);
  const text = correctIndents(document.getText(range), getIndent(formatOptions));
  let blockNum = 0;
  const textArr = text.split(/\r?\n/g);
  const blocks = textArr.reduce((res, l, i, arr) => {
    if (~l.search(/^\s*\|/)) {
      res.push({
        line: i,
        block: blockNum,
        data: l.split(/\s*\|\s*/).reduceRight((accumulator, current, index, arr2) => {
          if (index > 0 && index < arr2.length - 1) {
            if (current.endsWith("\\")) {
              accumulator[0] = current + "|" + accumulator[0];
            } else {
              accumulator.unshift(current);
            }
          }
          return accumulator;
        }, [])
      });
    } else {
      if (!~l.search(/^\s*#/)) {
        blockNum++;
      }
    }
    return res;
  }, []);
  const maxes = blocks.reduce((res, b) => {
    const block = b.block;
    if (res[block]) {
      res[block] = res[block].map((v, i) => Math.max(v, stringBytesLen(b.data[i])));
    } else {
      res[block] = b.data.map((v) => stringBytesLen(v));
    }
    return res;
  }, []);
  blocks.forEach((block) => {
    let change = block.data.map((d, i) => ` ${d}${" ".repeat(maxes[block.block][i] - stringBytesLen(d))} `).join("|");
    change = `|${change}|`;
    textArr[block.line] = textArr[block.line].replace(/\|.*/, change);
  });
  return new Promise((resolve) => {
    resolve(textArr.join("\r\n"));
  });
}

// src/format.ts
function fullDocumentRange(document) {
  const lastLineId = document.lineCount - 1;
  const doc = import_coc2.workspace.getDocument(document.uri);
  return import_coc2.Range.create({character: 0, line: 0}, {character: doc.getline(lastLineId).length, line: lastLineId});
}
var CucumberFormattingEditProvider = class {
  constructor(context, outputChannel) {
    this._context = context;
    this._outputChannel = outputChannel;
  }
  provideDocumentFormattingEdits(document) {
    return this._provideEdits(document, void 0);
  }
  provideDocumentRangeFormattingEdits(document, range) {
    return this._provideEdits(document, range);
  }
  getFormatFunc() {
    return format;
  }
  async _provideEdits(document, range) {
    const doFormat = this.getFormatFunc();
    const code = await doFormat(this._context, this._outputChannel, document, range);
    if (!range) {
      range = fullDocumentRange(document);
    }
    return [import_coc2.TextEdit.replace(range, code)];
  }
};
var format_default = CucumberFormattingEditProvider;

// src/index.ts
var formatterHandler;
var rangeFormatterHandler;
var stepsHandler;
function disposeHandlers() {
  if (formatterHandler) {
    formatterHandler.dispose();
  }
  if (rangeFormatterHandler) {
    rangeFormatterHandler.dispose();
  }
  formatterHandler = void 0;
  rangeFormatterHandler = void 0;
}
function selectors() {
  const languageSelector = [{language: "cucumber", scheme: "file"}];
  const rangeLanguageSelector = [{language: "cucumber", scheme: "file"}];
  return {
    languageSelector,
    rangeLanguageSelector
  };
}
function fullDocumentRange2(document) {
  const lastLineId = document.lineCount - 1;
  const doc = import_coc3.workspace.getDocument(document.uri);
  return import_coc3.Range.create({character: 0, line: 0}, {character: doc.getline(lastLineId).length, line: lastLineId});
}
async function activate(context) {
  import_coc3.window.showMessage(`coc-cucumber works!`);
  const extensionConfig = import_coc3.workspace.getConfiguration("cucumber");
  const outputChannel = import_coc3.window.createOutputChannel("cucumber");
  outputChannel.appendLine(`${"#".repeat(10)} cucumber
`);
  const cukePath = extensionConfig.get("cucumber.autocomplete.steps", []);
  if (!cukePath) {
    import_coc3.window.showErrorMessage("Unable to find any step definitions or feature files.");
  }
  const editProvider = new format_default(context, outputChannel);
  const priority = 1;
  function registerFormatter() {
    disposeHandlers();
    const {languageSelector, rangeLanguageSelector} = selectors();
    rangeFormatterHandler = import_coc3.languages.registerDocumentRangeFormatProvider(rangeLanguageSelector, editProvider, priority);
    formatterHandler = import_coc3.languages.registerDocumentFormatProvider(languageSelector, editProvider, priority);
  }
  registerFormatter();
  context.subscriptions.push(import_coc3.commands.registerCommand("cucumber.Format", async () => {
    const doc = await import_coc3.workspace.document;
    const doFormat = editProvider.getFormatFunc();
    const code = await doFormat(context, outputChannel, doc.textDocument, void 0);
    const edits = [import_coc3.TextEdit.replace(fullDocumentRange2(doc.textDocument), code)];
    if (edits) {
      await doc.applyEdits(edits);
    }
  }), import_coc3.sources.createSource({
    name: "coc-cucumber completion source",
    doComplete: async () => {
      const doc = await import_coc3.workspace.document;
      const state = await import_coc3.workspace.getCurrentState();
      const items = await getCompletionItems(doc.textDocument, state.position);
      return items;
    }
  }), import_coc3.workspace.registerAutocmd({
    event: "InsertLeave",
    request: true,
    callback: async () => {
      const doc = await import_coc3.workspace.document;
      const doFormat = editProvider.getFormatFunc();
      const code = await doFormat(context, outputChannel, doc.textDocument, void 0);
      const edits = [import_coc3.TextEdit.replace(fullDocumentRange2(doc.textDocument), code)];
      if (edits) {
        await doc.applyEdits(edits);
      }
    }
  }));
}
function handleSteps() {
  const extensionConfig = import_coc3.workspace.getConfiguration("cucumber");
  const s = extensionConfig.get("cucumber.autocomplete.steps", []);
  return s && s.length ? true : false;
}
async function getCompletionItems(document, position) {
  const text = document.getText({
    start: {line: position.line, character: 0},
    end: position
  });
  const line = text.split(/\r?\n/g)[position.line];
  if (handleSteps() && stepsHandler) {
    return stepsHandler.getCompletion(line, position.line, text);
  }
  return null;
}
