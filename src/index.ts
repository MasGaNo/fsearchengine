import locationsJSON from "./data/locations.json";
import { FSearchEngine, IDocumentItem } from "./fsearchengine";
import { AnalyzerStandard } from "./analyzer/variant/standard.js";

export interface ILocation {
    "type": string;
    "id": string;
    "attributes": {
        "name": string;
        "path": string;
        "path_name": string;
        "abbreviation": string;
        "score"?: number;
    }
}

export class AutocompleteLocations extends FSearchEngine<ILocation> {
    protected loadData() {
        return Promise.resolve().then(() => new Set<ILocation>(locationsJSON as Array<ILocation>));
    }

    protected getValueOfItem(item: ILocation): string {
        return item.attributes.name;
    }

    protected customScoreFunction(data: IDocumentItem<ILocation>) {
        return data.score * (data.item.attributes.score || 1);
    }

}

(function() {
    const autocomplete = new AutocompleteLocations(new AnalyzerStandard());
    autocomplete.start();

    const queryInput = document.querySelector('#query')! as HTMLInputElement;
    let queryId = 0;
    queryInput.onkeyup = () => {
        dispatchResult([]);
        const queryValue = queryInput.value;
        if (queryValue.length < 2) {
            return;
        }

        const currentQueryId = ++queryId;


        const timeLabel = `SE_loc_${currentQueryId}`;
        console.time(timeLabel);
        autocomplete.query(queryValue).then((result) => {
            if (currentQueryId !== queryId) {
                console.timeEnd(timeLabel);
                return;
            }
            const arrResult = Array.from(result);
            arrResult.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return a.item.attributes.name.toLowerCase().localeCompare(b.item.attributes.name.toLowerCase());
            });

            console.timeEnd(timeLabel);
            dispatchResult(arrResult);

            const item = arrResult.find((item) => item.item.attributes.name === 'Dubai Marina');
            if (!!item) {
                console.log(arrResult.indexOf(item), item);
            } 
        });
    };

    const ulResults = document.querySelector('#output')! as HTMLUListElement;
    function dispatchResult(result: Array<IDocumentItem<ILocation>>) {
        ulResults.innerHTML = result.slice(0, 20).map((item) => (
            `<li>${item.item.attributes.name} (${item.score})</li>`
        )).join('');
    }
})();