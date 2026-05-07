[実装区分: 実装仕様書]

# Phase 8: パフォーマンス・運用

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| Phase 名称 | パフォーマンス・運用 |
| 作成日 | 2026-05-03 |
| 前 Phase | 7 (統合検証) |
| 次 Phase | 9 (セキュリティ・品質ゲート) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Issue | #393 (CLOSED) |

## 目的

`scripts/lint-stablekey-literal.mjs --strict` の **走行時間影響** を実測比較し、
14 ファイル・148 件 → 0 件への置換実装が CI gate / 開発者 DX に与える影響を定量化する。
さらに、新規 stableKey 追加時の運用フロー（正本 supply module への append 手順）を整備し、
Phase 9 以降のゲート設計および後続 strict CI gate 昇格 wave に渡す。

本タスクのスコープは **既存 literal の置換実装** であり、lint 基盤自体は親 03a workflow（`completed-tasks/03a-stablekey-literal-lint-enforcement/`）で導入済みである点に留意する。

## パフォーマンス目標

| 指標 | 目標値 | 計測方法 |
| --- | --- | --- |
| `lint-stablekey-literal.mjs --strict` 単体実行時間 | **15 秒以内**（置換前後で +10% 以内の差分） | `time mise exec -- node scripts/lint-stablekey-literal.mjs --strict` を 3 回計測し中央値を採用 |
| `mise exec -- pnpm lint`（monorepo 全件） | **120 秒以内**（baseline +5% 以内） | `time mise exec -- pnpm lint` を 3 回計測し中央値を採用 |
| `mise exec -- pnpm typecheck` | **60 秒以内**（baseline 同等） | `time mise exec -- pnpm typecheck` を 3 回計測し中央値を採用 |
| `mise exec -- pnpm vitest run --changed`（focused） | **30 秒以内** | family 別 commit ごとに測定 |
| CI gate 全体 duration | **baseline +5% 以内** | `gh run list --workflow ci.yml` の duration 推移を本タスク導入前後で比較 |

> 置換は import 文 + 参照式の追加のみであり、build / typecheck / lint の AST 走査コストはほぼ不変。実測で逸脱が出たら Phase 11 evidence で原因（barrel export の循環依存、tree-shaking 失敗）を切り分ける。

## 開発者 DX 影響評価

| 観点 | 影響 | 対応方針 |
| --- | --- | --- |
| import 文増加 | 14 ファイル平均 1〜3 行追加（`import { STABLE_KEY } from '@ubm-hyogo/shared'` 等） | 既存 import セクションに統合し、ESLint `import/order` 規約に従う |
| IDE 補完 | named import 経由で TypeScript 補完が効くため、リテラル直書きより**改善**される | 影響なし（むしろ正の効果） |
| tree-shaking | `packages/shared/src/zod/field.ts` は既に named export 構成のため影響なし | bundle size の差分を Phase 11 で実測（任意 evidence） |
| 学習コスト | 新規開発者は「正本 supply module 経由でのみ参照する」という規約を `aiworkflow-requirements` から学習する | Phase 12 implementation-guide.md Part 1 で中学生レベル説明 |
| デバッグ | リテラル grep が「正本ファイル + テスト + fixture + migration」のみに収束する | grep 範囲が予測可能になり**改善** |

## 運用: 新規 stableKey 追加時の手順

新規 stableKey が Google Form schema に追加された場合、以下の手順で正本 supply module に append する。

```
1. Google Form schema 変更を `docs/00-getting-started-manual/google-form/` に反映
2. `packages/shared/src/zod/field.ts` の `FieldByStableKeyZ` / `STABLE_KEY_LIST` / `STABLE_KEY` に新 stableKey を追加
3. 必要に応じ `packages/integrations/google/src/forms/mapper.ts` の mapping table を更新
4. 既存 14 ファイルの該当箇所（追加 stableKey を使用するなら）も named import で参照
5. `mise exec -- node scripts/lint-stablekey-literal.mjs --strict` で 0 violation を維持
6. unit test（`packages/shared/src/zod/__tests__/field.test.ts` 等）で stableKeyCount = 32 を更新
7. PR 説明欄に「新規 stableKey 追加（formId / 項目名 / supply module 反映先）」を明記
```

> stableKeyCount は本 PR merge 時点では **31 を維持**。後続 schema 変更で増加する場合のみ `aiworkflow-requirements` の current facts を更新。

## suppression 監査ポリシー（pre-strict 段階）

本タスクは **suppression 0 件** を達成条件とするが、誤って `// eslint-disable-next-line` 等が混入しないよう、以下を Phase 9 secret hygiene と並行して監査する。

| 観点 | 検査コマンド | 合格基準 |
| --- | --- | --- |
| ESLint suppression 追加 0 | `git diff main...HEAD -- 'apps/**' 'packages/**' \| grep -c 'eslint-disable'` | **0 hit** |
| stablekey-literal 専用 suppress | `git grep -c 'lint-stablekey-literal' apps packages \| grep -v ':0'` | **0 hit**（spec / docs を除く） |
| 動的 key 合成（テンプレートリテラル経由 bypass） | `git diff main...HEAD -- 'apps/**' 'packages/**' \| grep -E '\\$\\{.*field.*\\}'` | レビューで意図確認、bypass 0 |

## 監視: family 単位の commit revertability

| 監視項目 | しきい値 | 取得方法 |
| --- | --- | --- |
| family A〜G ごとに独立 commit | 7 commit を維持 | `git log --oneline main...HEAD` で family ごとに分離されていることを確認 |
| 各 commit の変更 file 数上限 | family ごと最大 4 ファイル | `git show --stat <commit>` |
| 各 commit 単体での typecheck PASS | 全 commit | Phase 11 で family 別 evidence 取得 |
| revert 影響範囲 | 1 family（最大 4 ファイル）に閉じる | rollback 計画（Phase 10）で証明 |

## 例外パス（置換対象外）

| パス | 除外理由 |
| --- | --- |
| `**/*.test.ts` / `**/*.spec.ts` | テストはリテラルでアサート可能 |
| `**/__fixtures__/**` | fixture は schema 同期前の history を保持 |
| `apps/api/migrations/**` | migration は当時の literal を保存し改変しない |
| `packages/shared/src/zod/field.ts`（正本） | ここが allow-list 起点 |
| `packages/integrations/google/src/forms/mapper.ts`（正本） | ここが allow-list 起点 |

## 実行タスク

- [ ] `outputs/phase-08/main.md` にパフォーマンス目標 5 指標、DX 影響、運用手順を集約
- [ ] 新規 stableKey 追加 7 step 手順を明記
- [ ] suppression 監査 3 項目を明記
- [ ] family commit revertability 4 項目を明記
- [ ] 例外パス 5 件を明記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-05/runbook.md` | family 別実装 step |
| 必須 | `outputs/phase-07/ac-matrix.md` | AC × evidence トレース |
| 必須 | `docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/outputs/phase-08/main.md` | 親 workflow の lint 基盤 perf 設計 |

## 完了条件

- [ ] パフォーマンス目標 5 指標明示
- [ ] DX 影響 5 観点明示
- [ ] 新規 stableKey 追加 7 step 明示
- [ ] suppression 監査 3 項目明示
- [ ] family commit revertability 4 項目明示
- [ ] 例外パス 5 件明示

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 8 を completed

## 次 Phase

- 次: Phase 9 (セキュリティ・品質ゲート)
- 引き継ぎ: パフォーマンス目標値 / suppression 監査ポリシー / family commit 粒度

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-08/main.md` | performance / operations サマリ |

## 統合テスト連携

Phase 11 は本 Phase の performance target と suppression 0 baseline を `manual-smoke-log.md` の確認項目に含める。
