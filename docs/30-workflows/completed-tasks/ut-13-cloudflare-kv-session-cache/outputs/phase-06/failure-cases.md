# Phase 6: failure cases と mitigation 手順

## failure cases 一覧

| ID | ケース名 | 重大度 | 再現性 | mitigation 概要 |
| --- | --- | --- | --- | --- |
| FC-01 | 最終的一貫性によるリードバック遅延 | MEDIUM | 高 | 即時反映が必要なデータは D1 / Durable Objects を使用 |
| FC-02 | 無料枠枯渇（write 1k/日 超過） | HIGH | 中 | セッションごと書き込み禁止、用途縮退 |
| FC-03 | バインディング名取り違え | CRITICAL | 中 | 1Password 経由で実 ID 注入、CI で整合確認 |
| FC-04 | TTL 失効後の null 返却 | LOW | 高 | 全 read 箇所で null チェック必須化 |
| FC-05 | Namespace ID をリポジトリにコミット | HIGH | 低 | pre-commit hook + 1Password 管理徹底 |
| FC-06 | セッションごと KV 書き込みによる無料枠枯渇 | HIGH | 中 | JWT 主・KV はブラックリスト限定設計 |

## FC-01: 最終的一貫性によるリードバック遅延

| 項目 | 内容 |
| --- | --- |
| ケース名 | put 直後の get で旧値（または null）が返る |
| 発生条件 | 同一キーへの put と異なるリージョン/コロケーションからの get がほぼ同時に発生する場合。書き込み伝搬は最大 60 秒 |
| 症状 | put 直後にユーザーがアクセスし、別エッジから古い値（または未存在）が返ることで、機能上の不整合（セッション未確立等）が発生 |
| 再現方法 | staging で `SESSION_KV.put(key, v1)` 直後に別リージョン経由の `wrangler kv:key get` を 1〜10 秒以内に実行し、stale データが返ることを観測 |
| mitigation | 即時反映が必要なデータは KV を使わず D1 / Durable Objects を使用する設計指針を AC-7 として明文化（outputs/phase-02/eventual-consistency-guideline.md）。put 直後の read-after-write を前提とした実装を禁止 |
| 防止策 | コードレビューで「put 直後 get」パターンを禁止する lint / レビュー観点を整備（eventual-consistency-guideline.md「違反検出」セクション） |

## FC-02: 無料枠枯渇（write/day 1,000 超過）

| 項目 | 内容 |
| --- | --- |
| ケース名 | 1 日あたり write 1,000 件を超過 |
| 発生条件 | セッションごとの書き込み・頻繁な設定キャッシュ更新・レートリミット書き込み多発 |
| 症状 | Cloudflare 側で書き込みが拒否され、HTTP エラー（429 想定）または書き込み無効化。セッション維持・キャッシュ更新が機能停止 |
| 再現方法 | 検証用エンドポイントから write を高頻度実行し、Cloudflare ダッシュボードのメトリクスで 1,000 件到達後の挙動を観測 |
| mitigation | セッションごと書き込みを廃し、TTL 延長 / バッチ更新 / 差分のみ更新に切り替える。レートリミットは Durable Objects への移行を検討（free-tier-policy.md「枯渇時のフォールバック」） |
| 防止策 | AC-5 の無料枠運用方針を明文化し、write/day を監視するアラートを設定する（運用タスクで実施） |

## FC-03: バインディング名取り違え（production binding を staging で参照）

| 項目 | 内容 |
| --- | --- |
| ケース名 | wrangler.toml で `[env.staging]` セクションに production の Namespace ID を誤って記載 |
| 発生条件 | Namespace ID の手動コピー時の取り違え、または環境変数注入時のキー入れ違い |
| 症状 | staging からの操作が production KV に反映され、本番データ汚染。本番混入リスク |
| 再現方法 | テスト環境で意図的に production ID を staging に設定し、書き込みが production 側に反映されることを確認（実施は破壊的なため禁止、机上検証のみ） |
| mitigation | Namespace ID を 1Password から CI 経由で注入する仕組みに統一し、手動コピーを禁止。デプロイ前に `wrangler kv:namespace list --env <env>` で binding と ID の整合を確認 |
| 防止策 | Phase 5 sanity check の「機密管理確認」と「Namespace 存在確認」を CI に組み込む |

## FC-04: TTL 失効後の read で null 返却

| 項目 | 内容 |
| --- | --- |
| ケース名 | TTL 経過後の get が null を返し、呼び出し側がエラー処理していない |
| 発生条件 | `expirationTtl` で設定した秒数経過後の read |
| 症状 | セッションキャッシュが消滅した状態で get → null が返り、null チェック未実装の場合に NPE / 認証失敗 |
| 再現方法 | `SESSION_KV.put(k, v, { expirationTtl: 60 })` 後、61 秒以上待って `SESSION_KV.get(k)` を実行し null が返ることを確認 |
| mitigation | 全ての read 箇所で null チェックを必須化。TTL 失効時の再生成フォールバック（D1 から再構築）を実装 |
| 防止策 | TTL 設計方針（用途別 TTL 表）を AC-4 として明文化（ttl-policy.md）し、読み出し側のフォールバック設計を Phase 8 以降の実装ガイドに含める |

## FC-05: Namespace ID をリポジトリにコミット

| 項目 | 内容 |
| --- | --- |
| ケース名 | `apps/api/wrangler.toml` 以外のドキュメント・成果物に実 Namespace ID を記述してコミット |
| 発生条件 | Phase 5 runbook の機密管理ステップを省略 |
| 症状 | リポジトリ閲覧者全員が Namespace ID を取得可能となり、外部からの操作リスクが発生 |
| 再現方法 | `git log -p docs/` で 32 桁 hex の Namespace ID が含まれる場合 |
| mitigation | git history からの除去（`git filter-repo` 等）と Namespace 再作成 |
| 防止策 | Phase 5 sanity check の「機密管理確認」を pre-commit hook / CI 必須チェックに組み込む。memory feedback_no_doc_for_secrets ルールを遵守 |

## FC-06: セッションごとの KV 書き込みによる無料枠枯渇

| 項目 | 内容 |
| --- | --- |
| ケース名 | ログイン / 認証ごとに KV へ書き込みを発生させ、write/day を急速に消費 |
| 発生条件 | 1 日のアクティブセッション数 > 1,000 となる設計 |
| 症状 | FC-02 と同じく write 拒否、セッション維持の機能停止 |
| 再現方法 | アクティブユーザー数が想定値（無料枠想定）を超えた場合の write 件数を試算し、1,000/day を超えるシナリオを机上で確認 |
| mitigation | セッション ID は JWT / 署名付き Cookie に格納し、KV 書き込みは「失効リスト（denylist）」のみに限定する設計に変更 |
| 防止策 | AC-5 無料枠運用方針に「セッションごと書き込みを禁止」を明記（free-tier-policy.md）し、Phase 7 AC matrix で検証 |

## 完了条件

- [x] 6 件以上の failure cases がリストアップされている
- [x] 各 failure case に mitigation 手順が記載されている
- [x] 各 failure case に防止策が記載されている

## 次 Phase 引き継ぎ事項

- failure cases 一覧を Phase 7 AC matrix の証跡として登録
- 未解決事項なし → Phase 7 への申し送りはなし
