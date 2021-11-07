import {
  ExtensionContext,
  FormattingOptions,
  OutputChannel,
  Range,
  TextDocument,
  Uri,
  window,
  workspace,
} from 'coc.nvim';

export function escapeRegExp(str: string): string {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '$&');
}

type FormatConfVal = number | 'relative';

interface FormatConf {
  [key: string]: FormatConfVal;
}

interface ResolvedFormat {
  symbol: string;
  value: FormatConfVal;
}

const FORMAT_CONF: FormatConf = {
  Ability: 0,
  'Business Need': 0,
  'Feature:': 0,
  'Rule:': 1,
  'Scenario:': 1,
  'Example:': 1,
  'Background:': 1,
  'Scenario Outline:': 1,
  'Examples:': 2,
  Given: 2,
  When: 2,
  Then: 2,
  And: 2,
  But: 2,
  '\\*': 2,
  '\\|': 3,
  '"""': 3,
  '#': 'relative',
  '@': 'relative',
};

const cjkRegex = /[\u3000-\u9fff\uac00-\ud7af\uff01-\uff60]/g;

// Consider a CJK character is 2 spaces
function stringBytesLen(str: string) {
  return str.length + (str.match(cjkRegex) || []).length;
}

interface Block {
  line: number;
  block: number;
  data: string[];
}

export function debuggin(
  context: ExtensionContext,
  outputChannel: OutputChannel,
  document: TextDocument,
  range?: Range
): string {
  // check the regular spots
  // *.feature, *.js, *.ts to start
  // cypress/integration/
  // steps/
  const extensionConfig = workspace.getConfiguration('cucumber');
  const fileName = Uri.parse(document.uri).fsPath;
  const text = document.getText(range);

  const cukePath = extensionConfig.get('cucumber.autocomplete.steps', '');
  if (!cukePath) {
    window.showErrorMessage('Unable to find any step definitions or feature files.');
    return text;
  }

  const settingsFormatConf = extensionConfig.get('cucumber.autocomplete.formatConfOverride', {});
  const skipDocStringsFormat = extensionConfig.get('cucumber.autocomplete.skipDocStringsFormat');
  // const anotherSetting = extensionConfig.get('cucumber.anotherSetting', 4);
  const cwd = Uri.file(workspace.root).fsPath;
  const opts = { cwd, cukePath };
  outputChannel.appendLine(`${'#'.repeat(10)} cucumber\n`);
  outputChannel.appendLine(`settingsFormatConf: ${settingsFormatConf}`);
  outputChannel.appendLine(`skipDocStringsFormat: ${skipDocStringsFormat}`);
  outputChannel.appendLine(`Cwd: ${opts.cwd}`);
  outputChannel.appendLine(`File: ${fileName}`);
  outputChannel.appendLine(`Cukes: ${cukePath}`);
  return cukePath;
}

function findIndentation(line: string): FormatConfVal | null {
  const format = findFormat(line);
  return format ? format.value : null;
}

function findFormat(line: string): ResolvedFormat | null {
  const extensionConfig = workspace.getConfiguration('cucumber');
  const settingsFormatConf = extensionConfig.get('cucumber.autocomplete.formatConfOverride', {});
  const fnFormatFinder = (conf: FormatConf): ResolvedFormat | null => {
    const symbol = Object.keys(conf).find((key) => !!~line.search(new RegExp(escapeRegExp('^\\s*' + key))));
    return symbol ? { symbol, value: conf[symbol] } : null;
  };
  const settingsFormat = fnFormatFinder(settingsFormatConf);
  const presetFormat = fnFormatFinder(FORMAT_CONF);
  return settingsFormat === null ? presetFormat : settingsFormat;
}

export function correctIndents(text, indent) {
  const extensionConfig = workspace.getConfiguration('cucumber');
  const skipDocStringsFormat = extensionConfig.get('cucumber.autocomplete.skipDocStringsFormat');
  let commentsMode = false;
  const defaultIndentation = 0;
  let insideRule = false;
  const ruleValue = findFormat('Rule:').value;
  const ruleIndentation = typeof ruleValue === 'number' ? ruleValue : 0;
  return text
    .split(/\r?\n/g)
    .map((line, i, textArr) => {
      //Lines, that placed between comments, should not be formatted
      if (skipDocStringsFormat) {
        if (~line.search(/^\s*'''\s*/) || ~line.search(/^\s*"""\s*/)) {
          commentsMode = !commentsMode;
        } else {
          if (commentsMode === true) return line;
        }
      }
      //Now we should find current line format
      const format = findFormat(line);
      if (format && format.symbol === 'Rule:') {
        insideRule = true;
      }
      let indentCount;
      if (~line.search(/^\s*$/)) {
        indentCount = 0;
      } else if (format && typeof format.value === 'number') {
        indentCount = format.value + (insideRule && format.symbol !== 'Rule:' ? ruleIndentation : 0);
      } else {
        // Actually we could use 'relative' type of formatting for both - relative and unknown strings
        // In future this behaviour could be reviewed
        const nextLine = textArr.slice(i + 1).find((l) => typeof findIndentation(l) === 'number');
        if (nextLine) {
          const nextLineIndentation = findIndentation(nextLine);
          indentCount = nextLineIndentation === null ? defaultIndentation : nextLineIndentation;
        } else {
          indentCount = defaultIndentation;
        }

        indentCount += insideRule ? ruleIndentation : 0;
      }
      return line.replace(/^\s*/, indent.repeat(indentCount));
    })
    .join('\r\n');
}

function getIndent(options: FormattingOptions): string {
  const { insertSpaces, tabSize } = options;
  return insertSpaces ? ' '.repeat(tabSize || 0) : '\t';
}

export async function format(
  context: ExtensionContext,
  outputChannel: OutputChannel,
  document: TextDocument,
  range?: Range
): Promise<string> {
  const formatOptions = await workspace.getFormatOptions(document.uri);
  const text = correctIndents(document.getText(range), getIndent(formatOptions));

  let blockNum = 0;
  const textArr = text.split(/\r?\n/g);

  //Get blocks with data in cucumber tables
  const blocks: Block[] = textArr.reduce((res, l, i, arr) => {
    if (~l.search(/^\s*\|/)) {
      res.push({
        line: i,
        block: blockNum,
        data: l.split(/\s*\|\s*/).reduceRight((accumulator, current, index, arr) => {
          if (index > 0 && index < arr.length - 1) {
            if (current.endsWith('\\')) {
              accumulator[0] = current + '|' + accumulator[0];
            } else {
              accumulator.unshift(current);
            }
          }
          return accumulator;
        }, []),
      });
    } else {
      if (!~l.search(/^\s*#/)) {
        blockNum++;
      }
    }
    return res;
  }, []);

  //Get max value for each table cell
  const maxes = blocks.reduce((res, b) => {
    const block = b.block;
    if (res[block]) {
      res[block] = res[block].map((v, i) => Math.max(v, stringBytesLen(b.data[i])));
    } else {
      res[block] = b.data.map((v) => stringBytesLen(v));
    }
    return res;
  }, []);

  //Change all the 'block' lines in our document using correct distance between words
  blocks.forEach((block) => {
    let change = block.data.map((d, i) => ` ${d}${' '.repeat(maxes[block.block][i] - stringBytesLen(d))} `).join('|');
    change = `|${change}|`;
    textArr[block.line] = textArr[block.line].replace(/\|.*/, change);
  });

  return new Promise((resolve) => {
    resolve(textArr.join('\r\n'));
  });
}
