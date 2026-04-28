# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare KV セッションキャッシュ設定 (UT-13) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-27 |
| 前 Phase | 5 (セットアップ実行) |
| 次 Phase | 7 (検証項目網羅性) |
| 状態 | completed |

## 目的

KV の最終的一貫性（書き込み伝搬最大 60 秒）・無料枠枯渇（1,000 write/day, 100,000 read/day）・バインディング名取り違え・TTL 失効など、KV 固有の failure cases を網羅的に検証し、各ケースの mitigation 手順と防止策を確定する。

## 実行タスク

- 最終的一貫性によるリードバック遅延ケースを検証する
- 無料枠枯渇時の挙動（write/day 1,000 超過、read/day 100,000 超過）を確認する
- バインディング名取り違え（production binding を staging で参照等）の挙動を確認する
- TTL 失効後の read 結果（null 返却）を確認する
- 各 failure case の mitigation 手順を記録する
- AC-1〜AC-7 との整合を最終確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/phase-05.md | 実行済みの設定・runbook |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md | AC・苦戦箇所・無料枠制約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | KV 仕様・制限事項 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/phase-02.md | TTL 設計・用途別キープレフィックス |

## 実行手順

### ステップ 1: failure cases のリストアップ

- index.md の苦戦箇所と KV 公式ドキュメントの制約から既知の failure cases を収集する
- TTL 設計・無料枠運用方針から想定される failure cases を追加する

### ステップ 2: 各 failure case の検証

- 下記 failure cases テーブルの各ケースを順番に確認する
- 再現可能なケース（FC-01 / FC-04 等）は実際に再現して結果を記録する
- 再現困難なケース（FC-02 無料枠枯渇等）は発生条件と監視手段を記録する

### ステップ 3: mitigation の確認と AC 最終確認

- 各 failure case の mitigation 手順が動作することを確認する
- AC-1〜AC-7 の全てが Phase 5 の実行結果で達成されていることを最終確認する
- 未解決の failure case は Phase 7 の AC matrix 整合確認に申し送る

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | Phase 5 の実行結果を異常系検証の前提とする |
| Phase 7 | failure cases と AC との整合を Phase 7 で確認 |
| Phase 1 | AC-1〜AC-7 の最終確認に Phase 1 の AC 定義を使用 |

## 多角的チェック観点（AIが判断）

- 価値性: failure cases の mitigation が実運用で使える粒度で記録されているか
- 実現性: 各 failure case の発生条件が特定されているか（再現性 / 監視可能性）
- 整合性: 最終的一貫性・無料枠制約が AC-5 / AC-7 と整合しているか
- 運用性: 無料枠枯渇時のアラート設定など、運用監視へのフィードバックがあるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure cases リストアップ | 6 | completed | index.md 苦戦箇所参照 |
| 2 | 最終的一貫性ケース検証 | 6 | completed | FC-01 |
| 3 | 無料枠枯渇ケース検証 | 6 | completed | FC-02 |
| 4 | バインディング名取り違えケース | 6 | completed | FC-03 |
| 5 | TTL 失効ケース | 6 | completed | FC-04 |
| 6 | Namespace ID 取り違えケース | 6 | completed | FC-05 |
| 7 | セッションごと書き込みケース | 6 | completed | FC-06 |
| 8 | AC 最終確認 | 6 | completed | AC-1〜AC-7 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | failure cases と mitigation 手順 |
| ドキュメント | outputs/phase-06/ac-final-check.md | AC-1〜AC-7 最終確認結果 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 全 failure cases がリストアップされている（最低 4 件）
- 各 failure case に mitigation 手順が記載されている
- AC-1〜AC-7 の最終確認が完了している
- 未解決の failure case がある場合は Phase 7 への申し送り事項に記録されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- AC-1〜AC-7 が全て PASS であることを確認
- 未解決事項がある場合は申し送り先（Phase 7）を明記
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 7 (検証項目網羅性)
- 引き継ぎ事項: failure cases 一覧・AC 最終確認結果・未解決事項を Phase 7 の AC matrix に統合する
- ブロック条件: 致命的な failure case（最終的一貫性に対する設計指針未策定など）が未解決の場合は次 Phase に進まない

## failure cases

### FC-01: 最終的一貫性によるリードバック遅延

| 項目 | 内容 |
| --- | --- |
| ケース名 | put 直後の get で旧値（または null）が返る |
| 発生条件 | 同一キーへの put と異なるリージョン / コロケーションからの get がほぼ同時に発生する場合。書き込み伝搬は最大 60 秒 |
| 症状 | put 直後にユーザーがアクセスし、別エッジから古い値（または未存在）が返ることで、機能上の不整合（セッション未確立等）が発生 |
| 再現方法 | staging で `SESSION_KV.put(key, v1)` 直後に別リージョン経由の `wrangler kv:key get` を 1〜10 秒以内に実行し、stale データが返ることを観測 |
| mitigation | 即時反映が必要なデータは KV を使わず D1 / Durable Objects を使用する設計指針を AC-7 として明文化。put 直後の read-after-write を前提とした実装を禁止 |
| 防止策 | コードレビューで「put 直後 get」パターンを禁止する lint / レビュー観点を整備 |

### FC-02: 無料枠枯渇（write/day 1,000 超過）

| 項目 | 内容 |
| --- | --- |
| ケース名 | 1 日あたり write 1,000 件を超過 |
| 発生条件 | セッションごとの書き込み・頻繁な設定キャッシュ更新・レートリミット書き込み多発 |
| 症状 | Cloudflare 側で書き込みが拒否され、HTTP エラー（429 想定）または書き込み無効化。セッション維持・キャッシュ更新が機能停止 |
| 再現方法 | 検証用エンドポイントから write を高頻度実行し、Cloudflare ダッシュボードのメトリクスで 1,000 件到達後の挙動を観測 |
| mitigation | セッションごと書き込みを廃し、TTL 延長 / バッチ更新 / 差分のみ更新に切り替える。レートリミットは Durable Objects への移行を検討 |
| 防止策 | AC-5 の無料枠運用方針を明文化し、write/day を監視するアラートを設定する |

### FC-03: バインディング名取り違え（production binding を staging で参照）

| 項目 | 内容 |
| --- | --- |
| ケース名 | wrangler.toml で `[env.staging]` セクションに production の Namespace ID を誤って記載 |
| 発生条件 | Namespace ID の手動コピー時の取り違え、または環境変数注入時のキー入れ違い |
| 症状 | staging からの操作が production KV に反映され、本番データ汚染。本番混入リスク |
| 再現方法 | テスト環境で意図的に production ID を staging に設定し、書き込みが production 側に反映されることを確認（実施は破壊的なため禁止、机上検証のみ） |
| mitigation | Namespace ID を 1Password から CI 経由で注入する仕組みに統一し、手動コピーを禁止。デプロイ前に `wrangler kv:namespace list --env <env>` で binding と ID の整合を確認 |
| 防止策 | Phase 5 sanity check の「機密管理確認」と「Namespace 存在確認」を CI に組み込む |

### FC-04: TTL 失効後の read で null 返却

| 項目 | 内容 |
| --- | --- |
| ケース名 | TTL 経過後の get が null を返し、呼び出し側がエラー処理していない |
| 発生条件 | `expirationTtl` で設定した秒数経過後の read |
| 症状 | セッションキャッシュが消滅した状態で get → null が返り、null チェック未実装の場合に NPE / 認証失敗 |
| 再現方法 | `SESSION_KV.put(k, v, { expirationTtl: 60 })` 後、61 秒以上待って `SESSION_KV.get(k)` を実行し null が返ることを確認 |
| mitigation | 全ての read 箇所で null チェックを必須化。TTL 失効時の再生成フォールバック（D1 から再構築）を実装 |
| 防止策 | TTL 設計方針（用途別 TTL 表）を AC-4 として明文化し、読み出し側のフォールバック設計を Phase 8 以降の実装ガイドに含める |

### FC-05: Namespace ID をリポジトリにコミット

| 項目 | 内容 |
| --- | --- |
| ケース名 | `apps/api/wrangler.toml` に実 Namespace ID を直接記述してコミット |
| 発生条件 | Phase 5 runbook の機密管理ステップを省略 |
| 症状 | リポジトリ閲覧者全員が Namespace ID を取得可能となり、外部からの操作リスクが発生 |
| 再現方法 | `git log -p apps/api/wrangler.toml` で 32 桁 hex の Namespace ID が含まれる場合 |
| mitigation | git history からの除去（`git filter-repo` 等）と Namespace 再作成 |
| 防止策 | Phase 5 sanity check の「機密管理確認」を pre-commit hook / CI 必須チェックに組み込む |

### FC-06: セッションごとの KV 書き込みによる無料枠枯渇

| 項目 | 内容 |
| --- | --- |
| ケース名 | ログイン / 認証ごとに KV へ書き込みを発生させ、write/day を急速に消費 |
| 発生条件 | 1 日のアクティブセッション数 > 1,000 となる設計 |
| 症状 | FC-02 と同じく write 拒否、セッション維持の機能停止 |
| 再現方法 | アクティブユーザー数が想定値（無料枠想定）を超えた場合の write 件数を試算し、1,000/day を超えるシナリオを机上で確認 |
| mitigation | セッション ID は JWT / 署名付き Cookie に格納し、KV 書き込みは「失効リスト（denylist）」のみに限定する設計に変更 |
| 防止策 | AC-5 無料枠運用方針に「セッションごと書き込みを禁止」を明記し、Phase 7 AC matrix で検証 |

## AC 最終確認

| AC | 内容 | 確認状態 | 確認方法 |
| --- | --- | --- | --- |
| AC-1 | KV Namespace 作成（prod/staging） | DOCUMENTED | `wrangler kv:namespace list` で両環境の Namespace を確認 |
| AC-2 | wrangler.toml バインディング設定 | DOCUMENTED | `grep -A3 "kv_namespaces" apps/api/wrangler.toml` |
| AC-3 | Workers からの read/write 動作確認 | DOCUMENTED | outputs/phase-05/read-write-verification.md を確認 |
| AC-4 | TTL 設定方針ドキュメント化 | DOCUMENTED | outputs/phase-02/ttl-policy.md の存在を確認 |
| AC-5 | 無料枠運用方針明文化 | DOCUMENTED | outputs/phase-02/free-tier-policy.md の存在を確認 |
| AC-6 | Namespace/バインディング名 下流タスク向けドキュメント化 | DOCUMENTED | outputs/phase-05/kv-binding-mapping.md を確認 |
| AC-7 | 最終的一貫性制約の設計指針明記 | DOCUMENTED | outputs/phase-02/eventual-consistency-guideline.md を確認 |
