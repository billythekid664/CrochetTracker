import { TestBed } from '@angular/core/testing';

import { CrochetService } from './crochet.service';

describe('CrochetService', () => {
  let service: CrochetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CrochetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
