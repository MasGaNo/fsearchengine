# fsearchengine
Fast Basic JavaScript Search Engine

## Description
At this moment, this project is just a `POC` of `Search Engine` in JavaScript and fully oriented for a specific business usage.
There are definitely lot of things to do before to consider it enough `stable` to be used in `production`.

## How to try
```sh
npm install && npm start
```

Then open in browser `./dist/index.html`

Try to write some location in different way:
```sh
joumerah vilague triengue # should provide "Jumeirah Village Triangle"
```
```sh
arebien fanche # should provide "Arabian Ranches"
```
...

## Usage example
Example of usage from `src/index.ts`:
```ts
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
    }
}

export class AutocompleteLocations extends FSearchEngine<ILocation> {
    protected loadData() {
        return Promise.resolve().then(() => new Set<ILocation>(locationsJSON as Array<ILocation>));
    }

    protected getValueOfItem(item: ILocation): string {
        return item.attributes.name;
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
        });
    };

    const ulResults = document.querySelector('#output')! as HTMLUListElement;
    function dispatchResult(result: Array<IDocumentItem<ILocation>>) {
        ulResults.innerHTML = result.slice(0, 20).map((item) => (
            `<li>${item.item.attributes.name} (${item.score})</li>`
        )).join('');
    }
})();
```

## TODO

### Clean
 * [ ] Remove all configuration and boost-tweak from the core 
 * [ ] Move the `index.ts` demo file to an independent folder
 * [ ] Improve the implementation of `stats` extraction needed by the `score` heuristic from the `fsearchengine.ts` file.
 * [ ] Add comments...
 * [ ] Add tests...
 * [ ] Better docs (Analyzer creation, Tokenizer creation, Filter creation, ...), example and README...
 * [ ] Better `npm-scripts`.

### Improvement
 * [ ] Add more scoring heuristic
 * [ ] Add more tokenizer
 * [ ] Add concept of synonim/similarity
 * [ ] Add phonetic similarity
 * [ ] Add synonym dictionary (based on input language - make it configurable)
 * [ ] Split and use Worker
 * [ ] Implement the duplicate token from document to reduce number of duplicate matching
 * [ ] Memoize the validator creation to avoid too many `function` creation (`tokenizer.ts`)
 * [ ] Add custom scoring based on some attributes of documents (popularity attribute, ...)
 * [ ] Provide a way to search into different fields of the model
 * [ ] Provide a way to configure matching rules (boolean operator, must, should, ...)