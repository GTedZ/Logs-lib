const fs = require('fs');
const Time = require('times-lib');

class Logs {

    logPath = 'Logs/';

    errPath = 'Errors/';

    path = './';

    Sync = true;

    withTime = true;

    UTCTime = false;

    addTimestamp = false;

    acceptObjects = true;

    JSON_Spacing = true;

    inReverseOrder = false;

    /**
     * @param {String|undefined} path - optional
     * @param { { 
     * Sync:true|false|undefined,
     * withTime:true|false|undefined,
     * UTCTime:true|false|undefined,
     * addTimestamp:true|false|undefined,
     * inReverseOrder:true|false|undefined,
     * JSON_Spacing:true|false|undefined,
     * acceptObjects:true|false|undefined,
     * logPath:String|undefined,
     * errPath:String|undefined,
     * } } opts - optional
     * @warning "inReverseOrder" means that the logs will be added to the BEGINNING of the file that you are logging to, that is not recommended at all as the library will have to read the file's data, add the new log data, and then write everything back to the file instead of just appending to the file. It is extremely inefficient with large files (> 1MB in filesizes) or when logging frequently
     */
    constructor(path, opts) {
        this.path = './';
        if (path) {
            if (typeof path !== 'string') throw new Error(`'path' must be of type 'String', received '${typeof path}'`);
            this.path = path;
        }

        if (opts) {
            if (typeof opts !== 'object') throw new Error(`'opts' must be of type 'Object', received '${typeof opts}'`);
            if (typeof opts.withTime !== 'undefined') this.withTime = opts.withTime;
            if (typeof opts.UTCTime !== 'undefined') this.UTCTime = opts.UTCTime;
            if (typeof opts.addTimestamp !== 'undefined') this.addTimestamp = opts.addTimestamp;
            if (typeof opts.JSON_Spacing !== 'undefined') this.JSON_Spacing = opts.JSON_Spacing;
            if (typeof opts.acceptObjects !== 'undefined') this.acceptObjects = opts.acceptObjects;
            if (typeof opts.logPath !== 'undefined') this.logPath = opts.logPath;
            if (typeof opts.errPath !== 'undefined') this.errPath = opts.errPath;
            if (typeof opts.Sync !== 'undefined') this.Sync = opts.Sync;
            if (typeof opts.inReverseOrder !== 'undefined') this.inReverseOrder = opts.inReverseOrder;
        }

        if (!fs.existsSync(this.path + this.errPath)) preparePath(this.path + this.errPath);
        if (!fs.existsSync(this.path + this.logPath)) preparePath(this.path + this.logPath);
    }

    newLog(fileName, data, Callback) {
        return this.newLog(fileName, data, false, Callback);
    }

    new(fileName, data, Callback) {
        return this.newLog(fileName, data, false, Callback);
    }

    log(fileName, data, Callback) {
        return this.newLog(fileName, data, false, Callback);
    }

    err(fileName, data, Callback) {
        return this.newLog(fileName, data, true, Callback);
    }

    /**
     * @param {String} filePath - The destination file's name 
     * @param {String|Object|Buffer} data
     * @param {Boolean} isError
     * @param {Function} Callback
     */
    newLog(fileName, data, isError, Callback = () => { }) {
        const path = `${this.path}${isError ? this.errPath : this.logPath}${fileName}`;

        if (typeof data === 'object') {
            if (!this.acceptObjects) throw new Error(`'data' was of type 'Object', please enable the 'acceptObjects' option or send a valid type of data.`);
            data = this.JSON_Spacing ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        }

        let payload = '<--';
        if (this.withTime) {
            let time;
            if (this.UTCTime) time = Time.getUTCTime();
            else time = Time.getLocalTime();

            payload += ` ${time.datetime}${this.addTimestamp ? ` - ${time.timestamp}:` : ':'}`
        }
        payload += '\n' + data + '\n->>\n';

        if (this.Sync) {

            if (this.inReverseOrder) {
                if (fs.existsSync(path)) payload = payload + fs.readFileSync(path).toString();
                fs.writeFileSync(path, payload);
            } else {
                fs.appendFileSync(path, payload);
            }

        } else {
            if (typeof Callback !== 'undefined') {
                if (typeof Callback !== 'function') throw new Error(`'Callback' (if passed) must be of type 'function', instead received '${typeof Callback}'`);
                Callback = () => { };
            }

            if (this.inReverseOrder) {
                if (fs.existsSync(path)) {
                    fs.readFile(path, (err, data) => {
                        if (err != null) throw new Error(err);
                        payload = payload + data.toString();

                        fs.writeFile(path, payload, Callback);
                    });
                } else {
                    fs.writeFile(path, payload, Callback)
                }
            } else {
                fs.appendFile(path, payload, Callback);
            }

        }
    }

}

function preparePath(fullPath) {
    const paths = fullPath.split('/');
    let totalPath_soFar = '';
    paths.forEach(partialPath => {
        totalPath_soFar += partialPath + '/';
        if (!fs.existsSync(totalPath_soFar)) fs.mkdirSync(totalPath_soFar);
    })
}

module.exports = Logs;