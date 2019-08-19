const express = require('express')
const moment = require('moment')

const logger = require('../../common/logger').log
const serverState = require('./serverState').default
const serverStates = require('./serverState').serverStates
const onServerStart = require('./onServerStart').default

const {
  PARSING_STATUS_IN_PROGRESS,
  PARSING_STATUS_DONE,
} = require('./config').parsingStates

const {
  SERVER_PORT,
  SERVER_NAME,
  URLS_TO_PARSE_LIMIT,
} = require('./config').default

// const getFileData = require('./itemsParser').getFileData
const urlsIterator = require('./iteratorModule').default

// let readyStatus = serverStates.SERVER_STATUS_OFFLINE
let productsList = []
let productsInProgressList = []
let productsData = {}
let totalItemsToParse = 0
let requestCounter = 0

const app = express()

app.get('/server-status', (req, res) => res.send(serverState.getState()))

app.get('/urls-count', (req, res) => {
  const currServerState = serverState.getState()
  
  if (currServerState !== serverStates.SERVER_STATUS_READY) {
    res.send(currServerState)
  }
  
  const totalItemsCount = urlsIterator.getTotalItemsCount()
  const totalItemsToParseCount = urlsIterator.getToParseItemsCount()
  const itemsInProgressCount = urlsIterator.getInProgressItemsCount()

  res.send(`<h1>
    :: Items count ${totalItemsToParseCount}/${totalItemsCount} (toParse/total)
    :: Products in progress: ${itemsInProgressCount} ::
  </h1>`)

  return
})

app.get('/get-url-to-parse', async (req, res) => {
  const products = await urlsIterator.getUrlToParse()

  res.send(JSON.stringify(products))

})

app.listen(SERVER_PORT, onServerStart)
