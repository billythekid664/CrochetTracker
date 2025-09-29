import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { traceUntilFirst } from '@angular/fire/performance';
import { Auth, authState, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut, UserCredential } from '@angular/fire/auth';
import { FirestoreService } from './firestore.service';
import { User, UserProject } from '../model/user.model';

export const USERS_DB = {
    USERS: 'users',
    USER_PROJECTS: 'userProjects'
  };

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private auth = inject(Auth);
  private firestore = inject(FirestoreService);
  private user!: User;
  private crochetProjects!: UserProject[];
  private currentCrochetProject?: UserProject;

  addUser(user: User): Promise<string> {
    return this.firestore.setDocData(user, USERS_DB.USERS, user.uid);
  }

  fetchUser(userId: string): Observable<User> {
    return this.firestore.getDocData(USERS_DB.USERS, userId).pipe(
      tap(user => {
        this.user = user;
      })
    );
  }

  fetchUserCrochetProjects(userId: string): Observable<UserProject[]> {
    return this.firestore.getCollectionData(USERS_DB.USERS, userId, USERS_DB.USER_PROJECTS).pipe(
      tap(crochetProjects => {
        console.log('userProjects: ', crochetProjects);
        this.crochetProjects = crochetProjects;
        if (!this.getCurrentCrochetProject()) {
          this.setCurrentCrochetProject(crochetProjects[0]);
        }
      })
    );
  }

  createUser(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  getCurrentUserData(): User {
    return this.user;
  }

  getCurrentUserCrochetProjects(): UserProject[] {
    return this.crochetProjects;
  }

  getCurrentCrochetProject(): UserProject | undefined {
    return this.currentCrochetProject;
  }

  setCurrentCrochetProject(crochetProject: UserProject | undefined): void {
    this.currentCrochetProject = crochetProject;
  }

  checkAuth(): Observable<any> {
    return authState(this.auth).pipe(
      traceUntilFirst('auth'),
    );
  }

  signUserIn(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  signUserInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account"
  })
    return signInWithPopup(this.auth, provider);
  }

  signUserOut(): Promise<void> {
    return signOut(this.auth).then(() => {
      console.log('User signed out');
    }, err => console.error('error signing out', err));
  }
}
