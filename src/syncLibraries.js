import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

import { __dirname, iTunesPath, oneDrivePath, musicFileExt, localhostPath } from './constants.js';
import { logHelper } from './helpers/logHelper.js';
import { iTunesMusicLibraryHelper } from './helpers/iTunesMusicLibraryHelper.js';
import { extractMetadata } from './helpers/metadataHelper.js';
import { isDirectory, isFileExists } from './helpers/fsHelper.js';

const onlyCheck = true;

/**
 * @typedef {Object} Metadata
 * @property {string} title
 * @property {string} artist
 * @property {string} album
 * @property {string} [genre]
 * @property {number} [track]
 * @property {number} date
 * @property {string} hash
 *
 * @typedef {Object} FileList
 * @property {string} fullPath
 * @property {string} relativePath
 * @property {string} fileName
 * @property {string} fileExtName
 * @property {Metadata} metadata
 *
 * @typedef {import('./iTunesMusicLibraryHelper').ITunesMusicLibraryElem} ITunesMusicLibraryElem
 */

/**
 * @param {string} rootPath
 * @param {string} relativePath
 * @param {Map<string,FileList>} fileList
 * @returns {Promise<Map<string,FileList>>}
 */
const explorePath = async (rootPath, relativePath = '', fileList = new Map()) => {
  try {
    const files = await readdir(path.join(rootPath, relativePath));
    for (const file of files) {
      const fullPath = path.join(rootPath, relativePath, file);
      const isDir = await isDirectory(fullPath);
      if (isDir) {
        await explorePath(rootPath, path.join(relativePath, file), fileList);
      } else {
        const fileExtName = path.extname(fullPath);
        if (musicFileExt.includes(fileExtName)) {
          const fileName = path.basename(fullPath, fileExtName);
          const metadata = await extractMetadata(fullPath);
          fileList.set(metadata.hash, {
            fullPath,
            relativePath,
            fileName,
            fileExtName,
            metadata,
          });
        } else {
          logHelper.add(`Skip file extension: ${fileExtName}`, 'info');
        }
      }
    }
    return fileList;
  } catch (err) {
    logHelper.add(err, 'error');
  }
};

/**
 * @param {ITunesMusicLibraryElem[]} iTunesMusicLibraryElems
 * @param {string} oneDriveFile
 * @param {string} fileDest
 * @returns {void}
 */
const updateITunesMusicLibraryElems = (iTunesMusicLibraryElems, oneDriveFile, fileDest) => {
  const iTuneElem = iTunesMusicLibraryElems.find(
    (elem) => elem.string.includes(oneDriveFile.metadata.artist) && elem.string.includes(oneDriveFile.metadata.album) && elem.string.includes(oneDriveFile.metadata.title)
  );
  if (!iTuneElem) {
    logHelper.add(`Elem ${oneDriveFile.fullPath} not found in iTunes Music Library`, 'info');
    return;
  }
  const sanitizedLocation = fileDest.replaceAll('\\', '/').replaceAll(' ', '%20');
  for (const [i, value] of iTuneElem.string.entries()) {
    if (value.startsWith(localhostPath)) {
      iTuneElem.string[i] = `${localhostPath}${sanitizedLocation}`;
    }
  }
};

const main = async () => {
  // Init Logger
  logHelper.init();

  // Load iTunes Music Library.xml
  /** @type {ITunesMusicLibraryElem[]} */
  const iTunesMusicLibraryElems = await iTunesMusicLibraryHelper.load();

  // Load files
  const iTunesFiles = await explorePath(iTunesPath);
  const oneDriveFiles = await explorePath(oneDrivePath);

  // Merge
  for (const [hash, oneDriveFile] of oneDriveFiles) {
    try {
      const oneDriveFileName = `${oneDriveFile.fileName}${oneDriveFile.fileExtName}`;
      const iTunesFile = iTunesFiles.get(hash);
      /** @type {string} */
      const fileDest = path.join(iTunesPath, oneDriveFile.relativePath, oneDriveFileName);
      if (iTunesFile) {
        if (oneDriveFileName !== `${iTunesFile.fileName}${iTunesFile.fileExtName}`) {
          if (!onlyCheck) await rm(iTunesFile.fullPath);
        }
      } else {
        logHelper.add(`Hash ${hash} not found for file ${oneDriveFile.fullPath}`, 'info');
      }
      const isITunesFileExists = await isFileExists(fileDest);
      if (!isITunesFileExists) {
        logHelper.add(`Copy ${oneDriveFile.fullPath} to ${fileDest}`, 'info');
        await mkdir(path.join(iTunesPath, oneDriveFile.relativePath), { recursive: true });
        if (!onlyCheck) await copyFile(oneDriveFile.fullPath, fileDest);
      }
      updateITunesMusicLibraryElems(iTunesMusicLibraryElems, oneDriveFile, fileDest);
    } catch (err) {
      logHelper.add(err, 'error');
    }
  }

  // Save iTunes Music Library.xml
  if (!onlyCheck) await iTunesMusicLibraryHelper.save(iTunesMusicLibraryElems);
};

main();
