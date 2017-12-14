// /** @jsx h */
import './style/lex.scss';
import { h, render } from 'preact';
import EventEmitter from 'wolfy87-eventemitter';
import { StateTransitionError, NoStateAssistantTypeError, NoStateBuilderTypeError } from './lib/errors';
import { StateTemplate } from './lib/state';
import { StateBuilderFactory } from './lib/state-builder-factory';
import { SearchBar } from './components/search-bar';
import { Option as OptionStateOption, OptionSelection as OptionState } from './lib/states/generic/option-selection';
import { TextRelationSelection as TextRelationState } from './lib/states/text/text-relation-selection';
import { NumericRelationSelection as NumericRelationState } from './lib/states/numeric/numeric-relation-selection';
import { TextEntry as TextEntryState } from './lib/states/text/text-entry';
import { NumericEntry as NumericEntryState } from './lib/states/numeric/numeric-entry';
import { OptionSelector } from './components/builders/generic/option-selector';
import { OptionAssistant } from './components/assistants/generic/option-assistant';

const sLanguage = Symbol('language');
const sBuilders = Symbol('builders');

/**
 * Lex - A micro-framework for building search bars.
 *
 * @param {StateTemplate} language - The root state of the search language this bar will support.
 * @example
 * // Instantiate a new instance of lex and bind it to the page.
 * const lex = new Lex(language);
 * lex.render(document.getElementById('lex-container'));
 * @example
 * // Override default builder/assistant associations
 * const lex = new Lex(language);
 * lex.registerBuilder(OptionState, MyCustomOptionSelector);
 */
class Lex extends EventEmitter {
  constructor (language) {
    super();
    // TODO throw if language is not instanceof StateTemplate
    this[sLanguage] = language;
    this[sBuilders] = new StateBuilderFactory();
    this[sBuilders].registerBuilder(OptionState, OptionSelector)
      .registerBuilder(TextRelationState, OptionSelector)
      .registerBuilder(TextEntryState, OptionSelector)
      .registerBuilder(NumericRelationState, OptionSelector)
      .registerBuilder(NumericEntryState, OptionSelector)
      .registerAssistant(OptionState, OptionAssistant)
      .registerAssistant(TextRelationState, OptionAssistant)
      .registerAssistant(NumericRelationState, OptionAssistant);
  }

  /**
   * Register a new component as the "builder" for a certain `StateTemplate` type.
   *
   * @param {StateTemplate} templateClass - A class extending `StateTemplate`.
   * @param {Component} builderClass - A class extending `Component`, which can supply values to a `State` created from the `StateTemplate`.
   * @returns {Lex} A reference to `this` for chaining.
   */
  registerBuilder (templateClass, builderClass) {
    this[sBuilders].registerBuilder(templateClass, builderClass);
    return this;
  }

  /**
   * Register a new component as the "assistant" for a certain `StateTemplate` type.
   *
   * @param {StateTemplate} templateClass - A class extending `StateTemplate`.
   * @param {Component} assistantClass - A class extending `Component`, which can supply values to a `State` created from the `StateTemplate`.
   * @returns {Lex} A reference to `this` for chaining.
   */
  registerAssistant (templateClass, assistantClass) {
    this[sBuilders].registerAssistant(templateClass, assistantClass);
    return this;
  }

  /**
   * Renders this instance of Lex to the DOM at a particular node.
   *
   * @param {HTMLElement} domNode - The target node.
   */
  render (domNode) {
    while (domNode.firstChild) {
      domNode.removeChild(domNode.firstChild);
    }
    render((
      <SearchBar
        builders={this[sBuilders]}
        machineTemplate={this[sLanguage]}
        onSubmit={(...args) => this.emit('submit', ...args)}
      />
    ), domNode);
  }
}

export {
  Lex,
  // errors
  StateTransitionError,
  NoStateAssistantTypeError,
  NoStateBuilderTypeError,
  // base classes
  StateTemplate,
  // states
  OptionState,
  OptionStateOption,
  TextRelationState,
  NumericRelationState,
  TextEntryState,
  NumericEntryState,
  // UI components
  OptionSelector,
  OptionAssistant
};