/**
 * Custom Webpack Loader for Turbopack
 * * @param {string} source - The original source code of the dependency
 * @returns {string} - The modified source code
 */
module.exports = function (source) {
    console.log(`Source: ${source}`);

    return source;
};
