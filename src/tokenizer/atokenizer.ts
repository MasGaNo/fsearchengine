import { StatsScoreInterface } from "../score/ascore";

export interface IDocumentToken {
    value: string;
}

export interface IQueryToken<S> extends IDocumentToken {
    validator: (input: string) => number;
    stats: S & StatsScoreInterface;
    getGlobalScore: Promise<number>;
    applyGlobalScore: (globalScore: number) => void;
    fuzziness?: {
        tokens: Set<string>;
    }
}

export type TTokenResolver<IsDocument extends boolean, S = {}> = IsDocument extends true ? IDocumentToken : IQueryToken<S>;

export type TTokenFuzzinessDistance = 'auto' | 0 | 1 | 2;
export type TTokenFuzzinessPrefix = 'auto' | number;

export interface ITokenizerOptions {
    fuzziness: {
        distance: TTokenFuzzinessDistance;
        prefixLength: TTokenFuzzinessPrefix;
    }
}

export abstract class ATokenizer<P extends object = {}> {
    protected options: ITokenizerOptions & P;
    private _hasFuzziness: boolean;
    constructor(options: Partial<ITokenizerOptions & P> = {}) {
        this.options = Object.assign({
            fuzziness: {
                distance: 'auto',
                prefixLength: 'auto'
            }
        }, options) as ITokenizerOptions & P;

        this._hasFuzziness = this.options.fuzziness && (this.options.fuzziness.distance === 'auto' || this.options.fuzziness.distance > 0);
    }

    protected get hasFuzziness(): boolean {
        return this._hasFuzziness;
    }
    public abstract tokenize<IsDocument extends boolean, S>(input: string, currentTokens: Array<TTokenResolver<IsDocument, S>>, isDocument: IsDocument): Array<TTokenResolver<IsDocument, S>>;
}
