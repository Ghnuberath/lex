import { StateTemplate } from '../../state';

const _key = new WeakMap();
const _shortKey = new WeakMap();
const _meta = new WeakMap();
const _hidden = new WeakMap();

/**
 * An option within a list of options
 *
 * @param {string} key - A label for this option. Should be unique within the list of options.
 * @param {any} meta - Whatever you want.
 * @param {object} config - Additional configuration for this `OptionStateOption`.
 * @param {boolean} config.hidden - If true, this `OptionStateOption` will never be suggested to the user.
 * @param {string|undefined} config.shortKey - A shorter representation of `key` displayed in read-only mode. Optional.
 */
export class OptionStateOption {
  constructor (key, meta, config = {}) {
    _key.set(this, key);
    _meta.set(this, meta);
    _shortKey.set(this, config.shortKey);
    _hidden.set(this, config.hidden && true);
  }

  /**
   * @returns {string} The label for this option.
   */
  get key () { return _key.get(this); }

  /**
   * @returns {string} The abbreviated label for this option.
   */
  get shortKey () { return _shortKey.get(this); }

  /**
   * @returns {boolean} Whether or not this option should be hidden from suggestions.
   */
  get hidden () { return _hidden.get(this); }

  /**
   * @returns {any} The metadata associated with this option.
   */
  get meta () { return _meta.get(this); }
}

const _initialOptions = new WeakMap();
const _options = new WeakMap();
const _refreshOptions = new WeakMap();
const _allowUnknown = new WeakMap();
const _units = new WeakMap();
const _suggestionLimit = new WeakMap();
const _suggestionCache = new WeakMap();

/**
 * A state representing the selection of an option from a list of options.
 * Intended to facilitate both simple cases (such as selecting from a list
 * of predefined options) and advanced ones (such as selecting from a list
 * of dynamically updating suggestions).
 *
 * By default, this state (and any extending classes) can be visually represented by `OptionBuilder` and `OptionAssistant`.
 *
 * This class is an `EventEmitter` and exposes the following events (in addition to `State`'s events):
 * - `on('options changed', (newOptions, oldOptions) => {})` when the internal list of options changes.
 *
 * @param {Object} config - A configuration object. Inherits all options from `StateTemplate`, and adds the following:
 * @param {Option[] | AsyncFunction} config.options - The list of options to select from, or an `async` function that generates them. If a function is supplied, it will execute in the scope of this `OptionState`, allowing access to its instance methods.
 * @param {boolean | undefined} config.allowUnknown - Allow user to enter unknown options by entering custom values. Defaults to false.
 * @param {number | undefined} config.suggestionLimit - A limit on the number of options that will be shown at one time. Defaults to 10.
 * @param {string} config.units - A textual label which represents "units" for the option state (will display to the right of the builder)
 */
export class OptionState extends StateTemplate {
  constructor (config) {
    if (config.validate === undefined) {
      config.validate = (thisVal) => {
        if (thisVal === null || thisVal === undefined) return false;
        if (this.allowUnknown) return true;
        return this.options.filter(o => o.key === thisVal.key).length === 1;
      };
    }
    if (config.options === undefined) config.options = [];
    if (config.allowUnknown === undefined) config.allowUnknown = false;
    if (config.suggestionLimit === undefined) config.suggestionLimit = 10;
    super(config);

    _options.set(this, []);
    if (Array.isArray(config.options)) {
      _initialOptions.set(this, config.options);
      _refreshOptions.set(this, (hint = '') => {
        this.options = _initialOptions.get(this).filter(o => o.key.toLowerCase().indexOf(hint) === 0);
      });
    } else {
      _refreshOptions.set(this, async (hint = '', context = []) => {
        try {
          this.options = await config.options.call(this, hint, context);
        } catch (err) {
          console.error('Could not refresh list of options.');
          throw err;
        }
      });
    }
    _units.set(this, config.units);
    _allowUnknown.set(this, config.allowUnknown);
    _suggestionLimit.set(this, config.suggestionLimit);
  }

  /**
   * Getter for `options`.
   *
   * @returns {Array[Option]} - The list of options to select from.
   */
  get options () {
    return _options.get(this);
  }

  /**
   * Setter for `options`.
   *
   * @param {Option[]} newOptions - A new set of options for this selector.
   */
  set options (newOptions) {
    if (this.options !== newOptions) {
      const oldOptions = this.options;
      _options.set(this, newOptions);
      // only emit change event if the options actually changed
      let changed = oldOptions.length !== newOptions.length;
      for (let i = 0; !changed && i < oldOptions.length; i++) {
        changed = oldOptions[i].key !== newOptions[i].key;
      }
      if (changed) this.emit('options changed', newOptions, oldOptions);
    }
  }

  /**
   * @returns {boolean} - Whether or not this option selector allows the creation of unknown options.
   */
  get allowUnknown () {
    return _allowUnknown.get(this);
  }

  /**
   * @returns {number} - The limit on the number of options to display.
   */
  get suggestionLimit () {
    return _suggestionLimit.get(this);
  }

  /**
   * @returns {string | undefined} - Any specified label for "units" for this state.
   */
  get units () {
    return _units.get(this);
  }

  /**
   * Transform a user-supplied value into a `key`. Override in a subclass if the
   * `displayKey`s should be different from `key`s.
   *
   * @param {string} displayKey - What the user actually types/sees.
   * @returns {string} The key of an `OptionStateOption` within this `State`.
   */
  unformatUnboxedValue (displayKey) {
    return displayKey;
  }

  /**
   * Transform a `key` of an `OptionStateOption` within this `State` into a
   * `displayKey` - what a user would actually see or type. Override in a subclass if the
   * `displayKey`s should be different from `key`s.
   *
   * @param {string} key - The key of an `OptionStateOption` within this `State`.
   * @returns {string} What the user actually types/sees.
   */
  formatUnboxedValue (key) {
    return key;
  }

  /**
   * Transform a key into an internal representation, where a key is the transformation of a user-supplied
   * value by unformatUnboxedValue.
   *
   * @param {string} key - The user-supplied value.
   * @returns {OptionStateOption} An `OptionStateOption` instance.
   */
  boxValue (key) {
    const matches = this.options.filter(o => o.key.toLowerCase() === String(key).toLowerCase());
    if (matches.length > 0) {
      return matches[0];
    } else if (this.allowUnknown) {
      return new OptionStateOption(key, {});
    } else {
      return null;
    }
  }

  /**
   * Transforms an internal representation of a value into a user-supplied-style value.
   *
   * @param {OptionStateOption} option - An `OptionStateOption` instance.
   * @returns {string} - The string value of the `OptionStateOption`'s key.
   */
  unboxValue (option) {
    if (option === undefined || option === null) return null;
    return option.key;
  }

  /**
   * Perform any asynchronous operations required to initialize this `State`.
   *
   * @param {any[]} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   * @returns {Promise} A `Promise` which resolves when initialize completes successfully, rejecting otherwise.
   */
  async initialize (context = []) {
    await super.initialize();
    await this.refreshOptions(this.unformatUnboxedValue(''), context);
  }

  reset () {
    super.reset();
    _suggestionCache.delete(this);
  }

  /**
   * Can be called by a child class to trigger a refresh of options based on a hint (what the
   * user has typed so far). Will trigger the `async` function supplied to the constructor as `config.options`.
   *
   * @param {string | undefined} hint - What the user has typed, if anything, converted to a key by unformatUnboxedValue.
   * @param {any[]} context - The current boxed value of the containing `TokenStateMachine` (all `State`s up to and including this one).
   * @returns {Promise} Resolves with the new list of options.
   */
  async refreshOptions (hint = '', context = []) {
    if (_refreshOptions.has(this)) {
      if (!_suggestionCache.has(this) || _suggestionCache.get(this).hint !== hint || _suggestionCache.get(this).contextLength !== context.length) {
        _suggestionCache.set(this, {
          hint: hint,
          contextLength: context.length,
          options: await _refreshOptions.get(this)(hint, context)
        });
      }
      return _suggestionCache.get(this);
    }
  }
}
