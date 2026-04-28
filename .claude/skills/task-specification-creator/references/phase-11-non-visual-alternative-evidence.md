# Phase 11 — NON_VISUAL タスクの代替 evidence プレイブック

> **NOTE**: 本ガイドは docs-only / 実地操作不可なタスク向け。実環境（staging / 本番 / CI gate）での実走が必須な項目は本タスクで「保証できない範囲」として明示し、Phase 12 `unassigned-task-detection.md` 経由で実装 PR や運用フェーズへ申し送ること。
>
> 起源: 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary（2026-04-27）
> Feedback: skill-feedback-report.md #5 / #6
> 関連: aiworkflow-requirements `lessons-learned-02c-data-access-boundary.md` §L-02C-002 / §L-02C-003
> 適用実例: skill-ledger-a1-gitignore（2026-04-28、git 管理境界 / infrastructure governance シナリオ）

## 適用条件

以下を **同時に満たす** タスクで本ガイドを使う。

1. UI 差分なし（API repository / library / config / boundary tooling など）
2. staging 環境が未配備、または実フロー前提のシナリオが現環境で実行不能
3. phase-11.md の S-1 〜 S-N が wrangler / dep-cruiser バイナリ / 実フォーム / 実 D1 を要求している

## 代替 evidence の 4 階層

| 階層 | 代替手段 | 何を保証するか | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- |
| L1: 型 | `pnpm typecheck` | API signature / branded ID / 型レベル制約 | runtime 振る舞い |
| L2: lint / boundary | 自前 `lint-boundaries.mjs` / dep-cruiser config（バイナリ未導入なら設定だけ）/ ESLint boundaries plugin | import グラフの禁止辺 | 実行時 import / dynamic import |
| L3: in-memory test | miniflare D1 + vitest（`__tests__/_setup.ts`）+ fixture loader | repository 契約 / SQL / 不変条件 / ロールバック挙動 | network / Workers binding / 並列性 |
| L4: 意図的 violation snippet | わざと禁止 import を 1 ファイル足し、L2 が **error を返す** ことを確認 | 「赤がちゃんと赤になる」 | （これ自体は green 保証ではない） |

## 必須テンプレ: 「代替 evidence 差分表」

phase-11/main.md に以下を必ず含める。

```markdown
## 代替 evidence 差分表

| Phase 11 シナリオ | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 | wrangler dev で D1 接続 | miniflare D1 + `__tests__/_setup.ts` | repository 契約・SQL | 09a staging smoke |
| S-2 | 実 admin user で auth flow | adminUsers fixture + `isActiveAdmin` unit test | gate 関数の真偽 | 05a 統合 |
| S-5 | dep-cruiser バイナリで violation 検出 | `.dependency-cruiser.cjs` 設定 + 自前 lint script | 静的禁止辺 | 09a CI gate |
| S-6 | 意図的 violation で red 確認 | 同上 + 一時 import を git stash 確認 | 「赤がちゃんと赤になる」 | （L2 で吸収済） |
| ...   | ...     | ...       | ...        | ... |
```

## 必須チェック

- [ ] 代替 evidence で **何を保証し**、**何を保証できないか** を上表で明示した
- [ ] 保証できない項目はすべて `unassigned-task-detection.md` に申し送り済
- [ ] L4（意図的 violation → red 確認）を 1 件以上実施した
- [ ] phase-11/manual-evidence.md に「NON_VISUAL のため screenshot 不要」を明記した
- [ ] phase-12/implementation-guide.md の §「やってはいけないこと」に boundary tooling 違反例を含めた

## やってはいけないこと

- 「staging 未配備のため Phase 11 をスキップ」と書いて済ませる
- 代替 evidence で **runtime 振る舞いまでカバーした** と主張する（型 / 静的解析の限界を超える主張は不可）
- L4（intentional violation）を省略する → boundary tooling が 0 件しか検出しなくても気付けない

## 関連

- `phase-11-guide.md`（base ガイド）
- `phase-12-documentation-guide.md`（implementation-guide.md 構成）
- 02c 実例: `docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/outputs/phase-11/`
