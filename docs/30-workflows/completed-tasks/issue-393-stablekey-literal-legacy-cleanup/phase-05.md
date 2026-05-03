[実装区分: 実装仕様書]

# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

Phase 2 の per-family-plan、Phase 3 の commit 順序、Phase 4 の DoD/test matrix を統合し、family 単位 sequential 置換の **コマンド粒度ランブック** を確定する。実装エージェントが本ランブックを 1 サイクルで完遂できる粒度に分解する。

## 前提

- branch: `feat/issue-393-stablekey-literal-legacy-cleanup`
- commit 順序: G → A → B → D → C → E → F → strict-test-update
- すべてのコマンドは `mise exec --` 経由（Node 24 / pnpm 10 を保証）
- 各 family commit 後に focused test を実行し PASS を確認してから次 family へ進む

## ランブック（family 単位）

詳細は `outputs/phase-05/runbook.md` に記述する。下記は概要。

### 共通準備（branch 作成 / before evidence）

```
# branch 作成
git switch -c feat/issue-393-stablekey-literal-legacy-cleanup

# before evidence 取得（Phase 7 で再取得）
node scripts/lint-stablekey-literal.mjs --strict > /tmp/lint-strict-before.txt 2>&1 || true
```

### family A: apps/api/src/jobs/mappers + sync-sheets-to-d1

1. `apps/api/src/jobs/mappers/sheets-to-members.ts` に正本 import 1 行追加
   - 例: `import { STABLE_KEY } from "@ubm-hyogo/shared";`
2. ファイル内の literal 出現箇所を `STABLE_KEY.<key>` に置換
3. `apps/api/src/jobs/sync-sheets-to-d1.ts` も同様
4. focused test 実行
   ```
   mise exec -- pnpm exec vitest run apps/api/src/jobs/
   ```
5. PASS 確認後 commit
   ```
   git add apps/api/src/jobs/
   git commit -m "refactor(api/jobs): replace stableKey literals with canonical import (family A)"
   ```
6. strict count 中間記録: `node scripts/lint-stablekey-literal.mjs --strict | tail -5`

### family B: apps/api/src/repository

- `_shared/builder.ts` / `publicMembers.ts` の literal 置換
- focused test: `mise exec -- pnpm exec vitest run apps/api/src/repository/`
- commit: `refactor(api/repository): replace stableKey literals with canonical import (family B)`

### family D: apps/api/src/use-cases + view-models（B → D の順）

- `list-public-members.ts` / `public-member-list-view.ts` / `public-member-profile-view.ts`
- focused test: `mise exec -- pnpm exec vitest run apps/api/src/use-cases/ apps/api/src/view-models/`
- commit: `refactor(api/public): replace stableKey literals with canonical import (family D)`

### family C: apps/api/src/routes/admin

- `members.ts` / `requests.ts`
- focused test: `mise exec -- pnpm exec vitest run apps/api/src/routes/admin/`
- commit: `refactor(api/admin): replace stableKey literals with canonical import (family C)`

### family E: apps/web/app/profile/_components

- `RequestActionPanel.tsx` / `StatusSummary.tsx`
- focused test: `mise exec -- pnpm exec vitest run apps/web/app/profile/`
- commit: `refactor(web/profile): replace stableKey literals with canonical import (family E)`

### family F: apps/web/src/components/public

- `MemberCard.tsx` / `ProfileHero.tsx`
- focused test: `mise exec -- pnpm exec vitest run apps/web/src/components/public/`
- commit: `refactor(web/public): replace stableKey literals with canonical import (family F)`

### family G: packages/shared/src/utils/consent.ts

- consent literal を canonical const に置換しつつ output 文字列値同一を維持
- focused test: `mise exec -- pnpm exec vitest run packages/shared/src/utils/`
- commit: `refactor(shared/utils): replace stableKey literals in consent (family G)`

### 最終 commit: strict 期待値更新 + 統合検証

1. `scripts/lint-stablekey-literal.test.ts` の strict 期待値を 0 に更新
2. 統合検証
   ```
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   mise exec -- pnpm exec vitest run scripts/lint-stablekey-literal.test.ts
   node scripts/lint-stablekey-literal.mjs --strict
   ```
3. すべて PASS / exit 0 を確認
4. commit
   ```
   git add scripts/lint-stablekey-literal.test.ts
   git commit -m "test(lint-stablekey): bump strict expectation to 0 violations"
   ```

## suppression 0 件確認

ランブック最終ステップ:

```
git diff main...HEAD | grep -E "eslint-disable|@ts-ignore|as any" || echo "OK: no suppression added"
```

出力が「OK: no suppression added」であること（AC-6）。

## DoD（Phase 4 から引き継ぎ・必須）

| # | DoD 項目 | 検証コマンド |
| --- | --- | --- |
| 1 | strict violation 0 | `node scripts/lint-stablekey-literal.mjs --strict` exit 0 |
| 2 | stableKeyCount=31 | 同上出力に含まれること |
| 3 | strict 期待値テスト PASS | `mise exec -- pnpm exec vitest run scripts/lint-stablekey-literal.test.ts` |
| 4 | typecheck PASS | `mise exec -- pnpm typecheck` |
| 5 | lint PASS | `mise exec -- pnpm lint` |
| 6 | family 別 focused test PASS | family ごとの vitest 実行履歴 |
| 7 | suppression 0 件 | 上記 grep 確認 |

## 実行タスク

- [ ] runbook.md に family A〜G + 最終 commit のコマンド粒度手順を記述
- [ ] commit message テンプレートを family ごとに確定
- [ ] suppression 0 件確認 grep を末尾に明記
- [ ] DoD 7 項目をランブック末尾に転記
- [ ] Phase 6 への引き継ぎ（fixture 用 violation 1 行追加 / revert 手順）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/per-family-plan.md | per-file マッピング |
| 必須 | outputs/phase-03/main.md | commit 順序 |
| 必須 | outputs/phase-04/test-matrix.md | focused test path |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | ランブックサマリー |
| ドキュメント | outputs/phase-05/runbook.md | family 単位コマンド粒度手順 |
| メタ | artifacts.json | phase 5 status |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 違反 fixture 1 行追加 fail 確認 / revert |
| Phase 7 | 統合検証 evidence の 5 ファイル収集 |

## 多角的チェック観点

- commit 順序が依存方向（shared → repository → use-case/view-model → routes → web）に整合しているか（G → B → D → C は OK）
- 各 family commit が単独で typecheck PASS する（中間状態で型不整合が出ない）
- consent.ts (family G) は最後に置く（共有 utils なので呼び出し側全置換後が安全）

## 完了条件

- [ ] runbook.md にコマンド粒度手順記述
- [ ] suppression 確認 grep 明記
- [ ] DoD 転記
- [ ] Phase 6 引き継ぎ整理

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（focused test fail / typecheck 中間 fail / suppression 混入）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 5 を completed

## 次 Phase

- 次: Phase 6 (異常系検証)
- 引き継ぎ: ランブック完遂後の workflow_state = `cleaned` / strict 検査 exit 0
- ブロック条件: ランブックのコマンド粒度未確定なら Phase 6 不可
