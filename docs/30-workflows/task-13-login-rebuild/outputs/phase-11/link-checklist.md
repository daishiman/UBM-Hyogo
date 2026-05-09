# Phase 11 Link Checklist

Status: `runtime_pending`.

Expected routes after implementation:

| Route | Expected |
| --- | --- |
| `/login` | input state |
| `/login?state=sent&email=user%40example.com` | sent state |
| `/login?state=unregistered` | unregistered state |
| `/login?state=deleted` | deleted state |
| `/login?state=error&error=...` | error state |
| `/login?state=rules_declined` | rules_declined alert state |
| `/login?gate=admin_required` | input state with admin warning |
