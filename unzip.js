const fs = require('fs')
const AdmZip = require('adm-zip')
const path = require('path')

function existsFile(filePath) {
    return fs.existsSync(filePath);
}

const shapePath = path.resolve(__dirname, './shapes/');

const shapeFiles = fs.readdirSync(shapePath);

shapeFiles.forEach(filename => {
    if (filename === 'extract') return;
    const zipPath = path.join(shapePath, filename);
    const cityName = path.parse(zipPath).name
    const entryName = 'AREA_IMOVEL.zip';
    const outputPath = path.join(shapePath, 'extract/');
    const outputFile = `${cityName}_${entryName}`;

    if (existsFile(path.join(outputPath, outputFile))) {
        console.log(`IGNORE - City ${cityName} already extracted`)
        return;
    }

    const zipFile = new AdmZip(zipPath);
    const entry = zipFile.getEntry(entryName);
    if (entry === null) {
        console.error(`Entry ${entryName} not found in ${filename}`);
        return;
    }
    try {
        zipFile.extractEntryTo(entryName, outputPath, false, true, false, outputFile);
        console.log(`City ${cityName} extracted with success`)
    } catch (e) {
        console.error(`City ${cityName} not extracted. Cause:`, e)
    }
})
