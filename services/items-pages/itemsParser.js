const fs = require('await-fs')
const moment = require('moment')

const getCoffee = require('../../common/getCoffee').getCoffee
const logger = require('../../common/logger').log
const {
  PARSING_STATUS_NOT_REQUESTED,
  PARSING_STATUS_IN_PROGRESS,
  PARSING_STATUS_DONE,
} = require('./config').parsingStates

const { SERVER_NAME, URLS_TO_PARSE_LIMIT } = require('./config').default

const isJSONFile = jsFilename => {
  var regexJsonFile = new RegExp(".json$", "i");
  return regexJsonFile.test(jsFilename);
}

const buildFilesList = jsonPath => new Promise(
  async (resolve, reject) => {
    const filesList = await fs.readdir(jsonPath).catch(
      (err) => {
        return {
          error: JSON.stringify(err),
        }
      }
    )

    if ({}.hasOwnProperty.call(filesList, 'error')) {
      console.error(err)
      reject(filesList.error)
    }
    
    const filteredList = filesList
      .filter(isJSONFile)
      .map((item, id) => ({
        id,
        status: PARSING_STATUS_IDLE,
        filename: item,
        deadline: null,
      }))
  
      resolve(filteredList)  
  } 
)

const getUrlsList = jsonPath => new Promise(
  async (resolve, reject) => {
    const filesList = await fs.readdir(jsonPath).catch(
      (err) => {
        return {
            error: err,
        }
      }
    )

    if ({}.hasOwnProperty.call(filesList, 'error')) {
      reject(filesList.error)
    }
    
    const filteredList = filesList.filter(item => isJSONFile(item))
    const getFileDataFromPath = getFileData(jsonPath)
    const promisesList = filteredList.map(getFileDataFromPath)
    const resultArray = await Promise.all(promisesList)

    logger(
      SERVER_NAME,
      `[...DONE...] Total items to parse: ${resultArray.length}. Now going to prepare data Object...`,
      true
    )
    
    await getCoffee(5)
    
    const result = Object.assign(
      {},
      ...resultArray
    )

    resolve(result)
  }
)

const getFileData = path => (fileName, id = '---') => new Promise(
  async (resolve, reject) => {
    const urlsList = {}
    const fileUrl = `${path}${fileName}`
    const fileData = await fs.readFile(fileUrl, 'utf-8')
      .catch(
          (error) => {
              console.log(`[${id}][${fileName}] Reading error....\n`, error)
              return { error }
          }
      )

    if ({}.hasOwnProperty.call(fileData, 'error')) {
        reject(fileData.error)
    }

    const jsonData = JSON.parse(fileData)

    jsonData.categoriesData.map(
        (item, ind) => {
            // console.log(`[${id}][LOADING][${ind}/${jsonData.categoriesData.length - 1}][${fileName}]${item.html_url}`)
            urlsList[item.key] = {
              id: item.id,
              key: item.key,
              url: item.html_url,
              status: PARSING_STATUS_NOT_REQUESTED,
              deadline: null,
            }
            
            if (item.children.length > 0) {
                item.children.map(
                    (child, index) => {
                        // console.log(`=> => => [${id}][LOADING][${ind}/${jsonData.categoriesData.length - 1}][${index}//${item.children.length - 1}][${fileName}]${child.html_url}`)
                        urlsList[child.key] = {
                          id: child.id,
                          key: child.key,
                          url: child.html_url,
                          status: PARSING_STATUS_NOT_REQUESTED,
                          deadline: null,
                        }
                    }
                )
            }
        }
    )
    
    logger(
      SERVER_NAME,
      `[${id}][DONE...] => => =>  \'${fileName.toUpperCase()}`
    )

    resolve(urlsList)
})

const giveUrl = res => {
  // const requestNumber = requestCounter
  requestCounter += 1
  // console.log(`[${requestNumber}/${requestCounter}] `, 'REQUEST REGISTERED')
  const now = moment()
  let counter = 0
  const products = []
  if (productsList.length === 0) {
    console.log('NO MORE PRODUCTS!!! Will check for outdated')
    const outdated = productsInProgressList.filter(item => !!item.deadline && moment(now).isAfter(item.deadline))
    if (outdated.length > 0) {
      productsList.push(...outdated)
    }
  }
  // console.log('Lets found some items to parse!')
  for (let i = 0; (counter < URLS_TO_PARSE_LIMIT && i < productsList.length); i++) {
    const product = productsData[productsList[i]]
    // console.log(`:${i}:${productsList[i]}:${product.key}:${product.status}`)
    const isInProgress = product.status === PARSING_STATUS_IN_PROGRESS
    const isDone = product.status === PARSING_STATUS_DONE
    const isDeadlineNotFailed = !!product.deadline && moment(now).isBefore(product.deadline)

    if (isDone || (isInProgress && isDeadlineNotFailed)) continue;
    // console.log(`Founded! ${product.key}`)
    product.status = PARSING_STATUS_IN_PROGRESS
    product.deadline = moment(now).add(20, 'm')
    // console.log(`[${requestNumber}]`, productsData[productsList[i]].key, productsData[productsList[i]].status, productsData[productsList[i]].deadline)
    counter +=1
    products.push(product)
    productsInProgressList.push(productsList.shift())
    
  }
  // console.log(`Result: ${products.length}`)
  // console.log(`[${requestNumber}/${requestCounter}] `, 'RESPONSE WILL BE PROVIDED')
  totalItemsToParse = totalItemsToParse - URLS_TO_PARSE_LIMIT
  res.send(JSON.stringify(products))
}

module.exports.default = getUrlsList
module.exports.buildFilesList = buildFilesList
module.exports.getFileData = getFileData