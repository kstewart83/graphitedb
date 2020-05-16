import * as path from 'path';

import INewSample from './INewSample';
import SampleLoader from './SampleLoader';
import GraphiteDB from '..';

export class SimpleMovie implements INewSample {

    static create():void {
        SampleLoader.createDbFromNew(
            new SimpleMovie(),
            path.join(__dirname, "..", "..", "data", "formatted", "sqlite", "simple-movie.gdb")
        )
    }

    static load(): GraphiteDB {
        return new GraphiteDB(
            path.join(__dirname, "..", "..", "data", "formatted", "sqlite", "simple-movie.gdb")
        ).cloneToMemory();
    }

    getSchema():string {
        return `{:tx-attribute
            [{:db/identity :movie/title
              :db/attribute :db.attribute/string
              :db/cardinality :db.cardinality/one
              :db/documentation "The title of the movie"}
                
             {:db/identity :movie/genre
              :db/attribute :db.attribute/string
              :db/cardinality :db.cardinality/one
              :db/documentation "The genre of the movie"}
    
             {:db/identity :movie/release-year
              :db/attribute :db.attribute/number
              :db/cardinality :db.cardinality/one
              :db/documentation "The year the movie was released in theaters"}]}`;
    }

    getData():string {
        return `{:tx-data
            [{:movie/title "Commando"
              :movie/genre "action/adventure"
              :movie/release-year 1985}

             {:movie/title "The Goonies"
              :movie/release-year 1985}
    
             {:movie/title "Repo Man"
              :movie/genre "punk dystopia"
              :movie/release-year 1984}]}`;
    }
}