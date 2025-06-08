import { inject, Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { USERS_DB, UserService } from './user.service';
import { Project } from '../model/project.model';
import { User, UserProject } from '../model/user.model';
import { Round } from '../model/round.model';
import { arrayRemove, arrayUnion, where } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';

export const DATALIST_DB = {
  PROJECTS: 'projects'
}

@Injectable({
  providedIn: 'root'
})
export class CrochetService {
  private firestore = inject(FirestoreService);
  private userService = inject(UserService);

  constructor() { }

  createCrochetProject(projectName: string): Promise<string> {
    return this.firestore.setDocData({
      name: projectName,
      ownerUid: this.userService.getCurrentUserData().uid
    }, DATALIST_DB.PROJECTS).then(id => {
      return this.createUserCrochetProject(projectName, id);
    });
  }

  addRoundToProject(projectUid: string, round: Round): Promise<String> {
    return this.firestore.updateDocData({
      rounds: arrayUnion(round)
    }, DATALIST_DB.PROJECTS, projectUid)
  }

  removeRoundFromProject(projectUid: string, round: Round): Promise<String> {
    return this.firestore.updateDocData({
      rounds: arrayRemove(round)
    }, DATALIST_DB.PROJECTS, projectUid);
  }

  createUserCrochetProject(projectName: string, projectId: string): Promise<string> {
    return this.createSpecifiedUserCrochetProject({
      projectUid: projectId,
      projectName: projectName
    }, this.userService.getCurrentUserData());
  }

  createSpecifiedUserCrochetProject(userProject: UserProject, user: User): Promise<string> {
    let data = {
      projectName: userProject.projectName,
      projectUid: userProject.projectUid,
      userUid: user.uid,
      ownerUid: userProject.ownderUid ? userProject.ownderUid : user.uid
    }
    return this.firestore.createSubDocData(data, USERS_DB.USERS, user.uid, USERS_DB.CROCHET_PROJECTS, userProject.projectUid);
  }

  fetchProject(projectUid: string): Promise<Project> {
    return firstValueFrom(this.firestore.getDocData(DATALIST_DB.PROJECTS, projectUid));
  }

  fetchUsersWithProject(projectUid: string): Promise<UserProject[]> {
    return this.firestore.queryCollectionGroupData(USERS_DB.CROCHET_PROJECTS, where('id', '==', projectUid));
  }

  deleteProjectAndReferences(projectId: string): Promise<string> {
    return this.firestore.deleteDocument(DATALIST_DB.PROJECTS, projectId).then(id => {
      return this.fetchUsersWithProject(projectId).then(dataArray => {
        dataArray.forEach(userProject => {
          this.firestore.deleteDocument(USERS_DB.USERS, userProject.userUid!, USERS_DB.CROCHET_PROJECTS, projectId);
        });
        return id;
      });
    })
  }

  shareProject(userProject: UserProject, email: string): Promise<string> {
    return this.firestore.queryCollectionData(USERS_DB.USERS, where('email', '==', email)).then((users: any) => {
      if (users.length === 0) {
        console.log(`No user found with email: ${email}`);
        return '';
      }
      return this.createSpecifiedUserCrochetProject(userProject, users[0]);
    })
  }

  renameProject(userProject: UserProject, newProjectName: string): Promise<string> {
    return this.firestore.updateDocData({
      projectName: newProjectName
    }, DATALIST_DB.PROJECTS, userProject.projectUid).then(id => {
      this.fetchUsersWithProject(userProject.projectUid).then(dataArray => {
        dataArray.forEach(userProject => {
          this.firestore.updateDocData({
            projectName: newProjectName
          }, USERS_DB.USERS, userProject.userUid!, USERS_DB.CROCHET_PROJECTS, id);
        });
      });
      return id;
    })
  }

}
