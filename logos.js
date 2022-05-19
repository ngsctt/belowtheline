import fs from 'fs/promises';
import sharp from 'sharp';

const partyData = await fs.readFile('./parties.json', 'utf8');
const partyEntries = JSON.parse(partyData);
const logos = {};
await Promise.all(Object.values(partyEntries).map(async ({name, abbreviation, logo}) => {
  if (logo && logo !== '') {
    const buffer = Buffer.from(logo.split(',')[1], 'base64');
    const original = sharp(buffer)
    const meta = await original.metadata();
    const alpha = await original
      .toColourspace('b-w')
      .negate()
      .extractChannel(0)
      .toFormat('raw')
      .toBuffer()
    const png = await sharp({create: {
      width: meta.width,
      height: meta.height,
      channels: 3,
      background: '#000'
    }})
      .joinChannel(alpha, {raw: {
        width: meta.width,
        height: meta.height,
        channels: 1,
        premultiplied: true
        }})
      .toFormat('png')
      .toBuffer()
    const uri = ['data:image/png;charset=utf-8;base64', png.toString('base64')].join(',');
    logo = uri;
    logos[name] = logo;
    logos[abbreviation] = logo;
    console.log(name,abbreviation);
  }
}));

fs.writeFile('./logos.json', JSON.stringify(logos), 'utf8');


// const parties = Object.fromEntries(await Promise.all(Object.entries(partyEntries).map(async ([key, value]) => {
//   if (value.logo) {
//     const buffer = Buffer.from(value.logo.split(',')[1], 'base64');
//     // const j = await Jimp.read(buffer);
//     // j.greyscale();
//     // j.write(`logos/${key}.png`);
//     const source = sharp(buffer)
//     const meta = await source.metadata();
//     const alpha = await source
//       .toColourspace('b-w')
//       .negate()
//       .extractChannel(0)
//       .toFormat('raw')
//       .toBuffer()
//     const png = await sharp({create: {
//       width: meta.width,
//       height: meta.height,
//       channels: 3,
//       background: '#000'
//     }})
//       .joinChannel(alpha, {raw: {
//         width: meta.width,
//         height: meta.height,
//         channels: 1,
//         premultiplied: true
//         }})
//       .toFormat('png')
//       .toBuffer()
//     const uri = ['data:image/png;charset=utf-8;base64', png.toString('base64')].join(',');
//     value.logo = uri;
//   }
//   return [key, value];
// })));
