import { ATokenizer, TTokenResolver, IQueryToken, TTokenFuzzinessDistance, TTokenFuzzinessPrefix } from "./atokenizer";
import { fuzzyTokenize } from "../fuzziness/tokenize";
import { fastMemoize } from "../utils/function/memoize";

export class TokenizerStandard extends ATokenizer {
    private validator(token: string) {
        return (input: string) => {
            const position = input.indexOf(token);
            return position === -1 ? 0 : 1 - position / input.length;
        }
    }

    private checkDistance(distance: TTokenFuzzinessDistance, token: string): number {
        if (distance !== 'auto') {
            return distance;
        }
        return token.length < 5 ? 1 : 2;
    }

    private checkPrefixLength(prefixLength: TTokenFuzzinessPrefix, token: string): number {
        if (prefixLength !== 'auto') {
            return prefixLength;
        }
        return token.length < 4 ? 1 : 0;
    }

    private fuzzyData<S>(token: string): Partial<IQueryToken<S>> {
        let prefixLength = this.checkPrefixLength(this.options.fuzziness.prefixLength, token);
        let distance = this.checkDistance(this.options.fuzziness.distance, token);
        const tokens = fuzzyTokenize(token, distance, prefixLength);
        // const regExp = new RegExp(`(${Array.from(tokens).join('|')})`, 'i');
        const regExp = Array.from(tokens).map((current) => new RegExp(current, 'i'));

        return {
            validator: fastMemoize((input: string) => {

                if (input === token) {
                    return 1;
                }

                const inputLength = input.length;
                return regExp.reduce((score, reg) => {
                    const match = input.match(reg);
                    if (!!match) {
                        return score + (1 - (match.index! / inputLength));
                    }
                    return score;
                }, 0) / regExp.length;
                //  !!input.match(regExp);
            }),
            fuzziness: {
                tokens
            }
        }
    }

    tokenize<IsDocument extends boolean, S>(input: string, tokens: Array<TTokenResolver<IsDocument, S>>, isDocument: IsDocument) {
        input.split(' ').map(part => part.trim()).filter(Boolean).forEach(part => {
            const tokenData: TTokenResolver<IsDocument, S> = { value: part } as TTokenResolver<IsDocument, S>;
            if (!isDocument) {
                Object.assign(tokenData, {
                    validator: this.hasFuzziness ? null : this.validator(part),
                    stats: { totalDocument: 0 },
                    getGlobalScore: new Promise<number>((resolve) => {
                        (tokenData as Pick<IQueryToken<S>, 'applyGlobalScore'>).applyGlobalScore = resolve;
                    }),
                    ...this.fuzzyData(part)
                } as Pick<IQueryToken<S>, 'getGlobalScore' | 'stats' | 'validator'>);
            }
            tokens.push(tokenData);
        });
        return tokens;
    }
}
