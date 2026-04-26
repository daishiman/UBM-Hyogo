# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 WAL mode 設定 (UT-02) |
| Phase 番号 | 6 / 6 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (セットアップ実行) |
| 次 Phase | なし（本タスクの最終 Phase） |
| 状態 | pending |

## 目的

WAL mode 未設定時のロック競合ケース・wrangler 互換性エラー・local/prod 差異によって生じる failure cases を網羅的に検証し、問題発生時の対応手順を確定する。

## 実行タスク

- WAL mode 未設定時のロック競合ケースを検証する
- wrangler バージョン非互換エラーのケースを確認する
- local / production の WAL mode 差異に起因する問題ケースを確認する
- 各 failure case の対応手順（mitigation）を記録する
- AC との整合を最終確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/phase-05.md | 実行済みの設定・runbook |
| 必須 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/phase-01.md | AC・4条件評価 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 仕様・制限事項 |
| 参考 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/index.md | 苦戦箇所・知見セクション |

## 実行手順

### ステップ 1: failure cases のリストアップ

- WAL mode に関連する既知の failure cases を index.md の苦戦箇所から収集する
- 未発見の failure cases を設計・実行結果から推測して追加する

### ステップ 2: 各 failure case の検証

- failure cases テーブルの各ケースを順番に確認する
- 実際に再現できるケースは再現手順を記録する
- 再現できないケースは発生条件と確認方法を記録する

### ステップ 3: mitigation の確認と AC 最終確認

- 各 failure case の mitigation 手順が実際に動作することを確認する
- AC-1〜AC-5 の全てが Phase 5 の実行結果で達成されていることを最終確認する
- 未解決の failure case がある場合は次タスクへの申し送り事項を記録する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | Phase 5 の実行結果を異常系検証の前提とする |
| Phase 1 | AC-1〜AC-5 の最終確認に Phase 1 の AC 定義を使用 |

## 多角的チェック観点（AIが判断）

- 価値性: failure cases の mitigation が実運用で使える粒度で記録されているか
- 実現性: 各 failure case の発生条件が特定されているか（再現性）
- 整合性: local / production 差異の failure case が AC-4 と整合しているか
- 運用性: wrangler バージョンアップ時に failure cases を再確認するトリガーが設定されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure cases リストアップ | 6 | pending | index.md 苦戦箇所を参照 |
| 2 | WAL 未設定ロック競合ケース検証 | 6 | pending | FC-01 |
| 3 | wrangler 互換性エラーケース確認 | 6 | pending | FC-02 |
| 4 | local/prod 差異ケース確認 | 6 | pending | FC-03 |
| 5 | PRAGMA 実行拒否ケース確認 | 6 | pending | FC-04 |
| 6 | AC 最終確認 | 6 | pending | AC-1〜AC-5 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | failure cases と mitigation 手順 |
| ドキュメント | outputs/phase-06/ac-final-check.md | AC-1〜AC-5 最終確認結果 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 全 failure cases がリストアップされている
- 各 failure case に mitigation 手順が記載されている
- AC-1〜AC-5 の最終確認が完了している
- 未解決の failure case がある場合は申し送り事項に記録されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- AC-1〜AC-5 が全て PASS であることを確認
- 未解決事項がある場合は申し送り先（次タスク）を明記
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: なし（本タスクの最終 Phase）
- 引き継ぎ事項: failure cases・AC 最終確認結果を 02-serial-monorepo-runtime-foundation のドキュメントに反映する
- ブロック条件: なし（申し送り事項がある場合は記録して完了とする）

## failure cases

### FC-01: WAL mode 未設定時のロック競合

| 項目 | 内容 |
| --- | --- |
| ケース名 | WAL mode 未設定時の読み書き競合 |
| 発生条件 | journal_mode が `delete`（デフォルト）のまま Sheets→D1 同期ジョブと API 読み取りが同時実行される |
| 症状 | `SQLITE_BUSY: database is locked` エラーが発生する。同期ジョブまたは API リクエストが失敗する |
| 再現方法 | staging で `PRAGMA journal_mode=DELETE;` を実行した後、同時書き込み・読み取りを行う |
| mitigation | `wrangler d1 execute ubm-hyogo-db --env staging --command "PRAGMA journal_mode=WAL;"` を再実行する |
| 防止策 | Phase 5 runbook の sanity check を定期実行する |

### FC-02: wrangler バージョン非互換エラー

| 項目 | 内容 |
| --- | --- |
| ケース名 | wrangler@2.x 以前での PRAGMA 実行エラー |
| 発生条件 | wrangler のバージョンが 3.x 未満の場合に `wrangler d1 execute` コマンドが存在しない |
| 症状 | `error: unknown command 'd1'` または `error: unknown command 'execute'` が表示される |
| 再現方法 | wrangler@2.x をインストールして `wrangler d1 execute` を実行する |
| mitigation | `npm install -g wrangler@latest` でアップグレードする |
| 防止策 | Phase 4 verify suite のチェック 1 でバージョンを事前確認する |

### FC-03: local 開発環境と production の WAL mode 差異

| 項目 | 内容 |
| --- | --- |
| ケース名 | local で WAL mode が無効・production では有効による挙動差異 |
| 発生条件 | `wrangler dev --local` での D1 エミュレーションが WAL mode を正しく反映しない |
| 症状 | local では競合エラーが発生しないが、staging / production では発生する（または逆） |
| 再現方法 | `wrangler d1 execute ubm-hyogo-db --local --command "PRAGMA journal_mode;"` の結果を確認する |
| mitigation | local での WAL 差異を開発者ドキュメントに明記し、staging で統合テストを行うポリシーを設ける |
| 防止策 | AC-4 の文書化を徹底する（Phase 5 outputs/phase-05/ に記録） |

### FC-04: Cloudflare D1 が PRAGMA 実行を拒否するケース

| 項目 | 内容 |
| --- | --- |
| ケース名 | Cloudflare D1 が `PRAGMA journal_mode=WAL` を制限・拒否する |
| 発生条件 | Cloudflare D1 の内部実装がマネージドモードで一部 PRAGMA を上書きまたは拒否する場合 |
| 症状 | `PRAGMA journal_mode=WAL;` を実行しても `journal_mode` が `wal` に変わらない（`delete` のまま） |
| 再現方法 | Phase 4 verify suite チェック 9 → チェック 10 の結果が `wal` にならない場合 |
| mitigation | Cloudflare D1 のドキュメントで WAL mode サポート状況を確認する。非対応の場合は Phase 3 代替案（KV キャッシュ併用）を検討する |
| 防止策 | Phase 4 verify suite の結果を必ず確認し、設定前に PRAGMA が有効かを検証する |

### FC-05: wrangler.toml の database_id 未設定または誤設定

| 項目 | 内容 |
| --- | --- |
| ケース名 | database_id がプレースホルダーのまま残っている |
| 発生条件 | wrangler.toml の `database_id = "<staging-d1-database-id>"` が実際の ID に置き換えられていない |
| 症状 | `wrangler d1 execute` で D1 が見つからないエラーが発生する |
| 再現方法 | wrangler.toml に `<staging-d1-database-id>` を文字通りに設定して実行する |
| mitigation | `wrangler d1 list` で実際の database_id を確認し、wrangler.toml を修正する |
| 防止策 | 01b タスク（Cloudflare base bootstrap）の完了を Phase 4 の前提条件とする |

### FC-06: staging/production 片方のみ WAL mode が設定されている

| 項目 | 内容 |
| --- | --- |
| ケース名 | staging は WAL だが production はデフォルト（または逆） |
| 発生条件 | Phase 5 の手順を片環境のみ実行して完了としてしまった場合 |
| 症状 | production で競合エラーが発生するが staging では問題なく、原因特定が困難になる |
| 再現方法 | production への PRAGMA 実行をスキップして本番デプロイを行う |
| mitigation | Phase 5 runbook の sanity check（staging と production の両方を確認）を実行する |
| 防止策 | Phase 5 の完了条件に「両環境で `PRAGMA journal_mode;` が `wal` を返す」を必須とする |

## AC 最終確認

| AC | 内容 | 確認状態 | 確認方法 |
| --- | --- | --- | --- |
| AC-1 | wrangler.toml に D1 バインディングが定義され、WAL mode の設定根拠がコメントで記載されている | TBD | `grep -i "WAL" apps/api/wrangler.toml` でコメントを確認 |
| AC-2 | staging / production D1 に対して `PRAGMA journal_mode=WAL` が適用されている | TBD | `wrangler d1 execute ... --command "PRAGMA journal_mode;"` で `wal` を確認 |
| AC-3 | WAL mode 設定手順が 02-serial-monorepo-runtime-foundation の runbook に記録されている | TBD | outputs/phase-05/foundation-bootstrap-runbook-wal-section.md の存在を確認 |
| AC-4 | ローカル開発環境との WAL mode 差異が文書化されている | TBD | outputs/phase-02/env-diff-matrix.md の local 行を確認 |
| AC-5 | 02-serial-monorepo-runtime-foundation の AC との整合が確認されている | TBD | 02-serial タスクの AC リストと照合 |
