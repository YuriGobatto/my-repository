process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

// Alterado arquivo

const path = require('path');
const fs = require('fs')
const cheerio = require('cheerio')
const { createWorker } = require('tesseract.js');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function alreadyDownloaded(id) {
    const zipFile = path.resolve(__dirname, `./shapes/${id}.zip`);
    return fs.existsSync(zipFile);
}

async function writeFile(path, buffer) {
    return new Promise(resolve => {
        const stream = fs.createWriteStream(path);
        stream.write(buffer, () => resolve());
        stream.close();
    });
}

async function getRecaptcha () {
    const captchaUrl = 'https://www.car.gov.br/publico/municipios/captcha?id=' + parseInt(Math.random() * 1000000);
    const response = await fetch(captchaUrl, {
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
    const imageBlob = await response.blob();
    let buffer = await imageBlob.arrayBuffer()
    buffer = Buffer.from(buffer)
    const captchaFile = path.resolve(__dirname, './captcha.png')
    await writeFile(captchaFile, buffer)

    const worker = await createWorker('eng', 1)
    const { data: { text } } = await worker.recognize(captchaFile);
    await worker.terminate();
    return text;
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
        .map(element => $(element).attr('data-municipio'));
}

async function downloadShape(id) {
    for (let attempts = 0; attempts < 10; attempts++) {
        const captcha = await getRecaptcha()
        console.log('Captcha', attempts, captcha)
        const response = await fetch(`https://www.car.gov.br/publico/municipios/shapefile?municipio%5Bid%5D=${id}&email=test%40gmail.com&captcha=${captcha}`, {
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "sec-ch-ua": "\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "iframe",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "same-origin",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "cookie": "PLAY_SESSION=9fe2d0ecc832e092d1bad93be1fe05297c1a17a9-___ID=cb55c032-4f47-49a1-adff-0a450c39bff8; _ga=GA1.3.1365812362.1700139515; _gid=GA1.3.674263938.1700139515; _ga_CDHDQZB9ET=GS1.3.1700139516.1.0.1700139516.0.0.0",
                "Referer": "https://www.car.gov.br/publico/municipios/downloads?sigla=MG",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": null,
            "method": "GET"
        });
        if (response.status !== 200) {
            await sleep(1000);
            continue;
        }
        const zipBlob = await response.blob();
        let buffer = await zipBlob.arrayBuffer();
        buffer = Buffer.from(buffer);
        const zipFile = path.resolve(__dirname, `./shapes/${id}.zip`);
        await writeFile(zipFile, buffer);
        return fs.existsSync(zipFile);
    }
    return false;
}

(async () => {
    const cities = await listCities();
    for (const city of cities) {
        if (alreadyDownloaded(city)) {
            console.log(`City ${city} already downloaded`)
            continue;
        }
        const success = await downloadShape(city);
        console.log(`Downloading city ${city}`)
        if (success) {
            console.log(`City ${city} downloaded with success`)
        } else {
            console.error(`City ${city} not downloaded`)
        }
        await sleep(1000);
    }
})()
