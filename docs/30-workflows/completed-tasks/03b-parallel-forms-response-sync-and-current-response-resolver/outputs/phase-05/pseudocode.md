# Pseudocode — runResponseSync / processResponse / decideShouldUpdate

実コードに 1:1 対応する論理擬似コード。レビュー / 引き継ぎ時の地図。

## runResponseSync

```text
function runResponseSync(env, options):
  jobId = "job-" + uuid()
  start(env.DB, jobId, "response_sync", now())

  try:
    acquired = tryAcquireResponseSyncLock(env.DB, holder=jobId, ttl=30min)
    if not acquired:
      succeed(env.DB, jobId, { skipped: true })
      return { status: "skipped", skippedReason: "another response sync in progress", ... }

    cursor =
      options.cursor != null  -> options.cursor
      options.fullSync        -> null
      else                    -> readLastCursor(env.DB)

    metrics = { processedCount: 0, writeCount: 0, errorCount: 0 }
    writeCap = parseInt(env.RESPONSE_SYNC_WRITE_CAP ?? "200")

    while true:
      page = client.listResponses(env.GOOGLE_FORM_ID, { pageSize: 100, pageToken: cursor })
      for resp in page.responses:
        try:
          writeDelta = processResponse(env.DB, resp)
          metrics.writeCount  += writeDelta
          metrics.processedCount += 1
        catch err:
          metrics.errorCount += 1
          log.warn(redact(err))
        if metrics.writeCount >= writeCap:
          cursor = page.nextPageToken ?? null
          break-outer
      if not page.nextPageToken:
        cursor = null
        break
      cursor = page.nextPageToken

    succeed(env.DB, jobId, { ...metrics, cursor })
    return { status: "succeeded", jobId, ...metrics, cursor }

  catch err:
    fail(env.DB, jobId, classifyError(err))
    return { status: "failed", jobId, error: classifyError(err), ... }

  finally:
    releaseResponseSyncLock(env.DB, holder=jobId)
```

## processResponse

```text
function processResponse(db, resp):
  if not resp.responseEmail:        # AC-4 前提: email 必須
    return 0

  identity = findIdentityByEmail(db, resp.responseEmail)
  if identity is null:
    memberId = asMemberId(uuid())
    identity = upsertMember(db, {
      memberId,
      responseEmail: resp.responseEmail,
      currentResponseId: resp.responseId,
      firstResponseId:   resp.responseId,
      lastSubmittedAt:   resp.submittedAt,
    })
  else:
    memberId = identity.member_id

  upsertMemberResponse(db, {
    responseId: resp.responseId,
    formId, revisionId, schemaHash,
    responseEmail: resp.responseEmail,         # AC-4: system field 列に保存
    submittedAt, editResponseUrl,
    answers / raw / extra / unmapped / searchText,
  })

  { known, unknown } = normalizeResponse(resp)
  for [stableKey, val] in known:
    upsertKnownField(db, resp.responseId, stableKey, val.json, val.raw)
  for [qid, val] in unknown:
    upsertExtraField(db, resp.responseId, qid, val.raw)         # __extra__:<qid>
    try: enqueueDiff(db, { questionId: qid, type: "added", ... })  # AC-2 重複 no-op
    catch UNIQUE: pass

  if decideShouldUpdate(identity.last_submitted_at, identity.current_response_id,
                        resp.submittedAt, resp.responseId):
    updateCurrentResponse(db, memberId, resp.responseId, resp.submittedAt)

  status = findStatusByMemberId(db, memberId)
  if status?.is_deleted !== 1:                                   # AC-9
    consent = extractConsent(resp)
    setConsentSnapshot(db, memberId, consent)

  return writeDeltaThisResponse
```

## decideShouldUpdate（AC-1）

```text
function decideShouldUpdate(curAt, curId, newAt, newId) -> boolean:
  if newAt > curAt: return true
  if newAt < curAt: return false
  return newId > curId   # lex max
```

## classifyError

```text
function classifyError(err):
  msg = String(err)
  if "429"      in msg: return "QUOTA_EXCEEDED"
  if "401"|"403" in msg: return "FORMS_AUTH"
  if "5"        in msg.statusClass: return "FORMS_5XX"
  if "INVALID_PAGE_TOKEN" in msg: return "CURSOR_INVALID"
  if "UNIQUE constraint" in msg and "response_email" in msg: return "EMAIL_CONFLICT"
  if "timeout"  in msg: return "DB_TIMEOUT"
  return "INTERNAL"
```
