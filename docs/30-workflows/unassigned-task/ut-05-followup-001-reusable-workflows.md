# UT-05 Follow-up 001: reusable workflow 化検討

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-05-FU-001 |
| タスク名 | reusable workflow 化検討 |
| 優先度 | LOW |
| 推奨Wave | Wave 2 以降 |
| 作成日 | 2026-04-27 |
| 種別 | improvement |
| 状態 | unassigned |
| 由来 | UT-05 Phase 8 §5.2 / Phase 10 MINOR-A・MINOR-B |
| 親タスク | docs/30-workflows/ut-05-cicd-pipeline |

## 目的

`ci-gate` や lint / typecheck / test の共通処理を `_*.reusable.yml`（`workflow_call`）として切り出し、UT-X / 別リポでも再利用可能にできるかを検討する。Phase 8 で composite action 化（`.github/actions/setup-node-pnpm/action.yml`）は確定済みのため、その上位レイヤーである「ジョブ単位の再利用」が妥当かを判定する。

## スコープ

### 含む

- `ci.yml` の lint-typecheck / unit-test / build-smoke ジョブを reusable workflow（`workflow_call`）として切り出した場合のコスト/可読性比較
- composite action（Phase 8 で確定済み）と reusable workflow の責務分離マトリクス
- 呼び出し側 workflow からの inputs / secrets スコープ受け渡し設計
- 既存 `ci.yml` / `web-cd.yml` / backend deploy workflow との後方互換確認

### 含まない

- composite action そのものの再設計（Phase 8 で完了）
- 別リポへの公開（OSS 化は別タスク）
- reusable workflow の本実装（本タスクは判断のみ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-05 CI/CD pipeline 仕様書 + 04-serial 実装完了 | 既存 workflow が稼働していることが比較の前提 |
| 上流 | Phase 8 outputs/dry-refactor-plan.md | composite action 仕様の確定済み内容を踏まえる |
| 下流 | UT-05-FU-002（matrix 拡張） | reusable 化と matrix 拡張は同時設計が望ましい |

## 苦戦箇所・知見

**1. composite action と reusable workflow の責務境界が曖昧**
Phase 8 では「初期段階では composite action のみで十分」と判定されたが、判断基準を明文化しないと実装時に再議論が発生する。原則として「単一 step にまとめられる処理 = composite action」「複数 job に跨る依存・matrix 表現が必要 = reusable workflow」と切り分けること。混在させると保守責務マトリクス（Phase 8 §保守責務）が破綻する。

**2. `secrets: inherit` のスコープ漏れリスク**
reusable workflow を呼び出す際に `secrets: inherit` を使うと、呼び出し側の全 secrets が透過する。Cloudflare API Token のような高権限 secret を不要なジョブに露出させない設計が必要。Phase 2 の `secrets-placement-matrix.md` と整合する形で、明示的な `secrets:` ブロックでの個別宣言を推奨する。

**3. `ci-gate` ジョブ（polling 方式）の依存関係が壊れやすい**
Phase 12 §4 MINOR-G で `ci-gate` は polling 方式実装済みと記録されているが、reusable 化すると `needs:` の参照先パスが変わる。呼び出し側で `needs: [reusable-job-id]` の指定方法（job output の参照規約）を事前定義しないと、deploy ブロック条件が機能しなくなる。

**4. 呼び出しオーバーヘッドの実測が必要**
reusable workflow は別 workflow run として起動するため、起動オーバーヘッド（数秒〜十数秒）が積み上がる。月 2,000 分の private 無料枠（UT-05-FU-003 監視対象）を圧迫しないか、実測値ベースで判定する必要がある。机上比較では結論が出ない。

**5. Phase 8 で「composite で十分」と判定された前提を再評価**
本 follow-up を起動する条件は「UT-X など第二の利用ケースが顕在化した時点」とすべき。利用ケース 1 件のみで reusable 化すると YAGNI に該当する。判定根拠を本仕様書に明記し、起動条件を満たさない限り Wave に組み込まない。

## 受入条件

- [ ] `_*.reusable.yml` 化した場合の呼び出しコスト（runner 起動オーバーヘッド）と可読性を実測または見積もりで比較している
- [ ] composite action だけで十分な範囲と reusable workflow が必要な範囲を責務マトリクスで分離している
- [ ] UT-05 の既存 workflow（`ci.yml` / `web-cd.yml` / backend deploy）との後方互換性を保っている
- [ ] `secrets: inherit` を使わず明示的な secrets スコープを宣言している
- [ ] 起動条件（第二の利用ケース顕在化）を満たすことを示す根拠が記録されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/phase-08.md | DRY 化方針・composite action 仕様 |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/phase-10.md | MINOR-A / MINOR-B 指摘内容 |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/outputs/phase-12/unassigned-task-detection.md | 検出記録 §2.1 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | GitHub Actions 設計指針 |
