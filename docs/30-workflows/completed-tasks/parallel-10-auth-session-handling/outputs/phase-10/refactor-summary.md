# Phase 10 — Refactor Summary

| 観点 | 採用/スキップ | 根拠 |
| --- | --- | --- |
| catch 分岐を `handleAuthRequired` / `handleForbidden` / `handleGeneric` に切り出す | 採用 | hook 本体 trigger を約 15 行に縮め、test 観点と一対一対応する命名で可読性向上 |
| Toast の 2 領域分割を子コンポーネント (`<ToastList variant>`) に抽出 | スキップ | filter 2 つの map のみ・行数増の利得が低く、本サイクルのスコープ拡大を避ける |
| `defaultRedirector` / `defaultCurrentPath` を module スコープ化 | 採用 | hook 再レンダリングで関数 identity が変化せず、useCallback の deps 不要 |
| `callFetchAuthed` を hook 外の純関数に切り出し | 採用 | useCallback の依存配列を簡潔にし、test mock の interception を確実にする |
