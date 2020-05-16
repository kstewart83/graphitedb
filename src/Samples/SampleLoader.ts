import * as bsql from 'better-sqlite3';

import GraphiteDB from '../GraphiteDB';
import IExistingSample from './IExistingSample';
import INewSample from './INewSample';

export default class SampleLoader {

    static createDbFromExisting(sample:IExistingSample, srcDbPath:string, tgtDbPath?:string)
    {
        let db = new GraphiteDB(tgtDbPath);

        let srcDb = new bsql(srcDbPath, { 
            readonly: true,
            fileMustExist: true
        });

        let basicMap = sample.getBasicMap();
        let refs = sample.getReferences();
        let altKeys = sample.getAlternateKeys();
        let links = sample.getLinks();

        SampleLoader.loadSchema(db, basicMap, refs, links);
        SampleLoader.loadBasic(db, srcDb, basicMap);
        SampleLoader.loadReferences(db, srcDb, refs, basicMap, altKeys);
        SampleLoader.loadLinks(db, srcDb, links, basicMap, altKeys);
    }

    static createDbFromNew(sample:INewSample, tgtDbPath?:string)
    {
        let db = new GraphiteDB(tgtDbPath);

        db.transact(sample.getSchema());
        db.transact(sample.getData());
    }

    private static loadSchema(db:GraphiteDB, basicMap: any, refs: any[], links: any[]) {
        let schema:any = [];
        Object.values(basicMap).forEach(v => {
            Object.values(v).forEach(o => {
                schema.push([o]);
            });
        });

        refs.forEach(o => {
            schema.push([o.attr, ":db.attribute/reference"]);
        });

        links.forEach(o => {
            schema.push([o.attr, ":db.attribute/reference"]);
        })

        let txData = "{:tx-attribute [\n";
        schema.forEach((s: any[]) => {
            txData += "{";
            txData += `:db/identity ${s[0]} `;
            txData += `:db/attribute ${s[1] || ":db.attribute/string"} `;
            txData += `:db/cardinality ${s[2] || ":db.cardinality/one"} `;
            txData += "} \n";
        });
        txData += "]}";
        db.transact(txData);
    }

    private static loadBasic(db:GraphiteDB, sqldb:bsql.Database, map: object) {
        Object.keys(map).forEach(table => {
            console.log(`Loading (basic) ${table}`);
            let attrNames = map[table];
            let data = sqldb.prepare(`SELECT * FROM "${table}"`).all();

            let dataTx = "";
            let i = 0;
            data.forEach(x => {
                dataTx += "{";
                Object.keys(attrNames).forEach(k => {
                    if(x[k] !== null) {
                        if(typeof x[k] == 'string') {
                            let quotedString = x[k].split('\"').join('\\\"');
                            dataTx += `${attrNames[k]} "${quotedString}" `; 
                        } else {
                            dataTx += `${attrNames[k]} "${x[k]}" `;
                        }
                        
                    }
                });
                dataTx += "}";
                i++;
                if(i >= 1000) {
                    db.transact(`{:tx-data [${dataTx}]}`);
                    i = 0;
                    dataTx = "";
                }
            });
    
            db.transact(`{:tx-data [${dataTx}]}`);
        });
    }

    private static loadReferences(db:GraphiteDB, sqldb:bsql.Database, refs: any, basic: any, altKeys: any) {
        refs.forEach((r:any) => {
            console.log(`Loading (refs) "${r.attr}"`);
            // get all the rows needed from the source table
            let sql = `SELECT ${altKeys[r.src.table]},${r.src.column} ` + 
                      `FROM "${r.src.table}"`;
            let txData = sqldb.prepare(sql).all()
                .map(v => {
                    // replace the reference column with an object
                    // from the target table and pulling all the fields
                    // from the alternate key
                    if(v[r.src.column] !== null) {
                        sql = `SELECT ${altKeys[r.tgt.table]} FROM "${r.tgt.table}" ` +
                              `WHERE ${r.tgt.column} = "${v[r.src.column]}"`;
                        v[r.src.column] = sqldb.prepare(sql).get();
                    }
                    return v;
                }).map(v => {
                    // convert to src and tgt candidate key objects 
                    // using the attributes from the new database schema

                    let src:any = {};
                    let tgt:any = {};
                    let root:any = {};

                    altKeys[r.src.table].forEach((sk:any) => {
                        src[basic[r.src.table][sk]] = v[sk];
                    });

                    let tmpTgt = v[r.src.column];
                    if(tmpTgt == null) {
                        tgt = null;
                    } else {
                        altKeys[r.tgt.table].forEach((tk:any) => {
                            tgt[basic[r.tgt.table][tk]] = tmpTgt[tk];
                        });
                    }

                    root.src = src;
                    root.attr = r.attr;
                    root.tgt = tgt;

                    //console.log(root);
                    return root;
                })
                .filter(v => v.tgt != null)
                .map(v => {return SampleLoader.convertToDbSchema(db, v)})
                .map(v => `{:db/e ${v.src} ${v.attr} ${v.tgt}}`)
                .join('');

            db.transact(`{:tx-data [${txData}]}`);
        });
    }

    private static loadLinks(db:GraphiteDB, sqldb:bsql.Database, links: any, basic: any, altKeys: any) {
        links.forEach((l:any) => {
            console.log(`Loading (links) "${l.attr}"`);
            // get all the rows needed from the source table
            let sql = `SELECT ${l.tgts[0].column.src}, ${l.tgts[1].column.src} ` + 
                      `FROM "${l.table}"`;
            let txData = sqldb.prepare(sql).all()
                .map(v => {
                    if(v[l.tgts[0].column.src] !== null) {
                        sql = `SELECT ${altKeys[l.tgts[0].table]} FROM "${l.tgts[0].table}" ` +
                              `WHERE ${l.tgts[0].column.tgt} = "${v[l.tgts[0].column.src]}"`;
                        
                        v[l.tgts[0].column.src] = sqldb.prepare(sql).get();
                    }

                    if(v[l.tgts[1].column.src] !== null) {
                        sql = `SELECT ${altKeys[l.tgts[1].table]} FROM "${l.tgts[1].table}" ` +
                              `WHERE ${l.tgts[1].column.tgt} = "${v[l.tgts[1].column.src]}"`;
                        
                        v[l.tgts[1].column.src] = sqldb.prepare(sql).get();
                    }

                    return v;
                }).map(v => {

                    let src = {};
                    let tgt = {};
                    let root = {};

                    Object.keys(v[l.tgts[0].column.src]).forEach(k => {
                        src[basic[l.tgts[0].table][k]] = v[l.tgts[0].column.src][k];
                    });

                    Object.keys(v[l.tgts[1].column.src]).forEach(k => {
                        tgt[basic[l.tgts[1].table][k]] = v[l.tgts[1].column.src][k];
                    });

                    root['src'] = src;
                    root['tgt'] = tgt;
                    root['attr'] = l.attr;
                    
                    return root;
                })
                .map(v => {return SampleLoader.convertToDbSchema(db, v)})
                .map(v => `{:db/e ${v.src} ${v.attr} ${v.tgt}}`)
                .join('');

            db.transact(`{:tx-data [${txData}]}`);
        });
    }

    private static convertToDbSchema(db:GraphiteDB, v: any) : any {
        let fn = (obj: object) => {
            let where = "";
            Object.keys(obj).forEach(z => {
                if(typeof obj[z] === "string") {
                    let quotedStr = obj[z].split('"').join('\\\"');
                    where += `[?e ${z} "${quotedStr}"]`;
                } else {
                    where += `[?e ${z} "${obj[z]}"]`;
                }
            });
            let result = db.query(`{
                :find [?e]
                :where [${where}]
            }`);
            if(result && result[0] && result[0][0]) {
                return result[0][0];
            }
        }

        v.src = fn(v.src);
        v.tgt = fn(v.tgt);
        
        return v;
    }
}