import fs from 'fs/promises';
import pth from 'path';
import Papa from 'papaparse';
import { renderFile } from 'ejs';
// import Jimp from 'jimp';
import sharp from 'sharp';
// import { renderFile } from 'pug';

async function parseCSV (path, { encoding = 'utf8', ...options }) {
  const contents = await fs.readFile(path, encoding);
  const parsed = Papa.parse(contents, options);
  return parsed.data;
}
const senateCandidates = await parseCSV('./senate.csv', {
  header: true,
  skipEmptyLines: true,
  fastMode: false
});
const senate = new Map();
senateCandidates.forEach(candidate => {
  if (! senate.has(candidate.state)) senate.set(candidate.state, new Map());
  const state = senate.get(candidate.state);
  if (! state.has(candidate.column)) state.set(candidate.column, {
    name: candidate.groupName,
    candidates: new Map()
  });
  const column = state.get(candidate.column);
  // console.log(candidate);
  column.candidates.set(candidate.ballotPosition, candidate);
});

const houseCandidates = await parseCSV('./house.csv', {
  header: true,
  skipEmptyLines: true,
  fastMode: false
});
const house = new Map();
houseCandidates.forEach(candidate => {
  if (! house.has(candidate.division)) house.set(candidate.division, {
    state: candidate.state,
    candidates: new Map()
  });
  const division = house.get(candidate.division);
  division.candidates.set(candidate.ballotPosition, candidate);
});

async function getLogosFile(path, retry = true) {
  try {
    return JSON.parse(await fs.readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && retry) {
      await import('./logos.js');
      return await getLogosFile(path, false);
    } else throw error;
  }
}

const logos = await getLogosFile('./logos.json');

const locals = { senate, house, logos };
const output = await renderFile('./cth-2022.ejs', locals);
// const output = renderFile('./cth-2022.pug', locals);
await fs.writeFile('public/index.html', output);