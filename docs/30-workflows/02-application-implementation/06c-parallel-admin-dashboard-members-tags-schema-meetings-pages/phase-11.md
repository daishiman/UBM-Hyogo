# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 6 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

5 画面の主要シナリオを手動で smoke し、screenshot / curl / wrangler 出力を evidence として保存する。Playwright 自動化とは別軸で人の目による検証を残す。

## 実行タスク

1. ローカル `pnpm dev` で 5 画面を順次操作
2. 各画面の screenshot 取得
3. mutation の curl evidence
4. 不変条件 violation を起こす操作の試行（出ないことを確認）
5. 削除済み会員 / consent 撤回 / unresolved schema の境界検証

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/admin-implementation-runbook.md | 操作対象 |
| 必須 | outputs/phase-06/main.md | 異常系シナリオ |

## smoke シナリオ

### シナリオ 1: dashboard
1. `/admin` を Google OAuth で admin user として開く
2. KPI 4 種が render される（screenshot）
3. 未タグ件数 / 未解決 schema 件数のリンクから `/admin/tags` / `/admin/schema` へ遷移
4. `GET /admin/dashboard` の network が 1 件のみ

### シナリオ 2: members
1. `/admin/members` を開く
2. 一覧の row をクリック → 右ドロワー open
3. ドロワー内に profile 本文の input/textarea が**ない**ことを確認（screenshot）
4. Switch で publishState 切替 → Toast「公開状態を更新しました」
5. 管理メモを追加 → 保存後再 fetch
6. 「タグ割当キューで編集」リンクで `/admin/tags?memberId=xxx` へ遷移
7. 「本人に Form 編集を依頼」ボタンで Google Form 編集 URL が新窓 open

### シナリオ 3: tags
1. `/admin/tags` を開く
2. 左 queue から member を選択 → 右 review panel
3. tag を選んで resolve → queue から消える
4. reject → reason 入力 → 保存

### シナリオ 4: schema
1. `/admin/schema` を開く
2. unresolved 件が最上位
3. alias 候補を選んで保存 → stableKey 更新
4. dry-run back-fill 結果が表示

### シナリオ 5: meetings
1. `/admin/meetings` を開く
2. 開催日追加フォームで title / date を入力 → 追加
3. 一覧で展開 → attendance 追加 Combobox を open
4. 削除済み member が候補に**ない**ことを確認（screenshot）
5. 同 member を 2 回追加しようとして 422 エラー Toast

## 異常系 smoke

| case | 操作 | 期待 |
| --- | --- | --- |
| 401 | session 切らした状態で `/admin` | `/login?next=/admin` redirect |
| 403 | non-admin user で `/admin` | forbidden 画面 |
| 404 | 存在しない memberId | 空状態 |
| 422 | attendance 重複 | Toast |
| 5xx | API を強制停止 | retry button |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke evidence を documentation-changelog に |
| Phase 13 | PR description に evidence link |

## 多角的チェック観点

| 不変条件 | 手動確認 | 結果 |
| --- | --- | --- |
| #4, #11 | drawer に本文 input なし | screenshot |
| #13 | drawer に tag 編集 form なし | screenshot |
| #14 | schema 解消 UI が `/admin/schema` のみ | ナビ確認 |
| #15 | attendance 候補に削除済み除外 | screenshot |
| 認可 | 未認証 redirect | curl |

## evidence 一覧

| evidence | path | 種別 |
| --- | --- | --- |
| dashboard screenshot | outputs/phase-11/screenshots/dashboard.png | image |
| members drawer screenshot | outputs/phase-11/screenshots/member-drawer.png | image |
| tags queue screenshot | outputs/phase-11/screenshots/tags-queue.png | image |
| schema diff screenshot | outputs/phase-11/screenshots/schema-diff.png | image |
| meetings attendance screenshot | outputs/phase-11/screenshots/meetings.png | image |
| 401 redirect curl | outputs/phase-11/curl/401-redirect.txt | text |
| 422 attendance curl | outputs/phase-11/curl/422-attendance.txt | text |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 5 画面シナリオ | 11 | pending | screenshot |
| 2 | 異常系 smoke | 11 | pending | curl |
| 3 | 不変条件 violation 試行 | 11 | pending | 出ないこと確認 |
| 4 | evidence 整理 | 11 | pending | outputs/phase-11/ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果サマリー |
| ドキュメント | outputs/phase-11/manual-smoke-evidence.md | screenshot / curl evidence 一覧 |
| メタ | artifacts.json | Phase 11 を completed |

## 完了条件

- [ ] 5 画面シナリオすべて green
- [ ] 異常系 5 case すべて期待通り
- [ ] screenshot / curl evidence が揃う
- [ ] 不変条件 violation を起こす操作が UI で阻止される

## タスク100%実行確認

- 全シナリオに evidence
- 不変条件 7 件すべて手動確認
- artifacts.json で phase 11 を completed

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ: evidence を documentation-changelog に取り込む
- ブロック条件: いずれかのシナリオで不変条件違反が出たら差し戻し
