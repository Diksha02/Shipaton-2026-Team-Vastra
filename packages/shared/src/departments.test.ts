import { describe, expect, it } from 'vitest';
import { DEPARTMENTS, DEPARTMENT_LABEL, matchesDepartments, type Department } from './enums';

const womens = { department: 'womenswear' as Department };
const mens = { department: 'menswear' as Department };
const kids = { department: 'kids' as Department };
const unisex = { department: 'unisex' as Department };

describe('department filtering', () => {
  it('shows everything when nothing is selected', () => {
    // An empty filter that hid the catalogue would read as a broken app, not as
    // a filter.
    for (const item of [womens, mens, kids, unisex]) {
      expect(matchesDepartments(item, [])).toBe(true);
    }
  });

  it('includes unisex in every department', () => {
    // The classic bug: shop Menswear and every plain white tee disappears
    // because it was catalogued as unisex.
    expect(matchesDepartments(unisex, ['menswear'])).toBe(true);
    expect(matchesDepartments(unisex, ['womenswear'])).toBe(true);
    expect(matchesDepartments(unisex, ['kids'])).toBe(true);
  });

  it('excludes other departments', () => {
    expect(matchesDepartments(womens, ['menswear'])).toBe(false);
    expect(matchesDepartments(kids, ['womenswear'])).toBe(false);
  });

  it('supports shopping several departments at once', () => {
    // Someone buying for themselves and their child is one session, not two.
    const selected: Department[] = ['womenswear', 'kids'];
    expect(matchesDepartments(womens, selected)).toBe(true);
    expect(matchesDepartments(kids, selected)).toBe(true);
    expect(matchesDepartments(mens, selected)).toBe(false);
  });

  it('labels every department', () => {
    for (const department of DEPARTMENTS) {
      expect(DEPARTMENT_LABEL[department]).toBeTruthy();
    }
  });
});
