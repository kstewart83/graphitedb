import * as bsql from 'better-sqlite3';
import * as fs from 'fs';

import IAtomStorage from "./IAtomStorage";
import IAtom from "./IAtom";
import GraphiteDB from '../GraphiteDB';

export default class SqliteAtomStorage implements IAtomStorage
{
    readonly dbNamespace: string;
    readonly db: bsql.Database;
    insertAtomStmtObject!: bsql.Statement;
    insertAtomStmtOrder!: bsql.Statement;
    lookupIdentityStmt!: bsql.Statement;
    getIdentityForEntityStmt!: bsql.Statement;
    getMaxT!: bsql.Statement;
    getMaxE!: bsql.Statement;
    updateTransactionField!: bsql.Statement;
    updateOperationField!: bsql.Statement;
    getQueryStmt!: bsql.Statement;
    getAtomCountStmt!: bsql.Statement;
    getIdentitiesStmt!: bsql.Statement;
    getEntityCountStmt!: bsql.Statement;

    constructor(filename?: string, options?:object, dbNamespace: string = ":db")
    {
        this.dbNamespace = dbNamespace;
        let initialize = !filename || (filename && !fs.existsSync(filename));
        if(filename) {
            this.db = new bsql(filename, options);
        } else {
            this.db = new bsql("", {
                memory: true
            });
        }

        if(initialize) {
            this.createAtomsTable();
        }

        this.setStmts();
    }

    private setStmts()
    {
        this.insertAtomStmtObject = 
            this.db.prepare(`INSERT INTO atoms VALUES (@e, @a, @v, @t, @o)`);
        this.insertAtomStmtOrder = 
            this.db.prepare(`INSERT INTO atoms VALUES (?, ?, ?, ?, ?)`);
        this.lookupIdentityStmt =
            this.db.prepare(`SELECT e FROM atoms 
                WHERE (a = ${GraphiteDB.IDENTITY_ATTRIBUTE} AND v = ?)`);
        this.getIdentityForEntityStmt = 
            this.db.prepare(`SELECT v FROM atoms
                WHERE (e = ? AND a = 0)`);
        this.getMaxT =
            this.db.prepare(`SELECT MAX(t) AS max FROM atoms`);
        this.getMaxE = 
            this.db.prepare(`SELECT MAX(e) AS max FROM atoms`);
        this.updateTransactionField = 
            this.db.prepare(`UPDATE atoms SET t = ? WHERE t = ?;`);
        this.updateOperationField = 
            this.db.prepare(`UPDATE atoms SET o = ? WHERE o = ?;`);
        this.getQueryStmt =
            this.db.prepare(`SELECT * FROM atoms WHERE
                (0 = @ex OR e=@e) AND 
                (0 = @ax OR a=@a) AND
                (0 = @vx OR v=@v) AND
                (0 = @tx OR t=@t) AND
                (0 = @ox OR o=@o) AND
                (t <= @dbTx)`);
        this.getAtomCountStmt = 
            this.db.prepare("SELECT Count(*) AS c FROM atoms");
        this.getIdentitiesStmt = 
            this.db.prepare("SELECT e, v FROM atoms WHERE a = 0;");
        this.getEntityCountStmt = 
            this.db.prepare(`SELECT Count(*) as c FROM atoms WHERE e = ?`);
    }

    insertAtom(atom: IAtom) {
        this.insertAtomStmtObject.run(atom);
    }

    getMaxTransactionId(): number {
        return this.getMaxT.get().max;
    }

    getMaxEntityId(): number {
        return this.getMaxE.get().max;
    }

    getQuery(queryObj:any):any {
        return this.getQueryStmt.all(queryObj);
    }

    getEntityIdFromIdentity(identity: string):number {
        return this.lookupIdentityStmt.get(identity).e;
    }

    getIdentityFromEntityId(entityId: number):string|undefined {
        if(entityId == 0) {
            return `${this.dbNamespace}/identity`;
        }

        let id = this.getIdentityForEntityStmt.get(entityId);

        if(id && id.hasOwnProperty('v')) {
            return id.v;
        }
    }

    createAtomsTable()
    {
        this.db.exec(`CREATE TABLE atoms (
            e INTEGER NOT NULL,
            a INTEGER NOT NULL,
            v BLOB,
            t INTEGER NOT NULL,
            o INTEGER NOT NULL
          )`);
    
        this.db.exec(`CREATE INDEX eavt ON atoms (e, a, v, t)`);
        this.db.exec(`CREATE INDEX aevt ON atoms (a, e, v, t)`);
        this.db.exec(`CREATE INDEX vaet ON atoms (v, a, e, t)`);
        this.db.exec(`CREATE INDEX avet ON atoms (a, v, e, t)`);
        this.db.exec(`CREATE INDEX t ON atoms (t, e, a, v)`);
    }

    getIdentities():any {
        return this.getIdentitiesStmt.all();
    }

    getAtomCount():any {
        return this.getAtomCountStmt.get().c;
    }

    getAtoms(sort?:string, direction?:string, offset?:number, limit?:number)
    {
        let sortStr: string = "";
        if(typeof sort != 'undefined') {
            sortStr += `ORDER BY ${sort} `;
            if(typeof direction != 'undefined') {
                sortStr += `${direction} `;
            }
        }

        if(typeof limit != 'undefined') {
            sortStr += `LIMIT ${limit} `
        }

        if(typeof offset != 'undefined') {
            sortStr += `OFFSET ${offset} `
        }
        
        return this.db.prepare(`SELECT * FROM atoms ${sortStr}`).all();
    }

    getEntityCount(entityId:number):number {
        return this.getEntityCountStmt.get(entityId).c;
    }

    cloneFrom(other:IAtomStorage):void {
        if(other instanceof SqliteAtomStorage) {
            this.db.exec(`DROP TABLE atoms`);
            this.createAtomsTable();
            other.getAtoms().forEach((a:IAtom) => {
                this.insertAtom(a);
            });
        } else {
            throw new Error("Trying to clone from incompatible databases");
        }
    }
    
}