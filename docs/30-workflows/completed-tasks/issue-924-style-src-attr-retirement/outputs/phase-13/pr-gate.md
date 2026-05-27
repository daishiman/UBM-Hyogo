# Phase 13: PR ゲート — issue-924 style-src-attr 撤去

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=VISUAL]`

> **Status**: `pending_user_approval`
>
> commit / push / PR 作成はユーザー明示承認後に実行する。

---

## 1. ゲート条件（user 承認前に満たすべきもの）

- [x] Phase 1-12 仕様書が完成し review 済み
- [x] 実装フェーズ (Phase 5-7) が完了
- [x] Local Phase 8 品質ゲート PASS（typecheck / focused test / grep gate）
- [ ] Phase 11 visual regression 確認済み（baseline 退行 0 または承認更新済み）
- [ ] `bash scripts/verify-pr-ready.sh` PASS

## 2. PR メタ

| 項目 | 値 |
|------|----|
| base ブランチ | `dev` |
| title 候補 | `feat(issue-924): style-src-attr 'unsafe-inline' retirement` |
| labels | `security`, `followup`, `priority:medium` |
| close issue | Issue #924 は既に CLOSED — 再 close せず本文に `Refs #924` を記載 |

## 3. PR 本文に含めるべき項目

- 目的: `style-src-attr 'unsafe-inline'` 撤去による CSP inline 防御の完全成立
- 変更サマリ:
  - 17 ファイルの `style={{...}}` を Tailwind / data-attr + CSS rule / SVG に置換
  - `security-headers.ts:76` の `style-src-attr` 行削除
  - 新規 grep gate `scripts/verify-no-inline-style.sh` 配線（lefthook + CI）
- evidence（VISUAL）: 19 routes 退行確認 + Avatar / Icon / ZoneDistribution の動的バリエーション baseline
- 不変条件保持: nonce 仕様（issue #871）/ tokens.css 正本 / D1 binding 不変
- 関連: `Refs #924`, parent cycle `issue-871-csp-nonce-migration`

## 4. staging / production 検証（post-merge）

| 項目 | 状態 |
|------|------|
| staging response の CSP に `style-src-attr` が含まれないこと | pending |
| 19 routes の CSP violation 報告が 0 件であること | pending |
| Sentry の new CSP violation alert が発生しないこと | pending |

## 5. 残作業

- ユーザー承認後、browser visual regression / staging CSP response verification / `bash scripts/verify-pr-ready.sh` を実行する。
- commit / push / PR はユーザー明示承認後のみ実行する。
