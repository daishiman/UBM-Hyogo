# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | wrangler.toml binding ↔ env.ts ↔ 棚卸し表 三者ドリフト検出 CI gate (issue-1054-wrangler-binding-drift-ci-gate) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成（user-gated） |
| 作成日 | 2026-06-02 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（最終 Phase） |
| 状態 | pending_user_approval |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1054（CLOSED のまま参照のみ。Refs #1054） |

## 目的

実装サイクル（`03.実装.md`）が変更 5 ファイルを実装し品質検証を通過した後に作成する PR の構成を、本 Phase で正本として固定する。本 WF（spec_created）は PR 本文ドラフトの雛形を `outputs/phase-13/main.md` に用意するに留め、**PR の作成・commit・push は行わない**。これらは CONST_002 によりユーザーの明示承認後のみ実行する（状態 `pending_user_approval`）。

- PR base ブランチは `dev`（CLAUDE.md PR 作成フロー既定）。production リリース時の `dev → main` ではない。
- GitHub Issue #1054 は **CLOSED のまま**参照する（本文に `Refs #1054`）。再 open / Issue mutation はユーザー指示があるまで行わない。

## 本 WF で PR を作らない理由（CONST_002）

| 事項 | 本 WF での扱い |
| --- | --- |
| commit | 行わない（実装サイクルで実コード生成後 + ユーザー承認） |
| push | 行わない（user-gated） |
| PR 作成（`gh pr create --base dev`） | 行わない。本文ドラフトのみ `outputs/phase-13/main.md` に用意 |
| Issue #1054 状態変更 | CLOSED 維持。status label は `status:completed` へ同期済み。再 open・本文更新は行わない |

## PR 構成（実装サイクル完了後に作成）

### 変更ファイル（5 件・Phase 2 と一致）

| パス | 変更種別 |
| --- | --- |
| `scripts/verify-wrangler-binding-drift.mjs` | 新規（read-only 解析 gate） |
| `scripts/__tests__/verify-wrangler-binding-drift.spec.ts` | 新規（回帰 spec・`.spec.ts` 厳守 / 不変条件 #8） |
| `.github/workflows/verify-wrangler-binding-drift.yml` | 新規（CI gate job） |
| `package.json` | 編集（`verify:wrangler-binding-drift` script 追記） |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 編集（MEMBER_PHOTOS / DB / SYNC_ALERTS 行追加 + SSOT 注記 / AC-10 / R-1） |

### 品質検証（PR 前に exit 0 を確認）

| コマンド | 期待 |
| --- | --- |
| `mise exec -- pnpm typecheck` | exit 0 |
| `mise exec -- pnpm lint` | exit 0 |
| `mise exec -- pnpm vitest run scripts/__tests__/verify-wrangler-binding-drift.spec.ts`（リポジトリルートから実行） | TC-01〜TC-10 全 pass |
| `mise exec -- pnpm verify:wrangler-binding-drift` | **exit 0**（AC-10 棚卸し表是正後・現存 MEMBER_PHOTOS ドリフト解消） |

## 実行タスク

1. PR base ブランチを `dev` に固定する（完了条件: 本 Phase に base=dev が明記、main は production リリース時のみと記述）。
2. 変更 5 ファイルを PR 範囲として確定する（完了条件: ファイル一覧が Phase 2 と一致）。
3. 品質検証 4 コマンドの期待 exit 0 / TC pass を固定する（完了条件: 検証コマンド表が存在し `verify:wrangler-binding-drift` exit 0 を含む）。
4. PR 本文ドラフト雛形を `outputs/phase-13/main.md` に作成する（完了条件: タイトル案 + 変更ファイル + 検証コマンド + Refs #1054 + user-gated 注記を含む）。
5. 本 WF では commit / push / PR / Issue mutation を行わないことを CONST_002 で固定する（完了条件: 「本 WF で PR を作らない理由」テーブルが存在）。
6. Issue #1054 を CLOSED のまま `Refs #1054` で参照する（完了条件: 再 open しないと明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/commands/ai/diff-to-pr.md | Phase 13 PR 本文仕様（diff-to-pr） |
| 必須 | phase-12.md | 変更ファイル + 新規未タスク 0 件 |
| 必須 | phase-02.md | 変更ファイル一覧の正本 |
| 必須 | CLAUDE.md | PR base=dev 既定 / CONST_002（user-gated） |
| 必須 | outputs/phase-13/main.md | PR 本文ドラフト（Gate-C evidence_path） |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR 本文ドラフト雛形（タイトル案 / 変更ファイル / 検証コマンド / Refs #1054 / user-gated 注記）。artifacts.json Gate-C の evidence_path として参照される |
| メタ | artifacts.json | Phase 13 状態（pending_user_approval） / Gate-C（pending・user-gated） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | CLI smoke の exit 0 実績を PR 検証コマンド表の根拠として受領 |
| Phase 12 | 変更ファイル + 新規未タスク 0 件を PR 本文ドラフトへ反映 |

## 完了条件

- [ ] PR base ブランチが `dev` に固定されている（main は production リリース時のみと明記）
- [ ] 変更 5 ファイルが PR 範囲として Phase 2 と一致している
- [ ] 品質検証 4 コマンドが固定され、`verify:wrangler-binding-drift` exit 0 を含む
- [ ] PR 本文ドラフト雛形が `outputs/phase-13/main.md` に作成され、Gate-C evidence_path として参照可能
- [ ] commit / push / PR / Issue mutation を本 WF で行わない（CONST_002 / user-gated）と固定されている
- [ ] Issue #1054 を CLOSED のまま `Refs #1054` で参照し、再 open しないと明記されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `completed`
- 成果物 `outputs/phase-13/main.md` が配置済み
- Gate-C が pending（user-gated）であることが artifacts.json と一致
- artifacts.json の `phases[12].status` が `pending_user_approval`

## 次 Phase への引き渡し

- 次 Phase: なし（最終 Phase）
- 残課題:
  - 実装サイクル（`03.実装.md`）での変更 5 ファイル実装 + 品質検証
  - ユーザー承認後の commit / push / `gh pr create --base dev`
  - 新規未タスク 0 件。Issue #1054 mutation は user-gated
- ブロック条件:
  - ユーザー承認なしの commit / push / PR / Issue mutation
