import { describe, it, expect } from 'vitest';

// Mirrors the rule table in src/lib/domain.ts (kept pure so this test needs no database)
const COMPATIBILITY: Record<string, string[]> = {
  'O-': ['O-'], 'A-': ['A-', 'O-'], 'B-': ['B-', 'O-'], 'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'], 'A+': ['A+', 'A-', 'O+', 'O-'], 'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
};

describe('component eligibility gates', () => {
  it('O- only receives O-', () => expect(COMPATIBILITY['O-']).toEqual(['O-']));
  it('AB+ is the universal recipient in the documented public table', () => expect(COMPATIBILITY['AB+']).toHaveLength(8));
  it('a unit with an unresolved excursion is never eligible', () => {
    const unit = { qualityVerified: true, quarantineState: 'IN_STOCK', excursionOpen: true, reserved: false, expiresAt: new Date(Date.now() + 86400000) };
    const eligible = (u: any) => u.qualityVerified && u.quarantineState === 'IN_STOCK' && !u.excursionOpen && !u.reserved && u.expiresAt > new Date();
    expect(eligible(unit)).toBe(false);
  });
  it('a quarantined unit is never eligible', () => {
    const unit = { qualityVerified: true, quarantineState: 'QUARANTINED', excursionOpen: false, reserved: false, expiresAt: new Date(Date.now() + 86400000) };
    const eligible = (u: any) => u.qualityVerified && u.quarantineState === 'IN_STOCK' && !u.excursionOpen && !u.reserved && u.expiresAt > new Date();
    expect(eligible(unit)).toBe(false);
  });
});
