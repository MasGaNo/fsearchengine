import { AScore, StatsScoreInterface } from "./ascore";

export interface ScoreInjectInverseDocumentFrequency {
    /**
     * Frequency of a term in all Document.
     */
    documentFrequency: number;
}

/**
 * Frequency of a term in all Document. If the term is common to all document, so it's not relevant and the weight decreases.
 */
export class ScoreInverseDocumentFrequency extends AScore<ScoreInjectInverseDocumentFrequency> {
    protected applyFormula(item: ScoreInjectInverseDocumentFrequency, stats: StatsScoreInterface): number {
        return 1 + Math.log(stats.totalDocument / (item.documentFrequency + 1));
    }

    public readonly type = "global";
    public readonly calculationType = "sum";

}