var request = require('request')
var fs = require('fs')
var getSectionsList = require('./categoriesParser').getSectionsList
var parseCategoriesData = require('./categoriesParser').parseCategoriesData
var mapPagesCount = require('./categoriesParser').mapPagesCount

const SECTIONS_LIST_URL = 'https://catalog.onliner.by'

let totalItemsCount = 0
// const urlToParseList = []
// const excludedUrlToParseList = []

const getCategoriesData = async (req, res) => {
    console.log('Start getting catalog categories!...')
    await request(SECTIONS_LIST_URL, async (error, response, body) => {
        if (error) {
            console.error(error)
            res.send(error)
            return
        }

        console.log('We did it! Lets parse!')
        const data = getSectionsList(body)
        if (!data) {
            console.log(data)
            res.send(`Smth went wrong`)
            return
        }
        console.log('Sections getted!')
        const extendedCategoriesData = data.map(
            (item) => parseCategoriesData(item, body)
        )
        console.log('Subsections getted')
        const resultDataArray = [].concat(...extendedCategoriesData)
        resultDataArray.map(
            (item) => {
                totalItemsCount += item.itemsCount
                return item
            }
        )
        console.log(`Total items count = ${totalItemsCount}`)

        const excludedUrlToParseList = resultDataArray
            .filter(item => item.isVirtual === true)
            .map(item => decodeURIComponent(item.url))

        const urlToParseList = resultDataArray
            .filter(item => item.isVirtual === false)
            .map(item => item.url)

        console.log('Categories parsed!... Going to get pages count...', resultDataArray.length)
        console.log(`Virtual items count: ${excludedUrlToParseList.length - 1}`)
        console.log(`Items count to parse: ${urlToParseList.length - 1}`)
        const mappedSections = await mapPagesCount(resultDataArray)

        const responseData = `<div>
            <h2>Excluded Urls from parsing (${excludedUrlToParseList.length})</h2>
            <ul>${excludedUrlToParseList.map(el => `<li>${el}</li>`).join('')}</ul>
            <h2>Urls to parse (${urlToParseList.length})</h2>
            <ul>${urlToParseList.map(el => `<li>${el}</li>`).join('')}</ul>
            <h2>Data:</h2>
            <ul>${mappedSections.map(el => `<li>${JSON.stringify(el)}</li>`).join('')}</ul>
        </div>`

        fs.writeFile(
            './json-data/catalogCategoriesData.json',
            JSON.stringify(mappedSections),
            (err) => {
                if (err) {
                    console.error(err)
                }
                console.log('Done.')
                res.send(responseData)
            })
    })
}

module.exports = getCategoriesData