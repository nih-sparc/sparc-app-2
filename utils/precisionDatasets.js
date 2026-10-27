/**
 * Datasets on the Precision dashboard: where each one's data comes from, how the widgets
 * present it, and which tabs it gets. /apps/precision-dashboard lists them as cards, and
 * each one opens at /apps/precision-dashboard/<id>.
 *
 * Card: `label` is the title; `sparcDatasetId` (the dataset's number on sparc.science)
 * adds its banner image, description and a link to its page, fetched from Discover.
 * Until a dataset is published, the card shows `summary` and a placeholder image.
 *
 * Data source, one of:
 * - `packageIds`: a published Pennsieve package per environment, keyed by the discover API
 *   host (runtime config PRECISION_DISCOVER_API_HOST, env var of the same name; defaults to
 *   PENNSIEVE_DISCOVER_API_HOST_V2). Assets and renewable CloudFront credentials come from
 *   the public discover endpoint. A dataset with no package for the current host is left
 *   out (no card, and its URL is a 404).
 * - `url`: a plain public URL to the parquet files (no credentials).
 *
 * `config` is passed to every widget: `hiddenColumns` are left out of metadata dropdowns,
 * `defaultColorBy` is the column selected first, `cellTypeColumn` groups cells by type
 * (the processor's manifest calls it `cell_type_column`), and `externalLink` turns legend
 * values into links.
 */
export const PRECISION_DATASETS = [
  {
    id: "human-drg-atlas",
    label: "Human DRG Atlas",
    sparcDatasetId: 480,
    summary: "Single nucleus sequencing atlas of human dorsal root ganglion.",
    modalities: ["snRNA-seq"],
    url: "https://temp-precision-dashboard-data.s3.us-east-1.amazonaws.com/humandrg/v2",
    tabs: ["coexpression", "sideBySide", "distribution", "proportion"],
    defaultGenes: { gene1: "CDH9", gene2: "TAC1", geneX: "CDH9", sideBySide: "CDH9" },
    config: {
      hiddenColumns: ["donor_id", "cell_barcode"],
      defaultColorBy: "Atlas_annotation",
      externalLink: {
        column: "Atlas_annotation",
        urlTemplate: "https://nervosensus.netlify.app/?view=cards&atlasannotation={value}",
        label: "View in Nervosensus",
      },
    },
  },
  {
    id: "human-drg-multiome",
    label: "Human DRG Multiome ATAC + RNA-seq",
    // sparcDatasetId: add once the dataset is published on SPARC
    summary: "Single-nucleus multiome (ATAC + RNA-seq) of human dorsal root ganglion.",
    modalities: ["snRNA-seq", "snATAC-seq"],
    packageIds: {
      "https://api2.pennsieve.net": "N:package:3376584f-3c00-4945-8c04-05cb5996448a",
      // "https://api2.pennsieve.io": add once the dataset is published on prod
    },
    tabs: ["coexpression", "sideBySide", "distribution", "proportion", "chromatin"],
    defaultGenes: {
      gene1: "SCN10A",
      gene2: "TRPV1",
      geneX: "SCN10A",
      sideBySide: "SCN10A",
      chromatin: "SCN10A",
    },
    config: {
      hiddenColumns: ["donor_id"],
      defaultColorBy: "final_cluster_ids",
      cellTypeColumn: "final_cluster_ids",
      externalLink: null,
    },
  },
];

/** The datasets available against this discover API host, with their `packageId` resolved. */
export function precisionDatasetsFor(api2Url) {
  // Tolerate stray whitespace and trailing slashes in the env var
  const host = String(api2Url || "").trim().replace(/\/+$/, "");
  return PRECISION_DATASETS.map((d) => ({ ...d, packageId: d.packageIds?.[host] ?? null })).filter(
    (d) => d.url || d.packageId
  );
}

/** Old links (/apps/precision-dashboard?dashboard=…&gene=…) predate the selector: they open this dataset */
export const LEGACY_DATASET_ID = "human-drg-atlas";
export const LEGACY_QUERY_PARAMS = ["dashboard", "gene", "gene2", "metadataColumn"];

/** The discover API host for the Precision datasets, from runtime config */
export function precisionApiHost(config) {
  // Trimmed: a config var saved with a trailing space would otherwise hide the package
  // datasets and break the API URL
  return String(config.public.PRECISION_DISCOVER_API_HOST || "").trim().replace(/\/+$/, "");
}
