import { readdir, rename } from 'node:fs/promises';
import path from 'node:path';

import { iTunesPath, oneDrivePath } from './constants.js';
import { logHelper } from './helpers/logHelper.js';
import { extractMetadata } from './helpers/metadataHelper.js';
import { isDirectory } from './helpers/fsHelper.js';

/** @type Record<string, string[]> */
const filesToRename = {};

const onlyCheck = true;

/**
 * @param {string} filePath
 * @returns {Promise<void>}
 */
const explorePath = async (filePath) => {
  try {
    /** @type {string[]} */
    const files = await readdir(filePath);
    for (const file of files) {
      const fullPath = path.join(filePath, file);
      const isDir = await isDirectory(fullPath);
      if (isDir) {
        if (file.length > 40) {
          logHelper.add(`Warning: Directory "${file}" is more than 40 characters`, 'info');
          const dirName = path.join(filePath, file.slice(0, 40));
          if (!(dirName in filesToRename)) {
            filesToRename[dirName] = [];
          }
          filesToRename[dirName].push(fullPath);
        }
        await explorePath(path.join(filePath, file));
      } else {
        const extName = path.extname(fullPath);
        const fileName = path.basename(fullPath, extName);
        if (fileName.length > 36) {
          logHelper.add(`Warning: File "${file}" is more than 36 characters`, 'info');
          const metadata = await extractMetadata(fullPath);
          const fileName = path.join(filePath, `${metadata.track.toString().padStart(2, '0')} ${metadata.title.trim()}`.slice(0, 36).trim().concat(extName));
          if (!(fileName in filesToRename)) {
            filesToRename[fileName] = [];
          }
          filesToRename[fileName].push(fullPath);
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
};

const processRenaming = async () => {
  for (const [newFileName, oldFileNames] of Object.entries(filesToRename)) {
    if (oldFileNames.length === 1) {
      logHelper.add(`Rename ${oldFileNames[0]} to ${newFileName}`, 'info');
      if (!onlyCheck) await rename(oldFileNames[0], newFileName);
    } else if (oldFileNames.length > 1) {
      const dirName = path.dirname(newFileName);
      const fileName = path.basename(newFileName);
      const extName = path.extname(newFileName);
      for (const [i, oldFileName] of oldFileNames.entries()) {
        const newFileName = path.join(dirName, `${fileName.slice(0, 34)} ${i + 1}${extName}`);
        logHelper.add(`Rename ${oldFileName} to ${newFileName}`, 'info');
        if (!onlyCheck) await rename(oldFileName, newFileName);
      }
    }
  }
};

const main = async () => {
  await explorePath(oneDrivePath);
  // await explorePath(iTunesPath);
  await processRenaming();
};

main();
