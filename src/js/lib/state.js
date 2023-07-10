// simple state store
// usage explained here: https://gist.github.com/dbisso/d41881f5ed9b55ace73dbb0da6480bd2

function State() {
  this.actions = {}
  this.subscriptions = []
  this.history = []
}

State.prototype.subscribe = function (element, action, callback) {
  this.subscriptions[action] = this.subscriptions[action] || []
  this.subscriptions[action].push(function (data) {
    callback.apply(element, data)
  })
}

State.prototype.dispatch = function (action, data) {
  data = data || []

  // Store history of actions (not strictly neccessary)
  this.history.push([action, data])

  // Call action reducers
  if ('function' === typeof this[action]) {
    this[action].apply(this, data)
  }

  // Add the action and state as final arguments
  data.push(action)
  data.push(this)

  // Call subscribers
  this.subscriptions[action] = this.subscriptions[action] || []
  this.subscriptions[action].forEach(function (subscription) {
    subscription(data)
  })
}

export default State
