# Phase 9: QA — root error.tsx h1 自動 focus

**[実装区分: 実装仕様書]**

## 1. 自動 QA 実行

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run error.component
```

期待: 全 4 コマンドが exit 0。

## 2. 自動 QA チェックリスト

| 項目 | コマンド | 期待 |
|---|---|---|
| 型整合 | `pnpm typecheck` | 0 error |
| lint | `pnpm lint` | 0 error / 0 warning |
| boundaries | lint 内 | 違反なし |
| dependency-cruiser | lint 内 | 違反なし |
| stablekey-literal | lint 内 | 違反なし |
| 単体 | `pnpm -F "@ubm-hyogo/web" test -- --run error.component` | `error.component.spec.tsx` 13 / 13 PASS |
| 全 web 単体（regression） | `pnpm -F "@ubm-hyogo/web" test` | baseline 維持 |

## 3. 既存 CI gate との整合

CLAUDE.md 記載の required status checks への影響:

| Gate | 影響 |
|---|---|
| `verify-design-tokens / verify-design-tokens` | 影響なし（className 変更なし） |
| `playwright-smoke / smoke (chromium)` | 影響なし（error boundary は smoke 対象外） |
| `playwright-smoke / visual (chromium, 4 screens)` | 影響なし（NON_VISUAL） |
| `verify-indexes-up-to-date` | aiworkflow-requirements `references/` を更新したため `pnpm indexes:rebuild` を同一 wave で実行し、`topic-map.md` / `keywords.json` を同期する |
| `verify-test-suffix` | 影響なし（`*.component.spec.tsx` は許可形式） |

## 4. 手動 QA 想起

Phase 11 で実施する manual smoke の概要を事前確認:

- screen reader（VoiceOver / NVDA）で見出し読み上げ
- mobile Safari でビューポート跳躍なし
- 再試行ボタンで `reset()` 呼び出し維持
- digest 表示維持

## 5. 失敗時の re-Phase 判定

| 失敗内容 | 戻り先 |
|---|---|
| typecheck error | Phase 5 |
| lint error | Phase 5 / Phase 8 |
| TC-U-09a/b/c fail | Phase 6 + Phase 5 |
| TC-U-01〜TC-U-08 regression | Phase 5（実装で他要素を壊した） |
| coverage 低下 | Phase 7 |

## 6. 完了条件

§1 の 4 コマンドが PASS、§3 の CI gate に regression なし → Phase 10 へ。
