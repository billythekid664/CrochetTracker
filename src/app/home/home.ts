import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CrochetService } from '../service/crochet.service';
import { UserService } from '../service/user.service';
import { User, UserProject } from '../model/user.model';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Round, Stitch, StitchType } from '../model/round.model';
import { ChangeDetectorRef } from '@angular/core';

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
  // phantomDropListData: any[] = [];

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

  onAddStitch() {
    if (this.stitchForm.valid) {
      const { roundNumber, stitchType, count } = this.stitchForm.value;

      // Find the round by its number
      let round: (Round | undefined) = this.rounds.find(r => r.orderNumber === roundNumber);

      if (!round) {
        // If the round doesn't exist, create a new one
        round = {
          orderNumber: roundNumber,
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

      // Reset the form
      this.stitchForm.reset();
      console.log('Current rounds:', JSON.parse(JSON.stringify(this.rounds)));
    }
  }

  startDragging() {
    console.log('cdk drag start')
    this.isDragging = true;
    this.cdr.detectChanges();
  }

  startMouseDown() {
    console.log('click start')
    this.isDragging = true;
    this.cdr.detectChanges();
  }

  stopDragging() {
    console.log('cdk drag stop')
    this.isDragging = false;
    this.cdr.detectChanges();
  }

  onListDrop(event:any, str: string) {
    console.log('dropped: ', str, event);
  }

//   onRemoveStitch(roundNumber: number, stitchIndex: number): void {
//     const round = this.rounds.find(r => r.orderNumber === roundNumber);

//     if (round) {
//       // Subtract the quantity of the removed stitch from the total stitches
//       round.totalStitches -= round.stitches[stitchIndex].quantity;

//       // Remove the stitch from the round
//       round.stitches.splice(stitchIndex, 1);

//       // If the round has no stitches left, remove the round
//       if (round.stitches.length === 0) {
//         this.rounds = this.rounds.filter(r => r.orderNumber !== roundNumber);
//       }

//       console.log('Updated rounds:', JSON.parse(JSON.stringify(this.rounds)));
//     }
//   }

//   onStitchDrop(event: CdkDragDrop<any[]>) {
//     const flat = this.flatStitchList;
//     const moved = flat[event.previousIndex];

//     // Dropped into phantom row (at the end)
//     if (event.currentIndex === flat.length) {
//       moved.round.stitches.splice(moved.stitchIndex, 1);
//       moved.round.totalStitches -= moved.stitch.quantity;
//       if (moved.round.stitches.length === 0) {
//         this.rounds = this.rounds.filter(r => r !== moved.round);
//       }
//       const maxRound = this.rounds.length > 0 ? Math.max(...this.rounds.map(r => r.orderNumber)) : 0;
//       const newRound: Round = {
//         orderNumber: maxRound + 1,
//         stitches: [moved.stitch],
//         totalStitches: moved.stitch.quantity
//       };
//       this.rounds.push(newRound);

//       this.normalizeRoundNumbers();
//       this.cdr.detectChanges();
//       return;
//     }

//     // Dropped into an existing row (move to another round or position)
//     const target = flat[event.currentIndex];
//     moved.round.stitches.splice(moved.stitchIndex, 1);
//     moved.round.totalStitches -= moved.stitch.quantity;
//     if (moved.round.stitches.length === 0) {
//       this.rounds = this.rounds.filter(r => r !== moved.round);
//     }
//     const insertRound = target.round;
//     let insertIndex = target.stitchIndex;
//     if (moved.round === insertRound && event.currentIndex > event.previousIndex) {
//       insertIndex--;
//     }
//     if (insertIndex < 0) insertIndex = 0;
//     insertRound.stitches.splice(insertIndex, 0, moved.stitch);
//     insertRound.totalStitches += moved.stitch.quantity;

//     this.normalizeRoundNumbers();
//     this.cdr.detectChanges();
//   }

//   onPhantomDrop(event: CdkDragDrop<any[]>) {
//     const flat = this.flatStitchList;
//     const moved = flat[event.previousIndex];

//     // Remove from original round
//     moved.round.stitches.splice(moved.stitchIndex, 1);
//     moved.round.totalStitches -= moved.stitch.quantity;

//     // Remove the round if empty
//     if (moved.round.stitches.length === 0) {
//       this.rounds = this.rounds.filter(r => r !== moved.round);
//     }

//     // Find the highest round number
//     const maxRound = this.rounds.length > 0 ? Math.max(...this.rounds.map(r => r.orderNumber)) : 0;
//     const newRoundNumber = maxRound + 1;

//     // Create new round and add the stitch
//     const newRound: Round = {
//       orderNumber: newRoundNumber,
//       stitches: [moved.stitch],
//       totalStitches: moved.stitch.quantity
//     };
//     this.rounds.push(newRound);

//     this.normalizeRoundNumbers();
//     this.cdr.detectChanges();
//   }

//   onZoneDrop(event: CdkDragDrop<any[]>, roundIdx: number, position: 'above' | 'below' | 'end') {
//   const flat = this.flatStitchList;
//   const moved = flat[event.previousIndex];

//   // Remove from original round
//   moved.round.stitches.splice(moved.stitchIndex, 1);
//   moved.round.totalStitches -= moved.stitch.quantity;
//   if (moved.round.stitches.length === 0) {
//     this.rounds = this.rounds.filter(r => r !== moved.round);
//   }

//   // Insert new round at the correct position
//   let insertIdx = roundIdx;
//   if (position === 'below') insertIdx++;
//   if (position === 'end') insertIdx = this.rounds.length;

//   const newRound: Round = {
//     orderNumber: 0, // will be normalized
//     stitches: [moved.stitch],
//     totalStitches: moved.stitch.quantity
//   };
//   this.rounds.splice(insertIdx, 0, newRound);

//   this.normalizeRoundNumbers();
//   this.cdr.detectChanges();
// }

//   get flatStitchList() {
//     const list: {
//       round: Round,
//       stitch: Stitch,
//       stitchIndex: number,
//       isFirstInRound: boolean
//     }[] = [];
//     // Sort rounds by orderNumber before flattening
//     this.rounds
//       .slice() // create a shallow copy to avoid mutating the original array
//       .sort((a, b) => a.orderNumber - b.orderNumber)
//       .forEach(round => {
//         round.stitches.forEach((stitch, i) => {
//           list.push({
//             round,
//             stitch,
//             stitchIndex: i,
//             isFirstInRound: i === 0
//           });
//         });
//       });
//     return list;
//   }

//   get dropZoneIds(): string[] {
//     return this.rounds.map((_, idx) => `dropZone-${idx}`);
//   }

//   get allDropZoneIds(): string[] {
//     const ids: string[] = [];
//     for (let i = 0; i < this.rounds.length; i++) {
//       ids.push(`dropZone-${i}-above`);
//       ids.push(`dropZone-${i}-below`);
//     }
//     ids.push('dropZone-end');
//     return ids;
//   }

//   trackByStitch(index: number, item: any) {
//     return item.round.orderNumber + '-' + item.stitchIndex;
//   }

//   onDragStarted() {
//     this.isDragging = true;
//   }

//   onDragEnded() {
//     this.isDragging = false;
//   }

//   onDragHandleDown() {
//     if (!this.isDragging) {
//       this.isDragging = true;
//       this.cdr.detectChanges();
//     }
//   }

//   private normalizeRoundNumbers() {
//     this.rounds
//       .sort((a, b) => a.orderNumber - b.orderNumber)
//       .forEach((round, idx) => {
//         round.orderNumber = idx + 1;
//       });
//   }

//   getStitchesForRound(roundOrderNumber: number) {
//     return this.flatStitchList.filter(i => i.round.orderNumber === roundOrderNumber);
//   }
}
