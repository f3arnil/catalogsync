var cheerio = require('cheerio')
var request = require('request')
var urlParser = require('url')

const CATEGORIE_SEARCH_URL = 'https://catalog.api.onliner.by/search'

const getCoffee = (timeout) => {
    const secTimeOut = timeout * 1000
    console.log(`Pause ${timeout} seconds..`)
    return new Promise((resolve, reject) => {
        setTimeout(() => reject(false/*'☕'*/), secTimeOut)
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

const getPagesCount = (categorie) => {
    return new Promise(
        (resolve, reject) => {
            const url = `${CATEGORIE_SEARCH_URL}/${categorie}`
            const options = {
                url,
                method: 'GET',
                json: true,
            }
            console.log(`Ok, lets do it! URL: ${categorie}`)
            request(options, (error, response, body) => {
                console.log(`${categorie} data recieved..`)
                if (error) {
                    console.error(JSON.stringify(error))
                    reject(false)
                    return
                }
                // console.log('!=>', body.total, body.total_ungrouped)
                const total = body.total
                const total_ungrouped = body.total_ungrouped

                if (total !== total_ungrouped) {
                    console.log(`${categorie} data not equal: ${total}-${total_ungrouped}`)
                }
                resolve(body.total)
            })
        }
    )
}

const mapPagesCount = (dataArray) => {
    return new Promise(
        async (resolve, reject) => {
            let newDataArray = []
            console.log(`Total items to request ~ ${dataArray.length - 1}`)
            for (let index = 0; index < dataArray.length;) {
                let dataItem = dataArray[index]
                let awaitTimeoutSec = 0

                if (index < 5 && dataItem.isVirtual !== true) {
                    awaitTimeoutSec = 2
                    console.log(`Going to do async action ${index}/${dataArray.length - 1}`)
                    const pagesCount = await getPagesCount(dataItem.id)
                    console.log(`Pages count is: ${pagesCount}`)
                    dataItem = {
                        ...dataItem,
                        pagesCount,
                    }
                }
                
                if (dataItem.isVirtual === true) {
                    console.log(`Skip virtual item: ${dataItem.id}`)
                    awaitTimeoutSec = 0
                }
                const coffee = await getCoffee(awaitTimeoutSec)
                console.log(coffee)
                // console.log(JSON.stringify(dataItem))
                newDataArray.push(dataItem)
                index += 1
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
