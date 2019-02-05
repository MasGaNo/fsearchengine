import { AScore, StatsScoreInterface } from "./ascore";

export interface ScoreInjectFieldLengthNormInterface {
    /**
     * Number of term in field
     */
    numberField: number;
}

/**
 * Length of the field where the term take place. If the field is short, so the term fit almost the field. The weight increase.
 */
export class ScoreFieldLengthNorm extends AScore<ScoreInjectFieldLengthNormInterface> {
    protected applyFormula(item: ScoreInjectFieldLengthNormInterface, stats: StatsScoreInterface): number {
        return 1 / Math.sqrt(item.numberField);
    }

    public readonly type = "document";
    public readonly calculationType = "sum";
}