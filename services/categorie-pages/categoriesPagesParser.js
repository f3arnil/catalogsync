const normalRequest = require('request')
const request = require('request-promise')
const fs = require('fs')

const getCoffee = require('../../common/getCoffee').getCoffee

let categoriesData = []
let currentUserAgent = 0

const CATEGORIES_LIST_FILE_NAME = require('../sections-parser/index').categoriesListJson

const DEFAULT_REQUEST_TIMEOUT = 10000
const ERROR_CONSOLE_TITLE = '\n===== ERROR =====\n'
const CATEGORIE_SEARCH_URL = 'https://catalog.api.onliner.by/search'
const CHUNK_LENGTH = 5

const writeErrorChunksData = []

const getUniqUserAgent = (chunkIndex, itemInChunk, superIndex, page, total) => {
    const userAgentsList = [
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; U; en-US) AppleWebKit/528.5.${superIndex}+ (KHTML, like Gecko, Safari/528.5.${page}.${total}+) Version/4.0 Kindle/3.0 (screen 600x800; rotate)`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (X11; U; Linux armv7l like Android; en-us) AppleWebKit/531.2.${superIndex}+ (KHTML, like Gecko) Version/5.0 Safari/533.2.${page}.${total}+ Kindle/3.0+`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk}.${superIndex}.${page}.${total} (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (compatible; bingbot/2.0.${superIndex}.${page}.${total}; +http://www.bing.com/bingbot.htm)`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (compatible; Googlebot/2.1.${superIndex}.${page}.${total}; +http://www.google.com/bot.html)`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk}.${superIndex} (Nintendo 3DS; U; ; en) Version/1.7412.${page}.${total}.EU`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (PlayStation Vita 3.61.${superIndex}) AppleWebKit/537.73.${page}.${total} (KHTML, like Gecko) Silk/3.2`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (PlayStation 4 3.11.${superIndex}) AppleWebKit/537.73.${page}.${total} (KHTML, like Gecko)`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Windows Phone 10.0.${superIndex}; Android 4.2.1.${page}.${total}; Xbox; Xbox One) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/46.0.2486.0 Mobile Safari/537.36 Edge/13.10586`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Windows NT 10.0.${superIndex}; Win64; x64; XBOX_ONE_ED) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Nintendo WiiU) AppleWebKit/536.30.${superIndex} (KHTML, like Gecko) NX/3.0.4.2.12 NintendoBrowser/4.3.1.11264.${page}.${total}.US`,
        `AppleTV5,3/9.1.1.${chunkIndex}.${itemInChunk}.${superIndex}.${page}.${total}`,
        `AppleTV6,2/11.1.${chunkIndex}.${itemInChunk}.${superIndex}.${page}.${total}`,
        `Dalvik/2.1.0.${chunkIndex}.${itemInChunk} (Linux; U; Android 6.0.1.${superIndex}; Nexus Player Build/MMB29T.${page}.${total})`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 5.1.${superIndex}; AFTS Build/LMY47O) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Version/4.0 Chrome/41.99900.2250.0242 Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; U; Android 4.2.2.${superIndex}; he-il; NEO-X5-116A Build/JDQ39) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30.${page}.${total}`,
        `Roku4640X/DVP-7.70.${chunkIndex}.${itemInChunk}.${superIndex} (297.70E04154A)`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (CrKey armv7l 1.5.16041.${superIndex}) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/31.0.1650.0 Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (X11; Ubuntu; Linux x86_64; rv:15.0.${superIndex}) Gecko/20100101 Firefox/15.0.1.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Windows NT 6.1.${superIndex}; WOW64) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9.${superIndex} (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Windows NT 10.0; Win64; x64) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 5.0.2; LG-V410/V41020c Build/LRX22G) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Version/4.0 Chrome/34.0.1847.118 Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 4.4.3; KFTHWI Build/KTU84M) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Silk/47.1.79 like Chrome/47.0.2526.80 Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 5.0.2; SAMSUNG SM-T550 Build/LRX22G) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) SamsungBrowser/3.3 Chrome/38.0.2125.102 Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 7.0; SM-T827R4 Build/NRD90M) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/60.0.3112.116 Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 6.0.1; SHIELD Tablet K1 Build/MRA58K; wv) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Version/4.0 Chrome/55.0.2883.91 Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 6.0.1; SGP771 Build/32.2.A.0.253; wv) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Version/4.0 Chrome/52.0.2743.98 Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 7.0; Pixel C Build/NRD90M; wv) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Version/4.0 Chrome/52.0.2743.98 Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Windows Phone 10.0; Android 4.2.1; Microsoft; Lumia 950) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/46.0.2486.0 Mobile Safari/537.36 Edge/13.10586.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Windows Phone 10.0; Android 4.2.1; Microsoft; RM-1127_16056) AppleWebKit/537.36.${superIndex}(KHTML, like Gecko) Chrome/42.0.2311.135 Mobile Safari/537.36 Edge/12.10536.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Windows Phone 10.0; Android 6.0.1; Microsoft; RM-1152) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/52.0.2743.116 Mobile Safari/537.36 Edge/15.15254.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Apple-iPhone7C2/1202.466.${superIndex}; U; CPU like Mac OS X; en) AppleWebKit/420+ (KHTML, like Gecko) Version/3.0 Mobile/1A543 Safari/419.3.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (iPhone9,4; U; CPU iPhone OS 10_0_1 like Mac OS X) AppleWebKit/602.1.50.${superIndex} (KHTML, like Gecko) Version/10.0 Mobile/14A403 Safari/602.1.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (iPhone9,3; U; CPU iPhone OS 10_0_1 like Mac OS X) AppleWebKit/602.1.50.${superIndex} (KHTML, like Gecko) Version/10.0 Mobile/14A403 Safari/602.1.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38.${superIndex} (KHTML, like Gecko) Version/11.0 Mobile/15A5370a Safari/604.1.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.34.${superIndex} (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38.${superIndex} (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 6.0; HTC One M9 Build/MRA58K) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/52.0.2743.98 Mobile Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 6.0; HTC One X10 Build/MRA58K; wv) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.98 Mobile Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 6.0.1; E6653 Build/32.2.A.0.253) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/52.0.2743.98 Mobile Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 7.1.1; G8231 Build/41.2.A.0.219; wv) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Version/4.0 Chrome/59.0.3071.125 Mobile Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 6.0.1; Nexus 6P Build/MMB29P) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/47.0.2526.83 Mobile Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 5.1.1; SM-G928X Build/LMY47X) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/47.0.2526.83 Mobile Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 6.0.1; SM-G920V Build/MMB29K) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Chrome/52.0.2743.98 Mobile Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 6.0.1; SM-G935S Build/MMB29K; wv) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Version/4.0 Chrome/55.0.2883.91 Mobile Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 7.0; SM-G930VC Build/NRD90M; wv) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Version/4.0 Chrome/58.0.3029.83 Mobile Safari/537.36.${page}.${total}`,
        `Mozilla/5.0.${chunkIndex}.${itemInChunk} (Linux; Android 7.0; SM-G892A Build/NRD90M; wv) AppleWebKit/537.36.${superIndex} (KHTML, like Gecko) Version/4.0 Chrome/60.0.3112.107 Mobile Safari/537.36.${page}.${total}`,
    ]
    
    console.log(`[${chunkIndex}-${itemInChunk}-${superIndex}][${page}/${total}] USER AGENT ID: ${currentUserAgent}/${userAgentsList.length}`)
    
    const result = userAgentsList[currentUserAgent]
    
    currentUserAgent += 1

    if (currentUserAgent >= userAgentsList.length) {
        currentUserAgent = 0
    }

    return result
}

const parseCategories = (req, res) => normalRequest({
    url:`http://localhost:3000/json-data/categoriesData/${CATEGORIES_LIST_FILE_NAME}`,
    method: 'GET',
    json: true,
    timeout: DEFAULT_REQUEST_TIMEOUT,
}, async (error, response, body) => {
    if (error) {
        console.log(JSON.stringify(error))
        res.send(error)
        return
    }
    console.log('File recieved.. Lets start Parsing...')
    let pagesCount = 0
    body.map(
        (item) => {
            pagesCount += item.pagesCount
            return item
        }
    )
    console.log('TOTAL PAGES TO PARSE:', pagesCount)
    console.log(
        'Estimated parsing time (minimal) without requests blocks:',
        (pagesCount / 10 * 4 / 60 / CHUNK_LENGTH / CHUNK_LENGTH ),
        ' hours')
    await getCoffee(15)
    const parsePages = await parsePagesListChunks([ ...body.reverse()])
    console.log('Parsing finished! Congrates comrade!')

    if (writeErrorChunksData.length > 0) {
        fs.writeFile(
            `../json-data/writeErrorChunksData.json`,
            JSON.stringify(writeErrorChunksData),
            (err) => {
                if (err) {
                    console.log(
                        ERROR_CONSOLE_TITLE,
                        '[writeErrorChunksData] JSON FILE WRITE ERROR\n',
                        JSON.stringify(writeErrorChunksData),
                        ERROR_CONSOLE_TITLE
                    )
                    writeErrorChunksData.push(dataItem)
                }
            }
        )
    }
    res.send('Done..')
})

const parsePagesListChunks = (dataArray) => new Promise(
    async (resolve, reject) => {
        const preChunks = buildChunks(dataArray)
        const chunks = buildChunks(preChunks)
        console.log(`=======> Chunks count is ${chunks.length}`)

        for (let index = 0; index < chunks.length;) {
            const result = await parseChunk(chunks[index], index)
            console.log(`=======> Chunk ${index} parsed`)
            index += 1
        }

        resolve('Done')
    }
)

const parseChunk = (dataArray, chunkIndex) => new Promise(
    async (resolve, reject) => {
        console.log(`=======> GOING TO PARSE CHUNK ${chunkIndex}. Length is ${dataArray.length}`)
        const promisesArray = dataArray.map(
            (item, itemInChunk) => parsePagesList(item, chunkIndex, itemInChunk))

        const result = await Promise.all(promisesArray)
        resolve(`=======> Chunk ${chunkIndex} parsing is Done...`)
    }
)

const buildChunks = (dataArray) => {
    const iterationsCount = dataArray.length < CHUNK_LENGTH
        ? 1
        : Math.ceil(dataArray.length / CHUNK_LENGTH)
    const result = []
    for (let i = 0; i < iterationsCount; i++) {
        const chunk = dataArray.splice(0, CHUNK_LENGTH)
        result.push(chunk)
    }
    return result
}

const parsePagesList = (dataArray, chunkIndex, itemInChunk) => new Promise(
    async (resolve, reject) => {
        const dataLength = dataArray.length - 1
        let counter = 0

        for (let index = 0; index < dataArray.length;) {
            let dataItem = dataArray[index]
            let awaitTimeoutSec = 0.2

            const categoriesData = await parseCategoriePages(
                dataItem, chunkIndex, itemInChunk, index
            ).catch((err) => {
                console.log(
                    ERROR_CONSOLE_TITLE,
                    `[${index}/${dataLength}][${dataItem.id}] Will repeat request after timeout`,
                    ERROR_CONSOLE_TITLE
                )
                awaitTimeoutSec = CHUNK_LENGTH + counter
                index -= 1
                return err
            })

            if (!{}.hasOwnProperty.call(categoriesData, 'error')) {
                console.log(`[${index}/${dataLength}][${dataItem.id}] Parsing finished!`)
                dataItem = {
                    ...dataItem,
                    categoriesData,
                }
                console.log('Will write data to file...')
                const fileNamePrefix = `.${chunkIndex}.${itemInChunk}.${index}` //dataItem.isVirtual
                    // ? `.${chunkIndex}.${itemInChunk}.${index}`
                    // : ''
                // Write data to file
                fs.writeFile(
                    `../json-data/categoriePages/${dataItem.id}${fileNamePrefix}.json`,
                    JSON.stringify(dataItem),
                    (err) => {
                        if (err) {
                            console.log(
                                ERROR_CONSOLE_TITLE,
                                `[${index}/${dataLength}][${dataItem.id}] JSON FILE WRITE ERROR`,
                                JSON.stringify(err),
                                ERROR_CONSOLE_TITLE
                            )
                            writeErrorChunksData.push(dataItem)
                        }
                    }
                )
                //newDataArray[index] = dataItem
            }
            
            index += 1
            counter += 1

            if (counter >= 10) {
                counter = awaitTimeoutSec > 3
                    ? counter - 1
                    : 0
                
                awaitTimeoutSec = awaitTimeoutSec >3
                    ? awaitTimeoutSec
                    : 3
                
            }
            const coffee = await getCoffee(awaitTimeoutSec)
            console.log(coffee, coffee, coffee)
        }

        resolve('Done')
    }
)

const parseCategoriePages = (dataObject, chunkIndex, itemInChunk, superIndex) => new Promise(
    async (resolve, reject) => {
        const dataLength = dataObject.pagesCount
        let counter = 0
        const productsData = []

        for (let index = 1; index < (dataLength + 1);) {
            let awaitTimeoutSec = `0.${itemInChunk + 1}`
            const data = await getCategoriePageData(
                dataObject.id, index, dataLength, chunkIndex, itemInChunk, superIndex
            ).catch((err) => {
                console.log(
                    ERROR_CONSOLE_TITLE,
                    `[${chunkIndex}-${itemInChunk}-${superIndex}][${index}/${dataLength}][${dataObject.id}] Will repeat request after timeout`,
                    ERROR_CONSOLE_TITLE
                )
                awaitTimeoutSec = 3 + (counter * 2)
                index -= 1
                return err
            })
            
            if (!{}.hasOwnProperty.call(data, 'error')) {
                console.log(`[${superIndex}][${index}/${dataLength}][${dataObject.id}] Parsing finished!`)
                productsData.push(...data)
            }
            
            index += 1
            counter += 1

            if (counter >= 10) {
                counter = awaitTimeoutSec > 3
                    ? counter - 1
                    : 0
                
                awaitTimeoutSec = awaitTimeoutSec > 3
                    ? awaitTimeoutSec
                    : 3
                
            }
            const coffee = await getCoffee(awaitTimeoutSec)
            console.log(coffee)
        }
        
        resolve(productsData)
    }
)

const getCategoriePageData = (categorie, page, total, chunkIndex, itemInChunk, superIndex) => new Promise(
    async (resolve, reject) => {
        const integerDate = new Date().getTime()
        const url = `${CATEGORIE_SEARCH_URL}/${categorie}/?page=${page}&group=1`
        const userAgent = getUniqUserAgent(chunkIndex, itemInChunk, superIndex, page, total)
        if (userAgent.length === 0) {
            console.log('АХТУНГ АХТУНГ ПАРТИЗАНЕН СПИЗИТЬ БРАУЗЕР!!!')
        }
        const options = {
            url,
            method: 'GET',
            json: true,
            timeout: DEFAULT_REQUEST_TIMEOUT,
            headers: [{
                'User-Agent': userAgent // `Mozilla/5.0.${chunkIndex}.${superIndex} (Macintosh; Intel Mac OS X 10_13_4_${chunkIndex}_${superIndex}) AppleWebKit/537.36.${integerDate} (KHTML, like Gecko) Chrome/65.${chunkIndex}.0.3325.${total - page} Safari/537.${superIndex}.3${page}`,
            }]
        }
        console.log(`[${chunkIndex}-${itemInChunk}-${superIndex}][${page}/${total}][${categorie}] Requesting data..`)
        const body = await request(options).catch(
            (error) => {
                console.error(JSON.stringify(error))
                return ({ error})
            }
        )

        if (
            {}.hasOwnProperty.call(body, 'error')
            || !{}.hasOwnProperty.call(body, 'products')
        ) {
            reject({ error: body})
        }

        resolve(body.products)
    }
)

module.exports.default = parseCategories