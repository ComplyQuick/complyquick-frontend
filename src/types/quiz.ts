export interface MCQ {
  question: string;
  choices: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: string;
  hint: string;
}
