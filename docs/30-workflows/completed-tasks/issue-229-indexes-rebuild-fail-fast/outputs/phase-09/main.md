# Phase 9 成果物 — 品質保証

> 本ワークフローはタスク仕様書整備と実コード hardening。実コマンドの実走は今回の実装サイクルで行う。本成果物は品質ゲートの判定方針を確定する。

## 1. 品質ゲート判定方針（7 ゲート）

| ゲート | コマンド | PASS 判定 |
| --- | --- | --- |
| QG-1 lint | `mise exec -- pnpm lint` | 違反 0（`no-restricted-globals` 等に抵触しない） |
| QG-2 typecheck | `mise exec -- pnpm typecheck` | エラー 0 |
| QG-3 回帰 spec test | `mise exec -- pnpm vitest run scripts/__tests__/generate-index-fail-fast.spec.ts` | TC-01〜TC-07 全 PASS |
| QG-4 byte-identical | `pnpm indexes:rebuild` 後 `git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes` | exit 0（drift 0） |
| QG-5 line budget | `git diff --stat` | helper + ログ + ガード + export で数十行規模。1 ファイル差分 + spec 1 本に収まる |
| QG-6 mirror parity | `.claude/skills/` index と `.agents` ミラー整合 | spec 上の言及のみ。実 diff は実装サイクル（symlink なら自明） |
| QG-7 変更ファイル範囲 | `git status --porcelain` | `generate-index.js` + 新規 spec test の 2 件のみ |

## 2. fail-fast / atomic 品質確認観点

| 観点 | 確認方法 | AC |
| --- | --- | --- |
| 途中 throw で非ゼロ exit | 失敗注入 → `exit=$?` が 1 | AC-1 |
| atomic | 2 件目 throw 注入 → 本ファイル不変 / tmp 残存 0 | AC-2 |
| decisive log | stderr に `[generate-index] <skill> / <index-file> (<step>) 失敗:` | AC-3 |
| ENOENT 継続 / その他 throw | ENOENT / EACCES 注入で分岐確認 | AC-5 |
| import 副作用なし | module import で main() の書き込みが走らない | AC-7 |

## 3. mirror parity の注記

`.claude/skills/` 配下 index の mirror parity は、本仕様書では「実装サイクルで `git diff` 0 を確認する」旨を言及するに留める。mirror が symlink で実体共有されている場合 parity は構造的に保証されるため、実 diff 採取は QG-4（byte-identical）に統合してよい。

## 4. 残リスクと緩和

| リスク | 緩和 |
| --- | --- |
| byte-identical を破る無意識の整形変更 | QG-4 で `git diff --quiet` を gate 化。出力文字列は不変（Phase 8 残す重複） |
| 変更が scope を逸脱（他ファイル変更） | QG-7 で `git status --porcelain` を 2 件に限定 |

## 5. 完了状態

- 7 品質ゲートの判定方針を確定。fail-fast / atomic 確認観点を AC-1〜AC-3 / AC-5 / AC-7 にトレース。
- mirror parity は spec 言及に留め、実 diff は実装サイクルへ委譲。
