import { IDocumentToken } from "../tokenizer/atokenizer";

export interface IFilter {
    filter: <T extends IDocumentToken>(input: Array<T>) => Array<T>;
}