import IAtom from "./IAtom";

export default interface IAtomStorage
{
    createAtomsTable():void
    insertAtom(atom:IAtom):void
    getMaxTransactionId():number
    getMaxEntityId():number
    getQuery(queryObj:any):any
    getEntityIdFromIdentity(identity: string):number
    getIdentityFromEntityId(entityId: number):string|undefined
    getIdentities():any
    getAtomCount():any
    getAtoms(sort?:string, direction?:string, offset?:number, limit?:number):any
    getEntityCount(entityId:number):number
    cloneFrom(other:IAtomStorage):void;
}