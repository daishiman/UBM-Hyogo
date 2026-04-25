# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | google-workspace-bootstrap |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-23 |
| 前 Phase | 5 (セットアップ実行) |
| 次 Phase | 7 (検証項目網羅性) |
| 状態 | pending |

## 目的

Google Workspace / Sheets 連携基盤 における Phase 6 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | integration package の責務 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | local canonical env |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | secret placement |
| 参考 | Google Cloud Console | Project / OAuth / service account |
| 参考 | User request on 2026-04-23 | Google スプレッドシート入力 |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-06/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 6 | pending | upstream を読む |
| 2 | 成果物更新 | 6 | pending | outputs/phase-06/main.md |
| 3 | 4条件確認 | 6 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | Phase 6 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 主成果物が作成済み
- 正本仕様参照が残っている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 7 (検証項目網羅性)
- 引き継ぎ事項: Google Workspace / Sheets 連携基盤 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## 異常系シナリオ表 (最低5件)
| ID | 異常 | 期待される検出 | 対処 |
| --- | --- | --- | --- |
| A1 | branch drift | dev / main 対応表の矛盾検出 | index / phase を同時修正 |
| A2 | secret placement ミス | runtime と deploy secret の混線検出 | placement matrix 修正 |
| A3 | source-of-truth 競合 | Sheets と D1 の責務重複を検出 | contract 再定義 |
| A4 | downstream blocker 漏れ | 依存漏れ検出 | task 追記 |
| A5 | 無料枠逸脱前提 | 有料 or 過剰サービス依存検出 | scope 外へ戻す |

## 異常系ケース一覧
| ケース | 発生条件 | エラー内容 | 対処方法 |
|--------|----------|------------|----------|
| 権限不足 | SAがシートに共有されていない | 403 Forbidden / PERMISSION_DENIED | シートにSAメールアドレスを閲覧者として共有 |
| API未有効化 | Sheets APIが有効化されていない | 403 / API not enabled | Cloud Consoleでapi有効化 |
| キー無効 | SA JSON keyが削除/期限切れ | 401 Unauthorized | Cloud Consoleで新しいキーを作成 |
| SHEET_ID 誤り | GitHub Variablesの値が間違い | 404 Not Found | スプレッドシートURLからIDを再取得 |
| 無料枠超過 | API呼び出し頻度が上限を超過 | 429 Too Many Requests | 呼び出し頻度を下げる、exponential backoff |

## 再現手順
- branch / env / secret / source-of-truth をわざと入れ替えてレビューする。
- legacy snapshot と新仕様の差分を照合する。

## 期待エラーと対処
- 矛盾: architecture / deployment reference を優先して修正
- 漏れ: AC, refs, outputs, downstream を補完
- 依存不整合: Wave gate を見直す
