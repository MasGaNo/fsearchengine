module.exports = function(filename, stats) {
    return stats.isDirectory() || filename.match(/\.(js(on)?|css)$/);
}
