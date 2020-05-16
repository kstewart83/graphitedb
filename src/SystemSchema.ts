export const SystemSchema = {
    attribute: {
        type: "enum",
        cardinality: "one",
        documentation: "Defines an attribute type",
        enums: ["nil", "keyword", "string", "bytes", "boolean", "number",
            "class", "entity", "instant", "enum", "reference"]
    },
    cardinality: {
        type: "enum",
        cardinality: "one",
        documentation: "Specifies if an attribute can contain one or many values",
        enums: ["one", "many"]
    },
    operation: {
        type: "enum",
        cardinality: "one",
        documentation: "Specifies the operation for an atom within a transaction",
        enums: ["assert", "retract"]
    },
    history: {
        type: "number",
        documentation: "Specifies how many histories to maintain for an attribute",
        cardinality: "one"
    },
    enum: {
        type: "entity",
        documentation: "Specifies that an attribute only contains certain entities as values",
        cardinality: "many"
    },
    component: {
        type: "entity",
        cardinality: "one"
    },
    unique: {
        type: "enum",
        cardinality: "one",
        enums: ["identity", "value"]
    },
    'feature/required': {
        type: "class",
        cardinality: "many",
        documentation: "Points to an attribute which must be required for a class"
    },
    'feature/optional': {
        type: "class",
        cardinality: "many",
        documentation: "Points to an attribute which is optional for a class"
    },
    'feature/prohibited': {
        type: "class",
        cardinality: "many",
        documentation: "Points to an attribute which cannot be allowed for a class"
    },
    class: {
        type: "entity",
        cardinality: "many"
    },
    'class/mode': {
        type: "enum",
        cardinality: "one",
        enums: ["restricted", "strict", "relaxed", "exclusive"]
    },
    documentation: {
        type: "string",
        cardinality: "one"
    },
    'transaction/timestamp': {
        type: "number",
        cardinality: "one",
        documentation: "Records the timestamp of the transaction"
    },
    'transaction/semantic-id': {
        type: "bytes",
        cardinality: "one",
        documentation: "A value which represents the E,A,V values in this transaction"
    }
}