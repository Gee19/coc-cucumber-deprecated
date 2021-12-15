import { escapeRegExp } from "./util";

const givenWords = escapeRegExp(`Given|GIVEN|given`);
const whenWords = escapeRegExp(`When|WHEN|when`);
const thenWords = escapeRegExp(`Then|THEN|then`);
const andWords = escapeRegExp(`And|AND|and`);
const butWords = escapeRegExp(`But|BUT|but`);
const otherWords = escapeRegExp(`\\*`);
export const allGherkinWords = `${givenWords}|${whenWords}|${thenWords}|${andWords}|${butWords}|${otherWords}`;

const givenWordsArr = givenWords.split("|");
const whenWordsArr = whenWords.split("|");
const thenWordsArr = thenWords.split("|");
const andWordsArr = andWords.split("|");
const butWordsArr = butWords.split("|");

const givenWordsArrLower = givenWords.toLowerCase().split("|");
const whenWordsArrLower = whenWords.toLowerCase().split("|");
const thenWordsArrLower = thenWords.toLowerCase().split("|");
const andWordsArrLower = andWords.toLowerCase().split("|");
const butWordsArrLower = butWords.toLowerCase().split("|");

export enum GherkinType {
  Given,
  When,
  Then,
  And,
  But,
  Other,
}

export const getGherkinType = (word: string): GherkinType => {
  if (!!~givenWordsArr.indexOf(word)) {
    return GherkinType.Given;
  }
  if (!!~whenWordsArr.indexOf(word)) {
    return GherkinType.When;
  }
  if (!!~thenWordsArr.indexOf(word)) {
    return GherkinType.Then;
  }
  if (!!~andWordsArr.indexOf(word)) {
    return GherkinType.And;
  }
  if (!!~butWordsArr.indexOf(word)) {
    return GherkinType.But;
  }
  return GherkinType.Other;
};

export const getGherkinTypeLower = (word: string): GherkinType => {
  const lowerWord = word.toLowerCase();
  if (!!~givenWordsArrLower.indexOf(lowerWord)) {
    return GherkinType.Given;
  }
  if (!!~whenWordsArrLower.indexOf(lowerWord)) {
    return GherkinType.When;
  }
  if (!!~thenWordsArrLower.indexOf(lowerWord)) {
    return GherkinType.Then;
  }
  if (!!~andWordsArrLower.indexOf(lowerWord)) {
    return GherkinType.And;
  }
  if (!!~butWordsArrLower.indexOf(lowerWord)) {
    return GherkinType.But;
  }
  return GherkinType.Other;
};
