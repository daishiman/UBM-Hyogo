# T04: Issue #1190 現行コード最適化コメント草稿（docs）

`[実装区分: 実装仕様書]`

> 本タスクは docs 性質（コード非接触・草稿テキストの作成のみ）だが、本実装ワークフロー（issue-1190-me-5xx-root-fix）の一部であり、T01-T03 の実装と同一サイクルで完結する成果物である（CONST_007）。**GitHub への mutation（Issue コメント投稿・ラベル変更・close・再 open）は一切行わず、全て user-gated**（AC-10）。
> 依存: なし（独立並列可）。草稿の根拠は Phase 1 §2 経路マップ（既確定）であり、T01-T03 の実装完了を待たない。
> 正本参照: `../../_shared-context.md`（§1 再定義・§8 スコープ外）/ `../phase-1/phase-1.md`（§1.2 監査結果・§2 経路マップ）

## 変更対象ファイル一覧

| # | ファイル | 種別 | 変更概要 |
|---|---------|------|---------|
| 1 | `docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix/outputs/phase-12/issue-1190-comment-draft.md` | **新規** | Issue #1190 へ投稿しうるコメント本文の草稿（Markdown）。Phase 12 成果物として配置 |

本 WF ディレクトリ外への書き込みなし。apps/* 非接触。**GitHub mutation なし**。

## 草稿の必須構成（シグネチャに相当する見出し契約）

草稿 Markdown は以下の節を必ず含む（AC-9 の検証対象）:

```markdown
# Issue #1190 現行コード最適化注記（草稿・投稿は user-gated）

## 1. 起票時前提の更新（deferred ブロッカー解消）
- 起票時: `deferred_pending_root_cause`（真因 H4 確定と例外箇所特定を待つ）
- 現在: 2026-06-12 の静的監査（HEAD 52ade3866）で例外箇所を特定済み。
  staging 実機（MT-A〜MT-D）を待たずにブロッカー解消。

## 2. 特定済みの 5xx 発生経路（根拠 = WF Phase 1 §2 経路マップ）
- P1: session-guard.ts:84-87（Promise.all identity/status）→ 500 UBM-5000
- P2: session-guard.ts:105（findAdminByEmail）→ 同上
- P3: routes/me/index.ts:170-175（buildMemberProfile）→ 500 UBM-5000
- P4: routes/me/index.ts:181（getPendingRequestsForMember）→ 二次データなのに全体 500
（P5-P8 は既防御で 200/401 維持・改修対象外）

## 3. 再定義した根本問題と対処
- F-1（fail-soft 不統一）→ T01 / F-2（UBM-5001 未使用・scope 不明）→ T02 / F-3（5xx 契約テスト不在）→ T03

## 4. 真因仮説（H3/H4/H5）との関係
- 本対処は真因確定を待たない。H4 なら根治、H4 でなくても再発時に
  worker ログ 1 件（UBM-5001 + context.scope）で発生箇所を即時確定できる。

## 5. 残作業（user-gated）
- staging 実機確認（wrangler tail を scripts/cf.sh 経由）・Issue の状態整理（ラベル / close 判断）
```

文面の正確な行番号・経路は Phase 1 §2（実測検証済み）から転記する。創作・推測の追加禁止。

## 入力・出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | `../phase-1/phase-1.md`（§1.2/§2/§3）・`../../_shared-context.md`（§1） |
| 出力 | 草稿 Markdown 1 ファイル（上記必須構成） |
| 副作用 | **なし**。GitHub API 呼び出し（`gh issue comment` / `gh issue edit` / `gh issue close` 等）を実行しない。Issue #1190 は OPEN のまま不変（SSOT §0 メタ情報の注記どおり mutation 禁止） |

## テスト方針

コードテストなし（docs タスク）。検証は以下のレビュー観点で行う:

- AC-9: 草稿が「deferred ブロッカー解消の根拠＝Phase 1 §2 経路マップ」を含む（§2 節の存在 + P1-P4 の行番号が Phase 1 と一致）。
- AC-10: 草稿ファイル内に「投稿は user-gated」の明記があり、本サイクルの作業ログ・コマンド履歴に GitHub mutation が存在しない。
- 整合: 草稿内の行番号・コード引用が Phase 1 §1.3 の実測値と矛盾しない。

## ローカル実行・検証コマンド

```bash
# 草稿の存在と必須節の確認
test -f docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix/outputs/phase-12/issue-1190-comment-draft.md
grep -c "^## " docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix/outputs/phase-12/issue-1190-comment-draft.md  # 5 以上

# GitHub mutation 不在の確認（read-only の確認コマンドのみ許可）
# gh issue view 1190 --json state   # read-only。実行自体も任意（必須ではない）

# 仕様書ゲート
pnpm verify:phase12-compliance docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix
```

## 完了条件（DoD）

- [ ] 草稿 `outputs/phase-12/issue-1190-comment-draft.md` が必須 5 節構成で存在する（AC-9）。
- [ ] 草稿内の経路・行番号が Phase 1 §2（実測検証済み）と一致する。
- [ ] GitHub mutation（コメント・ラベル・close・open）を一切実行していない（AC-10。実行は Phase 13 以降のユーザー承認後のみ）。
- [ ] 本 WF ディレクトリ外への書き込みがない（`git status` で apps/* / 他 docs に diff なし）。

## 不変条件

- Issue #1190 の GitHub 上の状態（OPEN・ラベル・コメント）を変更しない（AC-10・user-gated）。
- `/me` の status 体系等コード不変条件には非接触（docs のみ）。memberId / 個人 email を草稿に記載しない（不変条件 #11 は文書にも適用。経路の説明は scope 識別子とファイル:行のみで行う）。
- apps/web / apps/api / migrations に diff を作らない。
