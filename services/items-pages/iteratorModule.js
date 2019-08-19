const moment = require('moment')
const lodash = require('lodash')

const {
  SERVER_NAME,
  URLS_TO_PARSE_LIMIT,
  PARSING_DEADLINE_TIMEOUT_VALUE,
  PARSING_DEADLINE_TIMEOUT_MEASURE,
} = require('./config').default

const {
  PARSING_STATUS_NOT_REQUESTED,
  PARSING_STATUS_IN_PROGRESS,
  PARSING_STATUS_DONE,
} = require('./config').parsingStates

const logger = require('../../common/logger').log

const getCoffee = require('../../common/getCoffee').getCoffee

class UrlsIterator {
  constructor() {
    let productsToParseList = []
    let productsInProgressList = []
    let productsData = {}
    let checkingProgressList = false

    this.setProductsToParseList = list =>
      productsToParseList = lodash.chunk(
        list, URLS_TO_PARSE_LIMIT
      )
    
    this.addProductsToParseList = list => {
      const chunkedList = lodash.chunk(list, URLS_TO_PARSE_LIMIT)

      productsToParseList = [...productsToParseList, ...chunkedList]
    }
       
    this.setProductsData = data => {
      productsData = data
      this.setProductsToParseList(Object.keys(data))
    }

    this.getProductsToParseList = () => [...productsToParseList]
    
    this.getProductsInProgressList = () => [...productsInProgressList]
    
    this.getProductsData = () => Object.assign(
      {},
      ...productsData
    )

    this.getTotalItemsCount = () => Object.keys(productsData).length
    
    this.getToParseItemsCount = () => {
      const arr = lodash.concat([], ...productsToParseList)
      return arr.length
    }
    
    this.getInProgressItemsCount = () => productsInProgressList.length

    this.getUrlToParse = async () => {
      let products = []
      
      let counter = 0
      
      await getCoffee(10)
      await this.checkInProgressList()
      
      // logger(SERVER_NAME, `Going to find ${URLS_TO_PARSE_LIMIT} urls to parse`)
      logger(SERVER_NAME, `Products to parse list length is ${productsToParseList.length}`)
      
      for (let i = 0; (i < productsToParseList.length); i++) {
        // logger(SERVER_NAME, `Will do iteration #${i}, counter #${counter}`)
        if (counter >= URLS_TO_PARSE_LIMIT) {
          logger(
            SERVER_NAME,
            `EXIT FROM FOR LOOP. #${products.length} products found`
          )
          break
        }
        
        const chunk = [...productsToParseList[i]]
        
        const length = chunk.length
        const limit = URLS_TO_PARSE_LIMIT - counter
        
        logger(SERVER_NAME, `CHUNK length #${length}, current limit is #${limit}`)
        
        const { chunk: parsedChunk, products: productsFromChunk } = this.getProductsFromChunk(chunk, limit)
        logger(SERVER_NAME, `Initial chunk length #${length}, returned chunk length #${parsedChunk.length}`)
        
        products = [...products, ...productsFromChunk]
        counter += productsFromChunk.length

        parsedChunk.length > 0
          ? productsToParseList.splice(i, 1, parsedChunk)
          : productsToParseList.splice(i, 1)

        // if (parsedChunk.length > 0) {
          
        // }
        
      }
      logger(SERVER_NAME, `#${products.length} URLs to parse have found`)
      return products
    }

    this.getProductsFromChunk = (chunk = [], limit = 0) => {
      const now = moment()
      const products = []

      for (let i = 0; (i < chunk.length); ) {
        if (i >= limit) break

        const productId = chunk[i]
        const product = { ...productsData[productId] }

        const isDone = product.status === PARSING_STATUS_DONE
        const isInProgress = product.status === PARSING_STATUS_IN_PROGRESS
        
        if (!isDone && !isInProgress) {
          product.status = PARSING_STATUS_IN_PROGRESS
          product.deadline = moment(now).add(
            PARSING_DEADLINE_TIMEOUT_VALUE,
            PARSING_DEADLINE_TIMEOUT_MEASURE  
          )
          products.push(product)
          productsInProgressList.push(productId)
          productsData[productId] = product
        }
        
        chunk.splice(i, 1)
      }

      return { chunk, products }
    }

    this.checkInProgressList = setImmediate(async () => {
      logger(SERVER_NAME, `>>>>> ${checkingProgressList ? '' : 'DONT'} HAVE TO WAIT\n`)
      
      while (checkingProgressList) {
        logger(SERVER_NAME, 'HAVE TO WAIT A BIT!\n\n\n')
        await getCoffee(1)
      }
      
      if (productsToParseList.length !== 0) {
        logger(SERVER_NAME, `<<<< NO NEED TO RECHECK IN PROGRESS LIST`)
        return
      }

      checkingProgressList = true

      logger(SERVER_NAME, `Will recheck \'In Progress\' list. Currently there are #${productsInProgressList.length} items`)
      
      const now = moment()
      const revertList = []
      const cuttedList = lodash.slice(productsInProgressList, 0, URLS_TO_PARSE_LIMIT)

      for (let i = 0; i < cuttedList.length;) {
        if (revertList.length >= URLS_TO_PARSE_LIMIT * 3) break;
        const productId = cuttedList[i]

        const product = { ...productsData[productId] }
        
        const isInProgress = !!product.status && product.status === PARSING_STATUS_IN_PROGRESS
        const isDeadlineNotFailed = !!product.deadline && moment(now).isBefore(product.deadline)
        
        if (!isInProgress) {
          cuttedList.splice(i, 1)
          
          continue
        }

        if (!isDeadlineNotFailed) {
          product.deadline = null
          product.status = PARSING_STATUS_NOT_REQUESTED

          productsData[productId] = product
          revertList.push(productId)
          cuttedList.splice(i, 1)

          continue
        }

        i++
      }


      // productsInProgressList.filter((productId, index) => {
        
      //   if (
      //     isDeadlineNotFailed
      //     || !isInProgress
      //     || counter > URLS_TO_PARSE_LIMIT
      //   ) {
      //     logger(SERVER_NAME, `Item [${index}/${total}] - #${productId} is GOOD or out of one restore operation limit`)
      //     rest.push(productId)
          
      //     return true
      //   }
        
      //   logger(SERVER_NAME, `Item [${index}/${total}] - #${productId} will be restored`)
        
      //   product.deadline = null
      //   product.status = PARSING_STATUS_NOT_REQUESTED
      //   productsData[productId] = product
      //   counter++

      //   return false
      // })

      productsInProgressList = [
        ...cuttedList,
        ...lodash.slice(
          productsInProgressList,
          URLS_TO_PARSE_LIMIT,
          productsInProgressList.length)
        ]
      
      this.addProductsToParseList(revertList)
      
      logger(SERVER_NAME, `Total items restored: #${revertList.length}`)
      
      checkingProgressList = false
    })
  }
}

const urlsIterator = new UrlsIterator()

module.exports.default = urlsIterator


/*
this.getUrlToParse = () => {
      const now = moment()
      const products = []
      
      let counter = 0
      
      if (productsToParseList.length === 0) {
        this.checkInProgressList()
      }
      
      // logger(SERVER_NAME, `Going to find ${URLS_TO_PARSE_LIMIT} urls to parse`)
      logger(SERVER_NAME, `Products to parse list length is ${productsToParseList.length}`)
      
      for (let i = 0; (i < productsToParseList.length); ) {
        // logger(SERVER_NAME, `Will do iteration #${i}, counter #${counter}`)
        if (counter === URLS_TO_PARSE_LIMIT) {
          // logger(
          //   SERVER_NAME,
          //   `EXIT FROM FOR LOOP. #${products.length} products found`
          // )
          break;
        }

        const productId = productsToParseList[i]
        const product = { ...productsData[productId] }

        if (!product) {
          const errorTestList = [...productsToParseList]
          errorTestList.splice(0, i - 1)
          // logger(SERVER_NAME, `ERROR: #${i} iteration returns product = ${product}\n Products list now is \'${errorTestList}\' :: ${errorTestList.length} :: ${productsToParseList.length}`)
          break;
        }

        const isDone = product.status === PARSING_STATUS_DONE
        const isInProgress = product.status === PARSING_STATUS_IN_PROGRESS
        
        if (isDone || isInProgress) {
          // logger(SERVER_NAME, `SKIP: Current product ${productId}`)
          i++
          continue;
        }

        product.status = PARSING_STATUS_IN_PROGRESS
        product.deadline = moment(now).add(
          PARSING_DEADLINE_TIMEOUT_VALUE,
          PARSING_DEADLINE_TIMEOUT_MEASURE
        )
        
        productsData[productId] = product
        
        products.push(product)
        productsInProgressList.push(productId)
        
        counter +=1
        productsToParseList.splice(i, 1)
      }
      // logger(SERVER_NAME, `#${products.length} URLs to parse have found`)
      return products
    }
    */
   