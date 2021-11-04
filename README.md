# coc-cucumber

WIP Port of [VSCucumberAutoComplete](https://github.com/alexkrechik/VSCucumberAutoComplete) for coc.nvim

Testing with [cypress-cucumber-example](https://github.com/Gee19/cypress-cucumber-example)

## Progress/Plan

- [ ] Configuration
- [ ] Document format support
  - [x] Tables
    - [x] Manual format command
    - [x] Format on Save/InsertLeave
  - [ ] Indent
    - [ ] Manual format command
    - [ ] Format on Save/InsertLeave
- [ ] Auto-parse feature steps from paths, provided in CocLocalConfig otherwise
- [ ] Autocompletion of steps
- [ ] Go-to definition

TBD:
- [ ] Syntax highlighting
- [ ] Snippets
- [ ] Step validation

## Install

Manual until in a semi-working state:

`git clone && yarn build`

`set runtimepath^=/home/dev/coc-cucumber`

## Commands

`:CocCommand cucumber.Format` or `:Format` if you have the following defined in your `.vimrc`:

```
command! -nargs=0 Format :call CocAction('format')
```

## Keymaps

`nmap <silent> <C-l> <Plug>(coc-coc-cucumber-keymap)`

## Lists

`:CocList demo_list`

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension) <3
