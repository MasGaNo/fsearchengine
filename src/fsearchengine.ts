import { Analyzer } from "./analyzer/analyzer";
import { IDocumentToken, IQueryToken } from "./tokenizer/atokenizer";
import { AScore, StatsScoreInterface, TScoreType, TScoreCalculation } from "./score/ascore";
import { ScoreInjectFieldLengthNormInterface, ScoreFieldLengthNorm } from "./score/field-length-norm";
import { ScoreInjectInverseDocumentFrequency, ScoreInverseDocumentFrequency } from "./score/inverse-document-frequency";
import { ScoreInjectTermFrequency, ScoreTermFrequency } from "./score/term-frequency";
import { ScoreFieldPosition, ScoreInjectFieldPosition } from "./score/field-position";
import { ScoreInjectTermCoverage, ScoreTermCoverage } from "./score/term-coverage";
import { ScoreInjectFieldDistance, ScoreFieldDistance } from "./score/field-distance";
import { ScoreInjectTermDistance, ScoreTermDistance } from "./score/term-distance";

export interface IDocument<T> {
    tokens: Array<IDocumentToken>;
    item: T;
}

export interface IDocumentItem<T> {
    item: T;
    score: number;
}

interface IScoreData extends
    ScoreInjectInverseDocumentFrequency,
    ScoreInjectTermDistance,
    ScoreInjectFieldDistance,
    ScoreInjectTermFrequency,
    ScoreInjectFieldLengthNormInterface,
    ScoreInjectFieldPosition,
    ScoreInjectTermCoverage { }

export abstract class FSearchEngine<T, S extends IScoreData = IScoreData> {

    private db: Set<IDocument<T>>;
    private isEngineReady: Promise<any>;

    private static sum = (a: number, b: number) => a + b;
    private static multiply = (a: number, b: number) => a * b;

    private scoringMethod: Partial<{
        [T in TScoreCalculation]: Partial<{ [T in TScoreType]: Array<AScore<IScoreData>> }>
    }>;

    private status: {
        resolve: () => void;
        reject: () => void;
    }

    constructor(
        private analyzer: Analyzer
    ) {
        this.db = new Set();

        this.scoringMethod = {};

        this
            .addScore(new ScoreTermCoverage({ boost: 4 }))
            .addScore(new ScoreTermFrequency())
            .addScore(new ScoreTermDistance({ boost: 1.3 }))
            .addScore(new ScoreFieldLengthNorm({ boost: 1.2 }))
            .addScore(new ScoreFieldPosition())
            .addScore(new ScoreFieldDistance({ boost: 2 }))
            .addScore(new ScoreInverseDocumentFrequency());

        this.status = {
            resolve: () => { },
            reject: () => { }
        };
        this.isEngineReady = new Promise((resolve, reject) => {
            this.status = {
                resolve, reject
            };
        });
    }

    start() {
        this.loadData()
            // .then(db => this.db = db)
            .then(db => this.dbAnalyze(db))
            .then(this.status.resolve)
            .catch(this.status.reject);
    }

    private dbAnalyze(db: Set<T>) {
        const promise: Array<Promise<any>> = [];
        db.forEach((item) => {
            promise.push(
                this.analyzer
                    .analyze(this.getValueOfItem(item), true)
                    .then(tokens => {
                        this.db.add({
                            item,
                            tokens
                        });
                    })
            );
        });

        return Promise.all(promise);
    }

    private matchDocuments(inputTokens: Array<IQueryToken<S>>): Promise<Set<IDocument<T>>> {
        // Shard
        return new Promise((resolve) => {

            const result = new Set<IDocument<T>>();
            this.db.forEach((document) => {
                for (let inputToken of inputTokens) {
                    for (let documentToken of document.tokens) {
                        if (inputToken.validator(documentToken.value)) {
                            return result.add(document);
                        }
                    }
                }
            });

            resolve(result);
        });
    }

    private triggerScore(calculationType: TScoreCalculation, type: TScoreType, scoreData: Partial<IScoreData>, globalStats: StatsScoreInterface) {
        const calculation = this.scoringMethod[calculationType];
        const [defaultValue, operation] = calculationType === 'sum' ? [0, FSearchEngine.sum] : [1, FSearchEngine.multiply];
        if (!calculation) {
            return defaultValue;
        }
        return (type in calculation && calculation[type]!.reduce((currentScore, score) => operation(currentScore, score.calculate(scoreData, globalStats)), defaultValue)) || defaultValue;
    }

    private scoreDocuments(documents: Set<IDocument<T>>, queryTokens: Array<IQueryToken<S>>): Promise<Set<IDocumentItem<T>>> {
        return new Promise((resolve) => {
            const pendingResult = new Set<IDocumentItem<T>>();

            const globalStats: StatsScoreInterface = { totalDocument: documents.size };
            documents.forEach((document) => {

                const pendingDocument: IDocument<T> & IDocumentItem<T> = {
                    item: document.item,
                    tokens: document.tokens,
                    score: 0
                };

                const indexInDocument: Array<number> = [];

                const mentionInDocument = document.tokens.reduce((mention, documentToken, documentTokenIndex) => {
                    return mention + queryTokens.reduce((match, queryToken, queryTokenIndex) => {
                        // for scoring what if the term token in several time in document token ?... dub => adubidubbai
                        const validatorScore = queryToken.validator(documentToken.value);
                        if (validatorScore) {
                            queryToken.stats.documentFrequency = queryToken.stats.documentFrequency + 1 || 1;
                            queryToken.getGlobalScore.then(globalScore => pendingDocument.score += globalScore);
                            indexInDocument.push(documentTokenIndex);

                            pendingDocument.score += FSearchEngine.multiply(
                                this.triggerScore('sum', 'term', { termCoverage: [queryToken.value.length, documentToken.value.length] }, globalStats),
                                this.triggerScore('boost', 'term', {
                                    fieldDistance: [queryTokenIndex, documentTokenIndex],
                                    termDistance: [queryToken.value, documentToken.value]
                                }, globalStats),
                            ) * validatorScore;

                            return match + /* documentToken.mention */ 1;
                        }
                        return match;
                    }, 0);
                }, 0);

                const scoreData: Partial<IScoreData> = {
                    mentionInDocument,
                    numberField: document.tokens.length,
                    fieldPositions: indexInDocument
                };
                // pendingDocument.score += this.scoringMethod['document'].reduce((currentScore, score) => currentScore + score.calculate(scoreData, globalStats), 0);
                pendingDocument.score += FSearchEngine.multiply(
                    this.triggerScore('sum', 'document', scoreData, globalStats),
                    this.triggerScore('boost', 'document', scoreData, globalStats)
                );
                pendingResult.add(pendingDocument);
            });

            queryTokens.forEach((queryToken) => {
                // const tokenGlobalScore = this.scoringMethod['global'].reduce((currentScore, score) => currentScore + score.calculate(queryToken.stats, globalStats), 0);
                const tokenGlobalScore = FSearchEngine.multiply(
                    this.triggerScore('sum', 'global', queryToken.stats, globalStats),
                    this.triggerScore('boost', 'global', queryToken.stats, globalStats)
                );
                queryToken.applyGlobalScore(tokenGlobalScore);
            });

            // Because applyGlobalScore will apply on next microtask...
            Promise.resolve().then(() => {
                const result = new Set<IDocumentItem<T>>();
                pendingResult.forEach((pendingDocument) => {
                    result.add({
                        item: pendingDocument.item,
                        score: pendingDocument.score
                    });
                });

                resolve(result);
            });
        });
    }

    public query(input: string): Promise<Set<IDocumentItem<T>>> {
        let queryTokens: Array<IQueryToken<S>>;
        return this.isEngineReady.
            then(() => this.analyzer.analyze<S, false>(input, false))
            .then((inputTokens) => this.matchDocuments(queryTokens = inputTokens))
            .then((documents) => this.scoreDocuments(documents, queryTokens));
    }

    private addScore(score: AScore<IScoreData>) {
        if (!(score.calculationType in this.scoringMethod)) {
            this.scoringMethod[score.calculationType] = {};
        }
        const calculationType = this.scoringMethod[score.calculationType]!;
        if (!(score.type in calculationType)) {
            calculationType[score.type] = [];
        }

        calculationType![score.type]!.push(score);
        return this;
    }

    protected abstract loadData(): Promise<Set<T>>;
    protected abstract getValueOfItem(item: T): string;

}
