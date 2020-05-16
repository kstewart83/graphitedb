import * as short from 'short-uuid';
import * as fs from 'fs';

import {SystemSchema} from './SystemSchema';
import IAtomStorage from './Storage/IAtomStorage';
import IAtom from './Storage/IAtom';
import SqliteAtomStorage from './Storage/SqliteAtomStorage';
import QueryEngine from './Processing/QueryEngine';
import TransactionEngine from './Processing/TransactionEngine';

export default class GraphiteDB {
    readonly dbNamespace: string;
    readonly dbOps: IAtomStorage;
    readonly qEngine: QueryEngine;
    readonly tEngine: TransactionEngine;
    public static readonly IDENTITY_ATTRIBUTE: number = 0;

    constructor(filename?: string, options?:object, dbNamespace: string = ":db") {
        this.dbNamespace = dbNamespace;
        
        let initialize = !filename || (filename && !fs.existsSync(filename));
        this.dbOps = new SqliteAtomStorage(filename, options, dbNamespace);
        this.qEngine = new QueryEngine(this.dbOps, this.dbNamespace);
        this.tEngine = new TransactionEngine(this.dbOps, this.dbNamespace);
        
        if(initialize) {
            this.initAtomsTable();
            this.transactDatabaseSchema();
            this.transactDatabaseEntity();
        }
    }

    public query(qData: object | string, dbTx:number|null = null, ...params: any[]) {
        return this.qEngine.query(qData, dbTx, ...params);
    }

    public transact(txData: object | string) {
        return this.tEngine.transact(txData);
    }

    public cloneToMemory():GraphiteDB {
        let memDb = new GraphiteDB();
        memDb.copyFromDb(this);
        return memDb;
    }

    public getMaxTransactionId(): number {
        return this.dbOps.getMaxTransactionId();
    }

    public getIdentities() {
        return this.dbOps.getIdentities();
    }

    public getAtomCount() {
        return this.dbOps.getAtomCount();
    }

    public getAtoms(sort?:string, direction?:string, offset?:number, limit?:number) {
        return this.dbOps.getAtoms(sort, direction, offset, limit);
    }

    private copyFromDb(db:GraphiteDB):void {
        this.dbOps.cloneFrom(db.dbOps);
    }

    private transactDatabaseSchema() {
        let dbn = this.dbNamespace;
        this.tEngine.transact(`{:tx-attribute
           [{${dbn}/identity ${dbn}/database-id
             ${dbn}/attribute ${dbn}.attribute/string
             ${dbn}/cardinality ${dbn}.cardinality/one
             ${dbn}/documentation "A unique identifier for the database"}
            
            {${dbn}/identity ${dbn}/next-entity-id
             ${dbn}/attribute ${dbn}.attribute/number
             ${dbn}/cardinality ${dbn}.cardinality/one
             ${dbn}/documentation "A unique identifier for the next entity"}]}`);
    }

    private transactDatabaseEntity()
    {
        let dbn = this.dbNamespace;
        this.tEngine.transact(`{:tx-data
            {${dbn}/identity ${dbn}/metadata
             ${dbn}/database-id "${short.generate()}"
             ${dbn}/next-entity-id "${this.tEngine.getNextEntityId()}"}}`);
    }

    private initAtomsTable()
    {
        let dbn = this.dbNamespace;
        let atoms:IAtom[] = [];
        let eId = 0;
        let tmpOpId = -1;
        let tmpTxId = -1;

        let insertAtomOrdered = (e: number, a: number, v: any, t: number, o: number) => {
            atoms.push({e: e, a: a, v: v, t: t, o: o});
        }

        let getNextEntityId = () => {
            eId++;
            return eId;
        }

        insertAtomOrdered(eId, GraphiteDB.IDENTITY_ATTRIBUTE, `${dbn}/identity`, tmpTxId, tmpOpId);
        let identityToEntity = {};

        let getName = (k:string) => {
            if(k.indexOf('/') > -1) {
                return `${dbn}.${k}`;
            }
            return `${dbn}/${k}`;
        }

        let getEnumName = (k:string, e:string) => {
            if(k.indexOf('/') > -1) {
                return `${dbn}.${k.replace('/', '.')}/${e}`
            }
            return `${dbn}.${k}/${e}`;
        }

        Object.keys(SystemSchema)
            .forEach(k => {
                let id = getNextEntityId();
                let name = getName(k);
                identityToEntity[name] = id;
                insertAtomOrdered(id, 0, name, tmpTxId, tmpOpId);
            });

        Object.keys(SystemSchema)
            .forEach(k => {
                let enums = SystemSchema[k].enums;
                if(enums) {
                    for (const v in enums) {
                        let id = getNextEntityId();
                        let name = getEnumName(k, enums[v]);
                        identityToEntity[name] = id;
                        insertAtomOrdered(id, 0, name, tmpTxId, tmpOpId);
                    }              
                }
            });
        
        Object.keys(SystemSchema)
            .forEach(k => {
                let name = getName(k);
                let eId = identityToEntity[name];
                let aId = identityToEntity[`${dbn}/attribute`];
                let type = SystemSchema[k].type;
                let vId = identityToEntity[`${dbn}.attribute/${type}`];
                insertAtomOrdered(eId, aId, vId, tmpTxId, tmpOpId);

                if(type === "enum") {
                    aId = identityToEntity[`${dbn}/enum`];
                    let enums = SystemSchema[k].enums;
                    if(enums) {
                        for(const v in enums) {
                            let name = getEnumName(k, enums[v]);
                            vId = identityToEntity[name];
                            insertAtomOrdered(eId, aId, vId, tmpTxId, tmpOpId);
                        }
                    }
                }

                let cardinality = SystemSchema[k].cardinality;
                aId = identityToEntity[`${dbn}/cardinality`];
                vId = identityToEntity[`${dbn}.cardinality/${cardinality}`];
                insertAtomOrdered(eId, aId, vId, tmpTxId, tmpOpId);

                let doc = SystemSchema[k].documentation;
                if(typeof doc !== "undefined") {
                    aId = identityToEntity[`${dbn}/documentation`];
                    insertAtomOrdered(eId, aId, doc, tmpTxId, tmpOpId);
                }
            });

            let txId = getNextEntityId();
            let oId = -1;
            atoms.forEach(a => {
                if(a.v === `${this.dbNamespace}.operation/assert`) {
                    oId = a.e;
                }
            });
            if(oId == -1) {
                throw new Error("No assert operation entity found");
            }

            atoms = atoms.map(a => {
                a.t = txId;
                a.o = oId;
                return a;
            });

            atoms.forEach(a => {
                this.dbOps.insertAtom(a);
            });

            this.tEngine.createTransaction({
                id: txId,
                timestamp: Date.now()
            });
    }
}
