
import { RuleStep } from './types';

export const RULES_OF_THUMB: RuleStep[] = [
  // MAKE DRAFT
  { id: 1, title: "Make a working title", category: 'MAKE DRAFT' },
  { id: 2, title: "Introduce the topic and define terminology", category: 'MAKE DRAFT' },
  { id: 3, title: "Emphasize why the topic is important", category: 'MAKE DRAFT' },
  { id: 4, title: "Relate to current knowledge: what's been done", category: 'MAKE DRAFT' },
  { id: 5, title: "Indicate the gap: what needs to be done?", category: 'MAKE DRAFT' },
  { id: 6, title: "Pose research questions", category: 'MAKE DRAFT' },
  { id: 7, title: "Give purpose and objectives", category: 'MAKE DRAFT' },
  { id: 8, title: "List methodological steps", category: 'MAKE DRAFT' },
  { id: 9, title: "Explain theory behind the methodology used", category: 'MAKE DRAFT' },
  { id: 10, title: "Describe experimental set-up", category: 'MAKE DRAFT' },
  { id: 11, title: "Describe object of the study (technical details)", category: 'MAKE DRAFT' },
  { id: 12, title: "Give summary results", category: 'MAKE DRAFT' },
  { id: 13, title: "Compare different results", category: 'MAKE DRAFT' },
  { id: 14, title: "Focus on main discoveries", category: 'MAKE DRAFT' },
  { id: 15, title: "Answer research questions (conclusions)", category: 'MAKE DRAFT' },
  { id: 16, title: "Support and defend answers", category: 'MAKE DRAFT' },
  { id: 17, title: "Explain conflicting results and discrepancies", category: 'MAKE DRAFT' },
  { id: 18, title: "State limitations of the study", category: 'MAKE DRAFT' },
  { id: 19, title: "State importance of findings", category: 'MAKE DRAFT' },
  { id: 20, title: "Establish newness", category: 'MAKE DRAFT' },
  { id: 21, title: "Announce further research", category: 'MAKE DRAFT' },
  { id: 22, title: "Abstract: what was done, found, and conclusions", category: 'MAKE DRAFT' },

  // REVISE
  { id: 23, title: "Is the title clear and reflects findings?", category: 'REVISE' },
  { id: 24, title: "Are key terms clear and familiar?", category: 'REVISE' },
  { id: 25, title: "Are objectives clear and relevant?", category: 'REVISE' },
  { id: 26, title: "Are variables and materials listed and linked?", category: 'REVISE' },
  { id: 27, title: "Are results relevant to the questions?", category: 'REVISE' },
  { id: 28, title: "Check for redundancy in text and figures", category: 'REVISE' },
  { id: 29, title: "Do main conclusions reflect posed questions?", category: 'REVISE' },
  { id: 30, title: "Will findings be acceptable to the community?", category: 'REVISE' },
  { id: 31, title: "Is the text coherent, clear and focused?", category: 'REVISE' },
  { id: 32, title: "Is the abstract readable standalone?", category: 'REVISE' },

  // POLISH
  { id: 33, title: "Are proper tenses and voices used?", category: 'POLISH' },
  { id: 34, title: "Are equations correct and explained?", category: 'POLISH' },
  { id: 35, title: "Are all abbreviations explained?", category: 'POLISH' },
  { id: 36, title: "Reconsider weak/vague words (very, better, etc.)", category: 'POLISH' },
  { id: 37, title: "Are units and techniques recognized (IS)?", category: 'POLISH' },
  { id: 38, title: "Are figures/tables relevant and high quality?", category: 'POLISH' },
  { id: 39, title: "Are all visuals mentioned in the text?", category: 'POLISH' },
  { id: 40, title: "Are all references relevant and accessible?", category: 'POLISH' },
];

export const SYSTEM_INSTRUCTION = `You are a world-class scientific editor and peer reviewer specializing in the "Rules of Thumb for Writing Research Articles" by Hengl and Gould (2002).
Your task is to analyze a scientific manuscript based on the 40 logical steps provided in the rules.

Guidelines for Review:
1. STRUCTURE: Check for 'Moves' in Introduction (Topic, Knowledge, Gap, Objectives) and Discussion (Answers, Support, Explanations, Limitations, Newness, Future).
2. STYLE: Title should be short (7-10 words), catch, and avoid redundancy. Abstract must be standalone. Methodology should use past tense/active voice.
3. GOLDEN RULES: Take the reader's view, tell a story, be yourself, make it simple, concrete, and short. Use strong statements.
4. REJECTION CRITERIA: Identify if the paper risks rejection due to irrelevant topic, lack of newness, disconnected objectives, or unclear argumentation.

Analyze the provided manuscript text against the specific steps requested and return a JSON response matching the StepFeedback interface.
Be critical but constructive. Provide specific text quotes where possible.`;
