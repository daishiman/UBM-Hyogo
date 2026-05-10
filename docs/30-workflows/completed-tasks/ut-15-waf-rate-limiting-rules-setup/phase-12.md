[実装区分: 実装仕様書]

# Phase 12: ドキュメント更新（中学生レベル概念説明 + 知識継承 + 必須 7 出力）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| 機能名 | ut-15-waf-rate-limiting-rules-setup |
| 作成日 | 2026-05-09 |
| 前 Phase | 11（NON_VISUAL 代替 evidence 仕様確定） |
| 次 Phase | 13（PR 作成 / ユーザー承認後の実走） |
| タスク種別 | implementation / workflow_mode: docs-only / visualEvidence: NON_VISUAL / scope: cloudflare_edge_security |
| workflow_state | implemented-local-runtime-pending |
| user_approval_required | false（Phase 12 strict 7 outputs は本 wave で生成済み。Cloudflare runtime apply / commit / push / PR のみ Phase 13 承認後） |

> **300 行上限超過の根拠**: 本 Phase は Phase 12 必須 7 タスク（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / 中学生レベル概念説明）を全件「仕様レベル定義」として網羅する責務に加え、Phase 11 NON_VISUAL 4 階層 evidence trace（S-01..S-05 と L1〜L4 の二次元マトリクス）と Phase 1 苦戦箇所 5 項目の back-port を直列追跡する必要があるため、責務分離不可能性を根拠に 300 行を許容超過する（`phase-template-phase12.md` §「300 行上限と設計タスクの例外条項」§NON_VISUAL タスクで Phase 11 代替証跡と Phase 12 outputs を直列記述する場合に該当）。

## 目的

Phase 1〜11 で確定した「無料枠制約 + Simulate→Enforce 移行 gate + 4 グループ閾値 + edge / app-layer 責務分離 + 4 階層 NON_VISUAL evidence + 不変条件 #5 / `scripts/cf.sh` 徹底」を docs validator が読み取れる形で固定し、本ワークフローが「Phase 1〜13 タスク仕様書整備までで完了し、実 apply / Enforce 切替 / production smoke は Phase 13 ユーザー承認後の別オペレーション」である境界を明示する。

本 Phase 12 では **7 タスクの仕様レベル定義** と **strict 7 outputs の実体作成** を同一 wave で完了する。Cloudflare runtime apply / Enforce 切替 / production smoke は Phase 13 ユーザー承認後だが、Phase 12 の必須成果物実体は先送りしない。

## 実行タスク（Phase 12 必須 7 タスク・全件必須）

1. **実装ガイド作成（Part 1: 中学生レベル概念説明 / Part 2: 開発者技術詳細）の仕様レベル定義** — 出力先 `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新サマリー（Step 1-A/1-B/1-C + Step 2 判定）の仕様レベル定義** — 出力先 `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴の仕様レベル定義** — 出力先 `outputs/phase-12/documentation-changelog.md`
4. **未タスク検出レポート（0 件でも出力必須・current/baseline 分離）の仕様レベル定義** — 出力先 `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須・3 観点必須）の仕様レベル定義** — 出力先 `outputs/phase-12/skill-feedback-report.md`
6. **苦戦箇所の知識継承（umbrella spec への back-port + aiworkflow-requirements 反映 + lessons-learned 登録）の仕様レベル定義**
7. **phase12-task-spec-compliance-check（Task 1〜6 の準拠チェック）の仕様レベル定義** — 出力先 `outputs/phase-12/phase12-task-spec-compliance-check.md`

> 上記 7 タスクの**実体ファイル**は `outputs/phase-12/` に正規名で配置済み。Phase 13 に先送りするのは Cloudflare runtime 操作と git publishing のみ。

## implemented-local / runtime-pending モード適用表

| 項目 | 適用内容 |
| --- | --- |
| workflow_mode | implemented-local-runtime-pending（本 wave は workflow 仕様、strict outputs、local code/script/runbook を実体化。Cloudflare mutation と publishing は user 承認後） |
| visualEvidence | NON_VISUAL |
| scope | cloudflare_edge_security |
| Step 1-A | REQUIRED（同 wave で LOGS.md×2 + topic-map + 親タスク双方向リンク） |
| Step 1-B | 実装状況 = `implemented-local-runtime-pending`（実 apply は Phase 13 G1-G4 ユーザー承認後の別オペレーション） |
| Step 1-C | REQUIRED（関連タスク UT-06 / UT-16 / unassigned-task-detection の双方向リンク更新） |
| Step 1-G 検証コマンド | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-15-waf-rate-limiting-rules-setup`（docs validator のみ。実コード関連 typecheck / lint は対象外） |
| Step 2 判定 | aiworkflow-requirements の Cloudflare 章 / セキュリティ要件章 への WAF / Rate Limiting 方針追記が REQUIRED か OPTIONAL かを §タスク 2 で判定 |

## タスク 1: 実装ガイド作成（Part 1 + Part 2）の仕様レベル定義

**担当 Phase**: 12（仕様レベル定義のみ）
**出力先パス**: `outputs/phase-12/implementation-guide.md`
**pitfalls 参照**: phase-12-pitfalls.md `[UBM-012]`（wrangler 直接呼び出し禁止）/ `[Feedback W1-02b-3]`（identifier drift）

### Part 1（中学生レベル / 日常の例え話・専門用語禁止）

**「WAF ってなに？」**: 学校の校門の警備員さんと同じ。怪しい服装の人や、変な持ち物を持った人を「ちょっと待って」と止めて中に入れない。インターネットの世界でも、サーバー（学校）に向かって変な要求（持ち物）が飛んできたら、警備員（WAF = Web Application Firewall）が「これダメ」と止めてくれる。

**「Rate Limiting ってなに？」**: ジュースの自動販売機で、同じ人が 1 分間に 100 回も買おうとしたら「ちょっと待ってください」って止める仕組みと同じ。普通の人は 1 分に 100 本もジュースを買わない。だから「1 分間に 10 回までね」と決めておくと、いたずらや変な使い方を減らせる。

**「なんで必要なの？」**:
1. **悪い人がドアを叩き続ける攻撃を防ぐ**: 泥棒が「合言葉ぜんぶ試してやろう」と 1 秒間に何百回もドアを叩いてくる（= ブルートフォース攻撃）。これを edge（学校の校門）で先に止めれば、教室（API サーバー）にも届かない
2. **会員リストを盗まれない**: 「@gmail.com で登録してる人いる？」「@yahoo.co.jp は？」と全部のメールアドレスを試して会員を炙り出す攻撃（= enumeration 攻撃）も、回数制限で減らせる
3. **サーバーが過労にならない**: 1 秒に 1 万件のリクエストが来ると、ふつうのサーバーはパンクする。Rate Limiting は「ちょっと休もう」と適切に休憩を入れる役目もある

**「Simulate と Enforce ってなに？」**: 警備員さんがお仕事を始めた最初の 1 週間は「メモだけ取る」モード（= Simulate）で過ごす。「あ、この人は怪しいけど、実は会員でした」みたいな間違いを記録するため。1 週間後、間違いがゼロだと確認できたら「本気で止める」モード（= Enforce）に切り替える。いきなり Enforce にすると、普通の会員も誤って止めてしまうことがあるから。

**「edge と app-layer の二重チェック？」**: 校門の警備員（edge）と保健室の先生（app-layer）が、それぞれ違う観点で確認するイメージ。
- 校門: 「服装が怪しい / 同じ人が連続で何回も来てる」みたいな「外から見える」雰囲気で止める
- 保健室: 「○○さんは過去 1 時間で 5 回も保健室に来てる」みたいな「中の業務知識」で止める

両方が同じ理由で止めると「二重カウント」になっておかしくなる。だから役割をきっちり分けて、お互いに邪魔しないようにする。

**「429 と retry-after って？」**: 自販機が「ちょっと混んでます、30 秒後にもう一回来てください」って表示するみたいに、サーバーも `429 Too Many Requests`（= 多すぎ）+ `retry-after: 30`（= 30 秒後に再試行）を返す。利用者は怒らずに 30 秒待てばまた使える。

#### Part 1 専門用語セルフチェック表

| 専門用語 | 日常語への言い換え |
| --- | --- |
| WAF (Web Application Firewall) | 校門の警備員 |
| Rate Limiting | 自販機の「1 分に 10 回まで」ルール |
| ブルートフォース攻撃 | 泥棒が合言葉を全部試してドアを叩き続ける |
| enumeration 攻撃 | 会員名簿を炙り出すために 1 件ずつ試す行為 |
| Simulate モード | 警備員が「メモだけ取る」練習期間 |
| Enforce モード | 警備員が「本気で止める」本番モード |
| edge / app-layer | 校門 / 保健室の二重チェック |
| HTTP 429 | 自販機の「混んでます」表示 |
| retry-after | 「○秒後にまた来てね」の指示 |
| Managed Ruleset | プロが作った「不審者リスト」テンプレ |
| Custom Rule | この学校独自の「特別ルール」 |
| 無料枠（5 件以内） | 無料で使えるルール枠の上限 |

### Part 2（開発者技術詳細）

| セクション（C12P2 番号） | 仕様レベル必須内容 |
| --- | --- |
| C12P2-1 型定義 | `RateLimitedResponseInput` / `RateLimitedResponse` interface（Phase 3 §3 helper シグネチャ）/ `scripts/cf-waf-apply/config.json` の zod schema（zones / managedRulesets / customRules / rateLimitRules） |
| C12P2-2 API シグネチャ | `buildRateLimitedResponse(input: RateLimitedResponseInput): RateLimitedResponse` / `bash scripts/cf-waf-apply.sh --mode <simulate\|enforce> [--dry-run] [--zone <ZONE_ID>]` usage / exit code 表（0/1/2/3） |
| C12P2-3 使用例 | (1) middleware で 429 を返す例（`return c.json(buildRateLimitedResponse({retryAfterSec: 60}).body, 429, headers)`）/ (2) `bash scripts/cf-waf-apply.sh --dry-run` 実行例と JSON 出力 / (3) curl 連打 smoke 例 |
| C12P2-4 エラー処理 | dry-run 差分時の exit 14 → CI gate fail / non-dry-run mutation 未実装時の exit 13 → false green 防止 / token 未注入時の exit 11 / config 不正時の exit 12 / 429 二重カウント検知時の `reason: "edge"\|"app"` フィールド使用例 |
| C12P2-5 設定可能パラメータ・定数 | 4 グループ閾値（AUTH 10/60s / ADMIN 30/60s / ME 60/60s / PUBLIC 50/10s）/ customRules 5 件枠 / Simulate 観測 7 日 / FP 率 < 0.1% / production 24h 観測 / `CLOUDFLARE_API_TOKEN` の必要 scope（`Zone.WAF` / `Zone.RateLimit` / `Zone.Read`）/ `CLOUDFLARE_ANALYTICS_TOKEN`（GraphQL 用） |
| 4 ステップ実装手順 | (1) `scripts/cf-waf-apply/config.json` 作成 → (2) `scripts/cf-waf-apply.sh` ラッパー実装 → (3) `apps/api/src/middleware/edge-rate-limit-headers.ts` helper 追加 + 既存 `rate-limit-magic-link.ts` / `rate-limit-self-request.ts` の 429 応答を helper 経由に差し替え → (4) `docs/runbooks/cloudflare-waf-operations.md` で Simulate→Enforce 移行手順を runbook 化 |
| 責務分離マトリクス | Phase 2 §Concern C のマトリクスを再掲（path × edge WAF × edge Rate Limit × app-layer rate limit）/ 二重カウント防止の `reason` フィールド設計 |
| Simulate→Enforce 移行 gate | 観測 7 日 / FP 率 < 0.1% / S-04 PASS が gate 条件 / Enforce 後 24h 観測（S-05）で誤検知 0 で gate close |
| ロールバック | `bash scripts/cf-waf-apply.sh --mode simulate --zone <ZONE>` で即時 simulate 復帰 / customRules 削除は config json から該当エントリ除去 + dry-run 確認 + apply |

> **Part 2 で含めない事項**: `apps/web` 側コード変更（不変条件 #5 違反）/ Cloudflare Pro 限定機能（OWASP CRS / Bot Management）/ `wrangler` 直接呼び出し（`scripts/cf.sh` ラッパー経由を厳守, `[UBM-012]` 準拠）

### セルフチェック項目

- [ ] Part 1 が 6 つの例え話（WAF / Rate Limiting / なんで必要 / Simulate vs Enforce / edge vs app-layer / 429+retry-after）を含む
- [ ] Part 1 専門用語セルフチェック表が 12 行以上
- [ ] Part 2 が C12P2-1〜C12P2-5 の 5 必須項目を満たす
- [ ] Part 2 の 4 ステップ実装手順が `apps/web` 編集を含まない（不変条件 #5）
- [ ] Part 2 の全コマンド例で `wrangler` 直接実行が 0 件（`scripts/cf.sh` / `scripts/cf-waf-apply.sh` 経由）
- [ ] 責務分離マトリクスが Phase 2 §Concern C と identifier drift していない

## タスク 2: システム仕様書更新サマリーの仕様レベル定義

**出力先パス**: `outputs/phase-12/system-spec-update-summary.md`

### Step 1-A: 仕様書修正対象（REQUIRED）

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/runbooks/cloudflare-waf-operations.md`（新規） | 誤検知対応 / Simulate→Enforce 移行手順 / ロールバック / allowlist 追加手順 / Pro 移行時の TODO |
| `docs/30-workflows/LOGS.md` | UT-15 implemented-local-runtime-pending 行追加 |
| `.claude/skills/task-specification-creator/LOGS.md` | docs-only / NON_VISUAL implementation 適用例（UT-15）を記録 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | Cloudflare edge security 仕様への WAF / Rate Limiting 方針反映を記録 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | Cloudflare 章 / セキュリティ要件章への `WAF` `Rate Limiting` キーワード反映を index 再生成で同期 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `WAF` / `Rate Limiting` / `Simulate` / `Enforce` / `429 retry-after` を triggers に追加 |
| 親タスク `unassigned-task/UT-15-waf-rate-limiting.md` への双方向リンク | UT-15 が `ut-15-waf-rate-limiting-rules-setup/` として spec 化された旨を記録 |
| 関連 `completed-tasks/ut-06-followup-H-health-db-endpoint/` への参照 | 既存 NON_VISUAL implementation の前例として引用 |

### Step 1-B: 実装状況テーブル更新（REQUIRED）

- 実装状況 = **`implemented-local-runtime-pending`**
- 理由: 本ワークフローは仕様書整備に閉じ、実 apply（`scripts/cf-waf-apply.sh` 実行）/ Enforce 切替 / production smoke は Phase 13 ユーザー承認後の G1-G4 multi-stage approval gate を経由する別オペレーションで行う。
- `docs/30-workflows/LOGS.md` の UT 関連テーブルで UT-15 行を `implemented-local-runtime-pending`（Cloudflare runtime completed ではない）に更新。

### Step 1-C: 検証コマンド

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/ut-15-waf-rate-limiting-rules-setup
```

### Step 2 判定: aiworkflow-requirements 仕様更新

| 反映対象章 | 判定 | 理由 |
| --- | --- | --- |
| Cloudflare 章（WAF Managed Ruleset + Rate Limiting Rules の方針） | **REQUIRED** | 新規 edge security 方針が aiworkflow-requirements 正本に未登録 |
| セキュリティ要件章（Simulate→Enforce 移行 gate） | **REQUIRED** | 運用 gate の方針変更。正本へ反映が必要 |
| 不変条件章（`scripts/cf.sh` 徹底再確認）| **OPTIONAL** | 既存記述で十分。本タスクで重複追記しない |
| Cloudflare CLI 実行ルール章 | **OPTIONAL** | 既存記述で十分。本タスクの `scripts/cf-waf-apply.sh` は派生ラッパーとして言及のみ |

### セルフチェック項目

- [ ] Step 1-A の同期対象が 8 行以上
- [ ] Step 1-B が `implemented-local-runtime-pending` で固定（runtime completed 誤記禁止）
- [ ] Step 2 が章ごとに REQUIRED / OPTIONAL を判定（理由付き）
- [ ] LOGS.md 3 ファイル（task-specification-creator + aiworkflow-requirements + 30-workflows）の更新指示が含まれる
- [ ] topic-map.md / keywords.json 再生成コマンドが明記されている

## タスク 3: ドキュメント更新履歴の仕様レベル定義

**出力先パス**: `outputs/phase-12/documentation-changelog.md`

### 必須エントリ（Phase 13 実体生成時に最低限記録すべき行）

| 日付 | 変更種別 | 対象ファイル | 変更概要 | Step |
| --- | --- | --- | --- | --- |
| 実行日 | 新規 | docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/ | Phase 1〜13 仕様書 + outputs/phase-{01,02,03,11,12,13}/ | 新規 |
| 実行日 | 同期 | docs/30-workflows/LOGS.md | UT-15 implemented-local-runtime-pending 行追加 | Step 1-A |
| 実行日 | 同期 | .claude/skills/task-specification-creator/LOGS.md | docs-only / NON_VISUAL implementation 適用例（UT-15） | Step 1-A |
| 実行日 | 同期 | .claude/skills/aiworkflow-requirements/LOGS.md | Cloudflare edge security 方針反映 | Step 1-A |
| 実行日 | 同期 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | Cloudflare / セキュリティ要件章への WAF / Rate Limiting 反映 | Step 1-A |
| 実行日 | 同期 | .claude/skills/aiworkflow-requirements/indexes/keywords.json | WAF / Rate Limiting / Simulate / Enforce 追加 | Step 1-A |
| 実行日 | 追記 | .claude/skills/aiworkflow-requirements/references（Cloudflare 章 / セキュリティ章） | WAF / Rate Limiting / Simulate→Enforce gate 方針 | Step 2 |
| 実行日 | 同期 | docs/30-workflows/unassigned-task/UT-15-waf-rate-limiting.md | spec 化済 + workflow へのリンク | Step 1-C |

### セルフチェック項目

- [ ] Step 1-A / 1-B / 1-C / Step 2 の 4 区分が個別行として記録（マージ禁止）
- [ ] workflow-local 同期と global skill sync が別ブロック扱いで記述
- [ ] 「該当なし」の場合も明示的に行を残す（空欄禁止）

## タスク 4: 未タスク検出レポートの仕様レベル定義（0 件でも出力必須）

**出力先パス**: `outputs/phase-12/unassigned-task-detection.md`

### baseline / current 分離

#### baseline（既起票・既存タスクから継承）

| 検出項目 | 種別 | 推奨対応 | 区分 |
| --- | --- | --- | --- |
| UT-06 本番デプロイ完了（上流ブロッカー） | 既存独立タスク | 完了済前提 | baseline |
| カスタムドメイン設定（zone-level WAF 適用先） | 上流方針 | 確定後に zone ID 確定 | baseline |
| `CLOUDFLARE_API_TOKEN` 権限拡張（`Zone.WAF` / `Zone.RateLimit`） | 1Password 運用 | Phase 13 G1 前 preflight | baseline |

#### current（本ワークフローで派生）

| 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| Cloudflare Pro 移行時の OWASP CRS 反映 | runbook TODO | `docs/runbooks/cloudflare-waf-operations.md` の TODO 節 | unassigned-task として将来 formalize 候補（Pro 移行決定後）|
| Bot Management 検討（地域ブロック・mTLS 含む）| 別 task 候補 | 本タスクスコープ外。将来検討 | unassigned-task として formalize 候補（governance 系）|
| Terraform 化（MINOR-01）| Pro 移行時に再検討 | Phase 3 §5 MINOR テーブルから継承 | unassigned-task として将来 formalize（実装方式変更）|
| `[[ratelimits]]` binding の最終要否（MINOR-02）| Phase 5 / 9 で再判定 | 本ワークフロー Phase 5 の派生実装 PR で吸収 | 派生 IMPL タスク内で吸収（独立 formalize 不要）|
| UT-16 監視・アラートへの S-04 / S-05 継続監視引き継ぎ | 並走タスク連携 | UT-16 task spec に baseline 計算ロジック / アラート閾値を追記 | UT-16 内に吸収可（独立 formalize 不要）|
| `CLOUDFLARE_ANALYTICS_TOKEN` rotation SOP | 運用 SOP | 1Password 管理 + rotation 周期 / 手順を SOP 化 | unassigned-task として formalize 必須（governance 系）|

### 未タスクテンプレ 4 必須セクション（formalize 時に必ず含める）

1. 苦戦箇所【記入必須】
2. リスクと対策
3. 検証方法
4. スコープ（含む / 含まない）

### SF-03 設計タスクパターン照合

| パターン | 該当 | 内容 |
| --- | --- | --- |
| 型定義→実装 | 該当 | `RateLimitedResponseInput` 型 → middleware 実装（Phase 5 派生 IMPL タスク） |
| 契約→テスト | 該当 | `cf-waf-apply.sh` usage 契約 → snapshot test（Phase 6 で実装） |
| UI 仕様→コンポーネント | 非該当 | NON_VISUAL のため |
| 仕様書間差異→設計決定 | 非該当 | 本ワークフロー内で解消済 |

### セルフチェック項目

- [ ] current / baseline が完全分離（混在禁止）
- [ ] 0 件でなくとも 4 必須セクション規約を満たす（テンプレ参照）
- [ ] SF-03 4 パターン照合が記載されている
- [ ] formalize 候補には割り当て先（独立 / 既存吸収）を明記
- [ ] `CLOUDFLARE_ANALYTICS_TOKEN` rotation SOP は formalize 必須（運用上）

## タスク 5: スキルフィードバックレポートの仕様レベル定義（3 観点必須）

**出力先パス**: `outputs/phase-12/skill-feedback-report.md`

### 3 観点必須テーブル

| 観点 | 仕様レベル必須内容 |
| --- | --- |
| **task-specification-creator skill** | NON_VISUAL implementation の Phase 11 4 階層代替 evidence（L1〜L4）が cloudflare edge security ドメインで適切に適用できたか / S-01..S-05 smoke の 8 軸テンプレが re-usable か / Simulate→Enforce gate の状態語彙 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` が edge security ドメインで自然に整合したか |
| **aiworkflow-requirements skill** | Cloudflare 章 / セキュリティ要件章 への WAF / Rate Limiting 方針反映が Step 2=REQUIRED で適切に判定できたか / topic-map.md / keywords.json への `WAF` / `Rate Limiting` 追加が index 再生成で同期できたか / Simulate→Enforce gate の運用境界が aiworkflow-requirements で 1 箇所に集約されているか |
| **scripts/cf.sh ラッパ運用 / `cf-waf-apply.sh` 派生ラッパー** | 本タスクで新規追加する `scripts/cf-waf-apply.sh` が `scripts/cf.sh` 経由（`op run` / esbuild path / mise exec）と整合するか / `[UBM-012]` の wrangler 直接呼び出し禁止規約が Phase 5 派生実装で守られるか / GraphQL Analytics 用の追加 token scope（`Account Analytics:Read`）が 1Password に追加され、ラッパー経由で読み取られるか |

### セルフチェック項目

- [ ] 3 観点（task-specification-creator / aiworkflow-requirements / scripts/cf.sh）すべてに行がある
- [ ] 改善点なしの場合も「観察事項なし」の文言で行を埋める（空テーブル禁止）
- [ ] フィードバック ID（UBM-NNN 等）は append-only で再利用しない

## タスク 6: 苦戦箇所の知識継承（umbrella back-port + aiworkflow + lessons-learned）

### Phase 1 / index.md の苦戦箇所 5 項目を以下に back-port

| # | 苦戦箇所 | back-port 先 | 内容 |
| --- | --- | --- | --- |
| 1 | 閾値設定の難しさ | aiworkflow-requirements `references/cloudflare-edge-security.md`（新規 or 既存追記）+ lessons-learned-ut-15.md | Cloudflare Analytics 正常ピーク値の 3〜5 倍を初期値とする ruleset / Simulate 7 日 / FP 率 < 0.1% gate の方法論 |
| 2 | WAF → Workers の処理順 | aiworkflow-requirements 同上 + Phase 2 §Concern C 責務分離マトリクス | edge ルール先行発火 / app-layer は業務ロジック由来の保護に専念する設計原則 |
| 3 | 無料枠の制約 | runbook `cloudflare-waf-operations.md` TODO 節 | カスタムルール 5 件以内 / Pro 移行時に Managed Ruleset OWASP CRS で代替する方針 |
| 4 | 地域ブロックの副作用 | runbook 注記 | VPN / CDN 経由アクセスでの誤ブロックリスクを将来検討時に再評価 |
| 5 | 既存 app-layer rate limit との二重カウント | aiworkflow-requirements 同上 + helper `edge-rate-limit-headers.ts` の `reason` フィールド設計 | edge: 攻撃者 bursty pattern / app: enumeration 業務ロジック の責務分離原則 |

### aiworkflow-requirements 反映項目

- `references/cloudflare-edge-security.md`（新規）または既存 Cloudflare 章への追記:
  - WAF Managed Ruleset / Custom Rules / Rate Limiting Rules の宣言的 IaC 方針
  - Simulate→Enforce 移行 gate（7 日 / FP 率 / 24h 観測）
  - edge / app-layer 責務分離原則
- `indexes/keywords.json` triggers に `WAF` / `Rate Limiting` / `Simulate` / `Enforce` / `cf-waf-apply` を追加
- `indexes/topic-map.md` に上記章へのリンクを追加（再生成で同期）

### skill / lessons-learned 登録項目

- `.claude/skills/aiworkflow-requirements/references/lessons-learned-ut-15-waf-rate-limiting.md`（新規）に上記 5 項目を「苦戦箇所 → 解決策 → 再利用形式」で記録
- `.claude/skills/task-specification-creator/references/patterns-troubleshooting.md` に `cloudflare-edge-security` ドメインの NON_VISUAL pattern として S-01..S-05 8 軸テンプレを追記候補（OPTIONAL: skill-creator 側の判断）

### セルフチェック項目

- [ ] 5 項目すべての back-port 先が明記されている
- [ ] aiworkflow-requirements への反映が `references/` / `indexes/keywords.json` / `indexes/topic-map.md` の 3 ファイルでカバーされる
- [ ] lessons-learned 新規ファイルが「苦戦箇所 / 解決策 / 再利用形式」の 3 段構成

## タスク 7: phase12-task-spec-compliance-check の仕様レベル定義

**出力先パス**: `outputs/phase-12/phase12-task-spec-compliance-check.md`

### Task 12-1〜12-7 準拠チェック表

| # | チェック項目 | 判定基準 | 期待結果 |
| --- | --- | --- | --- |
| 12-1 | implementation-guide.md Part 1（中学生レベル）| 6 例え話 + 12 行以上の専門用語表 | PASS |
| 12-2 | implementation-guide.md Part 2 / C12P2-1〜5 | 5 必須項目すべて記述 | PASS |
| 12-3 | system-spec-update-summary.md | Step 1-A 8 行 + 1-B `implemented-local-runtime-pending` + 1-C 検証コマンド + Step 2 章別判定 | PASS |
| 12-4 | documentation-changelog.md | 8 行以上の必須エントリ + 4 区分分離 | PASS |
| 12-5 | unassigned-task-detection.md | current/baseline 分離 + SF-03 4 パターン照合 + `CLOUDFLARE_ANALYTICS_TOKEN` rotation SOP formalize | PASS |
| 12-6 | skill-feedback-report.md | 3 観点必須 + 空テーブル禁止 | PASS |
| 12-7 | 苦戦箇所 back-port | 5 項目すべて aiworkflow-requirements / runbook / lessons-learned に反映 | PASS |

### NON_VISUAL タスク追加項目

| 項目 | 期待 |
| --- | --- |
| Phase 11 状態語彙 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（main.md に記載予定）|
| 4 階層代替 evidence | L1〜L4 の保管先表が phase-11.md に記述済 |
| Phase 13 G1-G4 mapping | smoke S-01..S-05 と G1-G4 gate の対応表が phase-11.md / phase-13.md に記述済 |

### セルフチェック項目

- [ ] Task 12-1〜12-7 すべてが PASS / FAIL 判定可能な形式
- [ ] NON_VISUAL 追加項目（状態語彙 / 4 階層 / G1-G4 mapping）が含まれる
- [ ] `PASS` 単独表記禁止（boundary suffix 必須）

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 7 AC trace 表 | AC-1〜AC-10 → タスク 1 implementation-guide Part 2 / タスク 2 system-spec-update-summary に各 AC が trace |
| Phase 11 smoke S-01..S-05 | smoke evidence → タスク 1 Part 2 4 ステップ手順「(4) runbook 化」へ trace / S-04 / S-05 結果 → タスク 6 lessons-learned |
| Phase 13 PR description | タスク 3 documentation-changelog → PR description 草案根拠 / タスク 4 current → PR body の「related work」 / タスク 1 Part 2 → 派生実装 PR の手順正本 |
| UT-16 監視・アラート（並走）| タスク 4 current の S-04 / S-05 継続監視を UT-16 task に引き継ぎ |

## 多角的チェック

- **不変条件 #5 違反なし**: タスク 1 Part 2 4 ステップに `apps/web` 編集指示が含まれていない
- **7 タスク全件出力**: 本仕様書 §タスク 1〜§タスク 7 が漏れなく記述されている
- **implemented-local-runtime-pending 整合**: strict 7 outputs と local implementation artifacts は本 wave で生成済み、runtime evidence と git publishing は Phase 13 user gate に残す
- **identifier drift なし**: helper signature（`RateLimitedResponseInput` / `RateLimitedResponse` / `buildRateLimitedResponse`）が Phase 3 §3 と一致 / 4 グループ閾値（AUTH 10/60s 等）が Phase 2 §Concern A と一致
- **`scripts/cf.sh` 強制**: タスク 5 観点 3 で wrangler 直接呼び出し禁止規約（`[UBM-012]`）が反映されている
- **無料枠制約遵守**: customRules 5 件以内 / Pro 移行 TODO の runbook 化がタスク 6 で back-port 済
- **secret 混入防止**: タスク 1 Part 2 / タスク 3 changelog / タスク 4 unassigned で API token / 1Password URI / customer email が転記されない

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide（Part 1 + Part 2） | 12 | output_present | 6 例え話 + C12P2-1〜5 |
| 2 | system-spec-update-summary | 12 | output_present | Step 1-A/B/C + Step 2 章別判定 |
| 3 | documentation-changelog | 12 | output_present | 8 行必須エントリ |
| 4 | unassigned-task-detection | 12 | output_present | baseline / current / SF-03 |
| 5 | skill-feedback-report | 12 | output_present | 3 観点必須 |
| 6 | 苦戦箇所 back-port（aiworkflow + runbook + lessons-learned）| 12 | output_present | 5 項目すべて |
| 7 | phase12-task-spec-compliance-check | 12 | output_present | Task 12-1〜12-7 + NON_VISUAL 追加 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-12.md | 本ファイル（Phase 12 7 タスクの仕様レベル定義） |
| Phase 12 strict outputs | docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/outputs/phase-12/*.md | strict 7 files の実体 |

> **重要**: Phase 12 outputs の 7 実体ファイルは本 wave で作成済み。Phase 13 ユーザー承認後に行うのは Cloudflare runtime apply / commit / push / PR 作成であり、Phase 12 成果物生成ではない。

## 完了条件

- [ ] タスク 1〜7 すべての仕様レベル定義（必須セクション + セルフチェック + pitfalls 参照）が本仕様書に記述されている
- [ ] Part 1 中学生レベル概念説明が WAF / Rate Limiting / なんで必要 / Simulate vs Enforce / edge vs app-layer / 429+retry-after の 6 例え話を含む
- [ ] Part 2 が C12P2-1〜C12P2-5 の 5 必須項目をカバーする仕様
- [ ] 苦戦箇所 5 項目すべての back-port 先（aiworkflow-requirements / runbook / lessons-learned）が明記されている
- [ ] implemented-local / runtime-pending モード適用表が記述されている
- [ ] 300 行上限超過の根拠が冒頭に記述されている
- [ ] 統合テスト連携（Phase 7 / Phase 11 / Phase 13 / UT-16）が記述されている
- [ ] 多角的チェック（不変条件 #5 / 7 タスク全件 / docs-only 整合 / identifier drift / scripts/cf.sh 強制 / 無料枠制約 / secret 混入防止）が記述されている
- [ ] Phase 12 strict 7 outputs が正規名で存在し、`phase12-task-spec-compliance-check.md` が 4 条件を記録している

## タスク 100% 実行確認【必須】

- 実行タスク 7 件すべてが本仕様書に記述済み
- 本仕様書の状態 = `implemented-local-runtime-pending`
- 実成果物（7 ファイル）は本 wave で生成済み
- artifacts.json / outputs/artifacts.json は本 wave で同期済み

## 次 Phase への引き渡し

- 次 Phase: 13（PR 作成 / **user_approval_required: true**）
- 引き継ぎ事項:
  - 本 Phase 12 仕様書 + strict 7 outputs → Phase 13 PR の docs 同期スコープ
  - タスク 1 Part 2 4 ステップ手順 → Phase 13 派生実装 PR（`feat/ut-15-waf-rate-limiting-impl`）の正本
  - タスク 3 必須エントリ 8 行 → Phase 13 PR description 草案の根拠
  - タスク 4 current の `CLOUDFLARE_ANALYTICS_TOKEN` rotation SOP / Pro 移行 TODO → Phase 13 後続 formalize 候補
  - タスク 6 苦戦箇所 back-port → aiworkflow-requirements same-wave sync と runtime 実装 wave への引き継ぎ
- ブロック条件:
  - 7 タスクのいずれかの仕様レベル定義が欠落
  - strict 7 output files のいずれかが欠落している
  - identifier drift（Phase 2 §Concern A / §Concern C / Phase 3 §3 と本仕様書 §タスク 1 Part 2 の不一致）
  - 不変条件 #5 違反（`apps/web` 編集指示が implementation-guide 仕様に混入）
  - `wrangler` 直接呼び出しが implementation-guide 仕様に混入
  - secret / 1Password URI / customer email が docs に転記される指示

## 参照資料

| 資料 | 用途 |
| --- | --- |
| `phase-12-spec.md` | strict 7 outputs / Part 1 and Part 2 requirements |
| `quality-gates.md` | Phase 12 / 13 boundary |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Final compliance evidence |
