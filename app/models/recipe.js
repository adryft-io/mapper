module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class Recipe extends Nodal.Model {}

  Recipe.setDatabase(Nodal.require('db/main.js'));
  Recipe.setSchema(Nodal.my.Schema.models.Recipe);

  return Recipe;

})();
