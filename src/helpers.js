/**
 * Invariant Like assertion utility
 *
 * @param      {boolean}  condition  The condition,
 * @param      {string}  message    The message.
 */
export function assert(condition, message) {
    if (!condition) {
        if (process.env.NODE_ENV !== 'production') {
            throw new TypeError(message);
        } else {
            throw new TypeError();
        }
    }
}


/**
 * Gets the available error properties.
 *
 * @return     {Array}  The available error properties.
 */
export function getAvailableErrorProps() {
    const args = Array.apply(null, Array(10)).map(String.prototype.valueOf, 'X');
    const error = new Error(...args);

    return pickTruthy({
        // Defaults
        name: !!error.name,
        message: !!error.message,

        // Vendor Specific
        code: !!error.code,
        columnNumber: !!error.columnNumber,
        description: !!error.description,
        fileName: !!error.fileName,
        lineNumber: !!error.lineNumber,
        number: !!error.number,
        stack: !!error.stack,
        stackTraceLimit: !!error.stackTraceLimit,
    });
}

/**
 * Gets the global namespace.
 *
 * @return     {Object}  The global namespace.
 */
export function getGlobalNamespace() {
    const W = typeof window !== 'undefined';
    const G = typeof global !== 'undefined';
    const S = typeof self !== 'undefined';

    return (g => g).call(this, W ? window : S ? self : G ? global : {});
}

/**
 * Determines if given value is an error.
 *
 * @param      {Any}      value   The value,
 * @return     {boolean}  True if error, False otherwise.
 */
export function isError(value) {
    const tag = toString.call(value);
    switch (tag) {
        case '[object Error]':
            return true;
        case '[object Exception]':
            return true;
        case '[object DOMException]':
            return true;
        default:
            return value instanceof Error;
    }
}

/**
 * Regexes to filter sensitive content.
 *
 * @type       {Array}
 */
export const patterns = [
    /api(_|-)?key(\W*){1,30}?[\w\s]*(\W)/g,
    /passw(or)?d(\W*){1,30}?[\w\s]*(\W)/g,
    /user(_|-)?id(\W*){1,30}?[\w\s]*(\W)/g,
    /auth(orization)?(\W*){1,30}?[\w\s]*(\W)/g,
    /access(_|-)?token(\W*){1,30}?[\w\s]*(\W)/g,
    /^(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/g,
];

/**
 * Get all object properties that have a truthy value
 *
 * @param      {Object}  obj     The object,
 * @return     {Array}  The truthy keys
 */
export function pickTruthy(obj) {
    return Object.keys(obj).map(k => !!obj[k] ? k : false).filter(x => x);
}
