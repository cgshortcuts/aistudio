# BytePlus ModelArk nodes (`@nodetool-ai/byteplus-nodes`)

Seedance 2.0 / 2.5 video generation through **your** BytePlus ModelArk API key.
Calls bill the ModelArk project that owns the key (resource packs and balance).

This is a fork-isolated pack. Core mounts use `CUSTOM FORK: BytePlus` markers.

## Setup

1. In [BytePlus ModelArk](https://console.byteplus.com/), open the project that
   holds your active resource pack / balance.
2. Create an API key in that project.
3. Store it:

```bash
nodetool secrets store BYTEPLUS_API_KEY
# or export BYTEPLUS_API_KEY=... / ARK_API_KEY=...
```

4. Enable the **BytePlus** pack in the package manager if it is off.
5. Use nodes under `byteplus.video.*`, or the `byteplus` provider from agents.

## Models

| Node | ModelArk id |
|---|---|
| Seedance 2.0 Standard | `dreamina-seedance-2-0-260128` |
| Seedance 2.0 Fast | `dreamina-seedance-2-0-fast-260128` |
| Seedance 2.0 Mini | `dreamina-seedance-2-0-mini-260615` |
| Seedance 2.5 | `dreamina-seedance-2-5-260628` (override with `BYTEPLUS_SEEDANCE_25_MODEL`) |

Optional env:

- `BYTEPLUS_ARK_BASE_URL` — default `https://ark.ap-southeast.bytepluses.com/api/v3`
- `BYTEPLUS_SEEDANCE_25_MODEL` — console-owned 2.5 model id
- `ARK_API_KEY` — accepted alias for `BYTEPLUS_API_KEY`

## API

Async create → poll → download:

- `POST /contents/generations/tasks`
- `GET /contents/generations/tasks/{id}`
- Read `content.video_url` when `status` is `succeeded`

Docs: https://docs.byteplus.com/en/docs/modelark/
