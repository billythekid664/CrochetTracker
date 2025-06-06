import { inject, Injectable } from '@angular/core';
import { collection, collectionData, collectionGroup, deleteDoc, doc, docData, Firestore, query, QueryFieldFilterConstraint, setDoc, updateDoc } from '@angular/fire/firestore';
import { debounceTime, Observable, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);

  constructor() { }

  getDocData(...pathSegments: string[]): Observable<any> {
    return docData(doc(this.firestore, pathSegments.shift()!, ...pathSegments));
  }

  getCollectionData(...pathSegments: string[]): Observable<any> {
    return collectionData(collection(this.firestore, pathSegments.shift()!, ...pathSegments));
  }

  setDocData(data: any, ...pathSegments: string[]): Promise<string> {
    let ref;
    if (pathSegments.length === 1) {
      ref = doc(collection(this.firestore, pathSegments[0]));
    } else {
      ref = doc(this.firestore, pathSegments.shift()!, ...pathSegments);
    }
    return setDoc(ref, data).then(() => {
      return ref.id;
    });
  }

  updateDocData(data: any, ...pathSegments: string[]): Promise<string> {
    let ref = doc(this.firestore, pathSegments.shift()!, ...pathSegments);
    return updateDoc(ref, data).then(() => {
      return ref.id;
    });
  }

  createSubDocData(data: any, ...pathSegments: string[]) {
    let docRef = doc(this.firestore, pathSegments.shift()!, ...pathSegments);
    return setDoc(docRef, data).then(() => {
      return docRef.id;
    });
  }

  queryCollectionGroupData(groupName: string, groupQuery: QueryFieldFilterConstraint): Promise<any> {
    let collectionGroupRef = collectionGroup(this.firestore, groupName);
    return firstValueFrom(collectionData(query(collectionGroupRef, groupQuery)).pipe(
      debounceTime(200),
    ));
  }

  queryCollectionData(collectionName: string, collectionQuery: QueryFieldFilterConstraint): Promise<any> {
    let collectionGroupRef = collection(this.firestore, collectionName);
    return firstValueFrom(collectionData(query(collectionGroupRef, collectionQuery)).pipe(
      debounceTime(200),
    ));
  }

  deleteDocument(...pathSegments: string[]): Promise<string> {
    let docRef = doc(this.firestore, pathSegments.shift()!,...pathSegments);
    return deleteDoc(docRef).then(() => {
      return docRef.id;
    });
  }
}
