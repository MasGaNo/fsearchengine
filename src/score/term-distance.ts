import { AScore, StatsScoreInterface } from "./ascore";

export interface ScoreInjectTermDistance {
    /**
     * Distance from query token and document token. [0]: query token. [1]: document token.
     */
    termDistance: [string, string];
}

/**
 * Position in document. If the distance is close to 0, the weight increase.
 */
export class ScoreTermDistance extends AScore<ScoreInjectTermDistance> {
    protected applyFormula(item: ScoreInjectTermDistance): number {

        const [queryValue, documentValue] = item.termDistance;

        // we take the closest one to increase score
        return 1 / (1 + Math.sqrt(documentValue.indexOf(queryValue)));
    }

    public readonly type = "term";
    public readonly calculationType = "boost";
}