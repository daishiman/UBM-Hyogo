# Phase 3: 設計レビュー — issue-863 admin error.boundary.caught Sentry alert policy IaC 化

> 実装区分: 実装仕様書 / タスク種別: NON_VISUAL
> 前提: [phase-1-requirements.md](phase-1-requirements.md) / [phase-2-design.md](phase-2-design.md)
> 目的: Phase 4（テスト計画）へ進めるかを判定する

---

## 1. 4条件評価

| 条件 | 評価 | 根拠 |
|---|---|---|
| **価値性**（誰のどのコストをどれだけ下げるか）| ✅ 良 | 運用者の「admin render error を手動で発見する」コストを除去。親 digest=167275886 は手動検知だった。本設計で deploy 直後に Slack 通知 → 平均検知時間を「次回手動アクセスまで」から「5 分窓 + threshold 3」に短縮。コストは logger 内部変更 + 単一 policy + lib 複製で限定的 |
| **実現性**（初回スコープで実装可能な厚みか）| ✅ 良 | `logger.ts` は内部実装変更のみ（シグネチャ不変・呼び出し側変更なし）。IaC は cloudflare-alerts の確立パターンを複製し、quota-base/webhooks/resolve を削減した最小構成（policy 1 件 + lib 6 + test 3）。1 実装サイクルで完了可能（CONST_007）|
| **整合性**（責務境界・依存・状態所有権が矛盾なく閉じるか）| ✅ 良 | 正本=repo JSON / 従=Sentry console を明確化。`capture.ts` は無変更で再利用（責務境界維持）。telemetry 正本を Sentry に一本化し二重 emit を排除。tag 昇格（logger）と filter（policy）の依存方向が一方向で閉じる |
| **運用性**（導入後の verify/drift/監査が破綻しないか）| ⚠ 注意付き良 | drift CI（PR=unit / schedule=read-only diff）+ runbook + CODEOWNERS で governance 化。注意点: Sentry alert rule の宣言モデルは Cloudflare ほど厳密でなく、API での冪等 upsert に provider 差異がある（後述リスク R-1）。mock fixture で PR test は secret-free に保てる |

**一次結論**: 4 条件すべて充足（運用性のみ R-1 を Phase 4/5 で吸収する前提）。**GO**。

---

## 2. 真の論点と境界

1. **真の論点**: 「admin render error を deploy 直後に能動・宣言的に検知できない」。現象（digest=167275886 を手動発見）ではなく、検知機構の不在が主問題。
2. **依存関係・責務境界**: tag 昇格（logger.ts）→ filter（policy）の一方向依存。policy filter は logger の tag 供給が前提（先に logger 変更がないと filter が空振りする）。Phase 5 で logger → policy の順序を固定する。
3. **価値とコストの不均衡**: コスト最大部品は `api-client.ts`（Sentry API 形状調査）。価値最大部品は logger tag 昇格（これだけで Sentry UI の手動 alert でも scope フィルタ可能になる）。
4. **改善優先順位**: ① logger tag 昇格 → ② policy JSON + schema → ③ lib(load/canonicalize/diff) → ④ api-client/cli → ⑤ drift CI → ⑥ runbook/CODEOWNERS。
5. **4条件評価**: §1 の通り GO。

---

## 3. 因果ループ

### 強化ループ R（観測性向上の好循環）

```
admin error 発生 → Sentry alert 発火 → Slack 通知 → 早期是正
   → regression が deploy 直後に潰れる → admin 画面の信頼性向上
   → admin 機能を安心して拡張 → 変更頻度↑ → さらに alert で守る価値↑ （+）
```

### バランスループ B（alert fatigue の抑制ループ）

```
threshold を下げる → 発火頻度↑ → 通知ノイズ↑ → 運用者が通知を無視
   → 重大 alert も見落とす → 検知価値↓
   ⇒ 是正: threshold:3 / window:5min と scope filter で admin error を絞り、digest は通知 tag で一次切り分け可能にする
     → false-positive < 1 件/日 を維持 → 通知の信頼性が保たれ無視されない （−で平衡）
```

> CONST「閾値は緩く初期化・digest を 1 次キー」は、この B ループで alert fatigue を抑えるための設計判断。digest grouping により単発の偶発エラーでは発火せず、同型 regression（同一 digest 反復）でのみ発火する。

---

## 4. リスクと対策

| ID | リスク | 影響 | 対策 |
|---|---|---|---|
| R-1 | Sentry alert rule の API IaC 化は Cloudflare の `alerting/v3` ほど宣言的でなく、rule 定義の native 対応に限界がある（rule API の項目名・冪等 upsert キーが provider 都合）| `apply` の冪等性が崩れ、drift 誤検知 | api-client は実 Sentry API 形状を Phase 5 で確定。canonicalize で server id/created/modified を strip し、name を冪等キーにする。実 API が宣言と乖離する場合は canonical 比較対象を「filter/frequency/actions」に絞り、native 非対応項目は比較から除外する（cloudflare-alerts の `webhookCompareView` と同型の「比較ビュー」手法）|
| R-2 | 二重 emit（Cloudflare と Sentry に同一 error を送る）を将来うっかり追加 | telemetry 正本の二重化・コスト増 | CONST_002 を README と runbook に明記。Cloudflare alerts は billing 専用据え置きを文書固定。error の Cloudflare 送出経路を追加しない |
| R-3 | `digest` を tag 化すると Sentry tag cardinality が増える | tag quota 圧迫・課金影響 | digest は hash で有限・短命。alert 通知の切り分けに必要なため tag 化する。cardinality 懸念が顕在化したら digest を tag ではなく Sentry fingerprint へ移す案を別途検討する|
| R-4 | logger tag 昇格が warn path にも影響（warn は元々 event のみ tag）| warn alert の挙動変化 | 意図的に warn にも scope/digest tag を付与（観測一貫性向上）。logger.spec.ts に warn path の tag 検証 case を追加して回帰 guard |
| R-5 | Sentry API token scope が広すぎると CI が apply 権限を持つ | governance 破綻 | read/apply token 分離（cloudflare-alerts ミラー）。CI Secret には read scope のみ。apply は user-gated（Phase 13）|
| R-6 | `apps/web` env 不変条件違反（`process.env.*` 新規直接参照）| CLAUDE.md 違反 | logger 変更は既存 `merged`/`payload` 由来の値のみ参照し、新規 `process.env` を増やさない。IaC の Sentry token は `infra/sentry-alerts/lib` 側（apps/web ランタイム外）で env 読込するため `getEnv()` 制約の対象外 |

---

## 5. Phase 4 進行判定

| 判定項目 | 結果 |
|---|---|
| 4 条件評価 | 4/4 充足（運用性は R-1 を Phase 4/5 で吸収）|
| 責務境界の閉じ | OK（capture.ts 無変更 / repo=正本・Sentry=従）|
| 依存方向の一意性 | OK（tag 昇格 → policy filter の一方向）|
| 1 実装サイクル収束性 | OK（policy 1 + lib 6 + test 3 + logger 内部変更）|
| 未解決ブロッカー | なし（R-1 は Phase 5 で実 API 形状確定により解消可能）|

### 判定: **GO**（Phase 4 テスト計画へ進む）

Phase 4 で設計すべきテスト観点（先出し）:
- logger: `scope`/`digest` が string のとき tag に昇格、undefined のとき tag を付けない、warn path も同様（capture mock で検証）。
- schema-contract: policy manifest が server id / 平文 token / DSN を含まない、name が `^[a-z0-9-]+$`、`action_match`/`filter_match`/`frequency`/`notification_interval_minutes`/`actions` 必須。
- load/canonicalize: filter の key sort、server key strip 後の canonical 一致。
- diff: missing/extra/changed の全件列挙、比較ビュー（native 非対応項目除外）の整合。
