const express = require('express')
const parseCategories = require('../src/categorie-pages/index').default

const SERVER_PORT = 3001

const app = express()

app.get('/parse-pages', parseCategories)

app.listen(SERVER_PORT, () => {
    console.log(`Starting categories pages parser server on port ${SERVER_PORT}`)
})
