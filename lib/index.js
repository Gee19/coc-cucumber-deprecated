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
var import_coc4 = __toModule(require("coc.nvim"));

// src/format.ts
var import_coc2 = __toModule(require("coc.nvim"));

// src/formatter/feature.ts
var import_coc = __toModule(require("coc.nvim"));
var cjkRegex = /[\u3000-\u9fff\uac00-\ud7af\uff01-\uff60]/g;
function stringBytesLen(str) {
  return str.length + (str.match(cjkRegex) || []).length;
}
async function formatTables(context, outputChannel, document, range) {
  const text = document.getText(range);
  let blockNum = 0;
  let textArr = text.split(/\r?\n/g);
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
    return formatTables;
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

// src/lists.ts
var import_coc3 = __toModule(require("coc.nvim"));
var DemoList = class extends import_coc3.BasicList {
  constructor(nvim) {
    super(nvim);
    this.name = "demo_list";
    this.description = "CocList for coc-cucumber";
    this.defaultAction = "open";
    this.actions = [];
    this.addAction("open", (item) => {
      import_coc3.window.showMessage(`${item.label}, ${item.data.name}`);
    });
  }
  async loadItems(context) {
    return [
      {
        label: "coc-cucumber list item 1",
        data: {name: "list item 1"}
      },
      {
        label: "coc-cucumber list item 2",
        data: {name: "list item 2"}
      }
    ];
  }
};
var lists_default = DemoList;

// src/index.ts
var formatterHandler;
var rangeFormatterHandler;
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
  const doc = import_coc4.workspace.getDocument(document.uri);
  return import_coc4.Range.create({character: 0, line: 0}, {character: doc.getline(lastLineId).length, line: lastLineId});
}
async function activate(context) {
  import_coc4.window.showMessage(`coc-cucumber works!`);
  const extensionConfig = import_coc4.workspace.getConfiguration("cucumber");
  const outputChannel = import_coc4.window.createOutputChannel("cucumber");
  outputChannel.appendLine(`${"#".repeat(10)} cucumber
`);
  const cukePath = extensionConfig.get("cucumber.autocomplete.steps", "");
  if (!cukePath) {
    import_coc4.window.showErrorMessage("Unable to find any step definitions or feature files.");
  }
  const editProvider = new format_default(context, outputChannel);
  const priority = 1;
  function registerFormatter() {
    disposeHandlers();
    const {languageSelector, rangeLanguageSelector} = selectors();
    rangeFormatterHandler = import_coc4.languages.registerDocumentRangeFormatProvider(rangeLanguageSelector, editProvider, priority);
    formatterHandler = import_coc4.languages.registerDocumentFormatProvider(languageSelector, editProvider, priority);
  }
  registerFormatter();
  context.subscriptions.push(import_coc4.commands.registerCommand("cucumber.Format", async () => {
    const doc = await import_coc4.workspace.document;
    const doFormat = editProvider.getFormatFunc();
    const code = await doFormat(context, outputChannel, doc.textDocument, void 0);
    const edits = [import_coc4.TextEdit.replace(fullDocumentRange2(doc.textDocument), code)];
    if (edits) {
      await doc.applyEdits(edits);
    }
  }), import_coc4.listManager.registerList(new lists_default(import_coc4.workspace.nvim)), import_coc4.sources.createSource({
    name: "coc-cucumber completion source",
    doComplete: async () => {
      const items = await getCompletionItems();
      return items;
    }
  }), import_coc4.workspace.registerKeymap(["n"], "cucumber-keymap", async () => {
    import_coc4.window.showMessage(`registerKeymap`);
  }, {sync: false}), import_coc4.workspace.registerAutocmd({
    event: "InsertLeave",
    request: true,
    callback: async () => {
      const doc = await import_coc4.workspace.document;
      const doFormat = editProvider.getFormatFunc();
      const code = await doFormat(context, outputChannel, doc.textDocument, void 0);
      const edits = [import_coc4.TextEdit.replace(fullDocumentRange2(doc.textDocument), code)];
      if (edits) {
        await doc.applyEdits(edits);
      }
    }
  }));
}
async function getCompletionItems() {
  return {
    items: [
      {
        word: "TestCompletionItem 1",
        menu: "[coc-cucumber]"
      },
      {
        word: "TestCompletionItem 2",
        menu: "[coc-cucumber]"
      }
    ]
  };
}
