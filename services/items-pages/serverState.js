const SERVER_STATUS_OFFLINE = 'OFFLINE'
const SERVER_STATUS_LOADING = 'LOADING'
const SERVER_STATUS_READY = 'READY'

class ServerState {
  constructor(curr) {
    let currentState = curr

    this.updateState = nextState => {
      currentState = nextState
      return
  }

    this.getState = () => currentState
  }
}

const serverState = new ServerState(SERVER_STATUS_OFFLINE)

module.exports.default = serverState

module.exports.serverStates = {
  SERVER_STATUS_OFFLINE,
  SERVER_STATUS_LOADING,
  SERVER_STATUS_READY,   
}