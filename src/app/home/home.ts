import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrochetService } from '../service/crochet.service';
import { UserService } from '../service/user.service';
import { User, UserProject } from '../model/user.model';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Round, Stitch, StitchType } from '../model/round.model';
import { ChangeDetectorRef } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModule, DragDropModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  private crochetService = inject(CrochetService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  newProjectName?: string;
  // userProjects?: UserProject[];
  // selectedProject?: UserProject;
  firstLoad = true;
  loading = false;
  userSignedIn: boolean = false;
  stitchForm: FormGroup;
  rounds: Round[] = [];
  isDragging = false;
  before = false;
  after = false;

  constructor() {
    this.stitchForm = this.fb.group({
      roundNumber: [null, [Validators.required, Validators.min(1)]],
      stitchType: ['', Validators.required],
      count: [null, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.userService.checkAuth().subscribe((user: any) => {
      if (user) {
        this.userSignedIn = true;
        this.userService.fetchUser(user.uid).subscribe((user: User) => {});
        this.userService.fetchUserCrochetProjects(user.uid).subscribe((crochetList: any) => {
          // this.userProjects = this.userService.getCurrentUserCrochetProjects();
          if (this.firstLoad) {
            this.changeSelectedProject(this.userService.getCurrentCrochetProject());
            this.firstLoad = false;
          }
        });
      }
    });
  }

  changeSelectedProject(project: UserProject | undefined) {
    this.userService.setCurrentCrochetProject(project);
  }

  createNewProject() {
    console.log('create new project');
    this.crochetService.createCrochetProject(this.newProjectName!).then(id => {
      this.changeSelectedProject(this.userService.getCurrentUserCrochetProjects().find(project => project.projectUid === id));
    });
  }

  get userProjects() {
    return this.userService.getCurrentUserCrochetProjects();
  }

  get selectedProject() {
    return this.userService.getCurrentCrochetProject();
  }

  get flatRounds() {
    return this.rounds.flatMap(round =>
      round.stitches.map((stitch, idx) => ({
        orderNumber: round.roundNumber,
        stitchType: stitch.type,
        quantity: stitch.quantity,
        totalStitches: round.totalStitches,
        roundSpan: round.stitches.length,
        isFirst: idx === 0
      }))
    );
  }

  onAddStitch() {
    if (this.stitchForm.valid) {
      const { roundNumber, stitchType, count } = this.stitchForm.value;

      // Find the round by its number
      let round: (Round | undefined) = this.rounds.find(r => r.roundNumber === roundNumber);

      if (!round) {
        // If the round doesn't exist, create a new one
        round = {
          roundNumber: roundNumber,
          stitches: [],
          totalStitches: 0
        };
        this.rounds.push(round);
      }

      // Add the new stitch to the round
      round.stitches.push({
        type: stitchType as StitchType,
        quantity: count
      });

      // Update the total stitch count for the round
      round.totalStitches += count;

      this.consolidateStitchesInRound(roundNumber - 1);

      // Reset the form
      this.stitchForm.reset();
      this.cdr.detectChanges();
      console.log('Current rounds:', JSON.parse(JSON.stringify(this.rounds)));
    }
  }

  onDeleteStitch(roundIdx: number, stitchIdx: number) {
    const stitch = this.rounds[roundIdx].stitches[stitchIdx];
    this.rounds[roundIdx].stitches.splice(stitchIdx, 1);
    this.rounds[roundIdx].totalStitches -= stitch.quantity;
    this.updateAndConsolidateRounds();
    
    this.cdr.detectChanges();
  }

  drop(event: CdkDragDrop<Round>, roundIdx: number) {
    console.log(`Drag drop event ${roundIdx}:`, event);

    if (event.container === event.previousContainer && event.currentIndex === event.previousIndex) {
      return;
    }

    if (event.container === event.previousContainer) {
      const draggedStitch = this.rounds[roundIdx].stitches[event.previousIndex];
      this.rounds[roundIdx].stitches.splice(event.previousIndex, 1);
      this.rounds[roundIdx].stitches.splice(event.currentIndex, 0, draggedStitch);
    } else {
      const prevRoundIdx = event.previousContainer.data.roundNumber - 1;
      const draggedStitch = this.rounds[prevRoundIdx].stitches[event.previousIndex];
      this.rounds[prevRoundIdx].stitches.splice(event.previousIndex, 1);
      this.rounds[roundIdx].stitches.splice(event.currentIndex, 0, draggedStitch);
      // Update total stitches for both rounds
      this.rounds[prevRoundIdx].totalStitches -= draggedStitch.quantity;
      this.rounds[roundIdx].totalStitches += draggedStitch.quantity;
    }

    // Update round numbers and consolidate stitches
    this.updateAndConsolidateRounds();

    this.isDragging = false;

    this.cdr.detectChanges();
  }

  dropOutside(event: CdkDragDrop<Round>, isBefore: boolean) {
    console.log(`Drag drop outside event (isBefore: ${isBefore}):`, event);
    const draggedStitch =  event.previousContainer.data.stitches[event.previousIndex];
    let newRound: Round = {
        roundNumber: 1,
        stitches: [draggedStitch],
        totalStitches: draggedStitch.quantity
    };

    this.rounds[event.previousContainer.data.roundNumber - 1].stitches.splice(event.previousIndex, 1);
    this.rounds[event.previousContainer.data.roundNumber - 1].totalStitches -= draggedStitch.quantity;

    if (isBefore) {
      this.rounds.unshift(newRound);
    } else {
      newRound.roundNumber = this.rounds.length + 1,
      this.rounds.push(newRound);
    }

    // Update round numbers and consolidate stitches
    this.updateAndConsolidateRounds();

    this.isDragging = false;

    this.cdr.detectChanges();
  }

  consolidateStitchesInRound(roundIdx: number) {
    let stitches = this.rounds[roundIdx]?.stitches;
    if (!stitches) return;
    for (let i = 0; i < stitches.length; i++) {
      if (i < stitches.length - 1 && stitches[i+1].type === stitches[i].type) {
        stitches[i].quantity += stitches[i+1].quantity;
        stitches.splice(i+1, 1);
        i--; // Adjust index after merge
      }
    }
  }

  updateAndConsolidateRounds() {
    for (let i = 0; i < this.rounds.length; i++) {
      if (this.rounds[i].stitches.length == 0) {
        this.rounds.splice(i, 1);
        i--; // Adjust index after removal
      }
    }

    // Update round numbers and consolidate stitches
    this.rounds.forEach((round, idx) => {
      round.roundNumber = idx + 1
      this.consolidateStitchesInRound(idx);
    });
  }

  startDragging() {
    console.log('start dragging');
    this.isDragging = true;
    this.cdr.detectChanges();
  }

  stopDragging() {
    console.log('stop dragging');
    this.isDragging = false;
    this.cdr.detectChanges();
  }

}
