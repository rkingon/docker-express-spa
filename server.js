const express = require('express')
const spa = require('express-spa')
const morgan = require('morgan')
const path = require('path')

const app = express()
const port = process.env.PORT || 5000
const srcFolder = path.join(__dirname, 'src')

const { FORCE_HTTPS, FORCE_HOST, HTTP_LOG_LEVEL } = process.env

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

app.use(spa(path.join(srcFolder, 'index.html')))
app.use(express.static(srcFolder))

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

app.listen(port)
console.log('server started ' + port)
