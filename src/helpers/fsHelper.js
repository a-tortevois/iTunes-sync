import { stat } from 'node:fs/promises';

import { logHelper } from './logHelper.js';

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
export const isDirectory = async (path) => {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch (err) {
    logHelper.add(err, 'error');
    return false;
  }
};

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
export const isFileExists = async (path) => {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch (err) {
    logHelper.add(err, 'error');
    return false;
  }
};
