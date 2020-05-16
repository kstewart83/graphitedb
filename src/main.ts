import GraphiteDB from './GraphiteDB';

main();

function main()
{
    let db = new GraphiteDB();

    db.transact(`{:tx-attribute
        {:db/identity :movie/title
            :db/attribute :db.attribute/string
            :db/cardinality :db.cardinality/one
            :db/documentation "The title of the movie"}}`);
    
    db.transact(`{:tx-attribute
        [{:db/identity :movie/genre
          :db/attribute :db.attribute/string
          :db/cardinality :db.cardinality/one
          :db/documentation "The genre of the movie"}

         {:db/identity :movie/release-year
          :db/attribute :db.attribute/number
          :db/cardinality :db.cardinality/one
          :db/documentation "The year the movie was released in theaters"}]}`);

    db.transact(`{:tx-data
        {:movie/title "The Goonies"
         :movie/release-year 1985}}`);

    db.transact(`{:tx-data
        [{:movie/title "Commando"
          :movie/genre "action/adventure"
          :movie/release-year 1987}

         {:movie/title "Repo Man"
          :movie/genre "punk dystopia"
          :movie/release-year 1984}]}`);

    db.transact(`{:tx-data
        [{:db/e 49 :movie/genre "action/adventure"}
        ]}`);

    console.log(db.query(`{
        :find [?t]
        :in [?g ?y]
        :where [
            [?e :movie/title ?t]
            [?e :movie/release-year ?y]
            [?e :movie/genre ?g]
        ]
    }`, null, "action/adventure", 1985));
    
    console.log("q1: ", db.query(`{:find [?e] :where [[?e :movie/title]]}`));
    console.log(db.query(`{:find [?movie-title] :where [[_ :movie/title ?movie-title]]}`))
    
    console.log(db.query(`{
        :find [?title]
        :where [
            [?e :movie/title ?title]
            [?e :movie/release-year 1985]
        ]}`));

    console.log(db.query(`{
        :find [?title]
        :where [
            [?e :movie/title ?title]
            [?e :movie/genre "action/adventure"]
        ]}`));

    console.log(db.query(`{
        :find [?title ?year ?genre]
        :where [[?e :movie/title ?title] 
                [?e :movie/release-year ?year] 
                [?e :movie/genre ?genre] 
                [?e :movie/release-year 1985]]}`))
}