const puppeteer = require('puppeteer')
const path = require('path')
const cheerio = require('cheerio')

const CACHE = {}

function shouldPrerender ({ userAgent, uri }) {
  if(path.extname(uri)) {
    return false
  }
  if(userAgent.includes('lighthouse')) {
    return true
  }
  if(userAgent.includes('mozilla')) {
    return false
  }
  return true
}

function parseHTML (html) {
  const $ = cheerio.load(html)
  $('script').remove()
  return $.html()
}

module.exports = async(req, res, next) => {
  const uri = req.originalUrl
  const url = `${req.protocol}://${req.get('host')}${uri}`
  const userAgent = (req.headers['user-agent'] || '').toLowerCase()
  const cacheKey = userAgent.includes('mobi') ? 'mobile' : 'desktop'
  if(shouldPrerender({ userAgent, uri })) {
    try {
      if(!CACHE[uri]) {
        const cache = {}
        const browser = await puppeteer.launch({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ]
        })
        const page = await browser.newPage()
        await page.setViewport({
          width: 1200,
          height: 800
        })
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36')
        await page.goto(url, { waitUntil: 'networkidle0' })
        let content = await page.content()
        cache.desktop = parseHTML(content)
        await page.setViewport({
          width: 320,
          height: 568,
          isMobile: true
        })
        await page.goto(url, { waitUntil: 'networkidle0' })
        content = await page.content()
        cache.mobile = parseHTML(content)
        CACHE[uri] = cache
        await browser.close()
      }
      const html = CACHE[uri][cacheKey]
      return res.send(html)
    } catch (err) {
      console.log(err)
      next()
    }
  }
  next()
}
