import { IFilter } from "../filter/filter.interface";
import { ATokenizer, TTokenResolver } from "../tokenizer/atokenizer";

export class Analyzer {
    private tokenFilters: Array<IFilter>;
    private tokenizers: Array<ATokenizer>;

    constructor() {
        this.tokenFilters = [];
        this.tokenizers = [];
    }

    public addTokenFilter(tokenFilter: IFilter) {
        this.tokenFilters.push(tokenFilter);
        return this;
    }

    public addTokenizers(tokenizer: ATokenizer) {
        this.tokenizers.push(tokenizer);
        return this;
    }

    public analyze<S, IsDocument extends boolean>(input: string, isDocument: IsDocument): Promise<Array<TTokenResolver<IsDocument, S>>> {
        return Promise
            .resolve()
            .then(() => {
                return this.tokenizers
                    .reduce((tokens: Array<TTokenResolver<IsDocument, S>>, tokenizer) => tokenizer.tokenize(input, tokens, isDocument), []);
            }).then((tokens) => {
                return this.tokenFilters.reduce((tokens: Array<TTokenResolver<IsDocument, S>>, tokenFilter) => {
                    return tokenFilter.filter(tokens);
                }, tokens);
            });
    }
}
