# Phase 3 outputs — 設計レビュー main

本ファイルは `phase-03.md` の成果物 mirror。Phase 2 設計に対する代替案比較と PASS-MINOR-MAJOR 判定の正本を保管する。

## 代替案比較

| 案 | 内容 | コスト | 検出能力 | リスク | 判定 |
| --- | --- | --- | --- | --- | --- |
| A: all-staging-only | local smoke は省き、staging deploy 後の smoke のみ実施 | 低 | 中（Workers runtime / D1 は検出できるが、開発中に early feedback を失う） | staging で初めて wrangler / esbuild 問題が顕在化 → rollback 増加 | NO（不採用） |
| B: local-required | local 実 binding smoke のみで OK、staging は省略 | 低 | 中（local で D1 / wrangler は検出できるが、`PUBLIC_API_BASE_URL` env drift / Cloudflare 環境固有問題は検出不能） | staging fallback / vars drift が production まで残存 | NO（不採用） |
| C: local + staging 両方（採用） | 両環境で同じ 4 route family / 5 smoke cases を smoke、evidence を 2 セット保存 | 中 | 高（local で esbuild / D1 binding を、staging で env drift / Workers 固有挙動を分担検出） | 工数 +1h 程度、両 env で 2 度走らせる必要 | YES（採用） |

## 採用案 C の根拠

1. **検出領域が重複しない** — local は Workers runtime + D1 binding、staging は env vars + Cloudflare DNS / cache。両方で初めて 4 route family / 5 smoke cases × 2 環境 = 10 cases の green が担保できる。
2. **CLAUDE.md ルール整合** — `scripts/cf.sh` ラッパー経路を local で確立しておけば、deploy / staging smoke にも同じ手順が再利用できる。
3. **evidence の再利用性** — `outputs/phase-11/evidence/` に local + staging を並べることで、後続 09a deploy gate へ参考データとして引用しやすい。

## PASS-MINOR-MAJOR 判定

| 観点 | 判定 | コメント |
| --- | --- | --- |
| 設計の整合性 | PASS | AC-1〜7 と 1:1 で trace |
| 不変条件遵守 | PASS | 経路自体が #5 を実行 |
| 工数妥当性 | MINOR | local + staging 二重実行による若干増。検出能力で正当化 |
| 再現性 | PASS | `scripts/cf.sh` 経路で host 依存を排除 |
| security hygiene | PASS | secret は op 参照、log には出さない設計 |

総合: **PASS（MINOR は許容範囲）**。Phase 4 へ進行可。

## Phase 4 への引き継ぎ

- curl matrix を `outputs/phase-04/curl-matrix.md` に正式化（route × env × method × expected status）
- evidence 命名規則を確定: `local-curl.log`, `staging-curl.log`, `staging-screenshot.png`
- coverage / a11y / VR は対象外と Phase 4 冒頭で明示
