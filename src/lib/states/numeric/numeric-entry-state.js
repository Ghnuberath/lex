import {OptionState} from '../generic/option-state';

/**
 * This state supports the entry of a Number value, with possible auto-complete
 *
 * @param {Object} config - A configuration object. Supports all of the parameters from `OptionState` and `StateTemplate`,
 *                          providing defaults for `name`, `validate` (valid iff `!isNaN`) and `allowUnknown` (true).
 */
export class NumericEntryState extends OptionState {
  constructor (config) {
    if (config.name === undefined) config.name = 'Enter a value';
    if (config.validate === undefined) {
      config.validate = (val) => {
        return !isNaN(val.key);
      };
    }
    config.allowUnknown = true;
    super(config);
  }
}
