# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | magic-link-provider-and-auth-gate-state |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |

## ユーザー承認確認文（冒頭必須）

- この Phase は **ユーザーの明示承認がある場合のみ** 実行する。承認なしに `gh pr create` を実行してはならない。

## 目的

Phase 1〜12 の成果を `feature/05b-magic-link-and-auth-gate` ブランチにまとめ、`dev` 向けの PR を作成する。本タスクは spec_created（docs only）のため、コード差分は無く `doc/02-application-implementation/05b-*` 配下の 15 ファイル + outputs のみが変更対象。

## 実行タスク

1. local-check-result.md を生成（typecheck / lint / test / link check）
2. change-summary.md を生成
3. PR template を生成
4. ユーザー承認後に `gh pr create`

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/implementation-guide.md | PR 本文 |
| 必須 | outputs/phase-12/documentation-changelog.md | changelog |
| 必須 | outputs/phase-10/main.md | GO 判定 |
| 必須 | CLAUDE.md | branch 戦略 |

## 実行手順

### ステップ 1: local-check-result.md

| 種別 | コマンド | 期待 | 結果 |
| --- | --- | --- | --- |
| docs lint | `pnpm docs:lint` | error 0 | TBD |
| link check | `pnpm docs:linkcheck` | broken 0 | TBD |
| markdown structure | template 準拠 | OK | TBD |
| artifacts.json | json valid + 13 phase | OK | TBD |

### ステップ 2: change-summary.md

| 区分 | 内容 |
| --- | --- |
| 種別 | docs（spec_created） |
| 影響範囲 | doc/02-application-implementation/05b-* (15 files + outputs) |
| 後続影響 | 06a/b/c の AuthGateState 結線、08a の contract test |
| residual risk | mail provider 100通/日 上限、レートリミット実装は別タスクで |

### ステップ 3: PR template

```
title: docs(app): 05b magic-link provider + AuthGateState 仕様策定

summary:
- Magic Link 補助導線と AuthGateState 5 状態の API 契約を確定
- /no-access 専用ページに依存せず /login で全状態を吸収
- magic_tokens の TTL 15 分 / 1 回限り使用 / レートリミットを spec 化
- AC-1〜AC-10 を Phase 7 で trace、Phase 9 で無料枠 OK 判定

related specs:
- doc/00-getting-started-manual/specs/02-auth.md
- doc/00-getting-started-manual/specs/06-member-auth.md
- doc/00-getting-started-manual/specs/13-mvp-auth.md

invariants touched: #2, #3, #5, #7, #9, #10

closes: (本タスク GitHub Issue があれば記載)
```

### ステップ 4: PR 作成（承認後のみ）

```bash
gh pr create \
  --base dev \
  --head feature/05b-magic-link-and-auth-gate \
  --title "docs(app): 05b magic-link provider + AuthGateState 仕様策定" \
  --body "$(cat outputs/phase-13/pr-body.md)"
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 06a/b/c | merge 後に画面実装で参照 |
| 08a | merge 後に contract test 実装 |
| 09a | dev → staging deploy で smoke |

## 多角的チェック観点

- 不変条件 #5: 差分が docs only。コード差分 0 を確認
- 不変条件 #9: 差分内に `/no-access` 言及がないこと
- secret hygiene: PR 本文に key 値が含まれない
- branch: `feature/*` → `dev`（CLAUDE.md branch 戦略）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local-check-result | 13 | pending | 4 種 |
| 2 | change-summary | 13 | pending | 4 区分 |
| 3 | PR template | 13 | pending | title / body |
| 4 | PR 作成 | 13 | pending | **承認後のみ** |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | Phase 13 サマリ |
| ドキュメント | outputs/phase-13/local-check-result.md | local check 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリ |
| ドキュメント | outputs/phase-13/pr-body.md | PR 本文 |
| メタ | artifacts.json | phase 13 status |

## 完了条件

- [ ] ユーザー承認あり
- [ ] local-check-result.md がある
- [ ] change-summary.md がある
- [ ] PR が `dev` ブランチに作成済み
- [ ] Phase 12 close-out 済み

## タスク100%実行確認【必須】

- 全 4 サブタスクが completed
- 4 ファイル配置
- 全完了条件にチェック
- 不変条件 #5, #9 への対応が記載
- artifacts.json の phase 13 を completed に更新

## 次 Phase

- 次: なし（本タスク完了）
- 引き継ぎ事項: PR URL を 06a/b/c の implementation-guide に追記
- ブロック条件: ユーザー承認なし → 実行しない

## approval gate

- [ ] ユーザーから明示承認を得た（チャット内 "approve" 等の文言）
- [ ] CLAUDE.md branch 戦略に従い `dev` を base とした
- [ ] PR title / body に secret 値が含まれていない
- [ ] CI（docs lint / link check）が green

## close-out チェックリスト

- 承認あり
- local-check-result.md がある
- change-summary.md がある
- Phase 12 close-out 済み
- artifacts.json の全 phase が completed
