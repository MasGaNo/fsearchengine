import { AScore } from "./ascore";

export interface ScoreInjectTermCoverage {
    /**
     * Term coverage. [0]: query term length. [1]: document term length.
     */
    termCoverage: [number, number];
}

/**
 * Coverage of a term in a Document. The closer it is, the better will be.
 */
export class ScoreTermCoverage extends AScore<ScoreInjectTermCoverage> {
    protected applyFormula(item: ScoreInjectTermCoverage): number {
        const termLength = item.termCoverage[0];
        const min = Math.min(termLength, item.termCoverage[1]);
        const max = Math.min(item.termCoverage[0], item.termCoverage[1]);
        // return (item.termCoverage[0] / item.termCoverage[1]);
        return Math.min(
            min / max, 
            termLength / 2 // minimum of 2 letters for full score.
        );
    }    
    
    public readonly type = "term";
    public readonly calculationType = "sum";
}