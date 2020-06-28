const express = require('express')
const spa = require('express-spa')
const morgan = require('morgan')
const path = require('path')
const httpProxy = require('express-http-proxy')

const app = express()
const port = process.env.PORT || 5000
const srcFolder = path.join(__dirname, 'src')

const { FORCE_HTTPS, FORCE_HOST, HTTP_LOG_LEVEL, PRERENDER_TOKEN } = process.env

// Force host?
if(FORCE_HOST) {
  app.use((req, res, next) => {
    if(req.headers.host !== FORCE_HOST) {
      res.redirect(`//${FORCE_HOST}${req.url}`)
    } else {
      next()
    }
  })
}

// Force Https?
if(FORCE_HTTPS === '1') {
  app.use((req, res, next) => {
    if(req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.headers.host}${req.url}`)
    } else {
      next()
    }
  })
}

// Logs?
if(HTTP_LOG_LEVEL) {
  app.use(morgan(HTTP_LOG_LEVEL))
}

let config = {}
try {
  config = require('./express.json')
} catch (e) {
  // no config file
}

// Prerender.io
if(PRERENDER_TOKEN) {
  app.use(require('prerender-node').set('prerenderToken', PRERENDER_TOKEN))
}

// Proxies
if(config.proxies) {
  for(const [url, proxy] of Object.entries(config.proxies)) {
    app.use(url, httpProxy(proxy.origin))
  }
}

// Redirects
if(config.redirects) {
  for(const [uri, redirect] of Object.entries(config.redirects)) {
    app.get(uri, (req, res) => {
      const { url, type = 301 } = redirect
      res.redirect(type, url)
    })
  }
}

// Runtime (look into a better way...)
app.get('/runtime.json', (req, res) => {
  const env = process.env
  const runtime = Object.entries(env).reduce((all, [prop, val]) => {
    if(prop.startsWith('RUNTIME_')) {
      all[prop] = val
    }
    return all
  }, {})
  res.json(runtime)
})

// SPA
app.use(spa(path.join(srcFolder, 'index.html')))
app.use(express.static(srcFolder))

app.listen(port)
console.log('server started ' + port)
