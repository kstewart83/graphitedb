# Notes

## Invariants

The following invariants need to be checked on all write transactions to ensure they are maintained:

* Within a transaction, no two atoms are exactly the same in terms of [E,A,V]
* `:db/identity` attributes have unique `V` values in the database
* Entities with the `:db/attribute` attribute also have `:db/identity` and
  `:db/cardinality` attributes
* Attributes with the `:db/unique` attribute set to `:db.unique/identity` have unique [A, V] pairings in the database
* Attributes with the `:db.cardinality/one` set will only have one asserted value


## Misc Notes

* Database specific 0 history attribute for next entity ID
* Composite brings together mutually compatible shapes
* Composites can reference other composites
* Create a user with a public/private key pair -- user signs transactions
* Adding a semantic value to the transaction that would represent the specific
  atoms transacted. Creates a unique key when combined with the timestamp. This
  will probably be its own column in the atom, but maybe not indexed.
* Use the Snowball consensus algorithm to distribute the transaction mechanism.
  The peers in the system use transactions and Snowball to reach consensus if
  the transaction should be included in the overall ordering. Consensus should
  be reached on a semantic ID for the "before" database, the transaction, and
  the timestamp.
* Attribute constraints (max, min, length, regex, user-defined)
   - Have to think about built-in versus allowing some custom logic in something like TypeScript
* Derived attributes: these are attributes which are calculated from other attributes from the same entity. An example would be age. You wouldn't want to store age directly because it changes over time. You'd instead store date of birth, and then create a derived attribute called age based on date of birth. Like attribute constraints, there could be built in types for common scenarios like age, and then allow custom logic for more specific cases.
* Execute custom logic via NodeJS (see also low.js or Duktape)
* Use WebAssembly as the VM layer for custom functions
   -- Rust compiles to WASM
   -- TypeScript compiles to WASM via AssemblyScript
   -- Life is a WASM interpreter written in Go and portable to all Go platforms
* External / Internal references
   -- An internal reference points to an entity within the current database
   -- An external reference will need an external ID (perhaps cryptographic), a transaction ID, and entity
   -- Perhaps integrate with the idea of a partition
   -- A database ID would correspond to a table name
   -- Alternately, an external reference can point to an entity within the DB which can have multiple properties for deferencing

## Initial Setup
 * [ ] Establish system attributes
 * [ ] Establish database metadata entity

## Transactions
 * [ ] Add new attribute
    * [ ] Add new attribute with history
    * [ ] Add new attribute with documentation
    * [ ] Add new attribute with enums
 * [ ] Add one new entity
    * [ ] Add one new entity with tempid
 * [ ] Add multiple entities
    * [ ] Add multiple entities with tempid
 * [ ] Update existing entity with new attribute via entity number
 * [ ] Update existing entity with new attribute via identity
 * [ ] Update existing entity with new attribute via lookup reference
 * [ ] Update existing entity overwriting value and with no history attribute
 * [ ] Update existing entity overwriting value with 0 set for history
 * [ ] Update existing entity overwriting value with non-zero set for history
 * [ ] Transact nested maps
 * [ ] Transact features
 * [ ] Transact classes

 ## Query

 ## Links

 * https://tonsky.me/blog/unofficial-guide-to-datomic-internals/
 * GraphQL + Datomic: https://www.nikolasgoebel.com/2018/06/26/a-query-language.html

 {
    :find {:album ?m :tracks [?t]}
 }