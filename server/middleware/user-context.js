
const { AsyncLocalStorage } = require("node:async_hooks");

const userStorage = new AsyncLocalStorage();

function runWithUser(user, callback) {
    return userStorage.run(user, callback);
}

function getCurrentUser() {
    return userStorage.getStore() || null;
}

module.exports = {
    runWithUser,
    getCurrentUser,
};
