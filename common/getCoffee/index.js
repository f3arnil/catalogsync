const COFFE_MESSAGE = '☕'

const getCoffee = (timeout = 0, showMessage = true) => {
    const secTimeOut = timeout * 1000
    
    if (showMessage) {
        console.log(`\n Pause ${timeout} seconds.. \n`)
    }
    
    return
        new Promise((resolve) => {
            setTimeout(() => resolve(COFFE_MESSAGE), secTimeOut)
        })
}

module.exports.getCoffee = getCoffee