import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
console.log('Test Scraping');

let medicineName = 'Sertralina';
let allUrlsToFind = {
  u001: `https://www.vademecum.es/buscar?q=${medicineName}`,
  base: 'https://www.vademecum.es'
};
const urlToFind = allUrlsToFind.u001;
const fileRouteToSave = 'output/example.js';

(async () => {
  const browser = await puppeteer.launch({ headless: true }); // Con false usa interfaz
  const page = await browser.newPage();
  await page.goto(urlToFind, { waitUntil: 'networkidle2' });
  const datos = await page.evaluate(() => {
    const tablas = document.getElementsByTagName('table');
    const cuartaTabla = tablas[3];
    const filasCuerpo = cuartaTabla.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    let hrefValue = '';
    let allOk = false;
    if (filasCuerpo.length > 0) {
      const primerTR = filasCuerpo[0];
      const celdas = primerTR.getElementsByTagName('td');
      if (celdas.length >= 2) {
        const segundoTD = celdas[1];
        const enlace = segundoTD.querySelector('a');
        if (enlace) {
          let splitedValue = enlace.getAttribute('onclick').split('\'');
          hrefValue = splitedValue[1];
          allOk = true;
        }
      }
    }
    return {
      hrefValue,
      allOk
    };
  });

  await page.goto(`${allUrlsToFind.base}${datos.hrefValue}`, { waitUntil: 'networkidle2' });
  const datos2 = await page.evaluate(() => {
    const div = document.querySelector('div[itemprop="articleBody"]');
    const medicineData = div.innerText.trim().replaceAll('\n\n', '. ').replaceAll('\n', '. ');
    return {
      medicineData
    };
  });

  if (datos2) {
    fs.writeFile(fileRouteToSave, JSON.stringify(datos2), err => {
      if (err) {
        console.error('Error al guardar los datos:', err);
      } else {
        console.log('Datos guardados correctamente en datos.json');
      }
    });
  }
  await browser.close();
})();
