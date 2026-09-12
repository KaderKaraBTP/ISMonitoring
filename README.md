# SAC Dashboards for SAP Build Work Zone

This project packages **two SAP Analytics Cloud (SAC) dashboards as a SAP Build Work Zone
Content Package**: one Space, two Pages, two UI Integration Cards (one per dashboard), and one Role
to grant access. It follows the exact same tooling and file structure that SAP uses in its own
sample, `SAP-samples/btp-resource-consumption-monitor` (see "Relationship to the two links you gave me"
below for why this project is scoped the way it is, not a straight clone).

## What this does NOT need

It does **not** need the CAP backend / HANA / Job Scheduling / Alert Notification stack from the
`btp-resource-consumption-monitor` repo. That backend exists to *collect and calculate* BTP CPEA/BTPEA
cost data before it is analyzed in SAC. Your two dashboards (SAP Cloud Integration reporting) are a
different, self-contained **SAC Business Content package** that connects directly to your Integration
Suite tenant's own OData/analytics service — there is nothing to code for that part, only to import
inside SAC (Step 1 below).

**Your two story URLs are already wired into the two cards** (see Step 2). The card manifests already
contain your `olymel.ca10.analytics.cloud.sap` embed URLs — dashboard 1 = CPI story
`999FC2F3C63DB0559BEC705419A6E7A5`, dashboard 2 = APIM story `81A03F814125C0D47608FEC63F8AF865`. You
can skip straight to Step 3 unless the story IDs change.

## Project layout

```
wz-sac-dashboards/
├── card-sac-dashboard-1/        UI Integration Card that embeds the CPI SAC story
├── card-sac-dashboard-2/        UI Integration Card that embeds the APIM SAC story
└── content-package/             The Work Zone Content Package that bundles everything
    ├── content.json             Wires the 2 cards + 1 role + 1 space + 2 pages together
    ├── manifest.json            Package metadata (title, vendor, version, ...)
    ├── cdm/
    │   ├── role.json            Role granting access to both dashboard apps
    │   ├── spaces/sac-dashboards.json
    │   └── pages/dashboard1.json, dashboard2.json
    └── scripts/                 Build tooling (pull.js / build.js / validate.js)
```

---

## Step 0. Prerequisites

- Node.js (LTS) and npm installed locally, or use **SAP Business Application Studio** with a
  `Dev Space` of kind *Full Stack Cloud Application* + the **Development Tools for SAP Build Work
  Zone** extension enabled (same requirement as the sample repo).
- A SAP Analytics Cloud tenant (any tenant, doesn't need to be in the same subaccount).
- A SAP Build Work Zone, standard edition site, with `Channel Manager` and `Site Directory` access.
- Your BTP **subaccount ID (GUID)** — not needed for this project, since these two cards call SAC
  directly and don't call your own backend/destination. (You'd only need it if you also deploy the
  full `btp-resource-consumption-monitor` app — see the note at the end.)

---

## Step 1. Import the SAC Business Content and get your two Story URLs

Do this once per dashboard, in your SAC tenant:

1. Main Menu → **Browse → Content Network → Business Content**.
2. Find and import the relevant business content package(s), e.g. **"SAP Cloud Integration Reporting
   Dashboard"** (from the blog post you linked) — repeat for a second package/story if your two
   dashboards come from two different content packages, or just note two different pages within the
   same story if it's one story with two views.
3. After import, go to **Browse → Files → Public → SAP_Content**, open the relevant folder
   (e.g. `SAP_ALL_CPI`), and open the imported **Story**.
4. **Refresh/schedule** the underlying data models against your Integration Suite tenant connection,
   as described in the blog post, so the dashboard actually shows data.
5. With the story open, click **File → Share**, and copy the URL. It looks like:
   `https://<HOST>.sapanalytics.cloud/sap/fpa/ui/tenants/<TENANT>/bo/story/<STORY_ID>`
6. Convert it to the **embed URL** format required by the card (note this is NOT the same as the
   share URL — this is the part people most often get wrong):
   ```
   https://<HOST>.sapanalytics.cloud/sap/fpa/ui/tenants/<TENANT>/app.html#/story2?shellMode=embed&/s2/<STORY_ID>/?url_api=true&pageBar=disable&view_id=story2
   ```
7. Repeat for the second dashboard/story. You now have two embed URLs.

### Allow Work Zone to embed the SAC story

In SAC: **System → Administration → App Integration → Trusted Origins** → add your Work Zone site
origin, e.g. `https://*.launchpad.<region>.hana.ondemand.com` (wildcards allowed).

---

## Step 2. Story URLs (already configured)

Already set in `sap.card.configuration.parameters.SAC_url.value` of each card:

- `card-sac-dashboard-1` (CPI): `https://olymel.ca10.analytics.cloud.sap/sap/fpa/ui/bo/story/999FC2F3C63DB0559BEC705419A6E7A5?shellMode=embed&url_api=true&pageBar=disable&view_id=story2`
- `card-sac-dashboard-2` (APIM): `https://olymel.ca10.analytics.cloud.sap/sap/fpa/ui/bo/story/81A03F814125C0D47608FEC63F8AF865?shellMode=embed&url_api=true&pageBar=disable&view_id=story2`

**Note on URL format:** this uses the shorter `/sap/fpa/ui/bo/story/<ID>?shellMode=embed&...` form.
Most SAC tenants accept this directly; a small number of older tenants only accept the longer
`.../app.html#/story2?shellMode=embed&/s2/<ID>/?url_api=true&pageBar=disable&view_id=story2` form
instead. If a card renders a blank frame after deployment (and Trusted Origins below is correctly
configured), try switching to that longer form for your tenant.

Don't forget **Trusted Origins** in SAC (see below) — without it the iframe will refuse to load
regardless of which URL form you use.

---

## Step 3. Build the Content Package

```bash
cd content-package
npm install
npm run build-all
```

This will:
1. `pull.js` — resolve the two local card folders referenced in `content.json`.
2. `build.js` — run `npm i && npm run build` inside each card project (bundling it into a `.zip`),
   read the two static `role.json` / `sac-dashboards.json` / `dashboard1.json` / `dashboard2.json`
   files, and assemble everything into **`content-package/package.zip`**.

If `npm install` fails to resolve `sap-workzone-cpkg-tools` from GitHub in your network, clone
https://github.com/SAP-samples/workzone-content-package-templates and copy its `tools/` folder in
locally, then point the `devDependencies` entry at the local path instead.

---

## Step 4. Deploy to SAP Build Work Zone

In the **Work Zone Site Manager** → **Channel Manager**:

1. Click the **refresh icon** to synchronize your HTML5 Repository.
2. Click **+ New → Content Package**, upload `content-package/package.zip`.
   You will **not** need a "Runtime Destination" this time (unlike the CPEA sample) because these
   cards call SAC directly via the URL baked into the card's configuration parameter, not through a
   BTP destination.
3. Wait ~30 seconds for the import to finish.

In the **Site Directory**:

1. Open (or create) your site, click the gear icon → **Site Settings → Edit**.
2. Under **Display**, set **View Mode** to **Spaces and Pages – New Experience** (if not already).
3. In **Assignments**, enable the new role: **SAC Dashboards Viewer** (`+` icon next to it).
4. Save.

In **BTP Cockpit → Security → Role Collections** (or directly via the Work Zone role assignment UI),
assign the `SAC Dashboards Viewer` role/role collection to the users who should see the two
dashboards.

---

## Step 5. Verify

Open your Work Zone site → you should now see a **SAC Dashboards** space with two pages, each
showing one full SAC story embedded edge-to-edge. If you get:

- **"You have no authorization to the model" / "Insufficient Privileges"** in SAC → grant the
  connecting SAC user `SELECT` on `_SYS_BI::BIMC_PROPERTIES`, or update HANA Cloud to 2024.14+.
- **Blank iframe / refused to connect** → double check the Trusted Origins entry in SAC App
  Integration, and that you used the `app.html#/story2?shellMode=embed...` URL format, not the plain
  Share URL.
- **Cache-buster 500 error opening the tile** → in Channel Manager, click "Update content" on the
  HTML5 Apps entry twice in a row.

---

## If you actually also want the full BTP Resource Consumption Monitor app

That is a separate, much larger deliverable: a CAP (Node/TypeScript) backend deployed to Cloud
Foundry or Kyma, backed by SAP HANA Cloud, Job Scheduling, Alert Notification, XSUAA, Destination and
HTML5 Repo services, plus its own SAC package and its own Work Zone content package (8 Fiori apps).
It is unrelated to the two SAC/CPI dashboards you linked — it monitors BTP **credit/cost consumption**,
not Integration Suite message processing. If you want that too, clone
`https://github.com/SAP-samples/btp-resource-consumption-monitor` and follow its README exactly; I'm
happy to walk through each of its 3 install phases (backend / SAC / Work Zone) with you step by step,
or to prepare an mtaext/config diff for your specific subaccount if you share the (non-secret) IDs.
