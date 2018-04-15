var express = require('express')
var getSectionsData = require('./src/sections-parser/index')
var app = express()
const SERVER_PORT = 3000

app.use('/json-data', express.static('json-data'))

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/catalog-sections', getSectionsData)

app.listen(SERVER_PORT, () => {
    console.log(`Starting server on port ${SERVER_PORT}`)
})