import { CommonModule } from '@angular/common';
import { Component, inject, OnChanges, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrochetService } from '../service/crochet.service';
import { UserService } from '../service/user.service';
import { User, UserProject } from '../model/user.model';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Round, Section, Stitch, StitchType } from '../model/section.model';
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
  firstLoad = true;
  loading = false;
  userSignedIn: boolean = false;
  stitchForm: FormGroup;
  sections: Section[] = [
    {
      sectionNumber: 1,
      name: 'Body',
      rounds: []
    }
  ];
  selectedSectionNumber: number = 1;
  rounds: Round[] = [];
  isDragging = false;
  isEditing = false;
  isEditingSections = false;
  isEditingRounds = false;
  debounceTimer: any;

  emptyRound: Round = {
    roundNumber: 0,
    stitches: [],
    totalStitches: 0,
    repeatCount: 1
  };

  selectedSection?: Section;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
  ) {
    this.stitchForm = this.formBuilder.group({
      roundNumber: ['', Validators.required],
      stitchType: ['', Validators.required],
      count: ['', Validators.required]
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

  openAddRoundModal(section: Section, content: any) {
    this.selectedSection = section;
    // Pre-populate round number based on existing rounds
    const nextRoundNumber = (section.rounds?.length || 0) + 1;
    this.stitchForm.patchValue({
      roundNumber: nextRoundNumber
    });

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' });
  }

  onAddStitch() {
    if (this.stitchForm.valid && this.selectedSection) {
      const { roundNumber, stitchType, count } = this.stitchForm.value;

      // Create the new round
      const newRound: Round = {
        roundNumber: roundNumber,
        stitches: [{
          type: stitchType as StitchType,
          quantity: count
        }],
        totalStitches: count,
        repeatCount: 1
      };

      // Add to selected section's rounds
      if (!this.selectedSection.rounds) {
        this.selectedSection.rounds = [];
      }
      this.selectedSection.rounds.push(newRound);

      // Reset form and close modal
      this.stitchForm.reset();
      this.modalService.dismissAll();
      this.cdr.detectChanges();
    }
  }

  drop(event: CdkDragDrop<Round>, roundIdx: number, section: Section) {
    console.log(`Drag drop event ${roundIdx}:`, event);

    if (event.container === event.previousContainer && event.currentIndex === event.previousIndex) {
      this.isDragging = false;
      this.cdr.detectChanges();
      return;
    }

    if (event.container === event.previousContainer) {
      const draggedStitch = section.rounds[roundIdx].stitches[event.previousIndex];
      section.rounds[roundIdx].stitches.splice(event.previousIndex, 1);
      section.rounds[roundIdx].stitches.splice(event.currentIndex, 0, draggedStitch);
    } else {
      const prevRoundIdx = event.previousContainer.data.roundNumber - 1;
      const draggedStitch = section.rounds[prevRoundIdx].stitches[event.previousIndex];
      section.rounds[prevRoundIdx].stitches.splice(event.previousIndex, 1);
      section.rounds[roundIdx].stitches.splice(event.currentIndex, 0, draggedStitch);
      // Update total stitches for both rounds
      section.rounds[prevRoundIdx].totalStitches -= draggedStitch.quantity;
      section.rounds[roundIdx].totalStitches += draggedStitch.quantity;
    }

    this.updateAndConsolidateRounds(section);
    this.isDragging = false;
    this.cdr.detectChanges();
  }

  dropOutside(event: CdkDragDrop<Round>, isBefore: boolean, section: Section) {
    if (!section.rounds) {
      section.rounds = [];
    }

    const previousRound = event.previousContainer.data;
    const draggedStitch = previousRound.stitches[event.previousIndex];

    // Remove stitch from previous round
    const sourceRoundIndex = section.rounds.findIndex(r => r.roundNumber === previousRound.roundNumber);
    section.rounds[sourceRoundIndex].stitches.splice(event.previousIndex, 1);
    section.rounds[sourceRoundIndex].totalStitches -= draggedStitch.quantity;

    // Create new round
    const newRound: Round = {
      roundNumber: isBefore ? 1 : section.rounds.length + 1,
      stitches: [draggedStitch],
      totalStitches: draggedStitch.quantity,
      repeatCount: 1
    };

    // Add new round
    if (isBefore) {
      section.rounds.unshift(newRound);
    } else {
      section.rounds.push(newRound);
    }

    this.updateAndConsolidateRounds(section);
    this.isDragging = false;
    this.cdr.detectChanges();
  }

  onDeleteStitch(roundIdx: number, stitchIdx: number, section: Section) {
    const stitch = section.rounds[roundIdx].stitches[stitchIdx];
    section.rounds[roundIdx].stitches.splice(stitchIdx, 1);
    section.rounds[roundIdx].totalStitches -= stitch.quantity;
    this.updateAndConsolidateRounds(section);

    if (section.rounds.length === 0) {
      this.isEditing = false;
    }

    this.cdr.detectChanges();
  }

  private updateAndConsolidateRounds(section: Section) {
    section.rounds = section.rounds.filter(round => round.stitches.length > 0);

    // Update round numbers and consolidate stitches
    section.rounds.forEach((round, idx) => {
      round.roundNumber = idx + 1;
      this.consolidateStitchesInRound(idx, section);
    });
  }

  private consolidateStitchesInRound(roundIdx: number, section: Section) {
    let stitches = section.rounds[roundIdx]?.stitches;
    if (!stitches) return;

    for (let i = 0; i < stitches.length; i++) {
      if (i < stitches.length - 1 && stitches[i+1].type === stitches[i].type) {
        stitches[i].quantity += stitches[i+1].quantity;
        stitches.splice(i+1, 1);
        i--; // Adjust index after merge
      }
    }
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

  addSection() {
    console.log('add section');
    const newSectionNumber = this.sections.length + 1;
    this.sections.push({
      sectionNumber: newSectionNumber,
      name: `Section ${newSectionNumber}`,
      rounds: []
    });

    this.cdr.detectChanges();

    this.selectSection(newSectionNumber);

    document.getElementById(`tab-end`)?.classList.remove('active');
  }

  deleteSection(section: Section) {
    // Filter out the section to delete
    this.sections = this.sections.filter(sec => sec.sectionNumber !== section.sectionNumber);

    // Reorder remaining sections' numbers
    let newSectionNumber;
    this.sections.forEach((section, index) => {
      if (section.sectionNumber === this.selectedSectionNumber) {
        newSectionNumber = index + 1;
      }
      section.sectionNumber = index + 1;
    });

    if (newSectionNumber) {
      this.selectSection(newSectionNumber);
    }

    // If we deleted the currently selected section, select the first available section
    console.log('deleted section number: ', section.sectionNumber, ' current selected section number: ', this.selectedSectionNumber);
    if (this.selectedSectionNumber === section.sectionNumber || this.sections.length <= 1) {
      this.selectSection(this.sections.length > 0 ? this.sections[0].sectionNumber : 1);
    }
    console.log('deleted section number: ', section.sectionNumber, ' current selected section number: ', this.selectedSectionNumber);
    console.log('sections after deletion: ', this.sections);
    this.cdr.detectChanges();
  }

  selectSection(newSectionNumber: number, skipClick = false) {
    if (!!this.debounceTimer) { return; }
    console.log('select section: ', newSectionNumber);
    this.selectedSectionNumber = !!newSectionNumber ? newSectionNumber : 1;
    this.cdr.detectChanges();

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
    }, 150);

    document.getElementById(`tab-${newSectionNumber}`)?.click();

  }
}
