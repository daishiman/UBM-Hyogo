# Phase 8: リファクタリング / 動的検証

> workflow: `e2e-quality-uplift-stage-1` / 起案日: 2026-05-09

## 1. リファクタ Before / After

| 観点 | Before（Stage 0 直後） | After（Stage 1 後） | 採否 |
|------|---------------------|-------------------|------|
| public route email assertion | なし | sentinel + `/@/` probe | 追加 |
| pending state 検証粒度 | submit 直後のみ | round-trip 後も persist | 追加 |
| `mockMeWithPending` helper | 不在 | spec 内 inline | 採用（local） |
| 共通 helper の global util 化 | — | spec 内に留置 | 不採用（CONST_007） |
| `LEAK_PROBE_EMAIL` の fixture seed 化 | spec 内定数 | spec 内定数のまま | 不採用（Stage 2 へ） |

## 2. 共通 helper 抽出可否判定

| 候補 | 抽出先案 | 採否 | 理由 |
|------|---------|------|------|
| `mockMeWithPending` | `apps/web/playwright/helpers/mock-me.ts` | 不採用 | 利用 spec が 2 本のみ・本 stage 単一サイクル原則に反する |
| `LEAK_PROBE_EMAIL` | `apps/web/playwright/fixtures/sentinels.ts` | 不採用 | 同上、Stage 2 で seed 拡張と同時に検討 |
| `goto round-trip` 補助関数 | — | 不採用 | 1 行で `goto('/')→goto('/profile')` で十分 |

## 3. 動的検証チェックリスト

| 項目 | 手段 | 期待 |
|------|------|------|
| 1a sentinel pass / fail 切替 | prod に sentinel を一時注入 → fail → revert | fail 確認できれば guard 有効 |
| 1a `/@/` probe false positive | landing/footer の email 表記の有無を目視 | 不在なら probe 維持、在れば sentinel-only に縮退 |
| 1b sticky pass / fail 切替 | mock を空 `pendingRequests` に差替え → fail → revert | fail 確認できれば guard 有効 |
| mock route hit 確認 | `page.on('request')` で `/api/me` が hit するか観測 | hit していること |
| round-trip 中の hydration race | `await expect(...).toBeVisible({ timeout: 5000 })` | 5s 以内に visible |

## 4. 観測リスク（Phase 3 R-* の追跡）

| ID | リスク | 観測結果記入欄 | 対応 |
|----|--------|--------------|------|
| R-1 | sentinel vacuous | （Phase 8 実行時に記録） | Stage 2 へ |
| R-2 | `/@/` probe false positive | （観測） | 在れば probe 削除 |
| R-3 | `/api/me` shape 乖離 | Phase 4 で確認済 / Phase 8 で再確認 | shape diff 発生時 mock 更新 |
| R-4 | `signSession` TODO_PLACEHOLDER で memberPage が未認証扱い | （観測） | Stage 2 にエスカレート判断 |

## 5. CI 時間影響

| 項目 | 値 |
|------|----|
| 1a 追加 test 想定実行時間 | < 1.5s（3 route goto + locator 6 件） |
| 1b A 追加 test 想定実行時間 | < 2.0s（submit + 2 navigate） |
| 1b B 追加 test 想定実行時間 | < 2.0s |
| 合計 CI 増加 | < 6s（既存 smoke 1 セッションに対し許容範囲） |

## 6. 静的検証

| ツール | 期待 |
|-------|------|
| `pnpm typecheck` | green |
| `pnpm lint` | green |
| `pnpm --filter @ubm/web exec playwright test` | 1a / 1b 含めて green |

## 7. Phase 9 入口条件

- [ ] §3 動的検証 5 項目すべて記録済
- [ ] R-2 の判断（probe 維持 / 縮退）が確定
- [ ] R-4 観測結果が Stage 2 への転送可否で確定

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-1
- phase: 8
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 1 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

