# task-20 W2 Screen Blueprints public/member Lessons (2026-05)

## Scope

Workflow: `docs/30-workflows/completed-tasks/task-20-w2-screen-blueprints-public-and-member/`

Task type: `implemented-local / docs-only / NON_VISUAL / Phase 13 blocked_pending_user_approval`

成果物: `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` / `09f-screen-blueprints-member.md`

## Lessons

### L-T20W2-001: docs-only は「コード変更なし」であり、「実 docs 成果物なし」ではない

- Symptom: Phase 11/12 で「docs-only だから evidence 不要」と判断し、grep gate / strict 7 files を skip しそうになった。
- Cause: `docs-only` という workflow_type の語感が「成果物が薄い」と読めるため、task scope に markdown が含まれる場合でも same-wave evidence の必要性が見落とされる。
- Recurrence condition: 今後の docs-only / spec-only / NON_VISUAL タスクで「実装コードがない＝Phase 11 を簡易化してよい」と誤読する。
- 5-minute resolution: docs-only でも「task scope に新規 / 変更 markdown が含まれる」場合は Phase 11 で grep evidence（visual literal / TBD / TODO / placeholder / line count / api trace / section count / markdown lint）を必須化する。task-specification-creator の docs-only テンプレートに NON_VISUAL grep evidence checklist を明示。
- Evidence path: `docs/30-workflows/completed-tasks/task-20-w2-screen-blueprints-public-and-member/outputs/phase-11/evidence/`

### L-T20W2-002: fenced JSX prototype 転記と visual literal grep は衝突する

- Symptom: 09e / 09f に凍結 prototype を一字一句転記する要件があるが、visual literal grep gate が prototype 内の色名 / px 値 / コピーテキストを literal violation として fail させる。
- Cause: visual gate は仕様本文への literal 値混入を防ぐためのものだが、転記対象の fenced code block はそもそも凍結資料の写しであり、検出対象から除外する必要がある。
- Recurrence condition: 今後の screen blueprint 系 / prototype 転記系で同じ判定を毎回手動で行う。
- 5-minute resolution: visual literal grep の正規表現 / スクリプトを ```` ``` 〜 ``` ```` で囲まれた fenced code block を除外する形に変更する。または `<!-- visual-gate:exempt-start --> ... <!-- visual-gate:exempt-end -->` 等の明示マーカーで除外。本タスクでは grep の対象を `^(?!```).*` 行のみに絞ることで PASS 化した。
- Evidence path: `docs/30-workflows/completed-tasks/task-20-w2-screen-blueprints-public-and-member/outputs/phase-11/evidence/grep-visual-values.log`

### L-T20W2-003: 09 series の screen blueprint は quick-reference / resource-map / task-workflow-active へ 1-hop 導線を必須化する

- Symptom: 09e / 09f を読みたい後続 task-11..14 の実装担当が、aiworkflow-requirements indexes から spec 直リンクに到達するまでに 2-3 hop かかる。
- Cause: 09 series（design-tokens / primitives / icons / blueprints）は CLAUDE.md の "UI prototype alignment / MVP recovery" セクションには記載されるが、skill indexes の lookup table に常時掲載されていなかった。
- Recurrence condition: 09g 以降の追加（admin blueprints 等）でも同じ参照コストが発生する。
- 5-minute resolution: 09 series 追加 / 更新時は `quick-reference.md` の専用ブロック / `resource-map.md` のクイックルックアップ / `task-workflow-active.md` の active entry に 1-hop 導線を同一 wave で追加。本タスクで適用済み。
- Evidence path: `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`, `indexes/resource-map.md`, `references/task-workflow-active.md`

### L-T20W2-004: §99 不採用要素ブロックは prototype consumed trace の正本としてフォーマットを固定する

- Symptom: pages-public.jsx / pages-member.jsx に存在するが MVP scope 外の要素（後続 task や仕様変更で意図的に除外）について、blueprint 上に「採用しなかった」記述がないと将来 reviewer が「漏れ」と勘違いして起票する。
- Cause: 不採用 trace を残す場所が決まっておらず、各 blueprint 著者が独自に判断していた。
- Recurrence condition: 09e/f 以降の blueprint（admin、register、privacy 等）で同じ判断ブレが起きる。
- 5-minute resolution: 09e / 09f に `§99 不採用要素` セクションを必須化し、prototype 由来要素のうち MVP scope 外のものは「prototype 該当箇所」「除外理由」「再採用判断条件」の 3 項を 1 行ずつ記録する。フォーマットを 09e の §99 を正本とする。
- Evidence path: `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` §99, `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md` §99

### L-T20W2-005: outputs/artifacts.json と root artifacts.json の二重管理は parity check の対象外にする

- Symptom: 一部の workflow は `outputs/artifacts.json` を持ち parity check 対象になるが、本タスクは root `artifacts.json` のみで運用しており、parity check を機械的に走らせると「outputs 側不在 = FAIL」と判定される。
- Cause: workflow テンプレが両方の置き場所を許容しているが、parity check スクリプトが両者の存在を前提にしているケースがある。
- Recurrence condition: docs-only タスクで `outputs/artifacts.json` を作らず root のみで運用する場合に毎回再発。
- 5-minute resolution: `phase12-task-spec-compliance-check.md` で `outputs/artifacts.json` の有無を明示し、root のみが正本である旨を Artifacts セクションに記録。parity check スクリプトは root 単独運用を許容する判定分岐を入れる。
- Evidence path: `docs/30-workflows/completed-tasks/task-20-w2-screen-blueprints-public-and-member/outputs/phase-12/phase12-task-spec-compliance-check.md`
