# transport デプロイ齟齬の運用是正（旧 bundle 残存） - タスク指示書

## メタ情報

```yaml
issue_number: 1191
```

| 項目         | 内容                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| タスクID     | task-transport-deploy-drift-operational-fix                                                                  |
| タスク名     | transport デプロイ齟齬の運用是正（旧 bundle 残存）                                                           |
| 分類         | 運用是正（deploy オペレーション + runbook）                                                                  |
| 対象機能     | web↔api transport / service-binding 健全性                                                                   |
| 優先度       | low                                                                                                          |
| 見積もり規模 | 小〜中                                                                                                       |
| ステータス   | `deferred_pending_root_cause`                                                                                |
| 発見元       | profile-session-fetch-failure-investigation Phase 12 unassigned-task-detection                              |
| 発見日       | 2026-06-09                                                                                                   |
| 親タスク     | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation`                             |
| タスク種別   | ops / NON_VISUAL                                                                                             |

---

## Deferred Status（着手前提）

この未タスクは **真因 H5（transport 失敗・旧 bundle 残存 / service-binding 未応答）が確定した場合のみ着手する**条件付きタスクである。
分離理由（親ワークフロー CONST_007 例外①）: deploy 操作は user-gated で、再デプロイ要否・運用手順是正の方針は
真因確定前に決められない。Phase 11 MT-B 診断スクリプトで「deploy 版数齟齬」または「service-binding 未応答」が
確認されることが着手の前提条件となる。

依存:
- 本調査の真因確定（H5）
- 診断スクリプト（`scripts/diagnose-profile-session.sh`）の deploy 版数 / service-binding 結果

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親ワークフロー `profile-session-fetch-failure-investigation` は、staging `/profile` のセッション取得失敗
（`MEMBER_SESSION_FAILED` → デフォルト分岐）の真因調査と観測性向上を実装した。
本格修正は真因が確定しないと方針を決められないため未タスク化されており、その 1 件が本タスク（C-3）である。

web→api の通信は `apps/web/src/lib/fetch/transport.ts` が担い、
**service-binding 優先 → baseUrl → local fallback → 非 local で throw** の順で解決する。
staging では `apps/web/wrangler.toml` の `[env.staging]` に `API_SERVICE`（service-binding）と
`INTERNAL_API_BASE_URL` が設定済みである。

真因仮説 H5 は次のとおり:

> service-binding が未応答、または古い bundle が staging に残存し、`/me` が **transport レベルで失敗** する。
> このとき error message に 3 桁の HTTP ステータスが含まれないため `statusFromError` → `null` となり、
> `MEMBER_SESSION_FAILED` に分類され、デフォルト分岐（画像で観測された症状）に落ちる。

本調査では `scripts/diagnose-profile-session.sh`（read-only・冪等）が deploy 版数確認と `/me` status 確認の
手順を集約した。**しかし「deploy 齟齬が見つかった後の運用是正（再デプロイ手順・版数同期の運用ルール化・
service-binding 健全性チェックの定常化）」は未着手**である。

### 1.2 問題点・課題

- これは **コードバグではなく運用（deploy オペレーション）の齟齬** である。`apps/api` と `apps/web` は別 Worker であり、
  両者の deploy 版数がずれると、service-binding 経由の呼び出しが旧 contract を見て失敗しうる。
  版数同期は **CI/運用ルールで担保すべき問題**であり、コード修正の射程外にある。
- 診断スクリプトは read-only で「齟齬を検出」できるが、是正（再デプロイ）は副作用があり user-gated である。
  **診断と是正を同一スクリプトに混ぜると read-only 不変条件を壊す**ため、是正手順は別 runbook に分離する必要がある。
- 「service-binding 未応答」と「旧 bundle 残存」は症状が似るが原因が異なる（前者は binding 設定 / Worker 死活、
  後者は deploy 漏れ）。両者を切り分ける運用手順がまだ整備されていない。

### 1.3 放置した場合の影響

- deploy 版数の齟齬が再発したとき、毎回その場限りの手作業で復旧することになり、復旧手順の属人化・再現性欠如が残る。
- service-binding 未応答が定常監視されないため、`/me` の transport 失敗が再び「画像症状」として表面化し、
  ユーザーがセッション切れと誤認する状態が再来する。
- 「診断 → 是正」の境界が曖昧なまま運用すると、read-only 診断スクリプトに副作用のある再デプロイが混入し、
  調査時に意図しない deploy を誘発する事故リスクが残る。

---

## 2. 何を達成するか（What）

### 2.1 目的

真因 H5（deploy 齟齬 / service-binding 未応答）が確定した状況において、
**再デプロイによる是正手順を runbook 化**し、**版数同期と service-binding 健全性チェックを運用ルールとして定常化**する。
コード修正ではなく、deploy オペレーションとガバナンスの是正で transport 齟齬の再発を防ぐ。

### 2.2 最終ゴール

- 旧 bundle 残存 / service-binding 未応答を検出した後の **再デプロイ手順が runbook として独立**して存在する
  （read-only 診断スクリプトとは分離）。
- `apps/api` と `apps/web` の **deploy 版数同期を担保する運用ルール**が文書化されている。
- service-binding の **健全性チェックが定常運用に組み込まれている**（手順 or 定期チェックの明文化）。
- 「service-binding 未応答」と「旧 bundle 残存」を **切り分ける判断手順**が runbook に含まれている。

### 2.3 スコープ

#### 含む

- 真因 H5 確定後の再デプロイ runbook 作成（`bash scripts/cf.sh deploy ... --env staging` 経由・user-gated 明記）
- `apps/api` / `apps/web` の deploy 版数同期の運用ルール化（版数確認 → 齟齬時の同期再デプロイ手順）
- service-binding 健全性チェックの定常化（手順の明文化、必要なら CI / 定期チェックへの組み込み判断）
- deploy 版数出力と service-binding 応答を突き合わせた「未応答 vs 旧 bundle 残存」の切り分け手順

#### 含まない

- `apps/web` / `apps/api` の **コードロジック変更**（本タスクはコード修正の射程外）
- 診断スクリプト `scripts/diagnose-profile-session.sh` 本体の **機能変更**（read-only 不変条件を保持）
- D1 schema 変更 / Google Form 仕様変更
- 真因が H5 以外（コード経路の不具合等）と確定した場合の修正（別タスク責務）

---

## 3. どう実現するか（How）

### 3.0 着手前提（必須）

着手前に以下が満たされていることを確認する。

1. 親調査で真因が **H5（transport 失敗・旧 bundle 残存 / service-binding 未応答）** と確定している。
2. Phase 11 MT-B の診断結果（`scripts/diagnose-profile-session.sh` 実行結果）に、
   **deploy 版数齟齬** または **service-binding 未応答** が記録されている。

上記いずれも満たさない場合は着手せず、`deferred_pending_root_cause` のまま据え置く。

### 3.1 是正ステップ（再デプロイ・user-gated）

1. 診断スクリプトで deploy 版数 / `/me` status / service-binding 応答を取得する（read-only）。
2. 版数出力と service-binding 応答を突き合わせ、症状を切り分ける。
   - service-binding 応答なし & Worker 死活 NG → **service-binding 未応答** 側
   - 版数が想定より古い & binding は応答する → **旧 bundle 残存** 側
3. 是正方針を確定したうえで、**ユーザー承認後に**再デプロイを実行する。
   ```bash
   # ⚠️ 実 deploy は user-gated。wrangler 直叩き禁止。scripts/cf.sh 経由のみ。
   bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
   # 版数齟齬が api 側の場合は api も同期再デプロイ（承認後）
   bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
   ```
4. 再デプロイ後、診断スクリプトを再実行して deploy 版数が同期し `/me` が正常応答することを確認する。

### 3.2 運用ルール化

- **版数同期ルール**: `apps/api` / `apps/web` を deploy する際は、相手 Worker の版数とずれが生じないよう
  同期確認手順を runbook に明記する（少なくとも service-binding contract に影響する変更時は両者を同一機会で deploy）。
- **service-binding 健全性チェック**: staging の `API_SERVICE` binding が応答することを定期的に確認する手順を定義し、
  必要なら CI / 定期チェックへ組み込むかを判断する（組み込み是非自体は本タスクで判断）。
- **診断と是正の分離**: 是正手順（副作用あり）は `scripts/diagnose-profile-session.sh` には**混ぜず**、
  独立 runbook（例: `outputs/phase-XX/transport-deploy-drift-runbook.md` 想定）に置く。

---

## 苦戦箇所【記入必須】

- 対象: `apps/web/src/lib/fetch/transport.ts` / `apps/api/wrangler.toml` / `apps/web/wrangler.toml`
- 症状: これは **コードバグでなく運用（deploy オペレーション）の齟齬**である。`apps/api` と `apps/web` は別 Worker で、
  両者の deploy 版数がずれると service-binding 経由の呼び出しが旧 contract を見て失敗しうる。
  「コードを直せば終わり」と考えると本質を外す。**版数同期は CI / 運用ルールで担保すべき問題**であり、
  transport.ts のコード修正の射程外である。
- 参照: `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-12/unassigned-task-detection.md`

- 対象: `scripts/diagnose-profile-session.sh`
- 症状: 診断スクリプトは read-only で「齟齬を検出」できるが、是正（再デプロイ）は副作用があり user-gated である。
  **診断と是正を同一スクリプトに混ぜると read-only 不変条件を壊す**罠がある。是正手順は必ず別 runbook に分離すること。
- 参照: `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/manual-test-result.md`

- 対象: service-binding 未応答 vs 旧 bundle 残存の切り分け
- 症状: 「service-binding 未応答」と「旧 bundle 残存」は症状が似るが原因が違う（前者は binding 設定 / Worker 死活、
  後者は deploy 漏れ）。診断スクリプトの **deploy 版数出力と service-binding 応答を突き合わせて切り分ける**必要があり、
  片方だけ見て再デプロイすると、binding 設定不備を deploy 漏れと誤認して無駄な再デプロイを繰り返す罠がある。
- 参照: `apps/web/src/lib/fetch/transport.ts`（service-binding 優先 → baseUrl → local fallback → throw の解決順）

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| コード修正で解決しようとして本質（運用齟齬）を外す | 高 | スコープに「コードロジック変更を含まない」を明記。版数同期は CI / 運用ルールで担保する方針を §1.2 / §3.2 に固定 |
| 診断スクリプトに是正（再デプロイ）を混入させ read-only 不変条件を壊す | 高 | 是正手順は独立 runbook に分離。`scripts/diagnose-profile-session.sh` 本体は機能変更しない（スコープ外） |
| service-binding 未応答と旧 bundle 残存を誤判定する | 中 | deploy 版数出力と service-binding 応答を突き合わせて切り分ける手順を runbook に必須化 |
| 真因 H5 未確定のまま着手し方針が空転する | 中 | §3.0 着手前提を満たさない限り `deferred_pending_root_cause` のまま据え置く |
| 承認なしに deploy を実行してしまう | 高 | 全 deploy は user-gated。`bash scripts/cf.sh` 経由のみ・wrangler 直叩き禁止を手順に明記 |
| api / web を片側のみ再デプロイし版数ずれが残る | 中 | contract 影響変更時は両 Worker を同一機会で deploy する版数同期ルールを定義 |

---

## 検証方法

### 診断（read-only・常時実行可）

```bash
# deploy 版数 / /me status / service-binding 応答を read-only で取得
bash scripts/diagnose-profile-session.sh

# api / web の deploy 版数確認（read-only。承認不要）
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env staging
```

期待: deploy 版数齟齬の有無 / `/me` の status / service-binding の応答有無が把握でき、
「未応答」か「旧 bundle 残存」かを切り分けられる。

### 是正（実 deploy は user-gated）

```bash
# ⚠️ 実 deploy はユーザー承認後のみ。wrangler 直叩き禁止・scripts/cf.sh 経由のみ。
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

期待: 再デプロイ後に診断スクリプトを再実行し、deploy 版数が同期し `/me` が正常応答（transport 失敗が解消）する。

### 運用ルール化の検証

```bash
# 是正 runbook が診断スクリプトと分離して存在するか（read-only 不変条件の確認）
test -f docs/30-workflows/<this-task>/outputs/phase-XX/transport-deploy-drift-runbook.md

# 診断スクリプトに deploy 等の副作用コマンドが混入していないこと
grep -nE "cf.sh deploy|wrangler deploy" scripts/diagnose-profile-session.sh && echo "NG: 是正混入" || echo "OK: read-only 維持"
```

期待: 是正 runbook が独立して存在し、診断スクリプトには副作用コマンドが混入していない。

---

## 4. 関連リンク

| 種別 | パス | 用途 |
| --- | --- | --- |
| 親ワークフロー | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/` | 調査・観測性向上の正本 |
| 親未タスク検出 | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-12/unassigned-task-detection.md` | C-3 分離根拠（CONST_007 例外①） |
| 親手動テスト結果 | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/manual-test-result.md` | MT-B 診断結果（着手前提の deploy 版数 / service-binding 結果） |
| 診断スクリプト | `scripts/diagnose-profile-session.sh` | deploy 版数 / `/me` status / service-binding 応答の read-only 診断 |
| transport 実装 | `apps/web/src/lib/fetch/transport.ts` | service-binding 優先 → baseUrl → local fallback → throw の解決順 |
| web Worker 設定 | `apps/web/wrangler.toml` | `[env.staging]` の `API_SERVICE` / `INTERNAL_API_BASE_URL` |
| デプロイラッパー | `scripts/cf.sh` | user-gated な deploy / rollback の正規経路（wrangler 直叩き禁止） |
