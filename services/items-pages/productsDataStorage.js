let productsList = []
let productsInProgressList = []
let productsData = {}

const setProductsData = products => {
    productsData = products
    productsList = Object.keys(productsData)
    productsInProgressList = []
}

module.exports.default = {
    productsData,
    productsList,
    productsInProgressList,
}

module.exports.setProductsData = setProductsData
