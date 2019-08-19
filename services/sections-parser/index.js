var express = require('express')
var getSectionsData = require('./categoriesListParser').default
var asyncTest = require('./categoriesParser').asyncTest
var app = express()


const SERVER_PORT = 3000

app.use('/json-data', express.static('../json-data'))

app.get('/', (req, res) => {
    res.send('Hello World!s')
})

app.get('/catalog-sections', getSectionsData)
app.get('/categories-pages-counter', getSectionsData)
app.get('/async-await', asyncTest)

app.listen(SERVER_PORT, () => {
    console.log(`Starting categories list parser server on port ${SERVER_PORT}`)
})