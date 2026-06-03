---
task: issue-1056-kv-alert-policy-binding-drift-detection
recorded: 2026-06-02
topics: [kv, r2, cloudflare, alert, policy, binding, drift, monitoring-gap, stale-monitoring, ci-gate, read-only, cli, line-parser, vitest, spec-code-drift, issue-state-divergence]
related-references:
  - references/workflow-issue-1056-kv-alert-policy-binding-drift-detection-artifact-inventory.md
  - references/deployment-cloudflare.md
  - docs/30-workflows/issue-1056-kv-alert-policy-binding-drift-detection/
  - infra/cloudflare-alerts/lib/binding-policy-drift.ts
  - infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts
  - infra/cloudflare-alerts/lib/cli.ts
  - scripts/cf.sh
  - scripts/__tests__/cf-alerts-cli.spec.ts
  - .github/workflows/cloudflare-alerts-drift.yml
  - .claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-57-kv-r2-guardrail-degrade-2026-05.md
classification:
  - implementation/comment-aware-line-parser
  - design/pure-function-drift-detection
  - operations/read-only-ci-gate
  - documentation/spec-code-drift
  - operations/issue-state-divergence
---

# Lessons Learned — Issue #1056 KV/R2 Binding ↔ Alert Policy Drift Detection (2026-06)

Issue #57（KV/R2 guardrail degrade）が予防しようとしたドリフトのうち、これまで捕捉できていなかった
「binding が**活性化**しているのに対応する alert policy が `enabled:false` のまま」という監視ギャップを、
read-only / Cloudflare API 非接触の検知モジュール + CLI + PR validate gate として実装する過程で得た
教訓を classification-first で整理する。出典は
`docs/30-workflows/issue-1056-kv-alert-policy-binding-drift-detection/outputs/phase-12/` と実装差分
（`infra/cloudflare-alerts/lib/binding-policy-drift.ts` / `cli.ts`、`scripts/cf.sh`、各 `__tests__`、
`.github/workflows/cloudflare-alerts-drift.yml`）。本サイクルは `implemented_local_evidence_captured`。

---

## 1. 実装 / コメント尊重 line parser で「宣言あり・未活性」を正しく未活性扱いする（L-I1056-001）

### 概要
`apps/api/wrangler.toml` の binding は「コメントアウトされた宣言」も存在する（`ALERT_DEDUP_KV` は
`#` で無効化済み）。TOML ライブラリでパースするとコメント行は捨てられ、活性 binding と区別できない。
`parseActiveBindings` は行単位で読み、行頭が `#` の宣言を**未活性**として除外する自前パーサにした。

### なぜ重要か
- TOML ライブラリは「コメントアウト＝未活性」という運用上の状態を表現できず、L-I57-005 が表で固定した
  `active / declared-but-commented / not-applied` の 3 値のうち中間状態を取りこぼす。
- 「宣言だけある（未活性）」を活性とみなすと、本来 drift でない状態を false positive で drift 判定する。

### 再発防止アクション
- wrangler.toml を入力にする検知器は、コメント行尊重の line parser を使い、`active` の定義を
  「非コメント行で宣言された binding」に固定する。inline コメント（`KEY = "v" # note`）も値だけ採る。

## 2. 設計 / drift 判定を 2 軸の純関数に閉じ込める（L-I1056-002）

### 概要
`buildBindingPolicyDrift` は `isActive`（binding 活性）と `enabled`（policy 有効）の 2 軸だけから
drift 種別を導出する副作用ゼロの純関数にした。`isActive && !enabled → MONITORING_GAP` /
`!isActive && enabled → STALE_MONITORING` / policy 不在は `enabled:false` 扱い。I/O（`loadActiveBindings`）と
判定（`buildBindingPolicyDrift`）を分離し、判定側は引数→戻り値のみで完結させた。

### なぜ重要か
- I/O と判定を混ぜると、drift ロジックのテストに wrangler.toml / Cloudflare API のスタブが必要になる。
- 純関数化により回帰 spec（AC-6 の (a)〜(f)）を引数の組み合わせだけで網羅でき、9 ケースで全分岐を覆える。

### 再発防止アクション
- 検知ロジックは「読み込み」と「判定」を別関数に割り、判定は純関数（mutation なし）にする。
- 判定の入力は boolean 2 軸など最小集合へ正規化し、テストは入力表で全象限を列挙する。

## 3. 操作 / read-only・secret 不要・exit code contract で CI gate を安価にする（L-I1056-003）

### 概要
CLI `cf.sh alerts binding-drift` / `cmdBindingDrift` は Cloudflare API を一切呼ばず、
`CLOUDFLARE_ALERTS_TOKEN_READ` を要求しない。整合時 exit 0 / drift 検出時 exit 2 の固定 contract にし、
`.github/workflows/cloudflare-alerts-drift.yml` の PR validate job を **secret 注入なし**で動かせるようにした。
非 CI ローカル実行時は local-only 分岐で同じ判定を返す。

### なぜ重要か
- secret 依存の gate は fork PR / secret 未配備の文脈で実行不能になり、drift 監視が穴になる。
- exit code を固定（0=整合 / 2=drift / 64=usage error）にすると、CI 側は判定ロジックを再実装せず
  exit code だけで pass/fail を決められる。

### 再発防止アクション
- 静的ファイル（wrangler.toml / policy 定義）だけで判定できる gate は read-only / secret 不要に保ち、
  PR validate job に組み込む。exit code を契約として spec・CLI usage・回帰 spec の 3 箇所で一致させる。

## 4. ドキュメント / 設計型と実装型のドリフトは実装側を正本にして追従させる（L-I1056-004）

### 概要
phase-02 設計の型（`ActiveBindingSet { kv:boolean, r2:boolean, ... }` / `BindingPolicyMapping { kind, policies, label }`）
に対し、実装は `ActiveBindings { kv: string[], r2: string[] }`（boolean は `length>0` で導出）/
`{ kind, policyNames }` に収斂した（`label` 削除・name 配列保持）。機能等価だが設計ドキュメントが古いまま。

### なぜ重要か
- existing-hardening / implemented サイクルでは「実装が landed したシェイプ」が正本。設計型を放置すると、
  L-I57-005 と同じ spec↔code ドリフトを新規に生む。
- 型シェイプの差は CI を緑のまま通すため、機械検知されず人手の照合でしか見つからない。

### 再発防止アクション
- 実装が設計型から収斂したら、同一サイクルで設計フェーズ（phase-02 等）の型定義を landed シェイプへ更新する。
- 型は「導出可能な冗長フィールド（boolean）」を持たせず、name 配列など原始情報に寄せて単一表現にする。

## 5. 設計 / 2 種しかない mapping は外部化せず const で持つ（YAGNI）（L-I1056-005）

### 概要
binding kind は KV / R2 の 2 種のみ。`BINDING_POLICY_MAP` を JSON 外部化する案を退け、コード内 const で
保持した。kind 粒度（binding 個別名ではなく KV/R2 の種別）で policy をマッピングし、片方向（binding→policy）
の突合に限定した。

### なぜ重要か
- 2 エントリの mapping を外部 JSON 化すると、ファイル I/O・スキーマ検証・同期の手間が増え可読性が下がる。
- 早すぎる抽象化（externalize）は将来の拡張を見込んだ YAGNI 違反になりやすい。

### 再発防止アクション
- 列挙対象が少数（〜数件）で安定しているマッピングは const で持つ。外部化は実際に増えた時点で行う。

## 6. 操作 / Issue state divergence は reopen せず docs を実態へ整合させる（L-I1056-006）

### 概要
spec 作成時に #1056 は OPEN（`closedAt: null`）だったが、本サイクル進行中に CLOSED
（`closedAt: 2026-06-02T03:32:56Z`）へ変化した。Issue mutation（reopen）は user-gated のため行わず、
artifact inventory / compliance check の state 記述を「spec 作成時 OPEN → 現 CLOSED」へ整合させた。

### なぜ重要か
- docs が「OPEN 維持」と現在形で主張したまま実態が CLOSED だと、compliance の「矛盾なし」原則に反する。
- 勝手に reopen / close すると user-gated 境界を侵す。記録の整合と issue mutation は別操作。

### 再発防止アクション
- close-out 時は `gh issue view <n> --json state,closedAt` で実態を確認し、docs の現在形 state 記述を
  実態へ合わせる。issue 自体の状態変更は行わず「記録整合」と「mutation」を分離する。

---

## Anti-patterns

- **AP-I1056-A（TOML ライブラリでコメント binding を取りこぼす）**: コメントアウト宣言を活性とみなし
  false positive drift を出す。→ L-I1056-001。
- **AP-I1056-B（I/O と判定の混在）**: drift 判定に wrangler.toml / API スタブを要求し、回帰 spec が重くなる。→ L-I1056-002。
- **AP-I1056-C（secret 依存 gate）**: read-only 判定なのに token を要求し、secret 未配備文脈で監視が穴になる。→ L-I1056-003。
- **AP-I1056-D（設計型の放置）**: landed シェイプに設計型を追従させず spec↔code ドリフトを新規生成。→ L-I1056-004。
- **AP-I1056-E（早すぎる外部化）**: 2 エントリの mapping を JSON 外部化し可読性とメンテ性を下げる。→ L-I1056-005。

## メモ（user-gated / 横断知見）

- artifacts.json をシェル経由で生成する際、JSON 文字列内の `'\''`（zsh のシングルクオート脱出）が
  そのまま埋め込まれ JSON parse fail を起こす。artifacts.json は Write tool で直接書くか、ヒアドキュメントで生成する。
- waived gate は `passed_at: null` 必須（評価していないため）。passed gate のみ timestamp を持つ。
- spec_created 段階で SubAgent が compliance §5 strict 7 inventory に「実在しない file を present」と誤記する
  事故があった。spec_created は未生成成果物を `pending` と明記し、`present` は物理実在を検査してから書く。
- commit / push / PR 作成 / Cloudflare alert policy enable・apply / Issue #1056 の再 mutation は user-gated。
