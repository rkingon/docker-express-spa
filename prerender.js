const puppeteer = require('puppeteer')
const path = require('path')

function shouldPrerender ({ userAgent, uri }) {
  return (!userAgent.toLowerCase().includes('mozilla') && !path.extname(uri))
}

const cache = {}

module.exports = async(req, res, next) => {
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  const userAgent = req.headers['user-agent']
  if(shouldPrerender({ userAgent, uri: req.originalUrl })) {
    if(!cache[url]) {
      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ]
      })
      const page = await browser.newPage()
      await page.goto(url, { waitUntil: 'networkidle0' })
      cache[url] = await page.content()
      await browser.close()
    }
    return res.send(cache[url])
  }
  next()
}
