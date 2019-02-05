import { AScore, StatsScoreInterface } from "./ascore";
import { ScoreInjectFieldLengthNormInterface } from "./field-length-norm";

export interface ScoreInjectFieldPosition extends ScoreInjectFieldLengthNormInterface {
    /**
     * List of matching position.
     */
    fieldPositions: Array<number>;
}

/**
 * Position in document. If the distance is close to 0, the weight increase.
 */
export class ScoreFieldPosition extends AScore<ScoreInjectFieldPosition> {
    protected applyFormula(item: ScoreInjectFieldPosition): number {
        return item.fieldPositions.reduce((currentScore, currentPosition) => {
            return currentScore + (item.numberField - currentPosition) / item.numberField;
        }, 0) / item.numberField;
    }

    public readonly type = "document";
    public readonly calculationType = "sum";

}