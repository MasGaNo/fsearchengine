import { AScore, StatsScoreInterface } from "./ascore";

export interface ScoreInjectFieldDistance {
    /**
     * Distance from query token and document token. [0]: query token. [1]: document token.
     */
    fieldDistance: [number, number];
}

/**
 * Position in document. If the distance is close to 0, the weight increase.
 */
export class ScoreFieldDistance extends AScore<ScoreInjectFieldDistance> {
    protected applyFormula(item: ScoreInjectFieldDistance): number {
        return 1 / (1 + Math.sqrt(Math.abs(item.fieldDistance[0] - item.fieldDistance[1])));
    }

    public readonly type = "term";
    public readonly calculationType = "boost";
}