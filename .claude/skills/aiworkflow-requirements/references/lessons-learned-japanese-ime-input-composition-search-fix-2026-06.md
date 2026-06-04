# Lessons Learned — Japanese IME Input Composition Search Fix（2026-06）

## L-IME-001: URL 正本検索は IME composition 中の commit を止める

- **背景**: Public members search updates `?q=` through `router.replace`. During Japanese IME composition, every `onChange` commit can cause a parent refresh and controlled `value` reset.
- **教訓**: URL remains the source of truth after commit, but the input must own a local draft while composing. Commit only after `compositionend` plus debounce.
- **適用先**: `Search`-like inputs that feed Server Component route params or other parent re-rendering state.

## L-IME-002: Clear ownership is one field, one control

- **背景**: The keyword appeared both in the search input and in `SelectedFiltersBar`, giving two clear controls for the same `q` value.
- **教訓**: If the text field visibly owns the current value, its local clear button is the canonical clear path. Summary chips should represent other filters unless they are the only visible state.
- **適用先**: Search/filter summary bars with text inputs and active chips.

## L-IME-003: IME regression tests need fake timers and composition events

- **背景**: jsdom cannot reproduce full browser IME behavior, but it can prove that local code does not commit while composing.
- **教訓**: Use `vi.useFakeTimers()`, `fireEvent.compositionStart`, intermediate `change`, `compositionEnd`, final `change`, and then advance the debounce interval.
- **適用先**: Controlled input hooks and components that debounce or defer commit.
