# Lessons Learned: issue-1035-tag-master-write-endpoints (2026-06)

`docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/` の Phase 12 close-out で確定した learnings。`tag_definitions`（tag master）に admin CRUD endpoint と pagination/search を追加した `implemented_local_evidence_captured / implementation / NON_VISUAL` タスク。親 `issue-982-drawer-tag-pill-editing`（member_tags write + tag master read 済み）の上に積む **tag master write 第3経路**。対の汎用パターンは task-specification-creator `references/patterns-lessons-and-pitfalls.md` SP-I1035-A..D。

## L-I1035-001 read-only repository に write を足すときはコード不変条件コメントと正本 spec を同一 wave で再定義する（苦戦箇所）

**Rule**: `apps/api/src/repository/tagDefinitions.ts` は「tag master は read 専用、write は提供しない」という不変条件コメントを持つ read-only repository だった。write 関数（create / update / deactivate）を足すときは、関数追加だけで終えず、(1) repository 内の不変条件コメントを「write は admin CRUD 第3経路に限定」へ改訂し、(2) 同じ wave で正本 spec `docs/00-getting-started-manual/specs/01-api-schema.md` の不変条件 #13 を「member_tags write 2 経路 + tag master CRUD 第3経路」へ再々定義する。片方だけ更新すると drift する。

**Why**: コード側のコメントと正本 spec は二重正本で、read-only を謳う記述が両方に存在していた。実装だけ write 化してコメント/spec を据え置くと、後続タスクが「tag master は read 専用」という古い不変条件を信じて設計を誤る。不変条件の緩和は実装と同じ重みで文書側に反映する必要がある。

**How to apply**: repository やモジュールに「〜は提供しない」「read 専用」等の不変条件コメント・spec 記述があるものに write/mutation を足すとき、Phase 1 で「この不変条件はどこに何箇所書かれているか」を `rg` で洗い出し、実装・コードコメント・正本 spec の全箇所を同一 wave で同期する。CLAUDE.md の番号付き不変条件（#13 等）に該当する場合は番号ごと改訂する。

## L-I1035-002 PATCH は label/category に限定し `code` を immutable にする — rename はスコープ外の別関心事

**Rule**: tag の `PATCH /admin/tags/:tagId` は `label` / `category` のみ更新可能とし、`code`（UNIQUE 識別子）は **immutable** に固定する。code 変更要件（rename）は AC に含めず、別 Issue（followup-002）として formalize する。

**Why**: `code` を可変にすると (1) UNIQUE 制約衝突（409 churn）、(2) `member_tags` が code 参照している場合の参照整合移行、(3) seed / UI 整合 という追加設計が芋づる式に必要になる。MVP スコープを最小化し、create で誤った code を作っても「論理削除して作り直す」運用で代替できるため、rename は意図的にスコープから外す。

**How to apply**: UNIQUE 識別子を持つ master テーブルに update を足すとき、識別子自体を mutable にするか immutable にするかを Phase 3 で明示判断する。immutable を選んだら compliance-check / unassigned-task-detection に「rename はスコープ外・別関心事」と理由付きで記録し、「やり残し」ではないことを残す。

## L-I1035-003 DELETE は `active=0` 論理削除で member_tags row を保持する（物理削除はスコープ外）

**Rule**: `DELETE /admin/tags/:tagId` は行削除ではなく `active=0` への論理削除とし、その tag を参照する `member_tags` の row は保持する。物理削除 / reactivate は別 Issue（followup-003）。`active` カラムは既存のため D1 migration 不要。

**Why**: 物理削除すると `member_tags` に孤児 row が残り参照整合が壊れる。論理削除なら過去の付与履歴を保ったまま「新規付与候補から外す」運用ができる。reactivate（active=1 へ戻す）は code 再衝突の検討が要るため、論理削除とは独立した関心事として分離する。

**How to apply**: 参照される master の「削除」要件は、まず論理削除（soft delete フラグ）で満たせないか検討する。既存スキーマに soft-delete 用カラムがあれば migration なしで実装でき、参照整合リスクを回避できる。物理削除/復活は need が顕在化してから別 Issue 化する。

## L-I1035-004 prefix が重なる route 追加は mount 順設計 + 既存 route regression を必須化する

**Rule**: `/admin/tags`（新 CRUD）と既存 `/admin/tags/queue` のように path prefix が重なる route を足すときは、(1) `apps/api/src/index.ts` の mount 順（`adminTagsQueueRoute` の後に `adminTagsRoute`）を設計するだけで終えず、(2) 新 route の contract test（`tags.contract.spec.ts`）に「既存 `/tags/queue` が従来通り 200 を返す」regression assertion を含める。

**Why**: Hono のような router は登録順 / マッチング規則によって `/tags/:tagId` が `/tags/queue` を飲み込む（queue が tagId="queue" として誤マッチ）リスクがある。mount 順を正しくしても、回帰がないことをテストで固定しないと将来の順序変更で静かに壊れる。

**How to apply**: 新 route の path が既存 route の prefix と重なる/包含する場合、新 route 側の test suite に既存 route の正常応答 regression を 1 ケース必ず入れる。`members.tags.contract.spec.ts` 等の既存 contract test も focused 実行対象に含める。

## L-I1035-005 audit 拡張は AuditTargetType に値を1つ足し event は admin.tag.* に揃える

**Rule**: tag master mutation の監査は `apps/api/src/repository/auditLog.ts` の `AuditTargetType` union に `"tag"` を 1 値追加し、event 名を `admin.tag.created` / `admin.tag.updated` / `admin.tag.deactivated` の 3 種に揃える。`targetType="tag"`、`targetId` は tagId。

**Why**: audit の target type は既存 member 系と並ぶ enum で、新規 mutation surface ごとに 1 値追加するのが最小変更。event 名を `admin.<resource>.<verb>` の既存命名規約に合わせると、後段の audit 一覧 UI / 集計がパターンマッチで拾える。

**How to apply**: 新しい mutation endpoint を足すとき、(1) `AuditTargetType` に必要なら 1 値追加、(2) event 名は既存 `admin.*` 命名規約に従う、(3) `auditLog.repository.spec.ts` に新 targetType の round-trip test を足す。型だけ足してログ記録漏れがないか contract test で確認する。

## L-I1035-006 implementation target が明確な taskType=implementation は spec-only close しない

**Rule**: `taskType=implementation` かつ `implementation_files` / `test_files` が具体化している workflow は、Phase 12 で「follow-up 実装サイクルに委譲」として `spec_created` で閉じない。実コード・focused tests・typecheck/lint・正本 spec 同期まで同一サイクルで完了し、`implemented_local_evidence_captured` へ分類して staging runtime / commit / push / PR だけを user-gated に残す。

**Why**: 実装対象が確定しているのに spec-only で閉じると、CONST_004（実装は同サイクルで）/ CONST_005（正本同期）と衝突し、後続に「実装済みか未実装か」の二重解釈を残す。`workflow_state` の語彙（`spec_created` vs `implemented_local_evidence_captured`）は実差分の有無で機械的に決める。

**How to apply**: Phase 12 の workflow_state 判定は「実コード差分があるか」を一次基準にする。差分あり + local 5 点（typecheck/lint/test/manifest/spec）取得済みなら `implemented_local_evidence_captured`。spec のみで差分ゼロのときだけ `spec_created`。compliance-check §3 で state と実差分の整合を明記する。

## 参照

- task-specification-creator `references/patterns-lessons-and-pitfalls.md` SP-I1035-A..D（本 lessons の汎用パターン版）
- `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/skill-feedback-report.md`（FB-I1035-001..005）
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-1035-tag-master-write-endpoints-artifact-inventory.md`
