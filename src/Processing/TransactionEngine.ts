import * as edn from 'jsedn';
import * as short from 'short-uuid';

import IAtomStorage from "../Storage/IAtomStorage";
import IAtom from '../Storage/IAtom';

export default class TransactionEngine {
    readonly dbOps:IAtomStorage;
    readonly dbNamespace:string;

    constructor(dbOps:IAtomStorage, dbNamespace:string) {
        this.dbOps = dbOps;
        this.dbNamespace = dbNamespace;
    }

    transact(_txData: object | string) {
        let txData: object;
        if(typeof _txData === "string") {
            txData = edn.toJS(edn.parse(_txData));
        } else {
            txData = _txData;
        }
        
        let decomp = this.decomposeTransaction(txData);
        this.processTransaction(decomp);
    }
    
    private decomposeTransaction(txData: object) : object[]
    {
        let result: object[] = [];

        if(txData[`:tx-attribute`]) {
            let schema = txData[`:tx-attribute`];
            if(Array.isArray(schema)) {
                schema.forEach(attr => {
                    result = result.concat(this.createAttributes(attr));
                });
            } else if (typeof schema === "object") {
                result = result.concat(this.createAttributes(schema));
            }
        }

        if(txData[`:tx-data`]) {
            let data = txData[`:tx-data`];
            if(Array.isArray(data)) {
                data.forEach(d => {
                    result = result.concat(this.createData(d));
                });
            } else if (typeof data === "object") {
                result = result.concat(this.createData(data));
            }
        }

        return result;
    }

    getNextEntityId() {
        return this.dbOps.getMaxEntityId() + 1;
    }

    private processTransaction(partials: object[]) {
        let entityStrings = {};
        let nextEntityId = this.getNextEntityId();
        let txId = nextEntityId++;
        partials.forEach((p:any) => {
            if(typeof p.e === 'string') {
                if(p.e.charAt(0) === ":") {
                    throw "Not implemented...look for unique keyword";
                } else {
                    if(!entityStrings.hasOwnProperty(p.e)) {
                        entityStrings[p.e] = nextEntityId++;
                    }
                    p.e = entityStrings[p.e];
                }
            }
            
            p.t = txId;
        });

        partials.forEach(p => {
            this.dbOps.insertAtom(p as IAtom);
            //this.insertAtomStmtObject.run(p);
        });

        this.createTransaction({
            id: txId,
            timestamp: Date.now()
        })
    }

    createTransaction(data: any) {
        let aId = this.dbOps.getEntityIdFromIdentity(`${this.dbNamespace}.transaction/timestamp`);
        let oId = this.dbOps.getEntityIdFromIdentity(`${this.dbNamespace}.operation/assert`);
        this.dbOps.insertAtom({
            e: data.id, 
            a: aId, 
            v: data.timestamp, 
            t: data.id, 
            o: oId});
    }

    createData(data: any): object[] {
        if(Array.isArray(data)) {
            return this.createDataFromArray(data);
        } else {
            return this.createDataFromObject(data);
        }
    }

    private createDataFromArray(data: any[]): object[] {
        let result: object[] = [];

        if(data[0] === `${this.dbNamespace}.operation/retract`) {
            // look for existing entity
            let count = this.dbOps.getEntityCount(data[1]);
            if(count == 0) {
                return result;
            }
        }
        
        if(data.length === 4) {
            let oId = this.dbOps.getEntityIdFromIdentity(data[0]);
            let eId = data[1];
            let aId = this.dbOps.getEntityIdFromIdentity(data[2]);
            result.push({e: eId, a: aId, v: data[3], o: oId})
        }

        return result;
    }

    private createDataFromObject(data: object): object[] {
        let result: object[] = [];

        let eId:string|number;
        if(data.hasOwnProperty(`${this.dbNamespace}/e`)) {
            eId = data[`${this.dbNamespace}/e`];
            delete data[`${this.dbNamespace}/e`];
        } else {
            eId = short.generate();
        }
        Object.keys(data).forEach(k => {
            let aId = this.dbOps.getEntityIdFromIdentity(k);
            let oId = this.dbOps.getEntityIdFromIdentity(`${this.dbNamespace}.operation/assert`);
            result.push({e: eId, a: aId, v: data[k], o: oId});
        });

        return result;
    }

    createAttributes(schema: object): object[] {

        let identity = schema[`${this.dbNamespace}/identity`];
        let attrType = schema[`${this.dbNamespace}/attribute`];
        let cardinality = schema[`${this.dbNamespace}/cardinality`];
        let doc = schema[`${this.dbNamespace}/documentation`];
        let history = schema[`${this.dbNamespace}/history`];

        if(typeof identity === 'undefined' || typeof attrType === 'undefined' ||
            typeof cardinality === 'undefined') {
                return [];
        }

        let result: object[] = [];

        let eId = short.generate();
        let iId = this.dbOps.getEntityIdFromIdentity(`${this.dbNamespace}/identity`);;
        let aId = this.dbOps.getEntityIdFromIdentity(`${this.dbNamespace}/attribute`);;
        let cId = this.dbOps.getEntityIdFromIdentity(`${this.dbNamespace}/cardinality`);
        let oId = this.dbOps.getEntityIdFromIdentity(`${this.dbNamespace}.operation/assert`);
        let attrTypeId = this.dbOps.getEntityIdFromIdentity(attrType);
        let cardValId = this.dbOps.getEntityIdFromIdentity(cardinality);

        result.push({e: eId, a: iId, v: identity, o: oId, m: null});
        result.push({e: eId, a: aId, v: attrTypeId, o: oId, m: null});
        result.push({e: eId, a: cId, v: cardValId, o: oId, m: null});

        if(typeof doc !== 'undefined') {
            let dId = this.dbOps.getEntityIdFromIdentity(`${this.dbNamespace}/documentation`);
            result.push({e: eId, a: dId, v: doc, o: oId, m: null});
        }

        if(typeof history !== 'undefined') {
            let hId = this.dbOps.getEntityIdFromIdentity(`${this.dbNamespace}/history`);
            result.push({e: eId, a: hId, v: history, o: oId, m: null});
        }

        return result;
    }
}