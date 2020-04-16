const puppeteer = require('puppeteer-extra')
const request = require('request')
const cheerio = require('cheerio')

const GET_NICE_TEXT_JS = function() {
  var s = window.getSelection()
  s.removeAllRanges()
  var r = document.createRange()
  r.selectNode(document.body)
  s.addRange(r)
  return s.toString()
}

const re = /([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})(\s+|:)([0-9]{2,5})/g
const proxies2 = async cb => {
  ///return cb([])
  let ip_addresses = []
  let port_numbers = []
  request('https://sslproxies.org/', function(error, response, html) {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html)

      $('td:nth-child(1)').each(function(index, value) {
        ip_addresses[index] = $(this).text()
      })

      $('td:nth-child(2)').each(function(index, value) {
        port_numbers[index] = $(this).text()
      })
    } else {
      console.log('Error loading proxy, please try again', html)
    }

    ip_addresses.join(', ')
    port_numbers.join(', ')

    console.log(
      ip_addresses.map(
        (item, idx) => ip_addresses[idx] + ':' + port_numbers[idx],
      ),
    )
    cb(
      ip_addresses.map(
        (item, idx) => ip_addresses[idx] + ':' + port_numbers[idx],
      ),
    )
  })
}
/*
    const args = [
        '--window-size=1920,1080',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
    ];

    const options = {
        args,
        headless: true,
        ignoreHTTPSErrors: true,
        userDataDir: './tmp',
        executablePath: '/usr/bin/brave-browser'
    };

    const StealthPlugin = require('puppeteer-extra-plugin-stealth')
    puppeteer.use(StealthPlugin())
    const browser = await puppeteer.launch(options);
    
    const page = await browser.newPage();
    await page.goto('https://www.proxy-list.download/SOCKS5');

    const result = await page.evaluate(GET_NICE_TEXT_JS);
    console.log(result);
    cb(result.match(re) || []);
};
*/

const proxies = cb => {
  request('http://jimmythehack3r.com/proxies/country/US', function(
    error,
    response,
    html,
  ) {
    let res = JSON.parse(html)
    cb(res.map(p => `${p.type}://${p.address}:${p.port}`))
  })
}
module.exports = proxies
