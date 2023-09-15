import { exec as child_process_exec } from 'node:child_process';
import { createHash } from 'node:crypto';
import { normalize } from 'node:path';
import { promisify } from 'node:util';

import { logHelper } from './logHelper.js';

const exec = promisify(child_process_exec);

/**
 * @typedef {Object} Metadata
 * @property {string} title
 * @property {string} artist
 * @property {string} album
 * @property {string} [genre]
 * @property {number} [track]
 * @property {number} date
 * @property {string} hash
 */

/**
 * @param {string} file
 * @returns {Promise<Metadata>}
 */
export const extractMetadata = async (file) => {
  try {
    const command = `ffprobe -show_entries stream_tags:format_tags -of json "${normalize(file)}"`;
    const { stdout } = await exec(command);
    const metadata = JSON.parse(stdout).format.tags;
    return {
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      genre: metadata.genre,
      track: Number(metadata.track),
      date: Number(metadata.date),
      hash: getHash(`${Number(metadata.track).toString()}_${metadata.artist}_${metadata.album}_${metadata.title}`),
    };
  } catch (err) {
    logHelper.add(err, 'error');
    return null;
  }
};

/**
 * @param {string} str
 * @returns {string}
 */
const getHash = (str) => {
  return createHash('sha1').update(str).digest('hex');
};
