import {
    assert,
    getAvailableErrorProps,
    getGlobalNamespace,
    isError,
    patterns,
} from './helpers';


/**
 * Vulture Class
 *
 * @class      Vulture
 */
export default class Vulture {
    constructor(userOptions) {
        const defaults = {
            purge: 'strict',
        };

        const options = Object.assign({}, defaults, userOptions);

        this.options = {}

        Object.keys(options).forEach(k => {
            Object.defineProperty(this.options, k, {
                enumerable: false,
                configurable: false,
                writable: false,
                value: options[k],
            });
        });

        this.state = {
            subscribers: [],
            subCount: 0,
            alive: true,
        };
    }

    /**
     * Determines if given string has sensitive info.
     *
     * @param      {string}  stg     Given string.
     */
    static isSensitive(stg) {
        assert(
            typeof stg === 'string',
            `isSensitive must recive a string, instead got ${typeof stg}`,
        );

        return patterns
            .map(pattern => stg.match(pattern))
            .map(match => !!match)
            .reduce((x, y) => x || y);
    }

    /**
     * Sanitizes a given string.
     *
     * @param      {string}  stg     Given string.
     */
    static sanitize(stg) {
        assert(
            typeof stg === 'string',
            `sanitize must recive a string, instead got ${typeof stg}`,
        );

        let result = stg;

        patterns
            .forEach(pattern => {
                result = result.replace(pattern, '############');
            });

        return result;
    }

    /**
     * Parses an error to get more info about it, like walking the stack if
     * it exists or accessing line, column and source.
     *
     * @param      {Error}  error   The error,
     * @todo       Something like tracekit. https://github.com/csnover/TraceKit
     */
    static parse(error) {
        /**
         * We actualy should bind to window by default, to be able to get more
         * info about the error.
         */

         const Payload = buildReport(error);
         Payload.tag = getPayloadHash(Payload);

    }

    /**
     * Binds Vulture to the global scope.
     */
    bindToGlobal() {
        const global = getGlobalNamespace();

        assert(!global.__VULTURE_IS_HOVERING__,
            `There's already a volture hovering the global scope.`,
        );

        /**
         * Report uncauthc error at global scope
         *
         * @param      {message || Event}  x             Ignored...
         * @param      {string}            source        The source,
         * @param      {number}            lineNumber    The line number,
         * @param      {number}            columnNumber  The column number,
         * @param      {Error}             error         The error,
         */
        global.onerror = (x, source, lineNumber, columnNumber, error) => {
            this.report(error, {
                source,
                lineNumber,
                columnNumber,
            });
        }

        global.__VULTURE_IS_HOVERING__ = true;
    }

    /**
     * Unbinds vulture from global scope.
     */
    unbindFromGlobal() {
        const global = getGlobalNamespace();

        assert(
            global.__VULTURE_IS_HOVERING__,
            `There's no volture hovering the global scope.`,
        );

        global.onerror = null;
        delete global.__VULTURE_IS_HOVERING__;
    }

    /**
     * Hover the local scope and call fn with any catch error
     *
     * @param      {Function}  fn      The error handler
     */
    hover(fn) {
        assert(
            this.state.alive,
            `Cannot hover using a dead Vulture instance.`,
        );

        assert(
            typeof fn === 'function',
            `Hoverer must be a function, instead got ${typeof fn}`,
        );

        const index = this.state.subscribers.push(fn) - 1;
        this.state.subCount += 1;

        return () => {
            this.state.subscribers.splice(index, 1);
            this.state.subCount -= 1;
        }
    }

    /**
     * Report the error for all hoverers.
     *
     * @param      {Errir}  error   The error.
     */
    report(error, moreInfo) {
        assert(
            this.state.alive,
            `Cannot report using a dead Vulture instance.`,
        );

        assert(
            isError(error),
            `Vulture.report expected Error Object, but instead got ${typeof error}`,
        );

        if (this.state.subCount === 0) { return; }

        const errProps = getAvailableErrorProps();

        const isSensitive = errProps.map(
            prop => Vulture.isSensitive(error[prop])
        ).reduce((x, y) => x || y);

        if (this.options.purge === 'strict' && isSensitive) { return; }

        const errObject = {};

        errProps.forEach(
            prop => {
                if (this.options.purge === 'loose' && isSensitive) {
                    errObject[prop] = Vulture.sanitize(error[prop]);
                } else {
                    errObject[prop] = error[prop];
                }
            }
        );

        const payload = Object.assign({}, errObject, moreInfo);

        this.state.subscribers.forEach(sub => sub(payload));
    }

    /**
     * Wraps a given function with a try catch block,
     *
     * @param      {Function}  fn      The function,
     * @return     {Function}  A wrapped function.
     */
    wrap(fn) {
        assert(
            this.state.alive,
            `Cannot wrap using a dead Vulture instance.`,
        );

        assert(
            typeof fn === 'function',
            `wrap expected a function but instead got ${typeof fn}`,
        );

        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                this.report(error);
                return;
            }
        }
    }

    /**
     * Wraps a function that invokes a callback after is completed.
     *
     * @param      {Function}  fn      The function,
     * @return     {Function}  A wrapped function.
     */
    wrapCallback(fn) {
        assert(
            this.state.alive,
            `Cannot wrapCallback using a dead Vulture instance.`,
        );

        assert(
            typeof fn === 'function',
            `wrapCallback expected a function but instead got ${typeof fn}`,
        );

        return (cb, ...args) => {
            let result = undefined;
            let error = null;

            try {
                result = fn(...args);
            } catch (err) {
                error = err;
                this.report(err);
            }

            cb(error, result);
        }
    }

    /**
     * Wrap a function with the reporter.
     *
     * @param      {Function}  fn      The function,
     * @param      {Array}     args    The arguments,
     * @return     {Any}    Whatever the function returns.
     */
    try (fn, ...args) {
        assert(
            this.state.alive,
            `Cannot try using a dead Vulture instance.`,
        );

        assert(
            typeof fn === 'function',
            `wrap expected a function but instead got ${typeof fn}`,
        );

        return this.wrap(fn)(...args);
    }

    /**
     * Wraps a node style callback with the reporter.
     *
     * @param      {Function}  fn      The function,
     * @param      {Array}     args    The arguments,
     * @param      {Function}  cb      The callback.
     */
    tryCallback(fn, cb, ...args) {
        assert(
            this.state.alive,
            `Cannot tryCallback using a dead Vulture instance.`,
        );

        assert(
            typeof fn === 'function',
            `wrapCallback expected a function but instead got ${typeof fn}`,
        );

        assert(
            typeof cb === 'function',
            `wrapCallback expected a callback function but instead got ${typeof cb}`,
        );

        this.wrapCallback(fn)(cb, ...args);
    }

    /**
     * Marks an instance as dead.
     */
    die() {
        this.state = {
            subscribers: [],
            subCount: 0,
            alive: false,
        };
    }
}
