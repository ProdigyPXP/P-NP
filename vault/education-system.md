---
domain: education
module_ids: [81687, 96535, 66930, 15678, 35629, 82142, 9439]
line_range: [72911, 202751]
service_ids: []
status: complete
last_updated: 2026-04-13T12:00:00.000Z
---

# Education System

> Primary class `Yr` (EducationService) in Module 81687, lines 165439–165776. Integrated into `ActivePlayer` (Module 96535, lines 72911–74485). Skill utilities in Module 15678 (93466–93542). Analytics handler `ut` in Module 35629 (202719–202751).

## Overview

The education system bridges the game engine and the external Question Interface (QI) library. It manages curriculum/grade assignment, adaptive skill tracking, question delivery (math and ELA/science), answer recording, homework assignment lifecycle, and learning analytics.

## Access Pattern

```js
// Main education service (accessible from anywhere in the game):
const education = _.instance.prodigy.education;

// Education data on the logged-in player:
const edData = _.instance.prodigy.gameContainer.get("3e5-dac1").player.educationData;

// Analytics segment handler (for education tracking):
const eduAnalytics = _.instance.prodigy.gameContainer.get("fa8-1c91").educationData;

// External QI (Question Interface) library — stored in module-scope var `QI`:
// Accessed via education.getEducationSystemAPI()
const api = _.instance.prodigy.education.getEducationSystemAPI();
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `Yr` | `EducationService` | 165439 | Main education facade — question delivery, QI bridge, grade/curriculum init |
| `lt` (in module 96535) | `EducationDataHelper` | 72963 | Static helpers: `updateEducationData`, `processHomework` |
| `x` (in module 66930) | `MathTowerEducation` | 89062 | Math Tower education adapter — skill iteration, question opening |
| `N` (in module 66930) | `EducationHelper` | 89000 | Static: `openQuestion`, `openQuestionAtSkill`, `getSkills`, `isAvailable` |
| `M.g` / `g` (in module 15678) | `SkillUtilities` | 93466 | Static skill helpers: `getSkillById`, `isSkillMastered`, `isSkillLocked`, `getSkillsByGrade`, etc. |
| `ut` (in module 35629) | `EducationSegmentHandler` | 202715 | Segment analytics for class assignments (`handleNewClassAssignment`, `handleClassAssignmentCompleted`, `handleRemovedClassAssignment`) |

## Properties on `EducationService` (`Yr`)

| Property | Type | Default | Modding Notes |
|----------|------|---------|---------------|
| `isQuestionInterfaceOpen` | boolean | `false` | Read-only getter. True when QI is currently displayed |
| `onQuestionAnswered` | `HN0` (Signal) | new Signal | Dispatches `(wasCorrect: bool, answerData: object)` after every answer |
| `onQuestionInterfaceOpened` | `HN0` (Signal) | new Signal | Fires when QI opens |
| `onQuestionInterfaceClosed` | `HN0` (Signal) | new Signal | Fires when QI closes |
| `rankUpArray` | array/null | null | Holds topic badge rank-up data from `topics-ranked-up` QI event |
| `isNew` | boolean | false | Legacy flag |
| `_staticQuestionList` | array | hardcoded list of 10 items | Used only when `shouldShowStaticQuestions` is true (override bypass) |
| `shouldShowStaticQuestions` | getter → boolean | always `false` | Override to force static question delivery (bypass adaptive algorithm) |

## Education Data Object (`educationData` on `ActivePlayer`)

Stored in `player._educationData`. Updated via `lt.updateEducationData(old, new)`.

| Field | Type | Notes |
|-------|------|-------|
| `grade` | number | Player's current grade (for skill selection) |
| `chosenGrade` | number | Grade explicitly chosen by player/teacher |
| `curriculumTreeID` | string/null | ID of selected curriculum (jurisdiction-specific) |
| `homework` | array | List of class assignments; each has `homeworkID`, `skills[]` |
| `skills[].skillID` | number | Math skill identifier |
| `skills[].correct` | number | Correct answers on this skill in the assignment |
| `skills[].incorrect` | number | Incorrect answers |
| `skills[].questions.length` | number | Total questions in the skill assignment |

## Methods on `EducationService` (`Yr`)

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `question(callback, opts)` | 165542 | `(callback, opts?) => void` | Main entry point: opens next adaptive question. Routes to `showMathQuestion` or `showELAQuestion` |
| `showMathQuestion(QI, callback, opts)` | 165485 | `(QI, cb, opts?) => void` | Renders math QI in `#external-content` div. Builds full config object |
| `showELAQuestion(QI, callback)` | 165526 | `(QI, cb) => void` | Opens ELA/Science QI modal |
| `showGameChallenge(skillId, scenarioId, numQ, ...)` | 165732 | `(skillId, scenarioId?, numQ?, ...) => void` | Opens challenge question for specific skill/scenario |
| `answerQuestion(callback, answerData)` | 165573 | `(cb, data) => void` | Called after QI callback. Sends to network, dispatches signals, calls player's `onQuestionAnswered` |
| `initialize(educationData)` | 165634 | `(data) => void` | Called on login/education reload. Routes to `initializeMathQI` or `initializeELAQI` |
| `initializeMathQI(data, QI)` | 165596 | `(data, QI) => void` | Sets up QI event handlers: `assignment-complete`, `grade-complete`, `placement-complete`, etc. |
| `loadAndInitEducationData()` | 165637 | `() => Promise<void>` | Fetches student data from network, calls `player.onEducationLoaded()`, `player.setEducation()`, `player.initEducation()` |
| `getStudentData(userID)` | 165654 | `(userID) => Promise<object>` | Fetches student grade/curriculum from QI or network |
| `getMasteredSkills()` | 165675 | `() => number` | Returns count of mastered skills from QI |
| `getAllTopicBadges()` | 165678 | `() => array` | Returns all topic badge data from QI |
| `getEducationSystemAPI()` | 165767 | `() => EducationSystemAPI \| null` | Returns the QI's `EducationSystemAPI` object (for skill enumeration) |
| `enableLogging() / disableLogging()` | 165726/165729 | `() => void` | Toggle QI verbose logging |
| `isVideoLessonActive()` | 165717 | `() => boolean` | True if QI supports video lessons |
| `createVideoLesson(skillId, opts)` | 165723 | `(skillId, opts) => any \| null` | Creates a video lesson for a skill |
| `finishPlacement(data)` | 165708 | `(data) => void` | Calls network to complete placement test |
| `finishAssignment(data)` | 165713 | `(data) => void` | Calls `st.completeAssignment(assignmentID)` |
| `updateStrandBasedPlacementTest(data)` | 165545 | `(data) => void` | Updates placement test state in network |
| `processAnswerResponses()` | 165672 | `() => void` | Flushes pending answer responses in QI |
| `reduceBGMVolumeBeforeQuestion()` | 165590 | `() => void` | Reduces background music volume during QI |

## Methods on `ActivePlayer` related to Education (Module 96535)

| Method | Line | Purpose |
|--------|------|---------|
| `onEducationLoaded(data)` | 74357 | Merges new education data into `_educationData` via `lt.updateEducationData` |
| `setEducation(grade, curriculumTreeID)` | 74360 | Directly sets `_educationData.chosenGrade`, `grade`, and `curriculumTreeID` |
| `initEducation()` | 74363 | Calls `prodigy.education.initialize()` with a deep clone of `_educationData` |
| `onQuestionAnswered(answerData)` | 73505 | Increments `answerStreak`, fires achievement counter. If type === HOMEWORK, calls `updateAssignmentData` |
| `updateAssignmentData(hwID, skillID, questionID, correct)` | 73508 | Finds matching homework, updates correct/incorrect counts, fires `handleClassAssignmentCompleted` when all questions done |
| `getAnswerStreak()` | 73496 | Returns `answerStreak` (resets to 0 on wrong answer) |

## `SkillUtilities` Static Methods (Module 15678, lines 93466–93542)

| Method | Line | Purpose |
|--------|------|---------|
| `getSkillById(skills, id)` | 93517 | Find a skill by `ID` in an array |
| `isSkillMastered(skill)` | 93526 | `skill.hasBeenMastered` |
| `isSkillLocked(skill)` | 93529 | `skill.lock > 0` |
| `isAvailable(skill)` | 93523 | `skill.isAvailable` |
| `hasMaximumTheta(skill)` | 93532 | `skill.theta === THETA_MAXIMUM` |
| `hasMinimumTheta(skill)` | 93535 | `skill.theta === THETA_MINIMUM` |
| `getSkillsByGrade(skills, grade)` | 93508 | Filter skills by `grade` field |
| `getSkillsMasteredByGrade(skills, grade)` | 93511 | Filter mastered skills by grade, ordered by `dateMastered` |
| `getPendingSkillsByGrade(skills, grade)` | 93514 | Filter non-mastered skills by grade |
| `getCurrentSkillByGrade(skills, grade)` | 93505 | First unlocked, non-mastered skill for a grade |
| `answersToUnlock(skill)` | 93520 | Returns `skill.lock` (answers needed to unlock) |
| `isSkillIdMobileFriendly(id, nonMobileIds)` | 93538 | Checks if skill is mobile-compatible |

## `MathTowerEducation` (Module 66930, lines 89062–89119)

Used by the Math Tower zone to interact with the education system:

| Method | Line | Purpose |
|--------|------|---------|
| `getEducationSystemAPI()` | 89063 | Gets API from `prodigy.education`, notifies tower if algorithm type changed |
| `openQuestionInterface(useNext, skillID, disableLock, callback)` | 89075 | Opens a question — either next in sequence or for specific skill |
| `getNextSkill()` | 89084 | Returns `EducationSystemAPI.getNextAlgorithm().nextSkill` |
| `getSkillById(id)` | 89110 | Wraps SkillUtilities via `getAllAlgorithmSkills()` |
| `getSkills()` | 89093 | Returns all mobile-friendly skills from basic algorithm |
| `getSkillsByGrade(grade)` | 89098 | Skill list filtered by grade |
| `notifyUpdatesIfSkillChanged(old, new)` | 89114 | Fires tower events: SKILL_LOCKED, SKILL_UNLOCKED, SKILL_MASTERED |

## Answer Data Schema

The answer callback and `onQuestionAnswered` signal carry this object:

```js
{
  wasCorrect: boolean,
  respTime: number,          // response time (ms)
  nFactor: number,           // difficulty factor
  awardPrize: boolean,       // whether to award a prize item
  awardInstantWin: boolean,
  isMember: boolean,
  playLocation: string,      // "school" | "home" | "none"
  sessionID: string,         // UUID
  chances: [],
  numQuestions: number,      // remaining questions in sequence
  skillID: number,
  currentTheta: number,      // IRT theta (ability estimate)
  hwID: number,              // homework ID (0 if not homework)
  type: string,              // e.g., "DEFAULT" | "HOMEWORK"
  questionID: number,
  questionType: string | undefined
}
```

## QI Configuration Object (passed to `QI.showQuestion`)

```js
{
  selector: "#external-content",   // DOM mount point
  userID: number,
  callback: Function,              // called with answerData
  classIDs: array,
  volume: number,
  isTeacher: false,
  hideCallback: Function,          // called when QI hides (game hides stage)
  showAnswerBonus: 0 | 1,
  showAnswerBonusAnimation: number,
  showTutorial: boolean,
  canInstantWin: boolean,
  numQuestions: number,
  isUserInBattle: boolean,
  isBattleRevampExperiment: boolean,
  disableLock: boolean,
  sessionUuid: string,
  showTopicBadgeAnimations: boolean,
  showProgressBarOnQuestionComplete: boolean,
  progressBarFrom: number,
  progressBarTo: number
}
```

## Exposable Variables

- `_.instance.prodigy.education.isQuestionInterfaceOpen` — true when QI is visible
- `_.instance.prodigy.education.onQuestionAnswered` — signal to hook for answer events
- `_.instance.prodigy.education.getEducationSystemAPI()` — access IRT adaptive algorithm, skill list, `getNextAlgorithm()`, etc.
- `_.instance.prodigy.gameContainer.get("3e5-dac1").player.educationData` — raw education data (grade, curriculum, homework)
- `_.instance.prodigy.gameContainer.get("3e5-dac1").player.answerStreak` — current answer streak
- `_.instance.prodigy.gameContainer.get("3e5-dac1").player.curriculumTreeID` — active curriculum

## Hook Points

- **`Yr.prototype.answerQuestion`** (line 165573) — fires after every QI submission. Override to intercept answer data, force `wasCorrect = true`, or skip network save.
- **`Yr.prototype.shouldShowStaticQuestions`** (line 165476) — getter returning `false`. Override to return `true` to force the hardcoded `_staticQuestionList` (10 known skill/question pairs) instead of adaptive questions.
- **`Yr.prototype.question`** (line 165542) — entry point for opening any question. Override to skip the question entirely and call the callback with a synthetic correct answer.
- **`Yr.prototype.createEmptyAnswerSchema`** (line 165548) — override to inject default values (e.g. always `wasCorrect: true`).
- **`onQuestionAnswered` signal** — add listener via `.add(fn)` to be notified of every answer without modifying the pipeline.
- **`SkillUtilities.isSkillMastered`** (line 93526) — override to report all skills as mastered.
- **`SkillUtilities.isSkillLocked`** (line 93529) — override to always return `false` (unlock all skills).

## Network Layer for Education

The `NetworkManager` service (`e2e-9e38`) wraps education API calls:

| Network Method | Line | Purpose |
|----------------|------|---------|
| `loadEducation(userID)` | 234805 | Calls `education.getStudentData(userID)` |
| `answerQuestion(data)` | 234763 | Calls `api.saveAnswer(data, cb)` — sends answer to backend |
| `completeAssignment(id)` | 234758 | GraphQL mutation `completeAssignment` |
| `finishPlacement(data)` | 234783 | Calls `api.updatePlacementTest(data)` |
| `updatePlayerGrade(data)` | 234800 | Calls `api.updatePlayerGrade(data)` |
| `getVideoLessonSignedUrls(...)` | 234825 | Fetches signed video URLs |
| `updatePlanStudent(data)` | 234774 | Calls `api.updatePlanStudent(id, currentSkillId, hasFailed)` |
| `updateStrandBasedPlacementTest(data)` | 234777 | Updates strand-based placement test |
| `setCurriculum(data, subject, ...)` | 234788 | Sets curriculum to backend |
| `setInitialGrades(data, ...)` | 234794 | Sets initial grade selection |

## Analytics Events (via `fa8-1c91` service's `educationData` sub-handler)

| Event | When Fired |
|-------|-----------|
| `"Class Assignment Received"` | New homework assigned that hasn't been started |
| `"Class Assignment Completed"` | All questions in assignment answered |
| `"Class Assignment Ended"` | Assignment removed/expired after progress was made |

## Cross-References

- [[player-active-player]] — `ActivePlayer.onQuestionAnswered()`, `educationData` field, `answerStreak`, `setEducation()`, `initEducation()`
- [[network-game-network-manager]] — `e2e-9e38` handles `answerQuestion`, `loadEducation`, `finishPlacement`, `completeAssignment`
- [[core-bootstrap-di-container]] — `prodigy.education` property on `Prodigy` singleton; `fa8-1c91` is the Segment analytics service
- [[battle-system]] — Battle answers flow through `education.onQuestionAnswered`; `LootDash` subscribes to `onQuestionAnswered`
