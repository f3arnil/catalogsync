const moment = require('moment')

const DATE_FORMAT = 'hh:mm:ss DD-MM-YY'

module.exports.log = (serviceName = false, message = '', newLine = false) => {
    const time = moment().format(DATE_FORMAT)
    console.log(
        `${newLine ? '\n' : ''}`,
        `[${time}]`,
        `${serviceName ? `[${serviceName}]` : ''}`,
        `${message}`
    )
}