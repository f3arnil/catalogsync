const moment = require('moment')
const fs = require('fs')
const promisify = require('util').promisify

const serverState = require('./serverState').default
const serverStates = require('./serverState').serverStates
const logger = require('../../common/logger').log
const {
    SERVER_PORT,
    SERVER_NAME,
    JSON_DATA_PATH,
    URLS_TO_PARSE_LIMIT,
  } = require('./config').default
const getUrlsList = require('./itemsParser').default
const urlsIterator = require('./iteratorModule').default

const URLS_LIST_FILENAME = '../../json-data/itemsParser/urlsToParseList.json'

module.exports.default = async () => {
  serverState.updateState(serverStates.SERVER_STATUS_LOADING)
  
  const startTime = moment()

  logger(SERVER_NAME, 'SERVER IS GOING TO LOAD ITEMS URLS LIST...')
  
  const productsData = await getUrlsList(`${JSON_DATA_PATH}`)
    .catch(
      err => {
        logger(SERVER_NAME, `ERROR: ${JSON.stringify(err)}`, true)
        return []
      }
    )
  
  logger(SERVER_NAME, '[PRODUCTS_DATA] > Data recieved...')
  
  const listLength = Object.keys(productsData).length

  if (listLength === 0) {
    logger(SERVER_NAME, '[WARNING] Incoming URLs list is empty')
  }
  
  const writeFile = promisify(fs.writeFile)
  const waitForFile = await writeFile(
    URLS_LIST_FILENAME,
    JSON.stringify(productsData)
  ).catch(err => ({ err: JSON.stringify(err), path: URLS_LIST_FILENAME }))
  
  if (waitForFile && {}.hasOwnProperty.call(waitForFile, 'err')) {
    logger(SERVER_NAME, `Write urls list to file (${waitForFile.path}) error: ${waitForFile.err}`)
  }
  
  urlsIterator.setProductsData(productsData)

  serverState.updateState(serverStates.SERVER_STATUS_READY)

  logger(SERVER_NAME, `[${moment().diff(startTime, 'minutes')} minutes] Start time was ${startTime}, finish time is ${moment()}`)
  logger(SERVER_NAME, `Starting items pages parser server on port ${SERVER_PORT}`)
  logger(SERVER_NAME, `Items to parse: ${listLength}`)
}