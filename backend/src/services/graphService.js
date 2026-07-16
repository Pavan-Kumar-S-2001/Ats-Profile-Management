const { ConfidentialClientApplication } = require('@azure/msal-node');
const { log } = require('../utils/logger');

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

function buildMsalClient() {
  return new ConfidentialClientApplication({
    auth: {
      clientId: process.env.MS_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}`,
      clientSecret: process.env.MS_CLIENT_SECRET,
    },
  });
}

let cachedToken = null;
let cachedTokenExpiry = 0;

/**
 * Acquire an app-only (client credentials) Graph token, cached until near-expiry.
 */
async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry - 60_000) {
    return cachedToken;
  }
  if (!process.env.MS_TENANT_ID || !process.env.MS_CLIENT_ID || !process.env.MS_CLIENT_SECRET) {
    throw Object.assign(new Error('Microsoft Graph credentials are not configured'), { publicMessage: 'Microsoft Graph credentials are not configured. Set them in Settings.' });
  }
  const client = buildMsalClient();
  const result = await client.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });
  cachedToken = result.accessToken;
  cachedTokenExpiry = result.expiresOn ? result.expiresOn.getTime() : now + 55 * 60 * 1000;
  return cachedToken;
}

async function graphFetch(path, options = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Graph API error ${res.status}: ${body}`);
    err.statusCode = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Test that current credentials + Drive ID are valid and reachable.
 */
async function testConnection() {
  const driveId = process.env.MS_DRIVE_ID;
  if (!driveId) throw Object.assign(new Error('MS_DRIVE_ID not set'), { publicMessage: 'Drive ID is not configured' });
  const data = await graphFetch(`/drives/${driveId}`);
  return { ok: true, driveName: data.name, driveType: data.driveType };
}

/**
 * List immediate child items (folders) under the configured parent folder.
 * These represent each recruiter's folder, e.g. Recruiters/Ajay, Recruiters/Shiva ...
 */
async function listRecruiterFolders() {
  const driveId = process.env.MS_DRIVE_ID;
  const parent = encodeURIComponent(process.env.MS_PARENT_FOLDER || 'Recruiters');
  const data = await graphFetch(`/drives/${driveId}/root:/${parent}:/children?$select=id,name,folder`);
  return (data.value || []).filter((item) => item.folder);
}

/**
 * List PDF files inside a given recruiter folder (by item id).
 * Returns Graph driveItem objects with id, name, size, webUrl, @microsoft.graph.downloadUrl, lastModifiedDateTime.
 */
async function listResumeFiles(folderItemId) {
  const driveId = process.env.MS_DRIVE_ID;
  const data = await graphFetch(
    `/drives/${driveId}/items/${folderItemId}/children?$select=id,name,size,webUrl,file,lastModifiedDateTime,@microsoft.graph.downloadUrl`
  );
  return (data.value || []).filter((item) => item.file && item.name.toLowerCase().endsWith('.pdf'));
}

/**
 * Download a file's binary content (used for page counting / dedupe hashing).
 */
async function downloadFileContent(itemId) {
  const driveId = process.env.MS_DRIVE_ID;
  const token = await getAccessToken();
  const res = await fetch(`${GRAPH_BASE}/drives/${driveId}/items/${itemId}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to download item ${itemId}: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = {
  getAccessToken,
  testConnection,
  listRecruiterFolders,
  listResumeFiles,
  downloadFileContent,
};
