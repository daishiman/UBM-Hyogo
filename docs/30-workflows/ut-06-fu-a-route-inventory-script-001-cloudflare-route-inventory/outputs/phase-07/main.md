# Phase 7 成果物: 統合テスト（API mock integration strategy）

> 本タスクは **docs-only / infrastructure-automation** であり、本 Phase 7 ではテストコードを生成しない。
> route inventory script の **統合テスト戦略** を仕様レベルで確定し、受け側実装タスク（`UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001`）への handoff baseline として固定する。
> production / staging Cloudflare API の **実打ちは本 Phase で行わない**。Cloudflare API mock（fetch mock）に対する deterministic な fixture 検証で完結する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13（統合テスト・statement-level integration spec） |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #328 |

## 検証観点（3 軸固定）

1. **API mock 整合性**: route list / workers list / custom domain list の 3 種 Cloudflare API レスポンスを fixture として注入し、inventory builder が期待 JSON / Markdown を生成
2. **secret-leak 不在**: 出力ファイル（JSON / Markdown）に OAuth token / API token / `Bearer ` prefix / `CLOUDFLARE_API_TOKEN` 値が含まれない
3. **mismatch detection**: `ubm-hyogo-web-production` 以外の Worker target を含む fixture を投入したとき `InventoryReport.mismatches` に分離される

## test pyramid 上の位置づけ

| 層 | 本 Phase での扱い |
| --- | --- |
| 単体（pure builder） | Phase 6 異常系で確定済 |
| 統合（API mock + builder） | **本 Phase の対象** |
| smoke（実 production read API） | Phase 8 で 1 回手動 |
| E2E（UI） | NON_VISUAL のため対象外 |

## Cloudflare API mock 戦略

| 観点 | 方針 |
| --- | --- |
| mock 手段 | `fetch` を `vi.spyOn(globalThis, 'fetch')` 等で差し替え（実装手段は受け側決定。spec では deterministic 要件のみ固定） |
| 対象 endpoint | Phase 2 §2 api-allowlist の 3 件（`GET /accounts/{account_id}/workers/scripts`, `GET /zones/{zone_id}/workers/routes`, `GET /accounts/{account_id}/workers/domains`） |
| 認証情報 | mock 経路では token を空文字 or `token-not-required-in-mock` placeholder に固定し、実値混入を防ぐ |
| ネットワーク到達 | mock により `api.cloudflare.com` への実 fetch が発火しないことを test 終端で assert（fetch call count 検証） |
| 失敗系 | 401 / 403 / 429 / 5xx を別 fixture で注入し、inventory builder が silent fallback せず error を伝播することを検証 |

## inventory builder 統合テストケース（TC-INT-01〜06）

| TC# | 入力 fixture | 期待出力 | 検証観点 |
| --- | --- | --- | --- |
| TC-INT-01 | route list / workers list / custom domain list すべて `ubm-hyogo-web-production` のみ | JSON `mismatches: []`, Markdown「split-brain なし」 | 正常系 |
| TC-INT-02 | route list に旧 Worker 1 件追加 | JSON `mismatches[]` に旧 Worker entry / Markdown「target Worker 不一致」 | mismatch detection（旧 Worker 残存） |
| TC-INT-03 | custom domain list に target script 未設定 domain を 1 件含む | JSON `mismatches[]` に `targetWorker: "<missing-script-binding>"` 相当で分離 | mismatch detection（custom domain target missing） |
| TC-INT-04 | workers list に `ubm-hyogo-web-production` 不在 | inventory builder が error（silent 0 件出力ではない） | 異常系（target Worker 不在 / EX-3） |
| TC-INT-05 | API mock が 401 を返す | inventory builder が auth error 伝播・出力ファイル生成しない | 認証失敗系（EX-1） |
| TC-INT-06 | API mock が 429 を返す | inventory builder が rate-limit error 伝播 | rate-limit 系（EX-2） |

## secret-leak 検出仕様

| 検出対象 | 正規表現 | 期待件数 |
| --- | --- | --- |
| `Bearer ` prefix | `Bearer\s+[A-Za-z0-9._-]+` | 0 件 |
| `CLOUDFLARE_API_TOKEN` 直書き | `CLOUDFLARE_API_TOKEN\s*[:=]\s*\S+` | 0 件 |
| Cloudflare API token 形式 | `[A-Za-z0-9_-]{40,}`（誤検知抑止のため allowlist と組み合わせ） | 0 件 |
| OAuth token プレフィックス | `ya29\.`, `ghp_`, `gho_` 等 | 0 件 |
| 1Password 参照記法 | `op://[^ ]+` | 出現 OK（参照記法のため mask 不要） |

> grep は出力 JSON / Markdown / log の 3 種類すべてに対して実施する。

## mismatch detection 仕様

| ケース | 入力 | 期待出力 |
| --- | --- | --- |
| split-brain（旧 Worker に route 残存） | route の `script` フィールドが `ubm-hyogo-web-production` 以外 | `mismatches[]` に同じ `RouteInventoryEntry` を入れ、`notes` に `legacy-worker-target` を記録 |
| custom domain target missing | custom domain entry に script 不在 / 存在しない script | JSON `mismatches[]` に `targetWorker` を placeholder 格納 |
| no-route warning | `ubm-hyogo-web-production` に紐付く route 0 件 | `notes` または Markdown summary に `no-routes-bound`（正本 schema には `warnings[]` を追加しない） |

## production / staging 実打ち境界（再掲）

- 本 Phase では production / staging Cloudflare API への実 fetch を行わない（fixture と mock のみ）
- 実打ちが必要な evidence は Phase 8（NON_VISUAL smoke）で `bash scripts/cf.sh` 経由 1 回手動取得
- CI 内で production API token を使って実 fetch する設計は **明示的に禁止**（rate limit / token leakage 防止）
- test 内に `bash scripts/cf.sh` 直接呼び出しは含めない（実打ちは Phase 8 のみ）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | mock テストで担保した builder ロジックを production read-only API smoke 1 回で実証 |
| Phase 9 | staging fixture（`ubm-hyogo-web-staging` 等）に差し替えても mismatch detection が成立することを確認 |
| Phase 10 | TC-INT-01〜06 全 PASS と secret-leak 0 件を Design GO/NO-GO 根拠に使用 |
| Phase 11 | 本 Phase で確定した出力 JSON 形式を手動実行 evidence の比較基準に使用 |
| 受け側実装タスク | TC-INT-01〜06 を受け側 test の最低ライン（receiving baseline）として handoff |

## 多角的チェック観点

- 価値性: API mock により production API を消費せず inventory builder の信頼性を担保
- 実現性: `fetch` mock は標準的手法・追加依存ゼロ
- 整合性: Phase 6 異常系（EX-1〜EX-5）と TC-INT-04〜06 が 1:1 対応
- 運用性: CI 上で deterministic に再実行可能（外部 API 非依存）
- 認可境界: production / staging 実打ちが本 Phase 内に存在しない
- セキュリティ: 出力ファイルへの secret 混入を grep で機械検証
- 無料枠: 本 Phase は Cloudflare API quota を消費しない

## 完了条件

- [x] TC-INT-01〜06 が入力 fixture 種別 / 期待出力種別 / 検証観点の 3 列で埋まる
- [x] secret-leak 検出正規表現が 4 種類以上列挙
- [x] mismatch detection ケースが split-brain / custom domain target missing / no-route warning の 3 種類で表化
- [x] production / staging 実打ち非実行が本仕様書本文に明示
- [x] 出力 JSON / Markdown 形式に実 token 値が含まれる経路がゼロ
- [x] `bash scripts/cf.sh` 経由ルールが test 内呼び出しから外れている（実打ちは Phase 8）
- [x] AC-1〜AC-5 と TC-INT-01〜06 のトレース表（`ac-matrix.md`）を別ファイルで提供

## 次 Phase への引き渡し

- Phase 8 (NON_VISUAL smoke): TC-INT-01〜06 / mismatch / secret-leak grep を実値突合の比較基準として使用
- 受け側実装タスク: TC-INT-01〜06 を test baseline として handoff
