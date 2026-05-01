# Phase 6: テスト拡充（回帰 guard / 運用ルール）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充（回帰 guard / 運用ルール） |
| 前 Phase | 5 (実装 / docs sync) |
| 次 Phase | 7 (カバレッジ確認) |
| 状態 | spec_created |

## 目的

docs-only 改修の特性に合わせ、Phase 4 の検証コマンド suite を **回帰 guard** として運用へ持ち込む手順と、将来 workflow が追加 / リネームされた際の同期ルールを記述する。
本 Phase ではコードを書かず、運用ガイドの追記候補と未タスク候補のみを規定する。

## 追加する回帰 guard 候補

### G-1: SSOT 5 workflow 列挙の継続性チェック（CI 化候補）

```bash
required=("ci.yml" "backend-ci.yml" "validate-build.yml" "verify-indexes.yml" "web-cd.yml")
for w in "${required[@]}"; do
  rg -q "$w" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md \
    || { echo "MISSING: $w"; exit 1; }
done
```

- 効果: 将来 SSOT が誤編集で workflow を取り落とした場合に CI で fail させられる。
- 本タスク内では実装しない。Phase 12 で **未タスク候補** として記録する。

### G-2: Discord 通知 current facts と実体の整合（CI 化候補）

```bash
hits=$(grep -ciE "discord|webhook|notif" \
  .github/workflows/{ci,backend-ci,validate-build,verify-indexes,web-cd}.yml | awk -F: '{s+=$2}END{print s}')
[ "$hits" = "0" ] || { echo "Discord 通知が配線済み。SSOT current facts を更新せよ"; exit 1; }
```

- 効果: 将来 Discord/Slack 通知が配線された瞬間に SSOT 更新を強制できる。
- 本タスク内では実装しない。Phase 12 で **未タスク候補** として記録する。

## 運用ルール（手順書追記候補）

### R-1: workflow 追加時の SSOT 同期手順

1. `.github/workflows/<new>.yml` を追加する際、PR 内に以下を含める:
   - SSOT (`observability-matrix.md`) の **環境別観測対象** に dev / main 両方への追記
   - **CI/CD Workflow 識別子マッピング** 表に file / display name / job id / required status context の 4 列を追加
   - **Discord 通知 current facts** の対象一覧を更新
2. PR description で「SSOT 同期済み」を明示する。

### R-2: workflow リネーム時の SSOT 同期手順

1. file 名 / display name / job id のいずれかが変わった場合、SSOT 4 列分離 mapping 表の該当行を更新する。
2. 旧名の参照が他ドキュメントに残らないか `rg <old-name> docs/` で確認する。

### R-3: required_status_checks 変更時の手順

1. UT-GOV-001 で `gh api .../branches/{dev,main}/protection` を再取得。
2. SSOT の「required status context」列と diff を取り、SSOT 側を branch protection 正本に追従させる。

## fail path（将来 workflow が追加された場合）

- 6 本目以降の workflow（例: `e2e-tests.yml` の本タスク取り込み等）が追加された場合、本 mapping 表のスコープを拡張する。
- 拡張は本タスクのスコープ外。Phase 7 で「スコープ外 3 本」を未タスク候補として一覧化し、Phase 12 で起票予約する。

## 成果物

- `outputs/phase-06/main.md` — 回帰 guard 候補（G-1 / G-2）と運用ルール（R-1〜R-3）の記録
