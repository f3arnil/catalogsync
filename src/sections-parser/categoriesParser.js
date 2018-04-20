var cheerio = require('cheerio')
var request = require('request')
var urlParser = require('url')

const CATEGORIE_SEARCH_URL = 'https://catalog.api.onliner.by/search'
const ITEMS_PER_PAGE = 30

const getCoffee = (timeout) => {
    const secTimeOut = timeout * 1000
    console.log(`Pause ${timeout} seconds..`)
    return new Promise((resolve) => {
        setTimeout(() => resolve('☕'), secTimeOut)
    })
  }

const asyncTest = async (req, res) => {
    const array = [1, 2, 3, 4, 5]
    for (let i = 0; i < array.length;) {
        const timeout = array[i] * 2
        console.log(`[${i}] Waiting ${timeout} sec...`)
        const coffee = await getCoffee(timeout).catch((err) => {
            console.log(`[${i}] Will wait 10 seconds more..`)
            return  new Promise(
                resolve => setTimeout(() => resolve('Oops'), 10000)
            )
        })
        console.log(coffee)
        const pagesCount = await getPagesCount('memcards')
        console.log('PagesCount:', pagesCount)
        array[i] = coffee
        i += 1
    }

    console.log('Done')
    res.send(
        `<div>${array.join(' ')}</div>`
    )
}

const getPagesCount = (categorie, index, dataLength) => {
    return new Promise(
        (resolve, reject) => {
            console.log(`[${index}/${dataLength}][${categorie}] Going to do async action`)
            const url = `${CATEGORIE_SEARCH_URL}/${categorie}`
            const options = {
                url,
                method: 'GET',
                json: true,
                timeout: 3000,
                headers: [{
                    'User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.${dataLength - index} Safari/537.3${index}`,
                }]
            }

            request(options, (error, response, body) => {
                if (error) {
                    console.error(JSON.stringify(error))
                    reject(error)
                    return
                }
                console.log(`[${index}/${dataLength}][${categorie}] Data recieved..`)
                // console.log('!=>', body.total, body.total_ungrouped)
                const total = body.total
                const total_ungrouped = body.total_ungrouped
                if (total === undefined) {
                    console.log('\n===== ERROR =====\n', JSON.stringify(body), '\n===== ERROR =====\n')
                }
                if (total !== total_ungrouped) {
                    console.log(`${categorie} data not equal: ${total}-${total_ungrouped}`)
                }
                const result = !total ? { error: body } : Math.ceil(total / ITEMS_PER_PAGE)
                resolve(result)
            })
        }
    )
}

const mapPagesCount = (dataArray) => {
    return new Promise(
        async (resolve, reject) => {
            let newDataArray = []
            const dataLength = dataArray.length - 1
            console.log(`Total items to request: ${dataLength}`)
            let counter = 0
            for (let index = 0; index < dataArray.length;) {
                let dataItem = dataArray[index]
                let awaitTimeoutSec = 0.1
                
                if (index < 1500) {
                    // awaitTimeoutSec = 2
                    const pagesCount = await getPagesCount(
                        dataItem.id,
                        index,
                        dataLength
                    )
                    // .catch(() => {
                    //     awaitTimeoutSec = 60
                    //     index -= 1
                    //     return Promise.reject('error')
                    // })

                    if (typeof pagesCount !== 'object') {
                        console.log(`[${index}/${dataLength}][${dataItem.id}] Pages count is: ${pagesCount}`)
                        dataItem = {
                            ...dataItem,
                            pagesCount,
                        }
                    } else {
                        index -= 1
                        awaitTimeoutSec = 60
                    }
                }
                
                // if (dataItem.isVirtual === true) {
                //     console.log(`Skip virtual item: ${dataItem.id}`)
                //     awaitTimeoutSec = 0
                // }
                // console.log(JSON.stringify(dataItem))
                newDataArray.push(dataItem)
                index += 1
                counter += 1
                if (counter >= 10) {
                    counter = awaitTimeoutSec === 60
                        ? counter - 1
                        : 0
                    
                    awaitTimeoutSec = awaitTimeoutSec === 60
                        ? awaitTimeoutSec
                        : 3
                    
                }
                const coffee = await getCoffee(awaitTimeoutSec)
                console.log(coffee)
            }

            resolve(newDataArray)
        }
    )
}

const parseCategoriesData = (item, body) => {
    const $ = cheerio.load(body)
    const dataId = item.dataId
    const subMenuBlock = $(`.catalog-navigation-list .catalog-navigation-list__category[data-id=${dataId}]`)
    const subSectionsList = $(subMenuBlock)
        .find('.catalog-navigation-list__aside-item')
        .map(
            (i, el) => {
                const title = $(el).find('.catalog-navigation-list__aside-title').text().trim()
                const categorieItems = $(el)
                    .find('.catalog-navigation-list__dropdown .catalog-navigation-list__dropdown-item')
                    .map(
                        (i, elem) => {
                            const url = $(elem).attr('href')
                            const parsedUrl = urlParser.parse(url)
                            const isVirtual = parsedUrl.query !== null

                            const name = $(elem).find('.catalog-navigation-list__dropdown-title').text().trim()
                            
                            const imageUrl = $(elem)
                                .find('.catalog-navigation-list__dropdown-image')
                                .css('background-image')
                            const itemsCount = $(elem)
                                .find('.catalog-navigation-list__dropdown-description')
                                .text()
                                .trim()
                                .substr(0,10)
                                .trim()
                                .replace(',', '')

                            return {
                                sectionName: item.data,
                                sectionId: item.dataId,
                                subSectionName: title,
                                categorieName: name,
                                id: parsedUrl.pathname.slice(1),
                                url,
                                imageUrl,
                                itemsCount: parseInt(itemsCount),
                                isVirtual,
                            }
                        }
                    )
                    .get()
                
                return categorieItems
            }
        )
        .get()
    
    const parsedSections = [].concat(...subSectionsList)

    return parsedSections
}

const getSectionsList = (body) => {
    const $ = cheerio.load(body)

    const catalogTitle = $('.catalog-navigation__title').text()
    if (catalogTitle !== 'Каталог') {
        console.log('Sections not getted!')
        return false
    }
    const sectionsList = $('.catalog-navigation-classifier__item').map(
        (i, el) => {
            const dataId = $(el).attr('data-id')
            const data = $(el).find('.catalog-navigation-classifier__item-title-wrapper').text()
            return {
                data,
                dataId,
            }
        }
    ).get()

    return sectionsList
}

module.exports.parseCategoriesData = parseCategoriesData
module.exports.getSectionsList = getSectionsList
module.exports.mapPagesCount = mapPagesCount
module.exports.getPagesCount = getPagesCount
module.exports.asyncTest = asyncTest
