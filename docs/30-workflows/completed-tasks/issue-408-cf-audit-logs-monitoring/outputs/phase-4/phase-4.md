# Phase 4: 検証シナリオ設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |

## 目的

Phase 5 で実装する fetcher / analyzer / classifier に対して、本番 Cloudflare Audit Logs API を呼ばずに正しさを保証できる**合成 fixture** と **dry-run 経路** を確定する。HIGH / MEDIUM / LOW / 無検知 / parser 異常の 5 シナリオを fixture 化し、Phase 6 unit test と Phase 8 e2e test の入力として再利用する。

## スコープ

| 含む | 含まない |
| --- | --- |
| 5 種類の合成 Audit Log JSON fixture 設計 | 本番 Cloudflare API 直接叩き（Phase 11 で実施） |
| `--dry-run` フラグの IO 仕様 | Slack/メール経路の dry-run（MVP 範囲外） |
| ベースライン学習（7 日合成データ）検証シナリオ | ML モデル評価 |
| シナリオ × fixture × 期待 severity マトリクス | Cloudflare Logpush 連携検証 |

## fixture 一覧

すべて `scripts/cf-audit-log/__fixtures__/` 配下に配置する。Cloudflare Audit Logs API レスポンス形（`{ result: AuditLogEvent[], result_info: { cursor } }`）に揃える。

| # | fixture path | シナリオ | 期待 severity | 期待 Issue label |
| --- | --- | --- | --- | --- |
| F1 | `scripts/cf-audit-log/__fixtures__/normal.json` | GitHub Actions runner IP からの deploy 成功 | null（無検知） | （起票なし） |
| F2 | `scripts/cf-audit-log/__fixtures__/foreign-ip.json` | 想定外 IP からの認証成功（GitHub IP range 外 + UA 不一致） | HIGH | `priority:high`, `type:security` |
| F3 | `scripts/cf-audit-log/__fixtures__/403-burst.json` | 同一 Token で 1h 内に 403 が 10 件 | MEDIUM | `priority:medium`, `type:security` |
| F4 | `scripts/cf-audit-log/__fixtures__/off-hours.json` | JST 03:00 (UTC 18:00) の正常 success（業務時間 09-22 JST 外） | LOW | `priority:low`, `type:security` |
| F5 | `scripts/cf-audit-log/__fixtures__/malformed.json` | 必須フィールド欠落 / 型不正 / cursor 未終端 | parser エラー（throw せず skip + warn log） | （起票なし／warning） |

## fixture-spec.md（個別仕様）

### F1 normal.json

| フィールド | 値 |
| --- | --- |
| `actor.email` | `cloudflare-deploy@github-actions` |
| `when` | 2026-05-05T13:30:00Z（JST 22:30、業務時間内） |
| `resource.type` | `worker` |
| `action.result` | `success` |
| `actor.ip` | `140.82.114.4`（GitHub Actions IP range 内） |
| `actor.user_agent` | `wrangler/3.x` |
| 件数 | 3 events |

### F2 foreign-ip.json

| フィールド | 値 |
| --- | --- |
| `actor.email` | `cloudflare-deploy@github-actions` |
| `actor.ip` | `203.0.113.42`（TEST-NET-3 / GitHub IP range 外） |
| `actor.user_agent` | `curl/8.0` |
| `action.result` | `success` |
| 件数 | 1 event |

### F3 403-burst.json

| フィールド | 値 |
| --- | --- |
| `action.result` | `failure` |
| `action.result_code` | `403` |
| `when` | 1h 内に 60 秒間隔で 10 events |
| `actor.email` | 同一 Token |
| 件数 | 10 events |

### F4 off-hours.json

| フィールド | 値 |
| --- | --- |
| `when` | 2026-05-04T18:00:00Z（JST 03:00） |
| `action.result` | `success` |
| `actor.ip` | GitHub Actions IP range 内 |
| 件数 | 1 event |

### F5 malformed.json

- event[0]: `when` が ISO 不正（`"yesterday"`）
- event[1]: `actor` キー欠落
- event[2]: 正常（混在ケースで部分処理が継続することを保証）
- `result_info.cursor` が non-null だが実 cursor 取得できない（parser robustness）

## --dry-run モード仕様

`scripts/cf-audit-log/analyze.ts` に `--dry-run` フラグ追加。

| 観点 | 通常 mode | --dry-run |
| --- | --- | --- |
| D1 read | 実 D1（or fake） | fake D1 |
| D1 write | 結果サマリ書き込み | 書き込みなし |
| GitHub Issue 起票 | `gh issue create` 実行 | stdout に `[DRY-RUN] would create issue: <title> labels=<labels> body_hash=<sha>` を出力 |
| 終了コード | 検知 0 件→0、検知あり→0（gate ではない） | 同左 |
| stderr | 通常 log | `DRY_RUN=true` を最初の 1 行に明示 |

実行例:

```bash
bash scripts/cf.sh audit-log analyze \
  --window 1h \
  --fixture scripts/cf-audit-log/__fixtures__/foreign-ip.json \
  --dry-run \
  | tee outputs/phase-4/dry-run-foreign-ip.log
```

## ベースライン学習検証シナリオ

`scripts/cf-audit-log/baseline.ts` に対する合成 7 日データ。

| 入力 | 期待 baseline 出力 |
| --- | --- |
| 1 日あたり deploy 成功 24 events × 7 日 + 403 が日 2 件均等分布 | `success_per_hour_p95 ≈ 1`, `403_per_hour_p95 ≈ 1` |
| 同左 + ある 1 日だけ 403 が 30 件集中（学習中異常） | baseline は trimmed mean なので大きく動かない（HIGH outlier 除外） |
| 業務時間内 events 95% / 業務時間外 5%（学習通り） | `off_hours_ratio_baseline ≈ 0.05` |

baseline 出力先: `scripts/cf-audit-log/baseline.json`（JSON）。

## test-scenarios.md（マトリクス）

| ID | fixture | window | baseline | 期待 severity | 期待 Issue title prefix | 期待 dedupe key |
| --- | --- | --- | --- | --- | --- | --- |
| TC-01 | F1 normal | 1h | 学習済 | null | （起票なし） | （N/A） |
| TC-02 | F2 foreign-ip | 1h | 学習済 | HIGH | `[CF-AUDIT][HIGH] foreign-ip success: ` | `sha256(actor.email + actor.ip + day)` |
| TC-03 | F3 403-burst | 1h | 学習済 | MEDIUM | `[CF-AUDIT][MEDIUM] 403 burst: ` | `sha256(actor.email + "403burst" + hour)` |
| TC-04 | F4 off-hours | 1h | 学習済 | LOW | `[CF-AUDIT][LOW] off-hours success: ` | `sha256(actor.email + "offhours" + day)` |
| TC-05 | F5 malformed | 1h | 学習済 | null + warn | （起票なし） | （N/A） |
| TC-06 | F2 foreign-ip × 2 回連続実行 | 1h | 学習済 | HIGH 1 回のみ | （起票 1 件のみ） | dedupe で重複 skip |
| TC-07 | F3 403-burst（learning 期間中） | 1h | 学習中 | null（alerting OFF） | （起票なし） | （N/A） |

## 実行コマンド

```bash
# fixture 構文確認
for f in scripts/cf-audit-log/__fixtures__/*.json; do
  jq -e . "$f" >/dev/null && echo "OK: $f" || echo "NG: $f"
done

# dry-run 全シナリオ
for tc in normal foreign-ip 403-burst off-hours malformed; do
  bash scripts/cf.sh audit-log analyze \
    --fixture "scripts/cf-audit-log/__fixtures__/${tc}.json" \
    --dry-run \
    | tee "outputs/phase-4/dry-run-${tc}.log"
done
```

## 成果物

- `outputs/phase-4/phase-4.md`（本ファイル）
- `outputs/phase-4/test-scenarios.md`（マトリクス確定版）
- `outputs/phase-4/fixture-spec.md`（5 fixture の field 単位仕様）
- `outputs/phase-4/dry-run-{normal,foreign-ip,403-burst,off-hours,malformed}.log`（Phase 5 後に取得）

## DoD（完了条件）

- [ ] 5 fixture の path / field 仕様が確定し fixture-spec.md に記載
- [ ] dry-run の IO 仕様（stdout/stderr/exit code）が表で確定
- [ ] test-scenarios.md にマトリクス TC-01〜TC-07 が記載
- [ ] ベースライン学習 3 シナリオの期待値が確定
- [ ] Phase 6 / Phase 8 から fixture path を import 参照できる構造になっている
