import {
  commands,
  CompleteResult,
  Disposable,
  DocumentSelector,
  ExtensionContext,
  languages,
  listManager,
  sources,
  TextEdit,
  TextDocument,
  Range,
  Position,
  window,
  workspace,
  CancellationToken,
  CompletionContext,
  CompletionItem,
} from 'coc.nvim';
import CucumberFormattingEditProvider from './format';
import StepsHandler from './step.handler';
import DemoList from './lists';

interface Selectors {
  rangeLanguageSelector: DocumentSelector;
  languageSelector: DocumentSelector;
}

let formatterHandler: undefined | Disposable;
let rangeFormatterHandler: undefined | Disposable;

let stepsHandler: StepsHandler;

function disposeHandlers(): void {
  if (formatterHandler) {
    formatterHandler.dispose();
  }
  if (rangeFormatterHandler) {
    rangeFormatterHandler.dispose();
  }
  formatterHandler = undefined;
  rangeFormatterHandler = undefined;
}

function selectors(): Selectors {
  const languageSelector = [{ language: 'cucumber', scheme: 'file' }];
  const rangeLanguageSelector = [{ language: 'cucumber', scheme: 'file' }];

  return {
    languageSelector,
    rangeLanguageSelector,
  };
}

export function fullDocumentRange(document: TextDocument): Range {
  const lastLineId = document.lineCount - 1;
  const doc = workspace.getDocument(document.uri);

  return Range.create({ character: 0, line: 0 }, { character: doc.getline(lastLineId).length, line: lastLineId });
}

export async function activate(context: ExtensionContext): Promise<void> {
  window.showMessage(`coc-cucumber works!`);
  const extensionConfig = workspace.getConfiguration('cucumber');
  const outputChannel = window.createOutputChannel('cucumber');
  outputChannel.appendLine(`${'#'.repeat(10)} cucumber\n`);

  // Formatter
  const cukePath = extensionConfig.get('cucumber.autocomplete.steps', []);
  if (!cukePath) {
    window.showErrorMessage('Unable to find any step definitions or feature files.');
  }

  const editProvider = new CucumberFormattingEditProvider(context, outputChannel);
  const priority = 1;

  function registerFormatter(): void {
    disposeHandlers();
    const { languageSelector, rangeLanguageSelector } = selectors();

    rangeFormatterHandler = languages.registerDocumentRangeFormatProvider(
      rangeLanguageSelector,
      editProvider,
      priority
    );
    formatterHandler = languages.registerDocumentFormatProvider(languageSelector, editProvider, priority);
  }
  registerFormatter();

  // languages.registerDefinitionProvider(selector, provider);
  // languages.registerCompletionItemProvider(stepsHandler);

  // Commands/Keymaps/Autocomplete
  context.subscriptions.push(
    commands.registerCommand('cucumber.Format', async () => {
      const doc = await workspace.document;
      const doFormat = editProvider.getFormatFunc();
      const code = await doFormat(context, outputChannel, doc.textDocument, undefined);
      const edits = [TextEdit.replace(fullDocumentRange(doc.textDocument), code)];
      if (edits) {
        await doc.applyEdits(edits);
      }
    }),

    // listManager.registerList(new DemoList(workspace.nvim)),

    sources.createSource({
      name: 'coc-cucumber completion source', // unique id
      doComplete: async () => {
        const doc = await workspace.document;
        const state = await workspace.getCurrentState();
        const items = await getCompletionItems(doc.textDocument, state.position);
        return items;
      },
    }),

    // workspace.registerKeymap(
    //   ['n'],
    //   'cucumber-keymap',
    //   async () => {
    //     window.showMessage(`registerKeymap`);
    //   },
    //   { sync: false }
    // ),

    workspace.registerAutocmd({
      event: 'InsertLeave',
      request: true,
      callback: async () => {
        const doc = await workspace.document;
        const doFormat = editProvider.getFormatFunc();
        const code = await doFormat(context, outputChannel, doc.textDocument, undefined);
        const edits = [TextEdit.replace(fullDocumentRange(doc.textDocument), code)];
        if (edits) {
          await doc.applyEdits(edits);
        }
      },
    })
  );
}

function handleSteps(): boolean {
  const extensionConfig = workspace.getConfiguration('cucumber');
  const s = extensionConfig.get('cucumber.autocomplete.steps', []);
  return s && s.length ? true : false;
}

async function getCompletionItems(document: TextDocument, position: Position): Promise<CompletionItem[] | null> {
  const text = document.getText({
    start: { line: position.line, character: 0 },
    end: position,
  });
  const line = text.split(/\r?\n/g)[position.line];
  // const char = position.character;
  // if (pagesPosition(line, char) && pagesHandler) {
  //   return pagesHandler.getCompletion(line, position.position);
  // }
  if (handleSteps() && stepsHandler) {
    return stepsHandler.getCompletion(line, position.line, text);
  }
  return null;
}
