# Phase 1 成果物: 要件定義 (requirements.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 / Cloudflare R2 ストレージ設定 |
| Phase | 1 / 13 (要件定義) |
| 作成日 | 2026-04-27 |
| タスク種別 | spec_created（docs-only / 実装は将来のファイルアップロード実装タスクで実施） |
| 状態 | completed |

## 1. 真の論点

UT-12 で確定すべき真の論点は以下の 5 つ。Phase 2 設計の入力となる。

1. **R2 バケット作成タイミング**: ファイルアップロード機能の計画に紐付けて先行設計のみを行い、バケット実体作成は将来タスクへ委譲する境界を明確化する（spec_created の根拠）。
2. **API Token 戦略**: 既存 Token に R2:Edit を追加する案A（Token 拡張）と専用 R2 Token を新規作成する案D（Token 分離）のいずれが最小権限原則に整合するか。Phase 2 で採用案D（専用 Token）を採る前提で本 Phase では論点として確定。
3. **CORS 再設定経路**: UT-16（カスタムドメイン）完了後に AllowedOrigins を本番値に差し替える運用フローを Phase 2 設計と Phase 12 implementation-guide に組み込めるか。
4. **無料枠超過リスク**: Class B ops 1 億回/月、Storage 10GB、Class A 1,000 万回/月 のいずれの閾値が画像配信用途で逼迫するか。UT-16（モニタリングアラート）との連携経路を Phase 2 で具体化する。
5. **不変条件 5 の維持**: D1/R2 直接アクセスは `apps/api` のみ。`apps/web/wrangler.toml` への R2 バインディング追加を絶対に行わない設計境界を全 Phase に伝達する。

## 2. スコープ

### 含む（本タスク docs で確定する範囲）

- 環境別 2 バケット (`ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`) の命名と作成 runbook
- `apps/api/wrangler.toml` の `[env.production]` / `[env.staging]` への `[[r2_buckets]]` バインディング追記差分（バインディング名は `R2_BUCKET` 全環境共通）
- API Token スコープ判断（採用案D: 専用 Token 新規作成 / GitHub Secrets 名 `CLOUDFLARE_R2_TOKEN`）
- CORS ポリシー JSON 設計（環境別 AllowedOrigins / AllowedMethods / AllowedHeaders）
- パブリック / プライベート選択基準（採用案F: プライベート + Presigned URL）
- 無料枠モニタリング方針 (Storage / Class A / Class B の 80% 閾値) と UT-17 連携経路
- 下流タスク向け binding-name-registry.md（Phase 5）

### 含まない（本タスクでは扱わない）

- ファイルアップロード機能の実装コード（将来の `future-file-upload-implementation` タスク）
- Presigned URL 発行ロジックの実装コード（同上）
- CDN / キャッシュ設定（別タスク）
- 画像リサイズ / 変換処理（アプリケーション層）
- カスタムドメイン適用（UT-16）
- 通知 / アラート実体（UT-16）
- 実 R2 バケットの本番作成・実 Token 発行（将来タスク / runbook の手順整備のみ本タスクで完結）

## 3. タスク種別判定（要約）

- 種別: `spec_created` / `docs-only`
- 根拠: GitHub Issue #15 が CLOSED で運用中のため、再オープンせず仕様書として正式化する。実バケット作成・実 Token 発行は本タスクでは行わず、将来のファイルアップロード実装タスクで Phase 5 runbook を再生して実行する。
- 詳細: 同 Phase の `task-type-decision.md` 参照。

## 4. 受入条件 (AC-1〜AC-8) と Phase 紐付け

| AC | 内容 | 主担当 Phase | 補完 Phase |
| --- | --- | --- | --- |
| AC-1 | バケット命名 (`ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`) | Phase 5 | Phase 2, Phase 8 |
| AC-2 | wrangler.toml `[[r2_buckets]]` バインディング差分 | Phase 5 | Phase 2, Phase 8 |
| AC-3 | API Token 最小権限（採用案D: 専用 Token 新規作成） | Phase 5 | Phase 2, Phase 3 |
| AC-4 | Workers から R2 への smoke test (PUT/GET) | Phase 11 | Phase 4, Phase 5, Phase 6 |
| AC-5 | CORS 設定 JSON と適用確認手順 | Phase 5 | Phase 2, Phase 6 |
| AC-6 | 無料枠モニタリング方針 + UT-17 連携 | Phase 5 | Phase 2, Phase 12 |
| AC-7 | binding-name-registry.md による下流公開 | Phase 5 | Phase 12 |
| AC-8 | パブリック/プライベート選択基準 + UT-17 連携 | Phase 5 | Phase 2 |

## 5. 4条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 将来のファイルアップロード機能で R2 設計が完成済みであることが価値を生むか | PASS | 設計完了により実装着手時の調査ゼロ化、Phase 5 runbook 再生で 1 営業日以内に環境構築可能 |
| 実現性 | 無料枠と既存 wrangler / API Token の枠内で R2 設定が完結するか | PASS | 10GB / 1,000万 Class A / 1億 Class B は MVP 想定トラフィック (会員数 < 1,000、月間 PV < 10万) に対し十分。wrangler 3.x は R2 をネイティブサポート |
| 整合性 | 01b 命名トポロジー・Token スコープと矛盾なく設計できるか | PASS | 命名 `ubm-hyogo-r2-{prod,staging}` は 01b の `ubm-hyogo-<resource>-<env>` 規約に整合。専用 R2 Token は token-scope-matrix.md の最小権限原則に整合 |
| 運用性 | 無料枠超過監視・CORS 再設定・Token rollback 手順が運用に乗るか | PASS（条件付き） | UT-17 未着手のため通知経路は将来宿題として MINOR 申し送り。Phase 12 implementation-guide に追記する |

## 6. 既存資産インベントリ

| 項目 | 確認内容 | 現状 |
| --- | --- | --- |
| `apps/api/wrangler.toml` | 既存 R2 バインディング | なし（期待通り） |
| `apps/web/wrangler.toml` | 既存 R2 バインディング | なし（不変条件 5 維持） |
| Cloudflare API Token | R2:Edit スコープ | 既存 Token には未付与（01b token-scope-matrix.md 参照） |
| Cloudflare Account ID | 確定済み実値 | 1Password / Cloudflare Secrets 経由のみ参照（直書き禁止） |
| 命名トポロジー | `ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging` | 01b 命名規約に整合 |
| GitHub Secrets | R2 関連 secret | 04 タスクで `CLOUDFLARE_R2_TOKEN` を Phase 5 着手前に登録予定 |

## 7. carry-over（上流からの引き継ぎ）

| 引き継ぎ元 | 成果物 | 本タスクでの利用 |
| --- | --- | --- |
| 01b-parallel-cloudflare-base-bootstrap | outputs/phase-05/token-scope-matrix.md | API Token スコープ判断（AC-3）の根拠 |
| 01b-parallel-cloudflare-base-bootstrap | outputs/phase-05/cloudflare-bootstrap-runbook.md | バケット作成手順 / Account ID 取得経路の参照 |
| 04-serial-cicd-secrets-and-environment-sync | index.md | GitHub Secrets / Variables 登録経路 (AC-3 / AC-7) |

## 8. open question（次 Phase に申し送り）

- UT-16 が未着手の場合の通知経路代替案（Cloudflare Analytics 直視で当面運用可とするか）→ Phase 2 r2-architecture-design.md のモニタリング章で確定
- UT-16 完了予定が未確定のため、AllowedOrigins の暫定値表現を `<env-specific-origin>` プレースホルダに統一する旨を Phase 2 で明文化
- production 環境への実書き込み smoke test の是非は Phase 3 レビューで PASS 判定（staging 限定で AC-4 充足とする）

## 9. 完了条件チェック

- [x] 真の論点・依存境界が確定している
- [x] タスクタイプ判定（spec_created / docs-only）が文書化されている（`task-type-decision.md`）
- [x] 4条件評価が全て TBD でない
- [x] AC-1〜AC-8 が担当 Phase に紐付けられている
- [x] 既存資産インベントリが作成されている
- [x] Phase 2 への carry-over 内容が明記されている

## 10. 次 Phase への引き渡し

- 入力: 本書 + `scope-definition.md` + `task-type-decision.md`
- Phase 2 で確定すべき設計事項: R2 アーキテクチャ図 / wrangler.toml 差分 / Token 採用案D 詳細 / CORS JSON / モニタリング方針
- ブロック条件解除: 4条件評価が全 PASS につき GO 判定
