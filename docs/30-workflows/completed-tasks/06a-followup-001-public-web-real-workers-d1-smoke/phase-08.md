# Phase 8: DRY 化

## 目的

Phase 4 curl matrix と Phase 5 runbook の重複を排除し、Phase 11 手動 smoke 実施時に「同じ curl を local / staging で 2 回書く」状態を回避する。本タスクは smoke が中心で実装ファイルを増やさないため、DRY 化の主対象は **runbook 内コマンド片** と **evidence ファイル命名** の 2 領域に閉じる。

## DRY 対象 1: curl helper の概念化

### Before（Phase 4 / Phase 5 重複）

- Phase 4 curl matrix: 4 route family / 5 smoke cases × 2 環境 = 10 セルそれぞれに `curl -s -o /dev/null -w "%{http_code}\n" <URL>` を列挙
- Phase 5 runbook: 同じ 10 行を local 用 / staging 用に再掲

### After（Phase 8 統一）

Phase 5 runbook 内に **base URL を引数に取る shell 関数の擬似形式** を 1 箇所だけ定義し、Phase 4 matrix からはこの関数名を参照する。

擬似形式（runbook に記載するイメージ、実装ファイルは作らない）:

```
# 擬似コード — runbook の記述例
smoke_routes() {
  local base="$1"   # 例: http://localhost:3000 または staging URL
  local label="$2"  # 例: local / staging
  for path in "/" "/members" "/members/$SEEDED_ID" "/members/UNKNOWN" "/register"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "${base}${path}")
    printf "%s\t%s\t%s\n" "${label}" "${path}" "${code}"
  done
}
```

> **注**: 上記はあくまで runbook 内の説明用擬似形式。実体スクリプトは Phase 11 実施者の判断で 1 ファイル化しても良いが、本タスクは仕様書化のみのため実装は scope out。

### 効果

- curl 行の重複が 10 → 1（関数定義 1 箇所 + 呼び出し 2 箇所）
- 期待値の差分（`/members/UNKNOWN` が 404）が 1 箇所で表現される
- secret hygiene: staging URL を引数化することで runbook 本文に staging URL ハードコードを残さない

## DRY 対象 2: evidence ファイル命名

### Before（暗黙）

phase 11 evidence 配下に `curl.log`, `smoke-local.log`, `smoke-prod.log` 等の揺らぎが発生する余地。

### After（固定）

| 用途 | ファイル名 | 配置 |
| --- | --- | --- |
| local 4 route family / 5 smoke cases + 起動ログ + AC-7 rg 結果 | `local-curl.log` | `outputs/phase-11/evidence/` |
| staging 4 route family / 5 smoke cases + AC-5 vars 確認コメント | `staging-curl.log` | 同上 |
| staging で 1 ルート（`/` or `/members`）の画面 | `staging-screenshot.png` | 同上 |

3 ファイル固定。これ以上増やさない。Phase 7 AC マトリクスもこの 3 ファイルだけを参照する。

## DRY 対象 3: Phase 5 runbook と Phase 6 異常系の重複削減

### Before

Phase 5 runbook が「正常系コマンド」を、Phase 6 異常系が「失敗時のリカバリコマンド」を別々に列挙し、esbuild mismatch 対応コマンドが両方に重複する可能性がある。

### After

- **Phase 5 runbook**: 正常系 + 起動前提（migration list 確認）のみに限定
- **Phase 6 異常系**: 失敗パターンと「Phase 5 runbook のどのステップから再開するか」だけを書き、コマンド自体は Phase 5 を参照する
- esbuild mismatch 解消は `scripts/cf.sh` 経由起動という単一手段のみで担保（リカバリ不要）

## DRY 化で生じない重複（許容する重複）

| 項目 | 理由 |
| --- | --- |
| AC-2 と AC-4 で同じルートを叩く | local / staging という観点軸が異なるため別 AC に分離する正当性がある |
| Phase 7 AC マトリクスと Phase 4 curl matrix | 切り口が「AC × evidence」と「route × env」で異なる |
| 不変条件 #5 の Phase 1 / Phase 3 / Phase 7 言及 | フェーズごとの責務（要件 / 設計 / 検証）として必要な再確認 |

## 副作用 / リスク

- runbook 内擬似 shell 関数の引数順序が変わると Phase 11 実施者の手作業に揺らぎが出る → 関数定義は Phase 5 内 1 箇所のみに固定
- evidence 3 ファイル固定により、追加の curl 結果（例: D1 query log）は `local-curl.log` の末尾セクションに追記する形で吸収

## 完了条件

- [ ] 既存の完了条件を満たす

- `outputs/phase-08/main.md` に Before / After を表で記録
- Phase 4 curl matrix と Phase 5 runbook の curl 行が 1 箇所定義 + 参照構造になることが Phase 5 改訂時に守れる前提が明文化されている
- evidence ファイル 3 種固定が Phase 7 と Phase 11 の両方で参照される

## メタ情報

- workflow: `06a-followup-001-public-web-real-workers-d1-smoke`
- phase: 8
- status: `spec_created / pending`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`

## 実行タスク

- curl helper と evidence naming の重複を減らす
- runbook と matrix の手順が矛盾しないことを確認する

## 参照資料

- `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md`
- `CLAUDE.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 成果物

- `outputs/phase-08/main.md`

## 統合テスト連携

- Phase 11 の local / staging curl smoke と AC trace に接続する。
- UI regression ではなく NON_VISUAL の HTTP / D1 binding evidence を正本にする。
