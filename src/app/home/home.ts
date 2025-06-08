import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Project } from '../model/project.model';
import { CrochetService } from '../service/crochet.service';
import { UserService } from '../service/user.service';
import { User, UserProject } from '../model/user.model';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  private crochetService = inject(CrochetService);
  private userService = inject(UserService);

  newProjectName?: string;
  userProjects?: UserProject[];
  selectedProject?: UserProject;
  firstLoad = true;
  loading = false;
  userSignedIn: boolean = false;

  constructor() {}

  ngOnInit(): void {
    this.userService.checkAuth().subscribe((user: any) => {
      if (user) {
        this.userSignedIn = true;
        this.userService.fetchUser(user.uid).subscribe((user: User) => {});
        this.userService.fetchUserCrochetProjects(user.uid).subscribe((gameLists: any) => {
          this.userProjects = this.userService.getCurrentUserCrochetProjects();
          if (this.firstLoad) {
            this.changeSelectedProject(this.userProjects?.[0]);
            this.firstLoad = false;
          }
        });
      }
    });
  }

  changeSelectedProject(project: UserProject | undefined) {
    this.selectedProject = project;
  }

  createNewProject() {
    console.log('create new project');
    this.crochetService.createCrochetProject(this.newProjectName!).then(id => {
      this.userProjects = this.userService.getCurrentUserCrochetProjects();
      this.changeSelectedProject(this.userProjects.find(project => project.projectUid === id));
    });
  }
}
