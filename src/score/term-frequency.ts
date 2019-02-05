import { AScore } from "./ascore";

export interface ScoreInjectTermFrequency {
    /**
     * Frequence of a term in a Document.
     */
    mentionInDocument: number;
}

/**
 * Frequence of a term in a Document. The higher it is, the weighter the score will be.
 */
export class ScoreTermFrequency extends AScore<ScoreInjectTermFrequency> {
    protected applyFormula(item: ScoreInjectTermFrequency): number {
        return Math.sqrt(item.mentionInDocument);
    }    
    
    public readonly type = "document";
    public readonly calculationType = "sum";
}