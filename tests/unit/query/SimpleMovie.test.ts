import { SimpleMovie } from "../../../src/Samples/SimpleMovie";

let db = SimpleMovie.load();

describe("query", () => {
  describe("SimpleMovie", () => {
    beforeEach(() => {
      db = SimpleMovie.load();
    });

    test("when using find/where, can retrieve all movie titles", () => {
      let result = db.query(`{
                :find [?movie-title]
                :where [
                    [_ :movie/title ?movie-title]
                ]
            }`);
      expect(result).not.toBeNull();
      if (result) {
        result = result.map(x => x[0]);
        let expected = ["Commando", "The Goonies", "Repo Man"];
        expect(result).toHaveLength(expected.length);
        expect(result).toEqual(expect.arrayContaining(expected));
      }
    });

    test("when using find/where, can find titles for movies released in 1985", () => {
      let result = db.query(`{
        :find [?title]
        :where [
          [?e :movie/release-year 1985]
          [?e :movie/title ?title]
        ]
      }`);
      expect(result).not.toBeNull();
      if (result) {
        result = result.map(x => x[0]);
        let expected = ["The Goonies", "Commando"];
        expect(result).toHaveLength(expected.length);
        expect(result).toEqual(expect.arrayContaining(expected));
      }
    });

    test("when using find/where/in, can find all action/adventure films released in 1985", () => {
      let result = db.query(
        `{
        :find [?t]
        :in [?g ?y]
        :where [
            [?e :movie/title ?t]
            [?e :movie/release-year ?y]
            [?e :movie/genre ?g]
        ]
    }`,
        null,
        "action/adventure",
        1985
      );
      expect(result).not.toBeNull();
      if(result) {
        result = result.map(x => x[0]);
        let expected = ["Commando"];
        expect(result).toHaveLength(expected.length);
        expect(result).toEqual(expect.arrayContaining(expected));
      }
    });
  });
});
