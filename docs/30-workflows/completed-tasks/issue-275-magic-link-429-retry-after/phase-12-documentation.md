# Phase 12: ドキュメント

> 実装区分: **実装仕様書**

## 1. 中学生にも分かる概念説明（必須セクション）

### この機能は何をしているの？

「ログイン用のリンク（マジックリンク）をメールで送って」というボタンを連打しすぎると、サーバーが「ちょっと待って、あと N 秒は送れないよ」と返してきます。これを **レートリミット（送信回数の制限）** と言います。

このとき、サーバーは正直に「あと **60 秒** 待ってね」というように具体的な秒数を返してくれます（HTTP の `Retry-After` ヘッダー）。これまでの画面は、この **サーバーの言ってきた秒数を無視して**「エラーです」とだけ表示していました。

この変更では、サーバーが「あと N 秒待って」と返したら、**ボタンを N 秒間押せなくして、画面に「N 秒後に再送可能」とカウントダウンを表示** します。これでユーザーは「あと何秒待てばいいか」が一目で分かるし、連打して何度もサーバーに怒られることもなくなります。

### どうやって実現するの？

2 段階の小さな修正です:

1. **`magic-link-client.ts`（裏方）**: サーバーから 429 という「待って」サインが返ってきたら、専用のエラー型 `MagicLinkRateLimitedError` で「あと N 秒待って」の情報を一緒に持って投げる
2. **`MagicLinkForm.client.tsx`（画面）**: そのエラーを受け取ったら「エラー表示」ではなく「N 秒のカウントダウン開始」に切り替える

### なぜわざわざ別のエラー型？

「サーバーが応答してきた 429（待って）」と「本物のエラー（500 や 400）」は **意味も対処も違う** からです。違う扱いをするには、まず違うものとして識別できる名前を付ける必要があります。

## 2. システム仕様書更新サマリ

| 仕様ファイル | 更新内容 |
|---|---|
| `docs/00-getting-started-manual/specs/00-overview.md` | （変更なし） |
| `docs/00-getting-started-manual/specs/02-auth.md` | （変更なし — auth flow 自体は変えない） |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | （変更なし） |
| `docs/30-workflows/issue-275-magic-link-429-retry-after/index.md` | 本仕様書として正本 |

## 3. 関連ドキュメント更新

- 親 workflow: `docs/30-workflows/completed-tasks/06b-parallel-member-login-and-profile-pages/`
  → 本仕様書のリンクを参照行に追記済み。source follow-up は consumed pointer 化済み。

## 4. canonical 9 headings（task-specification-creator gate 互換）

1. 概要
2. 不変条件
3. 変更対象ファイル
4. テスト方針
5. 実装手順
6. 完了条件 (DoD)
7. リスクと対策
8. ロールバック
9. 中学生にも分かる概念説明

これらはそれぞれ次の Phase ファイルで詳細化済み:

| 見出し | Phase |
|---|---|
| 概要 | index.md / phase-1-requirements.md |
| 不変条件 | index.md §不変条件 |
| 変更対象ファイル | index.md §変更対象ファイル |
| テスト方針 | phase-4-test-plan.md |
| 実装手順 | phase-5-implementation.md |
| 完了条件 (DoD) | phase-5-implementation.md §9 |
| リスクと対策 | phase-3-design-review.md §3 |
| ロールバック | phase-10-final-review.md §4 |
| 中学生にも分かる概念説明 | phase-12-documentation.md §1 |

## 5. Phase 11 evidence 表

| TC | evidence path |
|---|---|
| TC-1 (429 countdown 起動) | `outputs/phase-11/manual-test-result.md` |
| TC-2 (countdown 0 で再 enable) | `outputs/phase-11/manual-test-result.md` |
| TC-3 (200 OK regression) | `outputs/phase-11/manual-test-result.md` |
| TC-4 (非 429 error regression) | `outputs/phase-11/manual-test-result.md` |
| TC-5 (継承確認 / 任意) | `outputs/phase-11/manual-test-result.md` |

## 6. 未タスク検出（Phase 12 必須）

| ID | 内容 | 判定 |
|---|---|---|
| FU-001 | reload を跨いだ cooldown 永続化（sessionStorage） | 起票しない。AC-3 で明示的に scope 外。実装後に UX 要望が出た時点で再評価 |
| FU-002 | `Retry-After` 解析の共通 util 化（`apps/web/src/lib/http/retry-after.ts`） | 起票しない。callsite 1 件のみ。callsite が 2 以上に増えた時点で再評価 |
| FU-003 | 429 受信を `aria-live` で SR に通知 | 起票しない。既存実装に `aria-live` 領域がなく、本タスク scope を超える a11y 改善案件 |

新規未タスクは **0 件**。Phase 12 unassigned 0 件で完結。
