export const CKAN_BASE_URL = "https://data.gov.il/api/3/action/datastore_search";

/** Current pension-net resource (2024-present) */
export const PENSION_NET_RESOURCE_ID = "6d47d6b5-cb08-488b-b333-f1e717b1e1bd";

/**
 * All pension-net resources, ordered chronologically.
 * Data spans from Oct 2011 to present (~29,000 records).
 */
export const PENSION_NET_ALL_RESOURCES = [
  {
    id: "a66926f3-e396-4984-a4db-75486751c2f7",
    label: "Pension-Net 2011-2022",
    recordCount: 19130,
  },
  {
    id: "4694d5a7-5284-4f3d-a2cb-5887f43fb55e",
    label: "Pension-Net 2023",
    recordCount: 2925,
  },
  {
    id: PENSION_NET_RESOURCE_ID,
    label: "Pension-Net 2024-present",
    recordCount: 6946,
  },
];

export const CKAN_PAGE_SIZE = 1000;
