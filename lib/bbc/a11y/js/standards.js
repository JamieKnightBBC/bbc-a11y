var xpath = require('./xpath');

function Standards(standards, skipped) {
  this.standards = standards;
  this.skipped = skipped;
}

Standards.sections = {

  focusableControls: [
    require('./standards/focusableControls/anchorsMustHaveHrefs')
  ],

  formInteractions: [
    require('./standards/formInteractions/formsMustHaveSubmitButtons')
  ],

  formLabels: [
    require('./standards/formLabels/fieldsMustHaveLabelsOrTitles')
  ],

  headings: [
    require('./standards/headings/contentMustFollowHeadings'),
    require('./standards/headings/exactlyOneMainHeading'),
    require('./standards/headings/headingsMustBeInAscendingOrder')
  ],

  imageAlternatives: [
    require('./standards/imageAlternatives/imagesMustHaveAltAttributes'),
  ],

  indicatingLanguage: [
    require('./standards/indicatingLanguage/htmlMustHaveLangAttribute')
  ],

  mainLandmark: [
    require('./standards/mainLandmark/exactlyOneMainLandmark')
  ],

  minimumTextSize: [
    require('./standards/minimumTextSize/minimumTextSize')
  ],

  tabIndex: [
    require('./standards/tabIndex/elementsWithZeroTabIndexMustBeFields')
  ],

  titleAttributes: [
    require('./standards/titleAttributes/titleAttributesOnlyOnInputs')
  ]

}

Standards.all = [];

for (var section in Standards.sections) {
  var sectionStandards = Standards.sections[section];
  for (var i = 0; i < sectionStandards.length; ++i) {
    sectionStandards[i].section = section;
    Standards.all.push(sectionStandards[i]);
  }
}

Standards.json = function() {
  var standards = [];
  for (var section in Standards.sections) {
    for (var i = 0; i < Standards.sections[section].length; ++i) {
      var standard = Standards.sections[section][i];
      standards.push({
        name: 'BBCA11y.' + section + '.' + camelise(standard.name),
        description: standard.name
      })
    }
  }
  return JSON.stringify({
    name: 'BBC.A11y',
    rules: standards
  }, null, 2);
}

function camelise(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return "";
    return index == 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

Standards.prototype.validate = function(jquery) {
  var results = [];
  var standardResult;
  function fail() {
    standardResult.errors.push(xpath.replaceElementsWithXPaths(arguments));
  }
  for (var i = 0; i < this.standards.length; ++i) {
    standard = this.standards[i];
    standardResult = {
      standard: {
        section: this.standards[i].section,
        name: this.standards[i].name
      },
      errors: []
    };
    standard.validate(jquery, fail);
    results.push(standardResult);
  }
  return { results: results, skipped: this.skipped };
}

Standards.matching = function(criteria) {
  if (typeof(criteria) == 'undefined') {
    return Standards.matching({});
  }
  if (typeof(criteria) == 'string') {
    return Standards.matching({ only: criteria });
  }
  var matching = standardsMatching(criteria);
  return new Standards(matching.matches, matching.skipped);
}

function standardsMatching(criteria) {
  var skips = criteria.skip || [];
  for (var i = 0; i < skips.length; ++i) {
    skips[i] = normalise(skips[i]);
  }
  var isOnly = typeof(criteria.only) == 'string';
  var only = isOnly ? normalise(criteria.only) : null;
  var matches = [];
  var skipped = [];
  for (var i = 0; i < Standards.all.length; ++i) {
    var standard = Standards.all[i];
    var name = normalise(standard.name);
    if (isOnly) {
      if (only == name) {
        matches.push(standard);
      } else {
        skipped.push(standard.name);
      }
    } else if (skips.indexOf(name) == -1) {
      matches.push(standard);
    } else {
      skipped.push(standard.name);
    }
  }
  return { matches: matches, skipped: skipped };
}

function normalise(name) {
  return name.replace(/\s+/g, '').toLowerCase();
}

module.exports = Standards;
