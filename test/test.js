import { Lex, OptionState, OptionStateOption, TextRelationState, NumericRelationState, TextEntryState, NumericEntryState } from '../src/lex';

// TODO make chainable using some kind of awesome Builder class
const language = new OptionState({
  name: 'Choose a field to search',
  options: function () {
    return new Promise((resolve) => {
      resolve([
        new OptionStateOption('Name', {type: 'string'}),
        new OptionStateOption('Income', {type: 'number'})
      ]);
    });
  }
});
language.addChild(TextRelationState, {
  transitionFunction: (parentVal) => parentVal && parentVal.meta.type === 'string'
}).addChild(TextEntryState);
language.addChild(NumericRelationState, {
  transitionFunction: (parentVal) => parentVal && parentVal.meta.type === 'number'
}).addChild(NumericEntryState);

const lex = new Lex(language);

lex.render(document.getElementById('LexContainer'));