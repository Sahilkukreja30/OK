const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

console.log('=== STARTING ASSET COMPRESSION & CONVERSION ===');

async function processImages() {
  // 1. Process public/images/
  const imagesDir = './public/images';
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    for (const file of files) {
      if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
        const inputPath = path.join(imagesDir, file);
        const baseName = path.parse(file).name;
        const outputPath = path.join(imagesDir, `${baseName}.webp`);
        const origSize = fs.statSync(inputPath).size;

        await sharp(inputPath)
          .webp({ quality: 82, effort: 6 })
          .toFile(outputPath);

        const newSize = fs.statSync(outputPath).size;
        console.log(`Converted ${file}: ${(origSize/1024).toFixed(1)}KB -> ${(newSize/1024).toFixed(1)}KB (saved ${((1 - newSize/origSize)*100).toFixed(0)}%)`);
      }
    }
  }

  // 2. Process public/LOGO/
  const logoDir = './public/LOGO';
  if (fs.existsSync(logoDir)) {
    const files = fs.readdirSync(logoDir);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const baseName = path.parse(file).name;
      const inputPath = path.join(logoDir, file);
      const outputPath = path.join(logoDir, `${baseName}.webp`);

      // If already webp
      if (file.endsWith('.webp')) {
        const origSize = fs.statSync(inputPath).size;
        if (origSize > 35 * 1024) {
          const buf = await sharp(inputPath)
            .webp({ quality: 80, effort: 6 })
            .toBuffer();
          fs.writeFileSync(inputPath, buf);
          const newSize = fs.statSync(inputPath).size;
          console.log(`Optimized ${file}: ${(origSize/1024).toFixed(1)}KB -> ${(newSize/1024).toFixed(1)}KB`);
        }
        continue;
      }

      if (['.png', '.jpg', '.jpeg', '.avif'].includes(ext)) {
        const origSize = fs.statSync(inputPath).size;
        await sharp(inputPath)
          .webp({ quality: 85, effort: 6 })
          .toFile(outputPath);
        const newSize = fs.statSync(outputPath).size;
        console.log(`Converted Logo ${file}: ${(origSize/1024).toFixed(1)}KB -> ${(newSize/1024).toFixed(1)}KB`);
      }
    }
  }
}

function processVideo() {
  const mp4Path = path.resolve('./public/images/TOP.mp4');
  const webmPath = path.resolve('./public/images/TOP.webm');
  const tempMp4 = path.resolve('./public/images/TOP_optimized.mp4');

  if (fs.existsSync(mp4Path)) {
    const origSize = fs.statSync(mp4Path).size;
    console.log(`Original TOP.mp4 size: ${(origSize / (1024 * 1024)).toFixed(2)} MB`);

    // 1. Convert to high efficiency WebM (VP9)
    console.log('Encoding TOP.webm (VP9)...');
    try {
      execSync(`"${ffmpegPath}" -y -i "${mp4Path}" -c:v libvpx-vp9 -b:v 0 -crf 32 -an "${webmPath}"`, { stdio: 'inherit' });
      const webmSize = fs.statSync(webmPath).size;
      console.log(`Created TOP.webm: ${(webmSize / (1024 * 1024)).toFixed(2)} MB (saved ${((1 - webmSize/origSize)*100).toFixed(0)}%)`);
    } catch (err) {
      console.error('Error generating webm:', err.message);
    }

    // 2. Optimize MP4 using H.264 with crf 26 and faststart for instant streaming
    console.log('Optimizing TOP.mp4 (H.264 faststart)...');
    try {
      execSync(`"${ffmpegPath}" -y -i "${mp4Path}" -c:v libx264 -crf 26 -preset fast -movflags +faststart -an "${tempMp4}"`, { stdio: 'inherit' });
      const optMp4Size = fs.statSync(tempMp4).size;
      fs.copyFileSync(tempMp4, mp4Path);
      fs.unlinkSync(tempMp4);
      console.log(`Optimized TOP.mp4: ${(optMp4Size / (1024 * 1024)).toFixed(2)} MB (saved ${((1 - optMp4Size/origSize)*100).toFixed(0)}%)`);
    } catch (err) {
      console.error('Error optimizing mp4:', err.message);
    }
  }
}

async function main() {
  await processImages();
  processVideo();
  console.log('=== ASSET OPTIMIZATION COMPLETE ===');
}

main().catch(console.error);
