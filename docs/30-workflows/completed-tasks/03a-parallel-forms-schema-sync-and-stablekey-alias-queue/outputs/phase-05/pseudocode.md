# pseudocode — forms-schema-sync (03a)

Phase 2 の sync-flow.mermaid を関数単位に落とし込んだ擬似コード。実装は `apps/api/src/sync/schema/` に対応する。

---

## flatten(items): FlatQuestion[]

```
flat := []
sectionIndex := 0
for item in items:
  if item.sectionHeaderItem:
    sectionIndex += 1
    continue
  if item.pageBreakItem:
    continue
  if not item.questionItem: continue
  q := item.questionItem.question
  flat.push({
    itemId: item.itemId,
    questionId: q.questionId,
    title: item.title ?? "",
    description: item.description,
    required: q.required ?? false,
    type: deriveType(q),                # textQuestion | choiceQuestion(...) | scale | date
    sectionIndex,
    sectionTitle: lastSectionTitle,
  })
return flat
```

## countSections(items): number

```
return items.filter(i => i.sectionHeaderItem).length
```

## schemaHash(flat): string

```
normalized := flat
  .map(f => ({ itemId, questionId, title, type, required, sectionIndex }))
  .sort((a,b) => compare(a.itemId, b.itemId))
return sha256_hex(JSON.stringify(normalized))
```

## resolveStableKey(input, deps): { finalKey, source }

```
# input  := { questionId, title }
# deps   := { ctx, labelToKnownStableKey: Map<label, stableKey> }

alias := await schemaQuestions.findStableKeyByQuestionId(deps.ctx, input.questionId)
if alias != null and alias != "unknown":
  return { finalKey: alias, source: "alias" }

known := deps.labelToKnownStableKey.get(input.title)
if known:
  return { finalKey: known, source: "known" }

return { finalKey: "unknown", source: "unknown" }
```

## diffQueueWriter.enqueue(ctx, input)

```
existing := await ctx.db
  .prepare("SELECT 1 FROM schema_diff_queue WHERE question_id = ? AND status = 'queued' LIMIT 1")
  .bind(input.questionId)
  .first()
if existing: return false

await ctx.db.prepare(`
  INSERT INTO schema_diff_queue
    (id, revision_id, question_id, label, kind, status, created_at)
  VALUES (?, ?, ?, ?, ?, 'queued', ?)
`).bind(uuid(), input.revisionId, input.questionId, input.label, input.kind, now()).run()
return true
```

## runSchemaSync(env, deps): RunResult

```
# AC-6: running 排他
latest := await syncJobs.findLatest(deps.ctx, "schema_sync")
if latest?.status == "running": throw new ConflictError()

if not env.GOOGLE_FORM_ID: throw new SyncIntegrityError("GOOGLE_FORM_ID 未設定")

job := await syncJobs.start(deps.ctx, "schema_sync")
try:
  raw := await deps.formsClient.getRawForm(env.GOOGLE_FORM_ID)
  flat := flatten(raw.items ?? [])
  sections := countSections(raw.items ?? [])
  if flat.length != 31: throw new SyncIntegrityError("expected 31 questions")
  if sections != 6: throw new SyncIntegrityError("expected 6 sections")

  hash := await schemaHash(flat)
  revisionId := raw.revisionId ?? hash

  # known map は mapper 経由で動的構築（AC-7: literal 直書き禁止）
  labelToKnownStableKey := buildLabelToKnownStableKey(raw)

  await schemaVersions.upsertManifest(deps.ctx, {
    revisionId, schemaHash: hash, sectionCount: sections, questionCount: flat.length
  })

  upserted := 0
  diffEnqueued := 0
  for f in flat:
    r := await resolveStableKey({ questionId: f.questionId, title: f.title }, {
      ctx: deps.ctx, labelToKnownStableKey
    })
    await schemaQuestions.upsertField(deps.ctx, {
      revisionId,
      questionId: f.questionId,
      itemId: f.itemId,
      title: f.title,
      description: f.description,
      required: f.required,
      type: f.type,
      sectionKey: `section-${f.sectionIndex}`,
      sectionTitle: f.sectionTitle,
      stableKey: asStableKey(r.finalKey),
    })
    upserted += 1
    if r.source == "unknown":
      enq := await diffQueueWriter.enqueue(deps.ctx, {
        revisionId, questionId: f.questionId, label: f.title, kind: "added"
      })
      if enq: diffEnqueued += 1

  await syncJobs.succeed(deps.ctx, job.id, { upserted, diffEnqueued })
  return { jobId: job.id, status: "succeeded", revisionId, upserted, diffEnqueued }
catch e:
  await syncJobs.fail(deps.ctx, job.id, e)
  throw e
```

## adminSyncSchemaRoute (Hono)

```
POST /admin/sync/schema
adminGate (Bearer SYNC_ADMIN_TOKEN)
handler:
  try:
    deps := depsFactory(c.env)
    r := await runSchemaSync(c.env, deps)
    return c.json(r, 200)
  catch ConflictError:
    return c.json({ status: "conflict" }, 409)
  catch e:
    return c.json({ status: "failed", error: e.message }, 500)
```
