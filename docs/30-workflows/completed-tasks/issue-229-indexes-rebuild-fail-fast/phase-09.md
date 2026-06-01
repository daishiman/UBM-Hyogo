# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証 (issue-229-indexes-rebuild-fail-fast) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-05-31 |
| 前 Phase | 8 (DRY 化・リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |
| 実装区分 | 実装仕様書 |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |

## 目的

`generate-index.js` の hardening 差分と回帰 spec test が、AC-1〜AC-8 / Phase 2 設計 / 既存 CI / hook と整合していることを検証する品質保証の判定方針を確定する。本 Phase は仕様書であり、実コマンドの実走は今回の実装サイクルで行う。lint / typecheck / line budget / mirror parity の各ゲートの判定基準を明記する。

## 品質ゲート判定方針

| ゲート | コマンド（実装サイクルで実走） | PASS 判定 | 備考 |
| --- | --- | --- | --- |
| QG-1 lint | `mise exec -- pnpm lint` | 違反 0。`no-restricted-globals` 等に抵触しない | 新規 helper / spec test を含む |
| QG-2 typecheck | `mise exec -- pnpm typecheck` | エラー 0 | spec test は TS。skill script は JS だが import 型整合を確認 |
| QG-3 回帰 spec test | `mise exec -- pnpm vitest run scripts/__tests__/generate-index-fail-fast.spec.ts` | TC-01〜TC-07 全 PASS | vitest root glob `scripts/**/*.spec.ts` で自動発見 |
| QG-4 byte-identical（drift 0） | `mise exec -- pnpm indexes:rebuild` 後 `git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes` | exit 0（差分なし） | AC-4。出力文字列を変えていないことの実証 |
| QG-5 line budget | 変更行数を `git diff --stat` で確認 | helper + ログ + ガード + export で数十行規模。肥大化していない | 1 ファイル差分 + spec test 1 本に収まる |
| QG-6 mirror parity | `.claude/skills/` の index と `.agents` ミラー（symlink）の整合 | spec 上の言及のみ。実 diff は実装サイクルで採取 | mirror が symlink であれば parity は自明。byte-identical の副次確認 |
| QG-7 変更ファイル範囲 | `git status --porcelain` | `generate-index.js` + 新規 spec test の 2 件のみ | scope 逸脱がないことの確認 |

> **QG-6 mirror parity の注記**: `.claude/skills/` 配下 index の mirror parity は、本仕様書では「実装サイクルで `git diff` 0 を確認する」旨を言及するに留める。mirror が symlink で実体共有されている場合は parity は構造的に保証されるため、実 diff 採取は QG-4（byte-identical）に統合してよい。

## fail-fast / atomic の品質確認観点

| 観点 | 確認方法（実装サイクル） | 対応 AC |
| --- | --- | --- |
| 途中 throw で非ゼロ exit | 書き込み失敗を注入し `echo "exit=$?"` が 1 | AC-1 |
| atomic（部分書き込みなし） | 2 件目で throw 注入 → 本ファイル群が変更前のまま / `.tmp` 残存 0 | AC-2 |
| decisive log | throw 時 stderr が `[generate-index] <skill> / <index-file> (<step>) 失敗:` を含む | AC-3 |
| ENOENT 継続 / その他 throw | extractHeadings に ENOENT / EACCES を注入し分岐確認 | AC-5 |
| import 副作用なし | module import で main() の書き込みが走らない | AC-7（TC-06） |

## 実行タスク

1. lint / typecheck / 回帰 spec test / byte-identical / line budget / mirror parity / 変更範囲の 7 ゲート判定基準を確定する（完了条件: 品質ゲート表が本 Phase に存在）。
2. fail-fast / atomic の品質確認観点を AC-1〜AC-3 / AC-5 / AC-7 にトレースする（完了条件: 観点表が AC と一致）。
3. artifacts.json と Phase ファイルの状態・成果物パスを照合する方針を記録する（完了条件: QG-7 で scope 逸脱検知）。
4. mirror parity は spec 上の言及に留め、実 diff は実装サイクルへ委譲する旨を明記する（完了条件: QG-6 注記が存在）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | （本ワークフロー）phase-02.md | DoD / ローカル実行・検証コマンド |
| 必須 | （本ワークフロー）phase-07.md | AC / カバレッジマトリクス |
| 必須 | scripts/verify-pr-ready.sh | indexes:rebuild drift gate（回帰維持対象） |
| 必須 | scripts/hooks/indexes-drift-guard.sh | pre-push T-6 ガード（回帰維持対象） |
| 必須 | .github/workflows/verify-indexes.yml | CI verify-indexes-up-to-date（回帰維持対象） |
| 必須 | vitest.config.ts | test glob 正本 |

## スコープ

### 含む

- 7 品質ゲート（lint / typecheck / 回帰 spec / byte-identical / line budget / mirror parity / 変更範囲）の判定方針
- fail-fast / atomic の品質確認観点と AC トレース
- mirror parity の spec 言及（実 diff は実装サイクル）

### 含まない

- 実コマンドの実走（今回の実装サイクル）
- CI ワークフロー / lefthook.yml の編集
- index 内容（キーワード抽出ロジック）の品質改善

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 7 ゲートの PASS/未達を GO / NO-GO 判定へ渡す |
| Phase 11 | byte-identical（QG-4）と非ゼロ exit を CLI 回帰 smoke の基準として渡す |

## 多角的チェック観点

- 品質確認が手動目視だけに依存していないか（回帰 spec test + CLI 回帰で自動化されているか）。
- byte-identical 確認が drift 検出を確実に拾えるか（`git diff --quiet` の exit code 依存）。
- mirror parity の言及が実装サイクルへ確実に引き渡されているか。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 7 品質ゲート判定方針確定 | completed | QG-1〜QG-7 |
| 2 | fail-fast / atomic 確認観点 AC トレース | completed | AC-1〜AC-3 / AC-5 / AC-7 |
| 3 | artifacts 照合方針 | completed | QG-7 scope 逸脱検知 |
| 4 | mirror parity spec 言及 | completed | 実 diff は実装サイクル |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| QA 記録 | outputs/phase-09/main.md | 7 品質ゲート判定方針・fail-fast/atomic 確認観点・残リスク |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] lint / typecheck / 回帰 spec / byte-identical / line budget / mirror parity / 変更範囲の判定方針が明記されている
- [ ] fail-fast / atomic の品質確認観点が AC-1〜AC-3 / AC-5 / AC-7 にトレースされている
- [ ] mirror parity が spec 上の言及に留まり、実 diff は実装サイクルへ委譲する旨が明記されている
- [ ] Phase 10 に 7 ゲートの判定基準が渡されている

## タスク100%実行確認【必須】

- [ ] 全実行タスク（4 件）が記録されている
- [ ] 成果物が `outputs/phase-09/main.md` に配置済み
- [ ] artifacts.json の Phase 9 状態が `completed`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項: 7 品質ゲート判定基準 / fail-fast・atomic 確認観点 / mirror parity の実装サイクル委譲
- ブロック条件: 品質ゲートのいずれかで未達が残る場合
