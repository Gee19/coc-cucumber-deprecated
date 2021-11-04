import {
  DocumentFormattingEditProvider,
  ExtensionContext,
  OutputChannel,
  Range,
  TextDocument,
  TextEdit,
  workspace,
} from 'coc.nvim';

import { formatTables } from './formatter/feature';

export type FormatFuncType = (
  context: ExtensionContext,
  outputChannel: OutputChannel,
  document: TextDocument,
  range?: Range
) => Promise<string>;

export function fullDocumentRange(document: TextDocument): Range {
  const lastLineId = document.lineCount - 1;
  const doc = workspace.getDocument(document.uri);

  return Range.create({ character: 0, line: 0 }, { character: doc.getline(lastLineId).length, line: lastLineId });
}

class CucumberFormattingEditProvider implements DocumentFormattingEditProvider {
  public _context: ExtensionContext;
  public _outputChannel: OutputChannel;

  constructor(context: ExtensionContext, outputChannel: OutputChannel) {
    this._context = context;
    this._outputChannel = outputChannel;
  }

  public provideDocumentFormattingEdits(document: TextDocument): Promise<TextEdit[]> {
    return this._provideEdits(document, undefined);
  }

  public provideDocumentRangeFormattingEdits(document: TextDocument, range: Range): Promise<TextEdit[]> {
    return this._provideEdits(document, range);
  }

  public getFormatFunc(): FormatFuncType {
    // JSON? Indent?
    // Stick to tables for now
    return formatTables;
  }

  private async _provideEdits(document: TextDocument, range?: Range): Promise<TextEdit[]> {
    const doFormat = this.getFormatFunc();
    const code = await doFormat(this._context, this._outputChannel, document, range);
    if (!range) {
      range = fullDocumentRange(document);
    }
    return [TextEdit.replace(range, code)];
  }
}

export default CucumberFormattingEditProvider;
