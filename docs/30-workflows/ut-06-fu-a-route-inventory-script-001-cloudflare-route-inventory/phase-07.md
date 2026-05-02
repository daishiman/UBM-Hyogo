# Phase 7: 統合テスト（API mock / secret leak / mismatch detection）

> **本タスクは docs-only / infrastructure-automation である。** Phase 7 では route inventory script の **統合テスト戦略** を仕様レベルで確定する。Phase 7 自体ではテストコードを生成せず、実装本体タスクへの handoff 仕様として `outputs/phase-07/` 配下に成果物を配置する想定である。production Cloudflare API の実打ちは本 Phase では行わず、**Cloudflare API mock（fetch mock）に対する inventory builder 単体相当の統合検証** と **出力ファイルの secret-leak grep 検証** を組み合わせる。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production Worker route inventory script (UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 統合テスト（API mock / secret leak / mismatch detection） |
| 作成日 | 2026-05-01 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (E2E / NON_VISUAL 代替検証) |
| 状態 | spec_created |
| タスク分類 | infrastructure-automation（statement-level integration spec） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #328 |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001（`docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/`） |
| 受け側 task spec | （実装本体は別 follow-up タスクへ handoff） |

## 目的

route inventory script の信頼性を **Cloudflare API mock に対する統合テスト** で担保する。production Cloudflare API（`api.cloudflare.com/client/v4`）への直接 hit はレート制限と token leakage リスクの両面で本 Phase スコープ外とし、`fetch` を mock した **deterministic な fixture** に対して inventory builder の整合性を検証する。検証観点は次の 3 つに固定する。

1. **API mock 整合性**: route list / workers list / custom domain list の 3 種類の Cloudflare API レスポンスを fixture として注入し、inventory builder が期待 JSON / Markdown を生成すること。
2. **secret-leak 不在**: 出力ファイル（JSON / Markdown）に OAuth token / API token / `Bearer ` prefix / `CLOUDFLARE_API_TOKEN` 値が含まれないこと。
3. **mismatch detection**: `ubm-hyogo-web-production` 以外の Worker target を含む fixture を投入したとき、Phase 2 の `InventoryReport.mismatches` に分離されること。

production / staging への実打ちは Phase 8（NON_VISUAL smoke）と Phase 11（手動 evidence 取得）に分離し、本 Phase では **API mock のみ** で完結する。

## 実行タスク

1. Cloudflare API mock fixture 計画を作成する（完了条件: route list / workers list / custom domain list の 3 種類について、正常系 1 件と mismatch 系 1 件以上が fixture 設計表に列挙される）。
2. inventory builder の統合テスト観点（input → output の整合）を定義する（完了条件: 入力 fixture と期待出力 JSON / Markdown の対応表が確定）。
3. secret-leak grep test の検出パターンを確定する（完了条件: `Bearer `, `CLOUDFLARE_API_TOKEN=`, OAuth token プレフィックス、API token 形式の正規表現が列挙）。
4. mismatch detection test ケースを設計する（完了条件: `ubm-hyogo-web-production` / 旧 Worker / 未紐付 route の 3 ケースが mismatch 配列出力で識別できる expected 表）。
5. production / staging 実打ちを行わない境界を再掲する（完了条件: Phase 1 / 3 と整合する非実行宣言が記述）。
6. テスト実行コマンドの想定形（`pnpm test --filter=<script package>` 等の placeholder）を仮置きする（完了条件: 実装側で確定する旨と、`bash scripts/cf.sh` 直接呼び出しが test 内に含まれないことを明示）。
7. 成果物 2 ファイル（integration-test-spec.md / api-mock-fixtures-plan.md）の章立てを確定する（完了条件: 章タイトルがリスト化）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-001.md | 正本仕様 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-07.md | 親タスク Phase 7（フォーマット踏襲元） |
| 必須 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-11/route-snapshot.md | 検出対象となる split-brain の現状 |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `bash scripts/cf.sh` 経由強制 / 禁止事項 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare 運用規約 |
| 参考 | https://developers.cloudflare.com/api/operations/worker-routes-list-routes | API 仕様（mock fixture の形状把握用） |

## 統合テスト戦略

### test pyramid 上の位置づけ

| 層 | 本 Phase での扱い | 備考 |
| --- | --- | --- |
| 単体（pure builder） | 親 Phase 6（異常系）で確定済 | input parser / output formatter |
| 統合（API mock + builder） | **本 Phase の対象** | fetch mock × inventory builder の end-to-end |
| smoke（実 production read API） | Phase 8 で 1 回手動 | rate limit / token 配慮 |
| E2E（UI） | NON_VISUAL のため対象外 | Phase 8 で代替 |

### Cloudflare API mock 戦略

| 観点 | 方針 |
| --- | --- |
| mock 手段 | `fetch` を `vi.spyOn(globalThis, 'fetch')` などで差し替え（実装側は受け側タスクで決定。Phase 7 spec では mock 手段は規定せず、deterministic である要件のみ固定） |
| 対象 endpoint | Phase 2 `outputs/phase-02/api-allowlist.md` の 3 件（`GET /accounts/{account_id}/workers/scripts`, `GET /zones/{zone_id}/workers/routes`, `GET /accounts/{account_id}/workers/domains`） |
| 認証情報 | mock 経路では token を **空文字列または明示的 placeholder（`token-not-required-in-mock`）** に固定し、実値が test fixture に混入しない |
| ネットワーク到達 | mock により `api.cloudflare.com` への実 fetch が発火しないことを test 終端で assert（fetch call count 検証） |
| 失敗系 | 401 / 403 / 429 / 5xx を別 fixture として注入し、inventory builder が **silent fallback せず error を伝播** することを検証 |

### inventory builder 整合性テストケース

| TC# | 入力 fixture | 期待出力 | 検証観点 |
| --- | --- | --- | --- |
| TC-INT-01 | route list（`ubm-hyogo-web-production` のみ）+ workers list（`ubm-hyogo-web-production` のみ）+ custom domain list（`ubm-hyogo-web-production` のみ） | JSON `mismatch: []`, Markdown「split-brain なし」 | 正常系（split-brain 不在） |
| TC-INT-02 | route list に旧 Worker（rename 前 entity）を 1 件追加 | JSON `mismatch[]` に旧 Worker entry、Markdown に「target Worker 不一致」セクション | mismatch detection（旧 Worker 残存） |
| TC-INT-03 | custom domain list に target script 未設定の domain を 1 件含む | JSON `mismatches[]` に `targetWorker: "<missing-script-binding>"` 相当で分離、Markdown に「custom domain target missing」セクション | mismatch detection（custom domain target missing） |
| TC-INT-04 | workers list に `ubm-hyogo-web-production` が含まれない | inventory builder が error を返す（silent 0 件出力ではない） | 異常系（target Worker 不在） |
| TC-INT-05 | API mock が 401 を返す | inventory builder が auth error を伝播し、出力ファイルを生成しない | 認証失敗系 |
| TC-INT-06 | API mock が 429 を返す | inventory builder が rate-limit error を伝播 | rate-limit 系 |

> 各 TC の **入力 fixture の具体形** は `outputs/phase-07/api-mock-fixtures-plan.md` で確定する。本仕様書では入力種別と期待出力種別のみ固定する。

### secret-leak 検出テスト

| 検出対象 | 正規表現（spec レベル） | 期待件数 |
| --- | --- | --- |
| `Bearer ` prefix | `Bearer\s+[A-Za-z0-9._-]+` | 0 件 |
| `CLOUDFLARE_API_TOKEN` 直書き | `CLOUDFLARE_API_TOKEN\s*[:=]\s*\S+` | 0 件 |
| Cloudflare API token 形式 | `[A-Za-z0-9_-]{40,}`（誤検知抑止のため allowlist と組み合わせる） | 0 件 |
| OAuth token プレフィックス | `ya29\.`, `ghp_`, `gho_` 等の汎用 OAuth token プレフィックス | 0 件 |
| 1Password 参照記法 | `op://[^ ]+` | 出現 OK（参照記法なので mask 不要） |

> grep は出力 JSON / Markdown / log の 3 種類すべてに対して実施する。

### mismatch detection 仕様

| ケース | 入力 | 期待出力 |
| --- | --- | --- |
| split-brain（旧 Worker に route 残存） | route の `script` フィールドが `ubm-hyogo-web-production` 以外 | `mismatches[]` に同じ `RouteInventoryEntry` を入れ、`notes` に `legacy-worker-target` を記録 |
| custom domain target missing | custom domain entry に script が無い、または存在しない script | JSON `mismatches[]` に `targetWorker` を placeholder として格納 |
| no-route warning | `ubm-hyogo-web-production` に紐付く route 0 件 | `notes` または Markdown summary に `no-routes-bound` を記録（正本 schema には `warnings[]` を追加しない） |

## production / staging 実打ち境界（再掲）

- 本 Phase では **production / staging Cloudflare API への実 fetch を行わない**。fixture と mock のみで完結する。
- 実打ちが必要な evidence は Phase 8（NON_VISUAL smoke）で `bash scripts/cf.sh` 経由 1 回だけ手動取得する。
- CI 内で production API token を使って実 fetch する設計は **明示的に禁止** とする（rate limit / token leakage 防止）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | mock テストで担保した builder ロジックを、production read-only API smoke 1 回で実証する |
| Phase 9 | staging fixture（`ubm-hyogo-web-staging` 等）に差し替えた fixture でも mismatch detection が成立することを確認 |
| Phase 10 | TC-INT-01〜06 全 PASS と secret-leak 0 件を Design GO/NO-GO 根拠に使用 |
| Phase 11 | 本 Phase で確定した出力 JSON 形式を、手動実行 evidence の比較基準に使用 |
| 受け側実装タスク | 本 Phase の TC-INT-01〜06 をそのまま実装側のテスト caseの最低ライン（receiving baseline）として handoff |

## 多角的チェック観点

- 価値性: API mock により production API を消費せず inventory builder の信頼性を担保。
- 実現性: `fetch` mock は標準的手法で、追加依存ゼロで成立する。
- 整合性: 親 Phase 6（異常系）で定義した failure case と TC-INT-04〜06 が 1:1 対応する。
- 運用性: CI 上で deterministic に再実行可能（外部 API 非依存）。
- 認可境界: production / staging への実打ちが本 Phase 内に存在しないことが明示されている。
- セキュリティ: 出力ファイルへの secret 混入を grep で機械検証する仕組みが定義されている。
- 無料枠: 本 Phase は Cloudflare API quota を消費しない。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | Cloudflare API mock fixture 計画作成 | spec_created |
| 2 | inventory builder 統合テスト観点定義 | spec_created |
| 3 | secret-leak grep 正規表現確定 | spec_created |
| 4 | mismatch detection ケース設計 | spec_created |
| 5 | production / staging 実打ち非実行境界の再掲 | spec_created |
| 6 | テスト実行コマンド placeholder 仮置き | spec_created |
| 7 | 成果物 2 ファイルの章立て確定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/integration-test-spec.md | 統合テスト戦略 / TC-INT-01〜06 / secret-leak grep 仕様 / mismatch detection 仕様 |
| ドキュメント | outputs/phase-07/api-mock-fixtures-plan.md | route list / workers list / custom domain list の fixture 設計表（key 名のみ・実値プレースホルダなし） |
| メタ | artifacts.json | Phase 7 状態更新 |

## 完了条件

- [ ] TC-INT-01〜06 が入力 fixture 種別 / 期待出力種別 / 検証観点の 3 列で埋まる
- [ ] secret-leak 検出正規表現が 4 種類以上列挙される
- [ ] mismatch detection ケースが split-brain / custom domain target missing / no-route warning の 3 種類で表化される
- [ ] production / staging 実打ち非実行が本仕様書本文に明示される
- [ ] 出力 JSON / Markdown 形式に **実 token 値が含まれる経路がゼロ** であることが grep 仕様で示される
- [ ] `bash scripts/cf.sh` 経由ルールが test 内呼び出しから外されている（実打ちは Phase 8）
- [ ] 成果物 2 ファイルの章立てがリスト化される

## タスク100%実行確認【必須】

- 実行タスク 7 件すべてが `spec_created`
- 成果物 2 ファイルが `outputs/phase-07/` 配下に配置予定
- TC-INT-01〜06 の 6 ケースが定義済
- production / staging 実打ち禁止が Phase 1 / 3 と一貫
- secret 値の **記述例** にも実トークンが登場しないこと（key 名のみ）
- `wrangler` 直叩きが本仕様書内ゼロ件

## 次 Phase への引き渡し

- 次 Phase: 8 (E2E / NON_VISUAL 代替検証)
- 引き継ぎ事項:
  - TC-INT-01〜06 → 受け側実装タスクの test baseline として handoff
  - mismatch detection 仕様 → Phase 8 の手動 smoke で実値突合の比較基準
  - secret-leak grep 仕様 → Phase 8 / Phase 9 の evidence 検証で再利用
  - 出力 JSON 形式 → Phase 11 の手動実行 evidence と比較
- ブロック条件:
  - TC-INT-01〜06 のいずれかが入力 / 期待 / 観点で空セル
  - production API 実打ちが test 戦略に紛れ込む
  - secret-leak 検出パターンが未定義のまま Phase 8 へ進む
