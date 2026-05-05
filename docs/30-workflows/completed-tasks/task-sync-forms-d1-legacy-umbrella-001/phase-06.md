# Phase 6: 異常系検証（docs-only legacy umbrella close-out）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-sync-forms-d1-legacy-umbrella-001 |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | legacy-closeout |
| Mode | docs-only / spec_created / NON_VISUAL |
| 作成日 | 2026-04-30 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

本タスクは docs-only であり HTTP 4xx / 5xx の runtime failure は **N/A**。
代わりに「ドキュメント整合性失敗ケース」7 種を元仕様 §1.3 / §7 リスク表から
派生させ、各ケースに検出方法（rg / audit script）と是正手順を付与する。
`outputs/phase-06/failure-cases.md` と `outputs/phase-06/remediation.md` に
固定する。

## 実行タスク

1. failure case 8 種を列挙し検出方法と是正手順を記述
2. 検証コマンド失敗時の対応ガイドを作成（HTTP 401/403/404/422/5xx の代替）
3. 各ケースを Phase 7 negative AC matrix へ引き渡せる粒度で構造化
4. 元仕様 §7 リスク表の各行が failure case にマップされていることを確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | §1.3 / §7 リスク |
| 必須 | docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/phase-04.md | verify suite ID |
| 必須 | docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/phase-05.md | runbook step ID |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 PRAGMA 制約 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | WAL 非対応 / PRAGMA 制約の正本（FD-5 / FD-8 の根拠） |

## 実行手順

### ステップ 1: failure case 8 種列挙

下記「Failure cases」表に沿って FD-1〜FD-8 を確定。

### ステップ 2: 検出方法・是正手順を各ケースに付与

検出は rg / audit-unassigned-tasks.js / dependency mapping コマンド。是正は
ドキュメント編集または 03a / 03b / 04c / 09b への差し戻し起票。

### ステップ 3: 検証コマンド失敗時の対応一覧

下記「検証コマンド失敗時の対応」表で audit / rg 各コマンドが exit != 0 や
unexpected hit を返した場合の挙動を統一する。

### ステップ 4: §7 リスク → failure case マッピング確認

リスク 5 行 + §1.3 由来の派生 2 件 + specs/08 由来の D1 制約読み替え 1 件を 8 ケースに割付し漏れ 0 とする。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | negative AC matrix へ FD-1〜FD-8 を写像 |
| Phase 5 | 各 FD の是正手順を runbook step と相互参照 |
| 上流 03a / 03b | SQLITE_BUSY / batch 等の異常系移植が漏れた場合の差し戻し先 |
| 上流 09b | pause/resume runbook 移植が漏れた場合の差し戻し先 |

## 多角的チェック観点（不変条件）

- **#1**: Sheets API への退行を FD-2 で検出し是正する。
- **#5**: apps/web から D1 直接アクセスの記述を FD-7 で検出する。
- **#6**: GAS apps script trigger が cron 候補として再侵入していないかを
  FD-6 で検出する。
- **#10**: 無料枠超過に至る cron 頻度試算欠落を FD-5 で検出する。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure case 8 種列挙 | 6 | pending | FD-1〜FD-8 |
| 2 | 検出方法 | 6 | pending | rg / audit script |
| 3 | 是正手順 | 6 | pending | 編集 / 差し戻し起票 |
| 4 | 検証コマンド失敗時の対応 | 6 | pending | exit != 0 / unexpected hit |
| 5 | §7 リスクマッピング | 6 | pending | 漏れ 0 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 異常系サマリ |
| ドキュメント | outputs/phase-06/failure-cases.md | FD-1〜FD-8 詳細 |
| ドキュメント | outputs/phase-06/remediation.md | 検証コマンド失敗時の対応 |
| メタ | artifacts.json | Phase 6 を completed に更新 |

## 完了条件

- [ ] failure case 8 種が列挙され検出 + 是正が記述されている
- [ ] 元仕様 §7 リスク 5 行 + §1.3 派生 2 件すべてが FD にマップ済み
- [ ] 検証コマンド失敗時の対応が audit / rg / dependency mapping それぞれに対し記述
- [ ] HTTP 401/403/404/422/5xx が N/A である理由が明記

## タスク100%実行確認【必須】

- 全実行タスク (1〜5) が completed
- failure-cases.md / remediation.md が outputs/phase-06/ に配置
- artifacts.json の phase 6 を completed に更新

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項: failure cases / remediation
- ブロック条件: §7 リスク行と failure case のマッピングに漏れが残る場合は
  次 Phase に進まない

---

## Failure cases（8 ケース）

| # | カテゴリ | 失敗内容 | 検出方法 | 是正手順 |
| --- | --- | --- | --- | --- |
| FD-1 | ドキュメント矛盾 | Sheets API 表記が新規 sync 仕様として残存（§7 リスク行 2） | `rg -n "Google Sheets API v4\|spreadsheets\\.values\\.get" docs/30-workflows/02-application-implementation` | hit 行を Forms API 表記に置換 / 03a / 03b へ差し戻し起票 |
| FD-2 | 責務移管漏れ | 03a / 03b / 04c / 09b のいずれかで keyword 不足（§1.3） | Phase 4 M-1〜M-4 の `rg -l` が 1 keyword でも 0 hit | 不足タスクの index.md / phase-02.md に追記タスクを起票し本タスクの outputs に記録 |
| FD-3 | 二重正本の発生 | 単一 `/admin/sync` endpoint が新規記述される（§7 リスク行 1） | `rg --pcre2 -n "/admin/sync(?!/)" .claude/skills/aiworkflow-requirements/references` | hit 行を `/admin/sync/schema` または `/admin/sync/responses` に置換 |
| FD-4 | 監査テーブル混同 | `sync_audit` が現行仕様に出現する（§7 リスク行 4） | `rg -nw "sync_audit" docs/30-workflows/02-application-implementation` | hit 行を `sync_jobs` に置換 / 02c の sync_jobs repository を正本として参照 |
| FD-5 | D1 PRAGMA 誤実行リスク | `PRAGMA journal_mode=WAL` を Cloudflare D1 で実行する記述（§7 リスク行 5 / §1.3 / specs/08-free-database.md は WAL 非対応・PRAGMA 制約を明記） | `rg -n "PRAGMA journal_mode\|=WAL\|journal_mode=WAL" docs/30-workflows` | hit 行を削除し WAL 非前提の retry/backoff / 短 transaction / batch-size 制限の表現へ置換。specs/08-free-database.md を根拠として参照 |
| FD-6 | 環境表記の退行 | `dev / main 環境` 単独表記が再侵入する | `rg -n "dev / main 環境\|dev/main 環境" docs/30-workflows/02-application-implementation` | `dev branch -> staging env` / `main branch -> production/top-level env` に置換 |
| FD-7 | 不変条件 #5 違反 | apps/web から D1 直接アクセスする旨の記述が混入 | `rg -n "apps/web.*D1\|D1Database.*apps/web\|apps/web.*Workers binding" docs/30-workflows` | hit 行を「D1 直接アクセスは apps/api 限定」に修正、必要に応じて 02c に差し戻し |
| FD-8 | specs/08 違反: D1 制約読み替え | specs/08-free-database.md に存在しない PRAGMA / WAL 前提が新規追加される（例: `PRAGMA busy_timeout` を必須化、`journal_mode` 切替を runtime 前提化） | `rg -n "PRAGMA busy_timeout\|journal_mode=" docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001 docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver` | hit 行を削除し、retry/backoff・短 transaction・batch-size 制限のみで対処する文言に統一。specs/08-free-database.md を根拠リンクとして付与 |

## §7 リスク → failure case マッピング

| §7 リスク（元仕様） | 対応 FD |
| --- | --- |
| 旧 UT-09 名で参照する文書が残る | FD-1（同種派生）/ Phase 5 stale-audit でも検出 |
| Sheets API 実装が誤って追加される | FD-1 |
| D1 競合対策が legacy task と一緒に消える | FD-5（PRAGMA 誤実行）/ Phase 5 quality-port Diff B/C |
| `sync_audit` と `sync_jobs` が混同される | FD-4 |
| production で未確認 PRAGMA を実行する | FD-5 |
| §1.3 由来 Sheets API 経路の追加 | FD-1 |
| §1.3 由来 別監査テーブルの追加 | FD-4 |

## 検証コマンド失敗時の対応

| 検証コマンド | 失敗状態 | 対応 |
| --- | --- | --- |
| `audit-unassigned-tasks.js` | current violations > 0 | violation 種別ごとに元仕様の必須セクションを補修。lowercase / hyphen 違反であれば filename を修正（旧 UT-09 大文字 .md は legacy 扱いで残しつつ参照を新ファイルに切替） |
| stale path scan `rg -n "UT-09-..."` | legacy umbrella 文脈以外で hit | hit 行が新規導線になっていれば legacy umbrella 表記または現行 03a/03b/04c/09b への参照に置換 |
| conflict marker scan `rg -n "^(<<<<<<<\|=======\|>>>>>>>)"` | hit > 0 | hit ファイルを開き衝突解消後 git 状態を再確認 |
| dependency mapping `rg -l "..."` | 期待 keyword の一部 0 hit | FD-2 の是正手順に従い不足タスクへ追記タスクを起票 |
| Sheets / sync_audit / 単一 `/admin/sync` scan | hit > 0 | FD-1 / FD-3 / FD-4 の是正手順に従い置換 |
| PRAGMA scan | hit > 0 | FD-5 の是正手順に従い WAL 非前提表現に置換 |

## HTTP 4xx / 5xx が N/A である理由

本タスクは API endpoint を新規追加・変更しない。`/admin/sync/schema` /
`/admin/sync/responses` の認可・エラー応答は 04c の責務であり、本タスクの
失敗は「ドキュメント整合性失敗」のみで構成される。よって 401 / 403 / 404 /
422 / 5xx の検証は本 Phase では取り扱わず、04c / 09b の Phase 6 を参照する。
