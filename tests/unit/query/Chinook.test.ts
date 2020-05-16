import { Chinook } from '../../../src/Samples/Chinook';

let db = Chinook.load();

describe('query', () => {
    describe('Chinook', () => {
        test.todo('when querying with extra where clauses, database should not return extra values');
        /*
        {
        :find [?x]
        :where [
            [?artist :artist/name "AC/DC"]
            [?album :album/artist ?artist]
            [?album :album/title ?x]
            [?track :track/album ?album]
            [?track :track/name ?y]
            [?track :track/milliseconds ?m]
            [?track :track/genre ?genre]
            [?genre :genre/name ?g]
        ]
        }*/
    });
});