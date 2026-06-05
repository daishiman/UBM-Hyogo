# Issue #1070 follow-up: physical delete force-migration migration for referenced tags

## メタ情報

```yaml
issue_number: 1117
task_id: task-issue-1070-followup-001-physical-delete-force-migration
task_name: Physical delete force-migration for referenced tags
category: 改善
target_feature: admin tag lifecycle (tag_definitions physical delete)
priority: 低
scale: 中規模
status: 未実施
source_phase: issue-1070 Phase 12 unassigned-task-detection U-1
created_date: 2026-06-03
dependencies: [issue-1070-tag-reactivate-physical-delete]
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-1070-followup-001-physical-delete-force-migration |
| タスク名 | Physical delete force-migration for referenced tags |
| 分類 | 改善 |
| 対象機能 | admin tag lifecycle (`tag_definitions` physical delete) |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/outputs/phase-12/unassigned-task-detection.md` U-1 |
| 関連 Issue | #1070 |

---

## 1. なぜこのタスクが必要か

Issue #1070 では `apps/api` に tag master (`tag_definitions`) の reactivate / physical delete endpoint を追加し、tag lifecycle の write contract を完成させた。physical delete は不可逆な破壊操作のため、対象 tag に `member_tags` 参照がある場合は **409 `tag_has_references` で拒否**し、孤児化（誰に貼った札か分からない貼り跡だけが残る状態）を構造的に禁止する安全側設計で完結した。

一方、運用上は「誤った tag に大量付与してしまった参照を、別の正しい tag へ寄せて（移行して）から元 tag を完全に消したい」という需要が将来発生し得る。Issue #1070 はこの **強制移行（force-migration）経路を AC 外（射程外）** として明示的にスコープから除外した。AC-3 は「参照ありの扱い（拒否 or 明示移行）が仕様化されていること」を要求し、Issue #1070 は安全側の拒否を選んだ。強制移行はそれとは独立した別関心事である。

強制移行は不可逆かつ運用合意を要する仕様分岐であり、合意未済のまま実装すると孤児や誤移行を生む。そのため、具体的な need と運用合意が確定してから別 Issue で実装する。本仕様書はその将来タスクを formalize したものである。

## 2. 何を達成するか

physical delete 対象 tag に `member_tags` 参照があるとき、参照を別 tag（移行先）へ付け替えてから元 tag を物理削除する強制移行経路を、新 migration もしくは専用 endpoint + runbook として用意する。移行は audit に記録し、移行先 tag 誤指定時のロールバック方針を含めて運用合意のうえで実行する。

`member_tags` は `PRIMARY KEY (member_id, tag_id)` のみで `tag_definitions` への DB-level FOREIGN KEY を持たない（`apps/api/migrations/0002_admin_managed.sql`）。そのため移行は application-level の `UPDATE member_tags SET tag_id = <dest> WHERE tag_id = <src>` を基本とし、移行先 tag に同一 member の既存行がある場合の PK 衝突は `member_id` ごとの `INSERT OR IGNORE` + `DELETE` で吸収する。Issue #1070 が land 済みの 409 拒否経路は再設計せず、移行が成功して参照 0 になった後に既存の physical delete を呼ぶ二段構成とする。

### 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | 移行先 tag を明示指定して、`member_tags` の `src` 参照を `dest` 参照へ全件移行できる |
| AC-2 | 移行で `(member_id, dest)` の PK 衝突が起きる場合も孤児を作らず吸収できる（`INSERT OR IGNORE` + `DELETE` で重複を解消） |
| AC-3 | 移行完了後に `src` の参照が 0 になった場合のみ、Issue #1070 既存の physical delete 経路で元 tag を削除する |
| AC-4 | 移行と物理削除は audit に記録され、移行件数・移行元/先 tag・実行者が追跡できる |
| AC-5 | 移行先 tag 不在・非 active・src===dest など不正指定時は移行を実行せず明示エラーで拒否する |
| AC-6 | runbook に移行先誤指定時のロールバック方針（移行前 snapshot の保全・逆移行手順）が明文化される |
| AC-7 | Issue #1070 の 409 `tag_has_references` 拒否経路（移行を指定しない通常 physical delete）が退化しない |

## 3. 実行方針

1. Phase 1 で Issue #1070 land 済みの physical delete endpoint・参照ガード（`countMemberTagReferences` / `physicalDeleteTagDefinition`）と `member_tags` schema を inventory する。
2. Phase 2 で強制移行の SQL 戦略（`UPDATE` 主経路 + PK 衝突時の `INSERT OR IGNORE` + `DELETE` 吸収）と二段構成（移行 → 参照 0 確認 → 既存 physical delete）を設計する。
3. Phase 3 で移行先 tag 検証（不在 / 非 active / src===dest）と audit before/after snapshot のスキーマを確定する。
4. Phase 4-6 で repository D1 test（移行・衝突吸収・参照 0 確認・不正指定拒否）と endpoint contract test を設計・実装する。
5. Phase 7-8 で Issue #1070 既存 409 拒否経路 regression を固定し、退化しないことを検証する。
6. Phase 9 で migration もしくは専用 endpoint の実装を確定する（user-gated で実施場所を選択）。
7. Phase 10 で runbook（移行手順・ロールバック方針・user approval marker）を作成する。
8. Phase 11 は NON_VISUAL のため focused D1 Vitest / typecheck / lint の実測を代替証跡として記録する。
9. Phase 12 で `docs/00-getting-started-manual/specs/01-api-schema.md` の tag lifecycle 仕様へ強制移行 contract を同期する。

## 苦戦箇所【記入必須】

- 対象: `apps/api/migrations/0002_admin_managed.sql`（`member_tags` 定義）
- 症状: `member_tags` は `PRIMARY KEY (member_id, tag_id)` のみで `tag_definitions` への DB-level FOREIGN KEY が存在しない。そのため移行も参照ガードも DB 側の制約に頼れず、すべて application-level の SQL（`UPDATE` + `INSERT OR IGNORE` + `DELETE` + `COUNT(*)`）で整合を取る必要がある。`UPDATE member_tags SET tag_id = ?` 単独だと `(member_id, dest)` が既存のとき PK 衝突で失敗するため、衝突有無で経路を分けないと一部 member の移行が落ちる。

- 対象: `apps/api/src/repository/tagDefinitions.ts`（`physicalDeleteTagDefinition`）
- 症状: physical delete は不可逆であり、移行先 tag を誤指定したまま移行 → 削除を実行すると、元 tag は破棄済みで巻き戻せず、誤った tag に参照が寄った状態だけが残る。移行前の `member_tags` snapshot 保全と逆移行（dest → src 戻し）のロールバック方針を **実装前に runbook で確定**しておかないと、誤移行を救済できない。

- 参照: `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/outputs/phase-12/implementation-guide.md`
- 症状: Issue #1070 は「使っているなら断る（409 `tag_has_references`）」で安全完結した設計境界を持つ。強制移行を追加する際にこの拒否経路を緩めたり置き換えたりすると、移行先を明示しない通常 physical delete が孤児を作り得る状態に退化する。移行は既存拒否経路を**温存したまま前段に積む**二段構成とし、設計境界を崩さないこと。

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 移行先 tag 誤指定のまま元 tag を物理削除し巻き戻せない | 高 | 移行前 `member_tags` snapshot を保全し、runbook に逆移行手順を明記。本番実行は user approval marker 必須の user-gated とする |
| `(member_id, dest)` PK 衝突で一部 member の移行が落ち、部分移行のまま削除に進む | 高 | 衝突有無で `UPDATE` / `INSERT OR IGNORE`+`DELETE` を分岐し、移行後に `countMemberTagReferences(src)===0` を確認してからのみ physical delete を呼ぶ |
| Issue #1070 の 409 拒否経路が退化し、移行未指定でも孤児が発生し得る | 高 | 既存 physical delete 経路を不変に保ち、移行は前段の別経路として積む。contract test で通常 physical delete の 409 を regression 固定（AC-7） |
| 移行操作が audit に残らず、誰が何件どの tag へ寄せたか追跡不能 | 中 | 移行件数・src/dest・実行者を audit に before/after で記録（AC-4） |
| DB-level FK 不在ゆえ application-level 整合のすり抜けで孤児が発生 | 中 | 移行・削除を単一トランザクション境界で扱い、各ステップ後に参照件数を再検証する |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts
```

期待: 強制移行（src → dest 全件移行 / PK 衝突吸収 / 移行後 src 参照 0 確認）/ 移行先不正指定拒否（不在 / 非 active / src===dest）/ 移行 → 参照 0 → physical delete 成功が PASS。

### 統合検証

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
```

期待: 強制移行 endpoint contract（移行成功 + audit / 不正指定拒否 / 移行後 physical delete）が PASS し、Issue #1070 既存の 409 `tag_has_references` 拒否経路（移行未指定の通常 physical delete）regression が green。typecheck error 0 / lint exit 0。

## スコープ

### 含む

- physical delete 対象 tag の `member_tags` 参照を別 tag へ付け替える強制移行 SQL（`UPDATE` + PK 衝突時 `INSERT OR IGNORE`+`DELETE`）
- 移行 → 参照 0 確認 → 既存 physical delete の二段構成
- 移行先 tag 検証（不在 / 非 active / src===dest 拒否）
- 移行・物理削除の audit 記録
- 移行先誤指定時のロールバック方針を含む runbook
- focused D1 repository test / endpoint contract test

### 含まない

- Issue #1070 で実装済みの 409 `tag_has_references` 拒否経路の再設計
- `member_tags` への DB-level FOREIGN KEY 追加（別タスク U-3）
- `apps/web` admin UI からの移行 / 物理削除導線（別タスク U-2）
- tag master CRUD / logical delete / reactivate の再設計（Issue #1035 / #1070 で実装済み）
- staging / production deploy、commit、push、PR 作成

## 参照

- Issue #1070: https://github.com/daishiman/UBM-Hyogo/issues/1070
- `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
