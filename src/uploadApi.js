// Upload Flow Documentation
// -------------------------
// The remote inspection file upload uses a two-phase pattern:
// Phase 1: Initialization (/files/init-upload)
//   - Client POSTs { originalFileName } with Bearer token.
//   - Server responds with:
//       { fileName, fileUri, filePreviewUri, fileMediumSizeUri, upload:{ original, preview, medium, expiresOn } }
//     Where upload.original (and preview/medium) are SAS-authorized PUT URLs (if storage key present) or unsigned blob URLs.
// Phase 2: Binary Upload
//   - Client PUTs the raw file bytes to upload.original using 'x-ms-blob-type: BlockBlob'.
//   - (Optional) Client may generate previews and upload them to upload.preview / upload.medium endpoints if needed.
// Phase 3: Completion (/files/complete)
//   - Client POSTs { fileName, fileUri, filePreviewUri, fileMediumSizeUri }. This persists metadata row.
//   - Server returns { id, list } with updated file list.
// Notes:
//   - The preview/medium URIs are placeholders until client image processing is implemented.
//   - Token acquisition for dev is handled by ensureDevToken(). In production, obtain real OAuth2 access token.
//   - After completion, refresh list via GET /inspection/results/:id/files.
// Example:
//   const token = await ensureDevToken();
//   const init = await initRemoteFileUpload(42, 'photo.jpg', token);
//   await putBinary(init.upload.original, fileInput.files[0]);
//   await completeRemoteFileUpload(42, init, token);
//   const list = await fetch('/inspection/results/42/files').then(r=>r.json());

export async function initRemoteFileUpload(inspectionResultId, originalFileName, token){
  const resp = await fetch(`/inspection/results/${inspectionResultId}/files/init-upload`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
    body: JSON.stringify({ originalFileName })
  });
  if(!resp.ok) throw new Error(`init-upload failed ${resp.status}`);
  return resp.json();
}

export async function putBinary(signedUrl, fileOrBlob){
  const resp = await fetch(signedUrl, {
    method:'PUT',
    body: fileOrBlob,
    headers:{ 'x-ms-blob-type':'BlockBlob' }
  });
  if(!resp.ok) throw new Error(`blob upload failed ${resp.status}`);
  return true;
}

export async function completeRemoteFileUpload(inspectionResultId, initUploadResponse, token){
  const { fileName, fileUri, filePreviewUri, fileMediumSizeUri } = initUploadResponse;
  const resp = await fetch(`/inspection/results/${inspectionResultId}/files/complete`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
    body: JSON.stringify({ fileName, fileUri, filePreviewUri, fileMediumSizeUri })
  });
  if(!resp.ok) throw new Error(`complete-upload failed ${resp.status}`);
  return resp.json();
}

export async function ensureDevToken(){
  if(window.__devToken) return window.__devToken;
  const r = await fetch('/oauth2/dev-token', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ inspectionCompanyId:1 }) });
  if(!r.ok) throw new Error('dev token failed');
  const d = await r.json();
  window.__devToken = d.access_token; return window.__devToken;
}
