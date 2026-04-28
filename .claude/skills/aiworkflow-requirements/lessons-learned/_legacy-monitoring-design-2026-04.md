# Lessons Learned — UT-08 monitoring/alert design（2026-04）

> 親ファイル: [lessons-learned-current-2026-04.md](lessons-learned-current-2026-04.md)
> 集約 reference: [observability-monitoring.md](observability-monitoring.md)
> 分離理由: UT-08 由来の設計教訓を独立ファイル化（責務分離）。

---

## 対象タスク

UT-08 monitoring/alert design（unassigned / 組み込み先 `docs/05a-parallel-observability-and-cost-guardrails`）

---

## L-MON-001: 設計 / 実装境界の引き方

- **症状**: 05a-parallel-observability-and-cost-guardrails は「手動確認可能な観測点の優先」を方針として確定済みで、自動アラートは意図的にスコープ外。UT-08 で自動化を加える際に 05a の `observability-matrix.md` / `cost-guardrail-runbook.md` を直接編集すると、05a の Phase 12 close-out で固定された canonical content が壊れ、root / outputs parity が崩れる。
- **解決**: UT-08 の成果物は新規 `monitoring-design.md` を独立作成し、05a の既存 2 ファイルを参照するだけにとどめる。「05a の何を継承し、何を自動化で置換するか」を差分表で記述する。
- **Why**: 05a は docs-only / spec_created 系タスクで、Phase 12 完了 = 内容凍結。後続タスクが既存ファイルを直接書き換えると「Phase 12 close-out 後に内容が変わった」状態となり、artifact parity / LOGS / register の三軸 drift 原因となる。
- **How to apply**: 05a 系の自動化 / 拡張タスク（UT-08 / UT-13 / UT-12 など）では、Phase 2 設計時点で「05a outputs を読み取り専用、新規 outputs に差分追記」を不変条件として明文化する。

---

## L-MON-002: WAE 無料枠の不確実性

- **症状**: Cloudflare Workers Analytics Engine の無料プラン上限（書き込み件数 / クエリ列数 / データ保持期間）は公式ドキュメントの記載が改訂される頻度があり、設計時点で読んだ値と運用時点で異なる可能性がある。値をハードコードした runbook を作ると 1〜2 四半期で陳腐化する。
- **解決**: `cost-guardrail-runbook.md` に WAE 上限値を「取得日付付き」で記述する慣行を導入。四半期に 1 度、`quota_pulse` イベントの実測値と公式ドキュメントを突き合わせる定例を runbook に明文化する。
- **Why**: 無料枠は SLA を持たないため、Cloudflare 側の都合で上限が下方修正されることがある。「いつ取得した値か」が記録されていれば、改訂時に影響範囲を即座に特定できる。
- **How to apply**: 監視 / コストガードレール系の数値はすべて `(取得日: YYYY-MM-DD)` の suffix を付けて記載する。値のみで日付がない記述は禁止する。

---

## L-MON-003: アラート疲れ防止（初期 WARNING-only 運用）

- **症状**: WARNING / CRITICAL の閾値を最初から両方設定すると、稼働開始直後の設計値ズレで誤報が頻発する。担当者が CRITICAL 通知をミュートする習慣がつくと、後で実害が起きた時に検知できない。
- **解決**: 初期 2〜4 週間は WARNING のみで運用し、`alert-response-log.md` に対応実績（対応要 / 不要）を蓄積する。実績ログから「対応不要が 70% 超」のメトリクスは閾値を緩めるか削除する。CRITICAL 閾値は実績データを見て初めて設定する。
- **Why**: 通知のシグナル / ノイズ比は閾値だけでなく時間帯 / 環境特性に依存する。机上で決めた値はほぼ確実にズレるため、観測 → 調整 → 再観測の iterative loop が必要。
- **How to apply**: 監視設計書の必須セクションに「初期 WARNING-only ポリシー」「実績ログの蓄積方法」「閾値見直しサイクル」を明記する。CRITICAL 列を最初から埋めることを禁止する（空欄 = 未設定の意）。

---

## L-MON-004: identifier drift 防止（WAE blob / index 名）

- **症状**: WAE の `index1` / `blob1` 名がアプリコード内の複数箇所に文字列リテラルで直書きされると、リファクタや typo による drift が起きる。drift した瞬間 WAE クエリが silently 0 件返しになり、検知の正本そのものが崩壊する。
- **解決**: WAE イベント名 / blob / index の名称定数を `apps/api/src/observability/wae-events.ts` に集約し、計装呼び出しはこの定数経由のみ許可する。WAE クエリ側も同じ定数を参照し、クエリビルダ関数化する。lint ルールで文字列リテラル直書きの `writeDataPoint` 呼び出しを禁止することを推奨する。
- **Why**: 監視は「メトリクスが出ていないこと自体が異常」を検知する仕組みだが、identifier drift は「監視メトリクスが出ない（= 異常がない）」と誤認させる質の悪い障害になる。コンパイル時に検出可能な構造に閉じることが唯一の恒久対策。
- **How to apply**: 監視 / 計装系の文字列識別子は必ず TypeScript の `as const` 定数 + Branded Type で 1 か所集約する。文字列直書きは契約違反として code review で reject する。

---

## L-MON-005: 05a outputs 個別ファイル DEFERRED の解消

- **症状**: 05a Phase 12 close-out 時点では `observability-matrix.md` / `cost-guardrail-runbook.md` を root canonical で確定したが、自動化部分（アラート閾値 / 通知 webhook / 外形監視）は意図的に DEFERRED とされた。下流タスクが「DEFERRED の引き取り」を明示的に行わないと、いつまでも自動化されない / 引き取り重複が起きる。
- **解決**: 05a の DEFERRED 項目を unassigned-task として正式化し、UT-08（監視 / アラート）/ UT-13（KV 設定）/ UT-12（R2 設定）に分配。skill 側 `references/observability-monitoring.md` を集約 reference として、各 UT の引き取り範囲を明文化する。
- **Why**: docs-only / spec_created タスクの DEFERRED は「誰がいつ引き取るか」が文書化されないと永久に未着手のまま残る。下流 UT への ownership 移譲を skill の正本 reference に固定することが、組織横断の取りこぼし防止になる。
- **How to apply**: docs-only タスクで DEFERRED を発生させる場合、Phase 12 verification report に「DEFERRED 引き取り先 UT-ID」を必須欄として記録する。引き取り先 UT が未定の場合は Phase 12 を未完了扱いとする。
