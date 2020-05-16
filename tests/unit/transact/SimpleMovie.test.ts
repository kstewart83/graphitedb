import GraphiteDB from "../../../src/GraphiteDB";
import { SimpleMovie } from "../../../src/Samples/SimpleMovie";

let db: GraphiteDB;

describe("transactions", () => {
  describe("SimpleMovie", () => {
    beforeEach(() => {
      db = SimpleMovie.load();
    });

    test("when transacting map form, single entity without temp ids, a new entity is created", () => {
      let oldMax = db.getMaxTransactionId();
      db.transact(`{:tx-data
        {:movie/title "Ghostbusters"
         :movie/genre "action/comedy"
        }}`);
      let qResult = db.query(`{
        :find [?g]
        :where [
          [?e :movie/title "Ghostbusters"]
          [?e :movie/genre ?g]
        ]
      }`);
      expect(oldMax).toBeLessThan(db.getMaxTransactionId());
      expect(qResult).not.toBeNull();
      if (qResult) {
        expect(qResult[0][0]).toBe("action/comedy");
      }
    });

    test("when transacting list form and adding multiple facts with temp id, facts are asserted in database", () => {
      db.transact(`{:tx-data
        [
          [:db.operation/assert "gb" :movie/title "Ghostbusters"]
          [:db.operation/assert "gb" :movie/genre "action/comedy"]
        ]}`);
      let qResult = db.query(`{
        :find [?g]
        :where [
          [?e :movie/title "Ghostbusters"]
          [?e :movie/genre ?g]
        ]
      }`);
      expect(qResult).not.toBeNull();
      if (qResult) {
        expect(qResult[0][0]).toBe("action/comedy");
      }
    });

    test("when retracting attribute/value pair, fact is retracted in database", () => {
      let result = db.query(`{
        :find [?e]
        :where [
          [?e :movie/title "The Goonies"]
        ]
      }`);

      expect(result).not.toBeNull();
      if (result) {
        db.transact(`{:tx-data
          [
            [:db.operation/retract ${result[0][0]} :movie/title "The Goonies"]
            [:db.operation/retract ${result[0][0]} :movie/release-year "1985"]
          ]}`);

        result = db.query(`{
            :find [?title]
            :where [
              [?e :movie/release-year 1985]
              [?e :movie/title ?title]
            ]
          }`);
        expect(result).not.toBeNull();
        if (result) {
          result = result.map(x => x[0]);
          let expected = ["Commando"];
          expect(result).toHaveLength(expected.length);
          expect(result).toEqual(expect.arrayContaining(expected));
        }
      }
    });

    test("when asserting new fact and retracting old attribute/value pair, new fact is asserted in database", () => {
      let result = db.query(`{
        :find [?e]
        :where [
          [?e :movie/title "The Goonies"]
        ]
      }`);

      expect(result).not.toBeNull();
      if (result) {
        db.transact(`{:tx-data
          [
            [:db.operation/assert ${result[0][0]} :movie/title "The Goonies 2"]
            [:db.operation/retract ${result[0][0]} :movie/title "The Goonies"]
          ]}`);

        result = db.query(`{
            :find [?title]
            :where [
              [?e :movie/release-year 1985]
              [?e :movie/title ?title]
            ]
          }`);
        expect(result).not.toBeNull();
        if (result) {
          result = result.map(x => x[0]);
          let expected = ["Commando", "The Goonies 2"];
          expect(result).toHaveLength(expected.length);
          expect(result).toEqual(expect.arrayContaining(expected));
        }
      }
    });

    test("after transacting new entity, a query against previous database will not include new entity", () => {
      let oldMax = db.getMaxTransactionId();
      db.transact(`{:tx-data
        {:movie/title "Ghostbusters"
         :movie/genre "action/comedy"
        }}`);
      let qResult = db.query(`{
        :find [?g]
        :where [
          [?e :movie/title "Ghostbusters"]
          [?e :movie/genre ?g]
        ]
      }`, oldMax);
      expect(oldMax).toBeLessThan(db.getMaxTransactionId());
      expect(qResult).not.toBeNull();
      expect(qResult).toHaveLength(0);
    });
  });
});
