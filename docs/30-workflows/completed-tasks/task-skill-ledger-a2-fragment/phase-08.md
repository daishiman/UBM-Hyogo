# Phase 08: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-skill-ledger-a2-fragment |
| Phase | 8 |
| タスク種別 | implementation（refactoring） |
| visualEvidence | NON_VISUAL |
| workflow | implementation |

## 目的

Phase 5-7 で動作確定したコードから **重複と navigation drift** を削る。ただしリファクタは「機能不変・テスト不変」を厳守し、Phase 4-7 のテスト全件 Green を維持する。変更内容は `対象 / Before / After / 理由` 表形式で記録する（FB-RT-03 対応）。

## リファクタリング候補

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| fragment path 生成 | `skill-logs-append.ts` 内に直接記述 | `lib/fragment-path.ts` に切り出し | render 側でも path validation に再利用するため重複削除 |
| front matter parse | `skill-logs-render.ts` 内 inline | `lib/front-matter.ts` に切り出し | append 側の write parity 検証に再利用 |
| timestamp utility | `new Date().toISOString()` を散在 | `lib/timestamp.ts:nowUtcCompact()` に統一 | UTC / 形式ぶれ防止 |
| escaped-branch ロジック | 重複実装 2 箇所 | `lib/branch-escape.ts` に集約 | 64 文字 trim / 許可文字判定の単一実装化 |
| nonce retry | 内部 while ループ | `lib/retry-on-collision.ts` 高階関数 | 単体テストの容易化 |

## 実行タスク

- Phase 1 `outputs/phase-1/main.md`、Phase 2 `outputs/phase-2/fragment-schema.md` / `outputs/phase-2/render-api.md`、Phase 6 `outputs/phase-6/failure-cases.md` を入力として差分対象を固定する。
- 重複コード（DRY 違反）を `git diff` で全列挙し、`outputs/phase-8/before-after.md` に Before/After 表で記録。
- 切り出し後、Phase 4 / 6 のテストが全件 Green であることを確認する（リファクタ後の数値を main.md に貼付）。
- navigation drift（参照切れリンク・古い path 表記）を検出：
  - `SKILL.md` 内の `LOGS.md` 言及で fragment 化に追従していない箇所
  - 各 skill の `references/*.md` で `_legacy.md` パスへの言及が必要な箇所
- インターフェース不変を厳守：`renderSkillLogs(options)` / `appendFragment(options)` の public API は変更しない。
- リファクタ後 `mise exec -- pnpm typecheck` / `pnpm lint` 緑であることを記録。

## 参照資料

- Phase 5 `outputs/phase-5/runbook.md`
- Phase 7 `outputs/phase-7/coverage.md`
- 既存仕様書 §補足事項

## 成果物

- `outputs/phase-8/main.md`（リファクタ件数・テスト全件 Green 記録）
- `outputs/phase-8/before-after.md`（対象 / Before / After / 理由 表）

## 統合テスト連携

機能不変のため新規テストは追加しない。Phase 4-7 のテスト全件再実行で Green を確認。

## 完了条件

- [ ] Before/After 表に全リファクタ対象が記録。
- [ ] Phase 4-7 のテスト全件再実行で Green。
- [ ] public API（`renderSkillLogs` / `appendFragment`）が不変。
- [ ] navigation drift（参照切れ）が 0 件。
- [ ] artifacts.json の Phase 8 status と整合。
