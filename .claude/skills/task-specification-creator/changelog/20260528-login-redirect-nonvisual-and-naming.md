# 2026-05-28 login redirect NON_VISUAL and naming feedback

`login-redirect-when-authenticated` の Phase 12 skill feedback を同サイクルで反映。

- server-side redirect wiring / pure function helper のみで UI layout / rendered state / CSS / browser-visible copy を変更しない implementation は `visualEvidence: NON_VISUAL` と判定する。
- Phase 11 は screenshot ではなく focused unit/component test、typecheck、lint を一次証跡にする。
- Phase 1 で実装候補ファイルの同階層を `ls` / `rg --files` で実測し、既存命名規則の多数派を記録する。
- 元タスクが camelCase path を指定していても、同階層が kebab-case path + camelCase export の規約なら Phase 2 で path を補正し、export 名だけ camelCase を維持する。
