# coc-cucumber

# DEPRECATED 

Consider using https://github.com/cucumber/language-server + whatever editor/LSP client you prefer.

WIP Port of [VSCucumberAutoComplete](https://github.com/alexkrechik/VSCucumberAutoComplete) for coc.nvim

Testing with:
- [cypress-cucumber-example](https://github.com/Gee19/cypress-cucumber-example)
- [coffee-machine-javascript](https://github.com/cucumber/coffee-machine-javascript)

## Progress/Plan

- [ ] Configuration
- [x] Document format support
  - [x] Tables
    - [x] Manual format command
    - [x] Format on Save
  - [x] Indent
    - [x] Manual format command
    - [x] Format on Save
- [x] Snippets
- [ ] Auto-parse feature steps from paths, provided in CocLocalConfig otherwise
- [ ] Autocompletion of steps
- [ ] Go-to definition

TBD:
- [ ] Syntax highlighting
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
