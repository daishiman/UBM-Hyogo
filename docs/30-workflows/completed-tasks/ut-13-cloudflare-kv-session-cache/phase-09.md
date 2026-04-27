# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare KV セッションキャッシュ設定 (UT-13) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-27 |
| 前 Phase | 8 (設定 DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |

## 目的

KV namespace 設定が無料枠制約・最終的一貫性制約・secret hygiene の観点で問題がないことを確認し、docs-only タスクとして記録・参照ドキュメントの品質を担保する。

## 実行タスク

- Cloudflare KV 無料枠制約（write 1,000/day, read 100,000/day）と運用方針の整合を確認する
- KV 最終的一貫性（最大 60 秒）に対する設計指針が記録されているか確認する
- KV Namespace ID 等の機密情報がリポジトリにコミットされていないか確認する
- secret hygiene ルール（CLAUDE.md / memory feedback_no_doc_for_secrets）の遵守を確認する
- wrangler.toml の lint / 環境別バインディング不整合の有無を確認する
- 設定ドキュメントの品質基準適合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | KV 無料枠制約・Cloudflare 設定方針 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md | タスク概要・スコープ確認 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-08/dry-config-policy.md | DRY 化後の設定構造 |
| 参考 | CLAUDE.md | シークレット管理方針 |
| 参考 | .claude/projects/-Users-dm-dev-dev------UBM-Hyogo/memory/feedback_no_doc_for_secrets.md | 機密情報非記載ルール |

## 実行手順

### ステップ 1: 無料枠制約確認

- Cloudflare KV の無料枠制限（write 1,000/day, read 100,000/day, ストレージ 1 GB）を確認する
- セッション TTL・キャッシュ TTL が無料枠を超過しない write 頻度に収まるか試算する
- 同時接続数増加時の read 頻度が無料枠内に収まる設計指針を確認する

### ステップ 2: Secret hygiene 確認

- wrangler.toml にコミット禁止の機密情報（実 KV Namespace ID）が含まれていないことを確認する
- ドキュメント・成果物に KV Namespace ID / Account ID / API Token が記載されていないことを確認する
- 1Password / Cloudflare Secrets / GitHub Secrets の使い分けを文書化する
- `.env` ファイルやソースコードへの機密情報混入がないことを確認する

### ステップ 3: wrangler.toml 整合性確認

- production / staging のバインディング名が `SESSION_KV` で一致していることを確認する
- 環境別 namespace ID プレースホルダーが取り違えなく記載されていることを確認する
- preview_id が local 開発用として正しく設定されているか確認する

### ステップ 4: ドキュメント品質確認

- 各 Phase の成果物ドキュメントが品質基準を満たしているか確認する
- 参照リンク切れがないか確認する
- Phase 10 の GO/NO-GO 判定に必要な情報が揃っているか確認する

## 無料枠確認【必須】

| 制約項目 | 無料枠上限 | KV セッションキャッシュへの影響 | 判定 |
| --- | --- | --- | --- |
| KV write / day | 1,000 | セッション作成・更新の頻度を試算し収まるか | DOCUMENTED |
| KV read / day | 100,000 | セッション検証時の read 頻度を試算し収まるか | DOCUMENTED |
| KV ストレージ | 1 GB | セッションペイロード × 同時セッション数で試算 | DOCUMENTED |
| KV キー数 | 無制限（実用上） | TTL 失効により自動削除 | PASS |
| Workers 実行時間 | 10ms CPU time (Free) | KV API 呼び出しコストは I/O 待ちで CPU 影響軽微 | PASS |

## 最終的一貫性制約への設計指針【必須】

| 観点 | 制約内容 | 設計指針 | 判定 |
| --- | --- | --- | --- |
| グローバル伝搬遅延 | 最大 60 秒 | 同一セッションの read-after-write を即時前提にしない | DOCUMENTED |
| セッション失効 | TTL 失効後も短時間 read される可能性 | 期限超過チェックを Worker 側でも行う | DOCUMENTED |
| 削除操作 | delete 後も最大 60 秒 read される可能性 | ログアウト時はサーバー側 deny list を併用するか方針を記録 | DOCUMENTED |
| TTL 設定 | 最小 60 秒（KV の最終的一貫性以下に設定しない） | 設計指針として最小 TTL を 60 秒以上に設定 | DOCUMENTED |

## Secret hygiene 確認【必須】

| 確認項目 | 方針 | 状態 |
| --- | --- | --- |
| KV Namespace ID のコミット | wrangler.toml にはプレースホルダーで記録し、実値は Cloudflare Dashboard / 1Password で管理 | completed |
| Account ID / API Token | wrangler.toml には記載しない。Cloudflare Secrets / GitHub Secrets で管理 | completed |
| ドキュメント内の機密情報 | KV ID / Account ID をドキュメントに記載しない（feedback_no_doc_for_secrets ルール） | completed |
| .env ファイル | リポジトリにコミットしない。正本は 1Password Environments | completed |
| バインディング名 | `SESSION_KV` 等の binding 名は機密情報ではない。コミット可 | PASS |
| TTL 値 | 設計値は機密情報ではない。コミット可 | PASS |

## wrangler.toml 整合性チェック

| チェック項目 | 期待値 | 確認方法 |
| --- | --- | --- |
| バインディング名の一貫性 | 全環境 `SESSION_KV` | wrangler.toml レビュー |
| 環境別 namespace ID の取り違えなし | staging / production それぞれに正しい ID プレースホルダー | wrangler.toml 確認 |
| preview_id の設定 | local 開発用に preview_id 設定あり | wrangler.toml 確認 |
| TTL 値の集中管理 | `[vars]` セクションで一元管理 | wrangler.toml 確認 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook の secret hygiene 遵守確認 |
| Phase 10 | 品質保証の結果を GO/NO-GO 判定に反映 |
| Phase 12 | ドキュメント品質確認結果を close-out に記録 |

## 多角的チェック観点（AIが判断）

- 価値性: 品質保証により下流タスク（認証実装等）の手戻りリスクが下がるか。
- 実現性: 無料枠内で KV セッションキャッシュ運用が完結する設計か。
- 整合性: secret hygiene ルールが CLAUDE.md / memory feedback_no_doc_for_secrets と一致しているか。
- 運用性: 本番運用で KV ID 取り違えや secret leakage が起きない構造になっているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠制約確認 | 9 | completed | KV write/read/storage の試算 |
| 2 | 最終的一貫性設計指針確認 | 9 | completed | AC-7 充足確認 |
| 3 | secret hygiene 確認 | 9 | completed | KV ID 管理方針 |
| 4 | wrangler.toml 整合性確認 | 9 | completed | バインディング名・環境別 ID |
| 5 | ドキュメント品質確認 | 9 | completed | 参照リンク・内容整合 |
| 6 | 品質保証レポート作成 | 9 | completed | outputs/phase-09/quality-report.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/quality-report.md | 無料枠確認・最終的一貫性指針・secret hygiene 確認の結果レポート |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- 無料枠制約の全項目が PASS / 試算根拠あり
- 最終的一貫性制約への設計指針が記録されている
- secret hygiene の全確認項目が完了している
- wrangler.toml 整合性チェックが完了している
- ドキュメント品質確認が完了しており Phase 10 に必要な情報が揃っている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: 無料枠 PASS・最終的一貫性指針・secret hygiene 確認結果・ドキュメント品質確認結果を Phase 10 に引き継ぐ。
- ブロック条件: 無料枠確認・secret hygiene 確認・最終的一貫性指針のいずれかに未解決の問題がある場合は Phase 10 に進まない。
