function timeLog() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const hours = today.getHours();
    const minutes = today.getMinutes();
    const seconds = today.getSeconds();
    return year + '-' + ("0" + month).slice(-2) + '-' + ("0" + date).slice(-2) + ' ' + ("0" + hours).slice(-2) + ':' + ("0" + minutes).slice(-2) + ':' + ("0" + seconds).slice(-2);
}

const log = {
    err: (msg, msg2) => {
        console.log(`\x1b[31mError\x1b[0m\x1b[96m: \x1b[0m${String(msg)} [${timeLog()}]${msg2 ? '\n' : ''}`, msg2 ? msg2 : '');
    },
    system: (msg, msg2) => {
        console.log(`\x1b[32mSystem\x1b[0m\x1b[96m: \x1b[0m${String(msg)} [${timeLog()}]${msg2 ? '\n' : ''}`, msg2 ? msg2 : '');
    },
    info: (msg, msg2) => {
        console.log(`\x1b[36mInfo\x1b[0m\x1b[96m: \x1b[0m${String(msg)} [${timeLog()}]${msg2 ? '\n' : ''}`, msg2 ? msg2 : '');
    },
    warring: (msg, msg2) => {
        console.log(`\x1b[41mWarring\x1b[0m\x1b[96m: \x1b[0m${String(msg)} [${timeLog()}]${msg2 ? '\n' : ''}`, msg2 ? msg2 : '');
    },
    connect: (msg, msg2) => {
        console.log(`\x1b[32mConnect\x1b[0m\x1b[96m: \x1b[0m${String(msg)} [${timeLog()}]${msg2 ? '\n' : ''}`, msg2 ? msg2 : '');
    },
    disconnect: (msg, msg2) => {
        console.log(`\x1b[33mDisconnect\x1b[0m\x1b[96m: \x1b[0m${String(msg)} [${timeLog()}]${msg2 ? '\n' : ''}`, msg2 ? msg2 : '');
    },
    create: (msg, msg2) => {
        console.log(`\x1b[92mRoom Create\x1b[0m\x1b[96m: \x1b[0m${String(msg)} [${timeLog()}]${msg2 ? '\n' : ''}`, msg2 ? msg2 : '');
    },
    destroy: (msg, msg2) => {
        console.log(`\x1b[92mRoom Destroy\x1b[0m\x1b[96m: \x1b[0m${String(msg)} [${timeLog()}]${msg2 ? '\n' : ''}`, msg2 ? msg2 : '');
    }
}
module.exports = log;