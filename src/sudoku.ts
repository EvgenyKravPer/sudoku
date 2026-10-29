/**
 * Sudoku Generator & Human-Style Difficulty Grader
 * Ensures every generated board has:
 * 1. A strictly unique solution
 * 2. Symmetric clue placement for visual balance
 * 3. Solvability using Naked Singles & Hidden Singles (no frustrating dead-ends)
 */

export type Grid = number[][]; // 9x9, 0 = empty, 1-9 = value

export type Difficulty = "gentle" | "easy" | "medium";

export interface GeneratedSudoku {
  id: number;
  puzzle: Grid;
  solution: Grid;
  difficulty: Difficulty;
  cluesCount: number;
}

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { minClues: number; maxClues: number; allowHiddenSingles: boolean }
> = {
  // Gentle: Very high clue count (44-48 givens), solvable mostly by direct Naked Singles
  gentle: { minClues: 44, maxClues: 48, allowHiddenSingles: false },
  // Easy: Classic easy (38-42 givens), solvable with Naked & Hidden Singles
  easy: { minClues: 38, maxClues: 42, allowHiddenSingles: true },
  // Medium: Standard medium (33-36 givens), still strictly solvable with Singles (no guessing)
  medium: { minClues: 33, maxClues: 36, allowHiddenSingles: true },
};

export function createEmptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isValidPlacement(
  grid: Grid,
  row: number,
  col: number,
  num: number,
): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num || grid[i][col] === num) {
      return false;
    }
  }
  const boxStartRow = Math.floor(row / 3) * 3;
  const boxStartCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[boxStartRow + r][boxStartCol + c] === num) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Generates a complete, valid 9x9 Sudoku solution.
 */
export function generateSolution(): Grid {
  const grid = createEmptyGrid();

  // Fill the 3 independent diagonal 3x3 boxes first for speed
  for (let box = 0; box < 9; box += 3) {
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        grid[box + r][box + c] = nums[idx++];
      }
    }
  }

  // Solve the rest via randomized backtracking
  fillRemaining(grid, 0, 3);
  return grid;
}

function fillRemaining(grid: Grid, row: number, col: number): boolean {
  if (col >= 9 && row < 8) {
    row += 1;
    col = 0;
  }
  if (row >= 9 && col >= 9) {
    return true;
  }

  // Skip already filled diagonal 3x3 boxes
  if (row < 3) {
    if (col < 3) col = 3;
  } else if (row < 6) {
    if (col === Math.floor(row / 3) * 3) col += 3;
  } else {
    if (col === 6) {
      row += 1;
      col = 0;
      if (row >= 9) return true;
    }
  }

  const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const num of candidates) {
    if (isValidPlacement(grid, row, col, num)) {
      grid[row][col] = num;
      if (fillRemaining(grid, row, col + 1)) {
        return true;
      }
      grid[row][col] = 0;
    }
  }
  return false;
}

/**
 * Counts the number of solutions up to `limit` (usually 2 to check uniqueness).
 */
export function countSolutions(grid: Grid, limit = 2): number {
  let bestRow = -1;
  let bestCol = -1;
  let minCandidates = 8;
  let bestCandidateMask = 0;

  // Find empty cell with Minimum Remaining Values (MRV) for fast solving
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const mask = getCandidateMask(grid, r, c);
        const count = popCount(mask);
        if (count === 0) return 0;
        if (count < minCandidates) {
          minCandidates = count;
          bestRow = r;
          bestCol = c;
          bestCandidateMask = mask;
          if (count === 1) break;
        }
      }
    }
    if (minCandidates === 1) break;
  }

  // No empty cells left -> found 1 valid solution
  if (bestRow === -1) {
    return 1;
  }

  let totalSolutions = 0;
  for (let num = 1; num <= 9; num++) {
    if ((bestCandidateMask & (1 << num)) !== 0) {
      grid[bestRow][bestCol] = num;
      totalSolutions += countSolutions(grid, limit - totalSolutions);
      grid[bestRow][bestCol] = 0;
      if (totalSolutions >= limit) {
        return totalSolutions;
      }
    }
  }

  return totalSolutions;
}

function getCandidateMask(grid: Grid, row: number, col: number): number {
  let used = 0;
  for (let i = 0; i < 9; i++) {
    used |= 1 << grid[row][i];
    used |= 1 << grid[i][col];
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      used |= 1 << grid[boxRow + r][boxCol + c];
    }
  }
  return 0x3fe & ~used; // bits 1..9
}

function popCount(mask: number): number {
  let count = 0;
  let m = mask;
  while (m > 0) {
    m &= m - 1;
    count++;
  }
  return count;
}

function singleBitToNumber(mask: number): number {
  for (let num = 1; num <= 9; num++) {
    if ((mask & (1 << num)) !== 0) return num;
  }
  return 0;
}

/**
 * Checks if the puzzle can be solved purely using human-friendly Singles:
 * - Naked Singles (a cell has only 1 possible candidate)
 * - Hidden Singles (a number can only go in 1 place in a row, column, or 3x3 box)
 */
export function isSolvableBySingles(
  puzzle: Grid,
  allowHiddenSingles: boolean,
): boolean {
  const work = cloneGrid(puzzle);

  while (true) {
    let progress = false;
    let emptyCells = 0;

    const masks: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Step 1: Check Naked Singles
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (work[r][c] === 0) {
          emptyCells++;
          const mask = getCandidateMask(work, r, c);
          if (mask === 0) return false;
          masks[r][c] = mask;
          if (popCount(mask) === 1) {
            work[r][c] = singleBitToNumber(mask);
            progress = true;
          }
        }
      }
    }

    if (emptyCells === 0) return true;
    if (progress) continue;

    if (!allowHiddenSingles) {
      return false;
    }

    // Step 2: Check Hidden Singles in Rows, Columns, and Boxes
    for (let num = 1; num <= 9; num++) {
      const bit = 1 << num;

      // Rows
      for (let r = 0; r < 9; r++) {
        let count = 0;
        let targetCol = -1;
        for (let c = 0; c < 9; c++) {
          if ((masks[r][c] & bit) !== 0) {
            count++;
            targetCol = c;
          }
        }
        if (count === 1 && work[r][targetCol] === 0) {
          work[r][targetCol] = num;
          progress = true;
        }
      }

      // Columns
      for (let c = 0; c < 9; c++) {
        let count = 0;
        let targetRow = -1;
        for (let r = 0; r < 9; r++) {
          if ((masks[r][c] & bit) !== 0) {
            count++;
            targetRow = r;
          }
        }
        if (count === 1 && work[targetRow][c] === 0) {
          work[targetRow][c] = num;
          progress = true;
        }
      }

      // 3x3 Boxes
      for (let br = 0; br < 9; br += 3) {
        for (let bc = 0; bc < 9; bc += 3) {
          let count = 0;
          let tr = -1;
          let tc = -1;
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              if ((masks[br + r][bc + c] & bit) !== 0) {
                count++;
                tr = br + r;
                tc = bc + c;
              }
            }
          }
          if (count === 1 && work[tr][tc] === 0) {
            work[tr][tc] = num;
            progress = true;
          }
        }
      }
    }

    if (!progress) {
      return false;
    }
  }
}

/**
 * Generates a single Sudoku puzzle tailored to the requested difficulty.
 */
export function generateSudoku(
  id: number,
  difficulty: Difficulty,
): GeneratedSudoku {
  const config = DIFFICULTY_CONFIG[difficulty];
  const targetClues =
    Math.floor(Math.random() * (config.maxClues - config.minClues + 1)) +
    config.minClues;

  const solution = generateSolution();
  const puzzle = cloneGrid(solution);

  // Build symmetric cell pairs so the printed board looks visually balanced
  const pairs: Array<[[number, number], [number, number]]> = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (r < 4 || (r === 4 && c <= 4)) {
        pairs.push([
          [r, c],
          [8 - r, 8 - c],
        ]);
      }
    }
  }

  const shuffledPairs = shuffle(pairs);
  let currentClues = 81;

  for (const [[r1, c1], [r2, c2]] of shuffledPairs) {
    if (currentClues <= targetClues) break;

    const isCenter = r1 === r2 && c1 === c2;
    const removalCount = isCenter ? 1 : 2;
    if (currentClues - removalCount < config.minClues) continue;

    const backup1 = puzzle[r1][c1];
    const backup2 = puzzle[r2][c2];

    puzzle[r1][c1] = 0;
    puzzle[r2][c2] = 0;

    // Verify uniqueness and human-friendly solvability
    const copyForCount = cloneGrid(puzzle);
    const unique = countSolutions(copyForCount, 2) === 1;
    const humanSolvable =
      unique && isSolvableBySingles(puzzle, config.allowHiddenSingles);

    if (humanSolvable) {
      currentClues -= removalCount;
    } else {
      // Restore clues if removing them makes the puzzle ambiguous or too hard
      puzzle[r1][c1] = backup1;
      puzzle[r2][c2] = backup2;
    }
  }

  return {
    id,
    puzzle,
    solution,
    difficulty,
    cluesCount: currentClues,
  };
}

/**
 * Generates a batch of N Sudoku puzzles.
 */
export function generateBatch(
  count: number,
  difficulty: Difficulty,
): GeneratedSudoku[] {
  const batch: GeneratedSudoku[] = [];
  for (let i = 1; i <= count; i++) {
    batch.push(generateSudoku(i, difficulty));
  }
  return batch;
}
