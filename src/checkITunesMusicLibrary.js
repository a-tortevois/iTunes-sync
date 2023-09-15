import path from 'node:path';

import { localhostPath } from './constants.js';
import { iTunesMusicLibraryHelper } from './helpers/iTunesMusicLibraryHelper.js';
import { logHelper } from './helpers/logHelper.js';
import { isFileExists } from './helpers/fsHelper.js';

/**
 * @typedef {import('./iTunesMusicLibraryHelper').ITunesMusicLibraryElem} ITunesMusicLibraryElem
 */

const main = async () => {
  /** @type {ITunesMusicLibraryElem[]} */
  const iTunesMusicLibraryElems = await iTunesMusicLibraryHelper.load();

  for (const [i, iTunesMusicLibraryElem] of iTunesMusicLibraryElems.entries()) {
    const filePath = iTunesMusicLibraryElem.string.find((elem) => elem.startsWith(localhostPath));
    if (filePath) {
      const pathNormalized = path.normalize(decodeURIComponent(filePath.slice(localhostPath.length)));
      const isITunesFileExists = await isFileExists(pathNormalized);
      if (!isITunesFileExists) {
        logHelper.add(`Warning: file "${pathNormalized}" does not exist`);
      }
    }
  }
};

main();
