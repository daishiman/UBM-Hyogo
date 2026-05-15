# Issue #640 Followup 002 Legacy Cloudflare API Token Revocation - タスク指示書

## メタ情報

```yaml
task_id: issue-640-followup-002-legacy-token-revocation
title: Legacy Cloudflare API Token Revocation
category: 運用
target_feature: Cloudflare API Token / GitHub Secrets / 1Password rotation surface
priority: 中
scale: 小規模
status: 未実施
source_phase: docs/30-workflows/issue-640-oidc-cf-token-cutover/outputs/phase-12/unassigned-task-detection.md
source_workflow: docs/30-workflows/issue-640-oidc-cf-token-cutover/
github_issue: 718
created_date: 2026-05-14
taskType: operations
visualEvidence: NON_VISUAL
dependencies:
  - issue-640-oidc-cf-token-cutover (staging/production runtime evidence)
  - issue-640-followup-001-oidc-full-migration (任意・OIDC 移行後に実行する場合は前提となる)
```

| 項目 | 内容 |
| --- | --- |
| タスクID | `issue-640-followup-002-legacy-token-revocation` |
| タスク名 | Legacy Cloudflare API Token Revocation |
| 分類 | 運用 |
| 対象機能 | Cloudflare API Token / GitHub Secrets / 1Password rotation surface |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/issue-640-oidc-cf-token-cutover/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-14 |
| 親ワークフロー | `docs/30-workflows/issue-640-oidc-cf-token-cutover/` |
| source issue | Issue #640 (OIDC / step-scoped CF token cutover) |
| taskType | operations |
| visualEvidence | NON_VISUAL |
| dependencies | Issue #640 本体 / `issue-640-followup-001-oidc-full-migration`（任意） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #640 では `web-cd.yml` / `backend-ci.yml` の Cloudflare deploy credential を step-scoped fine-grained token へ cutover し、`CLOUDFLARE_API_TOKEN` の参照範囲を deploy step 直下の `env:` ブロックに限定した。staging / production の runtime evidence が green になった段階で、旧 long-lived な Account-scoped legacy `CLOUDFLARE_API_TOKEN` は GitHub Actions 上で実質未参照になる。

しかし legacy token は以下 3 箇所に依然として残存する可能性があり、物理失効には段階的な inventory と operator approval が必要になる。

1. Cloudflare dashboard 上の API Token 一覧（実 token は revocation 操作でのみ無効化される）
2. GitHub Secrets（`CLOUDFLARE_API_TOKEN` 等 environment-scoped secret）
3. 1Password（ローカル運用 / `scripts/cf.sh` の env 注入元・正本）

Issue #640 本体ではこの物理失効は意図的にスコープ外とし、本 follow-up task に分離した。

### 1.2 問題点・課題

- legacy token を残したままだと、漏洩時の blast radius（Workers Scripts:Edit / D1:Edit / Pages:Edit を含む広域 Account scope）が縮小しない。
- backend / D1 / audit / 手動運用フロー（`scripts/cf.sh d1 export` 等）が legacy token に依存している場合、先に失効させると recovery / 監査作業が破壊される。
- GitHub Secrets と 1Password の二重管理状態が継続し、rotation SOP 発動時に「どちらが正本か」の判断コストが残る。

### 1.3 放置した場合の影響

- long-lived token が dashboard に残存し続け、Issue #640 で導入した step-scoped 化の security 利得が部分的に損なわれる。
- 1Password と GitHub Secrets / Cloudflare dashboard の inventory drift が累積し、次回 rotation 時に reconciliation コストが膨らむ。
- セキュリティレビューで `least privilege` / `legacy credential removal` の指摘が再発する。

---

## 2. 何を達成するか（What）

### 2.1 目的

Issue #640 で導入した step-scoped token への cutover が staging / production で安定したのちに、legacy `CLOUDFLARE_API_TOKEN` を Cloudflare dashboard 上で物理失効し、GitHub Secrets / 1Password の inventory を最終整合する。

### 2.2 最終ゴール

- Cloudflare dashboard 上の legacy `CLOUDFLARE_API_TOKEN`（Issue #640 cutover 前から存在する long-lived token）が `revoked` 状態になっている。
- GitHub Secrets から legacy 名義の `CLOUDFLARE_API_TOKEN` が削除（または step-scoped 新 secret 名へ完全置換）されている。
- 1Password の対応 item が `revoked` ステータスとして注釈付きで残るか、削除されている（正本判断は operator が行う）。
- 失効作業の redacted evidence（コマンド名 / exit code / item name のみ）が `outputs/phase-11/` に保存される。
- `deployment-secrets-management.md` の inventory が新方式単一参照に更新されている。

### 2.3 スコープ（含むもの/含まないもの）

#### 含むもの

- backend / D1 / audit / 手動運用 workflow からの legacy token 参照を `rg` で完全洗い出し。
- operator-approved 経路（`bash scripts/cf.sh` 系ラッパー / Cloudflare dashboard 手操作）での legacy token revocation または rotation。
- GitHub Secrets 削除後の 1Password item 状態の最終確認（item name 単位のみ）。
- 失効作業の redacted evidence 取得と `outputs/phase-11/` への保存。
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の inventory 更新。

#### 含まないもの

- OIDC 完全移行設計・実装（`issue-640-followup-001-oidc-full-migration` に委譲）。
- step-scoped 新 token 自体の再発行 / 再 rotation（Issue #640 本体スコープ）。
- HEALTH_DB_TOKEN や Auth.js secret 等、Cloudflare API Token 以外の rotation。
- 1Password vault 構造そのものの再設計。

### 2.4 成果物

- `outputs/phase-11/legacy-token-usage-inventory.md`（rg 結果 / redacted）
- `outputs/phase-11/revocation-evidence.md`（コマンド名 / exit code / item name のみ）
- `outputs/phase-11/github-secrets-after.md`（残存 secret 名一覧 / 値は記録しない）
- `outputs/phase-11/onepassword-item-status.md`（item name + status のみ）
- `outputs/phase-12/system-spec-update-summary.md`（`deployment-secrets-management.md` 更新点）
- `outputs/phase-12/unassigned-task-detection.md`（残課題があれば追加）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Issue #640 本体（`docs/30-workflows/issue-640-oidc-cf-token-cutover/`）の staging / production runtime evidence が green として保存済みであること。
- step-scoped 新 secret が GitHub Secrets / 1Password に登録済みで、`web-cd.yml` / `backend-ci.yml` の deploy が新方式で複数回 green になっていること。
- Cloudflare dashboard / GitHub Secrets / 1Password に対する operator approval が取得可能であること。
- `scripts/cf.sh` ラッパー経由で `CLOUDFLARE_API_TOKEN` を扱う既存 path（D1 migration / export / deploy）の動作確認手段が用意できること。

### 3.2 アプローチ

1. 失効前に backend / D1 / audit / 手動運用 workflow からの参照を `rg` で完全洗い出し、新 token / 旧 token のどちらに依存しているかを明示する。
2. legacy token に依存する path が残っている場合は、本 task の作業前に新 token へ参照を切り替えるか、別 unassigned task として分離する。
3. operator-approved 経路で legacy token を revocation または rotation する。revocation コマンドは具体名を本仕様書には焼き込まず、`bash scripts/cf.sh` ラッパー or Cloudflare dashboard 手操作のいずれかとして抽象的に扱う。
4. GitHub Secrets の legacy entry を削除する（または新 secret 名へ完全置換）。
5. 1Password 正本の item 状態を最終確認し、item name と status のみを記録する。
6. evidence は redacted（コマンド名 / exit code / item name のみ）で `outputs/phase-11/` に保存し、`deployment-secrets-management.md` の inventory を更新する。

---

## 4. 実行手順

### Phase 構成

1. Phase 1: legacy token 参照の完全洗い出し
2. Phase 2: operator-approved 経路での失効 / 切替
3. Phase 3: 1Password / GitHub Secrets 最終整合
4. Phase 4: 正本仕様の inventory 更新

### Phase 1: legacy token 参照の完全洗い出し

#### 目的

backend / D1 / audit / 手動運用 workflow からの legacy `CLOUDFLARE_API_TOKEN` 参照を完全に洗い出し、失効可否を判断する。

#### 手順

1. `rg -n "CLOUDFLARE_API_TOKEN" .github/workflows/ apps/api/ apps/web/ scripts/ docs/ .claude/` を実行し、参照箇所一覧を取得する。
2. 各参照について「Issue #640 で step-scoped 新 secret に切り替え済み」か「legacy token に依存したまま」かを区別する。
3. `bash scripts/cf.sh` 経由の D1 migration / export / audit log エクスポート等、手動運用 path の token 出所を確認する。
4. legacy token 依存が残っている場合は、本 task の前段で新 token への切替または別 unassigned task として分離する判断を記録する。

#### 成果物

- `outputs/phase-11/legacy-token-usage-inventory.md`

#### 完了条件

- legacy token に依存する path が 0 件、または全件が別 task / 切替計画に紐付いている状態が記録されている。

### Phase 2: operator-approved 経路での失効 / 切替

#### 目的

operator approval を取得したうえで legacy token を Cloudflare dashboard 上で revocation または rotation する。

#### 手順

1. operator に approval を依頼し、失効対象 token の name / id（実値ではなく識別子）を確認する。
2. `bash scripts/cf.sh` ラッパー or Cloudflare dashboard の API Token 画面のうち、operator が指定した経路で revocation を実行する。
3. revocation 直後に `bash scripts/cf.sh whoami` / `bash scripts/cf.sh d1 list` 等、新 token 経路の health check を実行し、deploy / D1 / audit path が新方式で動作することを再確認する。
4. revocation コマンド名 / exit code / 対象 token 識別子のみを redacted evidence として記録する（token 値・suffix・account id は記録しない）。

#### 成果物

- `outputs/phase-11/revocation-evidence.md`

#### 完了条件

- legacy token が dashboard 上で `revoked` 状態になっている。
- 新 token 経路の health check が green。

### Phase 3: 1Password / GitHub Secrets 最終整合

#### 目的

1Password 正本と GitHub Secrets の inventory drift を解消する。

#### 手順

1. GitHub Secrets から legacy 名義の `CLOUDFLARE_API_TOKEN` を削除（または step-scoped 新 secret 名へ完全置換）する。
2. `gh secret list` 等で残存 secret 名一覧を取得し、値は記録せず name のみ `outputs/phase-11/github-secrets-after.md` に保存する。
3. 1Password 正本の対応 item を確認し、`revoked` 注釈付きで残すか削除するかを operator が判断する。
4. 1Password item の name / vault / status のみを `outputs/phase-11/onepassword-item-status.md` に記録する（実値・参照 URI は記録しない）。

#### 成果物

- `outputs/phase-11/github-secrets-after.md`
- `outputs/phase-11/onepassword-item-status.md`

#### 完了条件

- GitHub Secrets / 1Password の状態が operator の判断どおりに整合し、evidence に記録されている。

### Phase 4: 正本仕様の inventory 更新

#### 目的

`deployment-secrets-management.md` の inventory を新方式単一参照に更新する。

#### 手順

1. `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の Cloudflare API Token 関連節を、legacy token revocation 後の状態に更新する。
2. step-scoped 新 secret 名 / 1Password item name / rotation 方針 / 失効済み legacy token の履歴注釈を追記する。
3. 残課題があれば `outputs/phase-12/unassigned-task-detection.md` に追加する。

#### 成果物

- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/unassigned-task-detection.md`

#### 完了条件

- `deployment-secrets-management.md` の更新案がレビュー可能な状態になっている。
- 残課題がある場合は unassigned task として記録されている。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] Cloudflare dashboard 上の legacy `CLOUDFLARE_API_TOKEN` が `revoked` 状態である。
- [ ] backend / D1 / audit / 手動運用 path の health check（`bash scripts/cf.sh whoami` / `d1 list` 等）が新方式で green である。
- [ ] GitHub Secrets から legacy 名義の `CLOUDFLARE_API_TOKEN` が削除（または完全置換）されている。
- [ ] 1Password 対応 item の状態が operator 判断どおりに整合している。

### 品質要件

- [ ] evidence にはコマンド名 / exit code / item name のみが記録され、token 値・suffix・account id・vault 内実値が含まれない。
- [ ] `rg` での legacy token 参照洗い出しが repository 全体に対して実行されている。
- [ ] revocation 直前 / 直後の health check が両方記録されている。

### ドキュメント要件

- [ ] `deployment-secrets-management.md` の inventory が新方式単一参照に更新されている。
- [ ] 失効履歴が `deployment-secrets-management.md` の changelog 節（または同等箇所）に注釈として残されている。
- [ ] 残課題が `outputs/phase-12/unassigned-task-detection.md` に整理されている。

---

## 6. 検証方法

### テストケース

- legacy token を使う旧経路（仮に再投入された場合）が Cloudflare API から `Unauthorized` を返すこと。
- 新 step-scoped token 経路の deploy / D1 / audit health check が green であること。
- evidence ファイルに redaction 漏れ（token 値・account id 等）がないこと。

### 検証手順

```bash
# Phase 1: legacy token 参照の洗い出し
rg -n "CLOUDFLARE_API_TOKEN" .github/workflows/ apps/api/ apps/web/ scripts/ docs/ .claude/

# Phase 2: 失効後の health check（新 token 経路）
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 list

# Phase 3: GitHub Secrets 残存名の確認（値は表示しない）
gh secret list

# Phase 4: 正本更新差分の確認
git diff .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
```

期待: 新 token 経路の health check が green であり、legacy token を使う path は repository 上 0 件、`deployment-secrets-management.md` の inventory が新方式単一参照になっている。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| legacy token に依存する backend / D1 / audit / 手動運用 path が残っており、失効で recovery 経路が破壊される | 高 | 中 | Phase 1 で `rg` 洗い出しを徹底し、依存が残る場合は本 task 前段で新 token に切替または別 task として分離する |
| revocation 直後に新 token 経路自体が壊れていて、deploy も recovery も止まる | 高 | 低 | Phase 2 で revocation 直前 / 直後の health check を必ず実施し、異常時は operator-approved rotation で即座にロールフォワードする |
| evidence に token 値や account id が混入する | 中 | 中 | redacted evidence のみを記録するルールを Phase 2 / Phase 3 の全成果物に適用し、レビュー時に suffix / id が含まれないことを目視確認する |
| 1Password / GitHub Secrets / Cloudflare dashboard の inventory drift が残る | 中 | 中 | Phase 3 で 3 surface すべてを同一作業セッション内で整合させ、`deployment-secrets-management.md` に最終状態を反映する |
| Issue #640 の staging / production evidence が未確定なまま本 task に着手する | 高 | 低 | Phase 0 相当として依存タスクの evidence 完了を前提条件に明記し、未完了時は本 task を着手しない |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/issue-640-oidc-cf-token-cutover/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/unassigned-task/issue-640-followup-001-oidc-full-migration.md`
- `docs/30-workflows/unassigned-task/issue-331-followup-003-oidc-step-scoped-cf-token-cutover.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`

### 参考資料

- Cloudflare API Tokens 管理画面（API Token revocation / rotation 仕様）
- GitHub Actions `secrets` scope と environment-scoped secret の挙動
- `scripts/cf.sh` ラッパー実装（`op run --env-file=.env` + `ESBUILD_BINARY_PATH` + `mise exec`）
- `.github/workflows/web-cd.yml` / `.github/workflows/backend-ci.yml` の `CLOUDFLARE_API_TOKEN` 参照箇所

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | 既存 `CLOUDFLARE_API_TOKEN` が backend / D1 / audit / 手動運用にまだ参照されている可能性があり、staging / production evidence 確定前に失効すると deploy / recovery 経路が破壊されるリスクがある |
| 原因 | Issue #640 cutover は GitHub Actions の deploy step を中心に進めたため、backend / D1 / audit / 手動運用 path の token 出所が完全には監査されていない |
| 対応 | Phase 1 で repository 全体に対する `rg` 洗い出しを義務化し、legacy token 依存が残る path は本 task 前段で新 token に切替または別 unassigned task として分離する設計に固定した |
| 再発防止 | 失効作業は必ず Issue #640 staging / production evidence の完了後に行い、revocation 直前 / 直後で `bash scripts/cf.sh whoami` 等の health check を実施することを Phase 2 の必須手順とする。evidence は redacted（コマンド名 / exit code / item name のみ）に限定し、token 値・suffix・account id を記録しない |
| 参照 | `docs/30-workflows/issue-640-oidc-cf-token-cutover/outputs/phase-12/unassigned-task-detection.md` |

### レビュー指摘の原文（該当する場合）

該当なし。Issue #640 Phase 12 `unassigned-task-detection.md` の「Legacy token revocation」行（`Revocation must happen after staging/production runtime deploy evidence confirms the step-scoped rollout.`）を正式タスク化したもの。

### 補足事項

- 本 task は `issue-640-followup-001-oidc-full-migration` と直列依存ではない。OIDC 完全移行を待たずに、step-scoped fine-grained token の安定運用が確認できた段階で実行可能。
- ただし OIDC 完全移行を先に実施した場合、legacy token の参照は構造的にゼロになるため、本 task の Phase 1 inventory が単純化される。
- revocation コマンドの具体名は本仕様書には焼き込まない（operator-approved 経路として `bash scripts/cf.sh` 系ラッパー or Cloudflare dashboard 手操作のいずれかを許容）。
- 1Password 正本との整合は最終確認のみ行い、vault 構造変更や item 再設計は別 issue で扱う。
- Phase 13 の commit / PR はユーザー承認ゲートであり、本タスクの作成時点では実行しない。
