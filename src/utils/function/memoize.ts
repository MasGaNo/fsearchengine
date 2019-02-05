export function fastMemoize(callback: Function) {
    const cache: Record<string, any> = {};
    return function () {
        const key = Array.prototype.join.call(arguments);
        if (!(key in cache)) {
            cache[key] = callback(...arguments);
        }

        return cache[key];
    }
}