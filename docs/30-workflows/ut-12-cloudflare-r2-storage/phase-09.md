# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare R2 ストレージ設定 (UT-12) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-27 |
| 前 Phase | 8 (設定 DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |
| タスク種別 | spec_created（docs-only） |

## 目的

Phase 1〜8 の成果物に対し、line budget / link checker / mirror parity / wrangler.toml 構文 / CORS JSON 構文 / secret hygiene を一括判定し、AC-1〜AC-8 の充足見込みを最終確認する前段の品質ゲートを設ける。docs-only タスクとして、参照ドキュメント間の整合（前後 Phase の証跡パスが正しく辿れること）を担保する。

## 参照資料（前提成果物）

- Phase 2: 4 設計成果物（r2-architecture-design.md / cors-policy-design.md / token-scope-decision.md / wrangler-toml-diff.md）
- Phase 3: design-review.md / review-decision.md
- Phase 4: precheck-runbook.md
- Phase 5: r2-setup-runbook.md / binding-name-registry.md
- Phase 6: 異常系検証ノート
- Phase 7: ac-matrix.md
- Phase 8: refactor-decisions.md / dry-applied-diff.md

## 成果物（出力一覧）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/qa-checklist.md | 品質チェック項目と判定 |
| ドキュメント | outputs/phase-09/qa-result.md | 判定結果サマリ・AC 充足見込み・Phase 10 への申し送り |
| メタ | artifacts.json | Phase 状態の更新 |

> 上記成果物の実体ファイルは Phase 9 実行時に作成する。本 phase 仕様書では作成しない。

## 実行タスク（チェックボックス）

- [ ] line budget チェック（各成果物が想定行数の閾値を超えていないか）
- [ ] link checker（相互参照リンクの 404 / 誤パスがないか）
- [ ] mirror parity（artifacts.json と実 outputs ディレクトリの整合）
- [ ] wrangler.toml 構文検証（TOML 構文・`[[r2_buckets]]` 配置・必須キー）
- [ ] CORS JSON 構文検証（JSON 構文・必須キー・型）
- [ ] secret hygiene（Account ID / 実 Token / 実 origin の直書きが無いか）
- [ ] AC-1〜AC-8 の証跡パスが全て揃っているかの最終確認
- [ ] Phase 10 への申し送り事項の整理

## 実行手順

### ステップ 1: line budget / link checker / mirror parity の一括判定

- 各 Phase 成果物の行数を集計し、閾値（150〜300 行 / Phase 12 のみ 350）を逸脱していないか確認する
- index.md / artifacts.json から phase-XX.md / outputs/phase-XX/* への参照パスを辿り、404 が無いことを確認する
- artifacts.json の `phases[].outputs` と実ディレクトリの差分を `mirror parity` として判定する

### ステップ 2: wrangler.toml / CORS JSON 構文検証

- Phase 2 / Phase 8 のサンプルを取り出し、`wrangler` CLI 相当の構文検証を docs レベルで再現
  - 推奨確認手段: `wrangler config validate`（実環境で利用可能な場合のみ参考）
  - 本 phase は docs-only のため、構文の妥当性は目視 + JSON Schema 想定でレビュー
- CORS JSON は `JSON.parse` 可能であること・必須キー（AllowedOrigins / AllowedMethods）が揃っていることを確認する

### ステップ 3: secret hygiene と AC 充足見込みの確認

- 全 Phase 成果物を `Account ID` / 実 API Token / 実本番ドメインで grep し、直書きがないことを確認
- Phase 7 の AC matrix と各 Phase 成果物の証跡パスを突合し、AC-1〜AC-8 の充足見込みを判定する

## 線数 / リンク / mirror parity 判定【必須】

| チェック項目 | 期待値 | 確認方法 | 判定 |
| --- | --- | --- | --- |
| 各 phase-XX.md の行数 | 150〜300 行（Phase 12 のみ 350） | `wc -l` 想定 | TBD |
| phase-XX.md → outputs パス | 全てリンク有効 | grep + 実在確認 | TBD |
| index.md → phase-XX.md | 全 13 ファイルにリンク | 目視 + ls | TBD |
| artifacts.json `phases[].outputs` | 実ディレクトリと一致 | jq + ls | TBD |
| 双方向リンク（phase n ↔ phase n+1） | 「次フェーズへの引き渡し」記載あり | 目視 | TBD |

## wrangler.toml / CORS JSON 構文検証【必須】

| 検証対象 | 期待 | 確認方法 | 判定 |
| --- | --- | --- | --- |
| `[env.production]` `[[env.production.r2_buckets]]` | TOML 構文として valid | TOML パーサ想定 | TBD |
| `[env.staging]` `[[env.staging.r2_buckets]]` | TOML 構文として valid | TOML パーサ想定 | TBD |
| 必須キー `binding` / `bucket_name` | 全環境で記載済み | 目視 | TBD |
| CORS JSON 構文 | `JSON.parse` 通過想定 | JSON パーサ想定 | TBD |
| CORS 必須キー | AllowedOrigins / AllowedMethods | 目視 | TBD |
| AllowedOrigins 暫定値マーカー | UT-16 完了後に再設定する旨が併記 | grep | TBD |

## secret hygiene 確認【必須】

| 確認項目 | 期待値 | 確認方法 | 判定 |
| --- | --- | --- | --- |
| Cloudflare Account ID の直書き | なし（参照経路のみ） | grep `[0-9a-f]\{32\}` | TBD |
| API Token 実値の直書き | なし | grep `^token=` 等 | TBD |
| 実 production ドメイン | 暫定 origin のみ（実値はなし） | grep | TBD |
| `.env` ファイルへの参照誘導 | 1Password / Cloudflare Secrets / GitHub Secrets 経由のみ | 目視 | TBD |

## AC 充足見込み（Phase 10 への引き継ぎ）

| AC | 主担当 Phase | 充足見込み | 根拠 |
| --- | --- | --- | --- |
| AC-1 | Phase 5 / Phase 8 | TBD | 命名整合表（Phase 8） |
| AC-2 | Phase 2 / Phase 5 / Phase 8 | TBD | wrangler-toml-diff / dry-applied-diff |
| AC-3 | Phase 2 / Phase 5 | TBD | token-scope-decision |
| AC-4 | Phase 11 | TBD | Phase 11 で実地手順検証 |
| AC-5 | Phase 2 / Phase 6 | TBD | cors-policy-design / 異常系 |
| AC-6 | Phase 2 / Phase 5 | TBD | モニタリング方針章 |
| AC-7 | Phase 5 | TBD | binding-name-registry |
| AC-8 | Phase 2 / Phase 5 | TBD | アクセス方針章 + UT-17 連携 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC matrix の最終整合確認 |
| Phase 8 | DRY 化後の構造に対する構文検証 |
| Phase 10 | qa-result.md を GO/NO-GO 判定の根拠として使用 |
| Phase 11 | secret hygiene 維持を smoke test 手順設計に申し送る |

## 多角的チェック観点

- 価値性: 参照ドキュメントが Phase 10 / Phase 11 / Phase 12 で確実に辿れるか
- 実現性: docs-only タスクとして実環境 CLI を使わずに構文妥当性を担保できているか
- 整合性: AC matrix・命名整合表・DRY 後構造が三者矛盾していないか
- 運用性: 機密情報を含めずに後続タスクへ手順を渡せるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | line budget 確認 | 9 | pending |
| 2 | link checker | 9 | pending |
| 3 | mirror parity 確認 | 9 | pending |
| 4 | wrangler.toml 構文検証 | 9 | pending |
| 5 | CORS JSON 構文検証 | 9 | pending |
| 6 | secret hygiene 確認 | 9 | pending |
| 7 | AC 充足見込み判定 | 9 | pending |
| 8 | qa-result.md 作成 | 9 | pending |

## 完了条件（受入条件 + AC 紐付け）

- [ ] line budget / link checker / mirror parity が全 PASS（全 AC 共通の前提）
- [ ] wrangler.toml / CORS JSON の構文検証 PASS（AC-2 / AC-5）
- [ ] secret hygiene が全項目 PASS
- [ ] AC-1〜AC-8 の充足見込みが TBD でない
- [ ] qa-result.md に Phase 10 向け申し送り（残課題 / MINOR 候補）が記載

## レビューポイント / リスク / 落とし穴

- 行数閾値超過は読みやすさ低下のサイン → 章単位で別ファイル化を Phase 10 で判断
- リンク切れの主因は outputs パス命名の typo → Phase 12 ファイル名照合チェック（unassigned-task-detection.md 等）と連動
- AllowedOrigins の暫定値が放置されると UT-16 完了後に MINOR が積み残る → Phase 12 implementation-guide に追記
- secret hygiene は Phase 11 / Phase 13 でも再確認（多重防御）

## 次フェーズへの引き渡し

- 次: 10 (最終レビュー)
- 引き継ぎ事項: qa-checklist.md / qa-result.md / 線数判定表 / 構文検証結果 / secret hygiene 判定
- ブロック条件: 構文検証 / secret hygiene のいずれかに FAIL がある場合は Phase 10 に進まない
