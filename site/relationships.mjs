// Reading-edition annotations, drawn from the linked texts. This small trial
// presents connections without assigning the resources to exclusive groups.
export const synthesis = 'skills/stances/interpretive-synthesis/SKILL.md';

export const relationships = [
  {
    source: synthesis,
    target: 'skills/stances/diagnostic-questioning/SKILL.md',
    outward: 'An answer can change which question is worth asking.',
    inward: 'A later answer can change what an earlier one meant.',
  },
  {
    source: synthesis,
    target: 'skills/stances/gap-reading/SKILL.md',
    outward: 'Return to details your interpretation has left out.',
    inward: 'A recovered detail may change your understanding of the whole.',
  },
  {
    source: synthesis,
    target: 'skills/workflows/architectural-distillation/SKILL.md',
    outward: 'Reshape the architecture around what the work has taught us.',
    inward: 'Develop an account of what the system has learned, then test it against the details.',
  },
];
