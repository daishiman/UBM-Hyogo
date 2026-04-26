# CI/CD workflow topology and deployment spec drift cleanup - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-ref-cicd-workflow-topology-drift-001                                     |
| タスク名     | CI/CD workflow topology and deployment spec drift cleanup                     |
| 分類         | リファクタリング                                                              |
| 対象機能     | GitHub Actions workflow と Cloudflare deploy 正本仕様の整合                   |
| 優先度       | 高                                                                            |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | 05a Phase 12                                                                  |
| 発見日       | 2026-04-26                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

05a の GitHub Actions cost guardrail は workflow 実体を前提にしている。一方、正本仕様は `web-cd.yml` や旧 Node / pnpm 前提を残しており、実体は `ci.yml` / `validate-build.yml` 中心になっている。`apps/web/wrangler.toml` も `pages_build_output_dir = ".next"` を持つが、正本仕様には OpenNext Workers 方針が並走している。

### 1.2 問題点・課題

- 監視対象 workflow 名と実在 workflow 名がずれており、05a の cost guardrail が存在しない workflow を監視対象としかねない
- Node / pnpm バージョン表記が実体（Node 24 / pnpm 10）と仕様で異なる
- Cloudflare deploy target が Pages / Workers / OpenNext のいずれが current contract か明示されていない

### 1.3 放置した場合の影響

- 監視対象が実在しないため、無料枠超過アラートが機能しない
- 新規開発者が古い仕様を参照し、誤った workflow 設計や deploy 設定を行う
- 05a / 05b handoff 後に「監視対象 workflow が無い」事象が発生し、再調査コストが発生

---

## 2. 何を達成するか（What）

### 2.1 目的

GitHub Actions workflow と Cloudflare deploy spec を「コード実体」に同期し、05a の監視対象を current facts に揃える。

### 2.2 最終ゴール

- workflow 名・Node・pnpm・job 構成が正本仕様と一致
- Cloudflare deploy target（Pages builds / Workers Builds / OpenNext）の current contract が明示
- 05a の monitoring target が実在する workflow のみを参照

### 2.3 スコープ

#### 含むもの

- `.github/workflows/*.yml` の棚卸し（workflow 名、Node、pnpm、job、deploy target）
- `deployment-gha.md` / `deployment-cloudflare.md` / 05a 成果物の差分比較
- `apps/web/wrangler.toml` と OpenNext 表記の整合
- 仕様修正（docs-only）と実装変更が必要な部分の分離

#### 含まないもの

- 実装変更そのもの（workflow 改修・wrangler 変更）は別タスク化
- 新規 workflow の追加
- Cloudflare 有料プラン検討

### 2.4 成果物

- workflow 棚卸し表
- 正本仕様（`deployment-gha.md` / `deployment-cloudflare.md`）の更新差分
- 05a 監視対象の current 化差分
- docs-only 差分 / 実装要対応差分の分離リスト

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `.github/workflows/` と `apps/web/wrangler.toml` を読める
- 05a 成果物（observability-matrix, cost-guardrail-runbook）を把握済み

### 3.2 依存タスク

なし（05a の文書整合は本タスクに限定）

### 3.3 必要な知識

- GitHub Actions YAML 構造
- Cloudflare Pages / Workers / OpenNext deploy 方式
- pnpm workspace と Node バージョン管理（mise）

### 3.4 推奨アプローチ

コード実体を正とした差分表を作り、正本仕様を更新する。実装変更が必要な場合は別 Phase で workflow を直し、docs-only で閉じない。

---

## 4. 実行手順

### Phase構成

1. workflow 棚卸し
2. 仕様差分抽出
3. deploy contract 決定
4. 仕様更新と分離

### Phase 1: workflow 棚卸し

#### 目的

`.github/workflows/*.yml` の current state を把握する。

#### 手順

1. `.github/workflows/*.yml` を一覧化
2. 各 workflow から workflow 名・trigger・Node・pnpm・job・deploy target を抽出

#### 成果物

workflow 棚卸し表

#### 完了条件

全 workflow が表に記録されている

### Phase 2: 仕様差分抽出

#### 目的

正本仕様と実体の差分を一覧化する。

#### 手順

1. `deployment-gha.md` の workflow 名と実体を比較
2. Node / pnpm バージョン差分を抽出
3. 05a の monitoring target 一覧との差分を抽出

#### 成果物

仕様差分表

#### 完了条件

差分箇所が file:line で特定されている

### Phase 3: deploy contract 決定

#### 目的

Pages / Workers / OpenNext のどれを current contract とするか決める。

#### 手順

1. `apps/web/wrangler.toml` の `pages_build_output_dir` を確認
2. OpenNext Workers 方針との整合を判断
3. current contract をドキュメント化

#### 成果物

deploy contract 決定メモ

#### 完了条件

current contract が一意に決まっている

### Phase 4: 仕様更新と分離

#### 目的

仕様修正と実装要対応を分離する。

#### 手順

1. `deployment-gha.md` / `deployment-cloudflare.md` を更新
2. 05a の monitoring target を current 化
3. 実装変更が必要な差分を別タスク候補としてリスト化
4. Phase 12 close-out と LOGS を更新

#### 成果物

仕様更新差分 + 別タスク候補リスト

#### 完了条件

docs-only 差分は本タスクで close、実装要対応は別タスク化

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] GitHub Actions workflow 名が正本仕様と一致している
- [ ] Node / pnpm バージョン表記が実体と一致している
- [ ] deploy target が `apps/web/wrangler.toml` と一致している
- [ ] 05a の monitoring target が存在する workflow だけを指している
- [ ] Pages builds と Workers Builds / OpenNext のどちらを無料枠監視対象にするかが明確

### 品質要件

- [ ] `audit-unassigned-tasks.js` の currentViolations = 0
- [ ] 実装変更が必要な差分は別タスク化されている

### ドキュメント要件

- [ ] `deployment-gha.md` 更新
- [ ] `deployment-cloudflare.md` 更新
- [ ] 05a 成果物の monitoring target 更新

---

## 6. 検証方法

### テストケース

- 棚卸し表の workflow 名が `.github/workflows/` に実在する
- 05a の monitoring target に存在しない workflow が含まれていない

### 検証手順

```bash
rg -n "node-version|pnpm|web-cd|ci.yml|validate-build|wrangler|pages_build_output_dir" .github apps/web .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --target-file docs/30-workflows/unassigned-task/task-ref-cicd-workflow-topology-drift-001.md
```

---

## 7. リスクと対策

| リスク                                                          | 影響度 | 発生確率 | 対策                                              |
| --------------------------------------------------------------- | ------ | -------- | ------------------------------------------------- |
| docs だけ直して実装差分を放置する                               | 高     | 中       | workflow 実装が必要な差分は別タスク化する         |
| 05a の cost guardrail が存在しない workflow を監視する          | 高     | 高       | workflow 名の実在確認を完了条件にする             |
| Pages / Workers / OpenNext の current contract 判断が割れる     | 中     | 中       | `apps/web/wrangler.toml` を一次ソースとする        |

---

## 8. 参照情報

### 関連ドキュメント

- `.github/workflows/`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md`

### 参考資料

- `apps/web/wrangler.toml`
- OpenNext Cloudflare adapter ドキュメント

---

## 9. 備考

### 苦戦箇所【記入必須】

> 05a 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | 05a Phase 2 で監視対象 workflow を整理しようとしたが、`wrangler.toml` の Pages 出力と OpenNext Workers 方針が二重定義されており current contract が即断できなかった |
| 原因     | 正本仕様（deployment-cloudflare.md）と実装（apps/web/wrangler.toml）の更新タイミングが揃っておらず、実体と仕様が並列に進化している             |
| 対応     | 05a では `pages_build_output_dir = ".next"` を一次ソースとして Pages builds を監視対象に採用し、方針差分は本未タスクへ切り出した                |
| 再発防止 | deploy contract を決める際は必ず `wrangler.toml` を一次ソースとし、仕様 doc は派生情報として扱うルールをテンプレ化する                          |

### レビュー指摘の原文（該当する場合）

```
05a Phase 12 unassigned-task-detection.md U-03 として formalize
```

### 補足事項

05a の文書整合は現ターンで補正する。workflow 実装そのものの変更はこの未タスクで扱う。
