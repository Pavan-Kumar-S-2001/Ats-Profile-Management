const prisma = require('../config/db');
const graph = require('./graphService');
const { processPdfBuffer } = require('./resumeProcessor');
const { log } = require('../utils/logger');

let syncInProgress = false;

/**
 * Sync a single recruiter: list their OneDrive folder, upsert new/changed PDFs,
 * detect duplicates by content hash, and mark files removed from source.
 */
async function syncRecruiter(recruiter) {
  await prisma.recruiter.update({
    where: { id: recruiter.id },
    data: { syncStatus: 'Syncing' },
  });

  try {
    // Resolve the recruiter's OneDrive folder id if not cached yet
    let folderId = recruiter.folderId;
    if (!folderId) {
      const folders = await graph.listRecruiterFolders();
      const match = folders.find(
        (f) => f.name.toLowerCase() === recruiter.oneDriveFolderName.toLowerCase()
      );
      if (!match) {
        throw new Error(`OneDrive folder "${recruiter.oneDriveFolderName}" not found under parent folder`);
      }
      folderId = match.id;
      await prisma.recruiter.update({ where: { id: recruiter.id }, data: { folderId } });
    }

    const files = await graph.listResumeFiles(folderId);
    const seenItemIds = new Set(files.map((f) => f.id));

    let newCount = 0;
    let duplicateCount = 0;

    for (const file of files) {
      const existing = await prisma.resume.findUnique({ where: { oneDriveItemId: file.id } });

      if (existing) {
        // Track modified files: if OneDrive shows a newer modified time, re-process
        const remoteModified = new Date(file.lastModifiedDateTime);
        if (remoteModified > existing.modifiedDate) {
          await reprocessResume(existing, file, recruiter);
        }
        continue;
      }

      // New file - download, process, and check for duplicates by content hash
      const buffer = await graph.downloadFileContent(file.id);
      const { contentHash, pageCount, candidateName } = await processPdfBuffer(buffer, file.name);

      const duplicateOf = await prisma.resume.findFirst({
        where: { contentHash, recruiterId: recruiter.id },
      });

      const created = await prisma.resume.create({
        data: {
          candidateName,
          fileName: file.name,
          recruiterId: recruiter.id,
          fileSizeBytes: file.size || 0,
          pageCount,
          processingStatus: 'Processed',
          oneDriveItemId: file.id,
          oneDriveWebUrl: file.webUrl,
          downloadUrl: file['@microsoft.graph.downloadUrl'] || null,
          contentHash,
          isDuplicate: !!duplicateOf,
          duplicateOfId: duplicateOf ? duplicateOf.id : null,
        },
      });

      newCount++;
      if (duplicateOf) {
        duplicateCount++;
        await log('Duplicate', `Duplicate resume detected: ${file.name} (recruiter: ${recruiter.name})`, recruiter.id);
      }
      void created;
    }

    // Track deleted files: any resume in DB no longer present in the folder listing
    const dbResumes = await prisma.resume.findMany({
      where: { recruiterId: recruiter.id, deletedFromSource: false },
      select: { id: true, oneDriveItemId: true },
    });
    const removedIds = dbResumes.filter((r) => !seenItemIds.has(r.oneDriveItemId)).map((r) => r.id);
    if (removedIds.length) {
      await prisma.resume.updateMany({
        where: { id: { in: removedIds } },
        data: { deletedFromSource: true },
      });
    }

    const uploadCount = await prisma.resume.count({
      where: { recruiterId: recruiter.id, deletedFromSource: false },
    });
    const lastUpload = await prisma.resume.findFirst({
      where: { recruiterId: recruiter.id },
      orderBy: { uploadDate: 'desc' },
      select: { uploadDate: true },
    });

    await prisma.recruiter.update({
      where: { id: recruiter.id },
      data: {
        syncStatus: 'Synced',
        lastSyncAt: new Date(),
        uploadCount,
        lastUpload: lastUpload ? lastUpload.uploadDate : recruiter.lastUpload,
      },
    });

    await log('Sync', `Synced ${recruiter.name}: ${newCount} new file(s), ${duplicateCount} duplicate(s), ${removedIds.length} removed`, recruiter.id);
    return { newCount, duplicateCount, removed: removedIds.length };
  } catch (err) {
    await prisma.recruiter.update({ where: { id: recruiter.id }, data: { syncStatus: 'Failed' } });
    await log('Error', `Sync failed for ${recruiter.name}: ${err.message}`, recruiter.id);
    throw err;
  }
}

async function reprocessResume(existing, file, recruiter) {
  try {
    const buffer = await graph.downloadFileContent(file.id);
    const { contentHash, pageCount, candidateName } = await processPdfBuffer(buffer, file.name);
    await prisma.resume.update({
      where: { id: existing.id },
      data: {
        candidateName,
        fileSizeBytes: file.size || 0,
        pageCount,
        contentHash,
        oneDriveWebUrl: file.webUrl,
        downloadUrl: file['@microsoft.graph.downloadUrl'] || null,
        processingStatus: 'Processed',
      },
    });
    await log('Sync', `Re-processed modified file: ${file.name}`, recruiter.id);
  } catch (err) {
    await prisma.resume.update({ where: { id: existing.id }, data: { processingStatus: 'Failed' } });
    await log('Error', `Failed to reprocess ${file.name}: ${err.message}`, recruiter.id);
  }
}

/**
 * Sync every active recruiter sequentially (kept sequential to respect Graph rate limits).
 */
async function syncAll() {
  if (syncInProgress) {
    return { skipped: true, reason: 'A sync is already in progress' };
  }
  syncInProgress = true;
  const results = [];
  try {
    const recruiters = await prisma.recruiter.findMany({ where: { status: 'Active' } });
    for (const recruiter of recruiters) {
      try {
        const result = await syncRecruiter(recruiter);
        results.push({ recruiterId: recruiter.id, name: recruiter.name, ...result });
      } catch (err) {
        results.push({ recruiterId: recruiter.id, name: recruiter.name, error: err.message });
      }
    }
    return { skipped: false, results };
  } finally {
    syncInProgress = false;
  }
}

function isSyncInProgress() {
  return syncInProgress;
}

module.exports = { syncRecruiter, syncAll, isSyncInProgress };
