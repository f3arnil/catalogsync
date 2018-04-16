var request = require('request')
var cheerio = require('cheerio')
var urlParser = require('url')
var fs = require('fs')

const SECTIONS_LIST_URL = 'https://catalog.onliner.by'

let totalItemsCount = 0
const urlToParseList = []
const excludedUrlToParseList = []

const getSubCategoriesData = (item, body) => {
    const $ = cheerio.load(body)
    const dataId = item.dataId
    const subMenuBlock = $(`.catalog-navigation-list .catalog-navigation-list__category[data-id=${dataId}]`)
    const subSectionsList = $(subMenuBlock)
        .find('.catalog-navigation-list__aside-item')
        .map(
            (i, el) => {
                const title = $(el).find('.catalog-navigation-list__aside-title').text().trim()
                console.log('Title:', title)
                const subSectionItems = $(el)
                    .find('.catalog-navigation-list__dropdown .catalog-navigation-list__dropdown-item')
                    .map(
                        (i, elem) => {
                            const url = $(elem).attr('href')
                            const parsedUrl = urlParser.parse(url)
                            console.log('!=>>', parsedUrl.pathname)
                            const isVirtual = parsedUrl.query !== null

                            if (isVirtual) {
                                console.log('>>>>>QUERY EXIST<<<<<<', parsedUrl.query)
                                excludedUrlToParseList.push(url)
                            } else {
                                urlToParseList.push(url)
                            }

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

                            totalItemsCount += parseInt(itemsCount)

                            return {
                                displayName: name,
                                name: parsedUrl.pathname.slice(1),
                                url,
                                imageUrl,
                                itemsCount,
                                isVirtual,
                            }
                        }
                    )
                    .get()
                // console.log(subSectionItems)
                return {
                    title,
                    items: subSectionItems,
                }
            }
        )
        .get()
    return Object.assign(
        {},
        item,
        { subSectionsList }
    )
}

const getMainCategoriesList = (body) => {
    const $ = cheerio.load(body)

    const catalogTitle = $('.catalog-navigation__title').text()
    if (catalogTitle !== 'Каталог') {
        console.log('Sections not getted!')
        return false
    }
    const sectionsList = $('.catalog-navigation-classifier__item').map(
        (i, el) => {
            // console.log('1', el)
            const dataId = $(el).attr('data-id')
            const data = $(el).find('.catalog-navigation-classifier__item-title-wrapper').text()
            return {
                data,
                dataId
            }
        }
    ).get()

    return sectionsList
}

const getCategoriesData = (req, res) => {
    console.log('Start getting catalog categories!')
    request(SECTIONS_LIST_URL, (error, response, body) => {
        if (error) {
            console.error(error)
            res.send(error)
            return
        }

        console.log('We did it! Lets parse!')
        const data = getMainCategoriesList(body)
        if (!data) {
            console.log(data)
            res.send(`Smth went wrong`)
            return
        }
        console.log('Sections getted!')
        const extendedCategoriesData = data.map(
            (item) => getSubCategoriesData(item, body)
        )
        console.log('Subsections getted')
        console.log(`Total items count = ${totalItemsCount}`)
        console.log('Urls to parse:', urlToParseList)
        const responseData = `<div>
            <h2>Excluded Urls from parsing (${excludedUrlToParseList.length})</h2>
            <ul>${excludedUrlToParseList.map(el => `<li>${el}</li>`).join('')}</ul>
            <h2>Urls to parse (${urlToParseList.length})</h2>
            <ul>${urlToParseList.map(el => `<li>${el}</li>`).join('')}</ul>
            <h2>Data:</h2>
            <ul>${extendedCategoriesData.map(el => `<li>${JSON.stringify(el)}</li>`).join('')}</ul>
        </div>`
        fs.writeFile('./json-data/catalogCategoriesData.json', JSON.stringify(extendedCategoriesData), (err) => {
            if (err) {
                console.error(err)
            }
            res.send(responseData)
        })
    })
}

module.exports = getCategoriesData