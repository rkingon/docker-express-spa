const puppeteer = require('puppeteer')
const path = require('path')

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

const cache = {}

module.exports = async(req, res, next) => {
  const uri = req.originalUrl
  const url = `${req.protocol}://${req.get('host')}${uri}`
  const userAgent = (req.headers['user-agent'] || '').toLowerCase()
  if(shouldPrerender({ userAgent, uri })) {
    try {
      if(!cache[uri]) {
        const browser = await puppeteer.launch({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ]
        })
        const page = await browser.newPage()
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36')
        await page.goto(url, { waitUntil: 'networkidle0' })
        cache[uri] = await page.content()
        await browser.close()
      }
      return res.send(cache[uri])
    } catch (err) {
      next()
    }
  }
  next()
}
