process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const cheerio = require('cheerio')
const path = require('path')
const fs = require('fs')

function existsFile(id) {
    const zipFile = path.resolve(__dirname, `./shapes/${id}.zip`);
    return fs.existsSync(zipFile);
}

function rename(id, name) {
    const originalName = path.resolve(__dirname, `./shapes/${id}.zip`);
    const newName = path.resolve(__dirname, `./shapes/${name}.zip`);
    fs.renameSync(originalName, newName)
}

async function listCities() {
    const response = await fetch("https://www.car.gov.br/publico/municipios/downloads?sigla=MG", {
        "headers": {
            "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*;q=0.8",
            "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "sec-ch-ua": "\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "image",
            "sec-fetch-mode": "no-cors",
            "sec-fetch-site": "same-origin",
            "cookie": "PLAY_SESSION=9fe2d0ecc832e092d1bad93be1fe05297c1a17a9-___ID=cb55c032-4f47-49a1-adff-0a450c39bff8; _ga=GA1.3.1365812362.1700139515; _gid=GA1.3.674263938.1700139515; _ga_CDHDQZB9ET=GS1.3.1700139516.1.0.1700139516.0.0.0",
            "Referer": "https://www.car.gov.br/publico/municipios/downloads",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    });
    const content = await response.text();
    const $ = cheerio.load(content);
    return $('button[data-municipio][data-tipodownload="shapefile"]')
        .toArray()
        .map(element => $(element));
}

(async () => {
    const cities = await listCities();
    for (const city of cities) {
        const id = city.attr('data-municipio');
        const parent = city.closest('div.lista-municipio');
        const name = parent.attr('data-municipio');
        if (!existsFile(id)) {
            console.log(`File ${id} not exists - City ${name}`);
            continue;
        }
        rename(id, name);
        console.log(`City ${id} - ${name} renamed`);
    }
})()
