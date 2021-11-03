# coc-cucumber

WIP Port of [VSCucumberAutoComplete](https://github.com/alexkrechik/VSCucumberAutoComplete) for coc.nvim

## Progress/Plan

- [ ] Document format support, including table formatting
- [ ] Auto-parse feature steps from paths, provided in CocLocalConfig otherwise
- [ ] Autocompletion of steps
- [ ] Go-to definition

TBD:
- [ ] Syntax highlighting
- [ ] Snippets
- [ ] Step validation

## Install

Manual until in a semi-working state:

`git clone && yarn`

`set runtimepath^=/home/dev/coc-cucumber`

## Keymaps

`nmap <silent> <C-l> <Plug>(coc-coc-cucumber-keymap)`

## Lists

`:CocList demo_list`

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension) <3
