import { ExtensionContext, OutputChannel, Range, TextDocument, Uri, window, workspace } from 'coc.nvim';

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

export function scanForStepFeatures(context: ExtensionContext, cukePath: string): string {
  if (!cukePath) {
    // check the regular spots
    // *.feature, *.js, *.ts to start
    // cypress/integration/
    // steps/
    return 'gg';
  }

  return cukePath;
}

export async function formatTables(
  context: ExtensionContext,
  outputChannel: OutputChannel,
  document: TextDocument,
  range?: Range
): Promise<string> {
  const extensionConfig = workspace.getConfiguration('cucumber');
  const fileName = Uri.parse(document.uri).fsPath;
  const text = document.getText(range);

  let blockNum = 0;
  let textArr = text.split(/\r?\n/g);

  let cukePath = extensionConfig.get('cucumber.autocomplete.steps', '');
  cukePath = scanForStepFeatures(context, cukePath);
  if (!cukePath) {
    window.showErrorMessage('Unable to find any step definitions or feature files.');
    return text;
  }

  // const anotherSetting = extensionConfig.get('cucumber.anotherSetting', 4);
  const cwd = Uri.file(workspace.root).fsPath;
  const opts = { cwd, cukePath };
  outputChannel.appendLine(`${'#'.repeat(10)} cucumber\n`);
  outputChannel.appendLine(`Cwd: ${opts.cwd}`);
  outputChannel.appendLine(`File: ${fileName}`);
  outputChannel.appendLine(`Cukes: ${cukePath}`);

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
