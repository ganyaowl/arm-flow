export type Role = 'ADMIN' | 'COACH' | 'STUDENT';

export type UserMe = {
  id: string;
  email: string;
  name: string;
  role: Role;
  coachId: string | null;
  blocked?: boolean;
};

export type WeightUnit = 'KG' | 'BLOCKS';

export type ExerciseStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type Exercise = {
  id: string;
  workoutId: string;
  title: string;
  description: string;
  sets: number;
  reps: number;
  weight: number;
  weightUnit: WeightUnit;
  videoUrl: string | null;
  mediaPath: string | null;
  status: ExerciseStatus;
  completedSets: boolean[];
  sortOrder: number;
};

export type Workout = {
  id: string;
  studentId: string;
  startAt: string;
  title: string;
  exercises: Exercise[];
};

export type StudentRow = {
  id: string;
  email: string;
  name: string;
  blocked: boolean;
  createdAt: string;
};
