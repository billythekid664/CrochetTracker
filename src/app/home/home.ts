import { CommonModule } from '@angular/common';
import { Component, inject, OnChanges, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrochetService } from '../service/crochet.service';
import { UserService } from '../service/user.service';
import { User, UserProject } from '../model/user.model';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Round, Section, Stitch, StitchType, STITCH_TYPES, getStitchMetadata } from '../model/section.model';
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
  private modalService = inject(NgbModal);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  newProjectName?: string;
  firstLoad = true;
  loading = false;
  userSignedIn: boolean = false;
  stitchForm: FormGroup;
  sectionForm: FormGroup;
  sections: Section[] = [
    {
      sectionNumber: 1,
      name: 'Body',
      rounds: []
    }
  ];
  selectedSectionNumber: number = 1;
  isDragging = false;
  isEditing = false;
  isEditingSections = false;
  isEditingRounds = false;
  debounceTimer: any;

  emptyRound: Round = {} as Round;

  selectedSection?: Section;

  // Add stitchTypes property
  stitchTypes = STITCH_TYPES;

  constructor() {
    this.stitchForm = this.fb.group({
      roundNumber: [null, Validators.required],
      stitchType: ['', Validators.required],
      count: [null, Validators.required]
    });
    this.sectionForm = this.fb.group({
      sectionName: ['', Validators.required]
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
    // Pre-populate round number only, leave stitch type at default empty selection
    this.stitchForm.patchValue({
      stitchType: '' // Start with empty selection
    });

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' });
  }

  // Add helper method for getting stitch display name
  getStitchDisplayName(type: StitchType): string {
    const metadata = getStitchMetadata(type);
    return metadata.displayName;
  }

  // Update onAddStitch to consider stitch count
  onAddStitch() {
    if (this.stitchForm.valid && this.selectedSection) {
      const { roundNumber, stitchType, count } = this.stitchForm.value;
      const stitchMetadata = getStitchMetadata(stitchType as StitchType);

      // Find existing round or create new one
      let existingRound = this.selectedSection.rounds.find(r => r.roundNumber === roundNumber);

      if (existingRound) {
        // Add stitch to existing round
        const newStitch: Stitch = {
          type: stitchType as StitchType,
          quantity: count
        };

        existingRound.stitches.push(newStitch);
        // Calculate base total considering stitch count
        const baseTotal = existingRound.stitches.reduce((sum, stitch) => {
          const metadata = getStitchMetadata(stitch.type);
          return sum + (stitch.quantity * metadata.stitchCount);
        }, 0);
        // Apply repeat count to total
        existingRound.totalStitches = baseTotal * (existingRound.repeatCount || 1);

        // Consolidate same type stitches in the round
        for (let i = 0; i < existingRound.stitches.length - 1; i++) {
          if (existingRound.stitches[i].type === existingRound.stitches[i + 1].type) {
            existingRound.stitches[i].quantity += existingRound.stitches[i + 1].quantity;
            existingRound.stitches.splice(i + 1, 1);
            i--; // Recheck current index after splice
          }
        }
      } else {
        // Create new round if it doesn't exist
        const newRound: Round = {
          roundNumber: roundNumber,
          stitches: [{
            type: stitchType as StitchType,
            quantity: count
          }],
          totalStitches: count * stitchMetadata.stitchCount,
          repeatCount: 1
        };

        if (!this.selectedSection.rounds) {
          this.selectedSection.rounds = [];
        }
        this.selectedSection.rounds.push(newRound);

        // Sort rounds by round number
        this.selectedSection.rounds.sort((a, b) => a.roundNumber - b.roundNumber);
      }

      // Reset form with empty stitch type selection
      this.stitchForm.reset({
        roundNumber: null,
        stitchType: '', // Reset to empty selection
        count: null
      });

      this.modalService.dismissAll();
      this.cdr.detectChanges();
    }
  }

  drop(event: CdkDragDrop<Round>, roundIdx: number, section: Section) {
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
    this.isDragging = true;
    this.cdr.detectChanges();
  }

  stopDragging() {
    this.isDragging = false;
    this.cdr.detectChanges();
  }

  openAddSectionModal(content: any) {
    this.sectionForm.reset({
      sectionName: `Section ${this.sections.length + 1}`
    });
    this.modalService.open(content, { centered: true });
  }

  onAddSection() {
    if (this.sectionForm.valid) {
      const newSectionNumber = this.sections.length + 1;
      const newSection: Section = {
        sectionNumber: newSectionNumber,
        name: this.sectionForm.value.sectionName,
        rounds: []
      };

      this.sections.push(newSection);
      this.modalService.dismissAll();
      this.cdr.detectChanges();
    }
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
    if (this.selectedSectionNumber === section.sectionNumber || this.sections.length <= 1) {
      this.selectSection(this.sections.length > 0 ? this.sections[0].sectionNumber : 1);
    }
    this.cdr.detectChanges();
  }

  selectSection(newSectionNumber: number, skipClick = false) {
    if (!!this.debounceTimer) { return; }
    this.selectedSectionNumber = !!newSectionNumber ? newSectionNumber : 1;
    this.cdr.detectChanges();

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
    }, 150);

    document.getElementById(`tab-${newSectionNumber}`)?.click();

  }

  private updateTotalStitches(round: Round) {
    const baseTotal = round.stitches.reduce((sum, stitch) => {
      const metadata = getStitchMetadata(stitch.type);
      return sum + (stitch.quantity * metadata.stitchCount);
    }, 0);
    round.totalStitches = baseTotal * (round.repeatCount || 1);
  }

  incrementRepeat(round: Round) {
    const prevRepeatCount = round.repeatCount || 1;
    round.repeatCount = prevRepeatCount + 1;
    this.updateTotalStitches(round);
    this.cdr.detectChanges();
  }

  decrementRepeat(round: Round) {
    if (!round.repeatCount || round.repeatCount <= 1) {
      return;
    }
    round.repeatCount--;
    this.updateTotalStitches(round);
    this.cdr.detectChanges();
  }

  incrementSectionRepeat(section: Section) {
    if (!section.repeatCount) {
      section.repeatCount = 1;
    }
    section.repeatCount++;
    this.cdr.detectChanges();
  }

  decrementSectionRepeat(section: Section) {
    if (!section.repeatCount || section.repeatCount <= 1) {
      return;
    }
    section.repeatCount--;
    this.cdr.detectChanges();
  }
}
