# Issue #577 followup 002 / Miniflare・undici 上流改善追跡 / worker cap 緩和再評価 - タスク指示書

## メタ情報

```yaml
issue_number: 617
status: 未着手
```

## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | task-issue-577-followup-002-miniflare-undici-upstream-tracking |
| タスク名     | Miniflare/undici 上流改善追跡 / worker cap 緩和再評価 |
| 分類         | 追跡・評価 |
| 対象機能     | `@ubm-hyogo/api` Vitest coverage / Miniflare runtime |
| 優先度       | 低 |
| 見積もり規模 | 小規模（追跡 + 評価） |
| ステータス   | 未着手 |
| GitHub Issue | #617 |
| 発見元       | Issue #577 Phase 12 implementation-guide.md L62-69 「別 Issue 候補」 |
| 発見日       | 2026-05-09 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #577 では `EADDRNOTAVAIL` の根因として Miniflare/undici の socket pool 管理と macOS ephemeral port の TIME_WAIT 蓄積が疑われた。暫定対応として軸 B（`--maxWorkers=1`）でテスト並列を 1 に絞り symptom を抑えている。

### 1.2 問題点・課題

軸 B は症状抑制であり、上流（Miniflare / undici / Workers runtime）で keep-alive / agent pool / port reuse 関連の修正が入れば worker cap を 2/4/auto に戻して速度を回復できる可能性がある。しかし上流リリースを能動的に追跡する仕組みが無いと、改善 PR を取り逃して serial 化が永続化する。

### 1.3 放置した場合の影響

- 上流改善があっても採用機会を失う
- 軸 B が「恒久解」と誤認され、CI 時間問題が解決済み扱いになる
- 将来 Miniflare メジャー更新時に worker cap を見直す根拠資料が無い

---

## 2. 何を達成するか（What）

### 2.1 目的

Miniflare / undici / Workers runtime の上流リリースを定期チェックし、socket pool / EADDRNOTAVAIL 関連の改善を検知した際に worker cap を緩和できるか A/B 評価する。

### 2.2 最終ゴール

- 上流追跡の運用フロー（チェック頻度・対象 repo・トリアージ基準）が定義されている
- 改善検知時に `--maxWorkers=2/4/auto` を試す A/B 手順がある
- 直近の上流変更トリアージ結果と推奨設定が記録されている

### 2.3 スコープ

#### 含むもの

- `cloudflare/workers-sdk`（Miniflare 含む）と `nodejs/undici` のリリースノート定期チェック手順の明文化
- socket pool / port reuse / agent / keep-alive 関連の change log トリアージ
- 改善検知時の worker cap 緩和 A/B 実験手順
- 推奨設定の更新記録

#### 含まないもの

- 上流 repo への PR 提出
- `apps/api` 実装ロジック変更
- D1 schema 変更
- commit / push / PR 作成
- 他タスクへの侵食

### 2.4 成果物

- 上流改善トリアージ表（markdown）
- worker cap 緩和 A/B 実験結果 evidence
- 推奨 `--maxWorkers` 値の更新記録（採用しない判断含む）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Issue #577 の軸 B 設定が稼働している
- ローカルで Miniflare D1 test を実行可能

### 3.2 依存タスク

- 親: `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/`
- 関連: followup-001 (shard CI), followup-003 (D1 grouping)

### 3.3 必要な知識

- Miniflare / workers-sdk のリリース構造
- undici の Agent / Pool / Connection 仕様
- macOS の ephemeral port range と TIME_WAIT 挙動

### 3.4 推奨アプローチ

定期チェック（例: 月次）でリリースノート差分を確認し、socket / port / agent / keep-alive キーワードを含む変更があればトリアージ表に記録。改善ありと判断したら local で `--maxWorkers=2` から段階的に緩和し、133/133 PASS / 0 EADDRNOTAVAIL を満たす最大値を探す。

---

## 4. 実行手順

### Phase 1: 追跡フロー定義

#### 目的

定期チェックの対象 repo・頻度・キーワードを固定する。

#### 手順

1. 追跡対象を `cloudflare/workers-sdk` / `nodejs/undici` / `cloudflare/workerd` に限定
2. キーワード: `socket`, `EADDRNOTAVAIL`, `keep-alive`, `agent pool`, `port`, `TIME_WAIT`
3. 頻度: 月次 + Miniflare メジャー更新時

#### 完了条件

- 追跡フローが markdown に記録されている

### Phase 2: トリアージ

#### 目的

直近リリースに改善が含まれるか判定する。

#### 手順

1. 各 repo の release / changelog を確認
2. 該当 commit / PR を表に記録
3. 改善あり / なし を判定

#### 完了条件

- トリアージ表が記入されている

### Phase 3: A/B 評価（改善検知時のみ）

#### 目的

worker cap 緩和で速度回復するか確認する。

#### 手順

1. 該当 Miniflare/undici バージョンに更新
2. `--maxWorkers=2`, `=4`, `=auto` で test:coverage 実行
3. PASS 件数 / EADDRNOTAVAIL 数 / wall-clock を記録

#### 完了条件

- A/B evidence が記録され、推奨値が決定している

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] 上流追跡フローが明文化されている
- [ ] 直近トリアージ結果が記録されている
- [ ] A/B 実施時は evidence が残っている

### 品質要件

- [ ] 軸 B 設定を不必要に外していない
- [ ] coverage 閾値を下げていない

### ドキュメント要件

- [ ] トリアージ表と推奨値が更新されている

---

## 6. 検証方法

```bash
# A/B 実験時のみ
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage --maxWorkers=2
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage --maxWorkers=4
```

期待: 133/133 PASS / 0 EADDRNOTAVAIL を満たすか確認。満たさない場合は軸 B（=1）を維持。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| 上流改善検知漏れ | 中 | 中 | 月次チェックを skill / cron に組み込み |
| A/B で flaky 化し誤って採用 | 高 | 低 | 連続 N 回 PASS を採用条件にし、1 度でも EADDRNOTAVAIL が出たら不採用 |
| Miniflare メジャー更新で別の breaking が発生 | 中 | 中 | 更新は coverage 影響範囲に限定し、ロールバック手順を明記 |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-12/implementation-guide.md`
- `apps/api/package.json`

### 参考資料

- `cloudflare/workers-sdk` releases
- `nodejs/undici` releases
- aiworkflow-requirements: `D1 直接アクセスは apps/api 経由のみ`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | TIME_WAIT 蓄積による EADDRNOTAVAIL は軸 B で抑制したが、上流改善追跡経路がない |
| 原因 | Miniflare/undici の socket pool 仕様変更を能動的に検知する仕組み不在 |
| 対応 | 月次トリアージ + 改善検知時 A/B のフローを定義する |
| 再発防止（future-self への観点） | (1) macOS の ephemeral port range（`sysctl net.inet.ip.portrange.*`）と TIME_WAIT 設定を併記し再現条件を残す (2) Linux CI と macOS local で挙動差分があるか別記する (3) undici の `Agent` `keepAliveTimeout` `pipelining` 設定を試した evidence を残す (4) Miniflare の `unsafeEphemeralDurableObjects` 等 test isolation 関連オプションも検討候補に含める |

### 補足事項

本タスクは追跡・評価が中心で、上流変更が無い限り設定変更は行わない。commit / push / PR 作成はスコープ外。他タスクへの侵食を避ける。`apps/api` 実装ロジック・D1 schema は触らない。
