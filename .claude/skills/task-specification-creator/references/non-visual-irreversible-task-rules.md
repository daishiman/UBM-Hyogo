# NON_VISUAL 不可逆操作タスク 運用ルール

retention purge / production destructive D1 mutation / 物理削除 cron 等、
**実行が不可逆 (irreversible) でロールバック手段が DB restore に限られる** タスク向けの追加ルール。
通常の `implementation / NON_VISUAL` 仕様の上に重ね、Phase 1 で本ファイルを参照タグ付けする。

適用条件（次のいずれか 1 件以上）:

- 物理削除 / hard delete / `DELETE FROM ...` を production D1 に発行する cron / endpoint を導入する
- production secret / KV / R2 / D1 schema を破壊的に書き換える migration を含む
- 実行後に **元データを git revert / migration rollback で復元できない**

実例: issue-402 admin request retention 物理削除（`RETENTION_DAYS=180` 以降の `expired` レコードを cron で物理削除）

---

## 1. Gate 三層分離（Gate A / B / C）

不可逆タスクの Phase 13 では従来の単一承認ではなく **3-gate** に必ず分割する。
Phase 13 PR description / approval gate template にもこの 3 行を明示する。

| Gate | スコープ | 承認単位 | 失敗時の取り扱い |
|------|---------|---------|----------------|
| **Gate A: spec close** | docs / outputs / artifacts.json / Phase 12 七点セットの確定 | docs-only マージ可。**production 影響ゼロ**であることを description で宣言 | docs 修正のみで再実行可 |
| **Gate B: git publish** | feature → main マージ、CI green、artifact 配備（ただし cron schedule / endpoint は OFF / behind feature flag） | merge 承認 | revert PR で復元可（コードレベルのみ） |
| **Gate C: production destructive apply** | cron schedule 有効化 / feature flag ON / 初回 manual purge 実行 | **独立した user GO**。Gate B 承認に含めない | DB restore 以外の復元手段なし。事前 backup 必須 |

ルール:

- Gate B 承認は Gate C を含意しない。PR description の Approval セクションは `Gate A: ✅ / Gate B: ✅ / Gate C: ⏸ pending separate approval` のように 3 行を独立に書く
- Gate C 実行前に `bash scripts/cf.sh d1 export ... --output backup-pre-<task-id>.sql` の evidence を必須化する
- Gate C 後の runtime evidence（実削除件数 / wrangler tail / metric snapshot）は別 unassigned task として `spec_created → completed` で起票する（§4 参照）

---

## 2. Migration 番号 placeholder 確定タイミング

Phase 5 で migration 番号（`NNNN_<slug>.sql`）が確定した瞬間以降、後続 Phase は **literal 文字列で参照する** ことを強制する。

ルール:

- Phase 5 完了条件に「migration filename literal を artifacts.json `metadata.migration_filename` へ pin する」を追加
- Phase 6〜13 の outputs / implementation-guide.md / Phase 11 evidence は **placeholder (`NNNN_*` / `<MIGRATION_NUMBER>` / `TBD`) を残さない**
- Phase 5 で番号衝突（main 取り込み後の番号 shift）が起きた場合は **Phase 5 へ戻り** rename + 全 Phase の literal を一括差し替えする。Phase 6 以降での「あとで直す」は禁止
- 検証コマンド（Phase 12 compliance check に追加）:

  ```bash
  grep -rE 'NNNN_|<MIGRATION_NUMBER>|TBD_MIGRATION' docs/30-workflows/<task>/outputs/ && exit 1 || exit 0
  ```

---

## 3. テスト件数 SSOT（Phase 6/7 outputs 単一情報源）

不可逆タスクではテスト件数（unit / integration / e2e の数）が **承認判断の根拠** となるため、SSOT を 1 箇所に固定する。

ルール:

- **SSOT**: `outputs/phase-06/main.md`（unit）/ `outputs/phase-07/main.md`（integration）の表を正本とする
- `outputs/phase-12/implementation-guide.md` は **件数を再記載せず**、SSOT への相対リンクで参照する:

  ```markdown
  テスト件数の正本は [phase-06/main.md](../phase-06/main.md#test-count) / [phase-07/main.md](../phase-07/main.md#test-count) を参照。
  ```

- artifacts.json `metadata.test_counts` も SSOT の値を mirror するのみ。差分が出た場合は SSOT 側を直し、mirror を再生成する
- Phase 12 compliance check に「implementation-guide.md にテスト件数が literal 記載されていない（リンクのみ）」を追加

---

## 4. Runtime evidence 起票ルール（scope out 禁止）

NON_VISUAL 不可逆タスクで Phase 12 の unassigned task 検出時、runtime production evidence（cron 初回実行 / 実削除件数 / metric ダッシュボード）が pending である場合、
**「scope out」「対象外」として閉じない**。必ず以下のいずれかで formalize する。

ルール:

- runtime pending を検出したら、`docs/30-workflows/<task>/outputs/phase-12/unassigned-tasks/<task>-runtime-001.md` を **`spec_created` task として起票** する
- 起票内容には次の 4 セクションを含める（[unassigned-task-required-sections.md](unassigned-task-required-sections.md) 準拠）:
  - 苦戦箇所（Gate C が独立承認のため Phase 11 で取得不可）
  - リスクと対策（DB restore 以外の rollback 不在 / backup 取得手順）
  - 検証方法（実 cron 起動コマンド / 実削除件数集計クエリ / wrangler tail filter）
  - スコープ（Gate C 実行 1 wave 限定。次回 retention 周期は別 task）
- artifacts.json `metadata.runtime_evidence_status` を `pending_gate_c` で固定し、Phase 12 close-out で `completed` に書き換えない
- 「runtime 取得は本番運用者責務だから本タスクのスコープ外」という記述は **禁止**。Skill feedback として扱い phase12-skill-feedback-promotion.md へ昇格させる

---

## 5. SSOT 値リテラル禁則 + 参照リンク必須

`RETENTION_DAYS=180` のような **policy 数値**（保管日数 / TTL / batch size 等）を outputs / CLAUDE.md / 仕様書本文に **literal で複数回展開しない**。SSOT を 1 ファイルに置き、参照リンクで統一する。

ルール:

- **SSOT 配置**: `docs/00-getting-started-manual/specs/<domain>-retention-policy.md` 等のドメイン仕様書を正本とする
- 参照側（implementation-guide / artifacts.json コメント / CLAUDE.md / migration コメント）は次の形式に統一:

  ```markdown
  保管期間は [data-retention-policy.md](path/to/data-retention-policy.md#retention-days) を参照（SSOT）。
  ```

- env var 名（`RETENTION_DAYS`）の literal は許容（コードと wrangler.toml に必要）。**値**（180）の literal 展開のみを禁止
- Phase 12 compliance check に「policy 数値の重複 literal が outputs/ 配下に存在しない」検証を追加:

  ```bash
  # 例: RETENTION_DAYS の値が複数 .md に literal 散在していないか
  grep -rE '\bRETENTION_DAYS\s*=\s*[0-9]+' docs/30-workflows/<task>/outputs/ | wc -l
  # 期待: 0（または env 例示の 1 箇所のみ）
  ```

- CLAUDE.md / SKILL.md など widely-read ファイルへの literal 展開は **永続的に禁止**。値変更時の drift コストが skill 全体に伝播するため

---

## 適用チェックリスト（Phase 1 で記入）

`artifacts.json.metadata` に次キーを設定する:

| key | 値の例 | 検証 |
|-----|-------|------|
| `irreversibleOperation` | `true` | 本ルール適用 trigger |
| `gateModel` | `three_gate_a_b_c` | Phase 13 PR description で 3 行記述必須 |
| `migration_filename` | `0042_admin_request_retention.sql` | Phase 5 完了条件 |
| `test_counts_ssot` | `outputs/phase-06/main.md` | Phase 12 で literal mirror 禁止 |
| `runtime_evidence_status` | `pending_gate_c` | Gate C 実行まで書き換え禁止 |
| `policy_value_ssot` | `docs/00-getting-started-manual/specs/data-retention-policy.md` | literal 展開禁止 |

---

## 関連 reference

- [task-type-decision.md](task-type-decision.md) — 基底 taskType / visualEvidence 判定
- [phase-12-spec.md](phase-12-spec.md) — Phase 12 close-out / runtime pending 状態語彙
- [phase12-skill-feedback-promotion.md](phase12-skill-feedback-promotion.md) — feedback 昇格 lifecycle
- [unassigned-task-required-sections.md](unassigned-task-required-sections.md) — 4 必須セクション
- [quality-gates.md](quality-gates.md) — Phase 境界 / 検証コマンド
