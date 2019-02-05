import { Analyzer } from "../analyzer";
import { TokenizerStandard } from "../../tokenizer/standard";
import { FilterLowercase } from "../../filter/lowercase";

export class AnalyzerStandard extends Analyzer {
    constructor() {
        super();

        this.addTokenizers(new TokenizerStandard())
            .addTokenFilter(new FilterLowercase());
    }
}