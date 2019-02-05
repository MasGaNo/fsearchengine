export interface StatsScoreInterface {
    totalDocument: number;
}

interface ScoreOptionsInterface {
    boost: number;
}

export type TScoreType = 'term'|'document'|'global';
export type TScoreCalculation = 'sum' | 'boost';

export abstract class AScore<T> {

    private static readonly defaultOptions: ScoreOptionsInterface = {
        boost: 1
    };

    private options: ScoreOptionsInterface;

    constructor(options?: Partial<ScoreOptionsInterface>) {
        this.options = Object.assign({}, AScore.defaultOptions, options);
    }

    public calculate(item: Partial<T>, stats: StatsScoreInterface) {
        return this.applyFormula(item, stats) * this.options.boost;
    }

    protected abstract applyFormula(item: Partial<T>, stats: StatsScoreInterface): number;
    public abstract get type(): TScoreType;
    public abstract get calculationType(): TScoreCalculation;
}