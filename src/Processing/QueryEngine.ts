import * as edn from 'jsedn';

import IAtomStorage from "../Storage/IAtomStorage";

export default class QueryEngine {
    readonly dbOps:IAtomStorage;
    readonly dbNamespace:string

    constructor(dbOps:IAtomStorage, dbNamespace:string) {
        this.dbOps = dbOps;
        this.dbNamespace = dbNamespace;
    }

    public query(_qData: object | string, _dbTx:number|null = null, ...params: any[]) {
        let qData: object;
        let result: object[]|null = null;
        if(typeof _qData === "string") {
            qData = edn.toJS(edn.parse(_qData));
        } else {
            qData = _qData;
        }

        let dbTx:number;
        if(_dbTx == null) {
            dbTx = this.dbOps.getMaxTransactionId();
        } else {
            dbTx = _dbTx;
        }

        let where = qData[':where'];

        if(where && Array.isArray(where)) {
            let positions = ['e', 'a', 'v', 't', 'o'];
            where.forEach((wc:string[]) => {
                let constants = {};
                let variables = {};
                let getVars = (v:any, position:string) => {
                    if(typeof v === 'string') {
                        switch(v.charAt(0)) {
                            case "?": variables[position] = v; break;
                            case "_": break;
                            default: constants[position] = v; break;
                        }
                    } else {
                        constants[position] = v;
                    }
                };
                
                for(let i = 0; i < wc.length; i++) {
                    getVars(wc[i], positions[i]);
                }
                
                this.replaceQueryReferences(constants);
                this.replaceQueryParameters(variables, constants, qData[':in'], params);

                let newResults = this.executeQuery(variables, constants, dbTx);
                result = this.joinResults(result, newResults);
            });
            if(result) {
                result = this.flattenQuery(result, qData[':find']);
            }
        }

        return result;
    }

    private replaceQueryReferences(constants: object) {
        if(constants.hasOwnProperty('a')) {
            constants['a'] = this.dbOps.getEntityIdFromIdentity(constants['a']);
        }
    }

    private replaceQueryParameters(variables: object, constants: object, inParams: any[], params: any[])
    {
        // this modifies variables and constants, but a copy or something more
        // immutable should probably happen
        if(inParams != null && inParams.length > 0 && params != null && params.length == inParams.length) {
            let vKeys = Object.keys(variables);
            vKeys.forEach(k => {
                inParams.forEach((ip, i) => {
                    if(variables[k] == ip) {
                        constants[k] = params[i];
                        delete variables[k];
                    }
                });
            });
        }
    }

    private flattenQuery(q: object[], find: string[]): any[]
    {
        //console.log("find: ", find);
        //console.log("results: ", q);
        //console.log();
        return q.map(o => {
            let f:any = [];
            find.forEach(qv => {
                f.push(o[qv]);
            });
            return f;
        });
    }

    private executeQuery(variables: object, constants: object, dbTx: number): object[] {
        let cons:any = Object.assign({
            ex: 0, e: 0,
            ax: 0, a: 0,
            vx: 0, v: 0,
            tx: 0, t: 0,
            ox: 0, o: 0,
            dbTx: dbTx
        }, constants);
        Object.keys(constants).forEach(c => {
            cons[c + 'x'] = 1;
            if(typeof constants[c] === 'string') {
                let cStr = constants[c];
                if(cStr.indexOf('\"') >= 0) {
                    cStr = cStr.split('\"').join('\"\"');
                }
                cons[c] = `"${cStr}"`
            }
            cons[c] = constants[c];
        });

        let results = this.dbOps.getQuery(cons);
        //console.log("original results: ", results);
        let retractId = this.dbOps.getEntityIdFromIdentity(`${this.dbNamespace}.operation/retract`);
        results = results.filter((v, i, a) => {
            if(v.o === retractId) {
                return false;
            }

            let ret = true;
            for(let j = 0; j < a.length; j++) {
                if(i === j) {
                    continue;
                }
                let o = a[j];
                if(o.o === retractId && v.e === o.e && v.a === o.a && v.t < o.t) {
                    //console.log("filtering out v: ", v);
                    return false;
                }
            }

            return true;
        });
        //console.log("filtered results: ", results);
        results = results.map(o => {
            let mapped = {}
            Object.keys(o).forEach(ok => {
                if(ok === 'a') {
                    mapped[variables[ok]] = this.dbOps.getIdentityFromEntityId(o[ok]);
                } else {
                    mapped[variables[ok]] = o[ok];
                }
            });
            return mapped;
        });
        //console.log("query results: ", results);
        return results;
    }

    private joinResults(previous: object[]|null, current: object[]): object[] {
        //console.log("previous: ", previous);
        //console.log("current: ", current);
        let join: object[];
        if(!previous) {
            return current;
        } else if(Array.isArray(previous) && previous.length == 0) {
            join = previous;
        } else if(Array.isArray(previous)) {
            let tmp:any = [];

            let joinObjects = (a: object, b: object) => {
                let r:any = {};
                let test: any;
                test = Object.keys(a).every(ak => {
                    if(b.hasOwnProperty(ak)) {
                        if(a[ak] === b[ak]) {
                            r[ak] = a[ak];
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        r[ak] = a[ak];
                        return true;
                    }
                });
                if(!test) {
                    return null;
                }
                test = Object.keys(b).every(bk => {
                    if(a.hasOwnProperty(bk)) {
                        if(a[bk] === b[bk]) {
                            r[bk] = a[bk];
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        r[bk] = b[bk];
                        return true;
                    }
                });
                if(!test) {
                    return null;
                }
                return r;
            }

            previous.forEach(p => {
                current.forEach(c => {
                    let j = joinObjects(p, c);
                    if(j) {
                        tmp.push(j);
                    }
                });
            });

            join = tmp;
        } else {
            join = [];
        }

        //console.log("join: ", join);
        return join;
    }
}