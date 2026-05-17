# Phase 12: ドキュメント更新

> 2026-05-16 correction: Phase 12 strict 7 outputs は `outputs/phase-12/` に実体化済み。`artifacts.json` と `outputs/artifacts.json` は parity mirror として同期し、workflow state は `verified_current_no_code_change_pending_pr` / `implementationCategory=conditional` に統一する。

> Source issue: [#717](https://github.com/daishiman/UBM-Hyogo/issues/717)
> implementation_mode: `new`
> task classification: code task (GitHub Actions workflow YAML)
> visual classification: NON_VISUAL
> 実装区分: **実装仕様書**

---

## Phase 12 strict 7 成果物（task-specification-creator 規約）

| Task | 成果物 | 概要 |
|---|---|---|
| 12-0 | `outputs/phase-12/main.md` | Phase 12 全体サマリ |
| 12-1 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル概念） + Part 2（技術詳細） |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | `deployment-secrets-management.md` への反映内容 |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | Step 1-A/1-B/1-C + Step 2 の結果 |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` | 後続 unassigned task 検出（本タスクと同 directory に既配置） |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill への feedback |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | root evidence |

---

## Task 12-1: implementation-guide.md 構成

### Part 1: 中学生レベル概念説明（task-specification-creator 規約による必須セクション）

#### 1. OIDC（OpenID Connect）とは何か

**例え話: 入館証 vs マスターキー**

ある学校で、図書館に入るために 2 つの方法があるとする。

- **方法 A（long-lived API Token）**: 図書館のマスターキー（鍵）を一人ずつ配る。鍵があれば誰でも・いつでも図書館に入れる。鍵を落としたら拾った人も入れてしまう。鍵を交換するには全員を集めて新しい鍵を配り直す必要がある。
- **方法 B（OIDC）**: 図書館の入口に係員がいて、生徒証（学校が発行した身分証）を見せると **その日 1 時間だけ有効な紙の入館証** を発行してくれる。1 時間後には自動で無効になる。誰かが拾っても 1 時間後には使えない。

OIDC は方法 B にあたる。GitHub Actions が「自分が GitHub の workflow であること」を証明する身分証を出し、Cloudflare が「OK、じゃあ短時間だけ deploy できる入館証を渡すよ」と返してくれる仕組み。

#### 2. long-lived token と short-lived token の違い

| 項目 | long-lived token（マスターキー） | short-lived token（紙の入館証） |
|---|---|---|
| 有効期限 | 数ヶ月〜年単位（明示的に失効するまで有効） | 数分〜1時間（自動失効） |
| 漏洩した時の被害 | 失効するまで悪用され続ける | すぐ無効になるので被害が小さい |
| 交換コスト | 全員に配り直し（GitHub Secrets / Cloudflare / 1Password の 3 箇所更新） | 不要（毎回自動発行） |
| 保管場所 | GitHub Secrets / Cloudflare dashboard / 1Password に静的に保管 | 保管しない（毎回作って捨てる） |

今回の改修は「マスターキー方式」から「紙の入館証方式」に staging だけ切り替える。production は別 PR で慎重に切り替えるため、本タスクでは設計のみ行う。

#### 3. subject claim による信頼境界とは

**例え話: 入館証発行のルール**

紙の入館証（OIDC token）には「誰に発行したか」が書いてある。例えば:

```
repo:daishiman/UBM-Hyogo:ref:refs/heads/dev:environment:staging
```

これは「UBM-Hyogo リポジトリの dev ブランチから staging 環境向けに発行された入館証」という意味。Cloudflare はこの内容を見て「自分が許可した条件と一致するか」を確認してから deploy を受け付ける。

もし攻撃者が別のリポジトリ（例: `attacker/evil-repo`）から OIDC token を取ろうとしても、subject claim が一致しないので Cloudflare は拒否する。これが **信頼境界（trust boundary）の物理的な強制**。

> **重要**: subject claim を pin しないと、GitHub Actions を実行できる任意のユーザーが自分のリポジトリから OIDC token を取って Cloudflare を deploy できてしまう。本タスクでは `repo` / `ref` / `environment` の 3 軸で必ず pin する。

### Part 2: 技術詳細

- 2026-05-16 時点では `permissions: id-token: write` を付与しない。公式 support 確認後の後続 task で staging proof から開始する。
- future supported path では Cloudflare 側で受け入れる subject claim を `repo:daishiman/UBM-Hyogo`, `ref`, `environment` で pin。
- OIDC token exchange step → Cloudflare 短命 credential 取得 → deploy step へ受け渡し、という実装は future design memo であり本 cycle の実装ではない。
- `scripts/cf.sh` は env var 名 `CLOUDFLARE_API_TOKEN` を維持し、ローカル deploy 経路の互換性を破壊しない。
- step-scoped `secrets.CLOUDFLARE_API_TOKEN` 経路は current runtime contract として維持する。
- OIDC token / subject claim 値 / account id は本 cycle で発生させず、成果物に記録しない。

### 視覚証跡

`UI/UX変更なしのため Phase 11 スクリーンショット不要` — 代替証跡は `outputs/phase-11/cloudflare-oidc-support-revalidation.md`。

---

## Task 12-2: system-spec-update-summary.md（正本同期計画）

### 正本ドキュメント反映先

#### aiworkflow-requirements skill references

aiworkflow-requirements skill 配下の deployment 系 reference 群（`.claude/skills/aiworkflow-requirements/references/` 配下）には以下の関連ファイルが存在することを確認済み:

- `deployment-secrets-management.md`（**第一候補・正本反映先**）— Issue #640 step-scoped pattern を canonical 反映済みのファイル。Issue #717 no-code decision と future OIDC gate を追記する正本反映先。
- `deployment-gha.md`（**第二候補**）— GitHub Actions deploy 経路の正本。Cloudflare Workers OIDC deploy support 未確認と `web-cd.yml` no-code decision をクロスリファレンスする候補。
- `deployment-cloudflare.md`（**第三候補・参照のみ**）— Cloudflare deploy 全般。OIDC principal 発行・claim 受け入れ設定の最低条件を補足する場合に追記。

> 反映優先度の判定: 「credential 寿命と rotation SOP の正本」は `deployment-secrets-management.md` に置く方が継承性が高い。`deployment-gha.md` には「workflow file 単位の付与範囲ガイダンス」のみクロスリファレンスする構成を Phase 4 で決定する。

#### Step 1-A: 完了タスク記録

- `deployment-secrets-management.md` に **完了タスクセクション** を追加（issue-717）。
- LOGS（aiworkflow-requirements / task-specification-creator の `_legacy.md`）2 ファイル更新。
- topic-map.md エントリ追加（`Cloudflare OIDC full migration (staging)`）。

#### Step 1-B: 実装状況テーブル

- 「OIDC / step-scoped token cutover」: `完了`（issue-640 で達成済み）
- 「OIDC 完全移行（staging）」: `blocked_by_official_support`（後続 task）
- 「OIDC 完全移行（production）」: `unassigned`（staging proof 後の後続別 PR）
- 「legacy long-lived `CLOUDFLARE_API_TOKEN` 物理失効」: `unassigned`（`issue-640-followup-002`）

#### Step 1-C: 関連タスクテーブル

- `issue-640-followup-001-oidc-full-migration.md` のステータス: `未実施` → `verified_current_no_code_change_pending_pr`。
- `issue-640-followup-002-legacy-token-revocation.md` の依存順を再確認（staging proof + production cutover + observation 後に enable）。

#### Step 2（新規インターフェース追加時のみ）

- ✅ **更新必要**: `deployment-secrets-management.md` に unsupported 判定、current `CLOUDFLARE_API_TOKEN` boundary、future OIDC gate を追加。
- `deployment-gha.md` にも no-code decision をクロスリファレンスし、target contract と current fact を分離する。

### CLAUDE.md シークレット管理セクションへの追記要否判断

| 項目 | 判定 | 理由 |
|---|---|---|
| 「ランタイムシークレット → Cloudflare Secrets」表 | **追記不要** | OIDC は credential 寿命の短縮であり、保管種別は変わらない |
| `scripts/cf.sh` ラッパー実行ルール | **追記不要** | env var 名 `CLOUDFLARE_API_TOKEN` 互換性は維持。ラッパー側の挙動は変えない |
| 「禁止事項」リスト | **追記候補** | OIDC token 値・subject claim 実値を log / ドキュメントに転記しない旨を 1 行追加する選択肢あり。Phase 4 で最終判断 |
| `apps/web` env アクセス不変条件 | **追記不要** | OIDC は CI/CD 経路の credential であり、runtime env injection 経路には影響しない |

> 最終判断: 「禁止事項」リストへの 1 行追記のみが候補。本文インパクトが軽微なため、`deployment-secrets-management.md` 側に detail を集約し、CLAUDE.md は変更しない方針を Phase 4 設計で確定する。

---

## Task 12-3: documentation-changelog.md（運用記録）

- Step 1-A 完了タスク記録の diff サマリ。
- Step 1-B 実装状況テーブルの before/after。
- Step 1-C 関連タスクテーブル更新の差分。
- Step 2 新規インターフェース追加判定の根拠。

---

## Task 12-4: unassigned-task-detection.md（後続 unassigned task 検出）

→ `outputs/phase-12/unassigned-task-detection.md` を **本タスク内で必ず作成**する。検出対象は最低 3 件（元仕様 §2.3 out-of-scope を引用）:

| ID | タスク名 | 検出理由 |
|---|---|---|
| issue-717-followup-production-oidc-cutover（仮） | official support 確認後の staging proof / production OIDC cutover | 本タスクは official support 未確認により no-code。実切替は別 PR |
| `issue-640-followup-002-legacy-token-revocation` | legacy long-lived `CLOUDFLARE_API_TOKEN` の物理失効 | production cutover + observation 後に実施。依存順あり |
| `apps/api` D1 token cutover | `apps/api` 側 D1 token を OIDC 経路 / step-scoped に揃える | 元仕様 §2.3 out-of-scope。別 issue 化候補 |
| 1Password 構造変更 | OIDC 完全移行確定後の 1Password 参照 path 再編 | 元仕様 §2.3 out-of-scope。本タスクは判断材料作成のみ |

### unassigned-task 検出ガイダンス

- 検出対象は「本タスクで実施しない」かつ「将来の所有者が必要」な作業のみ。
- 検出時は「実施先候補（Issue / 別 workflow / バックログ）」を必ず併記する。
- 0 件の場合でも本ファイルは作成し、`未検出` と明示する（task-specification-creator 規約）。

---

## Task 12-5: skill-feedback-report.md

- Phase 11 NON_VISUAL の代替証跡パターン（primary-source revalidation + no-code guard）の適用事例として記録。
- unsupported 判定時に Phase 1-13 の stale executable claims を grep gate で落とすパターンを skill にフィードバック。

---

## Task 12-6: phase12-task-spec-compliance-check.md

- canonical 7 成果物の存在確認。
- `artifacts.json` / `outputs/artifacts.json` parity 確認。
- task-spec compliance の root evidence。
- Phase 12 中学生レベル概念説明（OIDC / long-lived vs short-lived / subject claim）が含まれていることのセルフチェック。

---

## DoD

- [ ] 7 成果物すべて存在（`outputs/phase-12/` 7 ファイル）
- [ ] Part 1 中学生レベル概念説明が「OIDC」「long-lived vs short-lived」「subject claim による信頼境界」の 3 観点を平易な例えで説明している
- [ ] `deployment-secrets-management.md` 反映案がドラフト済み
- [ ] unassigned task 検出が最低 3 件 formalize されている
- [ ] CLAUDE.md 追記要否の判定根拠が明文化されている
- [ ] `pnpm indexes:rebuild` 実行（CI `verify-indexes-up-to-date` gate で担保）
