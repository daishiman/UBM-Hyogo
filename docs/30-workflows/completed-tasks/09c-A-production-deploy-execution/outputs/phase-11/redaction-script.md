# redaction-script

判定行: `TEMPLATE_ONLY`

## Required Redaction Pipeline

Apply redaction before `tee` writes evidence files.

```bash
redact_evidence() {
  sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._-]+/\1<REDACTED:CF_TOKEN>/g' \
    -e 's/(__Secure-[^=]+=)[^;[:space:]]+/\1<REDACTED:SESSION>/g' \
    -e 's#https://hooks.slack.com/services/[A-Za-z0-9/_-]+#<REDACTED:WEBHOOK_URL>#g'
}
```

Do not commit unredacted command output.
