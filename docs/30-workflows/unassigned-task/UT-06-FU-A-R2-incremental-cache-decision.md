# UT-06-FU-A-R2-CACHE: OpenNext R2 incremental cache 採用判断 - タスク指示書

> **検出 ID**: UNASSIGNED-FU-A-001
> **発生元**: `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/outputs/phase-12/unassigned-task-detection.md`

## メタ情報

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | UNASSIGNED-FU-A-001 (内部識別: UT-06-FU-A-R2-CACHE-001)                              |
| タスク名     | OpenNext on Cloudflare の R2 incremental cache 採用可否判断と設計                     |
| 分類         | followup / decision（インフラ判断・設計検討）                                         |
| 対象機能     | apps/web `@opennextjs/cloudflare` incremental cache レイヤ（R2 backend）              |
| 優先度       | Low（MVP では不要）                                                                   |
| 見積もり規模 | 小〜中規模（判断ドキュメント + staging smoke）                                        |
| ステータス   | spec_pending                                                                          |
| visualEvidence | NON_VISUAL                                                                          |
| 親タスク     | UT-06-FU-A (`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`)         |
| 発見元       | UT-06-FU-A Phase 12 unassigned-task-detection (UNASSIGNED-FU-A-001)                   |
| 発見日       | 2026-04-29                                                                            |

---

## 苦戦箇所【記入必須】

OpenNext on Cloudflare には、Next.js の incremental cache（ISR / fetch cache 等）を Cloudflare R2 に永続化するオプションがあり、Workers 配信形式に切り替える UT-06-FU-A の中で「ついでに有効化」できる構造になっている。しかし、UT-12（R2 bucket / binding / CORS の正本構成）が完了する前にこれを同時導入すると、以下が同一 PR / 同一判断スコープに混在する:

1. **binding 責務の境界** — incremental cache 用 R2 binding を apps/web に直接置くと、CLAUDE.md 不変条件 5（D1 直接アクセスは apps/api に閉じる）と同等の境界（R2 も apps/api 経由を原則とする方針）が崩れる。cache backend は OpenNext ランタイムが apps/web 内部で参照する性質上、apps/api 経由化が困難で、「web に置く R2 binding は cache 専用」という例外運用ルールの整理が UT-12 と同時に必要になる。
2. **bundle / 設定差分** — `open-next.config.ts` の `incrementalCache` を `r2-incremental-cache` に切り替えると wrangler bundle に R2 client / cache adapter が含まれ、Workers の bundle size と起動コストに影響する。UT-06-FU-A の「Pages → Workers 配信形式の移行」だけを検証したい局面で、cache 由来の bundle 変動が混ざると回帰原因の切り分けが困難になる。
3. **コスト判断** — R2 の Class A/B operations と storage 課金は ISR ヒット率・revalidate 頻度・対象ページ数で大きく変わる。MVP のトラフィック想定では incremental cache を有効化するメリット（origin 削減）が R2 operations コストを上回る保証がなく、UT-12 で R2 の利用ユースケース（添付ファイル等）と合算して評価しないと採算判断ができない。

将来の解決指針: **UT-12 完了を前提条件に置き、(a) cache 用 binding を apps/web に置く例外を明文化、(b) bundle 差分を独立 PR で計測、(c) staging で revalidate 実測値からコスト試算、の 3 点を分離して判断する**。UT-06-FU-A の本体は incremental cache を **無効（in-memory または無し）** で確定させ、本タスクへ判断を後送する。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-06-FU-A で apps/web を OpenNext Workers 形式へ移行する際、`@opennextjs/cloudflare` の `incrementalCache` adapter として R2 backend を選択できる。これを採用すれば Next.js の ISR / fetch cache が edge で永続化され、origin への revalidate 負荷を削減できる。一方、CLAUDE.md スタックと不変条件は D1 直接アクセスを apps/api に閉じる境界を定めており、R2 についても同等の責務分離を尊重する方針である。

### 1.2 問題点・課題

- UT-12（R2 正本構成タスク）が未完了のため、bucket 名・binding 名・CORS・lifecycle が確定していない
- cache 用 R2 binding を apps/web に置く例外運用が未定義
- MVP のトラフィック想定では R2 operations コストが origin 削減効果を上回る可能性がある
- UT-06-FU-A の Workers 移行検証と cache 導入を同 PR で混ぜると回帰原因の切り分けが困難

### 1.3 放置した場合の影響

- OpenNext のキャッシュ層を「無効のまま」運用し、ISR を活かしたページで origin 負荷が発生し続ける
- UT-12 完了後に「cache 用 R2 binding を apps/web に置けるか」の判断が宙に浮く
- トラフィック増加局面で慌てて導入するとコスト試算なしの設定が固定化する

---

## 2. 何を達成するか（What）

### 2.1 目的

UT-12 完了後の前提下で、OpenNext incremental cache を R2 backend で採用するか否かを **設計ドキュメント + staging 実測** に基づき決定する。採用する場合は最小構成・bundle 差分・コスト試算・例外運用ルールを揃え、後続実装タスクの indirect input にする。

### 2.2 想定 AC

1. UT-12 完了時点の R2 bucket / binding / CORS の current facts が記録されている
2. apps/web に cache 用 R2 binding を置く例外運用ルール（命名・スコープ・apps/api 経由の対象外である理由）が文書化されている
3. `open-next.config.ts` の `incrementalCache` 切替差分（採用案 / 不採用案）が比較表で提示されている
4. staging で revalidate 実測ログ（hit/miss・R2 operations 件数）が取得され、月次コスト試算が添付されている
5. 採用 / 不採用の判断結果が、根拠（コスト・運用負荷・bundle 影響）とともに本ドキュメントに記録される
6. 採用の場合は実装タスクが新規発行（UT-06-FU-A-R2-CACHE-IMPL-001 等）され、不採用の場合は再評価トリガー（トラフィック閾値）が明記される

### 2.3 スコープ

#### 含むもの

- 採用可否判断とその根拠記録
- `open-next.config.ts` および `wrangler.toml` の必要差分の提示（実装はしない）
- bundle size / cold start への影響見積もり
- R2 operations / storage のコスト試算
- 例外運用ルール（apps/web に R2 binding を置く正当化）

#### 含まないもの

- UT-06-FU-A 内での即時 R2 binding 追加・incremental cache 有効化
- UT-12 R2 bucket 構築そのもの（UT-12 本体の責務）
- apps/api 経由の R2 アクセス層実装（別タスク）
- DNS / カスタムドメイン切替

### 2.4 成果物

- 本タスク仕様書への判断結果追記（採用 / 不採用）
- staging 実測ログ（revalidate hit ratio / R2 ops count）
- コスト試算表（月次）
- 採用時: 実装タスク新規発行、不採用時: 再評価トリガー定義

---

## 3. どう実現するか（How）

### 3.1 前提条件

- UT-12 (R2 正本構成) 完了済み
- UT-06-FU-A 本体が staging でグリーン（incremental cache は無効状態）
- production トラフィック実績または想定値が取得可能

### 3.2 実施手順（概要）

1. UT-12 完了後の R2 current facts を `bash scripts/cf.sh` 経由で取得・記録
2. `@opennextjs/cloudflare` の incremental cache 設定差分（in-memory / r2 / d1）を比較表化
3. apps/web に cache 用 R2 binding を置く例外運用ルールをドラフト（CLAUDE.md 不変条件 5 との整合確認）
4. staging で incremental cache を一時的に有効化し、revalidate hit/miss と R2 operations 件数を計測（feature flag 形式で本番に出ない前提）
5. 計測値から月次コスト試算（Class A/B ops + storage）
6. 判断会議（solo 開発のため self-review）→ 判断結果を本書に追記
7. 採用なら実装タスク発行、不採用なら再評価トリガー（PV / revalidate 頻度の閾値）を明記

### 3.3 影響範囲

- `apps/web/open-next.config.ts`（採用時のみ実装、本タスクでは設計のみ）
- `apps/web/wrangler.toml`（採用時のみ R2 binding 追記、本タスクでは設計のみ）
- CLAUDE.md 不変条件 5 の運用注釈（例外ルール明記が必要なら）
- UT-12 完了状態（前提条件）

---

## 4. リスクと対策

| リスク                                                                        | 対策                                                                                                       |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| cache 導入で bundle / binding / cost 判断が混ざる                             | UT-12 完了後に切り出し、本タスクで判断を分離。UT-06-FU-A 本体では incremental cache 無効を確定             |
| apps/web に R2 binding を置いて D1/R2 境界（不変条件 5 相当）が崩れる         | 例外運用ルールを文書化し、apps/web の R2 binding は **OpenNext cache 専用 / アプリロジック禁止** を明記    |
| MVP トラフィックでは R2 operations コストが origin 削減効果を上回る可能性      | staging 実測 + 月次試算で定量判断。閾値（PV/revalidate 頻度）を満たすまで採用しない                       |
| bundle size 増で Workers cold start が悪化                                    | 採用判断時に bundle 差分を独立 PR で計測し、p95 cold start の劣化を AC に含める                           |
| feature flag 抜け漏れで staging 計測が production に流出                      | staging 限定の `wrangler.toml` env スコープと `open-next.config.ts` の env 分岐で隔離                      |

---

## 5. 検証方法

- UT-12 完了後に R2 bucket / binding / CORS の current facts を `bash scripts/cf.sh` で確認（例: `bash scripts/cf.sh r2 bucket list`）
- staging で incremental cache 有効化 → revalidate を発火するページに対し ISR ヒット/ミス を観測
- Cloudflare dashboard / `wrangler tail` で R2 Class A/B operations 件数を取得
- bundle size を採用前後で比較（`pnpm --filter @ubm-hyogo/web build:cloudflare` 出力）
- 月次コスト試算表（storage + ops）で MVP トラフィックでの採算ラインを判定

---

## 6. スコープ（含む/含まない）

### 含むもの

- 採用可否判断、根拠ドキュメント化
- 必要な設定差分の提示（実装は別タスク）
- bundle / コスト評価
- 例外運用ルール明文化

### 含まないもの

- UT-06-FU-A 内での即時 R2 binding 追加 / incremental cache 有効化
- UT-12 R2 bucket 構築そのもの
- apps/api 経由 R2 アクセス層の実装
- DNS / カスタムドメイン切替

---

## 7. 依存・関連タスク

- 依存: **UT-12** (R2 bucket / binding / CORS 正本構成) — 完了が前提条件
- 依存: **UT-06-FU-A** (apps/web OpenNext Workers migration) — 本体完了後に判断
- 関連: CLAUDE.md 不変条件 5（D1/R2 境界の運用ルール改訂が必要かの検討）
- 関連: UT-29 (cd-post-deploy-smoke-healthcheck) — cache 起因の smoke 影響確認

---

## 8. 推奨タスクタイプ

decision / design（実装は採用判断後に別タスク）

---

## 8.5 Phase 計画 / 着手順序

| Phase | 内容 | 完了条件 |
|-------|------|----------|
| P1: 前提同期 | UT-12 (R2 正本構成) 完了確認 / 現行 `apps/web/open-next.config.ts` の incrementalCache 設定確認 | UT-12 完了 + 現状ベースライン記録 |
| P2: 設定差分案作成 | `incrementalCache` を `in-memory` / `r2` で切り替えた `open-next.config.ts` および `apps/web/wrangler.toml` の差分案を比較表化 | 採用案 / 不採用案の patch サンプル提示 |
| P3: 例外運用ルール起草 | apps/web に R2 binding を置く正当化（cache 専用・アプリロジック禁止）を CLAUDE.md 不変条件 5 と整合する形で文書化 | レビュー可能なドラフト |
| P4: staging 実測 | feature flag 形式で staging 限定有効化 → revalidate hit/miss・R2 Class A/B ops 件数を取得 | 実測ログ + bundle 差分計測 |
| P5: コスト試算 | 実測値から月次 storage / ops コストを試算し採算ラインを判定 | 試算表（採用閾値付き） |
| P6: 判断と後続発行 | self-review で採用/不採用を確定。採用なら実装タスク発行、不採用なら再評価トリガー（PV/revalidate 頻度）を本書に記録 | 判断結果が本書末尾に追記される |

---

## 9. 参照情報

- 検出ログ: `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/outputs/phase-12/unassigned-task-detection.md` の UNASSIGNED-FU-A-001
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（R2 関連記述）
- CLAUDE.md スタックセクション / 不変条件 5
- `@opennextjs/cloudflare` README（incremental cache adapter）
- 関連ファイル: `apps/web/open-next.config.ts`（採用時）, `apps/web/wrangler.toml`

---

## 10. 備考

UT-06-FU-A 本体では incremental cache を無効（または in-memory 既定）で staging / production を確定させる。本タスクは UT-12 完了をトリガーに起動し、判断結果のみを記録する設計タスクである。採用と決まった場合は別途実装タスクを発行する。
