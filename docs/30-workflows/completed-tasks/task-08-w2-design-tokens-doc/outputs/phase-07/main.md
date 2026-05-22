# Phase 07: AC マトリクス

state: COMPLETED

| AC | 条件 | 検証結果 | 検証コマンド/根拠 |
| --- | --- | --- | --- |
| AC-1 | 380 行以上 | PASS (488) | `wc -l` |
| AC-2 | 12 章 | PASS (12) | `grep -c '^## '` |
| AC-3 | 3 テーマ全 token 値転記 | PASS | §3.4.1/§3.4.2/§3.4.3 存在 |
| AC-4 | `--ubm-*` 60+ | PASS (141) | `grep -cE '\`--ubm-[a-z0-9-]+\`'` |
| AC-5 | inline JSON valid | PASS | `jq .` 0 exit |
| AC-6 | sRGB fallback `@supports not (color: oklch(...))` | PASS | grep |
| AC-7 | `@theme inline` テンプレート | PASS | grep |
| AC-8 | dark mode placeholder | PASS | grep `data-theme="dark"` |
| AC-9 | zone alias of status | PASS | §3.3 / §4.4 |
| AC-10 | OKLch cross-check 0 欠落 | PASS | Phase 9 cross-check |
| AC-11 | markdown lint error 0 | WARNING_NO_SCRIPT | `pnpm lint:md` 未定義 |
| AC-12 | diff scope 規律 | PASS | Phase 11 scope-diff.log |
