/**
 * Tokenize input
 * We want to keep at least the first letter
 * @example
 * Input: Paris
 * paris|
 * p.?aris|p.?.?aris|p.?a.?ris|p.?ar.?is|p.?ari.?s|p.?aris.?|
 * p.?ris|p.?.?is|p.?r.?s|p.?ri.?|
 * pa.?ris|pa.?.?ris|pa.?r.?is|pa.?ri.?s|pa.?ris.?|
 * pa.?is|pa.?.?s|pa.?i.?|
 * par.?is|par.?.?is|par.?i.?s|par.?is.?|
 * par.?s|par.?.?|
 * pari.?s|pari.?.?s|pari.?s.?|
 * pari.?
 * @param content Current content to tokenize
 * @param maxDistance Max depth for recursion
 * @param keepPrefixLength How many letter we want to keep at the beginning
 * @param distance Current depth
 */
export function fuzzyTokenize(content: string, maxDistance: number, keepPrefixLength: number, distance: number = 0): Set<string> {
    if (distance >= maxDistance) {
        return new Set([content]);
    }
    const tokens: Set<string> = new Set([content]);
    for (let i = 1, max = content.length; i <= max; ++i) {
        if (i > keepPrefixLength) {
            const prefix = content.substr(0, i - 1);
            let subTokens = fuzzyTokenize(content.substr(i - 1), maxDistance, Math.max(keepPrefixLength - i, 0), distance + 1);
            subTokens.forEach(suffix => tokens.add(`${prefix}.?${suffix}`));
            subTokens = fuzzyTokenize(content.substr(i), maxDistance, Math.max(keepPrefixLength - i, 0), distance + 1);
            subTokens.forEach(suffix => tokens.add(`${prefix}.?${suffix}`));
        }
    }

    return tokens;
}
