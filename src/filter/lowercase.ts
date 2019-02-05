import { IFilter } from "./filter.interface";
import { IDocumentToken } from "../tokenizer/atokenizer";

export class FilterLowercase implements IFilter {
    filter<T extends IDocumentToken>(input: Array<T>): Array<T> {
        input.forEach(entry => {
            entry.value = entry.value.toLowerCase();
            return entry;
        });
        return input;
    }
}